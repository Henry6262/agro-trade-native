// Test single endpoint with detailed error reporting
const BASE_URL = 'http://localhost:4000';

async function testEndpoint() {
  // 1. Login as admin
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@agrotrade.com',
      password: 'admin123'
    })
  });

  const loginData = await loginRes.json();
  const token = loginData.access_token;
  console.log('Admin token obtained:', token.substring(0, 20) + '...');

  // 2. Create test farmer
  const userRes = await fetch(`${BASE_URL}/api/simulation/users/create-test-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      role: 'FARMER',
      name: 'Test Farmer'
    })
  });

  const farmer = await userRes.json();
  console.log('\nFarmer created:', farmer);

  // 3. Try to create sale listing
  console.log('\nAttempting to create sale listing...');
  const saleRes = await fetch(`${BASE_URL}/api/simulation/admin/farmer/${farmer.id}/create-sale-listing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      productCategory: 'SOFT_WHEAT',
      quantity: 100,
      pricePerUnit: 250,
      latitude: 24.4539,
      longitude: 54.3773
    })
  });

  console.log('Response status:', saleRes.status);
  console.log('Response headers:', Object.fromEntries(saleRes.headers.entries()));

  const saleData = await saleRes.text();
  console.log('Response body:', saleData);

  try {
    const saleJson = JSON.parse(saleData);
    console.log('Parsed response:', JSON.stringify(saleJson, null, 2));
  } catch (e) {
    console.log('Could not parse as JSON');
  }
}

testEndpoint().catch(console.error);
