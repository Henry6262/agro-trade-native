import { PrismaClient, AddressType } from '@prisma/client';

const prisma = new PrismaClient();

type Coordinate = {
  latitude: number;
  longitude: number;
};

type AddressCoordinateSet = {
  addressId: string;
  addressType: AddressType;
  street: string;
  postalCode: string;
  country: string;
  cityName: string;
  coordinates: Coordinate[];
};

const ADDRESS_COORDINATES: AddressCoordinateSet[] = [
  {
    addressId: 'cmgxfth9w001e123lefl26aa6',
    addressType: AddressType.WAREHOUSE,
    street: 'Industrial Complex 92',
    postalCode: '8245',
    country: 'Bulgaria',
    cityName: 'Sofia',
    coordinates: [
      { latitude: 42.697708, longitude: 23.321868 },
      { latitude: 42.689882, longitude: 23.301171 },
      { latitude: 42.67342, longitude: 23.299833 },
    ],
  },
  {
    addressId: 'cmgxftha5001p123lfenn2edl',
    addressType: AddressType.WAREHOUSE,
    street: 'Industrial Complex 76',
    postalCode: '3257',
    country: 'Bulgaria',
    cityName: 'Varna',
    coordinates: [
      { latitude: 43.21405, longitude: 27.914734 },
      { latitude: 43.201297, longitude: 27.938801 },
      { latitude: 43.189247, longitude: 27.8805 },
    ],
  },
  {
    addressId: 'cmgxftha8001w123lzs5a0xoc',
    addressType: AddressType.WAREHOUSE,
    street: 'Industrial Complex 60',
    postalCode: '1758',
    country: 'Bulgaria',
    cityName: 'Plovdiv',
    coordinates: [
      { latitude: 42.135407, longitude: 24.74529 },
      { latitude: 42.155107, longitude: 24.712338 },
      { latitude: 42.118402, longitude: 24.716216 },
    ],
  },
  {
    addressId: 'cmgxfthac0027123lk40m7df1',
    addressType: AddressType.WAREHOUSE,
    street: 'Industrial Complex 45',
    postalCode: '2411',
    country: 'Bulgaria',
    cityName: 'Ruse',
    coordinates: [
      { latitude: 43.835571, longitude: 25.965655 },
      { latitude: 43.829528, longitude: 25.96588 },
      { latitude: 43.812028, longitude: 25.992246 },
    ],
  },
  {
    addressId: 'cmgxfthaf002g123lqv4wm7bt',
    addressType: AddressType.WAREHOUSE,
    street: 'Industrial Complex 35',
    postalCode: '3596',
    country: 'Bulgaria',
    cityName: 'Burgas',
    coordinates: [
      { latitude: 42.504793, longitude: 27.462636 },
      { latitude: 42.482205, longitude: 27.46803 },
      { latitude: 42.508937, longitude: 27.497897 },
    ],
  }
  // (Trimmed dataset; add more entries as needed)
];

async function applyCoordinates() {
  let index = 0;
  const summary = { updated: 0, missing: 0 };

  for (const entry of ADDRESS_COORDINATES) {
    const address = await prisma.address.findUnique({ where: { id: entry.addressId } });
    if (!address) {
      summary.missing += 1;
      console.warn(`⚠️ Address ${entry.addressId} (${entry.cityName}) not found - skipping`);
      continue;
    }

    const coordinate = entry.coordinates[index % entry.coordinates.length];
    index += 1;

    await prisma.address.update({
      where: { id: entry.addressId },
      data: {
        addressType: entry.addressType,
        street: entry.street,
        postalCode: entry.postalCode,
        country: entry.country,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      },
    });

    summary.updated += 1;
    console.log(`✅ ${entry.addressId} (${entry.cityName}) -> ${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`);
  }

  console.log('Summary:', summary);
}

applyCoordinates()
  .catch((error) => {
    console.error('❌ Failed to apply address coordinates:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
