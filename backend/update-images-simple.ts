import { PrismaClient, ProductCategory } from '@prisma/client';
const prisma = new PrismaClient();

const imageMap: Record<ProductCategory, string> = {
  [ProductCategory.SOFT_WHEAT]: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80',
  [ProductCategory.DURUM_WHEAT]: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',
  [ProductCategory.CORN_MAIZE]: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800&q=80',
  [ProductCategory.BARLEY]: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=800&q=80',
  [ProductCategory.SUNFLOWER]: 'https://images.unsplash.com/photo-1597848212624-e530580fb4d3?w=800&q=80',
  [ProductCategory.RAPESEED]: 'https://images.unsplash.com/photo-1593923443656-e51c1f15f80e?w=800&q=80',
  [ProductCategory.OATS]: 'https://images.unsplash.com/photo-1569409094008-a3dee1a7c8c3?w=800&q=80',
  [ProductCategory.PEAS]: 'https://images.unsplash.com/photo-1533167649158-6d508895b680?w=800&q=80',
  [ProductCategory.SOYBEAN_MEAL]: 'https://images.unsplash.com/photo-1612456049152-9c4f3c072804?w=800&q=80',
  [ProductCategory.WHEAT_BRAN]: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800&q=80',
  [ProductCategory.ALFALFA]: 'https://images.unsplash.com/photo-1517686748439-8e7249f9f3bf?w=800&q=80',
  [ProductCategory.OTHER]: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80',
};

async function main() {
  console.log('🖼️  Updating product images...\n');

  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products\n`);

  for (const product of products) {
    const image = imageMap[product.category];
    if (image) {
      await prisma.product.update({
        where: { id: product.id },
        data: { image }
      });
      console.log(`✅ Updated ${product.displayName || product.name}`);
    }
  }

  console.log('\n✅ All images updated!');
  await prisma.$disconnect();
}

main().catch(console.error);
