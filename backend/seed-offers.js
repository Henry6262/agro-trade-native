const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedOffers() {
  try {
    console.log('=== Creating test offers ===\n');
    
    // Get all buy listings
    const buyListings = await prisma.buyListing.findMany({
      include: {
        product: true,
        buyer: true,
      }
    });
    
    if (buyListings.length === 0) {
      console.log('No buy listings found. Please create some buyer requests first.');
      return;
    }
    
    // Get all sale listings
    const saleListings = await prisma.saleListing.findMany({
      include: {
        product: true,
        seller: true,
      }
    });
    
    // For each buy listing, create 2-3 offers
    for (const buyListing of buyListings) {
      console.log(`Creating offers for buy listing: ${buyListing.product?.name}`);
      
      // Create offers with different match scores
      const offers = [
        {
          // High match offer
          buyListingId: buyListing.id,
          saleListingId: saleListings[0]?.id || null,
          offeredPrice: buyListing.maxPricePerUnit 
            ? parseFloat(buyListing.maxPricePerUnit) * 0.95 // 5% below max price
            : 250,
          quantity: buyListing.quantity,
          unit: buyListing.unit,
          matchScore: 92,
          matchDetails: {
            priceMatch: 95,
            quantityMatch: 100,
            specificationMatch: 90,
            locationMatch: 85,
          },
          basePrice: buyListing.maxPricePerUnit 
            ? parseFloat(buyListing.maxPricePerUnit) * 0.95
            : 250,
          finalPrice: buyListing.maxPricePerUnit 
            ? parseFloat(buyListing.maxPricePerUnit) * 0.95 * parseFloat(buyListing.quantity)
            : 250 * parseFloat(buyListing.quantity),
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          deliveryTerms: 'FOB - Free on Board',
          paymentTerms: 'Net 30 days',
          status: 'PENDING',
          createdBy: 'SELLER',
        },
        {
          // Medium match offer
          buyListingId: buyListing.id,
          saleListingId: saleListings[1]?.id || null,
          offeredPrice: buyListing.maxPricePerUnit 
            ? parseFloat(buyListing.maxPricePerUnit) * 0.98
            : 265,
          quantity: parseFloat(buyListing.quantity) * 0.9, // 90% of requested quantity
          unit: buyListing.unit,
          matchScore: 75,
          matchDetails: {
            priceMatch: 85,
            quantityMatch: 90,
            specificationMatch: 70,
            locationMatch: 60,
          },
          basePrice: buyListing.maxPricePerUnit 
            ? parseFloat(buyListing.maxPricePerUnit) * 0.98
            : 265,
          finalPrice: buyListing.maxPricePerUnit 
            ? parseFloat(buyListing.maxPricePerUnit) * 0.98 * parseFloat(buyListing.quantity) * 0.9
            : 265 * parseFloat(buyListing.quantity) * 0.9,
          validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
          deliveryTerms: 'CIF - Cost, Insurance & Freight',
          paymentTerms: 'Letter of Credit',
          status: 'PENDING',
          createdBy: 'SELLER',
        },
        {
          // Low match offer
          buyListingId: buyListing.id,
          saleListingId: saleListings[2]?.id || null,
          offeredPrice: buyListing.maxPricePerUnit 
            ? parseFloat(buyListing.maxPricePerUnit) * 1.05 // 5% above max price
            : 280,
          quantity: parseFloat(buyListing.quantity) * 1.2, // 120% of requested quantity
          unit: buyListing.unit,
          matchScore: 60,
          matchDetails: {
            priceMatch: 60,
            quantityMatch: 80,
            specificationMatch: 55,
            locationMatch: 45,
          },
          basePrice: buyListing.maxPricePerUnit 
            ? parseFloat(buyListing.maxPricePerUnit) * 1.05
            : 280,
          finalPrice: buyListing.maxPricePerUnit 
            ? parseFloat(buyListing.maxPricePerUnit) * 1.05 * parseFloat(buyListing.quantity) * 1.2
            : 280 * parseFloat(buyListing.quantity) * 1.2,
          validUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
          deliveryTerms: 'EXW - Ex Works',
          paymentTerms: 'Cash on Delivery',
          status: 'PENDING',
          createdBy: 'PLATFORM',
        },
      ];
      
      // Create offers in database
      for (const offerData of offers) {
        try {
          const offer = await prisma.offer.create({
            data: offerData,
            include: {
              buyListing: {
                include: {
                  product: true,
                  buyer: true,
                }
              },
              saleListing: {
                include: {
                  seller: true,
                }
              }
            }
          });
          
          console.log(`  ✓ Created offer with match score: ${offer.matchScore}%`);
        } catch (error) {
          console.log(`  ✗ Failed to create offer: ${error.message}`);
        }
      }
    }
    
    // Check total offers created
    const totalOffers = await prisma.offer.count();
    console.log(`\n✅ Total offers in database: ${totalOffers}`);
    
  } catch (error) {
    console.error('Error seeding offers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedOffers();