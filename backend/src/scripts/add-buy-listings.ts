import { PrismaClient, UserRole, ProductUnit, ListingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function addBuyListings() {
  console.log('📦 Creating buy listings for buyers...');
  
  try {
    // Get all buyers
    const buyers = await prisma.user.findMany({
      where: { role: UserRole.BUYER },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });
    
    console.log(`Found ${buyers.length} buyers`);
    
    // Get all products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        defaultUnit: true,
      }
    });
    
    if (products.length === 0) {
      console.log('⚠️  No products found. Creating basic products...');
      
      const productData = [
        { name: 'wheat', displayName: 'Wheat', category: 'GRAINS' as any, defaultUnit: ProductUnit.TON },
        { name: 'corn', displayName: 'Corn', category: 'GRAINS' as any, defaultUnit: ProductUnit.TON },
        { name: 'tomatoes', displayName: 'Tomatoes', category: 'VEGETABLES' as any, defaultUnit: ProductUnit.KG },
        { name: 'potatoes', displayName: 'Potatoes', category: 'VEGETABLES' as any, defaultUnit: ProductUnit.TON },
        { name: 'apples', displayName: 'Apples', category: 'FRUITS' as any, defaultUnit: ProductUnit.KG },
      ];
      
      for (const product of productData) {
        const created = await prisma.product.create({ data: product });
        products.push(created);
      }
    }
    
    console.log(`Found ${products.length} products`);
    
    // Create buy listings for each buyer
    const createdListings = [];
    let listingCount = 0;
    
    for (const buyer of buyers) {
      // Skip if buyer already has active listings
      const existingListings = await prisma.buyListing.count({
        where: {
          buyerId: buyer.id,
          status: ListingStatus.ACTIVE,
        }
      });
      
      if (existingListings > 0) {
        console.log(`⏭️  ${buyer.name} already has ${existingListings} active listings`);
        continue;
      }
      
      // Create 2-3 listings per buyer
      const numListings = Math.floor(Math.random() * 2) + 2; // 2 or 3 listings
      
      for (let i = 0; i < numListings; i++) {
        const product = products[(listingCount + i) % products.length];
        const quantity = Math.floor(Math.random() * 100) + 50; // 50-150 units
        const maxPrice = Math.floor(Math.random() * 50) + 350; // 350-400 per unit
        
        const listing = await prisma.buyListing.create({
          data: {
            buyerId: buyer.id,
            productId: product.id,
            quantity,
            unit: product.defaultUnit,
            maxPricePerUnit: maxPrice,
            status: ListingStatus.ACTIVE,
            // deliveryDate field might not exist, so commenting out
            // deliveryDate: new Date(Date.now() + (7 + i) * 24 * 60 * 60 * 1000), // 7-9 days from now
          }
        });
        
        createdListings.push(listing);
        listingCount++;
        console.log(`✅ Created listing for ${buyer.name}: ${quantity} ${product.defaultUnit} of ${product.name} @ max €${maxPrice}/unit`);
      }
    }
    
    // Summary
    const totalListings = await prisma.buyListing.count({
      where: { status: ListingStatus.ACTIVE }
    });
    
    console.log('\n📊 Summary:');
    console.log(`  - Created ${createdListings.length} new buy listings`);
    console.log(`  - Total active buy listings: ${totalListings}`);
    
    // Show listings by buyer
    console.log('\n📋 Active listings by buyer:');
    for (const buyer of buyers) {
      const listings = await prisma.buyListing.findMany({
        where: {
          buyerId: buyer.id,
          status: ListingStatus.ACTIVE,
        },
        include: {
          product: true,
        }
      });
      
      if (listings.length > 0) {
        console.log(`\n  ${buyer.name}:`);
        listings.forEach(listing => {
          console.log(`    - ${listing.quantity} ${listing.unit} of ${listing.product.name} @ max €${listing.maxPricePerUnit}/unit`);
        });
      }
    }
    
    console.log('\n✅ Buy listings created successfully!');
    console.log('You can now create trade operations with these active buy listings.');
    
  } catch (error) {
    console.error('❌ Error creating buy listings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addBuyListings()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });