import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Resetting all prices to realistic values...\n");

  // Define realistic price ranges per ton for agricultural products in EUR
  const priceRanges: {
    [key: string]: {
      buyMin: number;
      buyMax: number;
      sellMin: number;
      sellMax: number;
    };
  } = {
    soft_wheat: { buyMin: 320, buyMax: 380, sellMin: 240, sellMax: 300 },
    durum_wheat: { buyMin: 350, buyMax: 420, sellMin: 260, sellMax: 330 },
    corn_maize: { buyMin: 280, buyMax: 350, sellMin: 210, sellMax: 280 },
    barley: { buyMin: 270, buyMax: 340, sellMin: 200, sellMax: 270 },
    oats: { buyMin: 250, buyMax: 320, sellMin: 180, sellMax: 250 },
    sunflower: { buyMin: 480, buyMax: 580, sellMin: 360, sellMax: 460 },
    rapeseed: { buyMin: 520, buyMax: 620, sellMin: 390, sellMax: 490 },
    peas: { buyMin: 380, buyMax: 480, sellMin: 285, sellMax: 380 },
    soybean_meal: { buyMin: 440, buyMax: 540, sellMin: 330, sellMax: 430 },
    wheat_bran: { buyMin: 200, buyMax: 280, sellMin: 150, sellMax: 220 },
    alfalfa: { buyMin: 180, buyMax: 260, sellMin: 135, sellMax: 200 },
    other: { buyMin: 250, buyMax: 400, sellMin: 180, sellMax: 320 },
  };

  // Reset all buy listing prices
  console.log("📦 Resetting buy listing prices...");
  const buyListings = await prisma.buyListing.findMany({
    include: { product: true, buyer: true },
  });

  for (const listing of buyListings) {
    const productName = listing.product.name.toLowerCase().replace(" ", "_");
    const range = priceRanges[productName] || priceRanges.other;

    // Set a random price within the buy range
    const newPrice =
      range.buyMin + Math.random() * (range.buyMax - range.buyMin);

    await prisma.buyListing.update({
      where: { id: listing.id },
      data: { maxPricePerUnit: Math.round(newPrice * 100) / 100 },
    });

    console.log(
      `  ✅ ${listing.buyer.name} - ${listing.product.name}: €${newPrice.toFixed(2)}/ton`,
    );
  }

  // Reset all sale listing prices
  console.log("\n📦 Resetting sale listing prices...");
  const saleListings = await prisma.saleListing.findMany({
    include: { product: true, seller: true },
    where: { status: "ACTIVE" },
  });

  for (const listing of saleListings) {
    const productName = listing.product.name.toLowerCase().replace(" ", "_");
    const range = priceRanges[productName] || priceRanges.other;

    // Set a random price within the sell range (which is lower than buy range for profit)
    const newPrice =
      range.sellMin + Math.random() * (range.sellMax - range.sellMin);

    await prisma.saleListing.update({
      where: { id: listing.id },
      data: { askingPrice: Math.round(newPrice * 100) / 100 },
    });

    console.log(
      `  ✅ ${listing.seller.name} - ${listing.product.name}: €${newPrice.toFixed(2)}/ton`,
    );
  }

  // Verify matches
  console.log("\n🔍 Verifying matches with new prices...\n");

  const updatedBuyListings = await prisma.buyListing.findMany({
    include: { product: true, buyer: true },
    where: { status: "ACTIVE" },
  });

  let totalMatches = 0;
  for (const buyListing of updatedBuyListings) {
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

    const profitMargin =
      buyListing.maxPricePerUnit && matchingSales.length > 0
        ? ((buyListing.maxPricePerUnit.toNumber() -
            (matchingSales[0].askingPrice?.toNumber() || 0)) /
            buyListing.maxPricePerUnit.toNumber()) *
          100
        : 0;

    console.log(`  ${buyListing.buyer.name} - ${buyListing.product.name}:`);
    console.log(`    Buy price: €${buyListing.maxPricePerUnit}/ton`);
    console.log(`    Matching sellers: ${matchingSales.length}`);

    if (matchingSales.length > 0) {
      console.log(
        `    Best seller price: €${matchingSales[0].askingPrice}/ton`,
      );
      console.log(`    Potential margin: ${profitMargin.toFixed(1)}%`);
      totalMatches += matchingSales.length;
    }
    console.log("");
  }

  console.log(`\n✅ Price reset complete!`);
  console.log(`📊 Total matches available: ${totalMatches}`);
  console.log(
    `💡 All prices are now within realistic ranges with good profit margins`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
