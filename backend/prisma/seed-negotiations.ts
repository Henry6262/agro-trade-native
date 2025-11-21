import { 
  PrismaClient, 
  NegotiationStatus,
  TradePhase,
  TradeStatus,
  ProductUnit,
  UserRole,
  ListingStatus,
  SellerStatus,
  ProductCategory
} from '@prisma/client';

const prisma = new PrismaClient();

async function seedNegotiations() {
  console.log('🌱 Starting negotiation seed data...');
  
  try {
    // First, ensure we have some basic data
    
    // Create admin user if not exists
    const admin = await prisma.user.upsert({
      where: { email: 'admin@agrotrade.com' },
      update: {},
      create: {
        email: 'admin@agrotrade.com',
        name: 'Admin User',
        role: UserRole.ADMIN,
      }
    });
    
    // Create buyer if not exists
    const buyer = await prisma.user.upsert({
      where: { email: 'buyer@test.com' },
      update: {},
      create: {
        email: 'buyer@test.com',
        name: 'Test Buyer',
        role: UserRole.BUYER,
      }
    });
    
    // Create sellers if not exist
    const seller1 = await prisma.user.upsert({
      where: { email: 'seller1@test.com' },
      update: {},
      create: {
        email: 'seller1@test.com',
        name: 'Farm Co-op Sofia',
        role: UserRole.FARMER,
      }
    });
    
    const seller2 = await prisma.user.upsert({
      where: { email: 'seller2@test.com' },
      update: {},
      create: {
        email: 'seller2@test.com',
        name: 'Plovdiv Grains Ltd',
        role: UserRole.FARMER,
      }
    });
    
    const seller3 = await prisma.user.upsert({
      where: { email: 'seller3@test.com' },
      update: {},
      create: {
        email: 'seller3@test.com',
        name: 'Varna Agricultural',
        role: UserRole.FARMER,
      }
    });
    
    // Create product if not exists
    const product = await prisma.product.upsert({
      where: { name: 'wheat' },
      update: {},
      create: {
        category: ProductCategory.SOFT_WHEAT,
        name: 'wheat',
        displayName: 'Wheat',
        description: 'Premium quality wheat',
        image: 'https://example.com/wheat.jpg',
        priceRangeMin: 280,
        priceRangeMax: 350,
        defaultUnit: ProductUnit.TON,
        isActive: true,
      }
    });
    
    // Create addresses for sellers
    const address1 = await prisma.address.create({
      data: {
        userId: seller1.id,
        addressType: 'WAREHOUSE',
        street: 'Sofia Region',
        country: 'Bulgaria',
        latitude: 42.6977,
        longitude: 23.3219,
        isDefault: true,
      }
    });
    
    const address2 = await prisma.address.create({
      data: {
        userId: seller2.id,
        addressType: 'WAREHOUSE',
        street: 'Plovdiv Region',
        country: 'Bulgaria',
        latitude: 42.1354,
        longitude: 24.7453,
        isDefault: true,
      }
    });
    
    const address3 = await prisma.address.create({
      data: {
        userId: seller3.id,
        addressType: 'WAREHOUSE',
        street: 'Varna Region',
        country: 'Bulgaria',
        latitude: 43.2141,
        longitude: 27.9147,
        isDefault: true,
      }
    });
    
    // Create sale listings for sellers
    const saleListing1 = await prisma.saleListing.create({
      data: {
        productId: product.id,
        sellerId: seller1.id,
        addressId: address1.id,
        quantity: 100,
        unit: ProductUnit.TON,
        askingPrice: 320,
        status: ListingStatus.ACTIVE,
      }
    });
    
    const saleListing2 = await prisma.saleListing.create({
      data: {
        productId: product.id,
        sellerId: seller2.id,
        addressId: address2.id,
        quantity: 150,
        unit: ProductUnit.TON,
        askingPrice: 315,
        status: ListingStatus.ACTIVE,
      }
    });
    
    const saleListing3 = await prisma.saleListing.create({
      data: {
        productId: product.id,
        sellerId: seller3.id,
        addressId: address3.id,
        quantity: 75,
        unit: ProductUnit.TON,
        askingPrice: 325,
        status: ListingStatus.ACTIVE,
      }
    });
    
    // Create buy listings
    const buyListing1 = await prisma.buyListing.create({
      data: {
        productId: product.id,
        buyerId: buyer.id,
        quantity: 200,
        unit: ProductUnit.TON,
        maxPricePerUnit: 350,
        status: ListingStatus.ACTIVE,
      }
    });
    
    const buyListing2 = await prisma.buyListing.create({
      data: {
        productId: product.id,
        buyerId: buyer.id,
        quantity: 100,
        unit: ProductUnit.TON,
        maxPricePerUnit: 348,
        status: ListingStatus.ACTIVE,
      }
    });
    
    // Create trade operations with different phases
    console.log('📊 Creating trade operations...');
    
    // Trade Operation 1: Active with negotiations
    const trade1 = await prisma.tradeOperation.create({
      data: {
        operationNumber: `OP-${Date.now()}-TEST1`,
        buyListingId: buyListing1.id,
        adminId: admin.id,
        phase: TradePhase.SELLER_NEGOTIATION,
        status: TradeStatus.ACTIVE,
        profitMargin: 7.5,
        sellingPrice: 350,
        totalRevenue: 70000,
        currency: 'EUR',
      }
    });
    
    // Add sellers to trade operation
    const tradeSeller1 = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade1.id,
        sellerId: seller1.id,
        saleListingId: saleListing1.id,
        requestedQuantity: 100,
        offeredQuantity: 100,
        unit: ProductUnit.TON,
        status: SellerStatus.NEGOTIATING,
      }
    });
    
    const tradeSeller2 = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade1.id,
        sellerId: seller2.id,
        saleListingId: saleListing2.id,
        requestedQuantity: 100,
        offeredQuantity: 150,
        unit: ProductUnit.TON,
        status: SellerStatus.INVITED,
      }
    });
    
    // Create negotiations with different statuses
    console.log('💬 Creating test negotiations...');
    
    // Negotiation 1: PENDING (awaiting response)
    const negotiation1 = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: trade1.id,
        tradeSellerId: tradeSeller1.id,
        status: NegotiationStatus.PENDING,
        currentOffer: {
          price: 315,
          quantity: 100,
          terms: 'Payment on delivery, quality inspection required'
        },
        offerHistory: [
          {
            price: 315,
            quantity: 100,
            terms: 'Payment on delivery, quality inspection required',
            createdAt: new Date().toISOString()
          }
        ],
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      }
    });
    
    // Negotiation 2: COUNTERED (seller made counter-offer)
    const negotiation2 = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: trade1.id,
        tradeSellerId: tradeSeller2.id,
        status: NegotiationStatus.COUNTERED,
        currentOffer: {
          price: 310,
          quantity: 100,
          terms: 'Standard terms'
        },
        counterOffer: {
          price: 318,
          quantity: 100,
          terms: 'Immediate payment required, can deliver within 3 days',
          receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        offerHistory: [
          {
            price: 310,
            quantity: 100,
            terms: 'Standard terms',
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        respondedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      }
    });
    
    // Trade Operation 2: Different phase
    const trade2 = await prisma.tradeOperation.create({
      data: {
        operationNumber: `OP-${Date.now()}-TEST2`,
        buyListingId: buyListing2.id,
        adminId: admin.id,
        phase: TradePhase.INITIATION,
        status: TradeStatus.ACTIVE,
        profitMargin: 8,
        sellingPrice: 348,
        totalRevenue: 69600,
        currency: 'EUR',
      }
    });
    
    // Add a seller with ACCEPTED negotiation
    const tradeSeller3 = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade2.id,
        sellerId: seller3.id,
        saleListingId: saleListing3.id,
        requestedQuantity: 75,
        offeredQuantity: 75,
        agreedQuantity: 75,
        agreedPrice: 322,
        unit: ProductUnit.TON,
        status: SellerStatus.ACCEPTED,
      }
    });
    
    const negotiation3 = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: trade2.id,
        tradeSellerId: tradeSeller3.id,
        status: NegotiationStatus.ACCEPTED,
        currentOffer: {
          price: 322,
          quantity: 75,
          terms: 'Agreed terms, delivery next week'
        },
        finalPrice: 322,
        finalQuantity: 75,
        offerHistory: [
          {
            price: 320,
            quantity: 75,
            terms: 'Initial offer',
            createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
          },
          {
            price: 322,
            quantity: 75,
            terms: 'Final agreed price',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
          }
        ],
        respondedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        concludedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
      }
    });
    
    // Create an expired negotiation
    const expiredTradeSeller = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade1.id,
        sellerId: seller3.id,
        saleListingId: saleListing3.id,
        requestedQuantity: 50,
        offeredQuantity: 75,
        unit: ProductUnit.TON,
        status: SellerStatus.REJECTED,
      }
    });
    
    const negotiation4 = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: trade1.id,
        tradeSellerId: expiredTradeSeller.id,
        status: NegotiationStatus.EXPIRED,
        currentOffer: {
          price: 318,
          quantity: 50,
          terms: 'Standard terms'
        },
        offerHistory: [
          {
            price: 318,
            quantity: 50,
            terms: 'Standard terms',
            createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
          }
        ],
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 24 hours ago
      }
    });
    
    console.log('✅ Negotiation seed data created successfully!');
    console.log(`
    Summary:
    - 2 Trade Operations created
    - 4 TradeSellers created
    - 4 Negotiations created:
      • 1 PENDING (awaiting response)
      • 1 COUNTERED (has counter-offer)
      • 1 ACCEPTED (completed)
      • 1 EXPIRED (timed out)
    `);
    
  } catch (error) {
    console.error('❌ Error seeding negotiations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedNegotiations()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });