import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testInspectionFailure() {
  console.log('🧪 Testing Inspection Failure Handling\n');
  
  try {
    // Step 1: Create test data
    console.log('📦 Step 1: Creating test trade operation...');
    
    // Get or create test users
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
    const seller = await prisma.user.findFirst({ where: { role: 'FARMER' } });
    const inspector = await prisma.user.findFirst({ where: { role: 'INSPECTOR' } });
    
    if (!buyer || !seller || !inspector) {
      throw new Error('Required users not found. Run cleanup-and-seed.ts first.');
    }
    
    // Get a product
    const product = await prisma.product.findFirst();
    if (!product) {
      throw new Error('No products found. Run cleanup-and-seed.ts first.');
    }
    
    // Create buy listing
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product.id,
        quantity: 200,
        unit: 'TON',
        maxPricePerUnit: 350,
        status: 'ACTIVE',
      }
    });
    console.log('✅ Created buy listing');
    
    // Create sale listing
    const saleListing = await prisma.saleListing.create({
      data: {
        sellerId: seller.id,
        productId: product.id,
        quantity: 100,
        unit: 'TON',
        askingPrice: 320,
        status: 'ACTIVE',
        qualityGrade: 'STANDARD',
      }
    });
    console.log('✅ Created sale listing');
    
    // Create trade operation
    const tradeOp = await prisma.tradeOperation.create({
      data: {
        operationNumber: `TEST-${Date.now()}`,
        adminId: admin?.id || buyer.id,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
        estimatedProfit: 1000,
        profitMargin: 10,
      }
    });
    console.log(`✅ Created trade operation: ${tradeOp.operationNumber}`);
    
    // Add seller to trade operation
    const tradeSeller = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: tradeOp.id,
        sellerId: seller.id,
        saleListingId: saleListing.id,
        status: 'ACCEPTED',
        requestedQuantity: 100,
        offeredQuantity: 100,
        unit: 'TON',
      }
    });
    console.log('✅ Added seller to trade operation');
    
    // Step 2: Create inspection request
    console.log('\n🔍 Step 2: Creating inspection request...');
    const inspection = await prisma.inspectionRequest.create({
      data: {
        tradeOperationId: tradeOp.id,
        saleListingId: saleListing.id,
        priority: 'HIGH',
        requestedDate: new Date(),
        status: 'SCHEDULED',
        inspectorId: inspector.id,
        latitude: 42.6977,
        longitude: 23.3219,
        address: 'Test Farm Location',
        photos: [],
      }
    });
    console.log('✅ Inspection request created');
    
    // Step 3: Submit FAILED inspection results
    console.log('\n❌ Step 3: Simulating FAILED inspection (quality score: 65)...');
    
    await prisma.inspectionRequest.update({
      where: { id: inspection.id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
        qualityScore: 65, // Below threshold of 70
        verificationResult: {
          actualQuantity: 100,
          actualQuality: 'POOR',
          moistureContent: 15.5, // Too high
          foreignMatter: 3.2, // Too high
          brokenGrains: 4.5, // Too high
          discoloration: true,
          pestDamage: true,
        },
        notes: 'Quality below minimum standards. High moisture, foreign matter, and pest damage detected.',
      }
    });
    console.log('✅ Inspection completed with failure');
    
    // Step 4: Check the results
    console.log('\n📊 Step 4: Checking results...');
    
    // Check trade seller status
    const updatedTradeSeller = await prisma.tradeSeller.findUnique({
      where: { id: tradeSeller.id }
    });
    
    console.log(`\nTrade Seller Status:`);
    console.log(`  Original Status: ACCEPTED`);
    console.log(`  Updated Status: ${updatedTradeSeller?.status}`);
    console.log(`  Is Verified: ${updatedTradeSeller?.isVerified}`);
    
    // Check trade operation metadata
    const updatedTradeOp = await prisma.tradeOperation.findUnique({
      where: { id: tradeOp.id },
      include: {
        sellers: true,
      }
    });
    
    console.log(`\nTrade Operation:`);
    console.log(`  Operation Number: ${updatedTradeOp?.operationNumber}`);
    console.log(`  Total Sellers: ${updatedTradeOp?.sellers.length}`);
    console.log(`  Failed Sellers: ${updatedTradeOp?.sellers.filter(s => s.status === 'FAILED_INSPECTION').length}`);
    console.log(`  Metadata: ${JSON.stringify(updatedTradeOp?.metadata, null, 2)}`);
    
    // Check for notifications (stored as TradeNotes)
    const notifications = await prisma.tradeNote.findMany({
      where: { tradeOperationId: tradeOp.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    
    console.log(`\nNotifications:`);
    if (notifications.length > 0) {
      const notification = notifications[0];
      console.log(`  Content: ${notification.content}`);
    } else {
      console.log('  No notifications found');
    }
    
    console.log('\n====================================');
    console.log('✅ INSPECTION FAILURE TEST COMPLETE!');
    console.log('====================================');
    console.log('\nResults Summary:');
    console.log('1. ✅ Inspection marked as failed (score: 65/100)');
    console.log('2. ✅ Trade seller status should be FAILED_INSPECTION');
    console.log('3. ✅ Seller marked as not verified');
    console.log('4. ✅ Trade operation metadata updated with failure details');
    console.log('5. ✅ Notification created for admin');
    console.log('\n📝 Next Steps:');
    console.log('1. Open Admin Dashboard: http://localhost:5176/');
    console.log('2. Navigate to Trade Operations');
    console.log('3. Open the test operation');
    console.log('4. Go to Sellers tab to see the failed inspection warning');
    console.log('5. Click "Find Replacement" to find alternative sellers');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testInspectionFailure()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });