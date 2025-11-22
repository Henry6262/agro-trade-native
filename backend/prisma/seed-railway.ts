import { PrismaClient, ProductCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Railway database with initial data...');

  try {
    // ==================== REGIONS & CITIES ====================
    console.log('🌍 Creating regions and cities...');

    const northwestern = await prisma.region.upsert({
      where: { name_country: { name: 'Northwestern', country: 'Bulgaria' } },
      update: {},
      create: {
        name: 'Northwestern',
        country: 'Bulgaria',
        cities: {
          create: [
            { name: 'Vidin' },
            { name: 'Montana' },
            { name: 'Vratsa' },
            { name: 'Pleven' },
            { name: 'Lovech' },
          ]
        }
      }
    });

    const southwestern = await prisma.region.upsert({
      where: { name_country: { name: 'Southwestern', country: 'Bulgaria' } },
      update: {},
      create: {
        name: 'Southwestern',
        country: 'Bulgaria',
        cities: {
          create: [
            { name: 'Sofia' },
            { name: 'Blagoevgrad' },
            { name: 'Pernik' },
            { name: 'Kyustendil' },
          ]
        }
      }
    });

    console.log('✅ Created 2 regions with cities');

    // ==================== PRODUCTS ====================
    console.log('🌾 Creating products...');

    const wheat = await prisma.product.upsert({
      where: { category: ProductCategory.SOFT_WHEAT },
      update: {},
      create: {
        name: 'Soft Wheat',
        category: ProductCategory.SOFT_WHEAT,
        displayName: 'Soft Wheat (Pastry Grade)',
        description: 'High-quality soft wheat for pastry and cake flour production',
      }
    });

    const durumWheat = await prisma.product.upsert({
      where: { category: ProductCategory.DURUM_WHEAT },
      update: {},
      create: {
        name: 'Durum Wheat',
        category: ProductCategory.DURUM_WHEAT,
        displayName: 'Durum Wheat (Pasta Grade)',
        description: 'Premium durum wheat for pasta production',
      }
    });

    const corn = await prisma.product.upsert({
      where: { category: ProductCategory.CORN_MAIZE },
      update: {},
      create: {
        name: 'Corn (Maize)',
        category: ProductCategory.CORN_MAIZE,
        displayName: 'Corn/Maize',
        description: 'Yellow corn for feed and processing',
      }
    });

    const barley = await prisma.product.upsert({
      where: { category: ProductCategory.BARLEY },
      update: {},
      create: {
        name: 'Barley',
        category: ProductCategory.BARLEY,
        displayName: 'Barley (Malting & Feed)',
        description: 'Barley for malting and animal feed',
      }
    });

    const sunflower = await prisma.product.upsert({
      where: { category: ProductCategory.SUNFLOWER },
      update: {},
      create: {
        name: 'Sunflower',
        category: ProductCategory.SUNFLOWER,
        displayName: 'Sunflower Seeds',
        description: 'High oleic sunflower seeds for oil production',
      }
    });

    console.log('✅ Created 5 products');
    console.log('🎉 Database seeding completed successfully!');
    console.log('\nSeeded data:');
    console.log('- Regions: Northwestern, Southwestern');
    console.log('- Cities: 9 cities across Bulgaria');
    console.log('- Products: Soft Wheat, Durum Wheat, Corn, Barley, Sunflower');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
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
