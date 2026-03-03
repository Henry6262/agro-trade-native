import axios from 'axios';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const API_URL = 'http://localhost:4000/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const color = type === 'success' ? colors.green : 
                type === 'error' ? colors.red :
                type === 'warning' ? colors.yellow : 
                colors.cyan;
  console.log(`${color}${message}${colors.reset}`);
}

async function testCompleteTradeFlow() {
  log('\n🚀 TESTING COMPLETE TRADE OPERATION FLOW\n', 'info');
  
  const results = {
    steps: [] as Array<{step: string, status: 'success' | 'failed' | 'partial', details: string}>,
    issues: [] as string[],
  };

  try {
    // ====================
    // STEP 1: Setup Users
    // ====================
    log('\n📝 STEP 1: Setting up test users...', 'info');
    
    const hashedPassword = await bcrypt.hash('Test123!', 10);
    
    // Create or get users
    let buyer = await prisma.user.findFirst({ where: { role: UserRole.BUYER }});
    if (!buyer) {
      buyer = await prisma.user.create({
        data: {
          email: `buyer.${Date.now()}@test.com`,
          password: hashedPassword,
          name: 'Test Buyer',
          role: UserRole.BUYER,
          isEmailVerified: true,
          onboardingCompleted: true,
        },
      });
    }

    let seller = await prisma.user.findFirst({ where: { role: UserRole.FARMER }});
    if (!seller) {
      seller = await prisma.user.create({
        data: {
          email: `seller.${Date.now()}@test.com`,
          password: hashedPassword,
          name: 'Test Seller',
          role: UserRole.FARMER,
          isEmailVerified: true,
          onboardingCompleted: true,
        },
      });
    }

    let inspector = await prisma.user.findFirst({ where: { role: UserRole.INSPECTOR }});
    if (!inspector) {
      inspector = await prisma.user.create({
        data: {
          email: `inspector.${Date.now()}@test.com`,
          password: hashedPassword,
          name: 'Test Inspector',
          role: UserRole.INSPECTOR,
          isEmailVerified: true,
          onboardingCompleted: true,
        },
      });
    }

    let transporter = await prisma.user.findFirst({ where: { role: UserRole.TRANSPORTER }});
    if (!transporter) {
      transporter = await prisma.user.create({
        data: {
          email: `transporter.${Date.now()}@test.com`,
          password: hashedPassword,
          name: 'Test Transporter',
          role: UserRole.TRANSPORTER,
          isEmailVerified: true,
          onboardingCompleted: true,
        },
      });
    }

    let admin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN }});
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: `admin.${Date.now()}@test.com`,
          password: hashedPassword,
          name: 'Test Admin',
          role: UserRole.ADMIN,
          isEmailVerified: true,
          onboardingCompleted: true,
        },
      });
    }
    
    results.steps.push({
      step: 'User Setup',
      status: 'success',
      details: `Created/Found: Buyer, Seller, Inspector, Transporter, Admin`,
    });

    // ====================
    // STEP 2: Create Products & Listings
    // ====================
    log('\n📝 STEP 2: Creating products and listings...', 'info');
    
    // Get or create a product
    let product = await prisma.product.findFirst({
      where: { category: 'SOFT_WHEAT' }
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: 'soft-wheat-test',
          displayName: 'Soft Wheat Test',
          category: 'SOFT_WHEAT',
          description: 'Test wheat for trade flow',
          isActive: true,
        },
      });
    }

    // Create seller listing with lower price for better profit margin
    const saleListing = await prisma.saleListing.create({
      data: {
        productId: product.id,
        sellerId: seller.id,
        quantity: 1000,
        unit: 'TON',
        askingPrice: 230,  // Lower price for better profit margin
        status: 'ACTIVE',
      },
    });

    // Create buyer listing
    const buyListing = await prisma.buyListing.create({
      data: {
        productId: product.id,
        buyerId: buyer.id,
        quantity: 500,
        unit: 'TON',
        maxPricePerUnit: 260,
        neededBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'ACTIVE',
      },
    });

    results.steps.push({
      step: 'Product & Listings',
      status: 'success',
      details: `Created product, sale listing (${saleListing.id}), buy listing (${buyListing.id})`,
    });

    // ====================
    // STEP 3: Create Trade Operation
    // ====================
    log('\n📝 STEP 3: Creating trade operation...', 'info');
    
    try {
      const tradeOpResponse = await axios.post(`${API_URL}/trade-operations`, {
        buyListingId: buyListing.id,
        targetProfitMargin: 10,
        notes: 'Test trade operation for complete flow',
      });

      const tradeOp = tradeOpResponse.data.data || tradeOpResponse.data;
      log(`  ✅ Trade Operation created: ${tradeOp.operationNumber || tradeOp.id}`, 'success');
      
      results.steps.push({
        step: 'Trade Operation Creation',
        status: 'success',
        details: `Created trade operation: ${tradeOp.operationNumber}`,
      });

      // ====================
      // STEP 4: Seller Matching
      // ====================
      log('\n📝 STEP 4: Finding matching sellers...', 'info');
      
      let tradeSeller: any = null;
      try {
        const matchingResponse = await axios.get(
          `${API_URL}/trade-operations/${tradeOp.id}/matching-sellers`
        );

        const matchingSellers = matchingResponse.data.sellers || [];
        log(`  ✅ Found ${matchingSellers.length} matching sellers`, 'success');
        
        if (matchingSellers.length > 0) {
          // Add sellers to trade operation
          const addSellersResponse = await axios.post(
            `${API_URL}/trade-operations/${tradeOp.id}/sellers`,
            {
              sellers: [{
                sellerId: matchingSellers[0].sellerId,
                saleListingId: matchingSellers[0].saleListingId,
                requestedQuantity: Math.min(500, matchingSellers[0].availableQuantity),
              }]
            }
          );

          // Store the first trade seller for later use in negotiation
          if (addSellersResponse.data.sellersAdded?.length > 0) {
            tradeSeller = addSellersResponse.data.sellersAdded[0];
          }

          log(`  ✅ Added seller to trade operation`, 'success');
          results.steps.push({
            step: 'Seller Matching',
            status: 'success',
            details: `Found and added ${matchingSellers.length} sellers`,
          });
        } else {
          results.steps.push({
            step: 'Seller Matching',
            status: 'partial',
            details: 'No matching sellers found',
          });
          results.issues.push('No sellers matched the buy listing criteria');
        }
      } catch (error: any) {
        results.steps.push({
          step: 'Seller Matching',
          status: 'failed',
          details: error.response?.data?.message || error.message,
        });
        results.issues.push(`Seller matching failed: ${error.message}`);
      }

      // ====================
      // STEP 5: Negotiation
      // ====================
      log('\n📝 STEP 5: Testing negotiation system...', 'info');
      
      try {
        if (tradeSeller) {
          // Create initial offer using the correct DTO format
          const offerResponse = await axios.post(
            `${API_URL}/negotiations/trade-operations/${tradeOp.id}/offers`,
            {
              tradeSellerId: tradeSeller.id,  // Use tradeSellerId from the added seller
              price: 235,  // Slightly higher than seller asking price
              quantity: 500,
              terms: 'Initial offer from platform, payment on delivery',
            }
          );

          log(`  ✅ Created negotiation offer`, 'success');
          
          // Seller accepts offer (in real system, seller would do this)
          const negotiation = offerResponse.data.data || offerResponse.data;
          const acceptResponse = await axios.post(
            `${API_URL}/negotiations/negotiations/${negotiation.id}/accept`,
            {
              acceptanceNote: 'Terms accepted'
            }
          );

          log(`  ✅ Seller accepted offer`, 'success');
          results.steps.push({
            step: 'Negotiation',
            status: 'success',
            details: 'Offer created and accepted',
          });
        } else {
          results.steps.push({
            step: 'Negotiation',
            status: 'partial',
            details: 'Skipped - no trade seller available',
          });
        }
      } catch (error: any) {
        results.steps.push({
          step: 'Negotiation',
          status: 'failed',
          details: error.response?.data?.message || error.message,
        });
        results.issues.push(`Negotiation failed: ${error.message}`);
      }

      // ====================
      // STEP 6: Inspection Request
      // ====================
      log('\n📝 STEP 6: Creating inspection request...', 'info');
      
      try {
        const inspectionResponse = await axios.post(
          `${API_URL}/trade-operations/${tradeOp.id}/request-inspections`,
          {
            sellerIds: [seller.id],
            inspectionNotes: 'Please verify quality before shipment',
          }
        );

        log(`  ✅ Created inspection request`, 'success');
        
        // Inspector completes inspection (in real system, inspector would do this)
        if (inspectionResponse.data.inspectionRequests?.length > 0) {
          const inspectionRequest = inspectionResponse.data.inspectionRequests[0];
          
          // Complete inspection
          const completeInspectionResponse = await axios.put(
            `${API_URL}/inspections/${inspectionRequest.id}/complete`,
            {
              passed: true,
              actualQuantity: 500,
              qualityScore: 95,
              notes: 'Quality verified, ready for transport',
              reportUrl: 'https://example.com/inspection-report.pdf',
            }
          );

          log(`  ✅ Inspection completed`, 'success');
          results.steps.push({
            step: 'Inspection',
            status: 'success',
            details: 'Inspection requested and completed',
          });
        }
      } catch (error: any) {
        results.steps.push({
          step: 'Inspection',
          status: 'failed',
          details: error.response?.data?.message || error.message,
        });
        results.issues.push(`Inspection failed: ${error.message}`);
      }

      // ====================
      // STEP 7: Transport Request & Bidding
      // ====================
      log('\n📝 STEP 7: Creating transport request...', 'info');
      
      try {
        // Login as admin to create transport request
        let adminToken: string;
        try {
          const adminLoginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: admin.email,
            password: 'Test123!',
          });
          adminToken = adminLoginResponse.data.access_token;
        } catch (loginError) {
          // If login fails, proceed without auth (API might not require it)
          log('  ⚠️ Admin login failed, proceeding without auth', 'warning');
          adminToken = '';
        }

        // Create transport request with correct DTO format
        const transportRequestResponse = await axios.post(
          `${API_URL}/transport/requests`,
          {
            tradeOperationId: tradeOp.id,
            totalWeight: 500, // in tons
            requiredVehicleType: 'FLATBED',
            specialRequirements: ['Temperature controlled'],
            pickupWindowStart: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            pickupWindowEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            deliveryDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            urgencyLevel: 'STANDARD',
            biddingDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            maxBudget: 2000,
          },
          adminToken ? {
            headers: { Authorization: `Bearer ${adminToken}` },
          } : {}
        );

        const transportRequest = transportRequestResponse.data;
        log(`  ✅ Created transport request`, 'success');

        // Login as transporter and submit bid
        let transporterToken = '';
        try {
          const transporterLoginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: transporter.email,
            password: 'Test123!',
          });
          transporterToken = transporterLoginResponse.data.access_token;
        } catch (loginError) {
          log('  ⚠️ Transporter login failed, proceeding without auth', 'warning');
        }

        // Transporter submits bid with correct DTO format
        const bidResponse = await axios.post(
          `${API_URL}/transport/bids`,
          {
            transportRequestId: transportRequest.id,
            bidAmount: 1500,
            estimatedDuration: 24,
            vehicleType: 'FLATBED',
            vehicleCapacity: 600,  // in tons
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            specialEquipment: ['Temperature Control'],
          },
          transporterToken ? {
            headers: { Authorization: `Bearer ${transporterToken}` },
          } : {}
        );

        log(`  ✅ Transport bid submitted`, 'success');

        // Accept bid (admin would do this)
        const acceptBidResponse = await axios.post(
          `${API_URL}/transport/bids/${bidResponse.data.id}/accept`,
          {},
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        log(`  ✅ Transport bid accepted`, 'success');
        results.steps.push({
          step: 'Transport',
          status: 'success',
          details: 'Transport requested, bid submitted and accepted',
        });
      } catch (error: any) {
        results.steps.push({
          step: 'Transport',
          status: 'failed',
          details: error.response?.data?.message || error.message,
        });
        results.issues.push(`Transport failed: ${error.message}`);
      }

      // ====================
      // STEP 8: Complete Trade
      // ====================
      log('\n📝 STEP 8: Finalizing trade operation...', 'info');
      
      try {
        const finalizeResponse = await axios.post(
          `${API_URL}/trade-operations/${tradeOp.id}/finalize`,
          {
            actualDeliveryDate: new Date().toISOString(),
            finalNotes: 'Trade completed successfully',
            actualTransportCost: 1500,
          }
        );

        log(`  ✅ Trade operation finalized`, 'success');
        results.steps.push({
          step: 'Finalization',
          status: 'success',
          details: 'Trade operation completed',
        });
      } catch (error: any) {
        results.steps.push({
          step: 'Finalization',
          status: 'failed',
          details: error.response?.data?.message || error.message,
        });
        results.issues.push(`Finalization failed: ${error.message}`);
      }

    } catch (error: any) {
      log(`  ❌ Trade operation creation failed: ${error.message}`, 'error');
      results.steps.push({
        step: 'Trade Operation Creation',
        status: 'failed',
        details: error.response?.data?.message || error.message,
      });
      results.issues.push(`Trade operation creation failed: ${error.message}`);
    }

    // ====================
    // SUMMARY
    // ====================
    log('\n' + '='.repeat(60), 'info');
    log('📊 FLOW TEST SUMMARY', 'info');
    log('='.repeat(60), 'info');

    // Display results table
    console.log('\n📋 Steps Status:');
    results.steps.forEach(step => {
      const icon = step.status === 'success' ? '✅' : 
                   step.status === 'partial' ? '⚠️' : '❌';
      const color = step.status === 'success' ? colors.green : 
                    step.status === 'partial' ? colors.yellow : colors.red;
      console.log(`  ${icon} ${color}${step.step}${colors.reset}: ${step.details}`);
    });

    // Calculate success rate
    const successful = results.steps.filter(s => s.status === 'success').length;
    const total = results.steps.length;
    const successRate = Math.round((successful / total) * 100);

    console.log(`\n📈 Success Rate: ${successRate}% (${successful}/${total} steps)`);

    // Display issues
    if (results.issues.length > 0) {
      log('\n⚠️ Issues Found:', 'warning');
      results.issues.forEach(issue => {
        console.log(`  • ${issue}`);
      });
    }

    // Recommendations
    log('\n💡 Recommendations:', 'info');
    if (results.issues.length === 0) {
      log('  ✅ Flow is working end-to-end!', 'success');
    } else {
      console.log('  Priority fixes needed:');
      results.steps
        .filter(s => s.status === 'failed')
        .forEach(s => console.log(`    • Fix ${s.step}: ${s.details}`));
    }

  } catch (error: any) {
    log(`\n❌ Fatal error: ${error.message}`, 'error');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCompleteTradeFlow();