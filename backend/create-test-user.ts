import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating test users...');

  const hashedPassword = await bcrypt.hash('test123', 10);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      onboardingCompleted: true,
    },
  });
  console.log('✅ Created admin:', admin.email);

  // Create buyer user
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@test.com' },
    update: { password: hashedPassword },
    create: {
      email: 'buyer@test.com',
      password: hashedPassword,
      name: 'Test Buyer',
      role: 'BUYER',
      isActive: true,
      isEmailVerified: true,
      onboardingCompleted: true,
    },
  });
  console.log('✅ Created buyer:', buyer.email);

  console.log('\n📝 Test Credentials:');
  console.log('Email: admin@test.com');
  console.log('Email: buyer@test.com');
  console.log('Password: test123');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
