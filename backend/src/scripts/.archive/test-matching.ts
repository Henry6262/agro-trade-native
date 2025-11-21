import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const API_URL = 'http://localhost:3000/api';

async function testMatching() {
  console.log('🧪 Testing matching flow...\n');

  try {
    // Get an admin user to use as auth
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      console.log('No admin user found!');
      return;
    }

    // Get active buy listings
    console.log('1️⃣ Fetching active buy listings...');
    const buyListings = await prisma.buyListing.findMany({
      where: { status: 'ACTIVE' },
      include: { product: true, buyer: true },
      take: 3,
    });

    console.log(`   Found ${buyListings.length} active buy listings\n`);

    for (const buyListing of buyListings) {
      console.log(`\n📦 Testing with: ${buyListing.buyer.name} - ${buyListing.product.name}`);
      console.log(`   Quantity: ${buyListing.quantity} tons`);
      console.log(`   Max Price: €${buyListing.maxPricePerUnit}/ton`);

      // Check if trade operation exists, or create new one
      console.log('\n2️⃣ Getting or creating trade operation...');
      let tradeOp = await prisma.tradeOperation.findFirst({
        where: { buyListingId: buyListing.id },
      });

      if (tradeOp) {
        console.log(`   ℹ️ Using existing trade operation: ${tradeOp.id}`);
        // Clear existing sellers for fresh test
        await prisma.tradeSeller.deleteMany({
          where: { tradeOperationId: tradeOp.id },
        });
      } else {
        tradeOp = await prisma.tradeOperation.create({
          data: {
            operationNumber: `TEST-${Date.now()}`,
            buyListingId: buyListing.id,
            adminId: admin.id,
            phase: 'INITIATION',
            status: 'ACTIVE',
            profitMargin: 7,
            sellingPrice: buyListing.maxPricePerUnit,
            totalRevenue: buyListing.maxPricePerUnit?.toNumber() 
              ? buyListing.maxPricePerUnit.toNumber() * buyListing.quantity.toNumber()
              : 0,
            currency: 'EUR',
          },
        });
        console.log(`   ✅ Trade operation created: ${tradeOp.id}`);
      }

      // Find matching sellers using the service
      console.log('\n3️⃣ Finding matching sellers...');
      const matchingSales = await prisma.saleListing.findMany({
        where: {
          productId: buyListing.productId,
          status: 'ACTIVE',
          askingPrice: { lte: (buyListing.maxPricePerUnit?.toNumber() || 0) * 0.85 },
        },
        include: { seller: true },
        orderBy: { askingPrice: 'asc' },
      });

      console.log(`   Found ${matchingSales.length} matching sellers:`);
      
      if (matchingSales.length > 0) {
        matchingSales.slice(0, 3).forEach(sale => {
          const profitMargin = buyListing.maxPricePerUnit && sale.askingPrice
            ? ((buyListing.maxPricePerUnit.toNumber() - sale.askingPrice.toNumber()) / buyListing.maxPricePerUnit.toNumber() * 100)
            : 0;
          
          console.log(`   - ${sale.seller.name}: ${sale.quantity} tons @ €${sale.askingPrice}/ton (Margin: ${profitMargin.toFixed(1)}%)`);
        });

        // Select best sellers
        console.log('\n4️⃣ Selecting sellers for trade...');
        let totalQuantity = 0;
        const selectedSellers = [];
        
        for (const sale of matchingSales) {
          if (totalQuantity >= buyListing.quantity.toNumber()) break;
          
          const neededQuantity = Math.min(
            sale.quantity.toNumber(),
            buyListing.quantity.toNumber() - totalQuantity
          );
          
          const tradeSeller = await prisma.tradeSeller.create({
            data: {
              tradeOperationId: tradeOp.id,
              sellerId: sale.seller.id,
              saleListingId: sale.id,
              requestedQuantity: neededQuantity,
              offeredQuantity: sale.quantity,
              unit: 'TON',
              status: 'INVITED',
            },
          });
          
          selectedSellers.push({
            name: sale.seller.name,
            quantity: neededQuantity,
            price: sale.askingPrice,
          });
          
          totalQuantity += neededQuantity;
        }

        console.log(`   ✅ Selected ${selectedSellers.length} sellers:`);
        selectedSellers.forEach(s => {
          console.log(`      - ${s.name}: ${s.quantity} tons @ €${s.price}/ton`);
        });

        // Calculate profit
        console.log('\n5️⃣ Calculating profit...');
        const totalPurchaseCost = selectedSellers.reduce(
          (sum, s) => sum + (s.quantity * (s.price?.toNumber() || 0)),
          0
        );
        const totalRevenue = buyListing.maxPricePerUnit?.toNumber() 
          ? buyListing.maxPricePerUnit.toNumber() * totalQuantity
          : 0;
        const estimatedTransportCost = totalQuantity * 5; // €5/ton estimate
        const netProfit = totalRevenue - totalPurchaseCost - estimatedTransportCost;
        const profitMargin = (netProfit / totalRevenue) * 100;

        console.log(`   Revenue: €${totalRevenue.toFixed(2)}`);
        console.log(`   Purchase Cost: €${totalPurchaseCost.toFixed(2)}`);
        console.log(`   Transport Cost: €${estimatedTransportCost.toFixed(2)}`);
        console.log(`   Net Profit: €${netProfit.toFixed(2)}`);
        console.log(`   Profit Margin: ${profitMargin.toFixed(1)}%`);

        if (profitMargin >= 5) {
          console.log(`   ✅ Trade is VIABLE (margin ≥ 5%)`);
        } else {
          console.log(`   ❌ Trade is NOT VIABLE (margin < 5%)`);
        }
      } else {
        console.log('   ❌ No matching sellers found!');
      }

      console.log('\n' + '='.repeat(60));
      
      // Only test first buy listing in detail
      break;
    }

    console.log('\n✅ Matching flow test complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testMatching()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });