import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ensurePricing() {
  console.log('🔍 Checking and ensuring pricing data...');

  // Check if we have pricing zones
  const zones = await prisma.pricingZone.findMany();
  
  if (zones.length === 0) {
    console.log('📦 Creating pricing zones...');
    
    const pricingZones = [
      // Bulgarian zones
      { name: 'Sofia Metro', description: 'Sofia and surrounding areas', color: '#FF6B6B' },
      { name: 'Black Sea Coast BG', description: 'Varna, Burgas and coastal areas', color: '#4ECDC4' },
      { name: 'Central Bulgaria', description: 'Plovdiv, Stara Zagora, Veliko Tarnovo', color: '#45B7D1' },
      { name: 'Northern Bulgaria', description: 'Ruse, Pleven and northern regions', color: '#96CEB4' },
    ];
    
    for (const zoneData of pricingZones) {
      await prisma.pricingZone.create({
        data: zoneData,
      });
    }
    console.log('✅ Pricing zones created');
  } else {
    console.log(`✅ Found ${zones.length} pricing zones`);
  }

  // Check if we have products
  const products = await prisma.productCatalog.findMany();
  
  if (products.length === 0) {
    console.log('⚠️  No products found. Please run npm run prisma:seed-catalog first');
    return;
  }
  
  console.log(`✅ Found ${products.length} products`);

  // Check and create product prices for each zone
  const zonesAgain = await prisma.pricingZone.findMany();
  
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
    'OTHER': { min: 150, max: 200 },
  };

  // Zone price multipliers
  const zoneMultipliers: Record<string, number> = {
    'Sofia Metro': 1.15,
    'Black Sea Coast BG': 1.05,
    'Central Bulgaria': 1.00,
    'Northern Bulgaria': 0.95,
  };

  let pricesCreated = 0;
  
  for (const zone of zonesAgain) {
    const multiplier = zoneMultipliers[zone.name] || 1.0;
    
    for (const product of products) {
      // Check if price already exists
      const existingPrice = await prisma.productPrice.findFirst({
        where: {
          productId: product.id,
          pricingZoneId: zone.id,
        },
      });
      
      if (!existingPrice) {
        const basePrice = basePrices[product.category] || { min: 100, max: 150 };
        
        await prisma.productPrice.create({
          data: {
            productId: product.id,
            pricingZoneId: zone.id,
            minPrice: basePrice.min * multiplier,
            maxPrice: basePrice.max * multiplier,
            currency: 'EUR',
            confidenceLevel: 0.85,
            dataSource: 'Market Analysis',
            effectiveDate: new Date(),
          },
        });
        pricesCreated++;
      }
    }
  }
  
  if (pricesCreated > 0) {
    console.log(`✅ Created ${pricesCreated} product prices`);
  } else {
    console.log('✅ All product prices already exist');
  }

  // Create cities for Sofia if they don't exist
  const bulgaria = await prisma.country.findUnique({
    where: { code: 'BG' },
  });
  
  if (!bulgaria) {
    const bg = await prisma.country.create({
      data: {
        name: 'Bulgaria',
        code: 'BG',
        flagEmoji: '🇧🇬',
        currencyCode: 'BGN',
        isActive: true,
      },
    });
    
    // Create main Bulgarian cities
    const cities = [
      { name: 'Sofia', latitude: 42.6977, longitude: 23.3219 },
      { name: 'Plovdiv', latitude: 42.1354, longitude: 24.7453 },
      { name: 'Varna', latitude: 43.2141, longitude: 27.9147 },
      { name: 'Burgas', latitude: 42.5048, longitude: 27.4626 },
      { name: 'Ruse', latitude: 43.8356, longitude: 25.9657 },
      { name: 'Stara Zagora', latitude: 42.4258, longitude: 25.6345 },
      { name: 'Pleven', latitude: 43.4170, longitude: 24.6067 },
      { name: 'Veliko Tarnovo', latitude: 43.0757, longitude: 25.6172 },
    ];
    
    for (const cityData of cities) {
      const region = await prisma.region.findFirst({
        where: {
          countryId: bg.id,
        },
      }) || await prisma.region.create({
        data: {
          name: 'All Bulgaria',
          countryId: bg.id,
        },
      });
      
      const city = await prisma.city.create({
        data: {
          ...cityData,
          regionId: region.id,
          isActive: true,
        },
      });
      
      // Assign to appropriate zone
      let zoneName = 'Central Bulgaria';
      if (cityData.name === 'Sofia') zoneName = 'Sofia Metro';
      else if (cityData.name === 'Varna' || cityData.name === 'Burgas') zoneName = 'Black Sea Coast BG';
      else if (cityData.name === 'Ruse' || cityData.name === 'Pleven') zoneName = 'Northern Bulgaria';
      
      const zone = await prisma.pricingZone.findUnique({
        where: { name: zoneName },
      });
      
      if (zone) {
        await prisma.cityPricingZone.create({
          data: {
            cityId: city.id,
            pricingZoneId: zone.id,
            isDefault: true,
            priority: 10,
          },
        }).catch(() => {
          // Already exists
        });
      }
    }
    
    console.log('✅ Created Bulgarian cities');
  } else {
    console.log('✅ Country and cities already exist');
  }
  
  console.log('🎉 Pricing data check complete!');
  
  // Show sample prices
  const samplePrices = await prisma.productPrice.findMany({
    take: 5,
    include: {
      product: true,
      pricingZone: true,
    },
  });
  
  console.log('\n📊 Sample prices:');
  for (const price of samplePrices) {
    console.log(`  ${price.product.displayName} in ${price.pricingZone.name}: €${price.minPrice}-€${price.maxPrice}`);
  }
}

ensurePricing()
  .catch((e) => {
    console.error('Error ensuring pricing data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });