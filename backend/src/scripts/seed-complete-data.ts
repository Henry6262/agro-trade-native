import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive data seeding...\n");

  // Get all products
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products in database\n`);

  // Create more diverse sellers
  const sellerData = [
    // Existing sellers enhancement
    {
      email: "farm.sofia@agro.bg",
      name: "Sofia Farm Co.",
      phone: "+359881234567",
    },
    {
      email: "green.valley@agro.bg",
      name: "Green Valley Farm",
      phone: "+359881234568",
    },
    {
      email: "mountain.harvest@agro.bg",
      name: "Mountain Harvest",
      phone: "+359881234569",
    },
    {
      email: "river.fields@agro.bg",
      name: "River Fields Agriculture",
      phone: "+359881234570",
    },
    {
      email: "sunny.acres@agro.bg",
      name: "Sunny Acres Farm",
      phone: "+359881234571",
    },
    // New sellers for diversity
    {
      email: "golden.wheat@agro.bg",
      name: "Golden Wheat Farms",
      phone: "+359881234572",
    },
    {
      email: "organic.harvest@agro.bg",
      name: "Organic Harvest Co.",
      phone: "+359881234573",
    },
    {
      email: "prime.grains@agro.bg",
      name: "Prime Grains Ltd.",
      phone: "+359881234574",
    },
    {
      email: "nature.bounty@agro.bg",
      name: "Nature's Bounty Farm",
      phone: "+359881234575",
    },
    {
      email: "highland.crops@agro.bg",
      name: "Highland Crops",
      phone: "+359881234576",
    },
  ];

  const hashedPassword = await bcrypt.hash("password123", 10);

  console.log("👨‍🌾 Creating/updating sellers...");
  const sellers = [];

  for (const data of sellerData) {
    const seller = await prisma.user.upsert({
      where: { email: data.email },
      update: { name: data.name },
      create: {
        ...data,
        password: hashedPassword,
        role: "FARMER",
        addresses: {
          create: {
            addressType: "WAREHOUSE",
            street: `Farm Location ${data.name}`,
            country: "Bulgaria",
            postalCode: `${1000 + Math.floor(Math.random() * 8000)}`,
            latitude: 42.5 + Math.random() * 1.5,
            longitude: 23 + Math.random() * 2,
            isDefault: true,
          },
        },
      },
    });
    sellers.push(seller);
    console.log(`  ✅ Seller: ${seller.name}`);
  }

  // Get all buy listings to understand demand
  const buyListings = await prisma.buyListing.findMany({
    include: { product: true },
  });

  console.log("\n📦 Creating sale listings for all products...");

  // Ensure every product has at least 2-3 sellers
  for (const product of products) {
    const buyListingsForProduct = buyListings.filter(
      (b) => b.productId === product.id,
    );
    const maxBuyPrice = Math.max(
      ...buyListingsForProduct.map((b) => b.maxPricePerUnit?.toNumber() || 0),
    );

    // Create 2-3 sale listings per product
    const numListings = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < numListings; i++) {
      const seller = sellers[Math.floor(Math.random() * sellers.length)];

      // Check if this seller already has a listing for this product
      const existingListing = await prisma.saleListing.findFirst({
        where: {
          sellerId: seller.id,
          productId: product.id,
          status: "ACTIVE",
        },
      });

      if (!existingListing) {
        // Price should be 60-80% of max buyer price to ensure good margins
        const askingPrice =
          maxBuyPrice > 0
            ? maxBuyPrice * (0.6 + Math.random() * 0.2)
            : 350 + Math.random() * 100; // Default price range

        const listing = await prisma.saleListing.create({
          data: {
            sellerId: seller.id,
            productId: product.id,
            quantity: 50 + Math.floor(Math.random() * 150), // 50-200 tons
            unit: "TON",
            askingPrice: Math.round(askingPrice * 100) / 100,
            status: "ACTIVE",
            harvestDate: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ), // Within last 30 days
          },
        });

        console.log(
          `  ✅ ${seller.name}: ${product.name} - ${listing.quantity} tons @ €${listing.askingPrice}/ton`,
        );
      }
    }
  }

  // Create additional transporters
  console.log("\n🚚 Creating additional transporters...");

  const transporterData = [
    {
      email: "fast.logistics@transport.bg",
      name: "Fast Logistics Bulgaria",
      phone: "+359882345678",
    },
    {
      email: "cargo.express@transport.bg",
      name: "Cargo Express Ltd.",
      phone: "+359882345679",
    },
    {
      email: "green.wheels@transport.bg",
      name: "Green Wheels Transport",
      phone: "+359882345680",
    },
    {
      email: "swift.delivery@transport.bg",
      name: "Swift Delivery Services",
      phone: "+359882345681",
    },
    {
      email: "prime.movers@transport.bg",
      name: "Prime Movers Co.",
      phone: "+359882345682",
    },
  ];

  for (const data of transporterData) {
    const transporter = await prisma.user.upsert({
      where: { email: data.email },
      update: { name: data.name },
      create: {
        ...data,
        password: hashedPassword,
        role: "TRANSPORTER",
        addresses: {
          create: {
            addressType: "OFFICE",
            street: `Office ${data.name}`,
            country: "Bulgaria",
            postalCode: "1000",
            latitude: 42.6977,
            longitude: 23.3219,
            isDefault: true,
          },
        },
      },
    });
    console.log(`  ✅ Transporter: ${transporter.name}`);
  }

  // Verify matching possibilities
  console.log("\n🔍 Verifying matching possibilities...");

  for (const buyListing of buyListings) {
    const matchingSales = await prisma.saleListing.findMany({
      where: {
        productId: buyListing.productId,
        status: "ACTIVE",
        askingPrice: {
          lte: (buyListing.maxPricePerUnit?.toNumber() || 0) * 0.85,
        },
      },
      include: { seller: true, product: true },
    });

    console.log(`\n  Buy Listing: ${buyListing.product.name}`);
    console.log(`    Max Price: €${buyListing.maxPricePerUnit}/ton`);
    console.log(
      `    Required seller price (≤85%): €${(buyListing.maxPricePerUnit?.toNumber() || 0) * 0.85}/ton`,
    );
    console.log(`    Matching sellers: ${matchingSales.length}`);

    if (matchingSales.length > 0) {
      console.log("    ✅ Sellers available:");
      matchingSales.forEach((sale) => {
        console.log(
          `      - ${sale.seller.name}: ${sale.quantity} tons @ €${sale.askingPrice}/ton`,
        );
      });
    }
  }

  // Summary
  console.log("\n📊 Seeding Summary:");
  const totalSellers = await prisma.user.count({ where: { role: "FARMER" } });
  const totalTransporters = await prisma.user.count({
    where: { role: "TRANSPORTER" },
  });
  const totalSaleListings = await prisma.saleListing.count({
    where: { status: "ACTIVE" },
  });
  const totalBuyListings = await prisma.buyListing.count({
    where: { status: "ACTIVE" },
  });

  console.log(`  - Total Sellers: ${totalSellers}`);
  console.log(`  - Total Transporters: ${totalTransporters}`);
  console.log(`  - Active Sale Listings: ${totalSaleListings}`);
  console.log(`  - Active Buy Listings: ${totalBuyListings}`);

  console.log("\n✅ Comprehensive data seeding completed!");
  console.log("📝 All users have password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
