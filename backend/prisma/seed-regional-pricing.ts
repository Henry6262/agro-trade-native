import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRegionalPricing() {
  console.log('🌍 Seeding regional pricing data...');

  // Create countries
  const bulgaria = await prisma.country.upsert({
    where: { code: 'BG' },
    update: {},
    create: {
      name: 'Bulgaria',
      code: 'BG',
      flagEmoji: '🇧🇬',
      currencyCode: 'BGN',
      isActive: true,
    },
  });

  const greece = await prisma.country.upsert({
    where: { code: 'GR' },
    update: {},
    create: {
      name: 'Greece',
      code: 'GR',
      flagEmoji: '🇬🇷',
      currencyCode: 'EUR',
      isActive: true,
    },
  });

  console.log('✅ Countries created');

  // Create Bulgarian regions and cities
  const bulgarianRegions = [
    {
      name: 'Sofia City',
      cities: [
        { name: 'Sofia', latitude: 42.6977, longitude: 23.3219, isCapital: true, population: 1260120 },
      ],
    },
    {
      name: 'Plovdiv Province',
      cities: [
        { name: 'Plovdiv', latitude: 42.1354, longitude: 24.7453, population: 346893 },
        { name: 'Asenovgrad', latitude: 42.0181, longitude: 24.8733, population: 50846 },
        { name: 'Karlovo', latitude: 42.6411, longitude: 24.8066, population: 19373 },
      ],
    },
    {
      name: 'Varna Province',
      cities: [
        { name: 'Varna', latitude: 43.2141, longitude: 27.9147, population: 334870 },
        { name: 'Devnya', latitude: 43.2223, longitude: 27.5693, population: 7645 },
        { name: 'Provadia', latitude: 43.1761, longitude: 27.4378, population: 12201 },
      ],
    },
    {
      name: 'Burgas Province',
      cities: [
        { name: 'Burgas', latitude: 42.5048, longitude: 27.4626, population: 202766 },
        { name: 'Sozopol', latitude: 42.4181, longitude: 27.6937, population: 4955 },
        { name: 'Nesebar', latitude: 42.6591, longitude: 27.7360, population: 13347 },
      ],
    },
    {
      name: 'Ruse Province',
      cities: [
        { name: 'Ruse', latitude: 43.8356, longitude: 25.9657, population: 144936 },
        { name: 'Byala', latitude: 43.4583, longitude: 25.7434, population: 10782 },
      ],
    },
    {
      name: 'Stara Zagora Province',
      cities: [
        { name: 'Stara Zagora', latitude: 42.4258, longitude: 25.6345, population: 136781 },
        { name: 'Kazanlak', latitude: 42.6194, longitude: 25.3989, population: 47325 },
        { name: 'Chirpan', latitude: 42.1994, longitude: 25.3293, population: 15637 },
      ],
    },
    {
      name: 'Pleven Province',
      cities: [
        { name: 'Pleven', latitude: 43.4170, longitude: 24.6067, population: 96610 },
        { name: 'Cherven Bryag', latitude: 43.2667, longitude: 24.1000, population: 12823 },
      ],
    },
    {
      name: 'Veliko Tarnovo Province',
      cities: [
        { name: 'Veliko Tarnovo', latitude: 43.0757, longitude: 25.6172, population: 68783 },
        { name: 'Gorna Oryahovitsa', latitude: 43.1275, longitude: 25.7017, population: 31434 },
        { name: 'Svishtov', latitude: 43.6239, longitude: 25.3506, population: 26979 },
      ],
    },
  ];

  for (const regionData of bulgarianRegions) {
    const region = await prisma.region.create({
      data: {
        countryId: bulgaria.id,
        name: regionData.name,
      },
    });

    for (const cityData of regionData.cities) {
      await prisma.city.create({
        data: {
          regionId: region.id,
          ...cityData,
        },
      });
    }
  }

  console.log('✅ Bulgarian regions and cities created');

  // Create Greek regions and cities
  const greekRegions = [
    {
      name: 'Attica',
      cities: [
        { name: 'Athens', latitude: 37.9838, longitude: 23.7275, isCapital: true, population: 664046 },
        { name: 'Piraeus', latitude: 37.9475, longitude: 23.6372, population: 163688 },
        { name: 'Peristeri', latitude: 38.0128, longitude: 23.6919, population: 139981 },
        { name: 'Kallithea', latitude: 37.9503, longitude: 23.6972, population: 100641 },
      ],
    },
    {
      name: 'Central Macedonia',
      cities: [
        { name: 'Thessaloniki', latitude: 40.6401, longitude: 22.9444, population: 315196 },
        { name: 'Serres', latitude: 41.0856, longitude: 23.5497, population: 58287 },
        { name: 'Katerini', latitude: 40.2719, longitude: 22.5025, population: 55997 },
        { name: 'Veria', latitude: 40.5236, longitude: 22.2031, population: 48306 },
      ],
    },
    {
      name: 'Crete',
      cities: [
        { name: 'Heraklion', latitude: 35.3387, longitude: 25.1442, population: 140730 },
        { name: 'Chania', latitude: 35.5138, longitude: 24.0180, population: 53910 },
        { name: 'Rethymno', latitude: 35.3644, longitude: 24.4828, population: 34300 },
        { name: 'Ierapetra', latitude: 35.0106, longitude: 25.7406, population: 16139 },
      ],
    },
    {
      name: 'Eastern Macedonia and Thrace',
      cities: [
        { name: 'Alexandroupoli', latitude: 40.8475, longitude: 25.8744, population: 57812 },
        { name: 'Komotini', latitude: 41.1189, longitude: 25.4064, population: 50990 },
        { name: 'Drama', latitude: 41.1507, longitude: 24.1477, population: 44823 },
        { name: 'Xanthi', latitude: 41.1350, longitude: 24.8878, population: 56122 },
      ],
    },
    {
      name: 'Thessaly',
      cities: [
        { name: 'Larissa', latitude: 39.6390, longitude: 22.4191, population: 144651 },
        { name: 'Volos', latitude: 39.3619, longitude: 22.9422, population: 86046 },
        { name: 'Trikala', latitude: 39.5557, longitude: 21.7679, population: 61653 },
        { name: 'Karditsa', latitude: 39.3656, longitude: 21.9217, population: 38554 },
      ],
    },
    {
      name: 'Western Macedonia',
      cities: [
        { name: 'Kozani', latitude: 40.3006, longitude: 21.7867, population: 41066 },
        { name: 'Ptolemaida', latitude: 40.5147, longitude: 21.6786, population: 32127 },
        { name: 'Florina', latitude: 40.7831, longitude: 21.4097, population: 17686 },
        { name: 'Kastoria', latitude: 40.5192, longitude: 21.2686, population: 13387 },
      ],
    },
  ];

  for (const regionData of greekRegions) {
    const region = await prisma.region.create({
      data: {
        countryId: greece.id,
        name: regionData.name,
      },
    });

    for (const cityData of regionData.cities) {
      await prisma.city.create({
        data: {
          regionId: region.id,
          ...cityData,
        },
      });
    }
  }

  console.log('✅ Greek regions and cities created');

  // Create pricing zones
  const pricingZones = [
    // Bulgarian zones
    { name: 'Sofia Metro', description: 'Sofia and surrounding areas', color: '#FF6B6B' },
    { name: 'Black Sea Coast BG', description: 'Varna, Burgas and coastal areas', color: '#4ECDC4' },
    { name: 'Central Bulgaria', description: 'Plovdiv, Stara Zagora, Veliko Tarnovo', color: '#45B7D1' },
    { name: 'Northern Bulgaria', description: 'Ruse, Pleven and northern regions', color: '#96CEB4' },
    
    // Greek zones
    { name: 'Athens Metro', description: 'Athens, Piraeus and Attica region', color: '#6C5CE7' },
    { name: 'Thessaloniki Metro', description: 'Thessaloniki and Central Macedonia', color: '#FDA7DF' },
    { name: 'Crete Island', description: 'All cities in Crete', color: '#FFA502' },
    { name: 'Northern Greece', description: 'Macedonia and Thrace regions', color: '#FF7675' },
    { name: 'Central Greece', description: 'Thessaly and surrounding areas', color: '#74B9FF' },
  ];

  const createdZones = [];
  for (const zoneData of pricingZones) {
    const zone = await prisma.pricingZone.create({
      data: zoneData,
    });
    createdZones.push(zone);
  }

  console.log('✅ Pricing zones created');

  // Assign cities to pricing zones
  const cityZoneAssignments = [
    // Bulgarian assignments
    { cityName: 'Sofia', zoneName: 'Sofia Metro', isPrimary: true },
    { cityName: 'Varna', zoneName: 'Black Sea Coast BG', isPrimary: true },
    { cityName: 'Burgas', zoneName: 'Black Sea Coast BG', isPrimary: true },
    { cityName: 'Plovdiv', zoneName: 'Central Bulgaria', isPrimary: true },
    { cityName: 'Stara Zagora', zoneName: 'Central Bulgaria', isPrimary: true },
    { cityName: 'Veliko Tarnovo', zoneName: 'Central Bulgaria', isPrimary: true },
    { cityName: 'Ruse', zoneName: 'Northern Bulgaria', isPrimary: true },
    { cityName: 'Pleven', zoneName: 'Northern Bulgaria', isPrimary: true },
    
    // Greek assignments
    { cityName: 'Athens', zoneName: 'Athens Metro', isPrimary: true },
    { cityName: 'Piraeus', zoneName: 'Athens Metro', isPrimary: true },
    { cityName: 'Thessaloniki', zoneName: 'Thessaloniki Metro', isPrimary: true },
    { cityName: 'Heraklion', zoneName: 'Crete Island', isPrimary: true },
    { cityName: 'Chania', zoneName: 'Crete Island', isPrimary: true },
    { cityName: 'Larissa', zoneName: 'Central Greece', isPrimary: true },
    { cityName: 'Volos', zoneName: 'Central Greece', isPrimary: true },
    { cityName: 'Alexandroupoli', zoneName: 'Northern Greece', isPrimary: true },
    { cityName: 'Kozani', zoneName: 'Northern Greece', isPrimary: true },
  ];

  for (const assignment of cityZoneAssignments) {
    const city = await prisma.city.findFirst({
      where: { name: assignment.cityName },
    });
    
    const zone = createdZones.find(z => z.name === assignment.zoneName);
    
    if (city && zone) {
      await prisma.cityPricingZone.create({
        data: {
          cityId: city.id,
          pricingZoneId: zone.id,
          isDefault: assignment.isPrimary,
          priority: assignment.isPrimary ? 10 : 5,
        },
      });
    }
  }

  console.log('✅ Cities assigned to pricing zones');

  // Get all products for pricing
  const products = await prisma.productCatalog.findMany();

  // Create sample product prices for each zone
  const basePrices: Record<string, { min: number; max: number }> = {
    'WHEAT': { min: 180, max: 220 },
    'CORN': { min: 160, max: 200 },
    'SUNFLOWER': { min: 350, max: 420 },
    'BARLEY': { min: 150, max: 190 },
    'OATS': { min: 140, max: 180 },
    'RAPESEED': { min: 380, max: 450 },
    'PEAS': { min: 200, max: 250 },
    'SOYBEAN_MEAL': { min: 400, max: 480 },
    'WHEAT_BRAN': { min: 120, max: 160 },
    'ALFALFA': { min: 100, max: 140 },
  };

  // Zone price multipliers
  const zoneMultipliers: Record<string, number> = {
    'Sofia Metro': 1.15,
    'Athens Metro': 1.20,
    'Thessaloniki Metro': 1.10,
    'Black Sea Coast BG': 1.05,
    'Crete Island': 1.25,
    'Central Bulgaria': 1.00,
    'Northern Bulgaria': 0.95,
    'Northern Greece': 1.05,
    'Central Greece': 1.00,
  };

  for (const zone of createdZones) {
    const multiplier = zoneMultipliers[zone.name] || 1.0;
    
    for (const product of products) {
      const basePrice = basePrices[product.category] || { min: 100, max: 150 };
      
      await prisma.productPrice.create({
        data: {
          productId: product.id,
          pricingZoneId: zone.id,
          minPrice: basePrice.min * multiplier,
          maxPrice: basePrice.max * multiplier,
          currency: zone.name.includes('BG') || zone.name.includes('Bulgaria') ? 'BGN' : 'EUR',
          confidenceLevel: 0.85,
          dataSource: 'Market Analysis',
          effectiveDate: new Date(),
        },
      });
    }
  }

  console.log('✅ Product prices created for all zones');

  // Create seasonal pricing adjustments
  const seasonalAdjustments = [
    { productCategory: 'WHEAT', season: 'Summer', startMonth: 6, endMonth: 8, multiplier: 0.9 },
    { productCategory: 'WHEAT', season: 'Winter', startMonth: 12, endMonth: 2, multiplier: 1.15 },
    { productCategory: 'CORN', season: 'Fall', startMonth: 9, endMonth: 11, multiplier: 0.85 },
    { productCategory: 'SUNFLOWER', season: 'Summer', startMonth: 7, endMonth: 9, multiplier: 0.95 },
  ];

  for (const adjustment of seasonalAdjustments) {
    const product = products.find(p => p.category === adjustment.productCategory);
    if (product) {
      for (const zone of createdZones) {
        await prisma.seasonalPricing.create({
          data: {
            productId: product.id,
            pricingZoneId: zone.id,
            season: adjustment.season,
            startMonth: adjustment.startMonth,
            endMonth: adjustment.endMonth,
            priceMultiplier: adjustment.multiplier,
          },
        });
      }
    }
  }

  console.log('✅ Seasonal pricing adjustments created');

  // Create sample market conditions
  for (const zone of createdZones) {
    await prisma.marketCondition.create({
      data: {
        pricingZoneId: zone.id,
        date: new Date(),
        supplyLevel: 70, // 70% supply
        demandLevel: 80, // 80% demand
        weatherImpact: 1.0, // normal impact
        notes: 'Current market conditions are stable with good harvest expectations',
      },
    });
  }

  console.log('✅ Market conditions created');

  console.log('🎉 Regional pricing data seeding completed!');
}

seedRegionalPricing()
  .catch((e) => {
    console.error('Error seeding regional pricing data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });