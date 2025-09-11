const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecTypes() {
  try {
    const specTypes = await prisma.specificationType.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    console.log('Found', specTypes.length, 'specification types:');
    specTypes.forEach(spec => {
      console.log(`- ${spec.name} (${spec.code}): ${spec.dataType}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpecTypes();