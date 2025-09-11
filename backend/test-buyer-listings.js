const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBuyerListings() {
  try {
    // Find a test user
    const user = await prisma.user.findFirst({});
    
    if (!user) {
      console.log('No users found');
      return;
    }
    
    console.log('Testing with user:', user.email);
    
    // Get ALL buyer listings
    const listings = await prisma.buyListing.findMany({
      include: {
        product: true,
        deliveryAddress: true,
        specifications: {
          include: {
            specificationType: true,
          }
        },
        offers: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    
    console.log('\n=== Found', listings.length, 'buyer listings ===\n');
    
    listings.forEach((listing, index) => {
      console.log(`\n=== Listing ${index + 1} ===`);
      console.log('ID:', listing.id);
      console.log('Product:', listing.product?.name);
      console.log('Quantity:', listing.quantity.toString(), listing.unit);
      console.log('Max Price:', listing.maxPricePerUnit?.toString());
      console.log('Status:', listing.status);
      
      console.log('\nSpecifications:', listing.specifications.length, 'specs');
      if (listing.specifications.length > 0) {
        listing.specifications.forEach(spec => {
          console.log(`  - ${spec.specificationType?.name || 'Unknown'}: ${spec.valueText || spec.valueNumber || spec.valueBool}`);
          console.log('    Raw spec:', {
            specTypeId: spec.specTypeId,
            valueNumber: spec.valueNumber?.toString(),
            valueText: spec.valueText,
            valueBool: spec.valueBool,
          });
        });
      } else {
        console.log('  No specifications found');
      }
    });
    
    // Also check if there are any ListingSpec entries
    const allSpecs = await prisma.listingSpec.findMany({
      where: { buyListingId: { not: null } },
      include: { specificationType: true },
      take: 5,
    });
    
    console.log('\n=== All ListingSpec entries (first 5) ===');
    allSpecs.forEach(spec => {
      console.log(`- BuyListing ${spec.buyListingId}: ${spec.specificationType?.name} = ${spec.valueText || spec.valueNumber}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBuyerListings();