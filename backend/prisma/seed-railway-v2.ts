import { PrismaClient, ProductCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Railway database with initial data (v2 schema)...\n');

  try {
    // ==================== REGIONS ====================
    console.log('🗺️  Creating regions...');

    const northwestern = await prisma.region.upsert({
      where: {
        name_country: {
          name: 'Northwestern',
          country: 'Bulgaria'
        }
      },
      update: {},
      create: {
        name: 'Northwestern',
        country: 'Bulgaria',
        isActive: true,
      }
    });

    const southwestern = await prisma.region.upsert({
      where: {
        name_country: {
          name: 'Southwestern',
          country: 'Bulgaria'
        }
      },
      update: {},
      create: {
        name: 'Southwestern',
        country: 'Bulgaria',
        isActive: true,
      }
    });

    console.log('✅ Created 2 regions');

    // ==================== CITIES ====================
    console.log('🏙️  Creating cities...');

    const nwCities = ['Vidin', 'Montana', 'Vratsa', 'Pleven', 'Lovech'];
    const swCities = ['Sofia', 'Blagoevgrad', 'Pernik', 'Kyustendil'];

    for (const cityName of nwCities) {
      await prisma.city.upsert({
        where: {
          name_regionId: {
            name: cityName,
            regionId: northwestern.id
          }
        },
        update: {},
        create: {
          name: cityName,
          regionId: northwestern.id,
        }
      });
    }

    for (const cityName of swCities) {
      await prisma.city.upsert({
        where: {
          name_regionId: {
            name: cityName,
            regionId: southwestern.id
          }
        },
        update: {},
        create: {
          name: cityName,
          regionId: southwestern.id,
        }
      });
    }

    console.log('✅ Created 9 cities');

    // ==================== PRODUCTS ====================
    console.log('🌾 Creating products...');

    const products = [
      {
        category: ProductCategory.SOFT_WHEAT,
        name: 'Soft Wheat',
        displayName: 'Soft Wheat (Bread & Pastry)',
        description: 'High-quality soft wheat for bread and pastry production',
        harvestSeason: 'July-August',
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80',
      },
      {
        category: ProductCategory.DURUM_WHEAT,
        name: 'Durum Wheat',
        displayName: 'Durum Wheat (Pasta Grade)',
        description: 'Premium durum wheat for pasta production',
        harvestSeason: 'July-August',
        image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',
      },
      {
        category: ProductCategory.CORN_MAIZE,
        name: 'Corn',
        displayName: 'Corn (Maize)',
        description: 'Yellow corn for feed and processing',
        harvestSeason: 'September-October',
        image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80',
      },
      {
        category: ProductCategory.BARLEY,
        name: 'Barley',
        displayName: 'Barley (Malting & Feed)',
        description: 'Barley for malting and animal feed',
        harvestSeason: 'June-July',
        image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800&q=80',
      },
      {
        category: ProductCategory.SUNFLOWER,
        name: 'Sunflower',
        displayName: 'Sunflower Seeds',
        description: 'High oleic sunflower seeds for oil production',
        harvestSeason: 'August-September',
        image: 'https://images.unsplash.com/photo-1597848212624-e530580fb4d3?w=800&q=80',
      },
      {
        category: ProductCategory.RAPESEED,
        name: 'Rapeseed',
        displayName: 'Rapeseed (Canola)',
        description: 'Rapeseed for oil production and biodiesel',
        harvestSeason: 'June-July',
        image: 'https://images.unsplash.com/photo-1593923443656-e51c1f15f80e?w=800&q=80',
      },
    ];

    for (const productData of products) {
      await prisma.product.upsert({
        where: { category: productData.category },
        update: {
          image: productData.image,
        },
        create: {
          category: productData.category,
          name: productData.name,
          displayName: productData.displayName,
          description: productData.description,
          harvestSeason: productData.harvestSeason,
          image: productData.image,
          isActive: true,
        }
      });
    }

    console.log('✅ Created 6 products');

    // ==================== TRANSPORT COST SETTINGS ====================
    console.log('🚚 Creating transport cost settings...');

    await prisma.transportCostSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        baseRatePerKm: 0.15,
        flatbedMultiplier: 1.0,
        refrigeratedMultiplier: 1.3,
        tankerMultiplier: 1.2,
        containerMultiplier: 1.1,
        tier1MaxKm: 50,
        tier1Rate: 0.15,
        tier2MaxKm: 200,
        tier2Rate: 0.13,
        tier3Rate: 0.11,
        loadingCostPerTon: 0.50,
        urgencySurcharge: 0.3,
        isActive: true,
      }
    });

    console.log('✅ Created transport cost settings');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nSeeded data:');
    console.log('- Regions: Northwestern, Southwestern (Bulgaria)');
    console.log('- Cities: 9 cities (Vidin, Montana, Vratsa, Pleven, Lovech, Sofia, Blagoevgrad, Pernik, Kyustendil)');
    console.log('- Products: 6 agricultural products (Wheat, Durum Wheat, Corn, Barley, Sunflower, Rapeseed)');
    console.log('- Transport: Default cost settings configured');

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
