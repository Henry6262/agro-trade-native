import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const productCatalogData = [
  {
    category: 'WHEAT',
    name: 'wheat',
    displayName: 'Wheat',
    description: 'High-quality wheat suitable for bread, pasta, and pastry production. Available in various grades.',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192667/soft_wheat_qxihxd.png',
    nutritionalInfo: 'Rich in carbohydrates, protein, fiber, B vitamins, and minerals.',
    useCases: ['Bread production', 'Pasta', 'Pastries', 'Animal feed'],
    harvestSeason: 'July to September',
    storageRecommendations: 'Store in cool, dry conditions with moisture content below 14%',
    priceRangeMin: 250,
    priceRangeMax: 350,
  },
  {
    category: 'CORN',
    name: 'corn',
    displayName: 'Corn',
    description: 'Premium yellow corn suitable for human consumption, animal feed, and industrial processing.',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192559/corn_jiuqv5.webp',
    nutritionalInfo: 'Good source of carbohydrates, vitamin B, fiber, and essential minerals.',
    useCases: ['Animal feed', 'Corn flour', 'Ethanol production', 'Food processing'],
    harvestSeason: 'September to November',
    storageRecommendations: 'Maintain moisture below 15%, store in ventilated silos',
    priceRangeMin: 220,
    priceRangeMax: 300,
  },
  {
    category: 'BARLEY',
    name: 'barley',
    displayName: 'Barley',
    description: 'High-quality barley ideal for brewing, animal feed, and food production.',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192666/barley_nw6okk.png',
    nutritionalInfo: 'Rich in fiber, vitamins B1, B3, and minerals including selenium, copper, and manganese.',
    useCases: ['Malting for beer', 'Animal feed', 'Soups and stews', 'Barley flour'],
    harvestSeason: 'June to August',
    storageRecommendations: 'Store in cool, dry conditions with moisture content below 14%',
    priceRangeMin: 200,
    priceRangeMax: 280,
  },
  {
    category: 'SUNFLOWER',
    name: 'sunflower',
    displayName: 'Sunflower Seeds',
    description: 'Premium sunflower seeds for oil production and direct consumption.',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192559/sunflower_mwqlvk.webp',
    nutritionalInfo: 'High in vitamin E, healthy fats, protein, and minerals.',
    useCases: ['Oil production', 'Snack foods', 'Bird feed', 'Bakery products'],
    harvestSeason: 'September to October',
    storageRecommendations: 'Keep moisture below 9%, store in cool, dry place',
    priceRangeMin: 400,
    priceRangeMax: 550,
  },
  {
    category: 'OATS',
    name: 'oats',
    displayName: 'Oats',
    description: 'Quality oats for human consumption and animal feed.',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192559/oats_zt7gfm.webp',
    nutritionalInfo: 'Excellent source of beta-glucan fiber, protein, vitamins, and minerals.',
    useCases: ['Oatmeal', 'Baking', 'Animal feed', 'Cosmetics'],
    harvestSeason: 'August to September',
    storageRecommendations: 'Store at moisture below 14%, protect from pests',
    priceRangeMin: 180,
    priceRangeMax: 250,
  },
  {
    category: 'SOYBEAN_MEAL',
    name: 'soybean_meal',
    displayName: 'Soybean Meal',
    description: 'High-protein soybean meal for animal feed and food processing.',
    image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192556/soybean_nrcuqf.jpg',
    nutritionalInfo: 'Very high in protein (44-48%), essential amino acids.',
    useCases: ['Animal feed', 'Protein supplements', 'Food processing'],
    harvestSeason: 'October to November',
    storageRecommendations: 'Keep dry, moisture below 12%, protect from contamination',
    priceRangeMin: 380,
    priceRangeMax: 480,
  },
];

async function main() {
  console.log('🌱 Seeding product catalog...');

  try {
    // Create or update product catalog entries
    for (const product of productCatalogData) {
      await prisma.productCatalog.upsert({
        where: { category: product.category as any },
        update: product as any,
        create: product as any,
      });
      console.log(`✅ Created/Updated: ${product.displayName}`);
    }

    console.log('✅ Product catalog seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});