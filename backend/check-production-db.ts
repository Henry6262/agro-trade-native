import { PrismaClient } from '@prisma/client';

const databaseUrl = "postgres://3ca54ea7e50cdecd5942b3c91fe3bc303ef54ab75a02f0a321b6cac693e4c1dd:sk_IsdY9ZVx010kBUvvETGrW@db.prisma.io:5432/postgres?sslmode=require";

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
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    console.log(`👥 Users (${users.length}):`, users.map(u => u.email));
    
    // Check products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        status: true
      }
    });
    console.log(`\n🌾 Products (${products.length}):`, products.map(p => `${p.name} (${p.category})`));
    
    // Check regions
    const regions = await prisma.region.findMany({
      select: {
        name: true,
        country: true
      }
    });
    console.log(`\n🌍 Regions (${regions.length}):`, regions.map(r => `${r.name}, ${r.country}`));
    
    // Check regional prices
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

checkDatabase();