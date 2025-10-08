import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function addAdmin() {
  console.log('👤 Ensuring admin user exists...');
  
  try {
    // Check for existing admin
    let admin = await prisma.user.findFirst({
      where: { role: UserRole.ADMIN }
    });
    
    if (admin) {
      console.log('✅ Admin already exists:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
    } else {
      console.log('Creating new admin user...');
      
      admin = await prisma.user.create({
        data: {
          email: 'admin@agrotrade.com',
          name: 'System Admin',
          role: UserRole.ADMIN,
          password: 'admin123',
          isEmailVerified: true,
          onboardingCompleted: true,
          isActive: true,
        }
      });
      
      console.log('✅ Admin created successfully:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
    }
    
    // Update the trade-operation.controller.ts with the correct admin ID
    console.log('\n📝 UPDATE NEEDED:');
    console.log(`Please update the default adminId in trade-operation.controller.ts to: '${admin.id}'`);
    console.log('Location: backend/src/trade-operations/controllers/trade-operation.controller.ts:72');
    
    return admin;
    
  } catch (error) {
    console.error('❌ Error managing admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addAdmin()
  .then((admin) => {
    console.log('\n🎉 Script completed successfully');
    console.log(`Admin ID to use: ${admin.id}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });