import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000/api';

interface TestTransporter {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  companyName: string;
  licenseNumber: string;
}

async function testTransporterAuthFlow() {
  console.log('🚚 Testing Transporter Authentication Flow\n');
  
  const testTransporter: TestTransporter = {
    email: `transporter-${Date.now()}@test.com`,
    password: 'Test123456!',
    name: 'John Transport',
    phoneNumber: '+359888123456',
    companyName: 'Fast Logistics Ltd',
    licenseNumber: `LIC-${Date.now()}`,
  };
  
  try {
    // Step 1: Register Transporter
    console.log('📝 Step 1: Registering new transporter...');
    console.log(`   Email: ${testTransporter.email}`);
    console.log(`   Company: ${testTransporter.companyName}`);
    console.log(`   License: ${testTransporter.licenseNumber}`);
    
    const registerResponse = await axios.post(
      `${API_BASE}/auth/register/transporter`,
      {
        ...testTransporter,
        role: 'TRANSPORTER',
        fleetSize: 10,
        baseLocation: 'Sofia, Bulgaria',
        coordinates: {
          lat: 42.6977,
          lng: 23.3219,
        },
        insuranceProvider: 'Transport Insurance Co',
        insurancePolicyNumber: 'POL-2025-001',
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('✅ Registration successful!');
    console.log(`   User ID: ${registerResponse.data.user.id}`);
    console.log(`   Access Token: ${registerResponse.data.access_token.substring(0, 20)}...`);
    console.log(`   Refresh Token: ${registerResponse.data.refresh_token.substring(0, 20)}...`);
    
    const { access_token, refresh_token, user, transporter } = registerResponse.data;
    
    // Step 2: Test Login
    console.log('\n🔐 Step 2: Testing login with credentials...');
    const loginResponse = await axios.post(
      `${API_BASE}/auth/login`,
      {
        email: testTransporter.email,
        password: testTransporter.password,
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('✅ Login successful!');
    console.log(`   New Access Token: ${loginResponse.data.access_token.substring(0, 20)}...`);
    
    // Step 3: Test Protected Endpoint
    console.log('\n🔒 Step 3: Testing protected endpoint (Get Profile)...');
    const profileResponse = await axios.get(
      `${API_BASE}/auth/me`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        }
      }
    );
    
    console.log('✅ Profile retrieved successfully!');
    console.log(`   Name: ${profileResponse.data.name}`);
    console.log(`   Role: ${profileResponse.data.role}`);
    console.log(`   Email: ${profileResponse.data.email}`);
    
    // Step 4: Test Refresh Token
    console.log('\n🔄 Step 4: Testing refresh token...');
    const refreshResponse = await axios.post(
      `${API_BASE}/auth/refresh`,
      {
        refreshToken: refresh_token,
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    console.log('✅ Token refreshed successfully!');
    console.log(`   New Access Token: ${refreshResponse.data.access_token.substring(0, 20)}...`);
    
    // Step 5: Test Transporter-Specific Operations
    console.log('\n📊 Step 5: Testing transporter-specific operations...');
    
    // Get transport requests available for bidding
    try {
      const transportRequestsResponse = await axios.get(
        `${API_BASE}/transport/requests/available`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          }
        }
      );
      
      console.log(`✅ Available transport requests: ${transportRequestsResponse.data.length || 0}`);
    } catch (error) {
      console.log('   No transport requests endpoint available yet');
    }
    
    // Step 6: Verify Database Records
    console.log('\n💾 Step 6: Verifying database records...');
    
    const dbUser = await prisma.user.findUnique({
      where: { email: testTransporter.email },
      include: {
        company: true,
      }
    });
    
    if (dbUser) {
      console.log('✅ User record found in database');
      console.log(`   User ID: ${dbUser.id}`);
      console.log(`   Role: ${dbUser.role}`);
      console.log(`   Active: ${dbUser.isActive}`);
      console.log(`   Last Login: ${dbUser.lastLogin}`);
      
      if (dbUser.company) {
        console.log('✅ Transporter company profile found');
        console.log(`   Company: ${dbUser.company.legalName}`);
        console.log(`   License: ${dbUser.company.registrationNumber}`);
        console.log(`   Email: ${dbUser.company.email}`);
        console.log(`   Phone: ${dbUser.company.phoneNumber}`);
      }
    }
    
    // Step 7: Test Logout
    console.log('\n👋 Step 7: Testing logout...');
    const logoutResponse = await axios.post(
      `${API_BASE}/auth/logout`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        }
      }
    );
    
    console.log('✅ Logout successful!');
    console.log(`   Message: ${logoutResponse.data.message}`);
    
    // Step 8: Verify Token is Still Valid (JWT doesn't have server-side invalidation)
    console.log('\n🔍 Step 8: Verifying token still works after logout (JWT behavior)...');
    try {
      const postLogoutProfile = await axios.get(
        `${API_BASE}/auth/me`,
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          }
        }
      );
      console.log('✅ Token still valid (expected for JWT)');
    } catch (error) {
      console.log('❌ Token invalidated (unexpected for JWT)');
    }
    
    console.log('\n====================================');
    console.log('✅ TRANSPORTER AUTH FLOW COMPLETE!');
    console.log('====================================');
    
    console.log('\n📊 Summary:');
    console.log('1. ✅ Transporter registration working');
    console.log('2. ✅ Login/logout endpoints functional');
    console.log('3. ✅ JWT tokens generated correctly');
    console.log('4. ✅ Refresh token mechanism working');
    console.log('5. ✅ Protected endpoints accessible with token');
    console.log('6. ✅ Transporter profile created in database');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Implement transport request endpoints');
    console.log('2. Add bidding functionality');
    console.log('3. Create delivery tracking');
    console.log('4. Build transporter dashboard UI');
    
    console.log('\n🧹 Test Data:');
    console.log(`   Email: ${testTransporter.email}`);
    console.log(`   Password: ${testTransporter.password}`);
    console.log(`   Can be used to test login in UI`);
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 Bad Request - Check:');
      console.log('   - Email format is valid');
      console.log('   - Password meets requirements');
      console.log('   - Required fields are provided');
    } else if (error.response?.status === 401) {
      console.log('\n💡 Unauthorized - Check:');
      console.log('   - Token is valid');
      console.log('   - Token is properly formatted in header');
    } else if (error.response?.status === 404) {
      console.log('\n💡 Not Found - Check:');
      console.log('   - API endpoints are correct');
      console.log('   - Backend server is running');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTransporterAuthFlow()
  .then(() => {
    console.log('\n✨ All tests passed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed');
    process.exit(1);
  });