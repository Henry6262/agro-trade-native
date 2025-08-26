import { 
  PrismaClient, 
  ProductCategory, 
  ProductUnit, 
  ListingType, 
  ListingStatus,
  UserRole,
  BaseType,
  StockStatus
} from '@prisma/client';

const prisma = new PrismaClient();

// Bulgarian cities and regions for realistic base locations
const bulgarianLocations = [
  { city: 'Sofia', region: 'Sofia City', lat: 42.6977, lng: 23.3219 },
  { city: 'Plovdiv', region: 'Plovdiv', lat: 42.1354, lng: 24.7453 },
  { city: 'Varna', region: 'Varna', lat: 43.2141, lng: 27.9147 },
  { city: 'Burgas', region: 'Burgas', lat: 42.5048, lng: 27.4626 },
  { city: 'Ruse', region: 'Ruse', lat: 43.8356, lng: 25.9657 },
  { city: 'Stara Zagora', region: 'Stara Zagora', lat: 42.4258, lng: 25.6345 },
  { city: 'Pleven', region: 'Pleven', lat: 43.4170, lng: 24.6067 },
  { city: 'Dobrich', region: 'Dobrich', lat: 43.5725, lng: 27.8273 },
  { city: 'Shumen', region: 'Shumen', lat: 43.2706, lng: 26.9247 },
  { city: 'Silistra', region: 'Silistra', lat: 44.1177, lng: 27.2606 }
];

async function seedMultiBase() {
  console.log('🌱 Starting multi-base seed...');

  try {
    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.baseDemand.deleteMany({});
    await prisma.baseStock.deleteMany({});
    await prisma.productListing.deleteMany({});
    await prisma.base.deleteMany({});
    
    // Keep product catalog
    const productCatalog = await prisma.productCatalog.findMany();
    if (productCatalog.length === 0) {
      throw new Error('No product catalog found. Please run seed-catalog.ts first.');
    }

    // Create users with different roles
    console.log('👥 Creating users with multiple bases...\n');

    // 1. Large Cooperative with multiple silos
    let cooperative = await prisma.user.findFirst({
      where: { email: 'cooperative@agrotrade.bg' }
    });
    
    if (!cooperative) {
      cooperative = await prisma.user.create({
        data: {
          email: 'cooperative@agrotrade.bg',
          name: 'Bulgarian Grain Cooperative',
          role: UserRole.FARMER,
          phone: '+359888123456',
          farmerProfile: {
            create: {
              farmName: 'Bulgarian Grain Cooperative',
              businessId: 'BG123456789',
              certifications: ['ISO 9001', 'GlobalGAP', 'Organic EU']
            }
          }
        }
      });
    }

    // Create cooperative bases (silos)
    const cooperativeBases = await Promise.all([
      prisma.base.create({
        data: {
          userId: cooperative.id,
          name: 'Central Silo Plovdiv',
          code: 'BGC-PLV-01',
          type: BaseType.SILO,
          isPrimary: true,
          address: '15 Industrial Zone',
          city: 'Plovdiv',
          region: 'Plovdiv',
          country: 'Bulgaria',
          latitude: 42.1354,
          longitude: 24.7453,
          storageCapacity: 5000,
          currentUsage: 3200,
          contactPerson: 'Ivan Petrov',
          contactPhone: '+359888111222',
          contactEmail: 'plovdiv@bgcoop.bg',
          features: ['Climate controlled', 'Rail access', '24/7 security', 'Automated loading'],
          certifications: ['HACCP', 'ISO 22000'],
          operatingHours: {
            monday: '07:00-18:00',
            tuesday: '07:00-18:00',
            wednesday: '07:00-18:00',
            thursday: '07:00-18:00',
            friday: '07:00-18:00',
            saturday: '08:00-14:00',
            sunday: 'Closed'
          }
        }
      }),
      prisma.base.create({
        data: {
          userId: cooperative.id,
          name: 'North Silo Dobrich',
          code: 'BGC-DOB-02',
          type: BaseType.SILO,
          address: '8 Grain District',
          city: 'Dobrich',
          region: 'Dobrich',
          country: 'Bulgaria',
          latitude: 43.5725,
          longitude: 27.8273,
          storageCapacity: 8000,
          currentUsage: 6500,
          contactPerson: 'Maria Ivanova',
          contactPhone: '+359888333444',
          contactEmail: 'dobrich@bgcoop.bg',
          features: ['Large capacity', 'Truck scales', 'Quality lab on-site'],
          certifications: ['ISO 9001']
        }
      }),
      prisma.base.create({
        data: {
          userId: cooperative.id,
          name: 'Danube Port Warehouse',
          code: 'BGC-RUS-03',
          type: BaseType.PORT,
          address: 'Port of Ruse, Terminal 2',
          city: 'Ruse',
          region: 'Ruse',
          country: 'Bulgaria',
          latitude: 43.8356,
          longitude: 25.9657,
          storageCapacity: 3000,
          currentUsage: 1800,
          contactPerson: 'Georgi Dimitrov',
          contactPhone: '+359888555666',
          features: ['Direct river access', 'Export facilities', 'Customs clearance'],
          certifications: ['AEO', 'ISO 9001']
        }
      })
    ]);

    console.log(`✅ Created ${cooperativeBases.length} bases for Bulgarian Grain Cooperative`);

    // 2. Large Mill/Buyer with multiple locations
    let mill = await prisma.user.findFirst({
      where: { email: 'mill@flourpower.bg' }
    });
    
    if (!mill) {
      mill = await prisma.user.create({
        data: {
          email: 'mill@flourpower.bg',
          name: 'FlourPower Mills Bulgaria',
          role: UserRole.BUYER,
          phone: '+359888234567',
          buyerProfile: {
            create: {
              companyName: 'FlourPower Mills Bulgaria Ltd.',
              vatId: 'BG987654321'
            }
          }
        }
      });
    }

    const millBases = await Promise.all([
      prisma.base.create({
        data: {
          userId: mill.id,
          name: 'Sofia Processing Plant',
          code: 'FPM-SOF-01',
          type: BaseType.FACTORY,
          isPrimary: true,
          address: '45 Industrial Park West',
          city: 'Sofia',
          region: 'Sofia City',
          country: 'Bulgaria',
          latitude: 42.6977,
          longitude: 23.3219,
          storageCapacity: 2000,
          contactPerson: 'Nikolay Georgiev',
          contactPhone: '+359888777888',
          contactEmail: 'sofia@flourpower.bg',
          features: ['Modern milling equipment', 'Quality lab', 'Packaging facility'],
          certifications: ['HACCP', 'ISO 22000', 'IFS Food']
        }
      }),
      prisma.base.create({
        data: {
          userId: mill.id,
          name: 'Varna Procurement Office',
          code: 'FPM-VAR-02',
          type: BaseType.OFFICE,
          address: '12 Business Center Marina',
          city: 'Varna',
          region: 'Varna',
          country: 'Bulgaria',
          latitude: 43.2141,
          longitude: 27.9147,
          storageCapacity: 500,
          contactPerson: 'Elena Petrova',
          contactPhone: '+359888999000',
          features: ['Procurement hub', 'Small storage']
        }
      }),
      prisma.base.create({
        data: {
          userId: mill.id,
          name: 'Stara Zagora Warehouse',
          code: 'FPM-STZ-03',
          type: BaseType.WAREHOUSE,
          address: '78 Logistics Zone',
          city: 'Stara Zagora',
          region: 'Stara Zagora',
          country: 'Bulgaria',
          latitude: 42.4258,
          longitude: 25.6345,
          storageCapacity: 3500,
          currentUsage: 2100,
          features: ['Strategic location', 'Modern storage', 'Rail connection']
        }
      })
    ]);

    console.log(`✅ Created ${millBases.length} bases for FlourPower Mills`);

    // 3. Export Company with port facilities
    let exporter = await prisma.user.findFirst({
      where: { email: 'export@blackseagrain.bg' }
    });
    
    if (!exporter) {
      exporter = await prisma.user.create({
        data: {
          email: 'export@blackseagrain.bg',
          name: 'Black Sea Grain Exports',
          role: UserRole.BUYER,
          phone: '+359888345678',
          buyerProfile: {
            create: {
              companyName: 'Black Sea Grain Exports Ltd.',
              vatId: 'BG456789123'
            }
          }
        }
      });
    }

    const exporterBases = await Promise.all([
      prisma.base.create({
        data: {
          userId: exporter.id,
          name: 'Burgas Port Terminal',
          code: 'BSG-BUR-01',
          type: BaseType.PORT,
          isPrimary: true,
          address: 'Port of Burgas, West Terminal',
          city: 'Burgas',
          region: 'Burgas',
          country: 'Bulgaria',
          latitude: 42.5048,
          longitude: 27.4626,
          storageCapacity: 15000,
          currentUsage: 8500,
          contactPerson: 'Dimitar Kostov',
          contactPhone: '+359888456789',
          features: ['Deep water port', 'Ship loading', 'Export documentation', 'Fumigation'],
          certifications: ['GAFTA', 'ISO 9001', 'ISPS']
        }
      }),
      prisma.base.create({
        data: {
          userId: exporter.id,
          name: 'Varna Port Storage',
          code: 'BSG-VAR-02',
          type: BaseType.PORT,
          address: 'Port of Varna, Grain Terminal',
          city: 'Varna',
          region: 'Varna',
          country: 'Bulgaria',
          latitude: 43.2141,
          longitude: 27.9147,
          storageCapacity: 10000,
          currentUsage: 5500,
          features: ['Container handling', 'Bulk storage', 'Rail access'],
          certifications: ['GAFTA', 'AEO']
        }
      })
    ]);

    console.log(`✅ Created ${exporterBases.length} bases for Black Sea Grain Exports`);

    // 4. Create BaseStock for cooperative
    console.log('\n📦 Creating stock at different bases...');
    
    const wheatProduct = productCatalog.find(p => p.category === ProductCategory.WHEAT);
    const cornProduct = productCatalog.find(p => p.category === ProductCategory.CORN);
    const sunflowerProduct = productCatalog.find(p => p.category === ProductCategory.SUNFLOWER);

    if (wheatProduct && cornProduct && sunflowerProduct) {
      // Stock at Plovdiv silo
      await prisma.baseStock.create({
        data: {
          baseId: cooperativeBases[0].id,
          userId: cooperative.id,
          productId: wheatProduct.id,
          quantity: 1500,
          unit: ProductUnit.TON,
          status: StockStatus.AVAILABLE,
          qualityGrade: 'Premium',
          harvestDate: new Date('2024-07-15'),
          batchNumber: 'PLV-WH-2024-001',
          pricePerUnit: 275,
          storageLocation: 'Silo A1-A3',
          temperature: 18.5,
          humidity: 13.2
        }
      });

      await prisma.baseStock.create({
        data: {
          baseId: cooperativeBases[0].id,
          userId: cooperative.id,
          productId: cornProduct.id,
          quantity: 800,
          unit: ProductUnit.TON,
          status: StockStatus.AVAILABLE,
          qualityGrade: 'Grade 1',
          harvestDate: new Date('2024-10-01'),
          batchNumber: 'PLV-CN-2024-001',
          pricePerUnit: 245,
          storageLocation: 'Silo B1-B2'
        }
      });

      // Stock at Dobrich silo (different products)
      await prisma.baseStock.create({
        data: {
          baseId: cooperativeBases[1].id,
          userId: cooperative.id,
          productId: sunflowerProduct.id,
          quantity: 2500,
          unit: ProductUnit.TON,
          status: StockStatus.AVAILABLE,
          qualityGrade: 'High Oleic',
          harvestDate: new Date('2024-09-20'),
          batchNumber: 'DOB-SF-2024-001',
          pricePerUnit: 465,
          storageLocation: 'Main Storage'
        }
      });

      await prisma.baseStock.create({
        data: {
          baseId: cooperativeBases[1].id,
          userId: cooperative.id,
          productId: wheatProduct.id,
          quantity: 3200,
          unit: ProductUnit.TON,
          status: StockStatus.AVAILABLE,
          qualityGrade: 'Grade 1',
          harvestDate: new Date('2024-07-20'),
          batchNumber: 'DOB-WH-2024-002',
          pricePerUnit: 268,
          storageLocation: 'Silos 1-5'
        }
      });

      // Stock at Ruse port (ready for export)
      await prisma.baseStock.create({
        data: {
          baseId: cooperativeBases[2].id,
          userId: cooperative.id,
          productId: wheatProduct.id,
          quantity: 1800,
          unit: ProductUnit.TON,
          status: StockStatus.IN_TRANSIT,
          qualityGrade: 'Export Grade',
          batchNumber: 'RUS-WH-EXP-001',
          pricePerUnit: 285,
          notes: 'Ready for Danube river export'
        }
      });

      console.log('✅ Created stock entries across cooperative bases');
    }

    // 5. Create BaseDemand for mill
    console.log('\n📋 Creating demand at different mill bases...');

    if (wheatProduct) {
      // Demand at Sofia factory
      await prisma.baseDemand.create({
        data: {
          baseId: millBases[0].id,
          userId: mill.id,
          productId: wheatProduct.id,
          requiredQuantity: 500,
          unit: ProductUnit.TON,
          urgency: 'within_week',
          qualityGrade: 'Premium',
          maxPricePerUnit: 290,
          neededBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          specifications: {
            protein: 'Min 13%',
            moisture: 'Max 13.5%',
            gluten: 'Min 28%'
          }
        }
      });

      // Demand at Stara Zagora warehouse
      await prisma.baseDemand.create({
        data: {
          baseId: millBases[2].id,
          userId: mill.id,
          productId: wheatProduct.id,
          requiredQuantity: 1000,
          unit: ProductUnit.TON,
          urgency: 'within_month',
          qualityGrade: 'Grade 1',
          maxPricePerUnit: 280,
          neededBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      console.log('✅ Created demand entries for mill bases');
    }

    // 6. Create ProductListings with base associations
    console.log('\n📝 Creating listings associated with bases...');

    if (wheatProduct && cornProduct) {
      // Cooperative SELL listings from specific bases
      await prisma.productListing.create({
        data: {
          productId: wheatProduct.id,
          userId: cooperative.id,
          baseId: cooperativeBases[0].id, // Plovdiv silo
          listingType: ListingType.SELL,
          title: 'Premium Wheat from Plovdiv - 1500 tons available',
          description: 'High-quality wheat stored in climate-controlled silos. Available for immediate delivery.',
          quantity: 1500,
          unit: ProductUnit.TON,
          pricePerUnit: 275,
          totalValue: 412500,
          qualityGrade: 'Premium',
          locationAddress: cooperativeBases[0].address,
          locationLat: cooperativeBases[0].latitude,
          locationLng: cooperativeBases[0].longitude,
          deliveryOptions: ['EXW', 'FOB', 'DAP'],
          splitDelivery: true,
          minOrderQuantity: 100,
          status: ListingStatus.ACTIVE,
          availableFrom: new Date(),
          availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          certifications: ['Non-GMO', 'EU Organic'],
          specifications: {
            protein: '13.5%',
            moisture: '13.2%',
            testWeight: '78 kg/hl'
          }
        }
      });

      await prisma.productListing.create({
        data: {
          productId: sunflowerProduct!.id,
          userId: cooperative.id,
          baseId: cooperativeBases[1].id, // Dobrich silo
          listingType: ListingType.SELL,
          title: 'High Oleic Sunflower - Large Volume Available',
          description: 'Premium high oleic sunflower seeds from Dobrich region. Excellent oil content.',
          quantity: 2500,
          unit: ProductUnit.TON,
          pricePerUnit: 465,
          totalValue: 1162500,
          qualityGrade: 'High Oleic',
          locationAddress: cooperativeBases[1].address,
          locationLat: cooperativeBases[1].latitude,
          locationLng: cooperativeBases[1].longitude,
          deliveryOptions: ['EXW', 'FCA'],
          splitDelivery: true,
          minOrderQuantity: 200,
          status: ListingStatus.ACTIVE,
          availableFrom: new Date(),
          availableTo: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
        }
      });

      // Mill BUY listings for specific delivery bases
      await prisma.productListing.create({
        data: {
          productId: wheatProduct.id,
          userId: mill.id,
          baseId: millBases[0].id, // Sofia factory
          listingType: ListingType.BUY,
          title: 'Urgent: Need Premium Wheat for Sofia Mill',
          description: 'Looking for immediate delivery of premium milling wheat to our Sofia facility.',
          quantity: 500,
          unit: ProductUnit.TON,
          pricePerUnit: 290,
          totalValue: 145000,
          qualityGrade: 'Premium',
          locationAddress: millBases[0].address,
          locationLat: millBases[0].latitude,
          locationLng: millBases[0].longitude,
          deliveryOptions: ['DAP', 'DDP'],
          status: ListingStatus.ACTIVE,
          deliveryBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          specifications: {
            protein: 'Min 13%',
            moisture: 'Max 13.5%',
            gluten: 'Min 28%'
          }
        }
      });

      // Exporter BUY listing with split delivery option
      await prisma.productListing.create({
        data: {
          productId: wheatProduct.id,
          userId: exporter.id,
          baseId: exporterBases[0].id, // Burgas port
          listingType: ListingType.BUY,
          title: 'Export Contract: 5000 tons wheat needed',
          description: 'Large volume needed for export contract. Can accept split delivery to Burgas and Varna ports.',
          quantity: 5000,
          unit: ProductUnit.TON,
          pricePerUnit: 270,
          totalValue: 1350000,
          qualityGrade: 'Export Grade',
          locationAddress: exporterBases[0].address,
          locationLat: exporterBases[0].latitude,
          locationLng: exporterBases[0].longitude,
          deliveryOptions: ['FOB', 'CIF'],
          splitDelivery: true, // Can deliver to multiple ports
          minOrderQuantity: 500,
          status: ListingStatus.ACTIVE,
          deliveryBy: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          specifications: {
            protein: 'Min 12.5%',
            moisture: 'Max 14%',
            foreignMatter: 'Max 2%'
          }
        }
      });

      console.log('✅ Created product listings associated with bases');
    }

    // Summary
    const totalBases = await prisma.base.count();
    const totalStock = await prisma.baseStock.count();
    const totalDemand = await prisma.baseDemand.count();
    const totalListings = await prisma.productListing.count();

    console.log(`
✅ Multi-base seeding completed successfully!
📊 Summary:
   - Created ${totalBases} bases across Bulgaria
   - Created ${totalStock} stock entries at different locations
   - Created ${totalDemand} demand entries for buyers
   - Created ${totalListings} listings with base associations
   
Key Features Demonstrated:
   ✓ Multiple bases per user (silos, warehouses, ports, offices)
   ✓ Stock management per base with different products
   ✓ Demand tracking per buyer location
   ✓ Listings associated with specific bases
   ✓ Split delivery options
   ✓ Realistic Bulgarian locations
   ✓ Transport cost optimization ready
    `);

  } catch (error) {
    console.error('❌ Error seeding multi-base data:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await seedMultiBase();
  } catch (e) {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { seedMultiBase };