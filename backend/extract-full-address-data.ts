import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('📍 Extracting FULL address data from database...\n');

  // Get all addresses with full relations
  const addresses = await prisma.address.findMany({
    include: {
      user: {
        include: {
          company: true,
        },
      },
      company: true,
      city: true, // This will give us the actual city name
      buyListings: {
        include: {
          product: true,
          buyer: {
            include: {
              company: true,
            },
          },
        },
      },
      saleListings: {
        include: {
          product: true,
          seller: {
            include: {
              company: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${addresses.length} addresses in database\n`);

  // Format for geocoding
  const geocodingData = addresses.map((address) => {
    const owner = address.user;
    const cityName = address.city?.name || 'Unknown City';
    const regionName = address.city?.region || 'Unknown Region';

    return {
      // Address Information
      addressId: address.id,
      addressType: address.addressType,

      // Location Details
      street: address.street,
      cityId: address.cityId,
      cityName: cityName,
      regionName: regionName,
      postalCode: address.postalCode,
      country: address.country,

      // Current Coordinates (from DB)
      currentLatitude: address.latitude ? Number(address.latitude) : null,
      currentLongitude: address.longitude ? Number(address.longitude) : null,

      // Owner Information
      ownerUserId: owner?.id,
      ownerName: owner?.name,
      ownerEmail: owner?.email,
      ownerRole: owner?.role,
      ownerCompany: owner?.company?.legalName,

      // Related Listings
      buyListings: address.buyListings.map((listing) => ({
        listingId: listing.id,
        buyerName: listing.buyer?.name,
        buyerCompany: listing.buyer?.company?.legalName,
        product: listing.product?.name,
        quantity: listing.quantity.toString(),
        unit: listing.unit,
        status: listing.status,
      })),

      saleListings: address.saleListings.map((listing) => ({
        listingId: listing.id,
        sellerName: listing.seller?.name,
        sellerCompany: listing.seller?.company?.legalName,
        product: listing.product?.name,
        quantity: listing.quantity.toString(),
        unit: listing.unit,
        askingPrice: listing.askingPrice ? listing.askingPrice.toString() : null,
        status: listing.status,
      })),

      // Fields for you to fill in:
      newLatitude: null,
      newLongitude: null,
      notes: '', // Add any notes about this address
    };
  });

  // Write to file
  const outputPath = './full-address-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(geocodingData, null, 2));

  console.log(`✅ Extracted full address data`);
  console.log(`📁 File: ${outputPath}\n`);

  // Summary by type
  const byType = addresses.reduce((acc, addr) => {
    acc[addr.addressType] = (acc[addr.addressType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📊 Summary:');
  console.log(`   Total Addresses: ${addresses.length}`);
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  // Summary by city
  const byCity = addresses.reduce((acc, addr) => {
    const city = addr.city?.name || 'Unknown';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n📍 By City:');
  Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .forEach(([city, count]) => {
      console.log(`   ${city}: ${count}`);
    });

  console.log('\n📝 Next Steps:');
  console.log('   1. Open full-address-data.json');
  console.log('   2. For each address, fill in newLatitude and newLongitude');
  console.log('   3. You can see the full city name, region, and who owns it');
  console.log('   4. Save as addresses-with-geocoding.json');
  console.log('   5. Run: npx tsx update-addresses-with-geocoding.ts');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
