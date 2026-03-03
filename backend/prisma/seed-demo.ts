/**
 * Demo Seed Script for Agro-Trade Platform
 *
 * Creates realistic demo data for a presentation showcasing:
 * - Sale listings from 2 farmers
 * - Buy listings from buyer
 * - Trade operations in various phases
 * - Negotiations (offers, counter-offers, accepted)
 * - Transport company user + transport request + bids
 * - Inspection records
 *
 * IMPORTANT: Assumes the following users ALREADY EXIST in the database:
 *   admin@agrotrade.com   (ADMIN)
 *   seller1@agrotrade.com (FARMER)
 *   seller2@agrotrade.com (FARMER)
 *   buyer@agrotrade.com   (BUYER)
 *
 * Run with: ts-node prisma/seed-demo.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ==================== HELPERS ====================

/** Return a date N days from now (positive) or ago (negative) */
function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/** Simple sequential operation-number generator */
let opCounter = 1001;
function nextOpNumber(): string {
  return `OP-${opCounter++}`;
}

let reqCounter = 3001;
function nextReqNumber(): string {
  return `TR-${reqCounter++}`;
}

let jobCounter = 5001;
function nextJobNumber(): string {
  return `TJ-${jobCounter++}`;
}

// ==================== MAIN ====================

async function main() {
  console.log('Demo seed starting...');

  // ---- 1. Fetch existing core entities ----
  console.log('Fetching existing users...');
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@agrotrade.com' } });
  const seller1 = await prisma.user.findUniqueOrThrow({ where: { email: 'seller1@agrotrade.com' } });
  const seller2 = await prisma.user.findUniqueOrThrow({ where: { email: 'seller2@agrotrade.com' } });
  const buyer = await prisma.user.findUniqueOrThrow({ where: { email: 'buyer@agrotrade.com' } });

  console.log(`  admin    : ${admin.id}`);
  console.log(`  seller1  : ${seller1.id}`);
  console.log(`  seller2  : ${seller2.id}`);
  console.log(`  buyer    : ${buyer.id}`);

  // ---- 2. Fetch products ----
  console.log('Fetching products...');
  const products = await prisma.product.findMany({ where: { isActive: true } });
  if (products.length === 0) throw new Error('No products found. Run seed-products first.');

  const findProduct = (category: string) => {
    const p = products.find((p) => p.category === category);
    if (!p) throw new Error(`Product ${category} not found`);
    return p;
  };

  const softWheat  = findProduct('SOFT_WHEAT');
  const durumWheat = findProduct('DURUM_WHEAT');
  const corn       = findProduct('CORN_MAIZE');
  const barley     = findProduct('BARLEY');
  const sunflower  = findProduct('SUNFLOWER');
  const rapeseed   = findProduct('RAPESEED');
  const peas       = findProduct('PEAS');
  const oats       = findProduct('OATS');

  // ---- 3. Fetch cities ----
  console.log('Fetching cities...');
  const allCities = await prisma.city.findMany({ include: { region: true } });
  const findCity = (name: string) => {
    const c = allCities.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (!c) throw new Error(`City '${name}' not found`);
    return c;
  };

  const cityPlovdiv     = findCity('Plovdiv');
  const cityStaraZagora = findCity('Stara Zagora');
  const cityVarna       = findCity('Varna');
  const cityRuse        = findCity('Ruse');
  const citySofia       = findCity('Sofia');
  const cityDobrich     = findCity('Dobrich');
  const cityPleven      = findCity('Pleven');

  // ---- 4. Fetch specification types ----
  console.log('Fetching specification types...');
  const specTypes = await prisma.specificationType.findMany();
  const findSpec = (code: string) => {
    const s = specTypes.find((s) => s.code === code);
    if (!s) throw new Error(`SpecType '${code}' not found`);
    return s;
  };

  // We only use specs that are confirmed present; fall back gracefully
  const specMoisture   = specTypes.find((s) => s.code === 'moisture');
  const specProtein    = specTypes.find((s) => s.code === 'protein');
  const specGluten     = specTypes.find((s) => s.code === 'gluten');
  const specTestWeight = specTypes.find((s) => s.code === 'test_weight');
  const specOilContent = specTypes.find((s) => s.code === 'oil_content');
  const specImpurities = specTypes.find((s) => s.code === 'impurities');

  // ==================== COMPANIES & ADDRESSES ====================
  console.log('Creating companies and addresses...');

  // Seller 1 – Zlatna Niva EOOD (Plovdiv area farmer)
  const company1 = await prisma.company.upsert({
    where: { userId: seller1.id },
    update: {},
    create: {
      userId: seller1.id,
      legalName: 'Zlatna Niva EOOD',
      registrationNumber: 'BG201234567',
      vatNumber: 'BG201234567',
      phoneNumber: '+359 32 600 100',
      email: 'office@zlatnaniva.bg',
      website: 'https://zlatnaniva.bg',
    },
  });

  // Seller 2 – Dobrudzha Agro AD (Dobrich area farmer)
  const company2 = await prisma.company.upsert({
    where: { userId: seller2.id },
    update: {},
    create: {
      userId: seller2.id,
      legalName: 'Dobrudzha Agro AD',
      registrationNumber: 'BG207654321',
      vatNumber: 'BG207654321',
      phoneNumber: '+359 58 800 200',
      email: 'contact@dobrudzhaagro.bg',
    },
  });

  // Seller 1 farm address – near Plovdiv
  const addr_s1 = await prisma.address.create({
    data: {
      userId: seller1.id,
      addressType: 'FARM',
      label: 'Main Farm – Plovdiv Plain',
      street: 'ул. Земеделска 47',
      cityId: cityPlovdiv.id,
      postalCode: '4000',
      country: 'Bulgaria',
      latitude: 42.1554,
      longitude: 24.7401,
      isDefault: true,
    },
  });

  // Seller 1 warehouse
  const addr_s1_wh = await prisma.address.create({
    data: {
      userId: seller1.id,
      addressType: 'WAREHOUSE',
      label: 'Grain Storage – Stara Zagora',
      street: 'Индустриална зона Загоре, бл. 12',
      cityId: cityStaraZagora.id,
      postalCode: '6000',
      country: 'Bulgaria',
      latitude: 42.4257,
      longitude: 25.6343,
      isDefault: false,
    },
  });

  // Seller 2 farm address – Dobrudzha
  const addr_s2 = await prisma.address.create({
    data: {
      userId: seller2.id,
      addressType: 'FARM',
      label: 'Dobrudzha Farm – Dobrich',
      street: 'с. Победа, Аграрен квартал 3',
      cityId: cityDobrich.id,
      postalCode: '9300',
      country: 'Bulgaria',
      latitude: 43.5720,
      longitude: 27.8278,
      isDefault: true,
    },
  });

  // Seller 2 warehouse
  const addr_s2_wh = await prisma.address.create({
    data: {
      userId: seller2.id,
      addressType: 'WAREHOUSE',
      label: 'Storage Silo – Varna',
      street: 'Пристанищна зона, Силозен терминал 4',
      cityId: cityVarna.id,
      postalCode: '9000',
      country: 'Bulgaria',
      latitude: 43.2140,
      longitude: 27.9147,
      isDefault: false,
    },
  });

  // Buyer delivery address – Sofia
  const addr_buyer = await prisma.address.create({
    data: {
      userId: buyer.id,
      addressType: 'WAREHOUSE',
      label: 'Processing Plant – Sofia',
      street: 'бул. Цариградско шосе 125',
      cityId: citySofia.id,
      postalCode: '1784',
      country: 'Bulgaria',
      latitude: 42.6955,
      longitude: 23.3971,
      isDefault: true,
    },
  });

  // Second buyer delivery address – Ruse
  const addr_buyer2 = await prisma.address.create({
    data: {
      userId: buyer.id,
      addressType: 'WAREHOUSE',
      label: 'Riverside Mill – Ruse',
      street: 'ул. Пристанищна 8',
      cityId: cityRuse.id,
      postalCode: '7000',
      country: 'Bulgaria',
      latitude: 43.8355,
      longitude: 25.9656,
      isDefault: false,
    },
  });

  // ==================== TRANSPORT COMPANY & USER ====================
  console.log('Creating transport company...');

  const transporterPassword = await bcrypt.hash('Demo1234!', 10);
  const transporter = await prisma.user.upsert({
    where: { email: 'dispatch@speedcargo.bg' },
    update: {},
    create: {
      email: 'dispatch@speedcargo.bg',
      password: transporterPassword,
      name: 'Иван Транспортов',
      role: 'COMPANY_ADMIN',
      phoneNumber: '+359 88 700 5500',
      isActive: true,
      isEmailVerified: true,
      onboardingCompleted: true,
    },
  });

  const transportCompany = await prisma.transportCompany.upsert({
    where: { companyName: 'SpeedCargo Bulgaria EOOD' },
    update: {},
    create: {
      companyName: 'SpeedCargo Bulgaria EOOD',
      registrationNumber: 'BG210999888',
      vatNumber: 'BG210999888',
      mainEmail: 'dispatch@speedcargo.bg',
      mainPhone: '+359 88 700 5500',
      website: 'https://speedcargo.bg',
      companyType: 'EXTERNAL',
      isVerified: true,
      verifiedAt: daysFromNow(-30),
      verifiedBy: admin.id,
      operatingRegions: ['Plovdiv', 'Sofia', 'Varna', 'Stara Zagora', 'Ruse', 'Dobrich'],
      specializations: ['cereals', 'oilseeds', 'bulk', 'agri-commodities'],
      fleetSize: 12,
      totalJobsCompleted: 47,
      averageRating: 4.7,
      onTimeDeliveryRate: 94.5,
    },
  });

  // Link transporter user as company admin
  await prisma.companyAdmin.upsert({
    where: { userId: transporter.id },
    update: {},
    create: {
      userId: transporter.id,
      transportCompanyId: transportCompany.id,
      adminLevel: 'OWNER',
      canManageDrivers: true,
      canManageFleet: true,
      canSubmitBids: true,
      canManageFinances: true,
      canViewReports: true,
    },
  });

  // Trucks for transport company
  const truck1 = await prisma.truck.upsert({
    where: { plateNumber: 'PB 1234 AB' },
    update: {},
    create: {
      ownerId: transporter.id,
      ownerType: 'COMPANY',
      transportCompanyId: transportCompany.id,
      plateNumber: 'PB 1234 AB',
      capacity: 25,
      unit: 'TON',
      type: 'FLATBED',
      currentLocation: 'Plovdiv',
      latitude: 42.1554,
      longitude: 24.7401,
      isAvailable: true,
    },
  });

  const truck2 = await prisma.truck.upsert({
    where: { plateNumber: 'PB 5678 CD' },
    update: {},
    create: {
      ownerId: transporter.id,
      ownerType: 'COMPANY',
      transportCompanyId: transportCompany.id,
      plateNumber: 'PB 5678 CD',
      capacity: 30,
      unit: 'TON',
      type: 'CURTAIN_SIDE',
      currentLocation: 'Varna',
      latitude: 43.2140,
      longitude: 27.9147,
      isAvailable: false,
    },
  });

  // ==================== SALE LISTINGS – SELLER 1 ====================
  console.log('Creating sale listings for seller1...');

  // Helper to build listingSpecs create array
  const buildSaleSpecs = (specs: Array<{ specType: typeof specMoisture; value: number; impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' }>) => {
    return specs
      .filter((s) => s.specType != null)
      .map((s) => ({
        specTypeId: s.specType!.id,
        valueNumber: s.value,
        qualityImpact: s.impact,
      }));
  };

  const saleListing_s1_wheat1 = await prisma.saleListing.create({
    data: {
      sellerId: seller1.id,
      productId: softWheat.id,
      addressId: addr_s1.id,
      quantity: 500,
      unit: 'TON',
      askingPrice: 225.00,
      harvestDate: new Date('2024-07-15'),
      qualityScore: 88,
      qualityGrade: 'Premium',
      status: 'ACTIVE',
      viewCount: 34,
      specifications: {
        create: buildSaleSpecs([
          { specType: specMoisture,   value: 12.5, impact: 'POSITIVE' },
          { specType: specProtein,    value: 13.2, impact: 'POSITIVE' },
          { specType: specGluten,     value: 28.0, impact: 'POSITIVE' },
          { specType: specTestWeight, value: 78.5, impact: 'POSITIVE' },
          { specType: specImpurities, value: 1.2,  impact: 'NEUTRAL'  },
        ]),
      },
    },
  });

  const saleListing_s1_wheat2 = await prisma.saleListing.create({
    data: {
      sellerId: seller1.id,
      productId: durumWheat.id,
      addressId: addr_s1_wh.id,
      quantity: 200,
      unit: 'TON',
      askingPrice: 310.00,
      harvestDate: new Date('2024-07-20'),
      qualityScore: 92,
      qualityGrade: 'Premium',
      status: 'ACTIVE',
      viewCount: 21,
      specifications: {
        create: buildSaleSpecs([
          { specType: specMoisture,   value: 11.8, impact: 'POSITIVE' },
          { specType: specProtein,    value: 14.5, impact: 'POSITIVE' },
          { specType: specTestWeight, value: 80.2, impact: 'POSITIVE' },
          { specType: specImpurities, value: 0.8,  impact: 'POSITIVE' },
        ]),
      },
    },
  });

  const saleListing_s1_corn = await prisma.saleListing.create({
    data: {
      sellerId: seller1.id,
      productId: corn.id,
      addressId: addr_s1.id,
      quantity: 800,
      unit: 'TON',
      askingPrice: 195.00,
      harvestDate: new Date('2024-09-10'),
      qualityScore: 83,
      qualityGrade: 'Standard',
      status: 'ACTIVE',
      viewCount: 57,
      specifications: {
        create: buildSaleSpecs([
          { specType: specMoisture,   value: 14.0, impact: 'NEUTRAL' },
          { specType: specTestWeight, value: 72.0, impact: 'NEUTRAL' },
          { specType: specImpurities, value: 2.0,  impact: 'NEUTRAL' },
        ]),
      },
    },
  });

  const saleListing_s1_sunflower = await prisma.saleListing.create({
    data: {
      sellerId: seller1.id,
      productId: sunflower.id,
      addressId: addr_s1_wh.id,
      quantity: 150,
      unit: 'TON',
      askingPrice: 440.00,
      harvestDate: new Date('2024-09-05'),
      qualityScore: 90,
      qualityGrade: 'Premium',
      status: 'ACTIVE',
      viewCount: 18,
      specifications: {
        create: buildSaleSpecs([
          { specType: specMoisture,   value: 8.5,  impact: 'POSITIVE' },
          { specType: specOilContent, value: 44.2, impact: 'POSITIVE' },
          { specType: specImpurities, value: 1.5,  impact: 'NEUTRAL'  },
        ]),
      },
    },
  });

  const saleListing_s1_barley = await prisma.saleListing.create({
    data: {
      sellerId: seller1.id,
      productId: barley.id,
      addressId: addr_s1.id,
      quantity: 300,
      unit: 'TON',
      askingPrice: 185.00,
      harvestDate: new Date('2024-07-01'),
      qualityScore: 79,
      qualityGrade: 'Standard',
      status: 'ACTIVE',
      viewCount: 12,
      specifications: {
        create: buildSaleSpecs([
          { specType: specMoisture,   value: 13.5, impact: 'NEUTRAL'  },
          { specType: specProtein,    value: 11.8, impact: 'NEUTRAL'  },
          { specType: specTestWeight, value: 65.0, impact: 'NEUTRAL'  },
          { specType: specImpurities, value: 2.5,  impact: 'NEGATIVE' },
        ]),
      },
    },
  });

  // ==================== SALE LISTINGS – SELLER 2 ====================
  console.log('Creating sale listings for seller2...');

  const saleListing_s2_wheat = await prisma.saleListing.create({
    data: {
      sellerId: seller2.id,
      productId: softWheat.id,
      addressId: addr_s2.id,
      quantity: 1000,
      unit: 'TON',
      askingPrice: 220.00,
      harvestDate: new Date('2024-07-18'),
      qualityScore: 84,
      qualityGrade: 'Standard',
      status: 'ACTIVE',
      viewCount: 63,
      specifications: {
        create: buildSaleSpecs([
          { specType: specMoisture,   value: 13.2, impact: 'NEUTRAL'  },
          { specType: specProtein,    value: 12.5, impact: 'NEUTRAL'  },
          { specType: specGluten,     value: 25.0, impact: 'NEUTRAL'  },
          { specType: specTestWeight, value: 76.5, impact: 'NEUTRAL'  },
          { specType: specImpurities, value: 1.8,  impact: 'NEUTRAL'  },
        ]),
      },
    },
  });

  const saleListing_s2_corn = await prisma.saleListing.create({
    data: {
      sellerId: seller2.id,
      productId: corn.id,
      addressId: addr_s2_wh.id,
      quantity: 1200,
      unit: 'TON',
      askingPrice: 190.00,
      harvestDate: new Date('2024-09-20'),
      qualityScore: 80,
      qualityGrade: 'Standard',
      status: 'ACTIVE',
      viewCount: 89,
      specifications: {
        create: buildSaleSpecs([
          { specType: specMoisture,   value: 14.5, impact: 'NEUTRAL'  },
          { specType: specTestWeight, value: 70.5, impact: 'NEUTRAL'  },
          { specType: specImpurities, value: 2.5,  impact: 'NEGATIVE' },
        ]),
      },
    },
  });

  const saleListing_s2_rapeseed = await prisma.saleListing.create({
    data: {
      sellerId: seller2.id,
      productId: rapeseed.id,
      addressId: addr_s2.id,
      quantity: 250,
      unit: 'TON',
      askingPrice: 480.00,
      harvestDate: new Date('2024-06-25'),
      qualityScore: 91,
      qualityGrade: 'Premium',
      status: 'ACTIVE',
      viewCount: 27,
      specifications: {
        create: buildSaleSpecs([
          { specType: specMoisture,   value: 8.0,  impact: 'POSITIVE' },
          { specType: specOilContent, value: 42.8, impact: 'POSITIVE' },
          { specType: specImpurities, value: 1.0,  impact: 'POSITIVE' },
        ]),
      },
    },
  });

  const saleListing_s2_peas = await prisma.saleListing.create({
    data: {
      sellerId: seller2.id,
      productId: peas.id,
      addressId: addr_s2_wh.id,
      quantity: 100,
      unit: 'TON',
      askingPrice: 320.00,
      harvestDate: new Date('2024-06-15'),
      qualityScore: 87,
      qualityGrade: 'Premium',
      status: 'ACTIVE',
      viewCount: 9,
      specifications: {
        create: buildSaleSpecs([
          { specType: specMoisture,   value: 12.0, impact: 'POSITIVE' },
          { specType: specProtein,    value: 22.5, impact: 'POSITIVE' },
          { specType: specImpurities, value: 1.0,  impact: 'POSITIVE' },
        ]),
      },
    },
  });

  const saleListing_s2_oats = await prisma.saleListing.create({
    data: {
      sellerId: seller2.id,
      productId: oats.id,
      addressId: addr_s2.id,
      quantity: 180,
      unit: 'TON',
      askingPrice: 210.00,
      harvestDate: new Date('2024-07-05'),
      qualityScore: 76,
      qualityGrade: 'Standard',
      status: 'ACTIVE',
      viewCount: 6,
      specifications: {
        create: buildSaleSpecs([
          { specType: specMoisture,   value: 13.8, impact: 'NEUTRAL'  },
          { specType: specTestWeight, value: 55.0, impact: 'NEUTRAL'  },
          { specType: specImpurities, value: 2.8,  impact: 'NEGATIVE' },
        ]),
      },
    },
  });

  // ==================== BUY LISTINGS – BUYER ====================
  console.log('Creating buy listings for buyer...');

  const buyListing1 = await prisma.buyListing.create({
    data: {
      buyerId: buyer.id,
      productId: softWheat.id,
      deliveryAddressId: addr_buyer.id,
      quantity: 600,
      unit: 'TON',
      maxPricePerUnit: 235.00,
      neededBy: daysFromNow(30),
      status: 'ACTIVE',
      specifications: {
        create: [
          ...(specMoisture   ? [{ specTypeId: specMoisture.id,   minValue: 0,    maxValue: 14.0, strictness: 'MANDATORY' as const }] : []),
          ...(specProtein    ? [{ specTypeId: specProtein.id,    minValue: 12.5, maxValue: null, strictness: 'MANDATORY' as const }] : []),
          ...(specGluten     ? [{ specTypeId: specGluten.id,     minValue: 24.0, maxValue: null, strictness: 'PREFERRED' as const }] : []),
          ...(specTestWeight ? [{ specTypeId: specTestWeight.id, minValue: 75.0, maxValue: null, strictness: 'PREFERRED' as const }] : []),
          ...(specImpurities ? [{ specTypeId: specImpurities.id, minValue: null, maxValue: 2.0,  strictness: 'MANDATORY' as const }] : []),
        ],
      },
    },
  });

  const buyListing2 = await prisma.buyListing.create({
    data: {
      buyerId: buyer.id,
      productId: corn.id,
      deliveryAddressId: addr_buyer2.id,
      quantity: 1000,
      unit: 'TON',
      maxPricePerUnit: 205.00,
      neededBy: daysFromNow(45),
      status: 'ACTIVE',
      specifications: {
        create: [
          ...(specMoisture   ? [{ specTypeId: specMoisture.id,   minValue: 0,    maxValue: 15.0, strictness: 'MANDATORY' as const }] : []),
          ...(specTestWeight ? [{ specTypeId: specTestWeight.id, minValue: 68.0, maxValue: null, strictness: 'PREFERRED' as const }] : []),
          ...(specImpurities ? [{ specTypeId: specImpurities.id, minValue: null, maxValue: 3.0,  strictness: 'MANDATORY' as const }] : []),
        ],
      },
    },
  });

  const buyListing3 = await prisma.buyListing.create({
    data: {
      buyerId: buyer.id,
      productId: sunflower.id,
      deliveryAddressId: addr_buyer.id,
      quantity: 300,
      unit: 'TON',
      maxPricePerUnit: 460.00,
      neededBy: daysFromNow(20),
      status: 'ACTIVE',
      specifications: {
        create: [
          ...(specMoisture   ? [{ specTypeId: specMoisture.id,   minValue: 0,    maxValue: 10.0, strictness: 'MANDATORY' as const }] : []),
          ...(specOilContent ? [{ specTypeId: specOilContent.id, minValue: 42.0, maxValue: null, strictness: 'MANDATORY' as const }] : []),
          ...(specImpurities ? [{ specTypeId: specImpurities.id, minValue: null, maxValue: 2.0,  strictness: 'PREFERRED' as const }] : []),
        ],
      },
    },
  });

  const buyListing4 = await prisma.buyListing.create({
    data: {
      buyerId: buyer.id,
      productId: rapeseed.id,
      deliveryAddressId: addr_buyer.id,
      quantity: 200,
      unit: 'TON',
      maxPricePerUnit: 500.00,
      neededBy: daysFromNow(25),
      status: 'ACTIVE',
      specifications: {
        create: [
          ...(specMoisture   ? [{ specTypeId: specMoisture.id,   minValue: 0,    maxValue: 9.0,  strictness: 'MANDATORY' as const }] : []),
          ...(specOilContent ? [{ specTypeId: specOilContent.id, minValue: 41.0, maxValue: null, strictness: 'MANDATORY' as const }] : []),
          ...(specImpurities ? [{ specTypeId: specImpurities.id, minValue: null, maxValue: 1.5,  strictness: 'MANDATORY' as const }] : []),
        ],
      },
    },
  });

  // ==================== TRADE OPERATION 1: INITIATION ====================
  console.log('Creating trade operation 1 (INITIATION)...');

  const tradeOp1 = await prisma.tradeOperation.create({
    data: {
      operationNumber: nextOpNumber(),
      adminId: admin.id,
      buyListingId: buyListing4.id,
      phase: 'INITIATION',
      status: 'ACTIVE',
      currency: 'EUR',
      sellingPrice: 498.00,
      totalRevenue: 99600.00,
      estimatedTransportCost: 4200.00,
      estimatedProfit: 3800.00,
      profitMargin: 3.8,
      metadata: { notes: 'Fresh operation – just initiated for rapeseed purchase.' },
    },
  });

  await prisma.tradeStateHistory.create({
    data: {
      tradeOperationId: tradeOp1.id,
      fromPhase: null,
      toPhase: 'INITIATION',
      toStatus: 'ACTIVE',
      changedBy: admin.id,
      reason: 'Operation created from buyer request BL-rapeseed',
    },
  });

  await prisma.tradeNote.create({
    data: {
      tradeOperationId: tradeOp1.id,
      authorId: admin.id,
      content: 'Buyer requires delivery within 25 days. Targeting seller2 rapeseed listing (250t available). Need to verify moisture and oil content on-site.',
      isInternal: true,
    },
  });

  // ==================== TRADE OPERATION 2: SELLER_MATCHING ====================
  console.log('Creating trade operation 2 (SELLER_MATCHING)...');

  const tradeOp2 = await prisma.tradeOperation.create({
    data: {
      operationNumber: nextOpNumber(),
      adminId: admin.id,
      buyListingId: buyListing3.id,
      phase: 'SELLER_MATCHING',
      status: 'ACTIVE',
      currency: 'EUR',
      sellingPrice: 455.00,
      totalRevenue: 136500.00,
      estimatedTransportCost: 6800.00,
      estimatedProfit: 6200.00,
      profitMargin: 4.5,
    },
  });

  // Add seller1 (sunflower listing) as candidate
  const tradeSeller2_s1 = await prisma.tradeSeller.create({
    data: {
      tradeOperationId: tradeOp2.id,
      sellerId: seller1.id,
      saleListingId: saleListing_s1_sunflower.id,
      requestedQuantity: 150,
      offeredQuantity: 150,
      unit: 'TON',
      matchScore: 94,
      status: 'INVITED',
    },
  });

  await prisma.tradeStateHistory.createMany({
    data: [
      {
        tradeOperationId: tradeOp2.id,
        fromPhase: null,
        toPhase: 'INITIATION',
        toStatus: 'ACTIVE',
        changedBy: admin.id,
        reason: 'Operation created',
      },
      {
        tradeOperationId: tradeOp2.id,
        fromPhase: 'INITIATION',
        toPhase: 'SELLER_MATCHING',
        toStatus: 'ACTIVE',
        changedBy: admin.id,
        reason: 'Matching algorithm found 1 strong candidate',
      },
    ],
  });

  await prisma.tradeNote.create({
    data: {
      tradeOperationId: tradeOp2.id,
      authorId: admin.id,
      content: 'Seller1 sunflower listing matches all mandatory specs. Match score 94/100. Will send negotiation offer.',
      isInternal: true,
    },
  });

  // ==================== TRADE OPERATION 3: SELLER_NEGOTIATION (countered) ====================
  console.log('Creating trade operation 3 (SELLER_NEGOTIATION – countered)...');

  const tradeOp3 = await prisma.tradeOperation.create({
    data: {
      operationNumber: nextOpNumber(),
      adminId: admin.id,
      buyListingId: buyListing2.id,
      phase: 'SELLER_NEGOTIATION',
      status: 'ACTIVE',
      currency: 'EUR',
      sellingPrice: 200.00,
      totalRevenue: 200000.00,
      estimatedTransportCost: 12000.00,
      estimatedProfit: 8000.00,
      profitMargin: 4.0,
    },
  });

  // seller2 corn (main supplier)
  const tradeSeller3_s2 = await prisma.tradeSeller.create({
    data: {
      tradeOperationId: tradeOp3.id,
      sellerId: seller2.id,
      saleListingId: saleListing_s2_corn.id,
      requestedQuantity: 800,
      offeredQuantity: 1200,
      unit: 'TON',
      matchScore: 87,
      status: 'NEGOTIATING',
    },
  });

  // seller1 corn (partial top-up)
  const tradeSeller3_s1 = await prisma.tradeSeller.create({
    data: {
      tradeOperationId: tradeOp3.id,
      sellerId: seller1.id,
      saleListingId: saleListing_s1_corn.id,
      requestedQuantity: 200,
      offeredQuantity: 800,
      unit: 'TON',
      matchScore: 82,
      status: 'INVITED',
    },
  });

  // Negotiation for seller2
  const negotiation3_s2 = await prisma.offerNegotiation.create({
    data: {
      tradeOperationId: tradeOp3.id,
      tradeSellerId: tradeSeller3_s2.id,
      status: 'COUNTERED',
      currentOffer: { price: 188.00, quantity: 800, terms: 'EXW Dobrich, payment within 30 days' },
      counterOffer:  { price: 193.00, quantity: 800, terms: 'EXW Dobrich, payment within 15 days', receivedAt: daysFromNow(-1).toISOString() },
      offerHistory: [
        { price: 185.00, quantity: 800, offeredBy: 'BUYER', offeredAt: daysFromNow(-3).toISOString() },
        { price: 188.00, quantity: 800, offeredBy: 'BUYER', offeredAt: daysFromNow(-2).toISOString() },
      ],
      unit: 'TON',
      expiresAt: daysFromNow(1),
      respondedAt: daysFromNow(-1),
    },
  });

  // Offer rounds for negotiation3_s2
  await prisma.offerRound.createMany({
    data: [
      {
        negotiationId: negotiation3_s2.id,
        roundNumber: 1,
        offeredBy: 'BUYER',
        price: 185.00,
        quantity: 800,
        terms: 'EXW Dobrich. Payment net 30.',
        response: 'COUNTERED',
        responseNote: 'Too low, our production cost is higher this season.',
        createdAt: daysFromNow(-3),
        respondedAt: daysFromNow(-2),
      },
      {
        negotiationId: negotiation3_s2.id,
        roundNumber: 2,
        offeredBy: 'BUYER',
        price: 188.00,
        quantity: 800,
        terms: 'EXW Dobrich. Payment net 30.',
        response: 'COUNTERED',
        responseNote: 'Closer, but we need 193 due to fuel and storage costs.',
        createdAt: daysFromNow(-2),
        respondedAt: daysFromNow(-1),
      },
      {
        negotiationId: negotiation3_s2.id,
        roundNumber: 3,
        offeredBy: 'SELLER',
        price: 193.00,
        quantity: 800,
        terms: 'EXW Dobrich. Payment net 15.',
        response: null,
        responseNote: null,
        createdAt: daysFromNow(-1),
        respondedAt: null,
      },
    ],
  });

  await prisma.tradeStateHistory.createMany({
    data: [
      { tradeOperationId: tradeOp3.id, fromPhase: null,               toPhase: 'INITIATION',         toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Created' },
      { tradeOperationId: tradeOp3.id, fromPhase: 'INITIATION',       toPhase: 'SELLER_MATCHING',    toStatus: 'ACTIVE', changedBy: admin.id, reason: '2 sellers matched' },
      { tradeOperationId: tradeOp3.id, fromPhase: 'SELLER_MATCHING',  toPhase: 'SELLER_NEGOTIATION', toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Negotiation started with seller2' },
    ],
  });

  // ==================== TRADE OPERATION 4: INSPECTION_PENDING ====================
  console.log('Creating trade operation 4 (INSPECTION_PENDING)...');

  const tradeOp4 = await prisma.tradeOperation.create({
    data: {
      operationNumber: nextOpNumber(),
      adminId: admin.id,
      buyListingId: buyListing1.id,
      phase: 'INSPECTION_PENDING',
      status: 'ACTIVE',
      currency: 'EUR',
      totalPurchaseCost: 112500.00,
      avgPurchasePrice: 225.00,
      sellingPrice: 232.00,
      totalRevenue: 139200.00,
      estimatedTransportCost: 8500.00,
      estimatedProfit: 9200.00,
      profitMargin: 6.6,
    },
  });

  // seller1 soft wheat – accepted
  const tradeSeller4_s1 = await prisma.tradeSeller.create({
    data: {
      tradeOperationId: tradeOp4.id,
      sellerId: seller1.id,
      saleListingId: saleListing_s1_wheat1.id,
      requestedQuantity: 350,
      offeredQuantity: 500,
      agreedQuantity: 350,
      agreedPrice: 222.00,
      unit: 'TON',
      matchScore: 92,
      isVerified: false,
      status: 'ACCEPTED',
      confirmedAt: daysFromNow(-2),
    },
  });

  // seller2 soft wheat – accepted
  const tradeSeller4_s2 = await prisma.tradeSeller.create({
    data: {
      tradeOperationId: tradeOp4.id,
      sellerId: seller2.id,
      saleListingId: saleListing_s2_wheat.id,
      requestedQuantity: 250,
      offeredQuantity: 1000,
      agreedQuantity: 250,
      agreedPrice: 218.00,
      unit: 'TON',
      matchScore: 84,
      isVerified: false,
      status: 'ACCEPTED',
      confirmedAt: daysFromNow(-1),
    },
  });

  // Negotiations – both accepted
  const negotiation4_s1 = await prisma.offerNegotiation.create({
    data: {
      tradeOperationId: tradeOp4.id,
      tradeSellerId: tradeSeller4_s1.id,
      status: 'ACCEPTED',
      currentOffer: { price: 222.00, quantity: 350, terms: 'EXW Plovdiv, payment net 30' },
      counterOffer: undefined,
      offerHistory: [
        { price: 215.00, quantity: 350, offeredBy: 'BUYER', offeredAt: daysFromNow(-5).toISOString() },
        { price: 222.00, quantity: 350, offeredBy: 'BUYER', offeredAt: daysFromNow(-4).toISOString() },
      ],
      finalPrice: 222.00,
      finalQuantity: 350,
      unit: 'TON',
      expiresAt: daysFromNow(2),
      respondedAt: daysFromNow(-3),
      concludedAt: daysFromNow(-2),
    },
  });

  await prisma.offerRound.createMany({
    data: [
      {
        negotiationId: negotiation4_s1.id,
        roundNumber: 1,
        offeredBy: 'BUYER',
        price: 215.00,
        quantity: 350,
        terms: 'EXW Plovdiv. Payment net 30.',
        response: 'COUNTERED',
        responseNote: 'Offer too low given current market rates.',
        createdAt: daysFromNow(-5),
        respondedAt: daysFromNow(-4),
      },
      {
        negotiationId: negotiation4_s1.id,
        roundNumber: 2,
        offeredBy: 'BUYER',
        price: 222.00,
        quantity: 350,
        terms: 'EXW Plovdiv. Payment net 30.',
        response: 'ACCEPTED',
        responseNote: 'Agreed. Can pickup from next Monday.',
        createdAt: daysFromNow(-4),
        respondedAt: daysFromNow(-3),
      },
    ],
  });

  const negotiation4_s2 = await prisma.offerNegotiation.create({
    data: {
      tradeOperationId: tradeOp4.id,
      tradeSellerId: tradeSeller4_s2.id,
      status: 'ACCEPTED',
      currentOffer: { price: 218.00, quantity: 250, terms: 'EXW Dobrich, payment net 30' },
      counterOffer: undefined,
      offerHistory: [
        { price: 218.00, quantity: 250, offeredBy: 'BUYER', offeredAt: daysFromNow(-3).toISOString() },
      ],
      finalPrice: 218.00,
      finalQuantity: 250,
      unit: 'TON',
      expiresAt: daysFromNow(3),
      respondedAt: daysFromNow(-2),
      concludedAt: daysFromNow(-1),
    },
  });

  await prisma.offerRound.create({
    data: {
      negotiationId: negotiation4_s2.id,
      roundNumber: 1,
      offeredBy: 'BUYER',
      price: 218.00,
      quantity: 250,
      terms: 'EXW Dobrich. Payment net 30.',
      response: 'ACCEPTED',
      responseNote: 'Fair price. Accepted.',
      createdAt: daysFromNow(-3),
      respondedAt: daysFromNow(-2),
    },
  });

  // Inspection requests
  const inspection4_s1 = await prisma.inspectionRequest.create({
    data: {
      tradeOperationId: tradeOp4.id,
      saleListingId: saleListing_s1_wheat1.id,
      priority: 'HIGH',
      requestedDate: daysFromNow(1),
      scheduledDate: daysFromNow(2),
      latitude: 42.1554,
      longitude: 24.7401,
      address: 'ул. Земеделска 47, Пловдив',
      status: 'SCHEDULED',
      notes: 'Inspect 350t soft wheat. Verify moisture < 14%, protein > 12.5%. Check for signs of fungal damage.',
      photos: [],
    },
  });

  const inspection4_s2 = await prisma.inspectionRequest.create({
    data: {
      tradeOperationId: tradeOp4.id,
      saleListingId: saleListing_s2_wheat.id,
      priority: 'MEDIUM',
      requestedDate: daysFromNow(2),
      scheduledDate: daysFromNow(4),
      latitude: 43.5720,
      longitude: 27.8278,
      address: 'с. Победа, Аграрен квартал 3, Добрич',
      status: 'PENDING',
      notes: 'Inspect 250t soft wheat from Dobrudzha lot. Focus on impurities and gluten index.',
      photos: [],
    },
  });

  await prisma.tradeStateHistory.createMany({
    data: [
      { tradeOperationId: tradeOp4.id, fromPhase: null,                toPhase: 'INITIATION',         toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Created' },
      { tradeOperationId: tradeOp4.id, fromPhase: 'INITIATION',        toPhase: 'SELLER_MATCHING',    toStatus: 'ACTIVE', changedBy: admin.id, reason: '2 sellers matched' },
      { tradeOperationId: tradeOp4.id, fromPhase: 'SELLER_MATCHING',   toPhase: 'SELLER_NEGOTIATION', toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Negotiations started' },
      { tradeOperationId: tradeOp4.id, fromPhase: 'SELLER_NEGOTIATION',toPhase: 'INSPECTION_PENDING', toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Both sellers accepted. Inspections scheduled.' },
    ],
  });

  // ==================== TRADE OPERATION 5: TRANSPORT_BIDDING ====================
  console.log('Creating trade operation 5 (TRANSPORT_BIDDING)...');

  // Create a separate fulfilled buy listing for this operation
  const buyListing5 = await prisma.buyListing.create({
    data: {
      buyerId: buyer.id,
      productId: durumWheat.id,
      deliveryAddressId: addr_buyer.id,
      quantity: 180,
      unit: 'TON',
      maxPricePerUnit: 320.00,
      neededBy: daysFromNow(15),
      status: 'ACTIVE',
      specifications: {
        create: [
          ...(specMoisture   ? [{ specTypeId: specMoisture.id,   minValue: 0,    maxValue: 13.0, strictness: 'MANDATORY' as const }] : []),
          ...(specProtein    ? [{ specTypeId: specProtein.id,    minValue: 13.5, maxValue: null, strictness: 'MANDATORY' as const }] : []),
          ...(specTestWeight ? [{ specTypeId: specTestWeight.id, minValue: 78.0, maxValue: null, strictness: 'PREFERRED' as const }] : []),
        ],
      },
    },
  });

  const tradeOp5 = await prisma.tradeOperation.create({
    data: {
      operationNumber: nextOpNumber(),
      adminId: admin.id,
      buyListingId: buyListing5.id,
      phase: 'TRANSPORT_BIDDING',
      status: 'ACTIVE',
      currency: 'EUR',
      totalPurchaseCost: 54000.00,
      avgPurchasePrice: 300.00,
      sellingPrice: 315.00,
      totalRevenue: 56700.00,
      estimatedTransportCost: 3200.00,
      estimatedProfit: 2500.00,
      profitMargin: 4.4,
      totalDistanceKm: 310.0,
    },
  });

  // seller1 durum wheat – confirmed, verified
  const tradeSeller5_s1 = await prisma.tradeSeller.create({
    data: {
      tradeOperationId: tradeOp5.id,
      sellerId: seller1.id,
      saleListingId: saleListing_s1_wheat2.id,
      requestedQuantity: 180,
      offeredQuantity: 200,
      agreedQuantity: 180,
      agreedPrice: 300.00,
      unit: 'TON',
      matchScore: 96,
      isVerified: true,
      status: 'CONFIRMED',
      confirmedAt: daysFromNow(-5),
    },
  });

  // Negotiation – accepted
  const negotiation5_s1 = await prisma.offerNegotiation.create({
    data: {
      tradeOperationId: tradeOp5.id,
      tradeSellerId: tradeSeller5_s1.id,
      status: 'ACCEPTED',
      currentOffer: { price: 300.00, quantity: 180, terms: 'EXW Stara Zagora, payment net 15' },
      counterOffer: undefined,
      offerHistory: [
        { price: 295.00, quantity: 180, offeredBy: 'BUYER', offeredAt: daysFromNow(-8).toISOString() },
        { price: 300.00, quantity: 180, offeredBy: 'BUYER', offeredAt: daysFromNow(-7).toISOString() },
      ],
      finalPrice: 300.00,
      finalQuantity: 180,
      unit: 'TON',
      expiresAt: daysFromNow(1),
      respondedAt: daysFromNow(-6),
      concludedAt: daysFromNow(-5),
    },
  });

  await prisma.offerRound.createMany({
    data: [
      {
        negotiationId: negotiation5_s1.id,
        roundNumber: 1,
        offeredBy: 'BUYER',
        price: 295.00,
        quantity: 180,
        terms: 'EXW Stara Zagora. Payment net 15.',
        response: 'COUNTERED',
        responseNote: 'Need 300 minimum for durum wheat this quality.',
        createdAt: daysFromNow(-8),
        respondedAt: daysFromNow(-7),
      },
      {
        negotiationId: negotiation5_s1.id,
        roundNumber: 2,
        offeredBy: 'BUYER',
        price: 300.00,
        quantity: 180,
        terms: 'EXW Stara Zagora. Payment net 15.',
        response: 'ACCEPTED',
        responseNote: 'Agreed. Ready for pickup from Monday.',
        createdAt: daysFromNow(-7),
        respondedAt: daysFromNow(-6),
      },
    ],
  });

  // Completed inspection
  const inspection5 = await prisma.inspectionRequest.create({
    data: {
      tradeOperationId: tradeOp5.id,
      saleListingId: saleListing_s1_wheat2.id,
      priority: 'HIGH',
      requestedDate: daysFromNow(-6),
      scheduledDate: daysFromNow(-5),
      completedDate: daysFromNow(-4),
      latitude: 42.4257,
      longitude: 25.6343,
      address: 'Индустриална зона Загоре, бл. 12, Стара Загора',
      status: 'COMPLETED',
      qualityScore: 92,
      verificationResult: {
        moisture: 11.8,
        protein: 14.5,
        testWeight: 80.2,
        impurities: 0.8,
        verdict: 'PASS',
        notes: 'Excellent quality durum wheat. All parameters within specification.',
      },
      notes: 'Inspection completed. All mandatory specs passed. Grade: Premium. Recommend proceed.',
      photos: [
        'https://res.cloudinary.com/demo/image/upload/v1/agrotrade/inspections/wheat_sample_001.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/agrotrade/inspections/wheat_sample_002.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/agrotrade/inspections/wheat_storage_001.jpg',
      ],
    },
  });

  // Transport request
  const transportReq5 = await prisma.transportRequest.create({
    data: {
      requestNumber: nextReqNumber(),
      tradeOperationId: tradeOp5.id,
      totalWeight: 180,
      requiredVehicleType: 'CURTAIN_SIDE',
      specialRequirements: ['Cleaned vehicle', 'GPS tracking required', 'CMR document'],
      pickupPoints: [
        {
          lat: 42.4257,
          lng: 25.6343,
          sellerId: seller1.id,
          quantity: 180,
          address: 'Индустриална зона Загоре, бл. 12, Стара Загора',
        },
      ],
      deliveryPoint: {
        lat: 42.6955,
        lng: 23.3971,
        addressId: addr_buyer.id,
        address: 'бул. Цариградско шосе 125, София 1784',
      },
      estimatedDistance: 310.0,
      pickupWindowStart: daysFromNow(1),
      pickupWindowEnd: daysFromNow(3),
      deliveryDeadline: daysFromNow(5),
      urgencyLevel: 'URGENT',
      status: 'BIDDING',
      biddingDeadline: daysFromNow(1),
      maxBudget: 3500.00,
    },
  });

  // Transport bids
  const transportBid5_1 = await prisma.transportBid.create({
    data: {
      transportRequestId: transportReq5.id,
      tradeOperationId: tradeOp5.id,
      transporterId: transporter.id,
      transportCompanyId: transportCompany.id,
      bidAmount: 3200.00,
      estimatedDuration: 4,
      vehicleType: 'CURTAIN_SIDE',
      vehicleCapacity: 30,
      assignedTruckId: truck1.id,
      specialEquipment: ['GPS tracker', 'tarpaulin covers'],
      insuranceCoverage: 100000.00,
      proposedRoute: {
        waypoints: [
          { name: 'Stara Zagora', lat: 42.4257, lng: 25.6343 },
          { name: 'Plovdiv Interchange', lat: 42.1554, lng: 24.7401 },
          { name: 'Trakia Motorway A1', lat: 42.4000, lng: 24.2000 },
          { name: 'Sofia – Tsarigradsko Shosse', lat: 42.6955, lng: 23.3971 },
        ],
      },
      pickupSchedule: { pickupDate: daysFromNow(2).toISOString(), estimatedLoadingTime: '2h' },
      status: 'PENDING',
      expiresAt: daysFromNow(2),
    },
  });

  // Second competing bid from an individual transporter
  const transporter2 = await prisma.user.upsert({
    where: { email: 'georgi.petrov@transbg.com' },
    update: {},
    create: {
      email: 'georgi.petrov@transbg.com',
      password: await bcrypt.hash('Demo1234!', 10),
      name: 'Георги Петров',
      role: 'TRANSPORTER',
      phoneNumber: '+359 87 333 4455',
      isActive: true,
      isEmailVerified: true,
      onboardingCompleted: true,
    },
  });

  const truck3 = await prisma.truck.upsert({
    where: { plateNumber: 'СФ 9012 ЕФ' },
    update: {},
    create: {
      ownerId: transporter2.id,
      ownerType: 'INDIVIDUAL',
      plateNumber: 'СФ 9012 ЕФ',
      capacity: 25,
      unit: 'TON',
      type: 'CURTAIN_SIDE',
      currentLocation: 'Sofia',
      latitude: 42.6977,
      longitude: 23.3219,
      isAvailable: true,
    },
  });

  const transportBid5_2 = await prisma.transportBid.create({
    data: {
      transportRequestId: transportReq5.id,
      tradeOperationId: tradeOp5.id,
      transporterId: transporter2.id,
      bidAmount: 3450.00,
      estimatedDuration: 5,
      vehicleType: 'CURTAIN_SIDE',
      vehicleCapacity: 25,
      assignedTruckId: truck3.id,
      specialEquipment: ['tarpaulin covers'],
      insuranceCoverage: 80000.00,
      status: 'PENDING',
      expiresAt: daysFromNow(2),
    },
  });

  // Third competing transporter (also role TRANSPORTER) for Scenario 6 bidding competition
  const transporter3 = await prisma.user.upsert({
    where: { email: 'ivan.kolev@transbg.com' },
    update: {},
    create: {
      email: 'ivan.kolev@transbg.com',
      password: await bcrypt.hash('Demo1234!', 10),
      name: 'Иван Колев',
      role: 'TRANSPORTER',
      phoneNumber: '+359 87 444 5566',
      isActive: true,
      isEmailVerified: true,
      onboardingCompleted: true,
    },
  });

  const truck4 = await prisma.truck.upsert({
    where: { plateNumber: 'В 3456 КМ' },
    update: {},
    create: {
      ownerId: transporter3.id,
      ownerType: 'INDIVIDUAL',
      plateNumber: 'В 3456 КМ',
      capacity: 28,
      unit: 'TON',
      type: 'FLATBED',
      currentLocation: 'Stara Zagora',
      latitude: 42.4257,
      longitude: 25.6343,
      isAvailable: true,
    },
  });

  const transportBid5_3 = await prisma.transportBid.create({
    data: {
      transportRequestId: transportReq5.id,
      tradeOperationId: tradeOp5.id,
      transporterId: transporter3.id,
      bidAmount: 3100.00,
      estimatedDuration: 4,
      vehicleType: 'FLATBED',
      vehicleCapacity: 28,
      assignedTruckId: truck4.id,
      specialEquipment: ['GPS tracker', 'tarpaulin covers'],
      insuranceCoverage: 90000.00,
      status: 'PENDING',
      expiresAt: daysFromNow(2),
    },
  });

  await prisma.tradeStateHistory.createMany({
    data: [
      { tradeOperationId: tradeOp5.id, fromPhase: null,                 toPhase: 'INITIATION',          toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Created' },
      { tradeOperationId: tradeOp5.id, fromPhase: 'INITIATION',         toPhase: 'SELLER_MATCHING',     toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Seller1 matched' },
      { tradeOperationId: tradeOp5.id, fromPhase: 'SELLER_MATCHING',    toPhase: 'SELLER_NEGOTIATION',  toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Negotiation started' },
      { tradeOperationId: tradeOp5.id, fromPhase: 'SELLER_NEGOTIATION', toPhase: 'INSPECTION_PENDING',  toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Seller confirmed. Inspection requested.' },
      { tradeOperationId: tradeOp5.id, fromPhase: 'INSPECTION_PENDING', toPhase: 'TRANSPORT_BIDDING',   toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Inspection passed (score 92). Transport bids open.' },
    ],
  });

  await prisma.tradeNote.create({
    data: {
      tradeOperationId: tradeOp5.id,
      authorId: admin.id,
      content: '2 transport bids received. SpeedCargo: €3,200 / 4h. Georgi Petrov: €3,450 / 5h. Recommending SpeedCargo – lower cost, larger truck, GPS included.',
      isInternal: true,
    },
  });

  // ==================== TRADE OPERATION 6: IN_TRANSIT ====================
  console.log('Creating trade operation 6 (IN_TRANSIT)...');

  const buyListing6 = await prisma.buyListing.create({
    data: {
      buyerId: buyer.id,
      productId: barley.id,
      deliveryAddressId: addr_buyer2.id,
      quantity: 250,
      unit: 'TON',
      maxPricePerUnit: 200.00,
      neededBy: daysFromNow(5),
      status: 'ACTIVE',
    },
  });

  const tradeOp6 = await prisma.tradeOperation.create({
    data: {
      operationNumber: nextOpNumber(),
      adminId: admin.id,
      buyListingId: buyListing6.id,
      phase: 'IN_TRANSIT',
      status: 'ACTIVE',
      currency: 'EUR',
      totalPurchaseCost: 46250.00,
      avgPurchasePrice: 185.00,
      sellingPrice: 196.00,
      totalRevenue: 49000.00,
      estimatedTransportCost: 2800.00,
      actualTransportCost: 2750.00,
      estimatedProfit: 2950.00,
      profitMargin: 6.0,
      totalDistanceKm: 220.0,
    },
  });

  const tradeSeller6_s1 = await prisma.tradeSeller.create({
    data: {
      tradeOperationId: tradeOp6.id,
      sellerId: seller1.id,
      saleListingId: saleListing_s1_barley.id,
      requestedQuantity: 250,
      offeredQuantity: 300,
      agreedQuantity: 250,
      agreedPrice: 185.00,
      unit: 'TON',
      matchScore: 79,
      isVerified: true,
      status: 'CONFIRMED',
      confirmedAt: daysFromNow(-8),
    },
  });

  const negotiation6 = await prisma.offerNegotiation.create({
    data: {
      tradeOperationId: tradeOp6.id,
      tradeSellerId: tradeSeller6_s1.id,
      status: 'ACCEPTED',
      currentOffer: { price: 185.00, quantity: 250, terms: 'EXW Plovdiv, payment net 30' },
      counterOffer: undefined,
      offerHistory: [{ price: 185.00, quantity: 250, offeredBy: 'BUYER', offeredAt: daysFromNow(-10).toISOString() }],
      finalPrice: 185.00,
      finalQuantity: 250,
      unit: 'TON',
      expiresAt: daysFromNow(-5),
      respondedAt: daysFromNow(-9),
      concludedAt: daysFromNow(-9),
    },
  });

  const transportReq6 = await prisma.transportRequest.create({
    data: {
      requestNumber: nextReqNumber(),
      tradeOperationId: tradeOp6.id,
      totalWeight: 250,
      requiredVehicleType: 'FLATBED',
      specialRequirements: ['CMR required', 'Phytosanitary certificate'],
      pickupPoints: [
        {
          lat: 42.1554,
          lng: 24.7401,
          sellerId: seller1.id,
          quantity: 250,
          address: 'ул. Земеделска 47, Пловдив',
        },
      ],
      deliveryPoint: {
        lat: 43.8355,
        lng: 25.9656,
        addressId: addr_buyer2.id,
        address: 'ул. Пристанищна 8, Русе 7000',
      },
      estimatedDistance: 220.0,
      pickupWindowStart: daysFromNow(-3),
      pickupWindowEnd: daysFromNow(-2),
      deliveryDeadline: daysFromNow(5),
      urgencyLevel: 'STANDARD',
      status: 'IN_PROGRESS',
      biddingDeadline: daysFromNow(-5),
      maxBudget: 3000.00,
      selectedBidId: null, // will be set after bid creation via update
    },
  });

  const transportBid6 = await prisma.transportBid.create({
    data: {
      transportRequestId: transportReq6.id,
      tradeOperationId: tradeOp6.id,
      transporterId: transporter.id,
      transportCompanyId: transportCompany.id,
      bidAmount: 2750.00,
      estimatedDuration: 5,
      vehicleType: 'FLATBED',
      vehicleCapacity: 25,
      assignedTruckId: truck1.id,
      specialEquipment: ['tarpaulin covers', 'GPS'],
      insuranceCoverage: 100000.00,
      status: 'ACCEPTED',
      expiresAt: daysFromNow(-4),
      evaluatedAt: daysFromNow(-5),
      acceptedAt: daysFromNow(-5),
    },
  });

  // Update transport request with selected bid
  await prisma.transportRequest.update({
    where: { id: transportReq6.id },
    data: { selectedBidId: transportBid6.id },
  });

  // Transport job (in transit)
  const transportJob6 = await prisma.transportJob.create({
    data: {
      jobNumber: nextJobNumber(),
      transportRequestId: transportReq6.id,
      transportBidId: transportBid6.id,
      tradeOperationId: tradeOp6.id,
      transporterId: transporter.id,
      status: 'IN_TRANSIT',
      pickupsCompleted: [
        {
          sellerId: seller1.id,
          address: 'ул. Земеделска 47, Пловдив',
          completedAt: daysFromNow(-1).toISOString(),
          quantity: 250,
          photos: ['https://res.cloudinary.com/demo/image/upload/v1/agrotrade/transport/barley_load_01.jpg'],
        },
      ],
      allPickupsComplete: true,
      currentLocation: {
        lat: 43.0757,
        lng: 25.6172,
        timestamp: new Date().toISOString(),
        address: 'Около Велико Търново, А2',
      },
      estimatedArrival: daysFromNow(1),
      pickupPhotos: [
        'https://res.cloudinary.com/demo/image/upload/v1/agrotrade/transport/barley_load_01.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/agrotrade/transport/barley_seal_01.jpg',
      ],
      deliveryPhotos: [],
      onTimePickup: true,
      startedAt: daysFromNow(-1),
      notes: 'Pickup completed at Plovdiv farm. Load sealed. En route to Ruse via A2.',
    },
  });

  // Add transporter to trade
  await prisma.tradeTransporter.create({
    data: {
      tradeOperationId: tradeOp6.id,
      transporterId: transporter.id,
      vehicleId: truck1.id,
      route: {
        from: 'Plovdiv',
        to: 'Ruse',
        waypoints: ['Plovdiv', 'Veliko Tarnovo', 'Ruse'],
        totalKm: 220,
      },
      estimatedDistance: 220,
      estimatedDuration: 300,
      agreedPrice: 2750.00,
      status: 'IN_TRANSIT',
      confirmedAt: daysFromNow(-5),
    },
  });

  await prisma.tradeStateHistory.createMany({
    data: [
      { tradeOperationId: tradeOp6.id, fromPhase: null,                 toPhase: 'INITIATION',          toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Created' },
      { tradeOperationId: tradeOp6.id, fromPhase: 'INITIATION',         toPhase: 'SELLER_MATCHING',     toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Seller1 matched' },
      { tradeOperationId: tradeOp6.id, fromPhase: 'SELLER_MATCHING',    toPhase: 'SELLER_NEGOTIATION',  toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Negotiation opened' },
      { tradeOperationId: tradeOp6.id, fromPhase: 'SELLER_NEGOTIATION', toPhase: 'INSPECTION_PENDING',  toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Seller accepted first offer' },
      { tradeOperationId: tradeOp6.id, fromPhase: 'INSPECTION_PENDING', toPhase: 'TRANSPORT_BIDDING',   toStatus: 'ACTIVE', changedBy: admin.id, reason: 'Inspection passed' },
      { tradeOperationId: tradeOp6.id, fromPhase: 'TRANSPORT_BIDDING',  toPhase: 'IN_TRANSIT',          toStatus: 'ACTIVE', changedBy: admin.id, reason: 'SpeedCargo accepted, goods picked up' },
    ],
  });

  // ==================== TRADE OPERATION 7: DELIVERED ====================
  console.log('Creating trade operation 7 (DELIVERED)...');

  const buyListing7 = await prisma.buyListing.create({
    data: {
      buyerId: buyer.id,
      productId: corn.id,
      deliveryAddressId: addr_buyer.id,
      quantity: 500,
      unit: 'TON',
      maxPricePerUnit: 210.00,
      neededBy: daysFromNow(-3),
      status: 'FULFILLED',
    },
  });

  const tradeOp7 = await prisma.tradeOperation.create({
    data: {
      operationNumber: nextOpNumber(),
      adminId: admin.id,
      buyListingId: buyListing7.id,
      phase: 'DELIVERED',
      status: 'ACTIVE',
      currency: 'EUR',
      totalPurchaseCost: 95000.00,
      avgPurchasePrice: 190.00,
      sellingPrice: 206.00,
      totalRevenue: 103000.00,
      estimatedTransportCost: 5500.00,
      actualTransportCost: 5300.00,
      estimatedProfit: 6200.00,
      actualProfit: 6500.00,
      profitMargin: 6.3,
      totalDistanceKm: 380.0,
      completedAt: daysFromNow(-3),
    },
  });

  const tradeSeller7_s2 = await prisma.tradeSeller.create({
    data: {
      tradeOperationId: tradeOp7.id,
      sellerId: seller2.id,
      saleListingId: saleListing_s2_corn.id,
      requestedQuantity: 500,
      offeredQuantity: 1200,
      agreedQuantity: 500,
      agreedPrice: 190.00,
      unit: 'TON',
      matchScore: 88,
      isVerified: true,
      status: 'CONFIRMED',
      confirmedAt: daysFromNow(-15),
    },
  });

  const negotiation7 = await prisma.offerNegotiation.create({
    data: {
      tradeOperationId: tradeOp7.id,
      tradeSellerId: tradeSeller7_s2.id,
      status: 'ACCEPTED',
      currentOffer: { price: 190.00, quantity: 500, terms: 'EXW Varna, payment net 30' },
      counterOffer: undefined,
      offerHistory: [{ price: 190.00, quantity: 500, offeredBy: 'BUYER', offeredAt: daysFromNow(-18).toISOString() }],
      finalPrice: 190.00,
      finalQuantity: 500,
      unit: 'TON',
      expiresAt: daysFromNow(-14),
      respondedAt: daysFromNow(-17),
      concludedAt: daysFromNow(-16),
    },
  });

  const transportReq7 = await prisma.transportRequest.create({
    data: {
      requestNumber: nextReqNumber(),
      tradeOperationId: tradeOp7.id,
      totalWeight: 500,
      requiredVehicleType: 'FLATBED',
      specialRequirements: ['CMR required'],
      pickupPoints: [
        {
          lat: 43.2140,
          lng: 27.9147,
          sellerId: seller2.id,
          quantity: 500,
          address: 'Пристанищна зона, Силозен терминал 4, Варна',
        },
      ],
      deliveryPoint: {
        lat: 42.6955,
        lng: 23.3971,
        addressId: addr_buyer.id,
        address: 'бул. Цариградско шосе 125, София 1784',
      },
      estimatedDistance: 380.0,
      pickupWindowStart: daysFromNow(-10),
      pickupWindowEnd: daysFromNow(-9),
      deliveryDeadline: daysFromNow(-5),
      urgencyLevel: 'STANDARD',
      status: 'COMPLETED',
      biddingDeadline: daysFromNow(-12),
      maxBudget: 6000.00,
      selectedBidId: null,
    },
  });

  const transportBid7 = await prisma.transportBid.create({
    data: {
      transportRequestId: transportReq7.id,
      tradeOperationId: tradeOp7.id,
      transporterId: transporter.id,
      transportCompanyId: transportCompany.id,
      bidAmount: 5300.00,
      estimatedDuration: 8,
      vehicleType: 'FLATBED',
      vehicleCapacity: 25,
      assignedTruckId: truck2.id,
      specialEquipment: ['GPS', 'tarpaulin'],
      insuranceCoverage: 150000.00,
      status: 'ACCEPTED',
      expiresAt: daysFromNow(-11),
      evaluatedAt: daysFromNow(-12),
      acceptedAt: daysFromNow(-12),
    },
  });

  await prisma.transportRequest.update({
    where: { id: transportReq7.id },
    data: { selectedBidId: transportBid7.id },
  });

  const transportJob7 = await prisma.transportJob.create({
    data: {
      jobNumber: nextJobNumber(),
      transportRequestId: transportReq7.id,
      transportBidId: transportBid7.id,
      tradeOperationId: tradeOp7.id,
      transporterId: transporter.id,
      status: 'COMPLETED',
      pickupsCompleted: [
        {
          sellerId: seller2.id,
          address: 'Пристанищна зона, Силозен терминал 4, Варна',
          completedAt: daysFromNow(-8).toISOString(),
          quantity: 500,
        },
      ],
      allPickupsComplete: true,
      currentLocation: {
        lat: 42.6955,
        lng: 23.3971,
        timestamp: daysFromNow(-5).toISOString(),
        address: 'бул. Цариградско шосе 125, София',
      },
      actualDelivery: daysFromNow(-5),
      deliveryPhotos: [
        'https://res.cloudinary.com/demo/image/upload/v1/agrotrade/transport/corn_delivery_01.jpg',
        'https://res.cloudinary.com/demo/image/upload/v1/agrotrade/transport/corn_delivery_02.jpg',
      ],
      pickupPhotos: [
        'https://res.cloudinary.com/demo/image/upload/v1/agrotrade/transport/corn_load_varna_01.jpg',
      ],
      proofOfDelivery: 'https://res.cloudinary.com/demo/image/upload/v1/agrotrade/documents/cmr_TJ5001.pdf',
      onTimePickup: true,
      onTimeDelivery: true,
      customerRating: 5,
      notes: 'Delivery completed on time. Buyer confirmed receipt. 500t corn delivered and weighed.',
      startedAt: daysFromNow(-8),
      completedAt: daysFromNow(-5),
    },
  });

  await prisma.tradeTransporter.create({
    data: {
      tradeOperationId: tradeOp7.id,
      transporterId: transporter.id,
      vehicleId: truck2.id,
      route: {
        from: 'Varna',
        to: 'Sofia',
        waypoints: ['Varna', 'Shumen', 'Targovishte', 'Lovech', 'Sofia'],
        totalKm: 380,
      },
      estimatedDistance: 380,
      estimatedDuration: 480,
      agreedPrice: 5300.00,
      status: 'DELIVERED',
      confirmedAt: daysFromNow(-12),
      deliveredAt: daysFromNow(-5),
    },
  });

  await prisma.tradeStateHistory.createMany({
    data: [
      { tradeOperationId: tradeOp7.id, fromPhase: null,                 toPhase: 'INITIATION',          toStatus: 'ACTIVE',    changedBy: admin.id, reason: 'Created' },
      { tradeOperationId: tradeOp7.id, fromPhase: 'INITIATION',         toPhase: 'SELLER_MATCHING',     toStatus: 'ACTIVE',    changedBy: admin.id, reason: 'Seller2 matched' },
      { tradeOperationId: tradeOp7.id, fromPhase: 'SELLER_MATCHING',    toPhase: 'SELLER_NEGOTIATION',  toStatus: 'ACTIVE',    changedBy: admin.id, reason: 'Negotiation opened' },
      { tradeOperationId: tradeOp7.id, fromPhase: 'SELLER_NEGOTIATION', toPhase: 'INSPECTION_PENDING',  toStatus: 'ACTIVE',    changedBy: admin.id, reason: 'First offer accepted' },
      { tradeOperationId: tradeOp7.id, fromPhase: 'INSPECTION_PENDING', toPhase: 'TRANSPORT_BIDDING',   toStatus: 'ACTIVE',    changedBy: admin.id, reason: 'Inspection passed' },
      { tradeOperationId: tradeOp7.id, fromPhase: 'TRANSPORT_BIDDING',  toPhase: 'IN_TRANSIT',          toStatus: 'ACTIVE',    changedBy: admin.id, reason: 'Transport started, Varna → Sofia' },
      { tradeOperationId: tradeOp7.id, fromPhase: 'IN_TRANSIT',         toPhase: 'DELIVERED',           toStatus: 'ACTIVE',    changedBy: admin.id, reason: '500t corn delivered to Sofia processing plant' },
    ],
  });

  await prisma.tradeNote.createMany({
    data: [
      {
        tradeOperationId: tradeOp7.id,
        authorId: admin.id,
        content: 'Delivery confirmed by buyer. Weight slip received: 499.8t (0.04% variance within tolerance).',
        isInternal: false,
      },
      {
        tradeOperationId: tradeOp7.id,
        authorId: admin.id,
        content: 'SpeedCargo rated 5/5 by buyer. Consider priority allocation for next operations.',
        isInternal: true,
      },
    ],
  });

  // ==================== OFFERS (marketplace level) ====================
  console.log('Creating marketplace-level offers...');

  const validUntil30 = daysFromNow(30);
  const validUntil14 = daysFromNow(14);

  // Platform-generated offer: seller1 wheat → buyListing1
  await prisma.offer.create({
    data: {
      saleListingId: saleListing_s1_wheat1.id,
      buyListingId: buyListing1.id,
      offeredPrice: 222.00,
      quantity: 350,
      unit: 'TON',
      matchScore: 91,
      matchDetails: { moisture: 'PASS', protein: 'PASS', gluten: 'PASS', test_weight: 'PASS', impurities: 'PASS' },
      basePrice: 225.00,
      qualityAdjustment: -3.00,
      quantityDiscount: null,
      transportCost: 8.00,
      finalPrice: 222.00,
      validUntil: validUntil14,
      deliveryTerms: 'EXW Plovdiv',
      paymentTerms: 'Net 30',
      status: 'ACCEPTED',
      createdBy: 'PLATFORM',
    },
  });

  // Seller-initiated offer: seller2 wheat → buyListing1
  await prisma.offer.create({
    data: {
      saleListingId: saleListing_s2_wheat.id,
      buyListingId: buyListing1.id,
      offeredPrice: 218.00,
      quantity: 250,
      unit: 'TON',
      matchScore: 83,
      matchDetails: { moisture: 'PASS', protein: 'WARN', gluten: 'PASS', test_weight: 'PASS', impurities: 'PASS' },
      basePrice: 220.00,
      qualityAdjustment: -2.00,
      quantityDiscount: null,
      transportCost: 12.00,
      finalPrice: 218.00,
      validUntil: validUntil14,
      deliveryTerms: 'EXW Dobrich',
      paymentTerms: 'Net 30',
      status: 'ACCEPTED',
      createdBy: 'PLATFORM',
    },
  });

  // Pending platform offer: seller1 sunflower → buyListing3
  await prisma.offer.create({
    data: {
      saleListingId: saleListing_s1_sunflower.id,
      buyListingId: buyListing3.id,
      offeredPrice: 438.00,
      quantity: 150,
      unit: 'TON',
      matchScore: 95,
      matchDetails: { moisture: 'PASS', oil_content: 'PASS', impurities: 'PASS' },
      basePrice: 440.00,
      qualityAdjustment: 0,
      quantityDiscount: -2.00,
      transportCost: 15.00,
      finalPrice: 438.00,
      validUntil: validUntil30,
      deliveryTerms: 'EXW Stara Zagora',
      paymentTerms: 'Net 30',
      status: 'PENDING',
      createdBy: 'PLATFORM',
    },
  });

  // Pending offer: seller2 rapeseed → buyListing4
  await prisma.offer.create({
    data: {
      saleListingId: saleListing_s2_rapeseed.id,
      buyListingId: buyListing4.id,
      offeredPrice: 478.00,
      quantity: 200,
      unit: 'TON',
      matchScore: 97,
      matchDetails: { moisture: 'PASS', oil_content: 'PASS', impurities: 'PASS' },
      basePrice: 480.00,
      qualityAdjustment: 0,
      quantityDiscount: -2.00,
      transportCost: 18.00,
      finalPrice: 478.00,
      validUntil: validUntil30,
      deliveryTerms: 'EXW Dobrich',
      paymentTerms: 'Net 15',
      status: 'PENDING',
      createdBy: 'PLATFORM',
    },
  });

  // ==================== PROFIT ESTIMATIONS ====================
  console.log('Creating profit estimations...');

  await prisma.profitEstimation.create({
    data: {
      tradeOperationId: tradeOp4.id,
      proposedBuyerPrice: 232.00,
      proposedSellerPrices: [
        { sellerId: seller1.id, price: 222.00, quantity: 350 },
        { sellerId: seller2.id, price: 218.00, quantity: 250 },
      ],
      estimatedRevenue: 139200.00,
      estimatedPurchaseCost: 132300.00,
      estimatedTransportCost: 8500.00,
      estimatedProfit: 9200.00,
      profitMargin: 6.6,
      priceVolatilityRisk: 25.0,
      qualityRisk: 15.0,
      transportRisk: 10.0,
      overallRisk: 18.0,
      notes: 'Strong margin for soft wheat operation. Both sellers accepted first/second offer round. Inspection scheduled.',
      createdBy: admin.id,
    },
  });

  await prisma.profitEstimation.create({
    data: {
      tradeOperationId: tradeOp5.id,
      proposedBuyerPrice: 315.00,
      proposedSellerPrices: [
        { sellerId: seller1.id, price: 300.00, quantity: 180 },
      ],
      estimatedRevenue: 56700.00,
      estimatedPurchaseCost: 54000.00,
      estimatedTransportCost: 3200.00,
      estimatedProfit: 2500.00,
      profitMargin: 4.4,
      priceVolatilityRisk: 20.0,
      qualityRisk: 5.0,
      transportRisk: 12.0,
      overallRisk: 14.0,
      notes: 'Premium durum wheat operation. Excellent quality (score 92). Transport bidding active.',
      createdBy: admin.id,
    },
  });

  // ==================== TRANSPORT COST CALCULATIONS ====================
  console.log('Creating transport cost calculations...');

  await prisma.transportCostCalculation.create({
    data: {
      tradeOperationId: tradeOp5.id,
      pickupPoints: [{ lat: 42.4257, lng: 25.6343, sellerId: seller1.id, quantity: 180 }],
      deliveryPoint:  { lat: 42.6955, lng: 23.3971, addressId: addr_buyer.id },
      totalDistance: 310.0,
      baseRatePerKm: 0.13,
      vehicleType: 'CURTAIN_SIDE',
      distanceCost: 3224.00,
      loadingCosts: 90.00,
      urgencySurcharge: 966.00,
      totalCost: 3200.00,
      calculatedBy: admin.id,
    },
  });

  await prisma.transportCostCalculation.create({
    data: {
      tradeOperationId: tradeOp6.id,
      pickupPoints: [{ lat: 42.1554, lng: 24.7401, sellerId: seller1.id, quantity: 250 }],
      deliveryPoint:  { lat: 43.8355, lng: 25.9656, addressId: addr_buyer2.id },
      totalDistance: 220.0,
      baseRatePerKm: 0.13,
      vehicleType: 'FLATBED',
      distanceCost: 2860.00,
      loadingCosts: 125.00,
      urgencySurcharge: null,
      totalCost: 2800.00,
      calculatedBy: admin.id,
    },
  });

  // ==================== DONE ====================
  console.log('');
  console.log('Demo seed completed successfully.');
  console.log('');
  console.log('Summary:');
  console.log('  Sale listings: 10 (5 from seller1, 5 from seller2)');
  console.log('  Buy listings : 6 (buyer)');
  console.log('  Trade ops    : 7 (INITIATION → DELIVERED)');
  console.log('  Negotiations : 6 (various statuses)');
  console.log('  Offer rounds : 9');
  console.log('  Inspections  : 3');
  console.log('  Transport req: 3');
  console.log('  Transport bids: 5');
  console.log('  Transport jobs: 2');
  console.log('  Transport co : SpeedCargo Bulgaria EOOD');
  console.log('  Transporters : 3 (SpeedCargo, Georgi Petrov, Ivan Kolev)');
  console.log('  Trucks       : 4');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
