#!/usr/bin/env node

/**
 * Test script for POST /api/trade-operations endpoint
 * Creates a trade operation with sellers and initial offers
 */

const API_BASE = 'http://localhost:3000/api';

async function testCreateOfferEndpoint() {
  console.log('\n===================');
  console.log('Test: Create Trade Operation with Offers');
  console.log('===================\n');

  try {
    // First, get some existing data to work with
    console.log('1. Fetching existing buy listings...');
    const buyListingsResponse = await fetch(`${API_BASE}/buyer/listings`);
    const buyListingsData = await buyListingsResponse.json();

    if (!buyListingsData || buyListingsData.length === 0) {
      console.log('No buy listings found. Please create a buy listing first.');
      return;
    }

    const buyListing = buyListingsData[0];
    console.log(`Found buy listing: ${buyListing.id}`);
    console.log(`  - Product: ${buyListing.product?.name || 'Unknown'}`);
    console.log(`  - Quantity: ${buyListing.quantity}`);
    console.log(`  - Max Price: ${buyListing.maxPricePerUnit}\n`);

    // Get some sale listings
    console.log('2. Fetching existing sale listings...');
    const saleListingsResponse = await fetch(`${API_BASE}/seller/listings`);
    const saleListingsData = await saleListingsResponse.json();

    if (!saleListingsData || saleListingsData.length === 0) {
      console.log('No sale listings found. Please create sale listings first.');
      return;
    }

    // Filter sale listings for same product
    const matchingSales = saleListingsData.filter(
      sl => sl.productId === buyListing.productId && sl.status === 'ACTIVE'
    );

    if (matchingSales.length === 0) {
      console.log('No matching sale listings found for this product.');
      return;
    }

    console.log(`Found ${matchingSales.length} matching sale listings\n`);

    // Prepare sellers array (take up to 2 sellers)
    const sellers = matchingSales.slice(0, 2).map((sl, index) => ({
      saleListingId: sl.id,
      sellerId: sl.sellerId,
      quantity: Math.min(100 + index * 50, Number(sl.quantity)),
      offerPrice: Number(sl.askingPrice || buyListing.maxPricePerUnit) * 0.95, // 95% of asking price
    }));

    console.log('3. Creating trade operation with offers...');
    console.log('Request payload:', JSON.stringify({
      buyListingId: buyListing.id,
      sellers,
    }, null, 2), '\n');

    const createResponse = await fetch(`${API_BASE}/trade-operations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buyListingId: buyListing.id,
        sellers,
      }),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.error('Error creating trade operation:');
      console.error(JSON.stringify(createData, null, 2));
      return;
    }

    console.log('SUCCESS! Trade operation created:');
    console.log(JSON.stringify(createData, null, 2), '\n');

    const tradeOpId = createData.tradeOperationId;

    // Test GET endpoint
    console.log('4. Testing GET /api/trade-operations?status=ACTIVE...');
    const getResponse = await fetch(`${API_BASE}/trade-operations?status=ACTIVE`);
    const getData = await getResponse.json();

    console.log(`Found ${getData.total} active operations`);

    // Find our created operation
    const ourOp = getData.data.find(op => op.id === tradeOpId);
    if (ourOp) {
      console.log('\nOur created operation:');
      console.log('  - Operation Number:', ourOp.operationNumber);
      console.log('  - Phase:', ourOp.phase);
      console.log('  - Status:', ourOp.status);
      console.log('  - Sellers:', ourOp.sellers?.length || 0);
      console.log('  - Negotiations:', ourOp.negotiations?.length || 0);

      if (ourOp.negotiations && ourOp.negotiations.length > 0) {
        console.log('\n  Negotiations:');
        ourOp.negotiations.forEach((nego, idx) => {
          console.log(`    ${idx + 1}. Status: ${nego.status}`);
          console.log(`       Seller: ${nego.tradeSeller?.seller?.name || 'Unknown'}`);
          console.log(`       Offer: $${nego.currentOffer?.price} for ${nego.currentOffer?.quantity} units`);
          console.log(`       Expires: ${new Date(nego.expiresAt).toLocaleString()}`);
          console.log(`       Hours until expiry: ${nego.hoursUntilExpiry?.toFixed(1) || 'N/A'}`);
        });
      }
    }

    console.log('\n===================');
    console.log('Test Complete!');
    console.log('===================\n');

  } catch (error) {
    console.error('Test failed:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the test
testCreateOfferEndpoint();
