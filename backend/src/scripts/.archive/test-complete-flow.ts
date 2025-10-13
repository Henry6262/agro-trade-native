import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up existing test data...');
  
  // Clean up in correct order to avoid foreign key constraints
  await prisma.transportJob.deleteMany();
  await prisma.transportBid.deleteMany();
  await prisma.transportRequest.deleteMany();
  await prisma.offerNegotiation.deleteMany();
  await prisma.tradeSeller.deleteMany();
  await prisma.tradeOperation.deleteMany();
  await prisma.buyListing.deleteMany();
  await prisma.saleListing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleanup complete');
  
  console.log('\n📦 Creating products...');
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Premium Wheat',
        category: 'SOFT_WHEAT',
        description: 'High-quality wheat suitable for bread making',
        unit: 'TON',
        minOrderQuantity: 10,
        certifications: ['Organic', 'Non-GMO'],
        shelfLife: 12,
        storageRequirements: 'Cool, dry place',
        nutritionalInfo: { protein: '13%', moisture: '12%' },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Soybeans',
        category: 'OATS',
        description: 'Premium soybeans for various uses',
        unit: 'TON',
        minOrderQuantity: 20,
        certifications: ['Organic'],
        shelfLife: 18,
        storageRequirements: 'Temperature controlled storage',
        nutritionalInfo: { protein: '36%', oil: '20%' },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Yellow Corn',
        category: 'CORN_MAIZE',
        description: 'High-quality corn for feed and food processing',
        unit: 'TON',
        minOrderQuantity: 25,
        certifications: ['Non-GMO'],
        shelfLife: 12,
        storageRequirements: 'Dry storage required',
        nutritionalInfo: { starch: '72%', protein: '9%' },
      },
    }),
  ]);
  console.log(`✅ Created ${products.length} products`);

  console.log('\n👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@agrotrade.com',
      phoneNumber: '+1234567890',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
    },
  });
  console.log('✅ Created admin user');

  // Create Buyers
  const buyers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'buyer1@example.com',
        phoneNumber: '+1234567891',
        password: hashedPassword,
        name: 'Global Foods Inc',
        role: 'BUYER',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        buyer: {
          create: {
            companyName: 'Global Foods Inc',
            taxId: 'TAX123456',
            address: '123 Business Ave, New York, NY',
            city: 'New York',
            country: 'USA',
            postalCode: '10001',
            contactPerson: 'John Smith',
            contactEmail: 'john@globalfoods.com',
            contactPhone: '+1234567891',
            businessType: 'PROCESSOR',
            annualPurchaseVolume: 50000,
            preferredProducts: ['Wheat', 'Corn'],
            paymentTerms: 'NET30',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'buyer2@example.com',
        phoneNumber: '+1234567892',
        password: hashedPassword,
        name: 'Food Distributors LLC',
        role: 'BUYER',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        buyer: {
          create: {
            companyName: 'Food Distributors LLC',
            taxId: 'TAX789012',
            address: '456 Commerce St, Chicago, IL',
            city: 'Chicago',
            country: 'USA',
            postalCode: '60601',
            contactPerson: 'Jane Doe',
            contactEmail: 'jane@fooddist.com',
            contactPhone: '+1234567892',
            businessType: 'DISTRIBUTOR',
            annualPurchaseVolume: 30000,
            preferredProducts: ['Soybeans', 'Wheat'],
            paymentTerms: 'NET45',
          },
        },
      },
    }),
  ]);
  console.log(`✅ Created ${buyers.length} buyers`);

  // Create Sellers
  const sellers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'seller1@example.com',
        phoneNumber: '+1234567893',
        password: hashedPassword,
        name: 'Green Valley Farms',
        role: 'FARMER',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        seller: {
          create: {
            farmName: 'Green Valley Farms',
            farmSize: 500,
            location: 'Iowa',
            coordinates: { lat: 41.8780, lng: -93.0977 },
            soilType: 'Loamy',
            irrigationType: 'SPRINKLER',
            organicCertified: true,
            certifications: ['USDA Organic', 'Non-GMO Project'],
            establishedYear: 2010,
            description: 'Premium organic grain producer',
            bankAccountNumber: 'BANK123456',
            taxId: 'TAX-SELLER-001',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller2@example.com',
        phoneNumber: '+1234567894',
        password: hashedPassword,
        name: 'Prairie Harvest Co',
        role: 'FARMER',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        seller: {
          create: {
            farmName: 'Prairie Harvest Co',
            farmSize: 800,
            location: 'Nebraska',
            coordinates: { lat: 41.4925, lng: -99.9018 },
            soilType: 'Clay loam',
            irrigationType: 'CENTER_PIVOT',
            organicCertified: false,
            certifications: ['GAP Certified'],
            establishedYear: 2005,
            description: 'Large-scale grain and soybean producer',
            bankAccountNumber: 'BANK789012',
            taxId: 'TAX-SELLER-002',
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'seller3@example.com',
        phoneNumber: '+1234567895',
        password: hashedPassword,
        name: 'Sunshine Agricultural Group',
        role: 'FARMER',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        seller: {
          create: {
            farmName: 'Sunshine Agricultural Group',
            farmSize: 1200,
            location: 'Kansas',
            coordinates: { lat: 39.0119, lng: -98.4842 },
            soilType: 'Sandy loam',
            irrigationType: 'DRIP',
            organicCertified: true,
            certifications: ['USDA Organic', 'Rainforest Alliance'],
            establishedYear: 2008,
            description: 'Sustainable farming practices with focus on quality',
            bankAccountNumber: 'BANK345678',
            taxId: 'TAX-SELLER-003',
          },
        },
      },
    }),
  ]);
  console.log(`✅ Created ${sellers.length} sellers`);

  // Create Transporters
  const transporters = await Promise.all([
    prisma.user.create({
      data: {
        email: 'transporter1@example.com',
        phoneNumber: '+1234567896',
        password: hashedPassword,
        name: 'FastHaul Logistics',
        role: 'TRANSPORTER',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        transporter: {
          create: {
            companyName: 'FastHaul Logistics',
            licenseNumber: 'TRN-001-2024',
            fleetSize: 25,
            vehicleTypes: ['Semi-Truck', 'Grain Hauler', 'Refrigerated Truck'],
            serviceAreas: ['Iowa', 'Nebraska', 'Kansas', 'Illinois', 'Missouri'],
            baseLocation: 'Des Moines, IA',
            coordinates: { lat: 41.5868, lng: -93.6250 },
            insuranceProvider: 'Transport Insurance Co',
            insurancePolicyNumber: 'POL-123456',
            insuranceExpiry: new Date('2025-12-31'),
            rating: 4.8,
            completedDeliveries: 1250,
            onTimeDeliveryRate: 96.5,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'transporter2@example.com',
        phoneNumber: '+1234567897',
        password: hashedPassword,
        name: 'AgriTransport Services',
        role: 'TRANSPORTER',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        transporter: {
          create: {
            companyName: 'AgriTransport Services',
            licenseNumber: 'TRN-002-2024',
            fleetSize: 18,
            vehicleTypes: ['Semi-Truck', 'Flatbed', 'Grain Hauler'],
            serviceAreas: ['Nebraska', 'Kansas', 'Colorado', 'Wyoming'],
            baseLocation: 'Omaha, NE',
            coordinates: { lat: 41.2565, lng: -95.9345 },
            insuranceProvider: 'Agricultural Transport Insurance',
            insurancePolicyNumber: 'POL-789012',
            insuranceExpiry: new Date('2025-11-30'),
            rating: 4.6,
            completedDeliveries: 980,
            onTimeDeliveryRate: 94.2,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        email: 'transporter3@example.com',
        phoneNumber: '+1234567898',
        password: hashedPassword,
        name: 'Midwest Grain Movers',
        role: 'TRANSPORTER',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        transporter: {
          create: {
            companyName: 'Midwest Grain Movers',
            licenseNumber: 'TRN-003-2024',
            fleetSize: 30,
            vehicleTypes: ['Semi-Truck', 'Grain Hauler', 'Tanker'],
            serviceAreas: ['Illinois', 'Iowa', 'Wisconsin', 'Indiana', 'Michigan'],
            baseLocation: 'Chicago, IL',
            coordinates: { lat: 41.8781, lng: -87.6298 },
            insuranceProvider: 'Midwest Insurance Group',
            insurancePolicyNumber: 'POL-345678',
            insuranceExpiry: new Date('2026-01-31'),
            rating: 4.7,
            completedDeliveries: 1500,
            onTimeDeliveryRate: 95.8,
          },
        },
      },
    }),
  ]);
  console.log(`✅ Created ${transporters.length} transporters`);

  // Create Inspectors
  const inspectors = await Promise.all([
    prisma.user.create({
      data: {
        email: 'inspector1@example.com',
        phoneNumber: '+1234567899',
        password: hashedPassword,
        name: 'Quality Check Services',
        role: 'INSPECTOR',
        isEmailVerified: true,
        isPhoneVerified: true,
        isActive: true,
        inspector: {
          create: {
            certificationNumber: 'INSP-001-2024',
            specializations: ['Grains', 'Legumes', 'Organic Certification'],
            yearsOfExperience: 10,
            serviceAreas: ['Iowa', 'Nebraska', 'Kansas'],
            baseLocation: 'Des Moines, IA',
            coordinates: { lat: 41.5868, lng: -93.6250 },
            certifyingBody: 'USDA',
            certificationExpiry: new Date('2025-12-31'),
            rating: 4.9,
            completedInspections: 500,
            averageResponseTime: 24,
          },
        },
      },
    }),
  ]);
  console.log(`✅ Created ${inspectors.length} inspectors`);

  console.log('\n📋 Creating sale listings from sellers...');
  const saleListings = await Promise.all([
    // Seller 1 - Green Valley Farms
    prisma.saleListing.create({
      data: {
        sellerId: sellers[0].id,
        productId: products[0].id, // Premium Wheat
        quantity: 500,
        unit: 'TON',
        pricePerUnit: 280,
        minOrderQuantity: 50,
        location: 'Iowa',
        harvestDate: new Date('2024-09-15'),
        availableFrom: new Date(),
        availableUntil: new Date('2025-03-31'),
        description: 'Premium organic wheat, freshly harvested',
        images: ['wheat1.jpg', 'wheat2.jpg'],
        certifications: ['USDA Organic', 'Non-GMO'],
        status: 'ACTIVE',
      },
    }),
    prisma.saleListing.create({
      data: {
        sellerId: sellers[1].id, // Prairie Harvest Co
        productId: products[0].id, // Premium Wheat
        quantity: 800,
        unit: 'TON',
        pricePerUnit: 270,
        minOrderQuantity: 100,
        location: 'Nebraska',
        harvestDate: new Date('2024-09-20'),
        availableFrom: new Date(),
        availableUntil: new Date('2025-04-30'),
        description: 'Large quantity wheat available for immediate delivery',
        images: ['wheat3.jpg'],
        certifications: ['GAP Certified'],
        status: 'ACTIVE',
      },
    }),
    prisma.saleListing.create({
      data: {
        sellerId: sellers[1].id, // Prairie Harvest Co
        productId: products[1].id, // Soybeans
        quantity: 600,
        unit: 'TON',
        pricePerUnit: 450,
        minOrderQuantity: 50,
        location: 'Nebraska',
        harvestDate: new Date('2024-10-01'),
        availableFrom: new Date(),
        availableUntil: new Date('2025-05-31'),
        description: 'High-quality soybeans, perfect for processing',
        images: ['soy1.jpg'],
        certifications: ['Non-GMO'],
        status: 'ACTIVE',
      },
    }),
    prisma.saleListing.create({
      data: {
        sellerId: sellers[2].id, // Sunshine Agricultural Group
        productId: products[2].id, // Yellow Corn
        quantity: 1000,
        unit: 'TON',
        pricePerUnit: 220,
        minOrderQuantity: 100,
        location: 'Kansas',
        harvestDate: new Date('2024-10-10'),
        availableFrom: new Date(),
        availableUntil: new Date('2025-06-30'),
        description: 'Premium yellow corn for feed and food processing',
        images: ['corn1.jpg', 'corn2.jpg'],
        certifications: ['USDA Organic', 'Rainforest Alliance'],
        status: 'ACTIVE',
      },
    }),
    prisma.saleListing.create({
      data: {
        sellerId: sellers[2].id, // Sunshine Agricultural Group
        productId: products[0].id, // Premium Wheat
        quantity: 400,
        unit: 'TON',
        pricePerUnit: 285,
        minOrderQuantity: 40,
        location: 'Kansas',
        harvestDate: new Date('2024-09-25'),
        availableFrom: new Date(),
        availableUntil: new Date('2025-03-31'),
        description: 'Organic wheat from sustainable farming',
        images: ['wheat4.jpg'],
        certifications: ['USDA Organic', 'Rainforest Alliance'],
        status: 'ACTIVE',
      },
    }),
  ]);
  console.log(`✅ Created ${saleListings.length} sale listings`);

  console.log('\n🛒 Creating buy listings from buyers...');
  const buyListings = await Promise.all([
    prisma.buyListing.create({
      data: {
        buyerId: buyers[0].id, // Global Foods Inc
        productId: products[0].id, // Premium Wheat
        quantity: 200,
        unit: 'TON',
        maxPricePerUnit: 300,
        urgency: 'HIGH',
        deliveryLocation: 'New York, NY',
        deliveryBy: new Date('2025-02-28'),
        description: 'Urgent requirement for premium wheat for bread production',
        qualityRequirements: ['Organic', 'Non-GMO', 'Protein > 13%'],
        packagingRequirements: 'Bulk containers, moisture-proof',
        status: 'ACTIVE',
      },
    }),
    prisma.buyListing.create({
      data: {
        buyerId: buyers[1].id, // Food Distributors LLC
        productId: products[1].id, // Soybeans
        quantity: 150,
        unit: 'TON',
        maxPricePerUnit: 480,
        urgency: 'MEDIUM',
        deliveryLocation: 'Chicago, IL',
        deliveryBy: new Date('2025-03-15'),
        description: 'Regular purchase of soybeans for distribution network',
        qualityRequirements: ['Protein > 35%', 'Moisture < 13%'],
        packagingRequirements: 'Standard grain bags',
        status: 'ACTIVE',
      },
    }),
  ]);
  console.log(`✅ Created ${buyListings.length} buy listings`);

  console.log('\n🎯 Creating a test trade operation...');
  const tradeOperation = await prisma.tradeOperation.create({
    data: {
      operationNumber: `OP-${Date.now()}`,
      buyListingId: buyListings[0].id, // Wheat purchase by Global Foods
      phase: 'INITIATION',
      status: 'ACTIVE',
      requiredQuantity: 200,
      securedQuantity: 0,
      marginPercentage: 10,
      estimatedProfit: 6000,
      profitMargin: 10,
      estimatedTransportCost: 5000,
    },
    include: {
      buyListing: {
        include: {
          product: true,
          buyer: true,
        },
      },
    },
  });
  console.log(`✅ Created trade operation: ${tradeOperation.operationNumber}`);

  console.log('\n===========================================');
  console.log('✨ TEST DATA SETUP COMPLETE!');
  console.log('===========================================\n');
  
  console.log('📊 Summary:');
  console.log(`   - Admin: admin@agrotrade.com`);
  console.log(`   - Buyers: ${buyers.length} (buyer1@example.com, buyer2@example.com)`);
  console.log(`   - Sellers: ${sellers.length} (seller1@example.com, seller2@example.com, seller3@example.com)`);
  console.log(`   - Transporters: ${transporters.length} (transporter1@example.com, transporter2@example.com, transporter3@example.com)`);
  console.log(`   - Products: ${products.length} (Wheat, Soybeans, Corn)`);
  console.log(`   - Sale Listings: ${saleListings.length}`);
  console.log(`   - Buy Listings: ${buyListings.length}`);
  console.log(`   - Trade Operation: ${tradeOperation.operationNumber}`);
  console.log('\n🔑 All users have password: password123');
  
  console.log('\n📝 Next Steps to Test Complete Flow:');
  console.log('1. Login to Admin Dashboard (http://localhost:5173)');
  console.log('2. Navigate to Trade Operations');
  console.log('3. Open the created operation and move to SELLER_NEGOTIATION phase');
  console.log('4. Send offers to sellers using the bulk offer feature');
  console.log('5. Login as sellers to accept/counter offers');
  console.log('6. Create transport request after sellers accept');
  console.log('7. Login as transporters to bid on the job');
  console.log('8. Accept a transport bid as admin');
  console.log('9. Track delivery progress');
  console.log('10. View the complete operation as buyer');

  return {
    admin,
    buyers,
    sellers,
    transporters,
    products,
    saleListings,
    buyListings,
    tradeOperation,
  };
}

main()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });