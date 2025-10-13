import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api';

async function testCompanyRegistration() {
  console.log('🚀 Testing Transport Company Registration Flow\n');

  try {
    // Clean up any existing test data
    console.log('🧹 Cleaning up existing test data...');
    await prisma.transportCompany.deleteMany({
      where: { companyName: { contains: 'Test Transport' } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'admin@testtransport' } },
    });

    // Test 1: Register a new transport company
    console.log('\n📝 Test 1: Registering new transport company...');
    const registrationData = {
      // Company Details
      companyName: 'Test Transport Solutions Ltd',
      registrationNumber: 'BG123456789',
      vatNumber: 'BG1234567890',
      
      // Contact Information
      mainEmail: 'info@testtransport.com',
      mainPhone: '+359888123456',
      website: 'https://testtransport.com',
      
      // Operating Information
      operatingRegions: ['Sofia', 'Plovdiv', 'Varna', 'Burgas'],
      specializations: ['Grains', 'Refrigerated Goods', 'Bulk Transport'],
      
      // Admin Account
      adminName: 'John Smith',
      adminEmail: 'admin@testtransport.com',
      adminPassword: 'SecurePass123!',
      adminPhone: '+359888654321',
    };

    const registerResponse = await axios.post(
      `${API_URL}/transport-company/register`,
      registrationData,
    );

    console.log('✅ Company registered successfully!');
    console.log('Response:', JSON.stringify(registerResponse.data, null, 2));

    const companyId = registerResponse.data.data.companyId;

    // Test 2: Try to register with duplicate details (should fail)
    console.log('\n📝 Test 2: Testing duplicate registration prevention...');
    try {
      await axios.post(`${API_URL}/transport-company/register`, {
        ...registrationData,
        adminEmail: 'different@email.com', // Different admin email
      });
      console.log('❌ Should have failed with duplicate company details');
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log('✅ Correctly prevented duplicate registration');
      } else {
        throw error;
      }
    }

    // Test 3: Admin login with new account
    console.log('\n📝 Test 3: Testing admin login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@testtransport.com',
      password: 'SecurePass123!',
    });

    console.log('✅ Admin logged in successfully!');
    const adminToken = loginResponse.data.access_token;

    // Test 4: Get company profile
    console.log('\n📝 Test 4: Getting company profile...');
    const profileResponse = await axios.get(
      `${API_URL}/transport-company/profile/${companyId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    console.log('✅ Company profile retrieved:');
    console.log('- Company Name:', profileResponse.data.companyName);
    console.log('- Is Verified:', profileResponse.data.isVerified);
    console.log('- Operating Regions:', profileResponse.data.operatingRegions);
    console.log('- Fleet Size:', profileResponse.data._count?.trucks || 0);
    console.log('- Drivers:', profileResponse.data._count?.drivers || 0);

    // Test 5: Get my company (as admin)
    console.log('\n📝 Test 5: Getting my company as admin...');
    const myCompanyResponse = await axios.get(
      `${API_URL}/transport-company/my-company`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    console.log('✅ My company retrieved:', myCompanyResponse.data.success);

    // Test 6: Admin verification (need admin account)
    console.log('\n📝 Test 6: Testing admin verification flow...');
    
    // First, create an admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (adminUser) {
      // Login as admin
      const adminLoginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: adminUser.email,
        password: 'admin123', // Assuming default password
      });

      if (adminLoginResponse.data.access_token) {
        const superAdminToken = adminLoginResponse.data.access_token;

        // Get unverified companies
        const unverifiedResponse = await axios.get(
          `${API_URL}/transport-company/unverified`,
          {
            headers: { Authorization: `Bearer ${superAdminToken}` },
          },
        );

        console.log(`✅ Found ${unverifiedResponse.data.length} unverified companies`);

        // Verify the company
        const verifyResponse = await axios.post(
          `${API_URL}/transport-company/verify`,
          {
            companyId: companyId,
            notes: 'Verified for testing',
          },
          {
            headers: { Authorization: `Bearer ${superAdminToken}` },
          },
        );

        console.log('✅ Company verified successfully!');
      }
    } else {
      console.log('⚠️ No admin user found for verification test');
    }

    // Test 7: Get company stats
    console.log('\n📝 Test 7: Getting company statistics...');
    const statsResponse = await axios.get(
      `${API_URL}/transport-company/stats/${companyId}`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    console.log('✅ Company statistics:');
    console.log('- Total Drivers:', statsResponse.data.drivers);
    console.log('- Total Trucks:', statsResponse.data.trucks);
    console.log('- Active Bids:', statsResponse.data.activeBids);
    console.log('- Active Jobs:', statsResponse.data.activeJobs);
    console.log('- Completed Jobs:', statsResponse.data.completedJobs);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Company registered and admin account created');
    console.log('- Admin can login and access company profile');
    console.log('- Duplicate registration prevention works');
    console.log('- Company statistics endpoint works');
    console.log('\n🎯 Next Steps:');
    console.log('1. Build frontend registration flow');
    console.log('2. Add document upload for verification');
    console.log('3. Create company admin dashboard');
    console.log('4. Implement driver management');

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCompanyRegistration();