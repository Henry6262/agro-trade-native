import { PrismaClient, TradePhase, NegotiationStatus, SellerStatus } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000/api';

// Test credentials
const ADMIN_EMAIL = 'admin@test.com';
const BUYER_EMAIL = 'buyer1@test.com';
const SELLER_EMAIL = 'seller1@test.com';
const TRANSPORTER_EMAIL = 'transporter1@test.com';
const INSPECTOR_EMAIL = 'inspector1@test.com';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateCompleteFlow() {
  console.log('🚀 Starting Complete Trade Operation Flow Simulation\n');

  try {
    // Step 1: Get the existing trade operation
    console.log('📦 Step 1: Finding existing trade operation...');
    const tradeOp = await prisma.tradeOperation.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        buyListing: {
          include: {
            buyer: true,
            product: true,
          }
        }
      }
    });

    if (!tradeOp) {
      throw new Error('No active trade operation found. Run cleanup-and-seed.ts first.');
    }
    console.log(`✅ Found operation: ${tradeOp.operationNumber}`);
    console.log(`   Product: ${tradeOp.buyListing.product.name}`);
    console.log(`   Required Quantity: ${tradeOp.requiredQuantity} units`);

    // Step 2: Move to SELLER_NEGOTIATION phase
    console.log('\n📋 Step 2: Moving to SELLER_NEGOTIATION phase...');
    await prisma.tradeOperation.update({
      where: { id: tradeOp.id },
      data: { phase: TradePhase.SELLER_NEGOTIATION }
    });
    console.log('✅ Phase updated to SELLER_NEGOTIATION');

    // Step 3: Find potential sellers and add them to the operation
    console.log('\n👥 Step 3: Finding and adding potential sellers...');
    const saleListings = await prisma.saleListing.findMany({
      where: {
        productId: tradeOp.buyListing.productId,
        status: 'ACTIVE',
      },
      take: 3,
      include: {
        seller: true,
      }
    });

    console.log(`   Found ${saleListings.length} potential sellers`);

    // Add sellers to trade operation
    const tradeSellers = [];
    for (const listing of saleListings) {
      const tradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: tradeOp.id,
          sellerId: listing.sellerId,
          saleListingId: listing.id,
          status: SellerStatus.INVITED,
          requestedQuantity: Math.min(100, tradeOp.requiredQuantity / 3),
          unit: listing.unit,
        }
      });
      tradeSellers.push(tradeSeller);
      console.log(`   ✅ Added ${listing.seller.name} to operation`);
    }

    // Step 4: Create negotiations with sellers
    console.log('\n💬 Step 4: Sending offers to sellers...');
    const negotiations = [];
    for (const tradeSeller of tradeSellers) {
      const negotiation = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOp.id,
          tradeSellerId: tradeSeller.id,
          offeredPrice: 330,
          offeredQuantity: tradeSeller.requestedQuantity,
          status: NegotiationStatus.PENDING,
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        }
      });
      negotiations.push(negotiation);
      console.log(`   ✅ Sent offer to seller ${tradeSeller.sellerId}`);
    }

    // Step 5: Simulate seller acceptance
    console.log('\n✅ Step 5: Simulating seller responses...');
    await delay(1000);

    for (let i = 0; i < negotiations.length; i++) {
      const negotiation = negotiations[i];
      const tradeSeller = tradeSellers[i];
      
      // Accept offer
      await prisma.offerNegotiation.update({
        where: { id: negotiation.id },
        data: {
          status: NegotiationStatus.ACCEPTED,
          respondedAt: new Date(),
        }
      });

      // Update trade seller status
      await prisma.tradeSeller.update({
        where: { id: tradeSeller.id },
        data: {
          status: SellerStatus.ACCEPTED,
          finalPrice: negotiation.offeredPrice,
          agreedQuantity: negotiation.offeredQuantity,
        }
      });

      console.log(`   ✅ Seller ${i + 1} accepted offer`);
    }

    // Update secured quantity
    await prisma.tradeOperation.update({
      where: { id: tradeOp.id },
      data: {
        securedQuantity: tradeSellers.reduce((sum, s) => sum + s.requestedQuantity, 0),
      }
    });

    // Step 6: Request inspections
    console.log('\n🔍 Step 6: Requesting quality inspections...');
    const inspections = [];
    for (const tradeSeller of tradeSellers) {
      const inspection = await prisma.inspectionRequest.create({
        data: {
          tradeOperationId: tradeOp.id,
          saleListingId: tradeSeller.saleListingId,
          priority: 'MEDIUM',
          requestedDate: new Date(),
          status: 'PENDING',
          latitude: 42.6977,
          longitude: 23.3219,
          address: 'Test Location',
          photos: [],
        }
      });
      inspections.push(inspection);
      console.log(`   ✅ Inspection requested for seller ${tradeSeller.sellerId}`);
    }

    // Step 7: Simulate inspection results (one failure)
    console.log('\n🧪 Step 7: Simulating inspection results...');
    await delay(1000);

    // Assign inspector
    const inspector = await prisma.user.findFirst({
      where: { role: 'INSPECTOR' }
    });

    if (inspector) {
      for (let i = 0; i < inspections.length; i++) {
        const inspection = inspections[i];
        
        // Assign inspector
        await prisma.inspectionRequest.update({
          where: { id: inspection.id },
          data: {
            inspectorId: inspector.id,
            status: 'SCHEDULED',
            scheduledDate: new Date(),
          }
        });

        // Submit results - make the second seller fail inspection
        const qualityScore = i === 1 ? 65 : 85; // Second seller fails
        await prisma.inspectionRequest.update({
          where: { id: inspection.id },
          data: {
            status: 'COMPLETED',
            completedDate: new Date(),
            qualityScore,
            verificationResult: {
              actualQuantity: tradeSellers[i].requestedQuantity,
              actualQuality: qualityScore >= 70 ? 'GOOD' : 'POOR',
              moistureContent: 12.5,
              foreignMatter: qualityScore >= 70 ? 0.5 : 2.5,
              brokenGrains: qualityScore >= 70 ? 1.0 : 3.5,
            },
            notes: qualityScore >= 70 ? 'Quality meets requirements' : 'Quality below minimum threshold',
          }
        });

        // Update trade seller verification status
        if (qualityScore >= 70) {
          await prisma.tradeSeller.update({
            where: { id: tradeSellers[i].id },
            data: { isVerified: true }
          });
          console.log(`   ✅ Seller ${i + 1} PASSED inspection (score: ${qualityScore})`);
        } else {
          await prisma.tradeSeller.update({
            where: { id: tradeSellers[i].id },
            data: { 
              status: 'FAILED_INSPECTION' as any,
              isVerified: false 
            }
          });
          console.log(`   ❌ Seller ${i + 1} FAILED inspection (score: ${qualityScore})`);
        }
      }
    }

    // Step 8: Move to TRANSPORT_MATCHING phase
    console.log('\n🚚 Step 8: Moving to TRANSPORT_MATCHING phase...');
    await prisma.tradeOperation.update({
      where: { id: tradeOp.id },
      data: { phase: TradePhase.TRANSPORT_MATCHING }
    });

    // Create transport request
    const transportRequest = await prisma.transportRequest.create({
      data: {
        tradeOperationId: tradeOp.id,
        pickupLocation: 'Sofia, Bulgaria',
        pickupLatitude: 42.6977,
        pickupLongitude: 23.3219,
        deliveryLocation: 'Plovdiv, Bulgaria',
        deliveryLatitude: 42.1354,
        deliveryLongitude: 24.7453,
        estimatedWeight: 200,
        estimatedVolume: 250,
        requiredVehicleType: 'Grain Hauler',
        pickupDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        deliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        specialRequirements: 'Temperature controlled',
        status: 'PENDING',
      }
    });
    console.log('✅ Transport request created');

    // Step 9: Simulate transport bids
    console.log('\n💰 Step 9: Simulating transport bids...');
    const transporters = await prisma.user.findMany({
      where: { role: 'TRANSPORTER' },
      take: 3,
    });

    const bids = [];
    for (let i = 0; i < transporters.length; i++) {
      const bid = await prisma.transportBid.create({
        data: {
          transportRequestId: transportRequest.id,
          transporterId: transporters[i].id,
          bidAmount: 4500 + (i * 500), // Varying bid amounts
          estimatedDuration: 24,
          vehicleType: 'Grain Hauler',
          notes: `Can deliver within 24 hours`,
          status: 'PENDING',
        }
      });
      bids.push(bid);
      console.log(`   ✅ Bid received from ${transporters[i].name}: €${bid.bidAmount}`);
    }

    // Step 10: Select winning bid
    console.log('\n🏆 Step 10: Selecting transport bid...');
    await delay(1000);
    
    // Select the cheapest bid
    const winningBid = bids[0];
    await prisma.transportBid.update({
      where: { id: winningBid.id },
      data: { status: 'ACCEPTED' }
    });

    await prisma.transportRequest.update({
      where: { id: transportRequest.id },
      data: {
        status: 'ACCEPTED',
        acceptedBidId: winningBid.id,
      }
    });

    // Create transport job
    const transportJob = await prisma.transportJob.create({
      data: {
        transportRequestId: transportRequest.id,
        transporterId: winningBid.transporterId,
        status: 'PENDING',
        scheduledPickup: transportRequest.pickupDate,
        scheduledDelivery: transportRequest.deliveryDate,
        agreedPrice: winningBid.bidAmount,
      }
    });
    console.log(`✅ Transport bid accepted: €${winningBid.bidAmount}`);
    console.log('✅ Transport job created');

    // Step 11: Summary
    console.log('\n📊 FLOW SIMULATION COMPLETE!');
    console.log('====================================');
    console.log(`Trade Operation: ${tradeOp.operationNumber}`);
    console.log(`Current Phase: TRANSPORT_MATCHING`);
    console.log(`Sellers Added: ${tradeSellers.length}`);
    console.log(`Sellers Verified: ${tradeSellers.filter(s => s.isVerified).length}`);
    console.log(`Inspection Failures: 1`);
    console.log(`Transport Bids: ${bids.length}`);
    console.log(`Selected Transporter: ${transporters[0].name}`);
    console.log(`Transport Cost: €${winningBid.bidAmount}`);
    console.log('====================================');

    console.log('\n📝 Next Steps:');
    console.log('1. Open Admin Dashboard: http://localhost:5176/');
    console.log('2. Login as admin@test.com (password: password123)');
    console.log('3. Navigate to Trade Operations');
    console.log('4. View the operation and check the failed inspection warning');
    console.log('5. Use "Find Replacement" to replace the failed seller');
    console.log('6. Continue with transport and delivery phases');

  } catch (error) {
    console.error('❌ Error during flow simulation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the simulation
simulateCompleteFlow()
  .then(() => {
    console.log('\n✅ Simulation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Simulation failed:', error);
    process.exit(1);
  });