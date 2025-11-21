import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking existing listings...\n");

  // Check buy listings
  const buyListings = await prisma.buyListing.findMany({
    include: {
      product: true,
      buyer: true,
    },
  });

  console.log("📦 Buy Listings:");
  for (const listing of buyListings) {
    console.log(
      `  - ${listing.buyer.name}: ${listing.product.name} (${listing.product.id})`,
    );
    console.log(
      `    Quantity: ${listing.quantity}, Max Price: ${listing.maxPricePerUnit}`,
    );
  }

  // Check sale listings
  const saleListings = await prisma.saleListing.findMany({
    include: {
      product: true,
      seller: true,
    },
  });

  console.log("\n📦 Sale Listings:");
  for (const listing of saleListings) {
    console.log(
      `  - ${listing.seller.name}: ${listing.product.name} (${listing.product.id})`,
    );
    console.log(
      `    Quantity: ${listing.quantity}, Asking Price: ${listing.askingPrice}`,
    );
  }

  // Check for matching issues
  console.log("\n🔍 Checking for matching issues...");

  for (const buyListing of buyListings) {
    const matchingSales = saleListings.filter(
      (sale) =>
        sale.productId === buyListing.productId &&
        sale.status === "ACTIVE" &&
        (sale.askingPrice ? sale.askingPrice.toNumber() : 0) <=
          (buyListing.maxPricePerUnit
            ? buyListing.maxPricePerUnit.toNumber() * 0.85
            : 0),
    );

    console.log(
      `\n  Buy: ${buyListing.product.name} by ${buyListing.buyer.name}`,
    );
    console.log(`    Max Price: ${buyListing.maxPricePerUnit}`);
    console.log(
      `    Required seller price (≤85%): ${buyListing.maxPricePerUnit ? buyListing.maxPricePerUnit.toNumber() * 0.85 : 0}`,
    );
    console.log(`    Matching sellers: ${matchingSales.length}`);

    if (matchingSales.length === 0) {
      console.log(`    ❌ NO MATCHES - Reasons:`);

      const sameProdSales = saleListings.filter(
        (s) => s.productId === buyListing.productId,
      );
      if (sameProdSales.length === 0) {
        console.log(`      - No sellers have this product`);
      } else {
        for (const sale of sameProdSales) {
          if (sale.status !== "ACTIVE") {
            console.log(
              `      - ${sale.seller.name}: Status is ${sale.status}, not ACTIVE`,
            );
          } else if (!sale.askingPrice || !buyListing.maxPricePerUnit) {
            console.log(`      - ${sale.seller.name}: Missing price data`);
          } else if (
            sale.askingPrice.toNumber() >
            buyListing.maxPricePerUnit.toNumber() * 0.85
          ) {
            console.log(
              `      - ${sale.seller.name}: Price ${sale.askingPrice} > ${buyListing.maxPricePerUnit.toNumber() * 0.85} (85% threshold)`,
            );
          }
        }
      }
    } else {
      console.log(`    ✅ Found ${matchingSales.length} matches`);
    }
  }

  console.log("\n🔧 Fixing issues...\n");

  // Lower seller prices to ensure matches
  for (const saleListing of saleListings) {
    // Find corresponding buy listings for the same product
    const buyListingsForProduct = buyListings.filter(
      (b) => b.productId === saleListing.productId,
    );

    if (buyListingsForProduct.length > 0 && saleListing.askingPrice) {
      const highestBuyPrice = Math.max(
        ...buyListingsForProduct.map((b) => b.maxPricePerUnit?.toNumber() || 0),
      );
      const targetSellerPrice = highestBuyPrice * 0.75; // Set to 75% to ensure match (below 85% threshold)

      if (saleListing.askingPrice.toNumber() > targetSellerPrice) {
        await prisma.saleListing.update({
          where: { id: saleListing.id },
          data: { askingPrice: targetSellerPrice },
        });
        console.log(
          `  ✅ Updated ${saleListing.seller.name}'s price for ${saleListing.product.name} from ${saleListing.askingPrice} to ${targetSellerPrice}`,
        );
      }
    }
  }

  console.log("\n✅ Done! Re-checking matches...\n");

  // Re-check after fixes
  const updatedSaleListings = await prisma.saleListing.findMany({
    include: {
      product: true,
      seller: true,
    },
  });

  for (const buyListing of buyListings) {
    const matchingSales = updatedSaleListings.filter(
      (sale) =>
        sale.productId === buyListing.productId &&
        sale.status === "ACTIVE" &&
        (sale.askingPrice ? sale.askingPrice.toNumber() : 0) <=
          (buyListing.maxPricePerUnit
            ? buyListing.maxPricePerUnit.toNumber() * 0.85
            : 0),
    );

    console.log(
      `  ${buyListing.product.name}: ${matchingSales.length} matching sellers`,
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
