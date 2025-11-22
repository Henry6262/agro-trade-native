import { PrismaClient, ProductCategory } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Railway database with initial data...');

  try {
    // ==================== COUNTRIES ====================
    console.log('🌍 Creating country...');

    const bulgaria = await prisma.countries.upsert({
      where: { code: 'BG' },
      update: { updated_at: new Date() },
      create: {
        id: uuidv4(),
        name: 'Bulgaria',
        code: 'BG',
        flag_emoji: '🇧🇬',
        currency_code: 'BGN',
        is_active: true,
        sort_order: 1,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    console.log('✅ Created country: Bulgaria');

    // ==================== REGIONS ====================
    console.log('🗺️  Creating regions...');

    const northwestern = await prisma.regions.upsert({
      where: {
        country_id_name: {
          country_id: bulgaria.id,
          name: 'Northwestern'
        }
      },
      update: { updated_at: new Date() },
      create: {
        id: uuidv4(),
        country_id: bulgaria.id,
        name: 'Northwestern',
        code: 'BG-NW',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    const southwestern = await prisma.regions.upsert({
      where: {
        country_id_name: {
          country_id: bulgaria.id,
          name: 'Southwestern'
        }
      },
      update: { updated_at: new Date() },
      create: {
        id: uuidv4(),
        country_id: bulgaria.id,
        name: 'Southwestern',
        code: 'BG-SW',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });

    console.log('✅ Created 2 regions');

    // ==================== CITIES ====================
    console.log('🏙️  Creating cities...');

    const nwCities = [
      { name: 'Vidin', latitude: 43.9914, longitude: 22.8678, population: 48071 },
      { name: 'Montana', latitude: 43.4089, longitude: 23.2258, population: 43400 },
      { name: 'Vratsa', latitude: 43.2103, longitude: 23.5628, population: 60692 },
      { name: 'Pleven', latitude: 43.4170, longitude: 24.6167, population: 106954 },
      { name: 'Lovech', latitude: 43.1369, longitude: 24.7144, population: 36296 },
    ];

    const swCities = [
      { name: 'Sofia', latitude: 42.6977, longitude: 23.3219, population: 1236000, isCapital: true },
      { name: 'Blagoevgrad', latitude: 42.0116, longitude: 23.0905, population: 70881 },
      { name: 'Pernik', latitude: 42.6056, longitude: 23.0369, population: 80191 },
      { name: 'Kyustendil', latitude: 42.2858, longitude: 22.6908, population: 44532 },
    ];

    for (const cityData of nwCities) {
      await prisma.cities.upsert({
        where: {
          region_id_name: {
            region_id: northwestern.id,
            name: cityData.name
          }
        },
        update: { updated_at: new Date() },
        create: {
          id: uuidv4(),
          region_id: northwestern.id,
          name: cityData.name,
          latitude: cityData.latitude,
          longitude: cityData.longitude,
          population: cityData.population,
          is_capital: false,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }
      });
    }

    for (const cityData of swCities) {
      await prisma.cities.upsert({
        where: {
          region_id_name: {
            region_id: southwestern.id,
            name: cityData.name
          }
        },
        update: { updated_at: new Date() },
        create: {
          id: uuidv4(),
          region_id: southwestern.id,
          name: cityData.name,
          latitude: cityData.latitude,
          longitude: cityData.longitude,
          population: cityData.population,
          is_capital: cityData.isCapital || false,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }
      });
    }

    console.log('✅ Created 9 cities');

    // ==================== PRODUCTS ====================
    console.log('🌾 Creating products...');

    const products = [
      {
        category: ProductCategory.WHEAT,
        name: 'Wheat',
        display_name: 'Wheat',
        description: 'High-quality wheat for bread and pastry production',
      },
      {
        category: ProductCategory.CORN,
        name: 'Corn',
        display_name: 'Corn (Maize)',
        description: 'Yellow corn for feed and processing',
      },
      {
        category: ProductCategory.SUNFLOWER,
        name: 'Sunflower',
        display_name: 'Sunflower Seeds',
        description: 'High oleic sunflower seeds for oil production',
      },
      {
        category: ProductCategory.BARLEY,
        name: 'Barley',
        display_name: 'Barley',
        description: 'Barley for malting and animal feed',
      },
      {
        category: ProductCategory.RAPESEED,
        name: 'Rapeseed',
        display_name: 'Rapeseed (Canola)',
        description: 'Rapeseed for oil production and biodiesel',
      },
    ];

    for (const productData of products) {
      await prisma.product_catalog.upsert({
        where: { category: productData.category },
        update: { updated_at: new Date() },
        create: {
          id: uuidv4(),
          category: productData.category,
          name: productData.name,
          display_name: productData.display_name,
          description: productData.description,
          is_active: true,
          sort_order: 0,
          created_at: new Date(),
          updated_at: new Date(),
        }
      });
    }

    console.log('✅ Created 5 products');
    console.log('🎉 Database seeding completed successfully!');
    console.log('\nSeeded data:');
    console.log('- Country: Bulgaria');
    console.log('- Regions: Northwestern, Southwestern');
    console.log('- Cities: 9 cities across Bulgaria');
    console.log('- Products: Wheat, Corn, Sunflower, Barley, Rapeseed');

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
