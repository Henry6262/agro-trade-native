import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying seeded data...\n');

  try {
    const countryCount = await prisma.countries.count();
    const regionCount = await prisma.regions.count();
    const cityCount = await prisma.cities.count();
    const productCount = await prisma.product_catalog.count();

    console.log('📊 Database Statistics:');
    console.log(`  - Countries: ${countryCount}`);
    console.log(`  - Regions: ${regionCount}`);
    console.log(`  - Cities: ${cityCount}`);
    console.log(`  - Products: ${productCount}\n`);

    if (countryCount > 0) {
      const countries = await prisma.countries.findMany({
        select: { name: true, code: true }
      });
      console.log('🌍 Countries:', countries.map(c => `${c.name} (${c.code})`).join(', '));
    }

    if (regionCount > 0) {
      const regions = await prisma.regions.findMany({
        include: { _count: { select: { cities: true } } }
      });
      console.log('🗺️  Regions:');
      regions.forEach(r => {
        console.log(`   - ${r.name} (${r.code}): ${r._count.cities} cities`);
      });
    }

    if (cityCount > 0) {
      const cities = await prisma.cities.findMany({
        select: { name: true, is_capital: true },
        orderBy: { population: 'desc' },
        take: 5
      });
      console.log('🏙️  Top 5 Cities by Population:');
      cities.forEach(c => {
        console.log(`   - ${c.name}${c.is_capital ? ' (Capital)' : ''}`);
      });
    }

    if (productCount > 0) {
      const products = await prisma.product_catalog.findMany({
        select: { name: true, display_name: true, category: true }
      });
      console.log('🌾 Products:');
      products.forEach(p => {
        console.log(`   - ${p.display_name} (${p.category})`);
      });
    }

    console.log('\n✅ Verification complete!');

    if (countryCount === 0 || regionCount === 0 || cityCount === 0 || productCount === 0) {
      console.log('⚠️  Warning: Some data is missing. Please check the seed script.');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error verifying data:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
