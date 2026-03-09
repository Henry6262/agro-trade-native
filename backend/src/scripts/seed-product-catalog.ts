/**
 * Idempotent product catalog seed for production.
 *
 * Safe to run on every deploy:
 * - If products already exist → exits immediately (no changes).
 * - If products table is empty → seeds SpecificationTypes + Products.
 * - Never deletes any user data.
 *
 * Added to Dockerfile CMD so it runs automatically after migrations.
 */
import { PrismaClient, ProductCategory, ProductUnit, DataType, Importance } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productCount = await prisma.product.count();

  if (productCount > 0) {
    console.log(`✅ Product catalog already seeded (${productCount} products). Skipping.`);
    return;
  }

  console.log('🌱 Seeding product catalog...');

  // ── Specification Types ───────────────────────────────────────────────────
  const specDefs = [
    { code: 'moisture',        name: 'Moisture Content',              unit: '%',     dataType: DataType.NUMBER, minValue: 0,   maxValue: 100 },
    { code: 'protein',         name: 'Protein Content',               unit: '%',     dataType: DataType.NUMBER, minValue: 0,   maxValue: 100 },
    { code: 'oil_content',     name: 'Oil Content',                   unit: '%',     dataType: DataType.NUMBER, minValue: 0,   maxValue: 100 },
    { code: 'fiber',           name: 'Fiber Content',                 unit: '%',     dataType: DataType.NUMBER, minValue: 0,   maxValue: 100 },
    { code: 'purity',          name: 'Purity / Foreign Matter',       unit: '%',     dataType: DataType.NUMBER, minValue: 0,   maxValue: 100 },
    { code: 'hlw',             name: 'Hectoliter Weight (Test Weight)',unit: 'kg/hl', dataType: DataType.NUMBER, minValue: 60,  maxValue: 90  },
    { code: 'falling_number',  name: 'Falling Number',                unit: 'sec',   dataType: DataType.NUMBER, minValue: 60,  maxValue: 400 },
    { code: 'gluten_strength', name: 'Gluten Strength (Wet Gluten)',  unit: '%',     dataType: DataType.NUMBER, minValue: 20,  maxValue: 50  },
    { code: 'broken_kernels',  name: 'Broken & Damaged Kernels',      unit: '%',     dataType: DataType.NUMBER, minValue: 0,   maxValue: 30  },
    { code: 'aflatoxins',      name: 'Aflatoxin Level',               unit: 'ppb',   dataType: DataType.NUMBER, minValue: 0,   maxValue: 20  },
    { code: 'test_weight',     name: 'Test Weight',                   unit: 'kg/hl', dataType: DataType.NUMBER, minValue: 40,  maxValue: 80  },
    { code: 'groat',           name: 'Groat Content',                 unit: '%',     dataType: DataType.NUMBER, minValue: 50,  maxValue: 100 },
    { code: 'hull',            name: 'Hull Content',                  unit: '%',     dataType: DataType.NUMBER, minValue: 0,   maxValue: 40  },
    { code: 'glucosinolate',   name: 'Glucosinolate Content',         unit: 'µmol/g',dataType: DataType.NUMBER, minValue: 0,   maxValue: 25  },
    { code: 'germination',     name: 'Germination Rate',              unit: '%',     dataType: DataType.NUMBER, minValue: 80,  maxValue: 100 },
    { code: 'split',           name: 'Split Kernels',                 unit: '%',     dataType: DataType.NUMBER, minValue: 0,   maxValue: 20  },
    { code: 'particle_size',   name: 'Particle Size',                 unit: 'mm',    dataType: DataType.NUMBER, minValue: 0,   maxValue: 5   },
  ];

  // Upsert by unique code — safe on re-run.
  const specTypes: Record<string, { id: string }> = {};
  for (const def of specDefs) {
    const spec = await prisma.specificationType.upsert({
      where: { code: def.code },
      update: {},
      create: def,
    });
    specTypes[def.code] = spec;
  }
  console.log(`   ✓ ${specDefs.length} specification types`);

  // ── Products ──────────────────────────────────────────────────────────────
  const productDefs: Array<{
    category: ProductCategory;
    name: string;
    displayName: string;
    description: string;
    image: string;
    harvestSeason?: string;
    storageRecommendations: string;
    priceRangeMin: number;
    priceRangeMax: number;
    defaultUnit: ProductUnit;
    sortOrder: number;
    specs: Array<{ code: string; importance: Importance; displayOrder: number }>;
  }> = [
    {
      category: ProductCategory.SOFT_WHEAT,
      name: 'soft_wheat',
      displayName: 'Soft Wheat',
      description: 'Low-protein wheat ideal for pastries, cakes, and biscuits.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/soft_wheat_bfxdaa.png',
      harvestSeason: 'June - August',
      storageRecommendations: 'Store in cool, dry conditions. Maintain moisture below 14%.',
      priceRangeMin: 240, priceRangeMax: 320, defaultUnit: ProductUnit.TON, sortOrder: 1,
      specs: [
        { code: 'protein',        importance: Importance.CRITICAL,  displayOrder: 1 },
        { code: 'hlw',            importance: Importance.IMPORTANT, displayOrder: 2 },
        { code: 'falling_number', importance: Importance.OPTIONAL,  displayOrder: 3 },
        { code: 'moisture',       importance: Importance.CRITICAL,  displayOrder: 4 },
      ],
    },
    {
      category: ProductCategory.DURUM_WHEAT,
      name: 'durum_wheat',
      displayName: 'Durum Wheat',
      description: 'High-protein wheat perfect for pasta and semolina production.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/durum_wheat_maskoy.png',
      harvestSeason: 'June - August',
      storageRecommendations: 'Keep moisture below 14%, maintain protein quality.',
      priceRangeMin: 280, priceRangeMax: 380, defaultUnit: ProductUnit.TON, sortOrder: 2,
      specs: [
        { code: 'protein',         importance: Importance.CRITICAL,  displayOrder: 1 },
        { code: 'gluten_strength', importance: Importance.CRITICAL,  displayOrder: 2 },
        { code: 'moisture',        importance: Importance.CRITICAL,  displayOrder: 3 },
      ],
    },
    {
      category: ProductCategory.CORN_MAIZE,
      name: 'corn_maize',
      displayName: 'Corn/Maize',
      description: 'Yellow corn for animal feed and food processing.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192559/corn_jiuqv5.webp',
      harvestSeason: 'September - October',
      storageRecommendations: 'Moisture below 15%, ensure proper ventilation.',
      priceRangeMin: 260, priceRangeMax: 340, defaultUnit: ProductUnit.TON, sortOrder: 3,
      specs: [
        { code: 'moisture',        importance: Importance.CRITICAL,  displayOrder: 1 },
        { code: 'broken_kernels',  importance: Importance.IMPORTANT, displayOrder: 2 },
        { code: 'aflatoxins',      importance: Importance.CRITICAL,  displayOrder: 3 },
      ],
    },
    {
      category: ProductCategory.BARLEY,
      name: 'barley',
      displayName: 'Barley',
      description: 'Two-row and six-row barley for malting and animal feed.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192552/barley_utfuak.png',
      harvestSeason: 'June - July',
      storageRecommendations: 'Keep dry with moisture below 14%.',
      priceRangeMin: 220, priceRangeMax: 300, defaultUnit: ProductUnit.TON, sortOrder: 4,
      specs: [
        { code: 'protein',     importance: Importance.CRITICAL,  displayOrder: 1 },
        { code: 'germination', importance: Importance.CRITICAL,  displayOrder: 2 },
        { code: 'moisture',    importance: Importance.CRITICAL,  displayOrder: 3 },
      ],
    },
    {
      category: ProductCategory.OATS,
      name: 'oats',
      displayName: 'Oats',
      description: 'High-quality oats for human consumption and animal feed.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/oats_g2ugm8.webp',
      harvestSeason: 'July - August',
      storageRecommendations: 'Store at moisture below 14%.',
      priceRangeMin: 200, priceRangeMax: 280, defaultUnit: ProductUnit.TON, sortOrder: 5,
      specs: [
        { code: 'test_weight', importance: Importance.CRITICAL,  displayOrder: 1 },
        { code: 'groat',       importance: Importance.IMPORTANT, displayOrder: 2 },
        { code: 'moisture',    importance: Importance.CRITICAL,  displayOrder: 3 },
      ],
    },
    {
      category: ProductCategory.SUNFLOWER,
      name: 'sunflower',
      displayName: 'Sunflower Seeds',
      description: 'High-oil content sunflower seeds for oil production.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/sunflower_jbywaa.webp',
      harvestSeason: 'August - September',
      storageRecommendations: 'Store at moisture below 9%, protect from pests.',
      priceRangeMin: 420, priceRangeMax: 580, defaultUnit: ProductUnit.TON, sortOrder: 6,
      specs: [
        { code: 'oil_content', importance: Importance.CRITICAL,  displayOrder: 1 },
        { code: 'moisture',    importance: Importance.CRITICAL,  displayOrder: 2 },
        { code: 'hull',        importance: Importance.IMPORTANT, displayOrder: 3 },
      ],
    },
    {
      category: ProductCategory.RAPESEED,
      name: 'rapeseed',
      displayName: 'Rapeseed/Canola',
      description: 'Low-glucosinolate rapeseed for oil and biodiesel production.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192554/canola_wom5lk.png',
      harvestSeason: 'July - August',
      storageRecommendations: 'Maintain moisture below 9%, cool storage.',
      priceRangeMin: 450, priceRangeMax: 620, defaultUnit: ProductUnit.TON, sortOrder: 7,
      specs: [
        { code: 'oil_content',   importance: Importance.CRITICAL,  displayOrder: 1 },
        { code: 'glucosinolate', importance: Importance.IMPORTANT, displayOrder: 2 },
        { code: 'moisture',      importance: Importance.CRITICAL,  displayOrder: 3 },
      ],
    },
    {
      category: ProductCategory.PEAS,
      name: 'peas',
      displayName: 'Peas',
      description: 'Yellow and green peas for human consumption and animal feed.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192558/peas_qjdrjq.webp',
      harvestSeason: 'June - July',
      storageRecommendations: 'Store at moisture below 14%.',
      priceRangeMin: 280, priceRangeMax: 380, defaultUnit: ProductUnit.TON, sortOrder: 8,
      specs: [
        { code: 'protein',  importance: Importance.CRITICAL,  displayOrder: 1 },
        { code: 'split',    importance: Importance.IMPORTANT, displayOrder: 2 },
        { code: 'moisture', importance: Importance.CRITICAL,  displayOrder: 3 },
      ],
    },
    {
      category: ProductCategory.SOYBEAN_MEAL,
      name: 'soybean_meal',
      displayName: 'Soybean Meal',
      description: 'High-protein soybean meal for animal feed.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192559/soybean_jzz3oq.jpg',
      storageRecommendations: 'Keep dry, protect from contamination.',
      priceRangeMin: 420, priceRangeMax: 520, defaultUnit: ProductUnit.TON, sortOrder: 9,
      specs: [
        { code: 'protein',  importance: Importance.CRITICAL,  displayOrder: 1 },
        { code: 'fiber',    importance: Importance.IMPORTANT, displayOrder: 2 },
        { code: 'moisture', importance: Importance.CRITICAL,  displayOrder: 3 },
      ],
    },
    {
      category: ProductCategory.WHEAT_BRAN,
      name: 'wheat_bran',
      displayName: 'Wheat Bran',
      description: 'Wheat bran for animal feed supplementation.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192552/wheat_bran_q6qze9.png',
      storageRecommendations: 'Store in dry conditions.',
      priceRangeMin: 180, priceRangeMax: 250, defaultUnit: ProductUnit.TON, sortOrder: 10,
      specs: [
        { code: 'moisture',      importance: Importance.CRITICAL,  displayOrder: 1 },
        { code: 'particle_size', importance: Importance.OPTIONAL,  displayOrder: 2 },
        { code: 'protein',       importance: Importance.IMPORTANT, displayOrder: 3 },
      ],
    },
    {
      category: ProductCategory.ALFALFA,
      name: 'alfalfa',
      displayName: 'Alfalfa Pellets',
      description: 'High-quality alfalfa pellets for livestock.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192552/alfalfa_pallets_saqhco.webp',
      harvestSeason: 'May - September (multiple cuts)',
      storageRecommendations: 'Store in dry, ventilated area.',
      priceRangeMin: 220, priceRangeMax: 320, defaultUnit: ProductUnit.TON, sortOrder: 11,
      specs: [
        { code: 'protein',  importance: Importance.CRITICAL,  displayOrder: 1 },
        { code: 'fiber',    importance: Importance.CRITICAL,  displayOrder: 2 },
        { code: 'moisture', importance: Importance.CRITICAL,  displayOrder: 3 },
      ],
    },
    {
      category: ProductCategory.OTHER,
      name: 'other',
      displayName: 'Other Cereals & Oilseeds',
      description: 'Various agricultural products not listed in main categories.',
      image: 'https://res.cloudinary.com/dczn89mek/image/upload/v1756192556/other_gagfht.png',
      storageRecommendations: 'Store in dry conditions.',
      priceRangeMin: 200, priceRangeMax: 500, defaultUnit: ProductUnit.TON, sortOrder: 12,
      specs: [
        { code: 'moisture',    importance: Importance.IMPORTANT, displayOrder: 1 },
        { code: 'purity',      importance: Importance.OPTIONAL,  displayOrder: 2 },
        { code: 'protein',     importance: Importance.OPTIONAL,  displayOrder: 3 },
        { code: 'oil_content', importance: Importance.OPTIONAL,  displayOrder: 4 },
      ],
    },
  ];

  for (const def of productDefs) {
    const { specs, ...productData } = def;
    await prisma.product.upsert({
      where: { category: productData.category },
      update: {},
      create: {
        ...productData,
        isActive: true,
        specTemplates: {
          create: specs.map((s) => ({
            specTypeId: specTypes[s.code].id,
            importance: s.importance,
            displayOrder: s.displayOrder,
          })),
        },
      },
    });
  }

  console.log(`   ✓ ${productDefs.length} products seeded`);
  console.log('🎉 Product catalog seed complete.');
}

main()
  .catch((e) => {
    console.error('❌ Product catalog seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    // Prisma keeps event-loop references alive after $disconnect(); force-exit so
    // the Dockerfile CMD chain (&&) can continue to `exec node dist/main.js`.
    process.exit(0);
  });
