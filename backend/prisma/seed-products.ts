import { PrismaClient, ProductCategory, ProductStatus, ProductUnit } from '@prisma/client';

const prisma = new PrismaClient();

interface ProductData {
  name: string;
  category: ProductCategory;
  image: string;
  description: string;
  nutritionalInfo?: string;
  useCases?: string[];
  harvestSeason?: string;
  storageRecommendations?: string;
  priceRange?: { min: number; max: number };
}

const productsData: ProductData[] = [
  {
    name: 'Barley',
    category: ProductCategory.BARLEY,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192666/barley_nw6okk.png',
    description: 'High-quality barley ideal for brewing, animal feed, and food production. Known for its versatility and nutritional value.',
    nutritionalInfo: 'Rich in fiber, vitamins B1, B3, and minerals including selenium, copper, and manganese.',
    useCases: ['Malting for beer production', 'Animal feed', 'Soups and stews', 'Barley flour'],
    harvestSeason: 'June to August',
    storageRecommendations: 'Store in cool, dry conditions with moisture content below 14%',
    priceRange: { min: 200, max: 280 }
  },
  {
    name: 'Corn (Maize)',
    category: ProductCategory.CORN,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192559/corn_jiuqv5.webp',
    description: 'Premium yellow corn suitable for human consumption, animal feed, and industrial processing. Non-GMO varieties available.',
    nutritionalInfo: 'Good source of carbohydrates, vitamin B, fiber, and essential minerals.',
    useCases: ['Animal feed', 'Corn flour and meal', 'Ethanol production', 'Food processing', 'Corn oil'],
    harvestSeason: 'September to November',
    storageRecommendations: 'Maintain moisture below 15%, store in ventilated silos',
    priceRange: { min: 220, max: 300 }
  },
  {
    name: 'Peas',
    category: ProductCategory.PEAS,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/peas_qjdrjq.webp',
    description: 'High-protein yellow and green peas perfect for food processing and animal feed. Excellent source of plant-based protein.',
    nutritionalInfo: 'High in protein (23-25%), fiber, vitamins A, C, K, and folate.',
    useCases: ['Split peas', 'Pea flour', 'Animal feed', 'Protein powder', 'Food processing'],
    harvestSeason: 'July to September',
    storageRecommendations: 'Store at 14% moisture or less, protect from pests',
    priceRange: { min: 320, max: 400 }
  },
  {
    name: 'Soybean',
    category: ProductCategory.SOYBEAN_MEAL,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192559/soybean_jzz3oq.jpg',
    description: 'Premium soybeans for meal and oil production. High protein content ideal for animal feed and food processing.',
    nutritionalInfo: 'Excellent source of complete protein (36-40%), healthy fats, and isoflavones.',
    useCases: ['Soybean meal', 'Soy oil', 'Tofu production', 'Animal feed', 'Soy flour'],
    harvestSeason: 'September to October',
    storageRecommendations: 'Store at 13% moisture or less in aerated bins',
    priceRange: { min: 380, max: 480 }
  },
  {
    name: 'Sunflower',
    category: ProductCategory.SUNFLOWER,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/sunflower_jbywaa.webp',
    description: 'High-oil content sunflower seeds perfect for oil production and confectionery use. Both black oil and striped varieties available.',
    nutritionalInfo: 'Rich in vitamin E, healthy fats, protein, and minerals like magnesium and selenium.',
    useCases: ['Sunflower oil production', 'Confectionery seeds', 'Bird feed', 'Bakery products'],
    harvestSeason: 'August to October',
    storageRecommendations: 'Store at 10% moisture or less, protect from heat',
    priceRange: { min: 420, max: 520 }
  },
  {
    name: 'Durum Wheat',
    category: ProductCategory.WHEAT,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/durum_wheat_maskoy.png',
    description: 'Premium durum wheat with high protein content and excellent gluten quality, perfect for pasta and semolina production.',
    nutritionalInfo: 'High protein (13-15%), rich in B vitamins, iron, and dietary fiber.',
    useCases: ['Pasta production', 'Semolina', 'Couscous', 'Specialty breads'],
    harvestSeason: 'July to August',
    storageRecommendations: 'Store at 13.5% moisture or less, maintain good ventilation',
    priceRange: { min: 300, max: 380 }
  },
  {
    name: 'Oats',
    category: ProductCategory.OATS,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/oats_g2ugm8.webp',
    description: 'Premium milling oats suitable for human consumption and animal feed. High in soluble fiber and beta-glucans.',
    nutritionalInfo: 'Excellent source of beta-glucan fiber, protein, vitamins B1 and B5, and minerals.',
    useCases: ['Oatmeal and rolled oats', 'Oat flour', 'Animal feed', 'Oat milk production'],
    harvestSeason: 'July to September',
    storageRecommendations: 'Store at 14% moisture or less, protect from heat and moisture',
    priceRange: { min: 180, max: 250 }
  },
  {
    name: 'Soft Wheat',
    category: ProductCategory.WHEAT,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/soft_wheat_bfxdaa.png',
    description: 'High-quality soft wheat with lower protein content, ideal for pastries, cakes, cookies, and crackers.',
    nutritionalInfo: 'Good source of carbohydrates, B vitamins, and minerals including iron and zinc.',
    useCases: ['Pastry flour', 'Cake flour', 'Cookies and crackers', 'Breakfast cereals'],
    harvestSeason: 'June to August',
    storageRecommendations: 'Store at 13.5% moisture or less in clean, dry bins',
    priceRange: { min: 260, max: 340 }
  },
  {
    name: 'Canola (Rapeseed)',
    category: ProductCategory.RAPESEED,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192554/canola_wom5lk.png',
    description: 'Premium canola/rapeseed for oil production. Low in erucic acid and glucosinolates, ideal for food-grade oil.',
    nutritionalInfo: 'High in healthy monounsaturated fats, omega-3 fatty acids, and vitamin E.',
    useCases: ['Canola oil production', 'Biodiesel', 'Animal feed (meal)', 'Industrial lubricants'],
    harvestSeason: 'July to August',
    storageRecommendations: 'Store at 8-9% moisture, protect from heat to prevent quality loss',
    priceRange: { min: 450, max: 550 }
  },
  {
    name: 'Wheat Bran',
    category: ProductCategory.WHEAT_BRAN,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192552/wheat_bran_q6qze9.png',
    description: 'High-fiber wheat bran, a valuable by-product of wheat milling. Excellent for animal feed and human nutrition.',
    nutritionalInfo: 'Very high in dietary fiber, B vitamins, minerals, and antioxidants.',
    useCases: ['Animal feed supplement', 'Breakfast cereals', 'Bakery products', 'Dietary supplements'],
    harvestSeason: 'Available year-round',
    storageRecommendations: 'Store in dry conditions, protect from moisture and pests',
    priceRange: { min: 160, max: 220 }
  },
  {
    name: 'Alfalfa Pellets',
    category: ProductCategory.ALFALFA,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192552/alfalfa_pallets_saqhco.webp',
    description: 'High-quality alfalfa compressed into pellets for easy storage and transport. Premium livestock feed with high nutritional value.',
    nutritionalInfo: 'High in protein (15-20%), calcium, vitamins A, D, E, and K.',
    useCases: ['Horse feed', 'Cattle feed', 'Small animal feed', 'Organic fertilizer'],
    harvestSeason: 'Multiple cuts from May to October',
    storageRecommendations: 'Store in dry, well-ventilated areas, protect from moisture',
    priceRange: { min: 230, max: 320 }
  },
  {
    name: 'Other Agricultural Products',
    category: ProductCategory.OTHER,
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192556/other_gagfht.png',
    description: 'Various other agricultural products available upon request, including specialty grains, seeds, and agricultural by-products.',
    nutritionalInfo: 'Varies by product type',
    useCases: ['Specialty markets', 'Custom orders', 'Niche applications'],
    harvestSeason: 'Varies by product',
    storageRecommendations: 'Product-specific storage requirements',
    priceRange: { min: 0, max: 0 } // Price on request
  }
];

async function seedProducts() {
  console.log('🌱 Starting products database seed...');

  try {
    // First, clean existing products
    await prisma.product.deleteMany({});
    console.log('✨ Cleared existing products');

    // Get or create a default farmer user for products
    let defaultFarmer = await prisma.user.findFirst({
      where: { role: 'FARMER' }
    });

    if (!defaultFarmer) {
      defaultFarmer = await prisma.user.create({
        data: {
          email: 'default.farmer@agrotrade.com',
          name: 'AgroTrade Marketplace',
          role: 'FARMER',
          phone: '+1234567890',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ Created default farmer user');
    }

    // Create products with comprehensive information
    const createdProducts = [];
    
    for (const productData of productsData) {
      // Create multiple product listings for variety
      const quantities = [100, 250, 500, 1000, 2500];
      const locations = [
        { address: 'Iowa Farm District', lat: 41.5868, lng: -93.6250 },
        { address: 'Kansas Agricultural Zone', lat: 38.5266, lng: -96.7265 },
        { address: 'Nebraska Grain Belt', lat: 41.4925, lng: -99.9018 },
        { address: 'North Dakota Fields', lat: 47.5515, lng: -101.0020 },
        { address: 'Minnesota Farm Region', lat: 46.7296, lng: -94.6859 }
      ];

      // Create 2-3 listings per product type for variety
      const numListings = productData.category === ProductCategory.OTHER ? 1 : Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < numListings; i++) {
        const location = locations[Math.floor(Math.random() * locations.length)];
        const quantity = quantities[Math.floor(Math.random() * quantities.length)];
        
        const product = await prisma.product.create({
          data: {
            farmerId: defaultFarmer.id,
            category: productData.category,
            quantity: quantity,
            unit: ProductUnit.TON,
            locationAddress: location.address,
            locationLat: location.lat,
            locationLng: location.lng,
            status: ProductStatus.AVAILABLE
          }
        });
        
        createdProducts.push({
          ...product,
          name: productData.name,
          image: productData.image,
          description: productData.description,
          details: {
            nutritionalInfo: productData.nutritionalInfo,
            useCases: productData.useCases,
            harvestSeason: productData.harvestSeason,
            storageRecommendations: productData.storageRecommendations,
            priceRange: productData.priceRange
          }
        });
      }
      
      console.log(`✅ Created ${numListings} listings for ${productData.name}`);
    }

    // Store product metadata in a separate JSON file for frontend reference
    const productMetadata = productsData.map(product => ({
      name: product.name,
      category: product.category,
      image: product.image,
      description: product.description,
      nutritionalInfo: product.nutritionalInfo,
      useCases: product.useCases,
      harvestSeason: product.harvestSeason,
      storageRecommendations: product.storageRecommendations,
      priceRange: product.priceRange
    }));

    // Save metadata to a JSON file that frontend can use
    const fs = await import('fs');
    const pathModule = await import('path');
    
    const metadataPath = pathModule.join(process.cwd(), 'src', 'data', 'products-metadata.json');
    
    // Ensure directory exists
    const dir = pathModule.dirname(metadataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(metadataPath, JSON.stringify(productMetadata, null, 2));
    console.log('📝 Saved product metadata to src/data/products-metadata.json');

    console.log(`
✅ Products seeding completed successfully!
📊 Summary:
   - Created ${createdProducts.length} product listings
   - Categories covered: ${new Set(productsData.map(p => p.category)).size}
   - Products with images: ${productsData.length}
   - Metadata file created for frontend use
    `);

    return createdProducts;
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

// Main function to run the seed
async function main() {
  try {
    await seedProducts();
  } catch (e) {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { seedProducts };