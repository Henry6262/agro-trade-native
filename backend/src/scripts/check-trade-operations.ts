import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking trade operations...\n');

  // Check if there's already a trade operation for this buy listing
  const buyListingId = 'cmfeaupll000312r3bznjshr0';
  
  const existingTrade = await prisma.tradeOperation.findFirst({
    where: { buyListingId },
  });

  if (existingTrade) {
    console.log('❌ Trade operation already exists for this buy listing!');
    console.log('Trade ID:', existingTrade.id);
    console.log('Created at:', existingTrade.createdAt);
    
    // Delete it for testing
    console.log('\nDeleting existing trade operation...');
    await prisma.tradeOperation.delete({
      where: { id: existingTrade.id },
    });
    console.log('✅ Deleted!');
  } else {
    console.log('✅ No existing trade operation for this buy listing');
  }

  // Check if the buy listing exists
  const buyListing = await prisma.buyListing.findUnique({
    where: { id: buyListingId },
    include: { buyer: true, product: true },
  });

  if (buyListing) {
    console.log('\n✅ Buy listing exists:');
    console.log('  Buyer:', buyListing.buyer.name);
    console.log('  Product:', buyListing.product.name);
    console.log('  Quantity:', buyListing.quantity);
    console.log('  Max Price:', buyListing.maxPricePerUnit);
  } else {
    console.log('\n❌ Buy listing not found!');
  }

  // Check if admin user exists
  const adminId = 'cmf9sq8bt00015nqs3zb1vn6m';
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (admin) {
    console.log('\n✅ Admin user exists:', admin.name || admin.email);
  } else {
    console.log('\n❌ Admin user not found!');
    
    // Get first admin
    const firstAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    
    if (firstAdmin) {
      console.log('First admin ID:', firstAdmin.id);
      console.log('First admin name:', firstAdmin.name || firstAdmin.email);
    }
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });