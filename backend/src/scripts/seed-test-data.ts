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
  console.log("🌱 Starting test data seeding...");

  // Create transporter users
  const transporters = [];
  for (let i = 1; i <= 3; i++) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const transporter = await prisma.user.upsert({
      where: { email: `transporter${i}@agrotest.com` },
      update: {},
      create: {
        email: `transporter${i}@agrotest.com`,
        password: hashedPassword,
        name: `Test Transporter ${i}`,
        role: UserRole.TRANSPORTER,
        phoneNumber: `+123456789${i}0`,
        isActive: true,
      },
    });
    transporters.push(transporter);
    console.log(`✅ Created transporter: ${transporter.email}`);
  }

  // Create seller users and listings
  const sellers = [];
  const productData = [
    { name: "Soft Wheat", category: ProductCategory.SOFT_WHEAT },
    { name: "Corn Maize", category: ProductCategory.CORN_MAIZE },
    { name: "Barley", category: ProductCategory.BARLEY },
    { name: "Soybeans", category: ProductCategory.SOYBEAN_MEAL },
    { name: "Sunflower Seeds", category: ProductCategory.SUNFLOWER },
  ];

  for (let i = 1; i <= 5; i++) {
    const hashedPassword = await bcrypt.hash("password123", 10);
    const seller = await prisma.user.upsert({
      where: { email: `seller${i}@agrotest.com` },
      update: {},
      create: {
        email: `seller${i}@agrotest.com`,
        password: hashedPassword,
        name: `Test Farmer ${i}`,
        role: UserRole.FARMER,
        phoneNumber: `+123456789${i}1`,
        isActive: true,
      },
    });
    sellers.push(seller);
    console.log(`✅ Created seller: ${seller.email}`);

    // Create or find product
    const currentProduct = productData[i - 1];
    let product = await prisma.product.findFirst({
      where: {
        category: currentProduct.category,
      },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: currentProduct.name,
          displayName: currentProduct.name,
          category: currentProduct.category,
          description: `High quality ${currentProduct.name}`,
          defaultUnit: ProductUnit.TON,
          image: "https://example.com/product.jpg",
        },
      });
    }

    // Create sale listing for each seller with only required fields
    const saleListing = await prisma.saleListing.create({
      data: {
        sellerId: seller.id,
        productId: product.id,
        quantity: 100 + i * 50,
        unit: ProductUnit.TON,
        askingPrice: 250 + i * 10,
        harvestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: ListingStatus.ACTIVE,
      },
    });
    console.log(
      `✅ Created sale listing for ${product.name} by ${seller.name}`,
    );
  }

  console.log("✅ Test data seeding completed successfully!");
  console.log("\n📝 Summary:");
  console.log(`- Created ${transporters.length} transporters`);
  console.log(`- Created ${sellers.length} farmers/sellers`);
  console.log(`- Created ${sellers.length} sale listings`);
  console.log("\n🔐 Login credentials:");
  console.log("All users have password: password123");
  console.log(
    "Transporter emails: transporter1@agrotest.com, transporter2@agrotest.com, transporter3@agrotest.com",
  );
  console.log(
    "Seller emails: seller1@agrotest.com through seller5@agrotest.com",
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding test data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
