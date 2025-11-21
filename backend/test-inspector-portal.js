#!/usr/bin/env node

/**
 * Test script for Inspector Portal endpoints
 * Tests the new inspection endpoints added for the Inspector Portal feature
 */

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

// Admin credentials (from TEST_CREDENTIALS)
const ADMIN_CREDENTIALS = {
  email: 'admin@agro-trade.com',
  password: 'admin123',
};

let authToken = null;

async function login() {
  console.log('\n1. Logging in as admin...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, ADMIN_CREDENTIALS);
    authToken = response.data.access_token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetAllInspections() {
  console.log('\n2. Testing GET /api/inspections...');
  try {
    const response = await axios.get(`${API_BASE}/inspections`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`✅ Fetched ${response.data.length} inspections`);

    if (response.data.length > 0) {
      const inspection = response.data[0];
      console.log('   Sample inspection:', {
        id: inspection.id,
        status: inspection.status,
        priority: inspection.priority,
        seller: inspection.saleListing?.seller?.name || 'N/A',
        product: inspection.saleListing?.product?.name || 'N/A',
      });
    }

    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch inspections:', error.response?.data || error.message);
    return [];
  }
}

async function testFilterByStatus() {
  console.log('\n3. Testing filter by status (PENDING)...');
  try {
    const response = await axios.get(`${API_BASE}/inspections`, {
      params: { status: 'PENDING' },
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log(`✅ Fetched ${response.data.length} PENDING inspections`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to filter inspections:', error.response?.data || error.message);
    return [];
  }
}

async function testUpdateInspection(inspectionId) {
  console.log(`\n4. Testing PATCH /api/inspections/${inspectionId}...`);
  try {
    const response = await axios.patch(
      `${API_BASE}/inspections/${inspectionId}`,
      {
        status: 'COMPLETED',
        qualityScore: 85,
        qualityGrade: 'Premium',
        notes: 'Test inspection completed successfully',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    console.log('✅ Inspection updated successfully');
    console.log('   Updated data:', {
      id: response.data.id,
      status: response.data.status,
      qualityScore: response.data.qualityScore,
    });
    return response.data;
  } catch (error) {
    console.error('❌ Failed to update inspection:', error.response?.data || error.message);
    return null;
  }
}

async function testCreateTestInspection() {
  console.log('\n5. Creating test inspection for demonstration...');
  try {
    // This would require a trade operation and sale listing
    // For now, we'll skip this if no test data exists
    console.log('⚠️  Skipping test inspection creation (requires test trade operation)');
    return null;
  } catch (error) {
    console.error('❌ Failed to create test inspection:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Inspector Portal API Tests');
  console.log('='.repeat(60));

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Test fetching all inspections
  const allInspections = await testGetAllInspections();

  // Test filtering
  const pendingInspections = await testFilterByStatus();

  // Test update (only if we have inspections)
  if (pendingInspections.length > 0) {
    const testInspection = pendingInspections[0];
    console.log(`\n   Using inspection ${testInspection.id} for update test`);

    // Only update if it's actually pending
    if (testInspection.status === 'PENDING') {
      await testUpdateInspection(testInspection.id);
    } else {
      console.log('   ⚠️  Skipping update test (no PENDING inspections)');
    }
  } else {
    console.log('\n   ⚠️  No inspections available for update test');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Tests completed!');
  console.log('='.repeat(60));
  console.log('\nSummary:');
  console.log(`- Total inspections: ${allInspections.length}`);
  console.log(`- Pending inspections: ${pendingInspections.length}`);
  console.log('\nNote: To fully test the Inspector Portal, create a trade operation');
  console.log('with inspections using the Scenario Orchestrator in the admin dashboard.');
}

// Run tests
runTests().catch(console.error);
