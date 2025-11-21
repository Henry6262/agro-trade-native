import { PrismaClient, AddressType } from '@prisma/client';
import { faker } from '@faker-js/faker';

type Coordinate = {
  latitude: number;
  longitude: number;
};

const CITY_COORDINATES: Record<string, Coordinate[]> = {
  sofia: [
    { latitude: 42.697708, longitude: 23.321868 },
    { latitude: 42.689882, longitude: 23.301171 },
    { latitude: 42.67342, longitude: 23.299833 },
  ],
  varna: [
    { latitude: 43.21405, longitude: 27.914734 },
    { latitude: 43.201297, longitude: 27.938801 },
    { latitude: 43.189247, longitude: 27.8805 },
  ],
  plovdiv: [
    { latitude: 42.135407, longitude: 24.74529 },
    { latitude: 42.155107, longitude: 24.712338 },
    { latitude: 42.118402, longitude: 24.716216 },
  ],
  ruse: [
    { latitude: 43.835571, longitude: 25.965655 },
    { latitude: 43.829528, longitude: 25.96588 },
    { latitude: 43.812028, longitude: 25.992246 },
  ],
  burgas: [
    { latitude: 42.504793, longitude: 27.462636 },
    { latitude: 42.482205, longitude: 27.46803 },
    { latitude: 42.508937, longitude: 27.497897 },
  ],
  'stara zagora': [
    { latitude: 42.425778, longitude: 25.634464 },
    { latitude: 42.419699, longitude: 25.625751 },
    { latitude: 42.435444, longitude: 25.60807 },
  ],
  vidin: [
    { latitude: 43.996155, longitude: 22.8679 },
    { latitude: 43.993116, longitude: 22.849265 },
    { latitude: 43.989801, longitude: 22.893885 },
  ],
  dobrich: [
    { latitude: 43.57259, longitude: 27.82728 },
    { latitude: 43.571194, longitude: 27.84099 },
    { latitude: 43.567722, longitude: 27.800003 },
  ],
  blagoevgrad: [
    { latitude: 42.020923, longitude: 23.09423 },
    { latitude: 42.010608, longitude: 23.08239 },
    { latitude: 42.029513, longitude: 23.096096 },
  ],
  montana: [
    { latitude: 43.4125, longitude: 23.2257 },
    { latitude: 43.401535, longitude: 23.219596 },
    { latitude: 43.421059, longitude: 23.239914 },
  ],
  pleven: [
    { latitude: 43.417042, longitude: 24.606111 },
    { latitude: 43.411761, longitude: 24.572723 },
    { latitude: 43.432268, longitude: 24.589482 },
  ],
  sliven: [
    { latitude: 42.6818, longitude: 26.3226 },
    { latitude: 42.705201, longitude: 26.319425 },
    { latitude: 42.673866, longitude: 26.326549 },
  ],
  'veliko tarnovo': [
    { latitude: 43.0757, longitude: 25.6172 },
    { latitude: 43.086564, longitude: 25.607036 },
    { latitude: 43.082561, longitude: 25.614422 },
  ],
  shumen: [
    { latitude: 43.271239, longitude: 26.936128 },
    { latitude: 43.273646, longitude: 26.925008 },
    { latitude: 43.256097, longitude: 26.934961 },
  ],
  yambol: [
    { latitude: 42.483, longitude: 26.501 },
    { latitude: 42.487097, longitude: 26.500448 },
    { latitude: 42.461417, longitude: 26.495505 },
  ],
  pernik: [
    { latitude: 42.607, longitude: 23.037 },
    { latitude: 42.599661, longitude: 23.020899 },
    { latitude: 42.597276, longitude: 23.045706 },
  ],
  pazardzhik: [
    { latitude: 42.1928, longitude: 24.3336 },
    { latitude: 42.205754, longitude: 24.342282 },
    { latitude: 42.190599, longitude: 24.335958 },
  ],
  kyustendil: [
    { latitude: 42.283, longitude: 22.691 },
    { latitude: 42.269865, longitude: 22.698956 },
    { latitude: 42.282863, longitude: 22.70392 },
  ],
};

const listAvailableCities = (): string[] => Object.keys(CITY_COORDINATES);

const getLocationForCity = (
  cityName: string,
  index: number,
): { coordinate: Coordinate } | null => {
  const coordinates = CITY_COORDINATES[cityName.toLowerCase()];
  if (!coordinates || coordinates.length === 0) {
    return null;
  }
  const coordinate = coordinates[index % coordinates.length];
  return { coordinate };
};

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

  // Prepare address pools for deterministic coordinates
  const cityRecords = await prisma.city.findMany({
    where: { country: 'Bulgaria' },
  });
  const cityIdMap = new Map(cityRecords.map((city) => [city.name.toLowerCase(), city.id]));
  const availableCities = listAvailableCities().filter((city) =>
    cityIdMap.has(city.toLowerCase()),
  );

  if (availableCities.length === 0) {
    console.warn('⚠️ No matching cities found for coordinate dataset. Skipping location seeding.');
  }

  const buyerAddressByUser = new Map<string, string>();
  const sellerAddressByUser = new Map<string, string>();

  // Create addresses for buyers
  if (availableCities.length > 0) {
    let buyerLocationIndex = 0;
    for (const buyer of buyers) {
      const cityName = availableCities[buyerLocationIndex % availableCities.length];
      const location = getLocationForCity(cityName, buyerLocationIndex);
      const cityId = cityIdMap.get(cityName.toLowerCase());

      let latitude = 42.697708;
      let longitude = 23.321868;
      let street = `${cityName} Logistics Hub`;
      let postalCode = faker.number.int({ min: 1000, max: 9999 }).toString();
      const addressType: AddressType = AddressType.WAREHOUSE;

      if (location) {
        latitude = location.coordinate.latitude;
        longitude = location.coordinate.longitude;
      }

      const address = await prisma.address.create({
        data: {
          userId: buyer.id,
          addressType,
          street,
          postalCode,
          country: 'Bulgaria',
          latitude,
          longitude,
          cityId: cityId ?? null,
          isDefault: true,
        },
      });

      buyerAddressByUser.set(buyer.id, address.id);
      buyerLocationIndex += 1;
    }

    // Create addresses for sellers (farmers)
    let sellerLocationIndex = 0;
    for (const seller of sellers) {
      const cityName = availableCities[sellerLocationIndex % availableCities.length];
      const location = getLocationForCity(cityName, sellerLocationIndex + buyers.length);
      const cityId = cityIdMap.get(cityName.toLowerCase());

      let latitude = 42.697708;
      let longitude = 23.321868;
      let street = `Farm Road ${faker.number.int({ min: 1, max: 180 })}`;
      let postalCode = faker.number.int({ min: 1000, max: 9999 }).toString();
      const addressType: AddressType = AddressType.FARM;

      if (location) {
        latitude = location.coordinate.latitude;
        longitude = location.coordinate.longitude;
      }

      const address = await prisma.address.create({
        data: {
          userId: seller.id,
          addressType,
          street,
          postalCode,
          country: 'Bulgaria',
          latitude,
          longitude,
          cityId: cityId ?? null,
          isDefault: true,
        },
      });

      sellerAddressByUser.set(seller.id, address.id);
      sellerLocationIndex += 1;
    }
  }

  // Create BuyListings if they don't exist
  const existingBuyListings = await prisma.buyListing.findMany({
    where: { status: 'ACTIVE' },
    take: 5,
  });

  if (existingBuyListings.length === 0) {
    console.log('Creating buy listings...');
    for (let i = 0; i < 3; i++) {
      const buyer = buyers[i % buyers.length];
      const deliveryAddressId = buyerAddressByUser.get(buyer.id) ?? null;

      const buyListing = await prisma.buyListing.create({
        data: {
          productId: products[i % products.length].id,
          buyerId: buyer.id,
          quantity: faker.number.int({ min: 50, max: 200 }),
          unit: 'TON',
          maxPricePerUnit: faker.number.float({ min: 200, max: 500, fractionDigits: 2 }),
          neededBy: faker.date.future({ years: 0.5 }),
          deliveryAddressId,
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
      const seller = sellers[i % sellers.length];
      const addressId = sellerAddressByUser.get(seller.id) ?? null;

      const saleListing = await prisma.saleListing.create({
        data: {
          productId: products[i % products.length].id,
          sellerId: seller.id,
          quantity: faker.number.int({ min: 30, max: 150 }),
          unit: 'TON',
          askingPrice: faker.number.float({ min: 180, max: 450, fractionDigits: 2 }),
          harvestDate: faker.date.recent({ days: 30 }),
          addressId,
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
