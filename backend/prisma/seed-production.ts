import { PrismaClient, UserRole, ProductUnit, ProductStatus, ProductCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Production database URL - will be set via environment variable
const databaseUrl = process.env.PROD_DATABASE_URL || "postgres://3ca54ea7e50cdecd5942b3c91fe3bc303ef54ab75a02f0a321b6cac693e4c1dd:sk_IsdY9ZVx010kBUvvETGrW@db.prisma.io:5432/postgres?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

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
    prisma.regionalPrice.deleteMany(),
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
  
  console.log(`✅ Created ${priceCount} regional prices`);
}

async function seedUsers() {
  console.log('👥 Creating users...');
  
  const hashedPassword = await bcrypt.hash('Demo2024!', 10);
  
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
      email: 'demo.farmer@agrotrade.com',
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
      email: 'demo.buyer@agrotrade.com',
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
  
  // Additional Buyer for variety
  const buyer2 = await prisma.user.create({
    data: {
      email: 'demo.processor@agrotrade.com',
      password: hashedPassword,
      role: UserRole.BUYER,
      name: 'Dimitri Georgiev',
      phoneNumber: '+359888000005',
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      onboardingCompleted: true,
      buyerProfile: {
        create: {
          companyName: 'Balkan Food Processing',
          businessType: 'Food Processor',
          preferredProducts: ['Sunflower', 'Rapeseed', 'Corn'],
          estimatedVolume: 3000,
          volumeUnit: 'tons/month',
          latitude: 43.2141,
          longitude: 27.9147,
          companyInfo: {
            create: {
              name: 'Balkan Food Processing SA',
              registrationNumber: 'BG400123789',
              vatNumber: 'BG400123789',
              address: '50 Industrial Park',
              city: 'Varna',
              country: 'Bulgaria',
              postalCode: '9000',
              phoneNumber: '+359888000005',
              email: 'supplies@balkanfood.bg',
            },
          },
        },
      },
    },
  });
  
  // Transporter in Varna (Northeastern region)
  const transporter = await prisma.user.create({
    data: {
      email: 'demo.transport@agrotrade.com',
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
  
  console.log('✅ Created 5 users with profiles');
  return { admin, farmer, buyer, buyer2, transporter };
}

async function seedProducts(farmerId: string) {
  console.log('🌾 Creating products...');
  
  const products = await prisma.product.createMany({
    data: [
      {
        farmerId,
        category: 'WHEAT',
        name: 'Premium Winter Wheat',
        description: 'High protein winter wheat, 13% protein content, EU Organic certified',
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
        description: 'Quality yellow corn for feed and processing, moisture content <14%',
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
        description: 'Sunflower seeds with 44% oil content, ideal for oil production',
        quantity: 200,
        unit: ProductUnit.TON,
        pricePerUnit: 510,
        location: 'Plovdiv, Bulgaria',
        harvestDate: new Date('2024-10-01'),
        status: ProductStatus.AVAILABLE,
      },
      {
        farmerId,
        category: 'BARLEY',
        name: 'Malting Barley',
        description: 'Premium malting barley, suitable for brewing industry',
        quantity: 300,
        unit: ProductUnit.TON,
        pricePerUnit: 220,
        location: 'Plovdiv, Bulgaria',
        harvestDate: new Date('2024-07-20'),
        status: ProductStatus.AVAILABLE,
      },
      {
        farmerId,
        category: 'RAPESEED',
        name: 'Canola/Rapeseed',
        description: 'High-quality rapeseed, 42% oil content, low erucic acid',
        quantity: 150,
        unit: ProductUnit.TON,
        pricePerUnit: 480,
        location: 'Plovdiv, Bulgaria',
        harvestDate: new Date('2024-08-10'),
        status: ProductStatus.AVAILABLE,
      },
      {
        farmerId,
        category: 'OATS',
        name: 'Milling Oats',
        description: 'Premium oats suitable for human consumption and animal feed',
        quantity: 250,
        unit: ProductUnit.TON,
        pricePerUnit: 200,
        location: 'Plovdiv, Bulgaria',
        harvestDate: new Date('2024-08-01'),
        status: ProductStatus.AVAILABLE,
      },
    ],
  });
  
  console.log('✅ Created 6 products');
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
      {
        transporterId,
        plateNumber: 'B9012EF',
        capacity: 30,
        unit: ProductUnit.TON,
        type: 'CURTAIN_SIDE',
        currentLocation: 'Plovdiv, Bulgaria',
        isAvailable: true,
      },
    ],
  });
  
  console.log('✅ Created 3 trucks');
}

async function main() {
  console.log('🌱 Starting PRODUCTION database seed...\n');
  console.log('📍 Database URL:', databaseUrl.substring(0, 50) + '...\n');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully\n');
    
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
    
    console.log('\n🎉 Production database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - ${BULGARIAN_REGIONS.length} Bulgarian regions`);
    console.log(`   - ${GREEK_REGIONS.length} Greek regions`);
    console.log(`   - ${PRODUCTS.length} product types`);
    console.log(`   - ${regions.length * PRODUCTS.length} regional prices`);
    console.log('   - 5 users (admin, farmer, 2 buyers, transporter)');
    console.log('   - 6 products');
    console.log('   - 3 trucks');
    
    console.log('\n📍 Bulgarian Regions:');
    BULGARIAN_REGIONS.forEach((region, i) => {
      console.log(`   ${i + 1}. ${region.name}: ${region.cities.join(', ')}`);
    });
    
    console.log('\n🔐 Login credentials:');
    console.log('   All users: Demo2024!');
    console.log('   - admin@agrotrade.com (Admin)');
    console.log('   - demo.farmer@agrotrade.com (Farmer)');
    console.log('   - demo.buyer@agrotrade.com (Buyer - Sofia)');
    console.log('   - demo.processor@agrotrade.com (Buyer - Varna)');
    console.log('   - demo.transport@agrotrade.com (Transporter)');
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
main();