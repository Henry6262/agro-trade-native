import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create regions (Bulgarian NUTS-2 regions)
  console.log("📍 Creating regions...");
  const regions = await Promise.all([
    prisma.region.upsert({
      where: {
        name_country: {
          name: "North-Western",
          country: "Bulgaria",
        },
      },
      update: {},
      create: { name: "North-Western", country: "Bulgaria" },
    }),
    prisma.region.upsert({
      where: {
        name_country: {
          name: "North-Central",
          country: "Bulgaria",
        },
      },
      update: {},
      create: { name: "North-Central", country: "Bulgaria" },
    }),
    prisma.region.upsert({
      where: {
        name_country: {
          name: "North-Eastern",
          country: "Bulgaria",
        },
      },
      update: {},
      create: { name: "North-Eastern", country: "Bulgaria" },
    }),
    prisma.region.upsert({
      where: {
        name_country: {
          name: "South-Eastern",
          country: "Bulgaria",
        },
      },
      update: {},
      create: { name: "South-Eastern", country: "Bulgaria" },
    }),
    prisma.region.upsert({
      where: {
        name_country: {
          name: "South-Central",
          country: "Bulgaria",
        },
      },
      update: {},
      create: { name: "South-Central", country: "Bulgaria" },
    }),
    prisma.region.upsert({
      where: {
        name_country: {
          name: "South-Western",
          country: "Bulgaria",
        },
      },
      update: {},
      create: { name: "South-Western", country: "Bulgaria" },
    }),
  ]);

  console.log(`✅ Created ${regions.length} regions`);

  // Create cities
  console.log("🏙️  Creating cities...");
  const cities = await Promise.all([
    // North-Western
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Sofia",
          regionId: regions[0].id,
        },
      },
      update: {},
      create: {
        name: "Sofia",
        regionId: regions[0].id,
      },
    }),
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Vidin",
          regionId: regions[0].id,
        },
      },
      update: {},
      create: {
        name: "Vidin",
        regionId: regions[0].id,
      },
    }),
    // North-Central
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Pleven",
          regionId: regions[1].id,
        },
      },
      update: {},
      create: {
        name: "Pleven",
        regionId: regions[1].id,
      },
    }),
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Ruse",
          regionId: regions[1].id,
        },
      },
      update: {},
      create: {
        name: "Ruse",
        regionId: regions[1].id,
      },
    }),
    // North-Eastern
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Varna",
          regionId: regions[2].id,
        },
      },
      update: {},
      create: {
        name: "Varna",
        regionId: regions[2].id,
      },
    }),
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Dobrich",
          regionId: regions[2].id,
        },
      },
      update: {},
      create: {
        name: "Dobrich",
        regionId: regions[2].id,
      },
    }),
    // South-Eastern
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Burgas",
          regionId: regions[3].id,
        },
      },
      update: {},
      create: {
        name: "Burgas",
        regionId: regions[3].id,
      },
    }),
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Sliven",
          regionId: regions[3].id,
        },
      },
      update: {},
      create: {
        name: "Sliven",
        regionId: regions[3].id,
      },
    }),
    // South-Central
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Plovdiv",
          regionId: regions[4].id,
        },
      },
      update: {},
      create: {
        name: "Plovdiv",
        regionId: regions[4].id,
      },
    }),
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Stara Zagora",
          regionId: regions[4].id,
        },
      },
      update: {},
      create: {
        name: "Stara Zagora",
        regionId: regions[4].id,
      },
    }),
    // South-Western
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Blagoevgrad",
          regionId: regions[5].id,
        },
      },
      update: {},
      create: {
        name: "Blagoevgrad",
        regionId: regions[5].id,
      },
    }),
    prisma.city.upsert({
      where: {
        name_regionId: {
          name: "Pernik",
          regionId: regions[5].id,
        },
      },
      update: {},
      create: {
        name: "Pernik",
        regionId: regions[5].id,
      },
    }),
  ]);

  console.log(`✅ Created ${cities.length} cities`);

  // Create products
  console.log("🌾 Creating products...");
  const products = await Promise.all([
    prisma.product.upsert({
      where: { name: "Soft Wheat" },
      update: {},
      create: {
        name: "Soft Wheat",
        category: "SOFT_WHEAT",
        displayName: "Soft Wheat",
        description: "High-quality soft wheat grain for pastry and cake flour",
      },
    }),
    prisma.product.upsert({
      where: { name: "Corn" },
      update: {},
      create: {
        name: "Corn",
        category: "CORN_MAIZE",
        displayName: "Corn / Maize",
        description: "Yellow corn for feed and consumption",
      },
    }),
    prisma.product.upsert({
      where: { name: "Sunflower Seeds" },
      update: {},
      create: {
        name: "Sunflower Seeds",
        category: "SUNFLOWER",
        displayName: "Sunflower Seeds",
        description: "Premium sunflower seeds for oil production",
      },
    }),
    prisma.product.upsert({
      where: { name: "Barley" },
      update: {},
      create: {
        name: "Barley",
        category: "BARLEY",
        displayName: "Barley",
        description: "Barley grain for brewing and feed",
      },
    }),
    prisma.product.upsert({
      where: { name: "Rapeseed" },
      update: {},
      create: {
        name: "Rapeseed",
        category: "RAPESEED",
        displayName: "Rapeseed",
        description: "Canola/rapeseed for oil production",
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Create test users (buyers and sellers)
  console.log("👥 Creating test users...");

  const hashedPassword = await bcrypt.hash("test123", 10);

  // Create buyer user
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@test.com" },
    update: {},
    create: {
      email: "buyer@test.com",
      password: hashedPassword,
      name: "Test Buyer",
      role: "BUYER",
    },
  });

  // Create seller users
  const seller1 = await prisma.user.upsert({
    where: { email: "seller1@test.com" },
    update: {},
    create: {
      email: "seller1@test.com",
      password: hashedPassword,
      name: "Sofia Farms Co.",
      role: "FARMER",
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: "seller2@test.com" },
    update: {},
    create: {
      email: "seller2@test.com",
      password: hashedPassword,
      name: "Varna Agricultural Ltd.",
      role: "FARMER",
    },
  });

  const seller3 = await prisma.user.upsert({
    where: { email: "seller3@test.com" },
    update: {},
    create: {
      email: "seller3@test.com",
      password: hashedPassword,
      name: "Plovdiv Harvest Group",
      role: "FARMER",
    },
  });

  console.log("✅ Created test users (1 buyer, 3 sellers)");

  // Create addresses for sellers
  console.log("📮 Creating addresses...");

  const seller1Address = await prisma.address.create({
    data: {
      userId: seller1.id,
      addressType: "FARM",
      street: "Farm Road 123",
      cityId: cities[0].id, // Sofia
      country: "Bulgaria",
      latitude: 42.6977,
      longitude: 23.3219,
      postalCode: "1000",
      isDefault: true,
    },
  });

  const seller2Address = await prisma.address.create({
    data: {
      userId: seller2.id,
      addressType: "FARM",
      street: "Agricultural Complex 45",
      cityId: cities[4].id, // Varna
      country: "Bulgaria",
      latitude: 43.2141,
      longitude: 27.9147,
      postalCode: "9000",
      isDefault: true,
    },
  });

  const seller3Address = await prisma.address.create({
    data: {
      userId: seller3.id,
      addressType: "FARM",
      street: "Harvest Lane 67",
      cityId: cities[8].id, // Plovdiv
      country: "Bulgaria",
      latitude: 42.1354,
      longitude: 24.7453,
      postalCode: "4000",
      isDefault: true,
    },
  });

  const buyerAddress = await prisma.address.create({
    data: {
      userId: buyer.id,
      addressType: "WAREHOUSE",
      street: "Industrial Zone 89",
      cityId: cities[0].id, // Sofia
      country: "Bulgaria",
      latitude: 42.6977,
      longitude: 23.3219,
      postalCode: "1000",
      isDefault: true,
    },
  });

  console.log("✅ Created addresses");

  // Create sale listings
  console.log("📦 Creating sale listings...");

  const saleListing1 = await prisma.saleListing.create({
    data: {
      sellerId: seller1.id,
      productId: products[0].id, // Soft Wheat
      quantity: 50,
      unit: "TON",
      askingPrice: 250,
      status: "ACTIVE",
      addressId: seller1Address.id,
    },
  });

  const saleListing2 = await prisma.saleListing.create({
    data: {
      sellerId: seller2.id,
      productId: products[0].id, // Soft Wheat
      quantity: 30,
      unit: "TON",
      askingPrice: 245,
      status: "ACTIVE",
      addressId: seller2Address.id,
    },
  });

  const saleListing3 = await prisma.saleListing.create({
    data: {
      sellerId: seller3.id,
      productId: products[1].id, // Corn
      quantity: 40,
      unit: "TON",
      askingPrice: 220,
      status: "ACTIVE",
      addressId: seller3Address.id,
    },
  });

  const saleListing4 = await prisma.saleListing.create({
    data: {
      sellerId: seller1.id,
      productId: products[2].id, // Sunflower Seeds
      quantity: 25,
      unit: "TON",
      askingPrice: 350,
      status: "ACTIVE",
      addressId: seller1Address.id,
    },
  });

  console.log("✅ Created 4 sale listings");

  // Create buy listings
  console.log("🛒 Creating buy listings...");

  const buyListing1 = await prisma.buyListing.create({
    data: {
      buyerId: buyer.id,
      productId: products[0].id, // Soft Wheat
      quantity: 100,
      unit: "TON",
      maxPricePerUnit: 260,
      neededBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "ACTIVE",
      deliveryAddressId: buyerAddress.id,
    },
  });

  const buyListing2 = await prisma.buyListing.create({
    data: {
      buyerId: buyer.id,
      productId: products[1].id, // Corn
      quantity: 50,
      unit: "TON",
      maxPricePerUnit: 230,
      neededBy: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      status: "ACTIVE",
      deliveryAddressId: buyerAddress.id,
    },
  });

  const buyListing3 = await prisma.buyListing.create({
    data: {
      buyerId: buyer.id,
      productId: products[2].id, // Sunflower Seeds
      quantity: 30,
      unit: "TON",
      maxPricePerUnit: 370,
      neededBy: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      status: "ACTIVE",
      deliveryAddressId: buyerAddress.id,
    },
  });

  console.log("✅ Created 3 buy listings");

  // Summary
  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   Regions: ${regions.length}`);
  console.log(`   Cities: ${cities.length}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Users: 4 (1 buyer, 3 sellers)`);
  console.log(`   Sale Listings: 4`);
  console.log(`   Buy Listings: 3`);
  console.log("\n✅ Database is ready for end-to-end testing!");
  console.log("\nTest Credentials:");
  console.log("   Buyer: buyer@test.com / test123");
  console.log("   Seller 1: seller1@test.com / test123");
  console.log("   Seller 2: seller2@test.com / test123");
  console.log("   Seller 3: seller3@test.com / test123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
