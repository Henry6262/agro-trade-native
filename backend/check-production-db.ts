import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to check the production database');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function checkDatabase() {
  console.log('🔍 Checking production database...\n');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    console.log(`👥 Users (${users.length}):`, users.map((user) => user.email));

    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        status: true,
      },
    });
    console.log(
      `\n🌾 Products (${products.length}):`,
      products.map((product) => `${product.name} (${product.category})`),
    );

    const regions = await prisma.region.findMany({
      select: {
        name: true,
        country: true,
      },
    });
    console.log(
      `\n🌍 Regions (${regions.length}):`,
      regions.map((region) => `${region.name}, ${region.country}`),
    );

    const priceCount = await prisma.regionalPrice.count();
    console.log(`\n💰 Regional Prices: ${priceCount}`);

    if (users.length === 0 || products.length === 0) {
      console.log('\n⚠️  WARNING: Database appears to be empty!');
      console.log('Run: npx ts-node prisma/seed-production.ts to seed the database');
    } else {
      console.log('\n✅ Database is populated and ready!');
    }
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

void checkDatabase();
