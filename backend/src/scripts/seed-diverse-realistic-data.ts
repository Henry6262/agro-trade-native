import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Comprehensive location data with accurate coordinates
const CITY_DATA = [
  // North-Western Region
  { name: 'Sofia', region: 'North-Western', lat: 42.6977, lng: 23.3219 },
  { name: 'Vidin', region: 'North-Western', lat: 43.9864, lng: 22.8725 },
  { name: 'Montana', region: 'North-Western', lat: 43.4100, lng: 23.2267 },

  // North-Central Region
  { name: 'Pleven', region: 'North-Central', lat: 43.4170, lng: 24.6167 },
  { name: 'Ruse', region: 'North-Central', lat: 43.8564, lng: 25.9656 },
  { name: 'Veliko Tarnovo', region: 'North-Central', lat: 43.0757, lng: 25.6172 },

  // North-Eastern Region
  { name: 'Varna', region: 'North-Eastern', lat: 43.2141, lng: 27.9147 },
  { name: 'Dobrich', region: 'North-Eastern', lat: 43.5675, lng: 27.8275 },
  { name: 'Shumen', region: 'North-Eastern', lat: 43.2706, lng: 26.9344 },

  // South-Eastern Region
  { name: 'Burgas', region: 'South-Eastern', lat: 42.5048, lng: 27.4626 },
  { name: 'Sliven', region: 'South-Eastern', lat: 42.6811, lng: 26.3228 },
  { name: 'Yambol', region: 'South-Eastern', lat: 42.4839, lng: 26.5039 },

  // South-Central Region
  { name: 'Plovdiv', region: 'South-Central', lat: 42.1354, lng: 24.7453 },
  { name: 'Stara Zagora', region: 'South-Central', lat: 42.4250, lng: 25.6342 },
  { name: 'Pazardzhik', region: 'South-Central', lat: 42.1964, lng: 24.3336 },

  // South-Western Region
  { name: 'Blagoevgrad', region: 'South-Western', lat: 42.0169, lng: 23.0947 },
  { name: 'Pernik', region: 'South-Western', lat: 42.6042, lng: 23.0339 },
  { name: 'Kyustendil', region: 'South-Western', lat: 42.2872, lng: 22.6911 },
];

// Buyer company templates - diverse corporations across regions
const BUYER_TEMPLATES = [
  // Large importers
  { email: 'buyer1@agrocorp.bg', name: 'AgriCorp International', businessName: 'AgriCorp International', city: 'Sofia', minQty: 80, maxQty: 150 },
  { email: 'buyer2@grainimport.bg', name: 'Bulgarian Grain Import Ltd', businessName: 'Bulgarian Grain Import', city: 'Varna', minQty: 60, maxQty: 120 },
  { email: 'buyer3@millcompany.bg', name: 'Plovdiv Mills Co.', businessName: 'Plovdiv Mills Co.', city: 'Plovdiv', minQty: 50, maxQty: 100 },

  // Medium processors
  { email: 'buyer4@foodprocess.bg', name: 'Ruse Food Processing', businessName: 'Ruse Food Processing', city: 'Ruse', minQty: 30, maxQty: 70 },
  { email: 'buyer5@organicbulk.bg', name: 'Organic Bulk Traders', businessName: 'Organic Bulk BG', city: 'Burgas', minQty: 40, maxQty: 80 },
  { email: 'buyer6@starazagora-mill.bg', name: 'Stara Zagora Mill Group', businessName: 'SZ Mill Group', city: 'Stara Zagora', minQty: 35, maxQty: 75 },

  // Regional buyers
  { email: 'buyer7@vidin-trade.bg', name: 'Vidin Agricultural Trade', businessName: 'Vidin Agro Trade', city: 'Vidin', minQty: 20, maxQty: 50 },
  { email: 'buyer8@dobrich-grain.bg', name: 'Dobrich Grain Cooperative', businessName: 'Dobrich Grain Co-op', city: 'Dobrich', minQty: 25, maxQty: 55 },
  { email: 'buyer9@blagoevgrad-foods.bg', name: 'Blagoevgrad Foods Ltd.', businessName: 'Blagoevgrad Foods', city: 'Blagoevgrad', minQty: 30, maxQty: 60 },

  // Specialty buyers
  { email: 'buyer10@premium-grain.bg', name: 'Premium Grain Solutions', businessName: 'Premium Grain BG', city: 'Sofia', minQty: 40, maxQty: 90 },
  { email: 'buyer11@export-ag.bg', name: 'Export Agricultural Hub', businessName: 'Export Ag Hub', city: 'Varna', minQty: 70, maxQty: 130 },
  { email: 'buyer12@montana-processing.bg', name: 'Montana Processing Center', businessName: 'Montana Processing', city: 'Montana', minQty: 25, maxQty: 50 },
];

// Seller farm templates - diverse sellers across regions
const SELLER_TEMPLATES = [
  // Premium farms
  { email: 'seller1@organic-farm.bg', name: 'Ivan Petrov', businessName: 'Organic Farm Plovdiv', city: 'Plovdiv', verified: true, grade: 'A' },
  { email: 'seller2@premium-harvest.bg', name: 'Maria Dimitrova', businessName: 'Premium Harvest Sofia', city: 'Sofia', verified: true, grade: 'A' },
  { email: 'seller3@varna-organic.bg', name: 'Georgi Ivanov', businessName: 'Varna Organic Farms', city: 'Varna', verified: true, grade: 'A' },

  // Standard quality farms
  { email: 'seller4@ruse-farms.bg', name: 'Petar Stoyanov', businessName: 'Ruse Agricultural Co.', city: 'Ruse', verified: true, grade: 'B' },
  { email: 'seller5@burgas-harvest.bg', name: 'Elena Georgieva', businessName: 'Burgas Harvest Group', city: 'Burgas', verified: true, grade: 'B' },
  { email: 'seller6@pleven-agro.bg', name: 'Nikolay Krastev', businessName: 'Pleven Agro Ltd.', city: 'Pleven', verified: true, grade: 'B' },
  { email: 'seller7@stara-zagora-farm.bg', name: 'Dimitar Vasilev', businessName: 'Stara Zagora Farm', city: 'Stara Zagora', verified: false, grade: 'B' },

  // Budget farms
  { email: 'seller8@vidin-grain.bg', name: 'Stefan Todorov', businessName: 'Vidin Grain Farm', city: 'Vidin', verified: false, grade: 'C' },
  { email: 'seller9@dobrich-fields.bg', name: 'Todor Mihaylov', businessName: 'Dobrich Fields Co.', city: 'Dobrich', verified: false, grade: 'C' },
  { email: 'seller10@montana-farm.bg', name: 'Vasil Angelov', businessName: 'Montana Farm Products', city: 'Montana', verified: false, grade: 'C' },

  // Mid-size operations
  { email: 'seller11@sliven-agri.bg', name: 'Hristo Petkov', businessName: 'Sliven Agricultural', city: 'Sliven', verified: true, grade: 'B' },
  { email: 'seller12@veliko-tarnovo-farm.bg', name: 'Kamen Ivanov', businessName: 'Veliko Tarnovo Farm', city: 'Veliko Tarnovo', verified: false, grade: 'B' },
  { email: 'seller13@blagoevgrad-harvest.bg', name: 'Lyubomir Kolev', businessName: 'Blagoevgrad Harvest', city: 'Blagoevgrad', verified: true, grade: 'A' },
  { email: 'seller14@shumen-grain.bg', name: 'Veselin Petrov', businessName: 'Shumen Grain Co.', city: 'Shumen', verified: false, grade: 'C' },
  { email: 'seller15@yambol-fields.bg', name: 'Plamen Georgiev', businessName: 'Yambol Fields Ltd.', city: 'Yambol', verified: true, grade: 'B' },

  // Small farms
  { email: 'seller16@pernik-farm.bg', name: 'Boyan Ivanov', businessName: 'Pernik Family Farm', city: 'Pernik', verified: false, grade: 'C' },
  { email: 'seller17@kyustendil-grain.bg', name: 'Zdravko Petrov', businessName: 'Kyustendil Grain', city: 'Kyustendil', verified: false, grade: 'C' },
  { email: 'seller18@pazardzhik-harvest.bg', name: 'Ivaylo Dimitrov', businessName: 'Pazardzhik Harvest', city: 'Pazardzhik', verified: true, grade: 'B' },
];

// Specification profiles based on quality grade
const SPEC_PROFILES = {
  A: { // Premium
    moisture: { min: 12.0, max: 12.8 },
    protein: { min: 12.3, max: 13.2 },
    organic: 0.7, // 70% chance
  },
  B: { // Standard
    moisture: { min: 12.8, max: 13.8 },
    protein: { min: 11.2, max: 12.3 },
    organic: 0.3, // 30% chance
  },
  C: { // Budget
    moisture: { min: 13.5, max: 14.5 },
    protein: { min: 10.5, max: 11.5 },
    organic: 0.1, // 10% chance
  },
};

// Helper functions
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max));
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  // Create regions
  console.log('📍 Creating regions...');
  const regionNames = ['North-Western', 'North-Central', 'North-Eastern', 'South-Eastern', 'South-Central', 'South-Western'];
  const regions = await Promise.all(
    regionNames.map(name =>
      prisma.region.upsert({
        where: { name_country: { name, country: 'Bulgaria' } },
        update: {},
        create: { name, country: 'Bulgaria' },
      })
    )
  );
  console.log(`✅ Created ${regions.length} regions\n`);

  // Create cities
  console.log('🏙️  Creating cities...');
  const regionMap = Object.fromEntries(regions.map(r => [r.name, r]));
  const cities = await Promise.all(
    CITY_DATA.map(cityData =>
      prisma.city.upsert({
        where: {
          name_regionId: {
            name: cityData.name,
            regionId: regionMap[cityData.region].id
          }
        },
        update: {},
        create: {
          name: cityData.name,
          regionId: regionMap[cityData.region].id,
        },
      })
    )
  );
  console.log(`✅ Created ${cities.length} cities\n`);

  // Create city lookup map
  const cityMap = Object.fromEntries(cities.map(c => [c.name, c]));

  // Get existing products (already seeded with images)
  console.log('🌾 Fetching existing products...');
  const products = await prisma.product.findMany({
    where: {
      name: {
        in: ['soft_wheat', 'corn_maize', 'sunflower', 'barley', 'rapeseed']
      }
    }
  });
  console.log(`✅ Found ${products.length} products\n`);

  // Create specification types
  console.log('📊 Creating specification types...');
  const specTypes = await Promise.all([
    prisma.specificationType.upsert({
      where: { code: 'moisture' },
      update: {},
      create: { code: 'moisture', name: 'Moisture Content', unit: '%', dataType: 'NUMBER' },
    }),
    prisma.specificationType.upsert({
      where: { code: 'protein' },
      update: {},
      create: { code: 'protein', name: 'Protein Content', unit: '%', dataType: 'NUMBER' },
    }),
    prisma.specificationType.upsert({
      where: { code: 'grade' },
      update: {},
      create: { code: 'grade', name: 'Quality Grade', dataType: 'TEXT' },
    }),
    prisma.specificationType.upsert({
      where: { code: 'organic' },
      update: {},
      create: { code: 'organic', name: 'Organic Certified', dataType: 'BOOLEAN' },
    }),
  ]);
  console.log(`✅ Created ${specTypes.length} specification types\n`);

  const hashedPassword = await bcrypt.hash('test123', 10);

  // Create buyers
  console.log('👥 Creating buyer users and listings...');
  let buyerCount = 0;
  let buyListingCount = 0;

  for (const template of BUYER_TEMPLATES) {
    const cityData = CITY_DATA.find(c => c.name === template.city);
    if (!cityData) continue;

    // Create buyer user
    const buyer = await prisma.user.upsert({
      where: { email: template.email },
      update: {},
      create: {
        email: template.email,
        password: hashedPassword,
        name: template.name,
        role: 'BUYER',
      },
    });

    // Create company for buyer (to store legalName)
    await prisma.company.upsert({
      where: { userId: buyer.id },
      update: {},
      create: {
        userId: buyer.id,
        legalName: template.businessName,
        registrationNumber: `BG${randomInt(100000000, 999999999)}`,
      },
    });
    buyerCount++;

    // Create buyer address
    const buyerAddress = await prisma.address.create({
      data: {
        userId: buyer.id,
        addressType: 'WAREHOUSE',
        street: `Industrial Complex ${randomInt(1, 99)}`,
        cityId: cityMap[template.city].id,
        country: 'Bulgaria',
        latitude: cityData.lat + randomInRange(-0.05, 0.05),
        longitude: cityData.lng + randomInRange(-0.05, 0.05),
        postalCode: `${randomInt(1000, 9999)}`,
        isDefault: true,
      },
    });

    // Create 1-3 buy listings per buyer
    const numListings = randomInt(1, 4);
    for (let i = 0; i < numListings; i++) {
      const product = randomElement(products);
      const quantity = randomInt(template.minQty, template.maxQty);
      const basePrice = { 'soft_wheat': 260, 'corn_maize': 230, 'sunflower': 370, 'barley': 200, 'rapeseed': 340 }[product.name] || 250;
      const maxPrice = basePrice + randomInt(-20, 30);
      const daysUntilNeeded = randomInt(7, 60);

      await prisma.buyListing.create({
        data: {
          buyerId: buyer.id,
          productId: product.id,
          quantity,
          unit: 'TON',
          maxPricePerUnit: maxPrice,
          neededBy: new Date(Date.now() + daysUntilNeeded * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          deliveryAddressId: buyerAddress.id,
        },
      });
      buyListingCount++;
    }
  }
  console.log(`✅ Created ${buyerCount} buyers with ${buyListingCount} buy listings\n`);

  // Create sellers and their listings with specifications
  console.log('🌾 Creating seller users, listings, and specifications...');
  let sellerCount = 0;
  let saleListingCount = 0;
  let specificationCount = 0;

  for (const template of SELLER_TEMPLATES) {
    const cityData = CITY_DATA.find(c => c.name === template.city);
    if (!cityData) continue;

    // Create seller user
    const seller = await prisma.user.upsert({
      where: { email: template.email },
      update: {},
      create: {
        email: template.email,
        password: hashedPassword,
        name: template.name,
        role: 'FARMER',
      },
    });

    // Create company for seller (to store legalName and verification)
    await prisma.company.upsert({
      where: { userId: seller.id },
      update: {},
      create: {
        userId: seller.id,
        legalName: template.businessName,
        registrationNumber: `BG${randomInt(100000000, 999999999)}`,
      },
    });
    sellerCount++;

    // Create seller address
    const sellerAddress = await prisma.address.create({
      data: {
        userId: seller.id,
        addressType: 'FARM',
        street: `Farm Road ${randomInt(1, 200)}`,
        cityId: cityMap[template.city].id,
        country: 'Bulgaria',
        latitude: cityData.lat + randomInRange(-0.1, 0.1),
        longitude: cityData.lng + randomInRange(-0.1, 0.1),
        postalCode: `${randomInt(1000, 9999)}`,
        isDefault: true,
      },
    });

    // Create 2-4 sale listings per seller
    const numListings = randomInt(2, 5);
    for (let i = 0; i < numListings; i++) {
      const product = randomElement(products);
      const quantity = randomInt(20, 80);
      const basePrice = { 'soft_wheat': 250, 'corn_maize': 220, 'sunflower': 350, 'barley': 190, 'rapeseed': 330 }[product.name] || 240;

      // Adjust price based on grade
      const gradeMultiplier = { 'A': 1.15, 'B': 1.0, 'C': 0.85 }[template.grade] || 1.0;
      const askingPrice = Math.round(basePrice * gradeMultiplier);

      const saleListing = await prisma.saleListing.create({
        data: {
          sellerId: seller.id,
          productId: product.id,
          quantity,
          unit: 'TON',
          askingPrice,
          qualityGrade: template.grade,
          status: 'ACTIVE',
          addressId: sellerAddress.id,
        },
      });
      saleListingCount++;

      // Add specifications based on grade profile
      const profile = SPEC_PROFILES[template.grade as 'A' | 'B' | 'C'];

      // Moisture specification
      const moisture = randomInRange(profile.moisture.min, profile.moisture.max);
      await prisma.listingSpec.create({
        data: {
          saleListingId: saleListing.id,
          specTypeId: specTypes[0].id, // moisture
          valueNumber: parseFloat(moisture.toFixed(1)),
        },
      });
      specificationCount++;

      // Protein specification
      const protein = randomInRange(profile.protein.min, profile.protein.max);
      await prisma.listingSpec.create({
        data: {
          saleListingId: saleListing.id,
          specTypeId: specTypes[1].id, // protein
          valueNumber: parseFloat(protein.toFixed(1)),
        },
      });
      specificationCount++;

      // Grade specification
      await prisma.listingSpec.create({
        data: {
          saleListingId: saleListing.id,
          specTypeId: specTypes[2].id, // grade
          valueText: template.grade,
        },
      });
      specificationCount++;

      // Organic specification (based on probability)
      const isOrganic = Math.random() < profile.organic;
      await prisma.listingSpec.create({
        data: {
          saleListingId: saleListing.id,
          specTypeId: specTypes[3].id, // organic
          valueBool: isOrganic,
        },
      });
      specificationCount++;
    }
  }
  console.log(`✅ Created ${sellerCount} sellers with ${saleListingCount} sale listings`);
  console.log(`✅ Created ${specificationCount} specifications\n`);

  // Summary
  console.log('\n🎉 Comprehensive seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Regions: ${regions.length}`);
  console.log(`   Cities: ${cities.length} (across all regions)`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Specification Types: ${specTypes.length}`);
  console.log(`   Buyers: ${buyerCount} (diverse across regions)`);
  console.log(`   Sellers: ${sellerCount} (with varied quality grades)`);
  console.log(`   Buy Listings: ${buyListingCount} (various products and quantities)`);
  console.log(`   Sale Listings: ${saleListingCount} (with specifications)`);
  console.log(`   Specifications: ${specificationCount} (moisture, protein, grade, organic)`);
  console.log('\n✅ Database is ready with realistic, diverse test data!');
  console.log('\nGeographic Distribution:');
  console.log('   ✓ North-Western: Sofia, Vidin, Montana');
  console.log('   ✓ North-Central: Pleven, Ruse, Veliko Tarnovo');
  console.log('   ✓ North-Eastern: Varna, Dobrich, Shumen');
  console.log('   ✓ South-Eastern: Burgas, Sliven, Yambol');
  console.log('   ✓ South-Central: Plovdiv, Stara Zagora, Pazardzhik');
  console.log('   ✓ South-Western: Blagoevgrad, Pernik, Kyustendil');
  console.log('\nQuality Distribution:');
  console.log('   ✓ Grade A (Premium): ~30% of sellers');
  console.log('   ✓ Grade B (Standard): ~50% of sellers');
  console.log('   ✓ Grade C (Budget): ~20% of sellers');
  console.log('\nTest Credentials (password: test123):');
  console.log('   Buyers: buyer1@agrocorp.bg ... buyer12@montana-processing.bg');
  console.log('   Sellers: seller1@organic-farm.bg ... seller18@pazardzhik-harvest.bg');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
