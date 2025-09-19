import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seedTradeOperations() {
  console.log('🌱 Seeding trade operations...');

  // Get existing data
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    take: 2,
  });

  const buyers = await prisma.user.findMany({
    where: { role: 'BUYER' },
    take: 5,
  });

  const sellers = await prisma.user.findMany({
    where: { role: 'FARMER' },
    take: 10,
  });

  const transporters = await prisma.user.findMany({
    where: { role: 'TRANSPORTER' },
    take: 5,
  });

  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 5,
  });

  const addresses = await prisma.address.findMany({
    take: 10,
  });

  // Ensure we have minimum required data
  if (admins.length === 0) {
    console.log('Creating admin user...');
    const admin = await prisma.user.create({
      data: {
        email: 'admin@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i', // password123
        name: 'Admin User',
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true,
      },
    });
    admins.push(admin);
  }

  if (buyers.length === 0) {
    console.log('Creating buyer users...');
    for (let i = 0; i < 3; i++) {
      const buyer = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
          name: faker.person.fullName(),
          role: 'BUYER',
          phoneNumber: faker.phone.number(),
          isEmailVerified: true,
          isActive: true,
        },
      });
      buyers.push(buyer);
    }
  }

  if (sellers.length === 0) {
    console.log('Creating seller users...');
    for (let i = 0; i < 5; i++) {
      const seller = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
          name: faker.person.fullName(),
          role: 'FARMER',
          phoneNumber: faker.phone.number(),
          isEmailVerified: true,
          isActive: true,
        },
      });
      sellers.push(seller);
    }
  }

  if (products.length === 0) {
    console.log('No products found. Please seed products first.');
    return;
  }

  // Create BuyListings if they don't exist
  const existingBuyListings = await prisma.buyListing.findMany({
    where: { status: 'ACTIVE' },
    take: 5,
  });

  if (existingBuyListings.length === 0) {
    console.log('Creating buy listings...');
    for (let i = 0; i < 3; i++) {
      const buyListing = await prisma.buyListing.create({
        data: {
          productId: products[i % products.length].id,
          buyerId: buyers[i % buyers.length].id,
          quantity: faker.number.int({ min: 50, max: 200 }),
          unit: 'TON',
          maxPricePerUnit: faker.number.float({ min: 200, max: 500, fractionDigits: 2 }),
          neededBy: faker.date.future({ years: 0.5 }),
          deliveryAddressId: addresses.length > 0 ? addresses[0].id : null,
          status: 'ACTIVE',
        },
      });
      existingBuyListings.push(buyListing);
    }
  }

  // Create SaleListings if they don't exist
  const existingSaleListings = await prisma.saleListing.findMany({
    where: { status: 'ACTIVE' },
    take: 10,
  });

  if (existingSaleListings.length === 0) {
    console.log('Creating sale listings...');
    for (let i = 0; i < 5; i++) {
      const saleListing = await prisma.saleListing.create({
        data: {
          productId: products[i % products.length].id,
          sellerId: sellers[i % sellers.length].id,
          quantity: faker.number.int({ min: 30, max: 150 }),
          unit: 'TON',
          askingPrice: faker.number.float({ min: 180, max: 450, fractionDigits: 2 }),
          harvestDate: faker.date.recent({ days: 30 }),
          addressId: addresses.length > i ? addresses[i].id : null,
          status: 'ACTIVE',
          qualityScore: faker.number.int({ min: 60, max: 100 }),
        },
      });
      existingSaleListings.push(saleListing);
    }
  }

  // Create Trade Operations
  console.log('Creating trade operations...');

  // Trade Operation 1: In SELLER_MATCHING phase
  const trade1 = await prisma.tradeOperation.create({
    data: {
      operationNumber: `TRADE-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-0001`,
      adminId: admins[0].id,
      buyListingId: existingBuyListings[0].id,
      phase: 'SELLER_MATCHING',
      status: 'ACTIVE',
      currency: 'EUR',
      metadata: {
        notes: 'Initial trade operation for testing',
        priority: 'high',
      },
    },
  });

  // Add state history
  await prisma.tradeStateHistory.create({
    data: {
      tradeOperationId: trade1.id,
      toPhase: 'INITIATION',
      toStatus: 'ACTIVE',
      changedBy: admins[0].id,
      reason: 'Trade operation initiated',
    },
  });

  await prisma.tradeStateHistory.create({
    data: {
      tradeOperationId: trade1.id,
      fromPhase: 'INITIATION',
      toPhase: 'SELLER_MATCHING',
      changedBy: admins[0].id,
      reason: 'Moving to seller matching phase',
    },
  });

  // Trade Operation 2: In SELLER_NEGOTIATION phase with sellers
  if (existingBuyListings.length > 1 && existingSaleListings.length > 1) {
    const trade2 = await prisma.tradeOperation.create({
      data: {
        operationNumber: `TRADE-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-0002`,
        adminId: admins[0].id,
        buyListingId: existingBuyListings[1].id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
        totalValue: 25000,
        currency: 'EUR',
      },
    });

    // Add sellers to trade2
    const tradeSeller1 = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade2.id,
        sellerId: sellers[0].id,
        saleListingId: existingSaleListings[0].id,
        requestedQuantity: 50,
        offeredQuantity: 60,
        unit: 'TON',
        matchScore: 85,
        status: 'NEGOTIATING',
      },
    });

    const tradeSeller2 = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade2.id,
        sellerId: sellers[1].id,
        saleListingId: existingSaleListings[1].id,
        requestedQuantity: 30,
        offeredQuantity: 35,
        unit: 'TON',
        matchScore: 78,
        status: 'NEGOTIATING',
      },
    });

    // Create negotiations
    const negotiation1 = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: trade2.id,
        tradeSellerId: tradeSeller1.id,
        status: 'ACTIVE',
        initialOffer: 280,
        currentOffer: 285,
        quantity: 50,
        unit: 'TON',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      },
    });

    // Add offer rounds
    await prisma.offerRound.create({
      data: {
        negotiationId: negotiation1.id,
        roundNumber: 1,
        offeredBy: 'BUYER',
        price: 280,
        quantity: 50,
        terms: 'Initial offer from buyer',
      },
    });

    await prisma.offerRound.create({
      data: {
        negotiationId: negotiation1.id,
        roundNumber: 2,
        offeredBy: 'SELLER',
        price: 290,
        quantity: 50,
        terms: 'Counter offer from seller',
        response: 'COUNTERED',
        responseNote: 'Price too low for current market conditions',
        respondedAt: new Date(),
      },
    });

    await prisma.offerRound.create({
      data: {
        negotiationId: negotiation1.id,
        roundNumber: 3,
        offeredBy: 'BUYER',
        price: 285,
        quantity: 50,
        terms: 'Final offer from buyer',
      },
    });

    // Add a note
    await prisma.tradeNote.create({
      data: {
        tradeOperationId: trade2.id,
        authorId: admins[0].id,
        content: 'Negotiation in progress with two sellers. Seller 1 has better quality scores.',
        isInternal: true,
      },
    });
  }

  // Trade Operation 3: In TRANSPORT_BIDDING phase
  if (existingBuyListings.length > 2 && existingSaleListings.length > 2 && transporters.length > 0) {
    const trade3 = await prisma.tradeOperation.create({
      data: {
        operationNumber: `TRADE-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-0003`,
        adminId: admins[0].id,
        buyListingId: existingBuyListings[2].id,
        phase: 'TRANSPORT_BIDDING',
        status: 'ACTIVE',
        totalValue: 45000,
        commissionAmount: 1800, // 2.5% seller + 1.5% buyer = 4% total
        currency: 'EUR',
      },
    });

    // Add confirmed seller
    const tradeSeller3 = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade3.id,
        sellerId: sellers[2].id,
        saleListingId: existingSaleListings[2].id,
        requestedQuantity: 100,
        offeredQuantity: 100,
        agreedQuantity: 100,
        unit: 'TON',
        agreedPrice: 450,
        isVerified: true,
        matchScore: 92,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      },
    });

    // Create transport bids
    if (transporters.length > 0) {
      await prisma.transportBid.create({
        data: {
          tradeOperationId: trade3.id,
          transporterId: transporters[0].id,
          bidAmount: 2500,
          estimatedDuration: 24,
          vehicleType: 'FLATBED',
          vehicleCapacity: 120,
          specialEquipment: ['GPS Tracking', 'Temperature Monitor'],
          insuranceCoverage: 50000,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      if (transporters.length > 1) {
        await prisma.transportBid.create({
          data: {
            tradeOperationId: trade3.id,
            transporterId: transporters[1].id,
            bidAmount: 2300,
            estimatedDuration: 28,
            vehicleType: 'CURTAIN_SIDE',
            vehicleCapacity: 100,
            specialEquipment: ['GPS Tracking'],
            insuranceCoverage: 45000,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // Create an inspection request for unverified product
    await prisma.inspectionRequest.create({
      data: {
        tradeOperationId: trade3.id,
        saleListingId: existingSaleListings[2].id,
        priority: 'HIGH',
        latitude: 42.6977 + (Math.random() - 0.5) * 0.1,
        longitude: 23.3219 + (Math.random() - 0.5) * 0.1,
        address: faker.location.streetAddress(),
        status: 'PENDING',
      },
    });
  }

  console.log('✅ Trade operations seeded successfully!');
}

seedTradeOperations()
  .catch((e) => {
    console.error('Error seeding trade operations:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });