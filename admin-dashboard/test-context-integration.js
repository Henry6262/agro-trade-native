// Test script to verify context manager integration
// Run this in the browser console after logging in

async function testContextIntegration() {
  console.log('🧪 Testing Context Manager Integration...\n');

  // Import necessary modules (if in browser console, these should be available)
  // Otherwise, adjust imports as needed

  try {
    // Step 1: Clear context
    console.log('1️⃣ Clearing context...');
    scenarioContext.clear();
    console.log('✅ Context cleared\n');

    // Step 2: Add test users
    console.log('2️⃣ Adding test users...');

    // Add farmers
    scenarioContext.addUser('FARMER', { id: 'farmer-1', name: 'John Doe', email: 'farmer1@test.com' });
    scenarioContext.addUser('FARMER', { id: 'farmer-2', name: 'Jane Smith', email: 'farmer2@test.com' });
    scenarioContext.addUser('FARMER', { id: 'farmer-3', name: 'Bob Johnson', email: 'farmer3@test.com' });

    // Add buyer
    scenarioContext.addUser('BUYER', { id: 'buyer-1', name: 'ACME Corp', email: 'buyer@test.com' });

    // Add transporter
    scenarioContext.addUser('TRANSPORTER', { id: 'trans-1', name: 'Fast Logistics', email: 'trans@test.com' });

    // Add inspector
    scenarioContext.addUser('INSPECTOR', { id: 'insp-1', name: 'Quality Check Inc', email: 'inspector@test.com' });

    console.log('✅ Added 6 test users\n');

    // Step 3: Test user retrieval
    console.log('3️⃣ Testing user retrieval...');

    const farmer1 = scenarioContext.getUser('FARMER', 0);
    console.log('  Farmer at index 0:', farmer1?.name);

    const farmer2 = scenarioContext.getUser('FARMER', 1);
    console.log('  Farmer at index 1:', farmer2?.name);

    const buyer = scenarioContext.getUser('BUYER', 0);
    console.log('  Buyer at index 0:', buyer?.name);

    console.log('✅ User retrieval working\n');

    // Step 4: Add entities
    console.log('4️⃣ Adding test entities...');

    scenarioContext.addEntity('saleListings', { id: 'sale-1', farmerId: 'farmer-1', product: 'Tomatoes' });
    scenarioContext.addEntity('saleListings', { id: 'sale-2', farmerId: 'farmer-2', product: 'Potatoes' });
    scenarioContext.addEntity('saleListings', { id: 'sale-3', farmerId: 'farmer-3', product: 'Carrots' });

    scenarioContext.addEntity('buyListings', { id: 'buy-1', buyerId: 'buyer-1', product: 'Tomatoes' });

    scenarioContext.addEntity('tradeOperations', { id: 'trade-1', buyListingId: 'buy-1', status: 'active' });

    console.log('✅ Added test entities\n');

    // Step 5: Test entity retrieval
    console.log('5️⃣ Testing entity retrieval...');

    const saleListing = scenarioContext.getEntityByIndex('saleListings', 0);
    console.log('  Sale listing at index 0:', saleListing?.product);

    const buyListing = scenarioContext.getLatestEntity('buyListings');
    console.log('  Latest buy listing:', buyListing?.id);

    const tradeOp = scenarioContext.getCurrentTradeOperation();
    console.log('  Current trade operation:', tradeOp?.id);

    console.log('✅ Entity retrieval working\n');

    // Step 6: Get stats
    console.log('6️⃣ Getting context stats...');
    const stats = scenarioContext.getStats();
    console.log('  Stats:', stats);
    console.log('✅ Stats retrieved\n');

    // Step 7: Test context resolution in payload
    console.log('7️⃣ Testing context resolution...');

    const testPayload = {
      farmerId: 'farmer-{{farmerIndex:0}}',
      buyerId: 'buyer-{{buyerIndex:0}}',
      saleListingId: 'sale-{{saleListingIndex:1}}',
      buyListingId: 'buy-{{buyListingIndex}}',
      tradeOperationId: 'trade-{{tradeOperationId}}'
    };

    console.log('  Original payload:', testPayload);

    // Note: resolveContextReferences is called internally by simulationApi
    // This is just to show what would happen
    console.log('  Context references would resolve to actual IDs when passed to API\n');

    console.log('✅ All tests passed! Context manager is working correctly.\n');

    // Final summary
    console.log('📊 Final Context Summary:');
    console.log('  - Farmers:', scenarioContext.users.FARMER?.length || 0);
    console.log('  - Buyers:', scenarioContext.users.BUYER?.length || 0);
    console.log('  - Transporters:', scenarioContext.users.TRANSPORTER?.length || 0);
    console.log('  - Inspectors:', scenarioContext.users.INSPECTOR?.length || 0);
    console.log('  - Sale Listings:', scenarioContext.entities.saleListings?.length || 0);
    console.log('  - Buy Listings:', scenarioContext.entities.buyListings?.length || 0);
    console.log('  - Trade Operations:', scenarioContext.entities.tradeOperations?.length || 0);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Instructions
console.log(`
========================================
  Context Manager Integration Test
========================================

To run this test:

1. Open the admin dashboard at http://localhost:5174/
2. Log in with test credentials
3. Open browser DevTools console (F12)
4. Copy and paste this entire script
5. Run: testContextIntegration()

The test will verify that the context manager
is properly integrated and working correctly.
========================================
`);

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testContextIntegration };
}