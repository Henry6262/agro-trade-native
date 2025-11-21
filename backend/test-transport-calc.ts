import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Testing transport calculation with real data...\n');

  // Get a buyer with coordinates
  const buyListing = await prisma.buyListing.findFirst({
    where: {
      deliveryAddress: {
        latitude: { not: null },
        longitude: { not: null },
      },
    },
    include: {
      deliveryAddress: true,
      buyer: { select: { name: true } },
      product: { select: { name: true } },
    },
  });

  if (!buyListing || !buyListing.deliveryAddress) {
    console.log('❌ No buy listing with coordinates found');
    return;
  }

  console.log('📦 Selected Buyer:');
  console.log(`   Name: ${buyListing.buyer.name}`);
  console.log(`   Product: ${buyListing.product.name}`);
  console.log(`   Quantity: ${buyListing.quantity} ${buyListing.unit}`);
  console.log(`   Location: ${buyListing.deliveryAddress.cityId} (${buyListing.deliveryAddress.latitude}, ${buyListing.deliveryAddress.longitude})\n`);

  // Get matching sellers with the same product
  const saleListings = await prisma.saleListing.findMany({
    where: {
      productId: buyListing.productId,
      address: {
        latitude: { not: null },
        longitude: { not: null },
      },
    },
    take: 5,
    include: {
      address: true,
      seller: { select: { name: true } },
      product: { select: { name: true } },
    },
  });

  console.log(`🌾 Found ${saleListings.length} matching sellers with coordinates:\n`);

  // Calculate distance and transport cost manually (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const buyerLat = Number(buyListing.deliveryAddress.latitude);
  const buyerLon = Number(buyListing.deliveryAddress.longitude);

  saleListings.forEach((sale, index) => {
    if (sale.address) {
      const sellerLat = Number(sale.address.latitude);
      const sellerLon = Number(sale.address.longitude);
      const distance = calculateDistance(buyerLat, buyerLon, sellerLat, sellerLon);
      const transportCost = distance * 0.15; // €0.15 per km

      console.log(`${index + 1}. ${sale.seller.name}`);
      console.log(`   Location: ${sale.address.cityId} (${sale.address.latitude}, ${sale.address.longitude})`);
      console.log(`   Quantity: ${sale.quantity} ${sale.unit}`);
      console.log(`   Asking Price: ${sale.askingPrice ? `€${sale.askingPrice}/unit` : 'Not set'}`);
      console.log(`   Distance: ${distance.toFixed(2)} km`);
      console.log(`   Transport Cost: €${transportCost.toFixed(2)}\n`);
    }
  });

  console.log('✅ Transport calculation data is ready!');
  console.log('\n📋 API Test Payload:');
  console.log(JSON.stringify({
    sellerIds: saleListings.map(s => s.sellerId),
    buyerAddressId: buyListing.deliveryAddressId,
  }, null, 2));
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
