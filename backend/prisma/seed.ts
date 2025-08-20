import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.trackingUpdate.deleteMany();
  await prisma.transportBid.deleteMany();
  await prisma.transportJob.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemConfig.deleteMany();

  // Create system configuration
  const configs = await Promise.all([
    prisma.systemConfig.create({
      data: {
        key: 'commission_rate',
        value: '0.05',
        type: 'number',
        description: 'Platform commission rate (5%)',
      },
    }),
    prisma.systemConfig.create({
      data: {
        key: 'default_currency',
        value: 'USD',
        type: 'string',
        description: 'Default platform currency',
      },
    }),
    prisma.systemConfig.create({
      data: {
        key: 'max_bid_duration',
        value: '48',
        type: 'number',
        description: 'Maximum bidding duration in hours',
      },
    }),
  ]);

  // Create categories
  const grains = await prisma.category.create({
    data: {
      name: 'Grains',
      description: 'Cereal grains and pulses',
      isActive: true,
    },
  });

  const vegetables = await prisma.category.create({
    data: {
      name: 'Vegetables',
      description: 'Fresh vegetables',
      isActive: true,
    },
  });

  const fruits = await prisma.category.create({
    data: {
      name: 'Fruits',
      description: 'Fresh fruits',
      isActive: true,
    },
  });

  // Create subcategories
  const wheat = await prisma.category.create({
    data: {
      name: 'Wheat',
      description: 'Wheat grains',
      parentId: grains.id,
      isActive: true,
    },
  });

  const corn = await prisma.category.create({
    data: {
      name: 'Corn',
      description: 'Corn/Maize',
      parentId: grains.id,
      isActive: true,
    },
  });

  const tomatoes = await prisma.category.create({
    data: {
      name: 'Tomatoes',
      description: 'Fresh tomatoes',
      parentId: vegetables.id,
      isActive: true,
    },
  });

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Premium Wheat',
        description: 'High quality wheat for bread making',
        unit: 'tons',
        categoryId: wheat.id,
        specifications: {
          moisture: '12-14%',
          protein: '11-13%',
          glutenContent: 'High',
        },
        qualityGrades: ['Grade A', 'Grade B', 'Grade C'],
        seasonality: {
          harvest: 'June-August',
          peak: 'July',
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Yellow Corn',
        description: 'Premium yellow corn for feed and food',
        unit: 'tons',
        categoryId: corn.id,
        specifications: {
          moisture: '13-15%',
          aflatoxin: '<20ppb',
        },
        qualityGrades: ['Grade 1', 'Grade 2', 'Grade 3'],
        seasonality: {
          harvest: 'September-November',
          peak: 'October',
        },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Fresh Tomatoes',
        description: 'Farm fresh tomatoes',
        unit: 'kg',
        categoryId: tomatoes.id,
        specifications: {
          size: 'Medium-Large',
          ripeness: '85-95%',
        },
        qualityGrades: ['Premium', 'Standard', 'Processing'],
        seasonality: {
          harvest: 'Year-round',
          peak: 'Summer',
        },
      },
    }),
  ]);

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@agrotrade.com',
      phone: '+1234567890',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      isProfileComplete: true,
      emailVerified: true,
      phoneVerified: true,
      address: '123 Admin St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      profile: {
        create: {
          description: 'Platform administrator',
        },
      },
    },
  });

  // Farmer/Seller
  const farmer1 = await prisma.user.create({
    data: {
      email: 'farmer1@example.com',
      phone: '+1234567891',
      firstName: 'John',
      lastName: 'Farmer',
      role: 'FARMER',
      status: 'ACTIVE',
      isProfileComplete: true,
      emailVerified: true,
      phoneVerified: true,
      companyName: 'Green Fields Farm',
      address: '456 Farm Road',
      city: 'Iowa City',
      state: 'IA',
      country: 'USA',
      zipCode: '52240',
      profile: {
        create: {
          farmSize: 500,
          cropsGrown: ['Wheat', 'Corn', 'Soybeans'],
          certifications: ['Organic', 'GAP Certified'],
          yearsExperience: 15,
          description: 'Family-owned farm specializing in organic grains',
          website: 'https://greenfields.farm',
        },
      },
    },
  });

  const farmer2 = await prisma.user.create({
    data: {
      email: 'farmer2@example.com',
      phone: '+1234567892',
      firstName: 'Sarah',
      lastName: 'Grower',
      role: 'FARMER',
      status: 'ACTIVE',
      isProfileComplete: true,
      emailVerified: true,
      companyName: 'Sunshine Vegetables',
      address: '789 Valley Road',
      city: 'Fresno',
      state: 'CA',
      country: 'USA',
      zipCode: '93650',
      profile: {
        create: {
          farmSize: 200,
          cropsGrown: ['Tomatoes', 'Peppers', 'Lettuce'],
          certifications: ['Organic'],
          yearsExperience: 10,
          description: 'Specialized in fresh organic vegetables',
        },
      },
    },
  });

  // Factory/Buyer
  const factory1 = await prisma.user.create({
    data: {
      email: 'factory1@example.com',
      phone: '+1234567893',
      firstName: 'Mike',
      lastName: 'Processor',
      role: 'FACTORY',
      status: 'ACTIVE',
      isProfileComplete: true,
      emailVerified: true,
      companyName: 'Food Processing Inc',
      businessLicense: 'FP123456',
      taxId: 'TAX789012',
      address: '321 Industrial Ave',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      zipCode: '60601',
      profile: {
        create: {
          industryType: 'Food Processing',
          processingCapacity: 1000,
          requiredCertifications: ['Organic', 'GAP Certified'],
          description: 'Large scale food processing facility',
          website: 'https://foodprocessing.com',
        },
      },
    },
  });

  const factory2 = await prisma.user.create({
    data: {
      email: 'factory2@example.com',
      phone: '+1234567894',
      firstName: 'Lisa',
      lastName: 'Miller',
      role: 'FACTORY',
      status: 'ACTIVE',
      isProfileComplete: true,
      emailVerified: true,
      companyName: 'Grain Mills Co',
      businessLicense: 'GM456789',
      address: '654 Mill Street',
      city: 'Kansas City',
      state: 'KS',
      country: 'USA',
      zipCode: '66101',
      profile: {
        create: {
          industryType: 'Grain Milling',
          processingCapacity: 500,
          requiredCertifications: [],
          description: 'Wheat and corn milling facility',
        },
      },
    },
  });

  // Transporters
  const transporter1 = await prisma.user.create({
    data: {
      email: 'transporter1@example.com',
      phone: '+1234567895',
      firstName: 'Tom',
      lastName: 'Trucker',
      role: 'TRANSPORTER',
      status: 'ACTIVE',
      isProfileComplete: true,
      emailVerified: true,
      companyName: 'Fast Logistics',
      businessLicense: 'TL987654',
      address: '987 Highway Rd',
      city: 'Dallas',
      state: 'TX',
      country: 'USA',
      zipCode: '75201',
      profile: {
        create: {
          vehicleTypes: ['Refrigerated Truck', 'Dry Van', 'Flatbed'],
          maxCapacity: 40,
          coverageAreas: ['Texas', 'Oklahoma', 'Louisiana', 'Arkansas'],
          licenseNumber: 'CDL123456',
          insuranceDetails: 'Full coverage up to $1M',
          description: 'Reliable regional transportation services',
        },
      },
    },
  });

  const transporter2 = await prisma.user.create({
    data: {
      email: 'transporter2@example.com',
      phone: '+1234567896',
      firstName: 'Amy',
      lastName: 'Hauler',
      role: 'TRANSPORTER',
      status: 'ACTIVE',
      isProfileComplete: true,
      emailVerified: true,
      companyName: 'Express Freight',
      address: '147 Transport Way',
      city: 'Atlanta',
      state: 'GA',
      country: 'USA',
      zipCode: '30301',
      profile: {
        create: {
          vehicleTypes: ['Box Truck', 'Semi Truck'],
          maxCapacity: 30,
          coverageAreas: ['Georgia', 'Florida', 'Alabama', 'South Carolina'],
          licenseNumber: 'CDL789012',
          description: 'Southeast regional freight services',
        },
      },
    },
  });

  // Create sell orders from farmers
  const sellOrder1 = await prisma.order.create({
    data: {
      type: 'SELL',
      status: 'ACTIVE',
      productId: products[0].id, // Premium Wheat
      categoryId: wheat.id,
      quantity: 100,
      unit: 'tons',
      pricePerUnit: 250,
      totalValue: 25000,
      qualityGrade: 'Grade A',
      specifications: {
        moisture: '12.5%',
        protein: '12%',
      },
      packagingType: 'Bulk',
      address: '456 Farm Road',
      city: 'Iowa City',
      state: 'IA',
      country: 'USA',
      sellerId: farmer1.id,
      availableFrom: new Date('2024-07-01'),
      availableTo: new Date('2024-08-31'),
      description: 'Premium quality wheat, freshly harvested',
      images: ['wheat-field.jpg', 'wheat-sample.jpg'],
      preferredBuyerTypes: ['FACTORY'],
      maxDistance: 500,
    },
  });

  const sellOrder2 = await prisma.order.create({
    data: {
      type: 'SELL',
      status: 'ACTIVE',
      productId: products[2].id, // Fresh Tomatoes
      categoryId: tomatoes.id,
      quantity: 5000,
      unit: 'kg',
      pricePerUnit: 2.5,
      totalValue: 12500,
      qualityGrade: 'Premium',
      specifications: {
        size: 'Large',
        ripeness: '90%',
      },
      packagingType: 'Crates',
      address: '789 Valley Road',
      city: 'Fresno',
      state: 'CA',
      country: 'USA',
      sellerId: farmer2.id,
      availableFrom: new Date('2024-06-15'),
      availableTo: new Date('2024-07-15'),
      description: 'Fresh organic tomatoes, perfect for processing',
      images: ['tomato-field.jpg'],
      preferredBuyerTypes: ['FACTORY'],
      maxDistance: 300,
    },
  });

  // Create buy orders from factories
  const buyOrder1 = await prisma.order.create({
    data: {
      type: 'BUY',
      status: 'ACTIVE',
      productId: products[0].id, // Premium Wheat
      categoryId: wheat.id,
      quantity: 150,
      unit: 'tons',
      pricePerUnit: 260,
      totalValue: 39000,
      qualityGrade: 'Grade A',
      specifications: {
        moisture: '<13%',
        protein: '>11%',
      },
      address: '654 Mill Street',
      city: 'Kansas City',
      state: 'KS',
      country: 'USA',
      buyerId: factory2.id,
      deliveryBy: new Date('2024-08-15'),
      description: 'Looking for high-quality wheat for milling',
      preferredSellerTypes: ['FARMER'],
      maxDistance: 600,
    },
  });

  const buyOrder2 = await prisma.order.create({
    data: {
      type: 'BUY',
      status: 'ACTIVE',
      productId: products[2].id, // Fresh Tomatoes
      categoryId: tomatoes.id,
      quantity: 10000,
      unit: 'kg',
      pricePerUnit: 2.8,
      totalValue: 28000,
      qualityGrade: 'Premium',
      specifications: {
        ripeness: '>85%',
      },
      address: '321 Industrial Ave',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      buyerId: factory1.id,
      deliveryBy: new Date('2024-07-01'),
      description: 'Need fresh tomatoes for processing',
      preferredSellerTypes: ['FARMER'],
      maxDistance: 800,
    },
  });

  // Create a matched deal
  const deal1 = await prisma.deal.create({
    data: {
      status: 'APPROVED',
      dealCode: 'AGT-2024-001',
      sellOrderId: sellOrder1.id,
      sellerId: farmer1.id,
      buyerId: factory2.id,
      quantity: 100,
      unit: 'tons',
      agreedPrice: 255,
      totalAmount: 25500,
      commissionRate: 0.05,
      commissionAmount: 1275,
      sellerAmount: 24225,
      qualityGrade: 'Grade A',
      specifications: {
        moisture: '12.5%',
        protein: '12%',
      },
      packagingType: 'Bulk',
      deliveryAddress: '654 Mill Street, Kansas City, KS 66101',
      deliveryDate: new Date('2024-08-10'),
      sellerApprovedAt: new Date('2024-06-20'),
      buyerApprovedAt: new Date('2024-06-21'),
      adminApprovedAt: new Date('2024-06-21'),
      contractTerms: 'Standard agricultural trade terms apply',
    },
  });

  // Create transport job for the deal
  const transportJob1 = await prisma.transportJob.create({
    data: {
      status: 'OPEN',
      jobCode: 'TRN-2024-001',
      dealId: deal1.id,
      createdById: admin.id,
      pickupAddress: '456 Farm Road, Iowa City, IA 52240',
      deliveryAddress: '654 Mill Street, Kansas City, KS 66101',
      cargoDescription: '100 tons of Grade A wheat',
      weight: 100,
      volume: 120,
      requiredVehicleType: 'Dry Van',
      temperatureControl: false,
      pickupDate: new Date('2024-08-08'),
      expectedDelivery: new Date('2024-08-10'),
      budgetRange: {
        min: 2000,
        max: 3000,
      },
    },
  });

  // Create transport bids
  const bid1 = await prisma.transportBid.create({
    data: {
      status: 'PENDING',
      transportJobId: transportJob1.id,
      bidderId: transporter1.id,
      proposedPrice: 2500,
      estimatedDelivery: new Date('2024-08-09T18:00:00'),
      vehicleDetails: {
        type: 'Dry Van',
        capacity: '40 tons',
        plateNumber: 'TX-123-ABC',
      },
      message: 'Can deliver within 2 days with tracking',
    },
  });

  const bid2 = await prisma.transportBid.create({
    data: {
      status: 'PENDING',
      transportJobId: transportJob1.id,
      bidderId: transporter2.id,
      proposedPrice: 2300,
      estimatedDelivery: new Date('2024-08-10T10:00:00'),
      vehicleDetails: {
        type: 'Semi Truck',
        capacity: '35 tons',
        plateNumber: 'GA-456-DEF',
      },
      message: 'Competitive pricing with insurance',
    },
  });

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      {
        type: 'DEAL_CREATED',
        title: 'New Deal Created',
        message: 'A new deal AGT-2024-001 has been created for your wheat order',
        userId: farmer1.id,
        data: { dealId: deal1.id },
      },
      {
        type: 'TRANSPORT_BID_RECEIVED',
        title: 'New Transport Bid',
        message: 'You have received a new bid for transport job TRN-2024-001',
        userId: admin.id,
        data: { jobId: transportJob1.id, bidId: bid1.id },
      },
    ],
  });

  console.log('✅ Database seed completed successfully!');
  console.log('📊 Created:');
  console.log(`   - ${configs.length} system configurations`);
  console.log(`   - 3 main categories and 3 subcategories`);
  console.log(`   - ${products.length} products`);
  console.log(`   - 7 users (1 admin, 2 farmers, 2 factories, 2 transporters)`);
  console.log(`   - 2 sell orders and 2 buy orders`);
  console.log(`   - 1 approved deal`);
  console.log(`   - 1 transport job with 2 bids`);
  console.log(`   - 2 notifications`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });