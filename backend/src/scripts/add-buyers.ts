import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function addBuyers() {
  console.log('🛒 Adding buyers to the database...');
  
  try {
    // Check existing buyers
    const existingBuyers = await prisma.user.count({
      where: { role: UserRole.BUYER }
    });
    
    console.log(`Found ${existingBuyers} existing buyers`);
    
    // Add new buyers with complete profiles
    const buyersToAdd = [
      {
        email: 'sofia.foods@example.com',
        name: 'Sofia Foods Ltd',
        role: UserRole.BUYER,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'buyer123', // Default password
      },
      {
        email: 'varna.wholesale@example.com',
        name: 'Varna Wholesale Market',
        role: UserRole.BUYER,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'buyer123',
      },
      {
        email: 'plovdiv.grains@example.com',
        name: 'Plovdiv Grain Traders',
        role: UserRole.BUYER,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'buyer123',
      },
      {
        email: 'burgas.export@example.com',
        name: 'Burgas Export Co',
        role: UserRole.BUYER,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'buyer123',
      },
      {
        email: 'ruse.processors@example.com',
        name: 'Ruse Food Processors',
        role: UserRole.BUYER,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'buyer123',
      },
      {
        email: 'stara.zagora.coop@example.com',
        name: 'Stara Zagora Cooperative',
        role: UserRole.BUYER,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'buyer123',
      },
      {
        email: 'pleven.mills@example.com',
        name: 'Pleven Mills Group',
        role: UserRole.BUYER,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'buyer123',
      },
      {
        email: 'dobrich.agro@example.com',
        name: 'Dobrich Agro Trading',
        role: UserRole.BUYER,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'buyer123',
      }
    ];
    
    console.log(`\nAdding ${buyersToAdd.length} new buyers...`);
    
    const createdBuyers = [];
    for (const buyerData of buyersToAdd) {
      // Check if buyer already exists
      const existing = await prisma.user.findUnique({
        where: { email: buyerData.email }
      });
      
      if (!existing) {
        const buyer = await prisma.user.create({
          data: buyerData
        });
        createdBuyers.push(buyer);
        console.log(`✅ Created buyer: ${buyer.name}`);
      } else {
        console.log(`⏭️  Skipping existing buyer: ${buyerData.name}`);
      }
    }
    
    // Verify total buyers
    const totalBuyers = await prisma.user.count({
      where: { role: UserRole.BUYER }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`  - Created ${createdBuyers.length} new buyers`);
    console.log(`  - Total buyers in database: ${totalBuyers}`);
    
    // List all buyers
    const allBuyers = await prisma.user.findMany({
      where: { role: UserRole.BUYER },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });
    
    console.log('\n📋 All buyers:');
    allBuyers.forEach((buyer, index) => {
      console.log(`  ${index + 1}. ${buyer.name} (${buyer.email})`);
      console.log(`     ID: ${buyer.id}`);
    });
    
    console.log('\n✅ Buyers added successfully!');
    console.log('You should now be able to create trade operations.');
    
  } catch (error) {
    console.error('❌ Error adding buyers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addBuyers()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });