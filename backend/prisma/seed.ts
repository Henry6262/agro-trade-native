import { 
  PrismaClient, 
  ProductCategory,
  DataType,
  Importance,
  ProductUnit,
  UserRole
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed (core data only)...');
  
  // Clean database (only non-user data)
  console.log('🧹 Cleaning database...');
  await prisma.$transaction([
    prisma.listingSpec.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.buyListing.deleteMany(),
    prisma.saleListing.deleteMany(),
    prisma.productSpecTemplate.deleteMany(),
    prisma.regionalPrice.deleteMany(),
    prisma.product.deleteMany(),
    prisma.specificationType.deleteMany(),
    prisma.address.deleteMany(),
    prisma.city.deleteMany(),
    prisma.region.deleteMany(),
    prisma.truck.deleteMany(),
    prisma.company.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ==================== REGIONS & CITIES ====================
  console.log('🌍 Creating regions and cities...');
  
  // Bulgarian Regions with Cities
  const regions = await prisma.$transaction([
    // Bulgaria - Northwestern
    prisma.region.create({
      data: {
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
    }),
    
    // Bulgaria - North Central
    prisma.region.create({
      data: {
        name: 'North Central',
        country: 'Bulgaria',
        cities: {
          create: [
            { name: 'Ruse' },
            { name: 'Razgrad' },
            { name: 'Silistra' },
            { name: 'Targovishte' },
            { name: 'Veliko Tarnovo' },
            { name: 'Gabrovo' },
          ]
        }
      }
    }),
    
    // Bulgaria - Northeastern
    prisma.region.create({
      data: {
        name: 'Northeastern',
        country: 'Bulgaria',
        cities: {
          create: [
            { name: 'Varna' },
            { name: 'Dobrich' },
            { name: 'Shumen' },
          ]
        }
      }
    }),
    
    // Bulgaria - Southwestern
    prisma.region.create({
      data: {
        name: 'Southwestern',
        country: 'Bulgaria',
        cities: {
          create: [
            { name: 'Sofia' },
            { name: 'Pernik' },
            { name: 'Kyustendil' },
            { name: 'Blagoevgrad' },
          ]
        }
      }
    }),
    
    // Bulgaria - South Central
    prisma.region.create({
      data: {
        name: 'South Central',
        country: 'Bulgaria',
        cities: {
          create: [
            { name: 'Plovdiv' },
            { name: 'Pazardzhik' },
            { name: 'Stara Zagora' },
            { name: 'Haskovo' },
            { name: 'Kardzhali' },
            { name: 'Smolyan' },
          ]
        }
      }
    }),
    
    // Bulgaria - Southeastern
    prisma.region.create({
      data: {
        name: 'Southeastern',
        country: 'Bulgaria',
        cities: {
          create: [
            { name: 'Burgas' },
            { name: 'Sliven' },
            { name: 'Yambol' },
          ]
        }
      }
    }),
    
    // Greece - Central Macedonia
    prisma.region.create({
      data: {
        name: 'Central Macedonia',
        country: 'Greece',
        cities: {
          create: [
            { name: 'Thessaloniki' },
            { name: 'Serres' },
            { name: 'Katerini' },
            { name: 'Kilkis' },
            { name: 'Veria' },
          ]
        }
      }
    }),
    
    // Greece - Attica
    prisma.region.create({
      data: {
        name: 'Attica',
        country: 'Greece',
        cities: {
          create: [
            { name: 'Athens' },
            { name: 'Piraeus' },
            { name: 'Elefsina' },
          ]
        }
      }
    }),
    
    // Greece - Thessaly
    prisma.region.create({
      data: {
        name: 'Thessaly',
        country: 'Greece',
        cities: {
          create: [
            { name: 'Larissa' },
            { name: 'Volos' },
            { name: 'Trikala' },
            { name: 'Karditsa' },
          ]
        }
      }
    }),
  ]);

  // ==================== SPECIFICATION TYPES ====================
  console.log('📋 Creating specification types...');
  
  const specTypes = await prisma.$transaction([
    // Universal specs
    prisma.specificationType.create({
      data: {
        code: 'moisture',
        name: 'Moisture Content',
        unit: '%',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    prisma.specificationType.create({
      data: {
        code: 'protein',
        name: 'Protein Content',
        unit: '%',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    prisma.specificationType.create({
      data: {
        code: 'oil_content',
        name: 'Oil Content',
        unit: '%',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    prisma.specificationType.create({
      data: {
        code: 'fiber',
        name: 'Fiber Content',
        unit: '%',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    prisma.specificationType.create({
      data: {
        code: 'purity',
        name: 'Purity / Foreign Matter',
        unit: '%',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    
    // Wheat specific
    prisma.specificationType.create({
      data: {
        code: 'hlw',
        name: 'Hectoliter Weight (Test Weight)',
        unit: 'kg/hl',
        dataType: DataType.NUMBER,
        minValue: 50,
        maxValue: 100,
      }
    }),
    prisma.specificationType.create({
      data: {
        code: 'falling_number',
        name: 'Falling Number',
        unit: 's',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 600,
      }
    }),
    prisma.specificationType.create({
      data: {
        code: 'gluten_strength',
        name: 'Gluten Strength',
        unit: '%',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    
    // Corn specific
    prisma.specificationType.create({
      data: {
        code: 'broken_kernels',
        name: 'Broken Kernels',
        unit: '%',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    prisma.specificationType.create({
      data: {
        code: 'aflatoxins',
        name: 'Aflatoxins',
        unit: 'ppb',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 1000,
      }
    }),
    
    // Barley specific
    prisma.specificationType.create({
      data: {
        code: 'germination',
        name: 'Germination Rate',
        unit: '%',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    
    // Oats specific
    prisma.specificationType.create({
      data: {
        code: 'groat',
        name: 'Groat Percentage (Kernel Yield)',
        unit: '%',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    prisma.specificationType.create({
      data: {
        code: 'test_weight',
        name: 'Test Weight',
        unit: 'kg/hl',
        dataType: DataType.NUMBER,
        minValue: 30,
        maxValue: 80,
      }
    }),
    
    // Sunflower specific
    prisma.specificationType.create({
      data: {
        code: 'hull',
        name: 'Hull Content',
        unit: '%',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    
    // Rapeseed/Canola specific
    prisma.specificationType.create({
      data: {
        code: 'glucosinolate',
        name: 'Glucosinolate Content',
        unit: 'μmol/g',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    
    // Peas specific
    prisma.specificationType.create({
      data: {
        code: 'split',
        name: 'Split/Damage Percentage',
        unit: '%',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 100,
      }
    }),
    
    // Wheat Bran specific
    prisma.specificationType.create({
      data: {
        code: 'particle_size',
        name: 'Particle Size',
        unit: 'mm',
        dataType: DataType.NUMBER,
        minValue: 0,
        maxValue: 10,
      }
    }),
  ]);

  // Get spec types by code for easier reference
  const specByCode = specTypes.reduce((acc, spec) => {
    acc[spec.code] = spec;
    return acc;
  }, {} as Record<string, typeof specTypes[0]>);

  // ==================== PRODUCTS WITH IMAGES ====================
  console.log('📦 Creating products with specifications...');
  
  const products = await prisma.$transaction([
    // 1. Soft Wheat
    prisma.product.create({
      data: {
        category: ProductCategory.SOFT_WHEAT,
        name: 'soft_wheat',
        displayName: 'Soft Wheat',
        description: 'Low-protein wheat ideal for pastries, cakes, and biscuits. Best for products requiring tender texture.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/soft_wheat_bfxdaa.png',
        harvestSeason: 'June - August',
        storageRecommendations: 'Store in cool, dry conditions. Maintain moisture below 14%.',
        priceRangeMin: 240,
        priceRangeMax: 320,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.protein.id, importance: Importance.CRITICAL, displayOrder: 1 },
            { specTypeId: specByCode.hlw.id, importance: Importance.IMPORTANT, displayOrder: 2 },
            { specTypeId: specByCode.falling_number.id, importance: Importance.OPTIONAL, displayOrder: 3 },
            { specTypeId: specByCode.moisture.id, importance: Importance.CRITICAL, displayOrder: 4 },
          ]
        }
      }
    }),
    
    // 2. Durum Wheat
    prisma.product.create({
      data: {
        category: ProductCategory.DURUM_WHEAT,
        name: 'durum_wheat',
        displayName: 'Durum Wheat',
        description: 'High-protein wheat perfect for pasta and semolina production. Golden color and high gluten content.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/durum_wheat_maskoy.png',
        harvestSeason: 'June - August',
        storageRecommendations: 'Keep moisture below 14%, maintain protein quality.',
        priceRangeMin: 280,
        priceRangeMax: 380,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.protein.id, importance: Importance.CRITICAL, displayOrder: 1 },
            { specTypeId: specByCode.gluten_strength.id, importance: Importance.CRITICAL, displayOrder: 2 },
            { specTypeId: specByCode.moisture.id, importance: Importance.CRITICAL, displayOrder: 3 },
          ]
        }
      }
    }),
    
    // 3. Corn/Maize
    prisma.product.create({
      data: {
        category: ProductCategory.CORN_MAIZE,
        name: 'corn_maize',
        displayName: 'Corn/Maize',
        description: 'Yellow corn for animal feed and food processing. Versatile grain for multiple uses.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192559/corn_jiuqv5.webp',
        harvestSeason: 'September - October',
        storageRecommendations: 'Moisture below 15%, ensure proper ventilation.',
        priceRangeMin: 260,
        priceRangeMax: 340,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.moisture.id, importance: Importance.CRITICAL, displayOrder: 1 },
            { specTypeId: specByCode.broken_kernels.id, importance: Importance.IMPORTANT, displayOrder: 2 },
            { specTypeId: specByCode.aflatoxins.id, importance: Importance.CRITICAL, displayOrder: 3 },
          ]
        }
      }
    }),
    
    // 4. Barley
    prisma.product.create({
      data: {
        category: ProductCategory.BARLEY,
        name: 'barley',
        displayName: 'Barley',
        description: 'Two-row and six-row barley for malting and animal feed. Essential for brewing industry.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192552/barley_utfuak.png',
        harvestSeason: 'June - July',
        storageRecommendations: 'Keep dry with moisture below 14%.',
        priceRangeMin: 220,
        priceRangeMax: 300,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.protein.id, importance: Importance.CRITICAL, displayOrder: 1 },
            { specTypeId: specByCode.germination.id, importance: Importance.CRITICAL, displayOrder: 2 },
            { specTypeId: specByCode.moisture.id, importance: Importance.CRITICAL, displayOrder: 3 },
          ]
        }
      }
    }),
    
    // 5. Oats
    prisma.product.create({
      data: {
        category: ProductCategory.OATS,
        name: 'oats',
        displayName: 'Oats',
        description: 'High-quality oats for human consumption and animal feed. Rich in fiber and nutrients.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/oats_g2ugm8.webp',
        harvestSeason: 'July - August',
        storageRecommendations: 'Store at moisture below 14%.',
        priceRangeMin: 200,
        priceRangeMax: 280,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.test_weight.id, importance: Importance.CRITICAL, displayOrder: 1 },
            { specTypeId: specByCode.groat.id, importance: Importance.IMPORTANT, displayOrder: 2 },
            { specTypeId: specByCode.moisture.id, importance: Importance.CRITICAL, displayOrder: 3 },
          ]
        }
      }
    }),
    
    // 6. Sunflower
    prisma.product.create({
      data: {
        category: ProductCategory.SUNFLOWER,
        name: 'sunflower',
        displayName: 'Sunflower Seeds',
        description: 'High-oil content sunflower seeds for oil production. Premium quality for crushing.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/sunflower_jbywaa.webp',
        harvestSeason: 'August - September',
        storageRecommendations: 'Store at moisture below 9%, protect from pests.',
        priceRangeMin: 420,
        priceRangeMax: 580,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.oil_content.id, importance: Importance.CRITICAL, displayOrder: 1 },
            { specTypeId: specByCode.moisture.id, importance: Importance.CRITICAL, displayOrder: 2 },
            { specTypeId: specByCode.hull.id, importance: Importance.IMPORTANT, displayOrder: 3 },
          ]
        }
      }
    }),
    
    // 7. Rapeseed/Canola
    prisma.product.create({
      data: {
        category: ProductCategory.RAPESEED,
        name: 'rapeseed',
        displayName: 'Rapeseed/Canola',
        description: 'Low-glucosinolate rapeseed for oil and biodiesel production. High-yielding oilseed.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192554/canola_wom5lk.png',
        harvestSeason: 'July - August',
        storageRecommendations: 'Maintain moisture below 9%, cool storage.',
        priceRangeMin: 450,
        priceRangeMax: 620,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.oil_content.id, importance: Importance.CRITICAL, displayOrder: 1 },
            { specTypeId: specByCode.glucosinolate.id, importance: Importance.IMPORTANT, displayOrder: 2 },
            { specTypeId: specByCode.moisture.id, importance: Importance.CRITICAL, displayOrder: 3 },
          ]
        }
      }
    }),
    
    // 8. Peas
    prisma.product.create({
      data: {
        category: ProductCategory.PEAS,
        name: 'peas',
        displayName: 'Peas',
        description: 'Yellow and green peas for human consumption and animal feed. High protein legume.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/peas_qjdrjq.webp',
        harvestSeason: 'June - July',
        storageRecommendations: 'Store at moisture below 14%.',
        priceRangeMin: 280,
        priceRangeMax: 380,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.protein.id, importance: Importance.CRITICAL, displayOrder: 1 },
            { specTypeId: specByCode.split.id, importance: Importance.IMPORTANT, displayOrder: 2 },
            { specTypeId: specByCode.moisture.id, importance: Importance.CRITICAL, displayOrder: 3 },
          ]
        }
      }
    }),
    
    // 9. Soybean Meal
    prisma.product.create({
      data: {
        category: ProductCategory.SOYBEAN_MEAL,
        name: 'soybean_meal',
        displayName: 'Soybean Meal',
        description: 'High-protein soybean meal for animal feed. Essential protein source in livestock nutrition.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192559/soybean_jzz3oq.jpg',
        storageRecommendations: 'Keep dry, protect from contamination.',
        priceRangeMin: 420,
        priceRangeMax: 520,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.protein.id, importance: Importance.CRITICAL, displayOrder: 1 },
            { specTypeId: specByCode.fiber.id, importance: Importance.IMPORTANT, displayOrder: 2 },
            { specTypeId: specByCode.moisture.id, importance: Importance.CRITICAL, displayOrder: 3 },
          ]
        }
      }
    }),
    
    // 10. Wheat Bran
    prisma.product.create({
      data: {
        category: ProductCategory.WHEAT_BRAN,
        name: 'wheat_bran',
        displayName: 'Wheat Bran',
        description: 'Wheat bran for animal feed supplementation. Rich in fiber and nutrients.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192552/wheat_bran_q6qze9.png',
        storageRecommendations: 'Store in dry conditions.',
        priceRangeMin: 180,
        priceRangeMax: 250,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.moisture.id, importance: Importance.CRITICAL, displayOrder: 1 },
            { specTypeId: specByCode.particle_size.id, importance: Importance.OPTIONAL, displayOrder: 2 },
            { specTypeId: specByCode.protein.id, importance: Importance.IMPORTANT, displayOrder: 3 },
          ]
        }
      }
    }),
    
    // 11. Alfalfa
    prisma.product.create({
      data: {
        category: ProductCategory.ALFALFA,
        name: 'alfalfa',
        displayName: 'Alfalfa Pellets',
        description: 'High-quality alfalfa pellets for livestock. Premium forage in pellet form.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192552/alfalfa_pallets_saqhco.webp',
        harvestSeason: 'May - September (multiple cuts)',
        storageRecommendations: 'Store in dry, ventilated area.',
        priceRangeMin: 220,
        priceRangeMax: 320,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.protein.id, importance: Importance.CRITICAL, displayOrder: 1 },
            { specTypeId: specByCode.fiber.id, importance: Importance.CRITICAL, displayOrder: 2 },
            { specTypeId: specByCode.moisture.id, importance: Importance.CRITICAL, displayOrder: 3 },
          ]
        }
      }
    }),
    
    // 12. Other
    prisma.product.create({
      data: {
        category: ProductCategory.OTHER,
        name: 'other',
        displayName: 'Other Cereals & Oilseeds',
        description: 'Various agricultural products not listed in main categories.',
        image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192556/other_gagfht.png',
        priceRangeMin: 200,
        priceRangeMax: 500,
        defaultUnit: ProductUnit.TON,
        specTemplates: {
          create: [
            { specTypeId: specByCode.moisture.id, importance: Importance.IMPORTANT, displayOrder: 1 },
            { specTypeId: specByCode.purity.id, importance: Importance.OPTIONAL, displayOrder: 2 },
            { specTypeId: specByCode.protein.id, importance: Importance.OPTIONAL, displayOrder: 3 },
            { specTypeId: specByCode.oil_content.id, importance: Importance.OPTIONAL, displayOrder: 4 },
          ]
        }
      }
    }),
  ]);

  // ==================== SYSTEM ADMIN USER ====================
  // A system admin user is required so that system-generated TradeNotes
  // (notifications) have a valid authorId (FK constraint on TradeNote.authorId).
  console.log('👤 Creating system admin user...');
  const systemAdminPassword = await bcrypt.hash('system-admin-placeholder', 10);
  await prisma.user.upsert({
    where: { email: 'system@agrotrade.internal' },
    update: {},
    create: {
      email: 'system@agrotrade.internal',
      name: 'System',
      password: systemAdminPassword,
      role: UserRole.ADMIN,
      isActive: true,
      isEmailVerified: true,
      onboardingCompleted: true,
    },
  });
  console.log('   ✅ System admin user ready (system@agrotrade.internal)');

  // ==================== INSPECTOR USERS ====================
  // FIXED: Add inspector users for testing and simulation
  console.log('🔍 Creating inspector users...');
  const inspectorPassword = await bcrypt.hash('inspector123', 10);
  
  await prisma.user.upsert({
    where: { email: 'inspector1@agrotrade.com' },
    update: {},
    create: {
      email: 'inspector1@agrotrade.com',
      name: 'Inspector One',
      password: inspectorPassword,
      phoneNumber: '+359888111001',
      role: UserRole.INSPECTOR,
      isActive: true,
      isEmailVerified: true,
      onboardingCompleted: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'inspector2@agrotrade.com' },
    update: {},
    create: {
      email: 'inspector2@agrotrade.com',
      name: 'Inspector Two',
      password: inspectorPassword,
      phoneNumber: '+359888111002',
      role: UserRole.INSPECTOR,
      isActive: true,
      isEmailVerified: true,
      onboardingCompleted: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'inspector3@agrotrade.com' },
    update: {},
    create: {
      email: 'inspector3@agrotrade.com',
      name: 'Inspector Three',
      password: inspectorPassword,
      phoneNumber: '+359888111003',
      role: UserRole.INSPECTOR,
      isActive: true,
      isEmailVerified: true,
      onboardingCompleted: true,
    },
  });

  console.log('   ✅ 3 inspector users created (inspector1-3@agrotrade.com, password: inspector123)');

  // ==================== SUMMARY ====================
  const regionCount = await prisma.region.count();
  const cityCount = await prisma.city.count();
  const productCount = await prisma.product.count();
  const specTypeCount = await prisma.specificationType.count();
  const specTemplateCount = await prisma.productSpecTemplate.count();

  console.log('\n✅ Core database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${regionCount} regions`);
  console.log(`   - ${cityCount} cities`);
  console.log(`   - ${productCount} products (all with Cloudinary images)`);
  console.log(`   - ${specTypeCount} specification types`);
  console.log(`   - ${specTemplateCount} product-specification links`);
  console.log('   - 1 system admin user');
  console.log('   - 3 inspector users');
  
  console.log('\n🌾 Products with specifications:');
  console.log('   1. Soft Wheat → Protein, HLW, Falling Number');
  console.log('   2. Durum Wheat → Protein, Gluten Strength');
  console.log('   3. Corn/Maize → Moisture, Broken Kernels, Aflatoxins');
  console.log('   4. Barley → Protein, Germination');
  console.log('   5. Oats → Test Weight, Groat %');
  console.log('   6. Sunflower → Oil %, Moisture, Hull %');
  console.log('   7. Rapeseed/Canola → Oil %, Glucosinolate');
  console.log('   8. Peas → Protein, Split %');
  console.log('   9. Soybean Meal → Protein, Fiber');
  console.log('   10. Wheat Bran → Moisture, Particle Size');
  console.log('   11. Alfalfa Pellets → Protein, Fiber, Moisture');
  console.log('   12. Other → Universal specs');
  
  console.log('\n🌍 Regions:');
  console.log('   Bulgaria: Northwestern, North Central, Northeastern, Southwestern, South Central, Southeastern');
  console.log('   Greece: Central Macedonia, Attica, Thessaly');
  
  console.log('\n✨ Ready for user onboarding!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });