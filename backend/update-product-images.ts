import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateImages() {
  console.log('🖼️  Updating product images in local database...\n');

  const imageMap: Record<string, string> = {
    'WHEAT': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80',
    'SOFT_WHEAT': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80',
    'DURUM_WHEAT': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',
    'CORN': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80',
    'CORN_MAIZE': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80',
    'BARLEY': 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800&q=80',
    'SUNFLOWER': 'https://images.unsplash.com/photo-1597848212624-e530580fb4d3?w=800&q=80',
    'RAPESEED': 'https://images.unsplash.com/photo-1593923443656-e51c1f15f80e?w=800&q=80',
    'OATS': 'https://images.unsplash.com/photo-1569409094008-a3dee1a7c8c3?w=800&q=80',
    'PEAS': 'https://images.unsplash.com/photo-1533167649158-6d508895b680?w=800&q=80',
    'SOYBEAN_MEAL': 'https://images.unsplash.com/photo-1612456049152-9c4f3c072804?w=800&q=80',
    'WHEAT_BRAN': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80',
    'ALFALFA': 'https://images.unsplash.com/photo-1517686748439-8e7249f9f3bf?w=800&q=80',
  };

  try {
    // Try product_catalog table first (old schema)
    const products = await (prisma as any).product_catalog.findMany();
    console.log(`Found ${products.length} products in product_catalog table\n`);

    for (const product of products) {
      const image = imageMap[product.category];
      if (image) {
        await (prisma as any).product_catalog.update({
          where: { id: product.id },
          data: { image }
        });
        console.log(`  ✅ Updated ${product.display_name || product.name || product.category}`);
      }
    }
    console.log('\n✅ All product images updated successfully!');
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log('product_catalog table not found, trying Product table...\n');

      // Try Product table (new schema)
      const products = await prisma.product.findMany();
      console.log(`Found ${products.length} products in Product table\n`);

      for (const product of products) {
        const image = imageMap[product.category];
        if (image) {
          await prisma.product.update({
            where: { id: product.id },
            data: { image }
          });
          console.log(`  ✅ Updated ${product.displayName || product.name || product.category}`);
        }
      }
      console.log('\n✅ All product images updated successfully!');
    } else {
      throw error;
    }
  }

  await prisma.$disconnect();
}

updateImages().catch(console.error);
