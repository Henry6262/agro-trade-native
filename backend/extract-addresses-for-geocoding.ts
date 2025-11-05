import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('📍 Extracting addresses for geocoding...\n');

  // Get all buyers with their listings and addresses
  const buyers = await prisma.user.findMany({
    where: {
      role: 'BUYER',
    },
    include: {
      company: true,
      addresses: true,
      buyListings: {
        include: {
          deliveryAddress: true,
          product: true,
        },
      },
    },
  });

  // Get all sellers with their listings and addresses
  const sellers = await prisma.user.findMany({
    where: {
      role: 'FARMER',
    },
    include: {
      company: true,
      addresses: true,
      saleListings: {
        include: {
          address: true,
          product: true,
        },
      },
    },
  });

  // Format data for geocoding
  const geocodingData = {
    buyers: buyers.map((buyer) => ({
      userId: buyer.id,
      name: buyer.name,
      companyName: buyer.company?.legalName || null,
      email: buyer.email,
      buyListings: buyer.buyListings.map((listing) => ({
        listingId: listing.id,
        product: listing.product?.name,
        quantity: listing.quantity,
        unit: listing.unit,
        addressId: listing.deliveryAddressId,
        currentAddress: listing.deliveryAddress
          ? {
              street: listing.deliveryAddress.street,
              city: listing.deliveryAddress.cityId,
              postalCode: listing.deliveryAddress.postalCode,
              country: listing.deliveryAddress.country,
              currentLat: listing.deliveryAddress.latitude,
              currentLng: listing.deliveryAddress.longitude,
            }
          : null,
        // Fill these in with real coordinates:
        newLatitude: null,
        newLongitude: null,
      })),
      addresses: buyer.addresses.map((addr) => ({
        addressId: addr.id,
        type: addr.addressType,
        street: addr.street,
        city: addr.cityId,
        postalCode: addr.postalCode,
        country: addr.country,
        currentLat: addr.latitude,
        currentLng: addr.longitude,
        // Fill these in with real coordinates:
        newLatitude: null,
        newLongitude: null,
      })),
    })),
    sellers: sellers.map((seller) => ({
      userId: seller.id,
      name: seller.name,
      companyName: seller.company?.legalName || null,
      email: seller.email,
      saleListings: seller.saleListings.map((listing) => ({
        listingId: listing.id,
        product: listing.product?.name,
        quantity: listing.quantity,
        unit: listing.unit,
        addressId: listing.addressId,
        currentAddress: listing.address
          ? {
              street: listing.address.street,
              city: listing.address.cityId,
              postalCode: listing.address.postalCode,
              country: listing.address.country,
              currentLat: listing.address.latitude,
              currentLng: listing.address.longitude,
            }
          : null,
        // Fill these in with real coordinates:
        newLatitude: null,
        newLongitude: null,
      })),
      addresses: seller.addresses.map((addr) => ({
        addressId: addr.id,
        type: addr.addressType,
        street: addr.street,
        city: addr.cityId,
        postalCode: addr.postalCode,
        country: addr.country,
        currentLat: addr.latitude,
        currentLng: addr.longitude,
        // Fill these in with real coordinates:
        newLatitude: null,
        newLongitude: null,
      })),
    })),
  };

  // Write to file
  const outputPath = './addresses-for-geocoding.json';
  fs.writeFileSync(outputPath, JSON.stringify(geocodingData, null, 2));

  console.log(`✅ Extracted data for geocoding`);
  console.log(`📁 File: ${outputPath}\n`);

  console.log('📊 Summary:');
  console.log(`   Buyers: ${buyers.length}`);
  console.log(`   Buyer Listings: ${buyers.reduce((sum, b) => sum + b.buyListings.length, 0)}`);
  console.log(`   Sellers: ${sellers.length}`);
  console.log(`   Seller Listings: ${sellers.reduce((sum, s) => sum + s.saleListings.length, 0)}`);
  console.log(`   Total Addresses: ${buyers.reduce((sum, b) => sum + b.addresses.length, 0) + sellers.reduce((sum, s) => sum + s.addresses.length, 0)}\n`);

  console.log('📝 Instructions:');
  console.log('   1. Open addresses-for-geocoding.json');
  console.log('   2. For each address, fill in newLatitude and newLongitude with real coordinates');
  console.log('   3. Save the file as addresses-with-geocoding.json');
  console.log('   4. Run the update script to apply the new coordinates');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
