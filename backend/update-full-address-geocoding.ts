import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating addresses with new geocoded coordinates...\n');

  // Read the geocoded data
  const inputPath = './addresses-with-geocoding.json';

  if (!fs.existsSync(inputPath)) {
    console.error('❌ File not found: addresses-with-geocoding.json');
    console.log('📝 Instructions:');
    console.log('   1. Copy full-address-data.json to addresses-with-geocoding.json');
    console.log('   2. Fill in newLatitude and newLongitude for each address');
    console.log('   3. Run this script again');
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  let updatedCount = 0;
  let skippedCount = 0;
  const updates: Array<{ address: string; city: string; oldCoords: string; newCoords: string }> = [];

  console.log('📍 Processing addresses...\n');

  for (const addr of addresses) {
    if (addr.newLatitude !== null && addr.newLongitude !== null) {
      // Update the address in database
      await prisma.address.update({
        where: { id: addr.addressId },
        data: {
          latitude: addr.newLatitude,
          longitude: addr.newLongitude,
        },
      });

      const oldCoords = `(${addr.currentLatitude?.toFixed(4)}, ${addr.currentLongitude?.toFixed(4)})`;
      const newCoords = `(${addr.newLatitude.toFixed(4)}, ${addr.newLongitude.toFixed(4)})`;

      updates.push({
        address: `${addr.street}, ${addr.cityName}`,
        city: addr.cityName,
        oldCoords,
        newCoords,
      });

      console.log(`✅ ${addr.cityName} - ${addr.ownerName}`);
      console.log(`   ${oldCoords} → ${newCoords}`);
      updatedCount++;
    } else {
      console.log(`⏭️  Skipped: ${addr.cityName} - ${addr.ownerName} (no new coordinates)`);
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 UPDATE SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Updated: ${updatedCount} addresses`);
  console.log(`⏭️  Skipped: ${skippedCount} addresses`);

  if (updatedCount > 0) {
    console.log('\n🎯 Updated Cities:');
    const cityCounts = updates.reduce((acc, u) => {
      acc[u.city] = (acc[u.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([city, count]) => {
        console.log(`   ${city}: ${count} address(es)`);
      });
  }

  console.log('\n✅ Database updated successfully!');
  console.log('\n📝 Next steps:');
  console.log('   - Run: npx tsx check-coordinates.ts (verify all addresses have coordinates)');
  console.log('   - Test the admin dashboard to see transport costs appear');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
