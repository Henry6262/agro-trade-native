/**
 * Test suite for ScenarioContextManager
 */

import { scenarioContext } from './scenarioContext'

// Test the context manager
function testScenarioContext() {
  console.log('Testing ScenarioContextManager...\n')

  // Clear context
  scenarioContext.clear()
  console.log('✓ Context cleared')

  // Test adding users
  scenarioContext.addUser('FARMER', {
    id: 'farmer-1',
    email: 'farmer1@test.com',
    role: 'FARMER',
    name: 'John Farmer'
  })

  scenarioContext.addUser('BUYER', {
    id: 'buyer-1',
    email: 'buyer1@test.com',
    role: 'BUYER',
    name: 'Jane Buyer'
  })

  console.log('✓ Added users')

  // Test getting users
  const farmer = scenarioContext.getUser('FARMER', 0)
  console.log('✓ Retrieved farmer:', farmer?.name)

  const buyer = scenarioContext.getUser('BUYER', 0)
  console.log('✓ Retrieved buyer:', buyer?.name)

  // Test adding products
  scenarioContext.addProduct('CORN', {
    id: 'product-corn-1',
    name: 'Premium Corn',
    category: 'CORN'
  })

  scenarioContext.addProduct('WHEAT', {
    id: 'product-wheat-1',
    name: 'Organic Wheat',
    category: 'WHEAT'
  })

  console.log('✓ Added products')

  // Test adding entities
  scenarioContext.addEntity('saleListings', {
    id: 'sale-1',
    farmerId: 'farmer-1',
    productId: 'product-corn-1',
    price: 100
  })

  scenarioContext.addEntity('buyListings', {
    id: 'buy-1',
    buyerId: 'buyer-1',
    productId: 'product-wheat-1',
    quantity: 1000
  })

  scenarioContext.addEntity('tradeOperations', {
    id: 'trade-1',
    buyerId: 'buyer-1',
    productId: 'product-wheat-1',
    status: 'ACTIVE'
  })

  console.log('✓ Added entities')

  // Test reference resolution
  const payload = {
    farmerIndex: 0,
    buyerIndex: 0,
    productCategory: 'CORN',
    saleListingIndex: 0,
    tradeOperationIndex: 0,
    nestedData: {
      transporterIndex: 0,
      inspectorIndex: 0
    },
    someOtherField: 'unchanged'
  }

  const resolved = scenarioContext.resolveReference(payload)
  console.log('\n✓ Reference resolution test:')
  console.log('  Input:', JSON.stringify(payload, null, 2))
  console.log('  Output:', JSON.stringify(resolved, null, 2))

  // Verify resolution
  if (resolved.farmerId === 'farmer-1' &&
      resolved.buyerId === 'buyer-1' &&
      resolved.productId === 'product-corn-1' &&
      resolved.saleListingId === 'sale-1' &&
      resolved.tradeOperationId === 'trade-1' &&
      resolved.someOtherField === 'unchanged') {
    console.log('\n✓ All reference resolutions passed!')
  } else {
    console.error('\n✗ Reference resolution failed')
  }

  // Test getting current trade operation
  const currentTrade = scenarioContext.getCurrentTradeOperation()
  console.log('✓ Current trade operation:', currentTrade?.id)

  // Test stats
  const stats = scenarioContext.getStats()
  console.log('\n✓ Context statistics:', stats)

  // Test handling of admin users (should be skipped)
  scenarioContext.addUser('ADMIN', {
    id: 'admin-1',
    email: 'admin@test.com',
    role: 'ADMIN',
    name: 'Admin User'
  })

  const adminUser = scenarioContext.getUser('ADMIN', 0)
  console.log('✓ Admin user handling (should be null):', adminUser)

  console.log('\n✅ All tests passed!')
}

// Export for testing
export { testScenarioContext }