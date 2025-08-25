import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data in correct order
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.marketInsight.deleteMany(),
    prisma.priceHistory.deleteMany(),
    prisma.systemConfig.deleteMany(),
    prisma.document.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.review.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.trackingUpdate.deleteMany(),
    prisma.transportBid.deleteMany(),
    prisma.transportJob.deleteMany(),
    prisma.dispute.deleteMany(),
    prisma.dealMilestone.deleteMany(),
    prisma.deal.deleteMany(),
    prisma.orderInquiry.deleteMany(),
    prisma.order.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.session.deleteMany(),
    prisma.userProfile.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Wheat',
        slug: 'wheat',
        description: 'All wheat varieties',
        icon: '🌾',
        isActive: true,
        sortOrder: 1,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Grains',
        slug: 'grains',
        description: 'Cereal grains and corn',
        icon: '🌽',
        isActive: true,
        sortOrder: 2,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Oilseeds',
        slug: 'oilseeds',
        description: 'Oilseed crops',
        icon: '🌻',
        isActive: true,
        sortOrder: 3,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Legumes',
        slug: 'legumes',
        description: 'Peas and other legumes',
        icon: '🌱',
        isActive: true,
        sortOrder: 4,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Feed & Meal',
        slug: 'feed-meal',
        description: 'Animal feed and meal products',
        icon: '🌾',
        isActive: true,
        sortOrder: 5,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Other',
        slug: 'other',
        description: 'Other cereals and agricultural products',
        icon: '📦',
        isActive: true,
        sortOrder: 6,
      },
    }),
  ]);

  // Create Products with base images
  const products = await Promise.all([
    // Wheat varieties
    prisma.product.create({
      data: {
        sku: 'WHT-SOFT-001',
        name: 'Soft Wheat',
        slug: 'soft-wheat',
        description: 'High-quality soft wheat ideal for pastries, cakes, and cookies',
        images: ['/images/products/soft-wheat.jpg'],
        categoryId: categories[0].id,
        unit: 'tons',
        minimumOrder: 25,
        qualityGrades: ['Premium', 'Grade 1', 'Grade 2', 'Grade 3'],
        certifications: ['Non-GMO', 'Organic Available'],
        specifications: {
          protein: '8-11%',
          moisture: 'Max 14%',
          testWeight: 'Min 76 kg/hl',
          fallingNumber: 'Min 250 sec',
        },
        basePrice: 280,
        availableMonths: [6, 7, 8, 9],
        isActive: true,
        isFeatured: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'WHT-DURUM-001',
        name: 'Durum Wheat',
        slug: 'durum-wheat',
        description: 'Premium durum wheat perfect for pasta and semolina production',
        images: ['/images/products/durum-wheat.jpg'],
        categoryId: categories[0].id,
        unit: 'tons',
        minimumOrder: 25,
        qualityGrades: ['Grade 1', 'Grade 2', 'Grade 3'],
        certifications: ['Non-GMO', 'Organic Available'],
        specifications: {
          protein: 'Min 13%',
          moisture: 'Max 14%',
          vitreousness: 'Min 80%',
          testWeight: 'Min 78 kg/hl',
        },
        basePrice: 320,
        availableMonths: [7, 8, 9],
        isActive: true,
        isFeatured: true,
      },
    }),
    
    // Grains
    prisma.product.create({
      data: {
        sku: 'GRN-CORN-001',
        name: 'Corn / Maize',
        slug: 'corn-maize',
        description: 'Yellow corn suitable for feed, food processing, and ethanol production',
        images: ['/images/products/corn-maize.jpg'],
        categoryId: categories[1].id,
        unit: 'tons',
        minimumOrder: 30,
        qualityGrades: ['Grade 1', 'Grade 2', 'Grade 3'],
        certifications: ['Non-GMO Available'],
        specifications: {
          moisture: 'Max 14%',
          brokenKernels: 'Max 3%',
          foreignMatter: 'Max 2%',
          aflatoxin: 'Max 20 ppb',
        },
        basePrice: 240,
        availableMonths: [9, 10, 11],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'GRN-BARLEY-001',
        name: 'Barley',
        slug: 'barley',
        description: 'Feed and malting barley for brewing and animal nutrition',
        images: ['/images/products/barley.jpg'],
        categoryId: categories[1].id,
        unit: 'tons',
        minimumOrder: 25,
        qualityGrades: ['Malting Grade', 'Feed Grade'],
        certifications: ['Non-GMO'],
        specifications: {
          protein: '9-12%',
          moisture: 'Max 14%',
          germination: 'Min 95% (malting)',
          screenings: 'Max 3%',
        },
        basePrice: 220,
        availableMonths: [6, 7, 8],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'GRN-OATS-001',
        name: 'Oats',
        slug: 'oats',
        description: 'Premium oats for human consumption and animal feed',
        images: ['/images/products/oats.jpg'],
        categoryId: categories[1].id,
        unit: 'tons',
        minimumOrder: 20,
        qualityGrades: ['Milling Grade', 'Feed Grade'],
        certifications: ['Non-GMO', 'Organic Available'],
        specifications: {
          testWeight: 'Min 50 kg/hl',
          moisture: 'Max 14%',
          groats: 'Min 70%',
          foreignMatter: 'Max 2%',
        },
        basePrice: 200,
        availableMonths: [7, 8, 9],
        isActive: true,
      },
    }),
    
    // Oilseeds
    prisma.product.create({
      data: {
        sku: 'OIL-SUNF-001',
        name: 'Sunflower',
        slug: 'sunflower',
        description: 'High-oil content sunflower seeds for oil production',
        images: ['/images/products/sunflower.jpg'],
        categoryId: categories[2].id,
        unit: 'tons',
        minimumOrder: 20,
        qualityGrades: ['High Oleic', 'Standard'],
        certifications: ['Non-GMO'],
        specifications: {
          oilContent: 'Min 44%',
          moisture: 'Max 9%',
          impurities: 'Max 3%',
          acidValue: 'Max 3%',
        },
        basePrice: 450,
        availableMonths: [8, 9, 10],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'OIL-RAPE-001',
        name: 'Rapeseed / Canola',
        slug: 'rapeseed-canola',
        description: 'Premium rapeseed for oil production and biodiesel',
        images: ['/images/products/rapeseed-canola.jpg'],
        categoryId: categories[2].id,
        unit: 'tons',
        minimumOrder: 25,
        qualityGrades: ['00-Quality', 'Industrial'],
        certifications: ['Non-GMO', 'Organic Available'],
        specifications: {
          oilContent: 'Min 42%',
          moisture: 'Max 9%',
          erucicAcid: 'Max 2%',
          glucosinolates: 'Max 25 µmol/g',
        },
        basePrice: 480,
        availableMonths: [7, 8],
        isActive: true,
      },
    }),
    
    // Legumes
    prisma.product.create({
      data: {
        sku: 'LEG-PEAS-001',
        name: 'Peas',
        slug: 'peas',
        description: 'Yellow and green peas for food and feed applications',
        images: ['/images/products/peas.jpg'],
        categoryId: categories[3].id,
        unit: 'tons',
        minimumOrder: 20,
        qualityGrades: ['Food Grade', 'Feed Grade'],
        certifications: ['Non-GMO', 'Organic Available'],
        specifications: {
          protein: 'Min 23%',
          moisture: 'Max 14%',
          splits: 'Max 3%',
          foreignMatter: 'Max 1%',
        },
        basePrice: 350,
        availableMonths: [7, 8, 9],
        isActive: true,
      },
    }),
    
    // Feed & Meal
    prisma.product.create({
      data: {
        sku: 'FEED-SOYM-001',
        name: 'Soybean Meal',
        slug: 'soybean-meal',
        description: 'High-protein soybean meal for animal feed',
        images: ['/images/products/soybean-meal.jpg'],
        categoryId: categories[4].id,
        unit: 'tons',
        minimumOrder: 25,
        qualityGrades: ['Hi-Pro (48%)', 'Standard (44%)'],
        certifications: ['Non-GMO Available'],
        specifications: {
          protein: 'Min 44-48%',
          moisture: 'Max 12%',
          fiber: 'Max 7%',
          fat: '0.5-1.5%',
        },
        basePrice: 420,
        availableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'FEED-WHTB-001',
        name: 'Wheat Bran',
        slug: 'wheat-bran',
        description: 'Premium wheat bran for animal feed and food processing',
        images: ['/images/products/wheat-bran.jpg'],
        categoryId: categories[4].id,
        unit: 'tons',
        minimumOrder: 20,
        qualityGrades: ['Coarse', 'Fine'],
        certifications: ['Non-GMO'],
        specifications: {
          protein: 'Min 15%',
          fiber: '10-12%',
          moisture: 'Max 14%',
          starch: 'Max 20%',
        },
        basePrice: 180,
        availableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'FEED-ALFP-001',
        name: 'Alfalfa Pellets',
        slug: 'alfalfa-pellets',
        description: 'High-quality alfalfa pellets for livestock feed',
        images: ['/images/products/alfalfa-pellets.jpg'],
        categoryId: categories[4].id,
        unit: 'tons',
        minimumOrder: 20,
        qualityGrades: ['Premium', 'Standard'],
        certifications: ['Organic Available'],
        specifications: {
          protein: 'Min 17%',
          fiber: 'Max 32%',
          moisture: 'Max 12%',
          ash: 'Max 13%',
        },
        basePrice: 250,
        availableMonths: [5, 6, 7, 8, 9, 10],
        isActive: true,
      },
    }),
    
    // Other
    prisma.product.create({
      data: {
        sku: 'OTH-MIX-001',
        name: 'Other Cereals & Oilseeds',
        slug: 'other-cereals-oilseeds',
        description: 'Various other cereals and oilseeds available on request',
        images: ['/images/products/other-cereals.jpg'],
        categoryId: categories[5].id,
        unit: 'tons',
        minimumOrder: 20,
        qualityGrades: ['Varies by product'],
        certifications: ['Varies by product'],
        specifications: {
          note: 'Specifications vary by product type',
        },
        basePrice: 0, // Price on request
        availableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        isActive: true,
      },
    }),
  ]);

  // Create Test Users
  const users = await Promise.all([
    // Admin
    prisma.user.create({
      data: {
        email: 'admin@agrotrade.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        isProfileComplete: true,
        city: 'New York',
        state: 'NY',
        country: 'USA',
      },
    }),
    // Farmers
    prisma.user.create({
      data: {
        email: 'farmer1@example.com',
        firstName: 'John',
        lastName: 'Farmer',
        role: 'FARMER',
        status: 'ACTIVE',
        emailVerified: true,
        isProfileComplete: true,
        companyName: 'Prairie Grain Farms',
        city: 'Des Moines',
        state: 'IA',
        country: 'USA',
        profile: {
          create: {
            farmSize: 2500,
            cropsGrown: ['Soft Wheat', 'Corn', 'Soybeans'],
            certifications: ['Organic', 'USDA Certified', 'Non-GMO'],
            yearsExperience: 20,
            description: 'Large-scale grain farm specializing in wheat and corn production',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'farmer2@example.com',
        firstName: 'Sarah',
        lastName: 'Grower',
        role: 'FARMER',
        status: 'ACTIVE',
        emailVerified: true,
        isProfileComplete: true,
        companyName: 'Golden Harvest Co-op',
        city: 'Fargo',
        state: 'ND',
        country: 'USA',
        profile: {
          create: {
            farmSize: 3500,
            cropsGrown: ['Durum Wheat', 'Sunflower', 'Canola'],
            certifications: ['Non-GMO', 'GlobalGAP'],
            yearsExperience: 15,
            description: 'Cooperative specializing in durum wheat and oilseeds',
          },
        },
      },
    }),
    // Factories/Buyers
    prisma.user.create({
      data: {
        email: 'mill1@example.com',
        firstName: 'Mike',
        lastName: 'Miller',
        role: 'FACTORY',
        status: 'ACTIVE',
        emailVerified: true,
        isProfileComplete: true,
        companyName: 'Midwest Flour Mills',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        profile: {
          create: {
            industryType: 'Flour Milling',
            processingCapacity: 5000,
            requiredCerts: ['Non-GMO', 'HACCP'],
            purchaseVolume: 50000,
            description: 'Industrial flour mill processing soft and durum wheat',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'feed1@example.com',
        firstName: 'Lisa',
        lastName: 'Feeder',
        role: 'FACTORY',
        status: 'ACTIVE',
        emailVerified: true,
        isProfileComplete: true,
        companyName: 'Premium Feed Solutions',
        city: 'Omaha',
        state: 'NE',
        country: 'USA',
        profile: {
          create: {
            industryType: 'Animal Feed Production',
            processingCapacity: 3000,
            requiredCerts: ['Non-GMO'],
            purchaseVolume: 30000,
            description: 'Animal feed manufacturer specializing in cattle and poultry feed',
          },
        },
      },
    }),
    // Transporters
    prisma.user.create({
      data: {
        email: 'transport1@example.com',
        firstName: 'Tom',
        lastName: 'Hauler',
        role: 'TRANSPORTER',
        status: 'ACTIVE',
        emailVerified: true,
        isProfileComplete: true,
        companyName: 'Grain Express Logistics',
        city: 'Kansas City',
        state: 'KS',
        country: 'USA',
        profile: {
          create: {
            vehicleTypes: ['Grain Hopper', 'Dry Van', 'Flatbed'],
            fleetSize: 25,
            maxCapacity: 500,
            coverageAreas: ['KS', 'MO', 'OK', 'NE', 'IA'],
            licenseNumber: 'DOT-123456',
            description: 'Specialized grain transportation with modern hopper fleet',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'transport2@example.com',
        firstName: 'Nancy',
        lastName: 'Freight',
        role: 'TRANSPORTER',
        status: 'ACTIVE',
        emailVerified: true,
        isProfileComplete: true,
        companyName: 'Central Plains Transport',
        city: 'Denver',
        state: 'CO',
        country: 'USA',
        profile: {
          create: {
            vehicleTypes: ['Bulk Tanker', 'Hopper Bottom', 'Walking Floor'],
            fleetSize: 40,
            maxCapacity: 800,
            coverageAreas: ['CO', 'WY', 'NE', 'KS', 'NM', 'UT'],
            licenseNumber: 'DOT-789012',
            description: 'Regional bulk commodity transportation specialist',
          },
        },
      },
    }),
  ]);

  // Create Sample Orders for the new products
  const orders = await Promise.all([
    // Sell Orders (from Farmers)
    prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-001',
        type: 'SELL',
        status: 'ACTIVE',
        productId: products[0].id, // Soft Wheat
        categoryId: categories[0].id,
        quantity: 500,
        unit: 'tons',
        pricePerUnit: 285,
        totalValue: 142500,
        negotiable: true,
        qualityGrade: 'Premium',
        packagingType: 'Bulk',
        certRequired: ['Non-GMO'],
        address: '123 Prairie Road',
        city: 'Des Moines',
        state: 'IA',
        country: 'USA',
        latitude: 41.5868,
        longitude: -93.6250,
        sellerId: users[1].id,
        availableFrom: new Date('2024-07-01'),
        availableTo: new Date('2024-09-30'),
        harvestDate: new Date('2024-06-25'),
        description: 'Premium soft wheat, freshly harvested, ideal for pastry flour',
        tags: ['organic-available', 'bulk-discount', 'immediate-delivery'],
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-002',
        type: 'SELL',
        status: 'ACTIVE',
        productId: products[5].id, // Sunflower
        categoryId: categories[2].id,
        quantity: 200,
        unit: 'tons',
        pricePerUnit: 460,
        totalValue: 92000,
        negotiable: false,
        qualityGrade: 'High Oleic',
        packagingType: 'Bulk',
        address: '456 Harvest Lane',
        city: 'Fargo',
        state: 'ND',
        country: 'USA',
        latitude: 46.8772,
        longitude: -96.7898,
        sellerId: users[2].id,
        availableFrom: new Date('2024-09-01'),
        availableTo: new Date('2024-11-30'),
        harvestDate: new Date('2024-08-20'),
        description: 'High oleic sunflower seeds, excellent oil content',
        tags: ['high-oleic', 'non-gmo'],
      },
    }),
    // Buy Orders (from Factories)
    prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-003',
        type: 'BUY',
        status: 'ACTIVE',
        productId: products[1].id, // Durum Wheat
        categoryId: categories[0].id,
        quantity: 1000,
        unit: 'tons',
        pricePerUnit: 315,
        totalValue: 315000,
        negotiable: true,
        qualityGrade: 'Grade 1',
        certRequired: ['Non-GMO'],
        address: '789 Mill Street',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        latitude: 41.8781,
        longitude: -87.6298,
        buyerId: users[3].id,
        deliveryBy: new Date('2024-08-15'),
        description: 'Need high-quality durum wheat for pasta production',
        preferredPartners: ['certified-suppliers'],
        maxDistance: 800,
      },
    }),
    prisma.order.create({
      data: {
        orderNumber: 'ORD-2024-004',
        type: 'BUY',
        status: 'ACTIVE',
        productId: products[8].id, // Soybean Meal
        categoryId: categories[4].id,
        quantity: 300,
        unit: 'tons',
        pricePerUnit: 415,
        totalValue: 124500,
        negotiable: false,
        qualityGrade: 'Hi-Pro (48%)',
        address: '321 Feed Plant Road',
        city: 'Omaha',
        state: 'NE',
        country: 'USA',
        latitude: 41.2565,
        longitude: -95.9345,
        buyerId: users[4].id,
        deliveryBy: new Date('2024-07-20'),
        description: 'High-protein soybean meal for poultry feed formulation',
        tags: ['urgent', 'regular-buyer'],
        maxDistance: 500,
      },
    }),
  ]);

  // Create System Configuration
  await Promise.all([
    prisma.systemConfig.create({
      data: {
        key: 'platform_commission_rate',
        value: '0.05',
        type: 'number',
        description: 'Platform commission rate for transactions',
        category: 'fees',
        isPublic: false,
        isActive: true,
      },
    }),
    prisma.systemConfig.create({
      data: {
        key: 'min_order_value',
        value: '5000',
        type: 'number',
        description: 'Minimum order value in USD',
        category: 'orders',
        isPublic: true,
        isActive: true,
      },
    }),
    prisma.systemConfig.create({
      data: {
        key: 'max_delivery_distance',
        value: '2000',
        type: 'number',
        description: 'Maximum delivery distance in kilometers',
        category: 'transport',
        isPublic: true,
        isActive: true,
      },
    }),
    prisma.systemConfig.create({
      data: {
        key: 'order_expiry_days',
        value: '60',
        type: 'number',
        description: 'Number of days before an order expires',
        category: 'orders',
        isPublic: true,
        isActive: true,
      },
    }),
    prisma.systemConfig.create({
      data: {
        key: 'google_oauth_enabled',
        value: 'true',
        type: 'boolean',
        description: 'Enable Google OAuth authentication',
        category: 'auth',
        isPublic: false,
        isActive: true,
      },
    }),
  ]);

  // Create sample price history for analytics
  const priceHistoryData = [];
  const now = new Date();
  
  for (let i = 0; i < products.length - 1; i++) { // Exclude "Other" category
    for (let j = 0; j < 30; j++) {
      const recordDate = new Date(now);
      recordDate.setDate(recordDate.getDate() - j);
      
      priceHistoryData.push({
        productId: products[i].id,
        price: products[i].basePrice! * (0.95 + Math.random() * 0.1), // ±5% variation
        currency: 'USD',
        unit: products[i].unit,
        location: 'Midwest USA',
        source: 'market',
        recordedAt: recordDate,
      });
    }
  }
  
  await prisma.priceHistory.createMany({
    data: priceHistoryData,
  });

  console.log('✅ Database seeded successfully!');
  console.log('📊 Created:');
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${products.length} agricultural products:`);
  products.forEach(p => console.log(`     • ${p.name}`));
  console.log(`   - ${users.length} users (various roles)`);
  console.log(`   - ${orders.length} sample orders`);
  console.log(`   - 5 system configurations`);
  console.log(`   - ${priceHistoryData.length} price history records`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });