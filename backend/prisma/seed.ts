import { PrismaClient, UserRole, ProductUnit, ProductStatus, ProductCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Bulgarian regions with their major cities
const BULGARIAN_REGIONS = [
  {
    name: 'Northwestern',
    cities: ['Vidin', 'Montana', 'Vratsa', 'Pleven', 'Lovech'],
  },
  {
    name: 'North Central', 
    cities: ['Ruse', 'Razgrad', 'Silistra', 'Targovishte', 'Veliko Tarnovo'],
  },
  {
    name: 'Northeastern',
    cities: ['Varna', 'Dobrich', 'Shumen'],
  },
  {
    name: 'Southwestern',
    cities: ['Sofia', 'Pernik', 'Kyustendil', 'Blagoevgrad'],
  },
  {
    name: 'South Central',
    cities: ['Plovdiv', 'Pazardzhik', 'Stara Zagora', 'Haskovo', 'Kardzhali', 'Smolyan'],
  },
  {
    name: 'Southeastern',
    cities: ['Burgas', 'Sliven', 'Yambol'],
  },
];

// Greek regions with cities
const GREEK_REGIONS = [
  {
    name: 'Attica',
    cities: ['Athens', 'Piraeus'],
  },
  {
    name: 'Central Macedonia',
    cities: ['Thessaloniki', 'Serres'],
  },
];

// Product categories and base prices
const PRODUCTS: { category: ProductCategory; basePrice: number }[] = [
  { category: 'WHEAT', basePrice: 245 },
  { category: 'CORN', basePrice: 189 },
  { category: 'SUNFLOWER', basePrice: 510 },
  { category: 'BARLEY', basePrice: 220 },
  { category: 'OATS', basePrice: 200 },
  { category: 'RAPESEED', basePrice: 480 },
];

async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  // Delete in correct order to avoid foreign key constraints
  await prisma.$transaction([
    prisma.truck.deleteMany(),
    prisma.product.deleteMany(),
    // Note: RegionalPrice table doesn't exist in current migrations
    // prisma.regionalPrice.deleteMany(),
    prisma.transporterProfile.deleteMany(),
    prisma.buyerProfile.deleteMany(),
    prisma.farmerProfile.deleteMany(),
    prisma.companyInfo.deleteMany(),
    prisma.user.deleteMany(),
    prisma.region.deleteMany(),
  ]);
}

async function seedRegions() {
  console.log('🌍 Creating regions and cities...');
  
  const regions = [];
  
  // Create Bulgarian regions
  for (const regionData of BULGARIAN_REGIONS) {
    // Create main region (using first city as the region representative)
    const region = await prisma.region.create({
      data: {
        name: regionData.cities[0], // Use main city as region name for simplicity
        country: 'Bulgaria',
        isActive: true,
      },
    });
    regions.push(region);
    
    // For now, we'll just track the main city per region
    // In a real app, you'd have a separate cities table
  }
  
  // Create Greek regions
  for (const regionData of GREEK_REGIONS) {
    const region = await prisma.region.create({
      data: {
        name: regionData.cities[0],
        country: 'Greece',
        isActive: true,
      },
    });
    regions.push(region);
  }
  
  console.log(`✅ Created ${regions.length} regions`);
  return regions;
}

async function seedRegionalPrices(regions: any[]) {
  console.log('💰 Creating regional prices...');
  
  let priceCount = 0;
  
  // Note: RegionalPrice table doesn't exist in current migrations
  // Commenting out regional price seeding
  /*
  for (const region of regions) {
    for (const product of PRODUCTS) {
      // Add regional variation (±10% from base price)
      const variation = 0.9 + Math.random() * 0.2;
      const regionalPrice = Math.round(product.basePrice * variation * 100) / 100;
      
      await prisma.regionalPrice.create({
        data: {
          regionId: region.id,
          productCategory: product.category,
          pricePerUnit: regionalPrice,
          currency: 'EUR',
          unit: ProductUnit.TON,
        },
      });
      priceCount++;
    }
  }
  */
  
  console.log(`✅ Created ${priceCount} regional prices`);
}

async function seedUsers() {
  console.log('👥 Creating users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@agrotrade.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      name: 'System Administrator',
      phoneNumber: '+359888000001',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      onboardingCompleted: true,
    },
  });
  
  // Farmer in Plovdiv (South Central region)
  const farmer = await prisma.user.create({
    data: {
      email: 'farmer@example.com',
      password: hashedPassword,
      role: UserRole.FARMER,
      name: 'Ivan Petrov',
      phoneNumber: '+359888000002',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      onboardingCompleted: true,
      farmerProfile: {
        create: {
          farmName: 'Green Valley Farm',
          farmLocation: 'Plovdiv, Bulgaria',
          cropsGrown: ['Wheat', 'Corn', 'Sunflower'],
          latitude: 42.1354,
          longitude: 24.7453,
          certifications: ['EU Organic', 'GlobalGAP'],
          yearsOfExperience: 15,
          companyInfo: {
            create: {
              name: 'Green Valley Farm EOOD',
              registrationNumber: 'BG200123456',
              vatNumber: 'BG200123456',
              address: '15 Harvest Road',
              city: 'Plovdiv',
              country: 'Bulgaria',
              postalCode: '4000',
              phoneNumber: '+359888000002',
              email: 'contact@greenvalleyfarm.bg',
            },
          },
        },
      },
    },
  });
  
  // Buyer in Sofia (Southwestern region)
  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@example.com',
      password: hashedPassword,
      role: UserRole.BUYER,
      name: 'Maria Dimitrova',
      phoneNumber: '+359888000003',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      onboardingCompleted: true,
      buyerProfile: {
        create: {
          companyName: 'Sofia Grain Mills',
          businessType: 'Grain Mill',
          preferredProducts: ['Wheat', 'Corn', 'Barley'],
          estimatedVolume: 5000,
          volumeUnit: 'tons/month',
          latitude: 42.6977,
          longitude: 23.3219,
          companyInfo: {
            create: {
              name: 'Sofia Grain Mills AD',
              registrationNumber: 'BG100987654',
              vatNumber: 'BG100987654',
              address: '100 Industrial Zone',
              city: 'Sofia',
              country: 'Bulgaria',
              postalCode: '1000',
              phoneNumber: '+359888000003',
              email: 'procurement@sofiagrainmills.bg',
            },
          },
        },
      },
    },
  });
  
  // Transporter in Varna (Northeastern region)
  const transporter = await prisma.user.create({
    data: {
      email: 'transporter@example.com',
      password: hashedPassword,
      role: UserRole.TRANSPORTER,
      name: 'Georgi Ivanov',
      phoneNumber: '+359888000004',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      onboardingCompleted: true,
      transporterProfile: {
        create: {
          companyName: 'Fast Transport Varna',
          licenseNumber: 'BG-TRANS-2024-001',
          baseLocationAddress: 'Varna, Bulgaria',
          baseLocationLat: 43.2141,
          baseLocationLng: 27.9147,
          iban: 'BG80BNBG96611020345678',
          companyInfo: {
            create: {
              name: 'Fast Transport Varna EOOD',
              registrationNumber: 'BG300456789',
              vatNumber: 'BG300456789',
              address: '25 Port Road',
              city: 'Varna',
              country: 'Bulgaria',
              postalCode: '9000',
              phoneNumber: '+359888000004',
              email: 'dispatch@fasttransport.bg',
            },
          },
        },
      },
    },
  });
  
  console.log('✅ Created 4 users with profiles');
  return { admin, farmer, buyer, transporter };
}

async function seedProducts(farmerId: string) {
  console.log('🌾 Creating products...');
  
  const products = await prisma.product.createMany({
    data: [
      {
        farmerId,
        category: 'WHEAT',
        name: 'Premium Winter Wheat',
        description: 'High protein winter wheat, 13% protein content',
        quantity: 500,
        unit: ProductUnit.TON,
        pricePerUnit: 245,
        location: 'Plovdiv, Bulgaria',
        harvestDate: new Date('2024-07-15'),
        status: ProductStatus.AVAILABLE,
      },
      {
        farmerId,
        category: 'CORN',
        name: 'Yellow Corn Grade 2',
        description: 'Quality yellow corn for feed and processing',
        quantity: 1000,
        unit: ProductUnit.TON,
        pricePerUnit: 189,
        location: 'Plovdiv, Bulgaria',
        harvestDate: new Date('2024-09-01'),
        status: ProductStatus.AVAILABLE,
      },
      {
        farmerId,
        category: 'SUNFLOWER',
        name: 'High-Oil Sunflower Seeds',
        description: 'Sunflower seeds with 44% oil content',
        quantity: 200,
        unit: ProductUnit.TON,
        pricePerUnit: 510,
        location: 'Plovdiv, Bulgaria',
        harvestDate: new Date('2024-10-01'),
        status: ProductStatus.AVAILABLE,
      },
    ],
  });
  
  console.log('✅ Created 3 products');
}

async function seedTrucks(transporterId: string) {
  console.log('🚚 Creating trucks...');
  
  await prisma.truck.createMany({
    data: [
      {
        transporterId,
        plateNumber: 'B1234AB',
        capacity: 25,
        unit: ProductUnit.TON,
        type: 'FLATBED',
        currentLocation: 'Varna, Bulgaria',
        isAvailable: true,
      },
      {
        transporterId,
        plateNumber: 'B5678CD',
        capacity: 40,
        unit: ProductUnit.TON,
        type: 'REFRIGERATED',
        currentLocation: 'Sofia, Bulgaria',
        isAvailable: true,
      },
    ],
  });
  
  console.log('✅ Created 2 trucks');
}

async function main() {
  console.log('🌱 Starting database seed...\n');
  
  try {
    // Clean database
    await cleanDatabase();
    
    // Seed regions and prices
    const regions = await seedRegions();
    await seedRegionalPrices(regions);
    
    // Seed users
    const { farmer, transporter } = await seedUsers();
    
    // Seed products and trucks
    await seedProducts(farmer.id);
    await seedTrucks(transporter.id);
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${BULGARIAN_REGIONS.length} Bulgarian regions`);
    console.log(`   - ${GREEK_REGIONS.length} Greek regions`);
    console.log(`   - ${PRODUCTS.length} product types`);
    console.log(`   - ${regions.length * PRODUCTS.length} regional prices`);
    console.log('   - 4 users (admin, farmer, buyer, transporter)');
    console.log('   - 3 products');
    console.log('   - 2 trucks');
    
    console.log('\n📍 Bulgarian Regions:');
    BULGARIAN_REGIONS.forEach((region, i) => {
      console.log(`   ${i + 1}. ${region.name}: ${region.cities.join(', ')}`);
    });
    
    console.log('\n🔐 Login credentials:');
    console.log('   All users: password123');
    console.log('   - admin@agrotrade.com');
    console.log('   - farmer@example.com');
    console.log('   - buyer@example.com');
    console.log('   - transporter@example.com');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
main();