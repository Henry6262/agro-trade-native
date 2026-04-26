/**
 * tests-e2e/golden-path.ts
 *
 * SYSTEM-WIDE E2E VERIFICATION SCRIPT
 * ────────────────────────────────────────────────────────────────────────────
 * This script verifies the "Golden Path" of the Agro-Trade ecosystem:
 * 1. User Creation (Buyer & Farmer)
 * 2. Listing Creation
 * 3. Offer & Negotiation Flow
 * 4. Automated Phase Transition
 * 5. State Verification
 */

import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4000/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

async function runGoldenPath() {
  console.log('🚀 Starting System-Wide E2E Verification...');

  try {
    // 1. Create Test Users
    console.log('  - Creating Test Users...');
    const authHeader = { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } };
    
    const buyerResponse = await axios.post(`${API_URL}/simulation/users/create-test-user`, {
      role: 'BUYER',
      name: 'E2E Test Buyer',
    }, authHeader);
    const buyer = buyerResponse.data.data || buyerResponse.data;

    const farmerResponse = await axios.post(`${API_URL}/simulation/users/create-test-user`, {
      role: 'FARMER',
      name: 'E2E Test Farmer',
    }, authHeader);
    const farmer = farmerResponse.data.data || farmerResponse.data;

    // 2. Create Buy Listing
    console.log('  - Creating Buy Listing...');
    const listingResponse = await axios.post(`${API_URL}/simulation/buyer/${buyer.id}/create-listing`, {
      productCategory: 'Grain',
      quantity: 100,
      maxPrice: 250,
    }, authHeader);
    const listing = listingResponse.data;

    // 3. Create Trade Operation
    console.log('  - Initializing Trade Operation...');
    const tradeResponse = await axios.post(`${API_URL}/simulation/admin/create-trade-operation`, {
      buyListingId: listing.id,
      adminMargin: 15,
      buyerCommission: 2,
      sellerCommission: 3,
    }, authHeader);
    const trade = tradeResponse.data;

    // 4. Send Offer to Farmer
    console.log('  - Sending Offer to Farmer...');
    const farmerListingResponse = await axios.post(`${API_URL}/simulation/admin/farmer/${farmer.id}/create-sale-listing`, {
      productCategory: 'Grain',
      quantity: 500,
      pricePerUnit: 200,
    }, authHeader);
    const farmerListing = farmerListingResponse.data;

    const offerResponse = await axios.post(`${API_URL}/simulation/admin/send-offers`, {
      tradeOperationId: trade.id,
      offers: [{
        farmerId: farmer.id,
        saleListingId: farmerListing.id,
        requestedQuantity: 100,
        offeredPrice: 210,
      }],
    }, authHeader);
    const negotiation = offerResponse.data[0];

    // 5. Farmer Accepts Offer
    console.log('  - Simulating Farmer Acceptance...');
    await axios.post(`${API_URL}/negotiations/${negotiation.id}/accept`, {}, authHeader);

    // 6. Verify Automated Phase Transition
    console.log('  - Verifying Automated Phase Transition...');
    const finalStateResponse = await axios.get(`${API_URL}/simulation/trade-operation/${trade.id}/full-state`, authHeader);
    const finalTrade = finalStateResponse.data;

    console.log(`    Current Phase: ${finalTrade.phase}`);
    
    if (finalTrade.phase === 'INSPECTION_PENDING' || finalTrade.phase === 'TRANSPORT_MATCHING') {
      console.log('✅ Golden Path Verified Successfully!');
    } else {
      console.error(`❌ Unexpected Phase: ${finalTrade.phase}`);
      process.exit(1);
    }

  } catch (error: any) {
    console.error('❌ E2E Verification Failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

runGoldenPath();
