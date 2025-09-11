const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOffers() {
  try {
    // Check if there are any offers
    const offers = await prisma.offer.findMany({
      include: {
        saleListing: {
          include: {
            seller: true,
            product: true,
          }
        },
        buyListing: {
          include: {
            buyer: true,
            product: true,
          }
        }
      },
      take: 5
    });
    
    console.log('=== OFFERS IN DATABASE ===');
    console.log('Total offers found:', offers.length);
    
    if (offers.length > 0) {
      offers.forEach((offer, index) => {
        console.log(`\n--- Offer ${index + 1} ---`);
        console.log('ID:', offer.id);
        console.log('Price:', offer.offeredPrice);
        console.log('Quantity:', offer.quantity, offer.unit);
        console.log('Match Score:', offer.matchScore);
        console.log('Status:', offer.status);
        console.log('Buy Listing:', offer.buyListingId);
        console.log('Sale Listing:', offer.saleListingId);
      });
    }
    
    // Check if there are any sale listings (needed for offers)
    const saleListings = await prisma.saleListing.findMany({
      include: {
        seller: true,
        product: true,
      },
      take: 3
    });
    
    console.log('\n=== SALE LISTINGS (for creating offers) ===');
    console.log('Total sale listings found:', saleListings.length);
    
    // Check buyer listings that could receive offers
    const buyListings = await prisma.buyListing.findMany({
      include: {
        buyer: true,
        product: true,
        offers: true,
      },
      take: 3
    });
    
    console.log('\n=== BUY LISTINGS (that can receive offers) ===');
    console.log('Total buy listings found:', buyListings.length);
    
    buyListings.forEach((listing, index) => {
      console.log(`\nBuy Listing ${index + 1}:`);
      console.log('- ID:', listing.id);
      console.log('- Product:', listing.product?.name);
      console.log('- Quantity:', listing.quantity, listing.unit);
      console.log('- Max Price:', listing.maxPricePerUnit);
      console.log('- Offers received:', listing.offers.length);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOffers();