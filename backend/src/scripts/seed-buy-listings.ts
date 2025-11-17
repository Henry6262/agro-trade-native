import {
  PrismaClient,
  UserRole,
  ListingStatus,
  ProductUnit,
  ProductCategory,
} from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting buy listings seed...");

  // Create buyer users first
  const buyers = [];
  for (let i = 1; i <= 3; i++) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const buyer = await prisma.user.upsert({
      where: { email: `buyer${i}@agrotest.com` },
      update: {},
      create: {
        email: `buyer${i}@agrotest.com`,
        password: hashedPassword,
        name: `Test Buyer ${i}`,
        role: UserRole.BUYER,
        phoneNumber: `+123456789${i}2`,
        isActive: true,
      },
    });
    buyers.push(buyer);
    console.log(`✅ Created buyer: ${buyer.email}`);
  }

  // Get existing products or create them
  const productCategories = [
    ProductCategory.SOFT_WHEAT,
    ProductCategory.CORN_MAIZE,
    ProductCategory.BARLEY,
  ];

  for (let i = 0; i < buyers.length; i++) {
    const buyer = buyers[i];
    const category = productCategories[i];

    // Find the product
    const product = await prisma.product.findFirst({
      where: { category },
    });

    if (!product) {
      console.log(`Product with category ${category} not found, skipping...`);
      continue;
    }

    // Create buy listing - minimal required fields only
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product.id,
        quantity: 200 + i * 50,
        unit: ProductUnit.TON,
        maxPricePerUnit: 300 + i * 20,
        neededBy: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        status: ListingStatus.ACTIVE,
      },
    });

    console.log(`✅ Created buy listing for ${product.name} by ${buyer.name}`);
    console.log(`   ID: ${buyListing.id}`);
  }

  console.log("✅ Buy listings seeding completed successfully!");
  console.log("\n📝 Summary:");
  console.log(`- Created ${buyers.length} buyers`);
  console.log(`- Created ${buyers.length} buy listings`);
  console.log("\n🔐 Login credentials:");
  console.log("All users have password: password123");
  console.log(
    "Buyer emails: buyer1@agrotest.com, buyer2@agrotest.com, buyer3@agrotest.com",
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding buy listings:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
