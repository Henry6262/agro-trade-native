import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000/api';

async function testInspectionAPI() {
  console.log('🧪 Testing Inspection Failure via API\n');
  
  try {
    // Get the test inspection we created
    const inspection = await prisma.inspectionRequest.findFirst({
      where: {
        tradeOperation: {
          operationNumber: { startsWith: 'TEST-' }
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        saleListing: true,
      }
    });

    if (!inspection || !inspection.inspectorId) {
      throw new Error('No test inspection found. Run test-inspection-failure.ts first.');
    }

    console.log(`📋 Found inspection: ${inspection.id}`);
    console.log(`   Sale Listing: ${inspection.saleListingId}`);
    console.log(`   Inspector: ${inspection.inspectorId}`);
    
    // Submit failed inspection results via API
    console.log('\n❌ Submitting FAILED inspection results via API...');
    
    const inspectionData = {
      qualityScore: 65, // Below threshold
      verificationResult: {
        actualQuantity: 100,
        actualQuality: 'POOR',
        moistureContent: 15.5,
        foreignMatter: 3.2,
        brokenGrains: 4.5,
        discoloration: true,
        pestDamage: true,
        productSpecifications: {
          variety: 'Test Variety',
          grade: 'D',
          origin: 'Bulgaria',
        }
      },
      notes: 'Quality below minimum standards. High moisture and pest damage.',
      photos: [],
      recommendVerification: false, // Failed, so no verification
    };

    // The inspection service will use the inspectorId from the inspection itself
    // or default to 'default-inspector' if not authenticated
    try {
      const response = await axios.post(
        `${API_BASE}/inspections/${inspection.id}/results`,
        inspectionData,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      console.log('✅ API Response Status:', response.status);
      console.log('✅ Inspection marked as completed');
    } catch (error: any) {
      if (error.response) {
        console.log('API Error Response:', error.response.data);
        console.log('API Error Status:', error.response.status);
      } else {
        throw error;
      }
    }

    // Check the results
    console.log('\n📊 Checking results after API call...');
    
    // Check trade seller status
    const tradeSellers = await prisma.tradeSeller.findMany({
      where: { saleListingId: inspection.saleListingId }
    });
    
    console.log(`\nTrade Sellers (${tradeSellers.length} found):`);
    for (const seller of tradeSellers) {
      console.log(`  - Status: ${seller.status}, Verified: ${seller.isVerified}`);
    }
    
    // Check for notifications
    const notifications = inspection.tradeOperationId ? await prisma.tradeNote.findMany({
      where: { tradeOperationId: inspection.tradeOperationId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    }) : [];
    
    console.log(`\nNotifications (${notifications.length} found):`);
    if (notifications.length > 0) {
      console.log(`  Latest: ${notifications[0].content.substring(0, 100)}...`);
    }
    
    // Check trade operation metadata
    const tradeOp = inspection.tradeOperationId ? await prisma.tradeOperation.findUnique({
      where: { id: inspection.tradeOperationId },
    }) : null;
    
    if (tradeOp?.metadata) {
      console.log(`\nTrade Operation Metadata:`);
      console.log(JSON.stringify(tradeOp.metadata, null, 2));
    }
    
    console.log('\n====================================');
    console.log('✅ API TEST COMPLETE!');
    console.log('====================================');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testInspectionAPI()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });