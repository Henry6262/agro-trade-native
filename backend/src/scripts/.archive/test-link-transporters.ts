import axios from 'axios';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api';

async function testLinkTransporters() {
  console.log('🚀 Testing Transporter Linking to Companies\n');

  try {
    // Step 1: Create some test transporters if they don't exist
    console.log('📝 Step 1: Creating test transporters...');
    
    const transporterEmails = [
      'transporter1@test.com',
      'transporter2@test.com',
      'transporter3@test.com',
    ];

    const hashedPassword = await bcrypt.hash('test123', 10);
    
    for (const email of transporterEmails) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: `Test Transporter ${email.split('@')[0]}`,
            phoneNumber: `+35988${Math.floor(Math.random() * 9000000 + 1000000)}`,
            role: UserRole.TRANSPORTER,
            isEmailVerified: true,
            onboardingCompleted: true,
          },
        });
        console.log(`  ✅ Created transporter: ${email}`);
      } else {
        console.log(`  ℹ️  Transporter already exists: ${email}`);
      }
    }

    // Step 2: Get or create a test company
    console.log('\n📝 Step 2: Getting test company...');
    
    let testCompany = await prisma.transportCompany.findFirst({
      where: { companyName: { contains: 'Test Transport' } },
    });

    let adminToken: string;

    if (!testCompany) {
      console.log('  Creating new test company...');
      
      const registerResponse = await axios.post(
        `${API_URL}/transport-company/register`,
        {
          companyName: 'Test Transport Solutions Ltd',
          registrationNumber: `BG${Date.now()}`,
          vatNumber: `BG${Date.now().toString().slice(0, 10)}`,
          mainEmail: 'info@testtransport.com',
          mainPhone: '+359888123456',
          operatingRegions: ['Sofia', 'Plovdiv'],
          specializations: ['Grains', 'Refrigerated Goods'],
          adminName: 'Admin User',
          adminEmail: `admin${Date.now()}@testtransport.com`,
          adminPassword: 'SecurePass123!',
          adminPhone: '+359888654321',
        },
      );

      testCompany = await prisma.transportCompany.findUnique({
        where: { id: registerResponse.data.data.companyId },
      });

      // Login as admin
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: registerResponse.data.data.adminEmail,
        password: 'SecurePass123!',
      });
      adminToken = loginResponse.data.access_token;
    } else {
      console.log(`  Found existing company: ${testCompany.companyName}`);
      
      // Get admin user
      const admin = await prisma.companyAdmin.findFirst({
        where: { transportCompanyId: testCompany.id },
        include: { user: true },
      });

      if (!admin) {
        throw new Error('No admin found for test company');
      }

      // Login as admin
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: admin.user.email,
        password: 'SecurePass123!', // Assuming we know the password
      });
      adminToken = loginResponse.data.access_token;
    }

    if (!testCompany) {
      throw new Error('Failed to create or find test company');
    }

    console.log(`  ✅ Using company: ${testCompany.companyName}`);

    // Step 3: Search for available transporters
    console.log('\n📝 Step 3: Searching for available transporters...');
    
    const searchResponse = await axios.get(
      `${API_URL}/transport-company/transporters/available`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    console.log(`  ✅ Found ${searchResponse.data.total} available transporters`);

    // Step 4: Link transporters to company
    console.log('\n📝 Step 4: Linking transporters to company...');
    
    const transportersToLink = await prisma.user.findMany({
      where: {
        role: UserRole.TRANSPORTER,
        email: { in: transporterEmails },
      },
    });

    for (const transporter of transportersToLink) {
      try {
        const linkResponse = await axios.post(
          `${API_URL}/transport-company/${testCompany.id}/transporters/link`,
          {
            transporterId: transporter.id,
            canSubmitBids: true,
            canManageTrucks: true,
          },
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          },
        );

        if (linkResponse.data.success) {
          console.log(`  ✅ Linked transporter: ${transporter.email}`);
        } else {
          console.log(`  ⚠️  Failed to link: ${transporter.email} - ${linkResponse.data.message}`);
        }
      } catch (error: any) {
        console.log(`  ❌ Error linking ${transporter.email}:`, error.response?.data?.message || error.message);
      }
    }

    // Step 5: Get company transporters
    console.log('\n📝 Step 5: Getting company transporters...');
    
    const companyTransportersResponse = await axios.get(
      `${API_URL}/transport-company/${testCompany.id}/transporters`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    console.log(`  ✅ Company has ${companyTransportersResponse.data.length} transporters`);
    
    for (const driver of companyTransportersResponse.data) {
      console.log(`    - ${driver.firstName} ${driver.lastName} (${driver.email})`);
      console.log(`      Status: ${driver.status}, Available: ${driver.isAvailable}`);
    }

    // Step 6: Test unlinking a transporter
    console.log('\n📝 Step 6: Testing transporter unlinking...');
    
    if (transportersToLink.length > 0) {
      const transporterToUnlink = transportersToLink[0];
      
      const unlinkResponse = await axios.delete(
        `${API_URL}/transport-company/${testCompany.id}/transporters/unlink`,
        {
          data: { transporterId: transporterToUnlink.id },
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      if (unlinkResponse.data.success) {
        console.log(`  ✅ Unlinked transporter: ${transporterToUnlink.email}`);
      }
    }

    // Step 7: Test inviting a new transporter
    console.log('\n📝 Step 7: Testing transporter invitation...');
    
    const inviteResponse = await axios.post(
      `${API_URL}/transport-company/${testCompany.id}/transporters/invite`,
      {
        email: `new.driver${Date.now()}@example.com`,
        firstName: 'New',
        lastName: 'Driver',
        phoneNumber: '+359888777666',
        licenseNumber: `DL${Date.now()}`,
        licenseClass: ['C', 'C+E'],
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    if (inviteResponse.data.success) {
      console.log(`  ✅ Invitation sent: ${inviteResponse.data.message}`);
    }

    // Step 8: Get company stats
    console.log('\n📝 Step 8: Getting company statistics...');
    
    const statsResponse = await axios.get(
      `${API_URL}/transport-company/stats/${testCompany.id}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    console.log('  ✅ Company Statistics:');
    console.log(`    - Drivers: ${statsResponse.data.drivers}`);
    console.log(`    - Trucks: ${statsResponse.data.trucks}`);
    console.log(`    - Active Bids: ${statsResponse.data.activeBids}`);
    console.log(`    - Active Jobs: ${statsResponse.data.activeJobs}`);
    console.log(`    - Completed Jobs: ${statsResponse.data.completedJobs}`);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Created test transporters');
    console.log('- Linked transporters to company');
    console.log('- Retrieved company transporters');
    console.log('- Tested unlinking functionality');
    console.log('- Tested invitation system');
    console.log('- Retrieved company statistics');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testLinkTransporters();