import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating addresses with new coordinates...\n');

  // Read the geocoded data
  const inputPath = './addresses-with-geocoding.json';

  if (!fs.existsSync(inputPath)) {
    console.error('❌ File not found: addresses-with-geocoding.json');
    console.log('Please save your geocoded data as addresses-with-geocoding.json');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  let updatedCount = 0;
  let skippedCount = 0;

  // Update buyer addresses
  console.log('📦 Updating buyer addresses...');
  for (const buyer of data.buyers) {
    for (const address of buyer.addresses) {
      if (address.newLatitude !== null && address.newLongitude !== null) {
        await prisma.address.update({
          where: { id: address.addressId },
          data: {
            latitude: address.newLatitude,
            longitude: address.newLongitude,
          },
        });
        console.log(`   ✅ Updated address ${address.addressId} for ${buyer.name}`);
        updatedCount++;
      } else {
        console.log(`   ⏭️  Skipped address ${address.addressId} (no new coordinates)`);
        skippedCount++;
      }
    }
  }

  // Update seller addresses
  console.log('\n🌾 Updating seller addresses...');
  for (const seller of data.sellers) {
    for (const address of seller.addresses) {
      if (address.newLatitude !== null && address.newLongitude !== null) {
        await prisma.address.update({
          where: { id: address.addressId },
          data: {
            latitude: address.newLatitude,
            longitude: address.newLongitude,
          },
        });
        console.log(`   ✅ Updated address ${address.addressId} for ${seller.name}`);
        updatedCount++;
      } else {
        console.log(`   ⏭️  Skipped address ${address.addressId} (no new coordinates)`);
        skippedCount++;
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log('\n✅ Database updated successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
