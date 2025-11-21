import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking database coordinate status...\n');

  // Check buy listings
  const buyListings = await prisma.buyListing.findMany({
    include: {
      deliveryAddress: true,
      buyer: {
        select: {
          name: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log('📦 BUY LISTINGS STATUS:');
  console.log(`Total: ${buyListings.length}`);

  const buyListingsWithCoordinates = buyListings.filter(
    (bl) =>
      bl.deliveryAddress &&
      bl.deliveryAddress.latitude != null &&
      bl.deliveryAddress.longitude != null
  );

  const buyListingsWithoutCoordinates = buyListings.filter(
    (bl) =>
      !bl.deliveryAddress ||
      bl.deliveryAddress.latitude == null ||
      bl.deliveryAddress.longitude == null
  );

  console.log(`✅ With coordinates: ${buyListingsWithCoordinates.length}`);
  console.log(`❌ Without coordinates: ${buyListingsWithoutCoordinates.length}\n`);

  if (buyListingsWithoutCoordinates.length > 0) {
    console.log('Buy listings WITHOUT coordinates:');
    buyListingsWithoutCoordinates.forEach((bl) => {
      console.log(
        `  - ${bl.buyer.name} | ${bl.product.name} | ${bl.quantity} ${bl.unit} | Address: ${bl.deliveryAddress ? 'exists but no lat/lng' : 'NO ADDRESS'}`
      );
    });
    console.log('');
  }

  // Check sale listings
  const saleListings = await prisma.saleListing.findMany({
    include: {
      address: true,
      seller: {
        select: {
          name: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log('🌾 SALE LISTINGS STATUS:');
  console.log(`Total: ${saleListings.length}`);

  const saleListingsWithCoordinates = saleListings.filter(
    (sl) =>
      sl.address &&
      sl.address.latitude != null &&
      sl.address.longitude != null
  );

  const saleListingsWithoutCoordinates = saleListings.filter(
    (sl) =>
      !sl.address ||
      sl.address.latitude == null ||
      sl.address.longitude == null
  );

  console.log(`✅ With coordinates: ${saleListingsWithCoordinates.length}`);
  console.log(`❌ Without coordinates: ${saleListingsWithoutCoordinates.length}\n`);

  if (saleListingsWithoutCoordinates.length > 0) {
    console.log('Sale listings WITHOUT coordinates:');
    saleListingsWithoutCoordinates.forEach((sl) => {
      console.log(
        `  - ${sl.seller.name} | ${sl.product.name} | ${sl.quantity} ${sl.unit} | ${sl.askingPrice ? `€${sl.askingPrice}/unit` : 'No price'} | Address: ${sl.address ? 'exists but no lat/lng' : 'NO ADDRESS'}`
      );
    });
    console.log('');
  }

  // Summary
  console.log('📊 SUMMARY:');
  console.log(`Buy listings ready for transport calc: ${buyListingsWithCoordinates.length}/${buyListings.length}`);
  console.log(`Sale listings ready for transport calc: ${saleListingsWithCoordinates.length}/${saleListings.length}`);

  if (buyListingsWithoutCoordinates.length === 0 && saleListingsWithoutCoordinates.length === 0) {
    console.log('\n✅ All listings have coordinates! Transport calculation should work.');
  } else {
    console.log('\n⚠️  Some listings are missing coordinates. Options:');
    console.log('   1. Run update script to add coordinates to existing listings');
    console.log('   2. Delete all listings and re-seed with seed-demo-data.ts');
    console.log('   3. Manually add coordinates through admin UI');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
