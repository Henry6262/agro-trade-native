import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Fixing unrealistic prices...\n");

  // Define reasonable price ranges per ton for agricultural products
  const reasonablePrices: { [key: string]: { min: number; max: number } } = {
    soft_wheat: { min: 280, max: 380 },
    durum_wheat: { min: 300, max: 400 },
    corn_maize: { min: 250, max: 350 },
    barley: { min: 240, max: 340 },
    oats: { min: 220, max: 320 },
    sunflower: { min: 450, max: 550 },
    rapeseed: { min: 480, max: 580 },
    peas: { min: 350, max: 450 },
    soybean_meal: { min: 400, max: 500 },
    wheat_bran: { min: 180, max: 280 },
    alfalfa: { min: 160, max: 260 },
    other: { min: 200, max: 400 },
  };

  // Fix buy listings with unrealistic prices
  const buyListings = await prisma.buyListing.findMany({
    include: { product: true },
  });

  console.log("📦 Fixing buy listing prices...");
  for (const listing of buyListings) {
    const productName = listing.product.name.toLowerCase().replace(" ", "_");
    const priceRange = reasonablePrices[productName] || reasonablePrices.other;
    const currentPrice = listing.maxPricePerUnit?.toNumber() || 0;

    if (
      currentPrice > priceRange.max * 2 ||
      currentPrice < priceRange.min / 2
    ) {
      // Price is unrealistic, fix it
      const newPrice =
        priceRange.min + Math.random() * (priceRange.max - priceRange.min);

      await prisma.buyListing.update({
        where: { id: listing.id },
        data: { maxPricePerUnit: Math.round(newPrice * 100) / 100 },
      });

      console.log(
        `  ✅ Fixed ${listing.product.name}: €${currentPrice}/ton → €${newPrice.toFixed(2)}/ton`,
      );
    }
  }

  // Now fix sale listings to match
  console.log("\n📦 Adjusting sale listing prices...");

  const saleListings = await prisma.saleListing.findMany({
    include: { product: true },
    where: { status: "ACTIVE" },
  });

  for (const listing of saleListings) {
    const productName = listing.product.name.toLowerCase().replace(" ", "_");
    const priceRange = reasonablePrices[productName] || reasonablePrices.other;
    const currentPrice = listing.askingPrice?.toNumber() || 0;

    // Check if price is unrealistic
    if (
      currentPrice > priceRange.max * 2 ||
      currentPrice < priceRange.min / 2
    ) {
      // Find corresponding buy listings for this product
      const buyListingsForProduct = buyListings.filter(
        (b) => b.productId === listing.productId,
      );

      if (buyListingsForProduct.length > 0) {
        const maxBuyPrice = Math.max(
          ...buyListingsForProduct.map(
            (b) => b.maxPricePerUnit?.toNumber() || 0,
          ),
        );
        // Set seller price to 70-80% of max buy price for good margins
        const newPrice = maxBuyPrice * (0.7 + Math.random() * 0.1);

        await prisma.saleListing.update({
          where: { id: listing.id },
          data: { askingPrice: Math.round(newPrice * 100) / 100 },
        });

        console.log(
          `  ✅ Fixed ${listing.product.name} seller price: €${currentPrice}/ton → €${newPrice.toFixed(2)}/ton`,
        );
      } else {
        // No buy listings, use reasonable range
        const newPrice = priceRange.min * 0.75; // 75% of minimum reasonable price

        await prisma.saleListing.update({
          where: { id: listing.id },
          data: { askingPrice: Math.round(newPrice * 100) / 100 },
        });

        console.log(
          `  ✅ Fixed ${listing.product.name} seller price: €${currentPrice}/ton → €${newPrice.toFixed(2)}/ton`,
        );
      }
    }
  }

  // Verify matches after fixing
  console.log("\n🔍 Verifying matches after price fixes...");

  const updatedBuyListings = await prisma.buyListing.findMany({
    include: { product: true, buyer: true },
    where: { status: "ACTIVE" },
  });

  for (const buyListing of updatedBuyListings) {
    const matchingSales = await prisma.saleListing.count({
      where: {
        productId: buyListing.productId,
        status: "ACTIVE",
        askingPrice: {
          lte: (buyListing.maxPricePerUnit?.toNumber() || 0) * 0.85,
        },
      },
    });

    console.log(
      `  ${buyListing.buyer.name} - ${buyListing.product.name}: ${matchingSales} matching sellers`,
    );
  }

  console.log("\n✅ Price fixing complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
