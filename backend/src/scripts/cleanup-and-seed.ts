import { PrismaClient, UserRole, ProductUnit } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // Delete in correct order to respect foreign key constraints
    console.log('Removing trade sellers...');
    await prisma.tradeSeller.deleteMany({});
    
    console.log('Removing profit estimations...');
    await prisma.profitEstimation.deleteMany({});
    
    console.log('Removing trade operations...');
    await prisma.tradeOperation.deleteMany({});
    
    console.log('Removing buy listings...');
    await prisma.buyListing.deleteMany({});
    
    console.log('Removing sale listings...');
    await prisma.saleListing.deleteMany({});
    
    console.log('✅ Cleanup completed!');
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  }
}

async function seedFreshData() {
  console.log('🌱 Starting fresh data seeding...');
  
  try {
    // Get existing users and products
    const buyers = await prisma.user.findMany({
      where: { role: UserRole.BUYER },
      take: 5,
    });
    
    const sellers = await prisma.user.findMany({
      where: { role: UserRole.SELLER },
      take: 10,
    });
    
    const products = await prisma.product.findMany({
      take: 10,
    });
    
    if (buyers.length === 0 || sellers.length === 0 || products.length === 0) {
      console.log('⚠️  Need to create users and products first...');
      
      // Create products if missing
      if (products.length === 0) {
        console.log('Creating products...');
        const productData = [
          { name: 'Organic Wheat', displayName: 'Organic Wheat', category: 'GRAINS', defaultUnit: ProductUnit.TON, description: 'Premium organic wheat' },
          { name: 'Corn', displayName: 'Corn', category: 'GRAINS', defaultUnit: ProductUnit.TON, description: 'Fresh yellow corn' },
          { name: 'Tomatoes', displayName: 'Tomatoes', category: 'VEGETABLES', defaultUnit: ProductUnit.KG, description: 'Fresh ripe tomatoes' },
          { name: 'Potatoes', displayName: 'Potatoes', category: 'VEGETABLES', defaultUnit: ProductUnit.TON, description: 'Quality potatoes' },
          { name: 'Apples', displayName: 'Apples', category: 'FRUITS', defaultUnit: ProductUnit.KG, description: 'Fresh red apples' },
        ];
        
        for (const product of productData) {
          await prisma.product.create({ data: product });
        }
        products.push(...await prisma.product.findMany());
      }
      
      // Create buyers if missing
      if (buyers.length === 0) {
        console.log('Creating buyers...');
        for (let i = 1; i <= 5; i++) {
          const buyer = await prisma.user.create({
            data: {
              email: `buyer${i}@test.com`,
              name: `Test Buyer ${i}`,
              role: UserRole.BUYER,
              isEmailVerified: true,
              onboardingCompleted: true,
            },
          });
          buyers.push(buyer);
        }
      }
      
      // Create sellers if missing
      if (sellers.length === 0) {
        console.log('Creating sellers...');
        for (let i = 1; i <= 10; i++) {
          const seller = await prisma.user.create({
            data: {
              email: `seller${i}@test.com`,
              name: `Test Seller ${i}`,
              role: UserRole.SELLER,
              isEmailVerified: true,
              onboardingCompleted: true,
            },
          });
          sellers.push(seller);
        }
      }
    }
    
    console.log(`Found ${buyers.length} buyers, ${sellers.length} sellers, ${products.length} products`);
    
    // Create fresh buy listings
    console.log('Creating fresh buy listings...');
    const buyListings = [];
    
    for (let i = 0; i < 10; i++) {
      const buyer = buyers[i % buyers.length];
      const product = products[i % products.length];
      
      const listing = await prisma.buyListing.create({
        data: {
          buyerId: buyer.id,
          productId: product.id,
          quantity: 50 + Math.floor(Math.random() * 100), // 50-150 units
          unit: product.defaultUnit,
          maxPricePerUnit: 350 + Math.floor(Math.random() * 50), // 350-400
          preferredDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          status: 'ACTIVE',
        },
      });
      
      buyListings.push(listing);
      console.log(`  Created buy listing ${i + 1}/10 - ${product.name} for ${buyer.name}`);
    }
    
    // Create fresh sale listings with Bulgarian locations
    console.log('Creating fresh sale listings with locations...');
    const bulgarianCities = [
      { name: 'Sofia', lat: 42.6977, lng: 23.3219 },
      { name: 'Plovdiv', lat: 42.1354, lng: 24.7453 },
      { name: 'Varna', lat: 43.2141, lng: 27.9147 },
      { name: 'Burgas', lat: 42.4976, lng: 27.4615 },
      { name: 'Ruse', lat: 43.8356, lng: 25.9657 },
      { name: 'Stara Zagora', lat: 42.4258, lng: 25.6345 },
      { name: 'Pleven', lat: 43.4170, lng: 24.6067 },
      { name: 'Dobrich', lat: 43.5750, lng: 27.8273 },
      { name: 'Sliven', lat: 42.6858, lng: 26.3225 },
      { name: 'Pernik', lat: 42.6000, lng: 23.0333 },
    ];
    
    let saleListingCount = 0;
    for (const seller of sellers) {
      for (let j = 0; j < 3; j++) { // 3 listings per seller
        const product = products[(saleListingCount) % products.length];
        const city = bulgarianCities[saleListingCount % bulgarianCities.length];
        
        await prisma.saleListing.create({
          data: {
            sellerId: seller.id,
            productId: product.id,
            quantity: 100 + Math.floor(Math.random() * 200), // 100-300 units
            unit: product.defaultUnit,
            askingPrice: 320 + Math.floor(Math.random() * 30), // 320-350
            status: 'ACTIVE',
            qualityGrade: 'STANDARD',
            harvestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            description: `Fresh ${product.name} from ${city.name} region`,
          },
        });
        
        saleListingCount++;
        console.log(`  Created sale listing ${saleListingCount}/30 - ${product.name} from ${seller.name} in ${city.name}`);
      }
    }
    
    console.log('\n✅ Fresh data seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`  - ${buyListings.length} buy listings created`);
    console.log(`  - ${saleListingCount} sale listings created`);
    console.log(`  - All listings are ACTIVE and ready for trading`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await cleanup();
    await seedFreshData();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();