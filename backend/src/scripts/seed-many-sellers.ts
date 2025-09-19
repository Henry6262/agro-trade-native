import { PrismaClient, ProductUnit, ListingStatus, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Bulgarian farm names for realism
const farmNames = [
  'Green Valley Farms',
  'Sunrise Agriculture Co.',
  'Mountain View Harvest',
  'River Plains Farm',
  'Golden Fields Ltd.',
  'Organic Harvest Bulgaria',
  'Premium Grains Co.',
  'Nature\'s Best Farm',
  'Highland Agriculture',
  'Valley Fresh Produce',
  'Blue Sky Farms',
  'Harvest Moon Agriculture',
  'Spring Valley Co-op',
  'Autumn Harvest Farm',
  'Winter Wheat Specialists',
  'Summer Fields Ltd.',
  'Crystal Clear Farms',
  'Pure Harvest Bulgaria',
  'Elite Grains Trading',
  'Farm Fresh Direct',
  'Agricultural Excellence',
  'Prime Produce Partners',
  'Quality Crops Inc.',
  'Superior Seeds Farm',
  'Heritage Harvest Co.',
];

const cities = [
  { name: 'Sofia', lat: 42.6977, lng: 23.3219 },
  { name: 'Plovdiv', lat: 42.1354, lng: 24.7453 },
  { name: 'Varna', lat: 43.2141, lng: 27.9147 },
  { name: 'Burgas', lat: 42.5048, lng: 27.4626 },
  { name: 'Ruse', lat: 43.8356, lng: 25.9657 },
  { name: 'Stara Zagora', lat: 42.4258, lng: 25.6345 },
  { name: 'Pleven', lat: 43.4170, lng: 24.6067 },
  { name: 'Veliko Tarnovo', lat: 43.0757, lng: 25.6172 },
  { name: 'Dobrich', lat: 43.5725, lng: 27.8273 },
  { name: 'Shumen', lat: 43.2706, lng: 26.9229 },
];

async function main() {
  console.log('🌱 Seeding many sellers and sale listings...\n');

  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Get all products
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products\n`);

  // Get all buy listings to understand pricing
  const buyListings = await prisma.buyListing.findMany({
    include: { product: true },
  });

  console.log('👨‍🌾 Creating sellers...');
  
  // Create sellers (one per farm name)
  for (let i = 0; i < farmNames.length; i++) {
    const farmName = farmNames[i];
    const city = cities[i % cities.length];
    const email = `${farmName.toLowerCase().replace(/[^a-z0-9]/g, '')}@agrotrade.bg`;
    
    try {
      const seller = await prisma.user.upsert({
        where: { email },
        update: {
          name: farmName,
        },
        create: {
          email,
          password: hashedPassword,
          name: farmName,
          role: UserRole.FARMER,
          phoneNumber: `+35988${String(1000000 + i).padStart(7, '0')}`,
          isActive: true,
        },
      });

      console.log(`  ✅ Created seller: ${farmName}`);

      // Create 2-4 sale listings per seller
      const numListings = 2 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < numListings; j++) {
        // Pick a random product
        const product = products[Math.floor(Math.random() * products.length)];
        
        // Find buy listings for this product to determine pricing
        const productBuyListings = buyListings.filter(b => b.productId === product.id);
        
        let askingPrice: number;
        if (productBuyListings.length > 0) {
          // Price at 60-80% of highest buyer price for good margins
          const maxBuyPrice = Math.max(...productBuyListings.map(b => b.maxPricePerUnit?.toNumber() || 0));
          askingPrice = maxBuyPrice * (0.60 + Math.random() * 0.20);
        } else {
          // Default pricing based on product category
          const basePrices: Record<string, { min: number; max: number }> = {
            soft_wheat: { min: 240, max: 300 },
            durum_wheat: { min: 260, max: 330 },
            corn_maize: { min: 210, max: 280 },
            barley: { min: 200, max: 270 },
            oats: { min: 180, max: 250 },
            sunflower: { min: 360, max: 460 },
            rapeseed: { min: 390, max: 490 },
            peas: { min: 285, max: 380 },
            soybean_meal: { min: 330, max: 430 },
            wheat_bran: { min: 150, max: 220 },
            alfalfa: { min: 135, max: 200 },
            other: { min: 180, max: 320 },
          };
          
          const priceRange = basePrices[product.name.toLowerCase().replace(' ', '_')] || basePrices.other;
          askingPrice = priceRange.min + Math.random() * (priceRange.max - priceRange.min);
        }

        // Check if this seller already has a listing for this product
        const existingListing = await prisma.saleListing.findFirst({
          where: {
            sellerId: seller.id,
            productId: product.id,
            status: ListingStatus.ACTIVE,
          },
        });

        if (!existingListing) {
          const quantity = 50 + Math.floor(Math.random() * 450); // 50-500 tons
          
          const saleListing = await prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: product.id,
              quantity,
              unit: ProductUnit.TON,
              askingPrice: Math.round(askingPrice * 100) / 100,
              status: ListingStatus.ACTIVE,
              harvestDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Within last 60 days
              qualityScore: 70 + Math.floor(Math.random() * 30), // 70-100 quality score
              qualityGrade: ['Premium', 'Standard', 'Economy'][Math.floor(Math.random() * 3)],
            },
          });

          console.log(`    📦 ${product.name}: ${quantity} tons @ €${askingPrice.toFixed(2)}/ton`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Error creating seller ${farmName}:`, error);
    }
  }

  // Summary statistics
  console.log('\n📊 Summary:');
  
  const totalSellers = await prisma.user.count({ where: { role: UserRole.FARMER } });
  const totalSaleListings = await prisma.saleListing.count({ where: { status: ListingStatus.ACTIVE } });
  
  console.log(`  Total sellers: ${totalSellers}`);
  console.log(`  Total active sale listings: ${totalSaleListings}`);

  // Check matching possibilities
  console.log('\n🔍 Checking matching possibilities:');
  
  for (const buyListing of buyListings.slice(0, 5)) { // Check first 5 buy listings
    const matchingSales = await prisma.saleListing.count({
      where: {
        productId: buyListing.productId,
        status: ListingStatus.ACTIVE,
        askingPrice: { lte: (buyListing.maxPricePerUnit?.toNumber() || 0) * 0.85 },
      },
    });

    console.log(`  ${buyListing.product.name}: ${matchingSales} matching sellers available`);
  }

  console.log('\n✅ Seeding complete!');
  console.log('📝 All sellers have password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });