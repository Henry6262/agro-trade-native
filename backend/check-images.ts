import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkImages() {
  try {
    const products: any[] = await prisma.$queryRaw`
      SELECT category, display_name,
             CASE
               WHEN image IS NULL THEN 'NULL'
               WHEN image = '' THEN 'EMPTY'
               ELSE SUBSTRING(image, 1, 60)
             END as image_status
      FROM product_catalog
      ORDER BY category
    `;

    console.log('\n📊 Products in database:\n');
    console.log('Category'.padEnd(20), 'Display Name'.padEnd(30), 'Image Status');
    console.log('-'.repeat(100));

    products.forEach((p: any) => {
      const status = p.image_status === 'NULL' ? '❌ NO IMAGE' :
                     p.image_status === 'EMPTY' ? '❌ EMPTY' :
                     `✅ ${p.image_status}...`;
      console.log(
        p.category.padEnd(20),
        (p.display_name || '').padEnd(30),
        status
      );
    });

    const withImages = products.filter((p: any) => p.image_status !== 'NULL' && p.image_status !== 'EMPTY').length;
    const total = products.length;

    console.log('\n📈 Summary:');
    console.log(`   Total products: ${total}`);
    console.log(`   With images: ${withImages}`);
    console.log(`   Without images: ${total - withImages}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();
