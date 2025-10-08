import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function addInspectors() {
  console.log('👮 Adding inspectors to the database...');
  
  try {
    // Check existing inspectors
    const existingInspectors = await prisma.user.count({
      where: { role: UserRole.INSPECTOR }
    });
    
    console.log(`Found ${existingInspectors} existing inspectors`);
    
    // Add new inspectors with complete profiles
    const inspectorsToAdd = [
      {
        email: 'inspector1@agrotrade.com',
        name: 'Inspector Sofia Region',
        role: UserRole.INSPECTOR,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'inspector123',
      },
      {
        email: 'inspector2@agrotrade.com',
        name: 'Inspector Plovdiv Region',
        role: UserRole.INSPECTOR,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'inspector123',
      },
      {
        email: 'inspector3@agrotrade.com',
        name: 'Inspector Varna Region',
        role: UserRole.INSPECTOR,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'inspector123',
      },
      {
        email: 'inspector4@agrotrade.com',
        name: 'Inspector Burgas Region',
        role: UserRole.INSPECTOR,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'inspector123',
      },
      {
        email: 'inspector5@agrotrade.com',
        name: 'Inspector Ruse Region',
        role: UserRole.INSPECTOR,
        isEmailVerified: true,
        onboardingCompleted: true,
        password: 'inspector123',
      },
    ];
    
    console.log(`\nAdding ${inspectorsToAdd.length} new inspectors...`);
    
    const createdInspectors = [];
    for (const inspectorData of inspectorsToAdd) {
      // Check if inspector already exists
      const existing = await prisma.user.findUnique({
        where: { email: inspectorData.email }
      });
      
      if (!existing) {
        const inspector = await prisma.user.create({
          data: inspectorData
        });
        createdInspectors.push(inspector);
        console.log(`✅ Created inspector: ${inspector.name}`);
      } else {
        console.log(`⏭️  Skipping existing inspector: ${inspectorData.name}`);
      }
    }
    
    // Verify total inspectors
    const totalInspectors = await prisma.user.count({
      where: { role: UserRole.INSPECTOR }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`  - Created ${createdInspectors.length} new inspectors`);
    console.log(`  - Total inspectors in database: ${totalInspectors}`);
    
    // List all inspectors
    const allInspectors = await prisma.user.findMany({
      where: { role: UserRole.INSPECTOR },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });
    
    console.log('\n📋 All inspectors:');
    allInspectors.forEach((inspector, index) => {
      console.log(`  ${index + 1}. ${inspector.name} (${inspector.email})`);
      console.log(`     ID: ${inspector.id}`);
    });
    
    console.log('\n✅ Inspectors added successfully!');
    console.log('Inspectors can now be assigned to inspection missions.');
    
  } catch (error) {
    console.error('❌ Error adding inspectors:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addInspectors()
  .then(() => {
    console.log('\n🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });