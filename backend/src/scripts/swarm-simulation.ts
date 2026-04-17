/**
 * AgroTrade SWARM Simulation
 * Populates the system with dozens of active trades across all phases.
 * Perfect for the "God View" map visualization in Zurich.
 *
 * Usage: npx ts-node src/scripts/swarm-simulation.ts
 */

import axios from "axios";

const BASE_URL = "http://localhost:4000/api";

async function runSwarm() {
  console.log("🚀 Starting AgroTrade Swarm Simulation...");

  // 0. Login to get Admin Token
  console.log("🔐 Authenticating...");
  let adminToken = "";
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@agrotrade.com",
      password: "admin123",
    });
    adminToken = loginResponse.data.access_token;
    console.log("✅ Authenticated as Admin");
  } catch (err: any) {
    console.error("❌ Login failed. Make sure to run 'npx ts-node src/scripts/add-admin.ts' first.");
    return;
  }

  const authHeaders = {
    headers: { Authorization: `Bearer ${adminToken}` }
  };

  // 1. Get a valid Product ID
  console.log("🌾 Fetching product catalog...");
  const productsResponse = await axios.get(`${BASE_URL}/products`, authHeaders);
  // Nest response is wrapped in { data: [...] }
  const productList = productsResponse.data.data || productsResponse.data;
  
  if (!productList || productList.length === 0) {
      console.error("❌ No products found in database. Seed products first.");
      return;
  }
  const product = productList[0];
  console.log(`✅ Using product: ${product.displayName || product.name} (${product.id})`);

  // 2. Cleanup old swarm data
  console.log("🧹 Cleaning up old simulation data...");
  try {
      await axios.delete(`${BASE_URL}/simulation/admin/cleanup-test-data`, authHeaders);
  } catch (e) {}

  // 3. Create Farmers
  const regions = [
    { name: "Sofia", lat: 42.6977, lng: 23.3219 },
    { name: "Plovdiv", lat: 42.1354, lng: 24.7453 },
    { name: "Nairobi", lat: -1.2921, lng: 36.8219 },
    { name: "Mombasa", lat: -4.0435, lng: 39.6682 },
  ];

  console.log("👨‍🌾 Creating farmers and sale listings...");
  for (let i = 0; i < 15; i++) {
    const region = regions[i % regions.length];
    try {
        const farmerResponse = await axios.post(`${BASE_URL}/simulation/users/create-test-user`, {
            name: `Farmer ${i}`,
            role: "FARMER", 
            data: {
                location: region.name,
                lat: region.lat + (Math.random() - 0.5) * 0.1,
                lng: region.lng + (Math.random() - 0.5) * 0.1,
            }
        }, authHeaders);

        const farmerId = farmerResponse.data.id;
        
        await axios.post(`${BASE_URL}/simulation/admin/farmer/${farmerId}/create-sale-listing`, {
            productCategory: product.category,
            quantity: 100 + Math.floor(Math.random() * 200),
            pricePerUnit: 250,
        }, authHeaders);
        process.stdout.write(".");
    } catch (err: any) {
        process.stdout.write("x");
    }
  }
  console.log("\n");

  // 4. Create Buyers
  console.log("🛒 Creating buyers and demand...");
  for (let i = 0; i < 5; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    try {
        const buyerResponse = await axios.post(`${BASE_URL}/simulation/users/create-test-user`, {
            name: `Buyer Corp ${i}`,
            role: "BUYER",
            data: {
                location: region.name,
                lat: region.lat + (Math.random() - 0.5) * 0.1,
                lng: region.lng + (Math.random() - 0.5) * 0.1,
            }
        }, authHeaders);

        const buyerId = buyerResponse.data.id;

        await axios.post(`${BASE_URL}/simulation/buyer/${buyerId}/create-listing`, {
            productId: product.id,
            quantity: 1000,
            maxPricePerUnit: 350,
        }, authHeaders);
        process.stdout.write(".");
    } catch (err: any) {
        process.stdout.write("x");
    }
  }
  console.log("\n");

  // 5. Generate Trade Operations
  console.log("📈 Generating active trade operations...");
  try {
    const buyListingsRes = await axios.get(`${BASE_URL}/buyer/listings`, authHeaders);
    const listings = buyListingsRes.data.data || buyListingsRes.data;
    
    for (const listing of listings.slice(0, 5)) {
        try {
            const opResponse = await axios.post(`${BASE_URL}/simulation/admin/create-trade-operation`, {
                buyListingId: listing.id,
                adminMargin: 5,
            }, authHeaders);
            const opId = opResponse.data.id;
            console.log(`✅ Trade OP created: ${opId}`);
        } catch (e) {
            console.warn("⚠️ Failed trade op creation");
        }
    }
  } catch (e) {}

  console.log("\n✨ Swarm successfully deployed!");
  console.log("The Global Trade Map should now be buzzing with activity.");
}

runSwarm().catch(err => {
  console.error("❌ Swarm fatal error:", err.message);
});
