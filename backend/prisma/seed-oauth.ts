import { PrismaClient, UserRole, ProductUnit, ProductCategory, TruckType, ProductStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting OAuth-compatible database seed...');
  
  // Clean database
  console.log('🧹 Cleaning database...');
  await prisma.$transaction([
    prisma.trucks.deleteMany(),
    prisma.products.deleteMany(),
    prisma.transporter_profiles.deleteMany(),
    prisma.buyer_profiles.deleteMany(),
    prisma.farmer_profiles.deleteMany(),
    prisma.company_info.deleteMany(),
    prisma.users.deleteMany(),
  ]);

  // Create test users (no passwords, as system uses OAuth)
  console.log('👤 Creating test users...');
  
  // Create a test farmer
  const farmer = await prisma.users.create({
    data: {
      id: uuidv4(),
      email: 'farmer@test.com',
      name: 'Test Farmer',
      role: UserRole.FARMER,
      google_id: 'google_farmer_123', // Mock Google ID
      updated_at: new Date(),
      farmer_profiles: {
        create: {
          farm_name: 'Test Farm',
          location_address: 'Sofia, Bulgaria',
          location_lat: 42.6977,
          location_lng: 23.3219,
          updated_at: new Date(),
        },
      },
    },
  });

  // Create a test buyer
  const buyer = await prisma.users.create({
    data: {
      id: uuidv4(),
      email: 'buyer@test.com',
      name: 'Test Buyer',
      role: UserRole.BUYER,
      google_id: 'google_buyer_123', // Mock Google ID
      updated_at: new Date(),
      buyer_profiles: {
        create: {
          company_name: 'Test Trading Co',
          billing_address: {
            street: '123 Trade Street',
            city: 'Plovdiv',
            country: 'Bulgaria',
          },
          updated_at: new Date(),
        },
      },
    },
  });

  // Create a test transporter
  const transporter = await prisma.users.create({
    data: {
      id: uuidv4(),
      email: 'transporter@test.com',
      name: 'Test Transporter',
      role: UserRole.TRANSPORTER,
      google_id: 'google_transporter_123', // Mock Google ID
      updated_at: new Date(),
      transporter_profiles: {
        create: {
          company_name: 'Test Transport Ltd',
          license_number: 'TR-12345',
          base_location_address: 'Varna, Bulgaria',
          base_location_lat: 43.2141,
          base_location_lng: 27.9147,
          updated_at: new Date(),
        },
      },
    },
  });

  // Create some test products for the farmer
  console.log('📦 Creating test products...');
  
  await prisma.products.create({
    data: {
      id: uuidv4(),
      name: 'Premium Wheat',
      category: ProductCategory.WHEAT,
      quantity: 500,
      unit: ProductUnit.TON,
      price_per_unit: 280,
      location: 'Sofia, Bulgaria',
      harvest_date: new Date('2024-08-01'),
      farmer_id: farmer.id,
      status: ProductStatus.AVAILABLE,
      updated_at: new Date(),
    },
  });

  await prisma.products.create({
    data: {
      id: uuidv4(),
      name: 'Organic Corn',
      category: ProductCategory.CORN,
      quantity: 300,
      unit: ProductUnit.TON,
      price_per_unit: 320,
      location: 'Sofia, Bulgaria',
      harvest_date: new Date('2024-09-15'),
      farmer_id: farmer.id,
      status: ProductStatus.AVAILABLE,
      updated_at: new Date(),
    },
  });

  await prisma.products.create({
    data: {
      id: uuidv4(),
      name: 'Sunflower Seeds',
      category: ProductCategory.SUNFLOWER,
      quantity: 200,
      unit: ProductUnit.TON,
      price_per_unit: 450,
      location: 'Sofia, Bulgaria',
      harvest_date: new Date('2024-09-01'),
      farmer_id: farmer.id,
      status: ProductStatus.AVAILABLE,
      updated_at: new Date(),
    },
  });

  // Create some test trucks for the transporter
  console.log('🚚 Creating test trucks...');
  
  await prisma.trucks.create({
    data: {
      id: uuidv4(),
      plate_number: 'BG-1234-AB',
      capacity_kg: 25000, // 25 tons
      type: TruckType.FLATBED,
      active: true,
      transporter_id: transporter.id,
      updated_at: new Date(),
    },
  });

  await prisma.trucks.create({
    data: {
      id: uuidv4(),
      plate_number: 'BG-5678-CD',
      capacity_kg: 20000, // 20 tons
      type: TruckType.REEFER,
      active: true,
      transporter_id: transporter.id,
      updated_at: new Date(),
    },
  });

  await prisma.trucks.create({
    data: {
      id: uuidv4(),
      plate_number: 'BG-9012-EF',
      capacity_kg: 30000, // 30 tons
      type: TruckType.TANKER,
      active: true,
      transporter_id: transporter.id,
      updated_at: new Date(),
    },
  });

  // Create product catalog entries if they don't exist
  console.log('📚 Creating product catalog...');
  
  const catalogEntries = [
    { category: ProductCategory.WHEAT, name: 'Wheat', display_name: 'Wheat' },
    { category: ProductCategory.CORN, name: 'Corn', display_name: 'Corn' },
    { category: ProductCategory.SUNFLOWER, name: 'Sunflower', display_name: 'Sunflower Seeds' },
    { category: ProductCategory.BARLEY, name: 'Barley', display_name: 'Barley' },
    { category: ProductCategory.OATS, name: 'Oats', display_name: 'Oats' },
    { category: ProductCategory.RAPESEED, name: 'Rapeseed', display_name: 'Rapeseed' },
  ];

  for (const entry of catalogEntries) {
    await prisma.product_catalog.upsert({
      where: { category: entry.category },
      update: {},
      create: {
        id: uuidv4(),
        category: entry.category,
        name: entry.name,
        display_name: entry.display_name,
        description: `High quality ${entry.display_name} from Bulgarian farms`,
        is_active: true,
        default_unit: ProductUnit.TON,
        price_range_min: 200,
        price_range_max: 500,
        updated_at: new Date(),
      },
    });
  }

  console.log('✅ OAuth-compatible seed completed successfully!');
  console.log('\nTest accounts created (OAuth mock IDs):');
  console.log('  - farmer@test.com (Google ID: google_farmer_123)');
  console.log('  - buyer@test.com (Google ID: google_buyer_123)');
  console.log('  - transporter@test.com (Google ID: google_transporter_123)');
  console.log('\n📦 Products created: 3');
  console.log('🚚 Trucks created: 3');
  console.log('📚 Product catalog entries: 6');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });