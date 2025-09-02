import { PrismaClient, UserRole, ProductUnit, TruckType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting simple database seed...');
  
  // Clean database
  console.log('🧹 Cleaning database...');
  await prisma.$transaction([
    prisma.truck.deleteMany(),
    prisma.product.deleteMany(),
    prisma.transporterProfile.deleteMany(),
    prisma.buyerProfile.deleteMany(),
    prisma.farmerProfile.deleteMany(),
    prisma.companyInfo.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create test users
  console.log('👤 Creating test users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Create a test farmer
  const farmer = await prisma.user.create({
    data: {
      email: 'farmer@test.com',
      name: 'Test Farmer',
      password: hashedPassword,
      role: UserRole.FARMER,
      isEmailVerified: true,
      farmerProfile: {
        create: {
          farmName: 'Test Farm',
          farmLocation: 'Sofia, Bulgaria',
          cropsGrown: ['wheat', 'corn'],
          yearsOfExperience: 10,
        },
      },
    },
  });

  // Create a test buyer
  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@test.com',
      name: 'Test Buyer',
      password: hashedPassword,
      role: UserRole.BUYER,
      isEmailVerified: true,
      buyerProfile: {
        create: {
          companyName: 'Test Trading Co',
          businessType: 'Wholesaler',
          preferredProducts: ['wheat', 'corn', 'sunflower'],
          estimatedVolume: 1000,
          volumeUnit: 'tons',
        },
      },
    },
  });

  // Create a test transporter
  const transporter = await prisma.user.create({
    data: {
      email: 'transporter@test.com',
      name: 'Test Transporter',
      password: hashedPassword,
      role: UserRole.TRANSPORTER,
      isEmailVerified: true,
      transporterProfile: {
        create: {
          companyName: 'Test Transport Ltd',
          licenseNumber: 'TR-12345',
          baseLocationAddress: 'Varna, Bulgaria',
          baseLocationLat: 43.2141,
          baseLocationLng: 27.9147,
        },
      },
    },
  });

  // Create some test products for the farmer
  console.log('📦 Creating test products...');
  
  await prisma.product.create({
    data: {
      name: 'Premium Wheat',
      category: 'WHEAT',
      quantity: 500,
      unit: ProductUnit.TON,
      pricePerUnit: 280,
      location: 'Sofia, Bulgaria',
      harvestDate: new Date('2024-08-01'),
      farmerId: farmer.id,
    },
  });

  await prisma.product.create({
    data: {
      name: 'Organic Corn',
      category: 'CORN',
      quantity: 300,
      unit: ProductUnit.TON,
      pricePerUnit: 320,
      location: 'Sofia, Bulgaria',
      harvestDate: new Date('2024-09-15'),
      farmerId: farmer.id,
    },
  });

  // Create some test trucks for the transporter
  console.log('🚚 Creating test trucks...');
  
  await prisma.truck.create({
    data: {
      plateNumber: 'BG-1234-AB',
      capacity: 25,
      type: TruckType.FLATBED,
      isAvailable: true,
      transporterId: transporter.id,
    },
  });

  await prisma.truck.create({
    data: {
      plateNumber: 'BG-5678-CD',
      capacity: 20,
      type: TruckType.REFRIGERATED,
      isAvailable: true,
      transporterId: transporter.id,
    },
  });

  console.log('✅ Simple seed completed successfully!');
  console.log('Test accounts created:');
  console.log('  - farmer@test.com (password: password123)');
  console.log('  - buyer@test.com (password: password123)');
  console.log('  - transporter@test.com (password: password123)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });