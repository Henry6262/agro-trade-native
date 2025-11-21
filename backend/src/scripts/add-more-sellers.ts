import { PrismaClient, ListingStatus, ProductUnit } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Adding more seller listings to ensure matching...\n");

  // Get all products
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products\n`);

  // Get all sellers
  const sellers = await prisma.user.findMany({
    where: { role: "FARMER" },
  });
  console.log(`Found ${sellers.length} sellers\n`);

  if (sellers.length === 0) {
    console.log("No sellers found! Please run seed-test-data.ts first");
    return;
  }

  // Get all buy listings to understand pricing
  const buyListings = await prisma.buyListing.findMany({
    include: { product: true },
  });

  console.log("📦 Creating additional sale listings...\n");

  // Ensure every product has multiple sellers with good prices
  for (const product of products) {
    const buyListingsForProduct = buyListings.filter(
      (b) => b.productId === product.id,
    );

    if (buyListingsForProduct.length === 0) {
      console.log(`  ⚠️ No buy listings for ${product.name}, skipping...`);
      continue;
    }

    const maxBuyPrice = Math.max(
      ...buyListingsForProduct.map((b) => b.maxPricePerUnit?.toNumber() || 0),
    );
    console.log(`\n  Product: ${product.name}`);
    console.log(`  Max buyer price: €${maxBuyPrice}/ton`);
    console.log(`  Creating sellers with prices 60-80% of max...`);

    // Create 3 sale listings for this product from different sellers
    for (let i = 0; i < Math.min(3, sellers.length); i++) {
      const seller = sellers[i];

      // Check if this seller already has a listing for this product
      const existingListing = await prisma.saleListing.findFirst({
        where: {
          sellerId: seller.id,
          productId: product.id,
          status: "ACTIVE",
        },
      });

      if (existingListing) {
        // Update the price to ensure it matches
        const newPrice = maxBuyPrice * (0.6 + Math.random() * 0.2);
        await prisma.saleListing.update({
          where: { id: existingListing.id },
          data: {
            askingPrice: Math.round(newPrice * 100) / 100,
            quantity: 50 + Math.floor(Math.random() * 150),
          },
        });
        console.log(
          `    ✅ Updated ${seller.name}: ${existingListing.quantity} → ${50 + Math.floor(Math.random() * 150)} tons @ €${newPrice.toFixed(2)}/ton`,
        );
      } else {
        // Create new listing
        const askingPrice = maxBuyPrice * (0.6 + Math.random() * 0.2);
        const quantity = 50 + Math.floor(Math.random() * 150);

        const listing = await prisma.saleListing.create({
          data: {
            sellerId: seller.id,
            productId: product.id,
            quantity,
            unit: ProductUnit.TON,
            askingPrice: Math.round(askingPrice * 100) / 100,
            status: ListingStatus.ACTIVE,
            harvestDate: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
          },
        });
        console.log(
          `    ✅ Created ${seller.name}: ${listing.quantity} tons @ €${listing.askingPrice}/ton`,
        );
      }
    }
  }

  // Verify matching
  console.log("\n\n🔍 Verifying matching possibilities...");

  for (const buyListing of buyListings) {
    const matchingSales = await prisma.saleListing.findMany({
      where: {
        productId: buyListing.productId,
        status: "ACTIVE",
        askingPrice: {
          lte: (buyListing.maxPricePerUnit?.toNumber() || 0) * 0.85,
        },
      },
      include: { seller: true },
    });

    console.log(
      `\n  ${buyListing.product.name}: ${matchingSales.length} matching sellers`,
    );
    if (matchingSales.length > 0) {
      console.log(`    Sellers available at good prices:`);
      matchingSales.slice(0, 3).forEach((sale) => {
        console.log(
          `      - ${sale.seller.name}: ${sale.quantity} tons @ €${sale.askingPrice}/ton`,
        );
      });
    }
  }

  // Summary
  const totalActiveSales = await prisma.saleListing.count({
    where: { status: "ACTIVE" },
  });

  console.log("\n\n✅ Done!");
  console.log(`📊 Total active sale listings: ${totalActiveSales}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
