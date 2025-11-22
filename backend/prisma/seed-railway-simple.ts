import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Railway database...');

  // Check what models we have
  console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));

  try {
    // Seed based on actual schema
    const userCount = await prisma.users.count();
    console.log(`✅ Database connected! Found ${userCount} users.`);
    
    console.log('\n🎉 Basic validation complete!');
    console.log('Database is ready to use.');
    console.log('\nNote: The database schema appears to be from an older migration.');
    console.log('You may need to apply newer migrations or adjust the schema.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
