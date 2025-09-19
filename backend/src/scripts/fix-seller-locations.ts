import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bulgarian cities with realistic coordinates
const bulgarianCities = [
  { name: 'Sofia', lat: 42.6977, lng: 23.3219 },
  { name: 'Plovdiv', lat: 42.1354, lng: 24.7453 },
  { name: 'Varna', lat: 43.2141, lng: 27.9147 },
  { name: 'Burgas', lat: 42.5048, lng: 27.4626 },
  { name: 'Ruse', lat: 43.8356, lng: 25.9657 },
  { name: 'Stara Zagora', lat: 42.4258, lng: 25.6345 },
  { name: 'Pleven', lat: 43.4170, lng: 24.6067 },
  { name: 'Dobrich', lat: 43.5720, lng: 27.8273 },
  { name: 'Sliven', lat: 42.6816, lng: 26.3230 },
  { name: 'Shumen', lat: 43.2710, lng: 26.9361 },
  { name: 'Pernik', lat: 42.6000, lng: 23.0333 },
  { name: 'Haskovo', lat: 41.9340, lng: 25.5556 },
  { name: 'Yambol', lat: 42.4841, lng: 26.5106 },
  { name: 'Pazardzhik', lat: 42.1927, lng: 24.3336 },
  { name: 'Blagoevgrad', lat: 42.0116, lng: 23.0905 },
  { name: 'Veliko Tarnovo', lat: 43.0757, lng: 25.6172 },
  { name: 'Vratsa', lat: 43.2102, lng: 23.5625 },
  { name: 'Gabrovo', lat: 42.8747, lng: 25.3342 },
  { name: 'Vidin', lat: 43.9960, lng: 22.8679 },
  { name: 'Kazanlak', lat: 42.6197, lng: 25.3988 },
];

async function fixSellerLocations() {
  try {
    console.log('🚀 Starting to fix seller locations...');

    // Get all sale listings without address or with address missing location data
    const saleListings = await prisma.saleListing.findMany({
      include: {
        seller: true,
        address: true,
      },
    });

    console.log(`Found ${saleListings.length} sale listings to check`);

    let updatedCount = 0;
    let createdAddressCount = 0;
    
    for (const listing of saleListings) {
      // Check if listing has an address with coordinates
      let needsUpdate = false;
      
      if (!listing.address) {
        // No address at all, create one
        const randomCity = bulgarianCities[Math.floor(Math.random() * bulgarianCities.length)];
        
        // Add small random offset to make locations unique within the city
        const lat = randomCity.lat + (Math.random() - 0.5) * 0.1;
        const lng = randomCity.lng + (Math.random() - 0.5) * 0.1;
        
        const newAddress = await prisma.address.create({
          data: {
            userId: listing.sellerId,
            addressType: 'WAREHOUSE',
            street: `${randomCity.name} Region`,
            country: 'Bulgaria',
            latitude: lat,
            longitude: lng,
            isDefault: true,
          },
        });
        
        // Update the sale listing to reference this address
        await prisma.saleListing.update({
          where: { id: listing.id },
          data: {
            addressId: newAddress.id,
          },
        });
        
        createdAddressCount++;
        console.log(`✅ Created address for listing ${listing.id}: ${randomCity.name} (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      } else if (!listing.address.latitude || !listing.address.longitude) {
        // Has address but no coordinates
        const randomCity = bulgarianCities[Math.floor(Math.random() * bulgarianCities.length)];
        
        // Add small random offset to make locations unique within the city
        const lat = randomCity.lat + (Math.random() - 0.5) * 0.1;
        const lng = randomCity.lng + (Math.random() - 0.5) * 0.1;
        
        await prisma.address.update({
          where: { id: listing.address.id },
          data: {
            latitude: lat,
            longitude: lng,
            street: `${randomCity.name} Region`,
            country: 'Bulgaria',
          },
        });
        
        updatedCount++;
        console.log(`✅ Updated address for listing ${listing.id}: ${randomCity.name} (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      } else {
        // Has address with coordinates, ensure city name is in street field for display
        const nearestCity = findNearestCity(listing.address.latitude, listing.address.longitude);
        
        if (!listing.address.street || !listing.address.street.includes('Region')) {
          await prisma.address.update({
            where: { id: listing.address.id },
            data: {
              street: `${nearestCity.name} Region`,
            },
          });
          
          updatedCount++;
          console.log(`✅ Updated city name for listing ${listing.id}: ${nearestCity.name}`);
        }
      }
    }

    // Also ensure all users who are sellers have at least one address
    const sellersWithoutAddresses = await prisma.user.findMany({
      where: {
        role: 'FARMER',
        addresses: {
          none: {},
        },
      },
    });
    
    for (const seller of sellersWithoutAddresses) {
      const randomCity = bulgarianCities[Math.floor(Math.random() * bulgarianCities.length)];
      const lat = randomCity.lat + (Math.random() - 0.5) * 0.1;
      const lng = randomCity.lng + (Math.random() - 0.5) * 0.1;
      
      await prisma.address.create({
        data: {
          userId: seller.id,
          addressType: 'WAREHOUSE',
          street: `${randomCity.name} Region`,
          country: 'Bulgaria',
          latitude: lat,
          longitude: lng,
          isDefault: true,
        },
      });
      
      createdAddressCount++;
      console.log(`✅ Created default address for seller ${seller.name}: ${randomCity.name}`);
    }

    console.log(`\n✅ Successfully updated ${updatedCount} addresses`);
    console.log(`✅ Created ${createdAddressCount} new addresses`);
    console.log('🎉 Location fix complete!');

  } catch (error) {
    console.error('❌ Error fixing seller locations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function findNearestCity(lat: number, lng: number) {
  let nearestCity = bulgarianCities[0];
  let minDistance = calculateDistance(lat, lng, nearestCity.lat, nearestCity.lng);

  for (const city of bulgarianCities) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }

  return nearestCity;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Simple Euclidean distance (good enough for finding nearest city)
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  return Math.sqrt(dLat * dLat + dLng * dLng);
}

// Run the script
if (require.main === module) {
  fixSellerLocations()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { fixSellerLocations };