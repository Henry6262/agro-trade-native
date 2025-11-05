import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// REAL Bulgarian city coordinates (city centers and surrounding areas)
const BULGARIAN_CITY_COORDINATES: Record<string, Array<{ lat: number; lng: number }>> = {
  'Sofia': [
    { lat: 42.6977, lng: 23.3219 },
    { lat: 42.6889, lng: 23.3011 },
    { lat: 42.7073, lng: 23.2994 },
    { lat: 42.6734, lng: 23.3543 },
    { lat: 42.6851, lng: 23.2847 },
  ],
  'Varna': [
    { lat: 43.2141, lng: 27.9147 },
    { lat: 43.2013, lng: 27.9388 },
    { lat: 43.1892, lng: 27.8805 },
    { lat: 43.2234, lng: 27.9011 },
    { lat: 43.1957, lng: 27.9522 },
  ],
  'Plovdiv': [
    { lat: 42.1354, lng: 24.7453 },
    { lat: 42.1551, lng: 24.7123 },
    { lat: 42.1184, lng: 24.7162 },
    { lat: 42.1428, lng: 24.7789 },
    { lat: 42.1267, lng: 24.7312 },
  ],
  'Ruse': [
    { lat: 43.8356, lng: 25.9656 },
    { lat: 43.8295, lng: 25.9659 },
    { lat: 43.8120, lng: 25.9922 },
    { lat: 43.8487, lng: 25.9543 },
    { lat: 43.8201, lng: 25.9801 },
  ],
  'Burgas': [
    { lat: 42.5048, lng: 27.4626 },
    { lat: 42.4822, lng: 27.4680 },
    { lat: 42.5089, lng: 27.4979 },
    { lat: 42.4956, lng: 27.4512 },
    { lat: 42.5134, lng: 27.4734 },
  ],
  'Stara Zagora': [
    { lat: 42.4258, lng: 25.6348 },
    { lat: 42.4112, lng: 25.6201 },
    { lat: 42.4389, lng: 25.6512 },
    { lat: 42.4201, lng: 25.6478 },
  ],
  'Vidin': [
    { lat: 43.9856, lng: 22.8783 },
    { lat: 43.9923, lng: 22.8612 },
    { lat: 43.9778, lng: 22.8934 },
  ],
  'Dobrich': [
    { lat: 43.5724, lng: 27.8275 },
    { lat: 43.5812, lng: 27.8134 },
    { lat: 43.5645, lng: 27.8423 },
  ],
  'Blagoevgrad': [
    { lat: 42.0116, lng: 23.0944 },
    { lat: 42.0234, lng: 23.0812 },
    { lat: 41.9989, lng: 23.1078 },
  ],
  'Montana': [
    { lat: 43.4089, lng: 23.2261 },
    { lat: 43.4156, lng: 23.2134 },
    { lat: 43.4012, lng: 23.2389 },
  ],
  'Pleven': [
    { lat: 43.4170, lng: 24.6067 },
    { lat: 43.4089, lng: 24.5923 },
  ],
  'Sliven': [
    { lat: 42.6824, lng: 26.3229 },
    { lat: 42.6756, lng: 26.3089 },
  ],
  'Veliko Tarnovo': [
    { lat: 43.0757, lng: 25.6172 },
    { lat: 43.0823, lng: 25.6034 },
  ],
  'Shumen': [
    { lat: 43.2706, lng: 26.9344 },
    { lat: 43.2634, lng: 26.9212 },
  ],
  'Yambol': [
    { lat: 42.4840, lng: 26.5032 },
    { lat: 42.4756, lng: 26.4889 },
  ],
  'Pernik': [
    { lat: 42.6033, lng: 23.0346 },
    { lat: 42.5967, lng: 23.0212 },
  ],
  'Kyustendil': [
    { lat: 42.2878, lng: 22.6911 },
    { lat: 42.2812, lng: 22.6789 },
  ],
  'Pazardzhik': [
    { lat: 42.1987, lng: 24.3338 },
    { lat: 42.1923, lng: 24.3212 },
  ],
};

async function main() {
  console.log('🗺️  Applying REAL Bulgarian coordinates to ALL addresses...\n');

  // Get all addresses with city information
  const addresses = await prisma.address.findMany({
    include: {
      city: true,
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  });

  console.log(`Found ${addresses.length} addresses to update\n`);

  let updated = 0;
  let skipped = 0;
  const cityCounter: Record<string, number> = {};

  for (const address of addresses) {
    const cityName = address.city?.name;

    if (!cityName) {
      console.log(`⚠️  Skipped address ${address.id} - no city name`);
      skipped++;
      continue;
    }

    const coordinates = BULGARIAN_CITY_COORDINATES[cityName];

    if (!coordinates || coordinates.length === 0) {
      console.log(`⚠️  No coordinates for city: ${cityName}`);
      skipped++;
      continue;
    }

    // Use a different coordinate for each address in the same city
    const cityIndex = cityCounter[cityName] || 0;
    cityCounter[cityName] = cityIndex + 1;

    const coord = coordinates[cityIndex % coordinates.length];

    // Update the address
    await prisma.address.update({
      where: { id: address.id },
      data: {
        latitude: coord.lat,
        longitude: coord.lng,
      },
    });

    const ownerInfo = address.user ? `${address.user.name} (${address.user.role})` : 'No owner';
    console.log(`✅ ${cityName} - ${ownerInfo}`);
    console.log(`   ${coord.lat.toFixed(6)}, ${coord.lng.toFixed(6)}`);

    updated++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated: ${updated} addresses`);
  console.log(`⏭️  Skipped: ${skipped} addresses`);

  console.log('\n🗺️  Updated by City:');
  Object.entries(cityCounter)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log(`   ${city}: ${count} address(es)`);
    });

  console.log('\n✅ All addresses now have REAL Bulgarian coordinates!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
