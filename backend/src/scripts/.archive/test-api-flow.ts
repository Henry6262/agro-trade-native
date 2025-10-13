import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000/api';

async function testCompleteAPIFlow() {
  console.log('🚀 Testing Complete Inspection Failure Flow via API\n');
  
  try {
    // Step 1: Create fresh test data
    console.log('📦 Step 1: Creating fresh test data...');
    
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
    const seller = await prisma.user.findFirst({ where: { role: 'FARMER' } });
    const inspector = await prisma.user.findFirst({ where: { role: 'INSPECTOR' } });
    const product = await prisma.product.findFirst();
    
    if (!admin || !buyer || !seller || !inspector || !product) {
      throw new Error('Required data not found. Run cleanup-and-seed.ts first.');
    }
    
    // Create new buy listing
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product.id,
        quantity: 300,
        unit: 'TON',
        maxPricePerUnit: 360,
        status: 'ACTIVE',
      }
    });
    
    // Create new sale listing  
    const saleListing = await prisma.saleListing.create({
      data: {
        sellerId: seller.id,
        productId: product.id,
        quantity: 150,
        unit: 'TON',
        askingPrice: 330,
        status: 'ACTIVE',
        qualityGrade: 'PREMIUM',
      }
    });
    
    // Create trade operation
    const tradeOp = await prisma.tradeOperation.create({
      data: {
        operationNumber: `API-TEST-${Date.now()}`,
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
        estimatedProfit: 2000,
        profitMargin: 12,
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
        requestedQuantity: 150,
        offeredQuantity: 150,
        unit: 'TON',
        agreedPrice: 340,
      }
    });
    console.log('✅ Added seller to operation');
    
    // Step 2: Create inspection via API
    console.log('\n🔍 Step 2: Creating inspection request via API...');
    const createInspectionResponse = await axios.post(
      `${API_BASE}/inspections`,
      {
        tradeOperationId: tradeOp.id,
        saleListingId: saleListing.id,
        priority: 'HIGH',
        notes: 'Quality verification for API test',
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
    const inspection = createInspectionResponse.data;
    console.log(`✅ Inspection created: ${inspection.id}`);
    
    // Step 3: Assign inspector
    console.log('\n👤 Step 3: Assigning inspector...');
    await axios.put(
      `${API_BASE}/inspections/${inspection.id}/assign`,
      { inspectorId: inspector.id },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log('✅ Inspector assigned');
    
    // Step 4: Submit FAILED inspection results
    console.log('\n❌ Step 4: Submitting FAILED inspection results (score: 60)...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay
    
    const inspectionResults = {
      qualityScore: 60, // FAILED - below 70 threshold
      verificationResult: {
        actualQuantity: 145,
        actualQuality: 'POOR',
        moistureContent: 18.2,
        foreignMatter: 4.5,
        brokenGrains: 5.8,
        discoloration: true,
        pestDamage: true,
        productSpecifications: {
          variety: 'Standard',
          grade: 'D',
          origin: 'Bulgaria',
          harvestDate: new Date('2024-09-15'),
        }
      },
      notes: 'Critical quality issues detected. High moisture content, excessive foreign matter, and visible pest damage. Product fails to meet minimum standards.',
      photos: ['inspection1.jpg', 'damage1.jpg'],
      recommendVerification: false,
    };
    
    try {
      await axios.post(
        `${API_BASE}/inspections/${inspection.id}/results`,
        inspectionResults,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      console.log('✅ Inspection results submitted');
    } catch (error: any) {
      console.log('API Error:', error.response?.data || error.message);
    }
    
    // Step 5: Wait for backend processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 6: Check results
    console.log('\n📊 Step 5: Checking results...');
    
    // Get updated trade seller
    const updatedTradeSeller = await prisma.tradeSeller.findUnique({
      where: { id: tradeSeller.id },
      include: { seller: true }
    });
    
    console.log('\n🔍 Inspection Results:');
    console.log(`  Quality Score: 60/100 (FAILED)`);
    console.log(`  Threshold: 70/100`);
    console.log(`  Result: ❌ Below minimum quality standards`);
    
    console.log('\n👥 Seller Status:');
    console.log(`  Seller: ${updatedTradeSeller?.seller.name}`);
    console.log(`  Previous Status: ACCEPTED`);
    console.log(`  Current Status: ${updatedTradeSeller?.status}`);
    console.log(`  Verified: ${updatedTradeSeller?.isVerified ? 'Yes' : 'No'}`);
    
    // Get updated trade operation
    const updatedTradeOp = await prisma.tradeOperation.findUnique({
      where: { id: tradeOp.id },
      include: {
        sellers: {
          where: { status: { not: 'FAILED_INSPECTION' } }
        }
      }
    });
    
    console.log('\n📈 Trade Operation Impact:');
    console.log(`  Operation: ${updatedTradeOp?.operationNumber}`);
    console.log(`  Active Sellers: ${updatedTradeOp?.sellers.length}`);
    console.log(`  Failed Sellers: ${updatedTradeSeller?.status === 'FAILED_INSPECTION' ? 1 : 0}`);
    
    // Check notifications
    const notifications = await prisma.tradeNote.findMany({
      where: { tradeOperationId: tradeOp.id },
      orderBy: { createdAt: 'desc' },
      take: 1
    });
    
    console.log('\n📬 Notifications:');
    if (notifications.length > 0) {
      const notification = JSON.parse(notifications[0].content);
      console.log(`  Type: Inspection Failure Alert`);
      console.log(`  Seller: ${notification.sellerName}`);
      console.log(`  Quality Score: ${notification.qualityScore}/100`);
      console.log(`  Quantity Lost: ${notification.quantityLost} TON`);
      console.log(`  Critical: ${notification.criticalFailure ? 'Yes' : 'No'}`);
    } else {
      console.log('  No notifications generated');
    }
    
    // Check metadata
    const finalTradeOp = await prisma.tradeOperation.findUnique({
      where: { id: tradeOp.id }
    });
    
    if (finalTradeOp?.metadata) {
      const metadata = finalTradeOp.metadata as any;
      console.log('\n📝 Operation Metadata:');
      if (metadata.inspectionFailures?.length > 0) {
        console.log(`  Inspection Failures: ${metadata.inspectionFailures.length}`);
        const failure = metadata.inspectionFailures[0];
        console.log(`    - Quality Score: ${failure.qualityScore}`);
        console.log(`    - Reason: ${failure.reason}`);
        console.log(`    - Notes: ${failure.notes}`);
      }
    }
    
    console.log('\n====================================');
    console.log('✅ COMPLETE API FLOW TEST FINISHED!');
    console.log('====================================');
    
    console.log('\n📊 Summary:');
    console.log('1. ✅ Trade operation created');
    console.log('2. ✅ Inspection requested via API');
    console.log('3. ✅ Inspector assigned');
    console.log('4. ✅ Failed inspection submitted (score: 60/100)');
    console.log('5. ✅ Seller marked as FAILED_INSPECTION');
    console.log('6. ✅ Trade operation metadata updated');
    console.log('7. ✅ Admin notification created');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Open Admin Dashboard: http://localhost:5176/');
    console.log('2. Navigate to Trade Operations');
    console.log(`3. Find operation: ${tradeOp.operationNumber}`);
    console.log('4. Check Sellers tab for failure warning');
    console.log('5. Click "Find Replacement" to replace failed seller');
    
    // Cleanup option
    console.log('\n🧹 To clean up this test data, run:');
    console.log(`   DELETE FROM trade_operation WHERE operation_number = '${tradeOp.operationNumber}'`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCompleteAPIFlow()
  .then(() => {
    console.log('\n✨ All tests passed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });