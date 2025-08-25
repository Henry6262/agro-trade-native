import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding simplified database...');

  // Clean existing data
  await prisma.$transaction([
    prisma.kycDocument.deleteMany(),
    prisma.product.deleteMany(),
    prisma.truck.deleteMany(),
    prisma.transporterProfile.deleteMany(),
    prisma.buyerProfile.deleteMany(),
    prisma.farmerProfile.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create test users (one of each role)
  const users = await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        email: 'admin@agrotrade.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
      },
    }),
    // Farmer
    prisma.user.create({
      data: {
        email: 'farmer@example.com',
        name: 'John Farmer',
        role: UserRole.FARMER,
        farmerProfile: {
          create: {
            farmName: 'Green Fields Farm',
            locationAddress: '123 Farm Road, Iowa',
            locationLat: 41.5868,
            locationLng: -93.6250,
            businessId: 'FARM-123456',
            iban: 'US12345678901234567890',
          },
        },
      },
    }),
    // Buyer
    prisma.user.create({
      data: {
        email: 'buyer@example.com',
        name: 'Alice Buyer',
        role: UserRole.BUYER,
        buyerProfile: {
          create: {
            companyName: 'Food Processing Inc',
            vatId: 'VAT-987654',
            billingAddress: {
              street: '456 Industrial Ave',
              city: 'Chicago',
              state: 'IL',
              zip: '60601',
              country: 'USA',
            },
          },
        },
      },
    }),
    // Transporter
    prisma.user.create({
      data: {
        email: 'transporter@example.com',
        name: 'Bob Transporter',
        role: UserRole.TRANSPORTER,
        transporterProfile: {
          create: {
            companyName: 'Quick Transport LLC',
            licenseNumber: 'DOT-123456',
            baseLocationAddress: '789 Highway Rd, Dallas',
            baseLocationLat: 32.7767,
            baseLocationLng: -96.7970,
            iban: 'US09876543210987654321',
          },
        },
      },
    }),
  ]);

  // Add a truck for the transporter
  await prisma.truck.create({
    data: {
      transporterId: users[3].id,
      plateNumber: 'TX-ABC-123',
      capacityKg: 20000,
      type: 'FLATBED',
      active: true,
    },
  });

  // Add a product for the farmer
  await prisma.product.create({
    data: {
      farmerId: users[1].id,
      category: 'WHEAT',
      quantity: 100,
      unit: 'TON',
      locationAddress: '123 Farm Road, Iowa',
      locationLat: 41.5868,
      locationLng: -93.6250,
      status: 'AVAILABLE',
    },
  });

  console.log('✅ Database seeded with minimal data!');
  console.log('📊 Created:');
  console.log(`   - 4 users (1 of each role)`);
  console.log(`   - 3 role profiles`);
  console.log(`   - 1 truck`);
  console.log(`   - 1 product`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });