import {
  CommodityParentCategory,
  Incoterm,
  PrismaClient,
  ProductCategory,
} from '@prisma/client';

const prisma = new PrismaClient();

const REGISTRY_ENTRIES = [
  { name: 'Soft Wheat', hsCode: '1001.19', productCategoryRef: ProductCategory.SOFT_WHEAT, requiresPhytoCert: true },
  { name: 'Durum Wheat', hsCode: '1001.11', productCategoryRef: ProductCategory.DURUM_WHEAT, requiresPhytoCert: true },
  { name: 'Corn / Maize', hsCode: '1005.90', productCategoryRef: ProductCategory.CORN_MAIZE, requiresPhytoCert: true },
  { name: 'Barley', hsCode: '1003.90', productCategoryRef: ProductCategory.BARLEY, requiresPhytoCert: true },
  { name: 'Oats', hsCode: '1004.90', productCategoryRef: ProductCategory.OATS, requiresPhytoCert: true },
  { name: 'Sunflower Seeds', hsCode: '1206.00', productCategoryRef: ProductCategory.SUNFLOWER, requiresPhytoCert: true },
  { name: 'Rapeseed', hsCode: '1205.10', productCategoryRef: ProductCategory.RAPESEED, requiresPhytoCert: true },
  { name: 'Peas', hsCode: '0713.10', productCategoryRef: ProductCategory.PEAS, requiresPhytoCert: true },
  { name: 'Soybean Meal', hsCode: '2304.00', productCategoryRef: ProductCategory.SOYBEAN_MEAL },
  { name: 'Wheat Bran', hsCode: '2302.30', productCategoryRef: ProductCategory.WHEAT_BRAN },
  { name: 'Alfalfa', hsCode: '1214.10', productCategoryRef: ProductCategory.ALFALFA, requiresPhytoCert: true },
  { name: 'Generic Agro', hsCode: '0100.00', productCategoryRef: ProductCategory.OTHER },
];

const validIncoterms = [
  Incoterm.FOB,
  Incoterm.CFR,
  Incoterm.CIF,
  Incoterm.DAP,
  Incoterm.DDP,
];

async function main() {
  for (const entry of REGISTRY_ENTRIES) {
    const registry = await prisma.commodityRegistry.upsert({
      where: { name: entry.name },
      update: {
        hsCode: entry.hsCode,
        parentCategory: CommodityParentCategory.AGRICULTURE,
        productCategoryRef: entry.productCategoryRef,
        requiresPhytoCert: entry.requiresPhytoCert ?? false,
        validIncoterms,
      },
      create: {
        name: entry.name,
        hsCode: entry.hsCode,
        parentCategory: CommodityParentCategory.AGRICULTURE,
        productCategoryRef: entry.productCategoryRef,
        requiresPhytoCert: entry.requiresPhytoCert ?? false,
        validIncoterms,
      },
    });

    await prisma.product.updateMany({
      where: { category: entry.productCategoryRef },
      data: { commodityRegistryId: registry.id },
    });
  }

  const count = await prisma.commodityRegistry.count();
  console.log(`Commodity registry seeded. Total rows: ${count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
