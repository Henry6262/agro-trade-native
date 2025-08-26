import { PrismaClient, ProductCategory, ProductUnit, ListingType, ListingStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Product catalog data with images from Cloudinary
const productCatalogData = [
  {
    category: ProductCategory.BARLEY,
    name: 'barley',
    displayName: 'Barley',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192666/barley_nw6okk.png',
    description: 'High-quality barley ideal for brewing, animal feed, and food production. Known for its versatility and nutritional value.',
    nutritionalInfo: 'Rich in fiber, vitamins B1, B3, and minerals including selenium, copper, and manganese.',
    useCases: ['Malting for beer production', 'Animal feed', 'Soups and stews', 'Barley flour'],
    harvestSeason: 'June to August',
    storageRecommendations: 'Store in cool, dry conditions with moisture content below 14%',
    priceRangeMin: 200,
    priceRangeMax: 280,
    qualityGrades: ['Malting Grade', 'Feed Grade', 'Food Grade'],
    certifications: ['Non-GMO', 'Organic Available'],
    specifications: {
      protein: '9-12%',
      moisture: 'Max 14%',
      germination: 'Min 95% (malting)',
      screenings: 'Max 3%'
    }
  },
  {
    category: ProductCategory.CORN,
    name: 'corn',
    displayName: 'Corn (Maize)',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192559/corn_jiuqv5.webp',
    description: 'Premium yellow corn suitable for human consumption, animal feed, and industrial processing. Non-GMO varieties available.',
    nutritionalInfo: 'Good source of carbohydrates, vitamin B, fiber, and essential minerals.',
    useCases: ['Animal feed', 'Corn flour and meal', 'Ethanol production', 'Food processing', 'Corn oil'],
    harvestSeason: 'September to November',
    storageRecommendations: 'Maintain moisture below 15%, store in ventilated silos',
    priceRangeMin: 220,
    priceRangeMax: 300,
    qualityGrades: ['Grade 1', 'Grade 2', 'Grade 3'],
    certifications: ['Non-GMO Available'],
    specifications: {
      moisture: 'Max 14%',
      brokenKernels: 'Max 3%',
      foreignMatter: 'Max 2%',
      aflatoxin: 'Max 20 ppb'
    }
  },
  {
    category: ProductCategory.PEAS,
    name: 'peas',
    displayName: 'Peas',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/peas_qjdrjq.webp',
    description: 'High-protein yellow and green peas perfect for food processing and animal feed. Excellent source of plant-based protein.',
    nutritionalInfo: 'High in protein (23-25%), fiber, vitamins A, C, K, and folate.',
    useCases: ['Split peas', 'Pea flour', 'Animal feed', 'Protein powder', 'Food processing'],
    harvestSeason: 'July to September',
    storageRecommendations: 'Store at 14% moisture or less, protect from pests',
    priceRangeMin: 320,
    priceRangeMax: 400,
    qualityGrades: ['Food Grade', 'Feed Grade'],
    certifications: ['Non-GMO', 'Organic Available'],
    specifications: {
      protein: 'Min 23%',
      moisture: 'Max 14%',
      splits: 'Max 3%',
      foreignMatter: 'Max 1%'
    }
  },
  {
    category: ProductCategory.SOYBEAN_MEAL,
    name: 'soybean',
    displayName: 'Soybean / Soybean Meal',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192559/soybean_jzz3oq.jpg',
    description: 'Premium soybeans for meal and oil production. High protein content ideal for animal feed and food processing.',
    nutritionalInfo: 'Excellent source of complete protein (36-40%), healthy fats, and isoflavones.',
    useCases: ['Soybean meal', 'Soy oil', 'Tofu production', 'Animal feed', 'Soy flour'],
    harvestSeason: 'September to October',
    storageRecommendations: 'Store at 13% moisture or less in aerated bins',
    priceRangeMin: 380,
    priceRangeMax: 480,
    qualityGrades: ['Hi-Pro (48%)', 'Standard (44%)'],
    certifications: ['Non-GMO Available'],
    specifications: {
      protein: 'Min 44-48%',
      moisture: 'Max 12%',
      fiber: 'Max 7%',
      fat: '0.5-1.5%'
    }
  },
  {
    category: ProductCategory.SUNFLOWER,
    name: 'sunflower',
    displayName: 'Sunflower',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/sunflower_jbywaa.webp',
    description: 'High-oil content sunflower seeds perfect for oil production and confectionery use. Both black oil and striped varieties available.',
    nutritionalInfo: 'Rich in vitamin E, healthy fats, protein, and minerals like magnesium and selenium.',
    useCases: ['Sunflower oil production', 'Confectionery seeds', 'Bird feed', 'Bakery products'],
    harvestSeason: 'August to October',
    storageRecommendations: 'Store at 10% moisture or less, protect from heat',
    priceRangeMin: 420,
    priceRangeMax: 520,
    qualityGrades: ['High Oleic', 'Standard', 'Confectionery'],
    certifications: ['Non-GMO'],
    specifications: {
      oilContent: 'Min 44%',
      moisture: 'Max 9%',
      impurities: 'Max 3%',
      acidValue: 'Max 3%'
    }
  },
  {
    category: ProductCategory.WHEAT,
    name: 'wheat',
    displayName: 'Wheat (All Varieties)',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/soft_wheat_bfxdaa.png',
    description: 'Premium wheat varieties including soft wheat for pastries and durum wheat for pasta production.',
    nutritionalInfo: 'Good source of carbohydrates, B vitamins, iron, and dietary fiber.',
    useCases: ['Flour production', 'Pasta', 'Bread', 'Pastries', 'Cereals'],
    harvestSeason: 'June to August',
    storageRecommendations: 'Store at 13.5% moisture or less in clean, dry bins',
    priceRangeMin: 260,
    priceRangeMax: 380,
    qualityGrades: ['Premium', 'Grade 1', 'Grade 2', 'Grade 3'],
    certifications: ['Non-GMO', 'Organic Available'],
    specifications: {
      protein: '8-15%',
      moisture: 'Max 14%',
      testWeight: 'Min 76 kg/hl',
      fallingNumber: 'Min 250 sec'
    }
  },
  {
    category: ProductCategory.OATS,
    name: 'oats',
    displayName: 'Oats',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/oats_g2ugm8.webp',
    description: 'Premium milling oats suitable for human consumption and animal feed. High in soluble fiber and beta-glucans.',
    nutritionalInfo: 'Excellent source of beta-glucan fiber, protein, vitamins B1 and B5, and minerals.',
    useCases: ['Oatmeal and rolled oats', 'Oat flour', 'Animal feed', 'Oat milk production'],
    harvestSeason: 'July to September',
    storageRecommendations: 'Store at 14% moisture or less, protect from heat and moisture',
    priceRangeMin: 180,
    priceRangeMax: 250,
    qualityGrades: ['Milling Grade', 'Feed Grade'],
    certifications: ['Non-GMO', 'Organic Available'],
    specifications: {
      testWeight: 'Min 50 kg/hl',
      moisture: 'Max 14%',
      groats: 'Min 70%',
      foreignMatter: 'Max 2%'
    }
  },
  {
    category: ProductCategory.RAPESEED,
    name: 'canola',
    displayName: 'Canola (Rapeseed)',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192554/canola_wom5lk.png',
    description: 'Premium canola/rapeseed for oil production. Low in erucic acid and glucosinolates, ideal for food-grade oil.',
    nutritionalInfo: 'High in healthy monounsaturated fats, omega-3 fatty acids, and vitamin E.',
    useCases: ['Canola oil production', 'Biodiesel', 'Animal feed (meal)', 'Industrial lubricants'],
    harvestSeason: 'July to August',
    storageRecommendations: 'Store at 8-9% moisture, protect from heat to prevent quality loss',
    priceRangeMin: 450,
    priceRangeMax: 550,
    qualityGrades: ['00-Quality', 'Industrial'],
    certifications: ['Non-GMO', 'Organic Available'],
    specifications: {
      oilContent: 'Min 42%',
      moisture: 'Max 9%',
      erucicAcid: 'Max 2%',
      glucosinolates: 'Max 25 µmol/g'
    }
  },
  {
    category: ProductCategory.WHEAT_BRAN,
    name: 'wheat_bran',
    displayName: 'Wheat Bran',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192552/wheat_bran_q6qze9.png',
    description: 'High-fiber wheat bran, a valuable by-product of wheat milling. Excellent for animal feed and human nutrition.',
    nutritionalInfo: 'Very high in dietary fiber, B vitamins, minerals, and antioxidants.',
    useCases: ['Animal feed supplement', 'Breakfast cereals', 'Bakery products', 'Dietary supplements'],
    harvestSeason: 'Available year-round',
    storageRecommendations: 'Store in dry conditions, protect from moisture and pests',
    priceRangeMin: 160,
    priceRangeMax: 220,
    qualityGrades: ['Coarse', 'Fine'],
    certifications: ['Non-GMO'],
    specifications: {
      protein: 'Min 15%',
      fiber: '10-12%',
      moisture: 'Max 14%',
      starch: 'Max 20%'
    }
  },
  {
    category: ProductCategory.ALFALFA,
    name: 'alfalfa_pellets',
    displayName: 'Alfalfa Pellets',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192552/alfalfa_pallets_saqhco.webp',
    description: 'High-quality alfalfa compressed into pellets for easy storage and transport. Premium livestock feed with high nutritional value.',
    nutritionalInfo: 'High in protein (15-20%), calcium, vitamins A, D, E, and K.',
    useCases: ['Horse feed', 'Cattle feed', 'Small animal feed', 'Organic fertilizer'],
    harvestSeason: 'Multiple cuts from May to October',
    storageRecommendations: 'Store in dry, well-ventilated areas, protect from moisture',
    priceRangeMin: 230,
    priceRangeMax: 320,
    qualityGrades: ['Premium', 'Standard'],
    certifications: ['Organic Available'],
    specifications: {
      protein: 'Min 17%',
      fiber: 'Max 32%',
      moisture: 'Max 12%',
      ash: 'Max 13%'
    }
  },
  {
    category: ProductCategory.OTHER,
    name: 'other',
    displayName: 'Other Agricultural Products',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192556/other_gagfht.png',
    description: 'Various other agricultural products available upon request, including specialty grains, seeds, and agricultural by-products.',
    nutritionalInfo: 'Varies by product type',
    useCases: ['Specialty markets', 'Custom orders', 'Niche applications'],
    harvestSeason: 'Varies by product',
    storageRecommendations: 'Product-specific storage requirements',
    priceRangeMin: 0,
    priceRangeMax: 0,
    qualityGrades: ['Varies by product'],
    certifications: ['Varies by product'],
    specifications: {
      note: 'Specifications vary by product type'
    }
  }
];

async function seedProductCatalog() {
  console.log('🌱 Starting product catalog seed...');

  try {
    // Clean existing data
    await prisma.productListing.deleteMany({});
    await prisma.productCatalog.deleteMany({});
    console.log('✨ Cleared existing catalog and listings');

    // Create product catalog entries
    const catalogs = [];
    for (const [index, product] of productCatalogData.entries()) {
      const catalog = await prisma.productCatalog.create({
        data: {
          category: product.category,
          name: product.name,
          displayName: product.displayName,
          description: product.description,
          image: product.image,
          nutritionalInfo: product.nutritionalInfo,
          useCases: product.useCases,
          harvestSeason: product.harvestSeason,
          storageRecommendations: product.storageRecommendations,
          priceRangeMin: product.priceRangeMin,
          priceRangeMax: product.priceRangeMax,
          defaultUnit: ProductUnit.TON,
          qualityGrades: product.qualityGrades,
          certifications: product.certifications,
          specifications: product.specifications,
          isActive: true,
          sortOrder: index + 1
        }
      });
      catalogs.push(catalog);
      console.log(`✅ Created catalog entry for ${product.displayName}`);
    }

    // Create sample listings for demonstration
    console.log('\n📋 Creating sample listings...');
    
    // Get or create sample users
    let farmer = await prisma.user.findFirst({
      where: { role: 'FARMER' }
    });
    
    if (!farmer) {
      farmer = await prisma.user.create({
        data: {
          email: 'sample.farmer@agrotrade.com',
          name: 'Sample Farmer',
          role: 'FARMER',
          phone: '+1234567890'
        }
      });
      console.log('✅ Created sample farmer user');
    }

    let buyer = await prisma.user.findFirst({
      where: { role: 'BUYER' }
    });
    
    if (!buyer) {
      buyer = await prisma.user.create({
        data: {
          email: 'sample.buyer@agrotrade.com',
          name: 'Sample Buyer',
          role: 'BUYER',
          phone: '+0987654321'
        }
      });
      console.log('✅ Created sample buyer user');
    }

    // Create sample SELL listings (from farmers)
    const sellListings = [
      {
        product: catalogs.find(c => c.category === ProductCategory.WHEAT),
        title: 'Premium Soft Wheat - Fresh Harvest',
        description: 'High-quality soft wheat from recent harvest. Ideal for pastry flour production.',
        quantity: 500,
        pricePerUnit: 275,
        qualityGrade: 'Premium',
        location: { address: 'Iowa Farm District', lat: 41.5868, lng: -93.6250 }
      },
      {
        product: catalogs.find(c => c.category === ProductCategory.CORN),
        title: 'Yellow Corn - Grade 1',
        description: 'Premium yellow corn, perfect for feed and food processing.',
        quantity: 1000,
        pricePerUnit: 245,
        qualityGrade: 'Grade 1',
        location: { address: 'Nebraska Grain Belt', lat: 41.4925, lng: -99.9018 }
      },
      {
        product: catalogs.find(c => c.category === ProductCategory.SUNFLOWER),
        title: 'High Oleic Sunflower Seeds',
        description: 'High oil content sunflower seeds, excellent for oil production.',
        quantity: 250,
        pricePerUnit: 465,
        qualityGrade: 'High Oleic',
        location: { address: 'North Dakota Fields', lat: 47.5515, lng: -101.0020 }
      }
    ];

    for (const listing of sellListings) {
      if (listing.product) {
        await prisma.productListing.create({
          data: {
            productId: listing.product.id,
            userId: farmer.id,
            listingType: ListingType.SELL,
            title: listing.title,
            description: listing.description,
            quantity: listing.quantity,
            unit: ProductUnit.TON,
            pricePerUnit: listing.pricePerUnit,
            totalValue: listing.quantity * listing.pricePerUnit,
            qualityGrade: listing.qualityGrade,
            locationAddress: listing.location.address,
            locationLat: listing.location.lat,
            locationLng: listing.location.lng,
            status: ListingStatus.ACTIVE,
            availableFrom: new Date(),
            availableTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
            negotiable: true
          }
        });
        console.log(`✅ Created SELL listing: ${listing.title}`);
      }
    }

    // Create sample BUY listings (from buyers)
    const buyListings = [
      {
        product: catalogs.find(c => c.category === ProductCategory.WHEAT),
        title: 'Looking for Durum Wheat - Large Volume',
        description: 'Need high-quality durum wheat for pasta production facility.',
        quantity: 2000,
        pricePerUnit: 315,
        qualityGrade: 'Grade 1',
        location: { address: 'Chicago Processing Plant', lat: 41.8781, lng: -87.6298 }
      },
      {
        product: catalogs.find(c => c.category === ProductCategory.SOYBEAN_MEAL),
        title: 'Soybean Meal Needed - Regular Supply',
        description: 'Looking for consistent supplier of high-protein soybean meal for feed mill.',
        quantity: 500,
        pricePerUnit: 425,
        qualityGrade: 'Hi-Pro (48%)',
        location: { address: 'Kansas Feed Mill', lat: 38.5266, lng: -96.7265 }
      }
    ];

    for (const listing of buyListings) {
      if (listing.product) {
        await prisma.productListing.create({
          data: {
            productId: listing.product.id,
            userId: buyer.id,
            listingType: ListingType.BUY,
            title: listing.title,
            description: listing.description,
            quantity: listing.quantity,
            unit: ProductUnit.TON,
            pricePerUnit: listing.pricePerUnit,
            totalValue: listing.quantity * listing.pricePerUnit,
            qualityGrade: listing.qualityGrade,
            locationAddress: listing.location.address,
            locationLat: listing.location.lat,
            locationLng: listing.location.lng,
            status: ListingStatus.ACTIVE,
            deliveryBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            negotiable: true
          }
        });
        console.log(`✅ Created BUY listing: ${listing.title}`);
      }
    }

    console.log(`
✅ Product catalog seeding completed successfully!
📊 Summary:
   - Created ${catalogs.length} product catalog entries
   - Created ${sellListings.length} SELL listings
   - Created ${buyListings.length} BUY listings
   
The database now has:
- A complete product catalog with all tradeable products
- Sample buy/sell listings for demonstration
    `);

  } catch (error) {
    console.error('❌ Error seeding product catalog:', error);
    throw error;
  }
}

// Main function
async function main() {
  try {
    await seedProductCatalog();
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

export { seedProductCatalog };