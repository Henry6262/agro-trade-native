import { Injectable, NotFoundException } from "@nestjs/common";
import {
  CommodityParentCategory,
  Incoterm,
  Prisma,
  ProductCategory,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

const AGRO_INCOTERMS: Incoterm[] = [
  Incoterm.FOB,
  Incoterm.CFR,
  Incoterm.CIF,
  Incoterm.DAP,
  Incoterm.DDP,
];

const COMMODITY_REGISTRY_SEED: Array<Prisma.CommodityRegistryUpsertArgs["create"]> = [
  {
    id: "cmd-soft-wheat",
    name: "Soft Wheat",
    hsCode: "1001.19",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.SOFT_WHEAT,
    requiresPhytoCert: true,
    validIncoterms: AGRO_INCOTERMS,
  },
  {
    id: "cmd-durum-wheat",
    name: "Durum Wheat",
    hsCode: "1001.11",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.DURUM_WHEAT,
    requiresPhytoCert: true,
    validIncoterms: AGRO_INCOTERMS,
  },
  {
    id: "cmd-corn-maize",
    name: "Corn / Maize",
    hsCode: "1005.90",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.CORN_MAIZE,
    requiresPhytoCert: true,
    validIncoterms: AGRO_INCOTERMS,
  },
  {
    id: "cmd-barley",
    name: "Barley",
    hsCode: "1003.90",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.BARLEY,
    requiresPhytoCert: true,
    validIncoterms: AGRO_INCOTERMS,
  },
  {
    id: "cmd-oats",
    name: "Oats",
    hsCode: "1004.90",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.OATS,
    requiresPhytoCert: true,
    validIncoterms: AGRO_INCOTERMS,
  },
  {
    id: "cmd-sunflower",
    name: "Sunflower Seeds",
    hsCode: "1206.00",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.SUNFLOWER,
    requiresPhytoCert: true,
    validIncoterms: AGRO_INCOTERMS,
  },
  {
    id: "cmd-rapeseed",
    name: "Rapeseed",
    hsCode: "1205.10",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.RAPESEED,
    requiresPhytoCert: true,
    validIncoterms: AGRO_INCOTERMS,
  },
  {
    id: "cmd-peas",
    name: "Peas",
    hsCode: "0713.10",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.PEAS,
    requiresPhytoCert: true,
    validIncoterms: AGRO_INCOTERMS,
  },
  {
    id: "cmd-soybean-meal",
    name: "Soybean Meal",
    hsCode: "2304.00",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.SOYBEAN_MEAL,
    validIncoterms: AGRO_INCOTERMS,
  },
  {
    id: "cmd-wheat-bran",
    name: "Wheat Bran",
    hsCode: "2302.30",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.WHEAT_BRAN,
    validIncoterms: AGRO_INCOTERMS,
  },
  {
    id: "cmd-alfalfa",
    name: "Alfalfa",
    hsCode: "1214.10",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.ALFALFA,
    requiresPhytoCert: true,
    validIncoterms: AGRO_INCOTERMS,
  },
  {
    id: "cmd-generic-agro",
    name: "Generic Agro",
    hsCode: "0100.00",
    parentCategory: CommodityParentCategory.AGRICULTURE,
    productCategoryRef: ProductCategory.OTHER,
    validIncoterms: AGRO_INCOTERMS,
  },
];

@Injectable()
export class CommodityRegistryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.commodityRegistry.findMany({
      orderBy: [{ parentCategory: "asc" }, { name: "asc" }],
    });
  }

  async findById(id: string) {
    const entry = await this.prisma.commodityRegistry.findUnique({ where: { id } });
    if (!entry) {
      throw new NotFoundException("Commodity registry entry not found");
    }
    return entry;
  }

  findByProductCategory(category: ProductCategory) {
    return this.prisma.commodityRegistry.findFirst({
      where: { productCategoryRef: category },
    });
  }

  async seed() {
    await Promise.all(
      COMMODITY_REGISTRY_SEED.map((entry) => {
        const { id, ...data } = entry;
        return this.prisma.commodityRegistry.upsert({
          where: { name: entry.name },
          update: {
            hsCode: data.hsCode,
            parentCategory: data.parentCategory,
            productCategoryRef: data.productCategoryRef,
            requiresPhytoCert: data.requiresPhytoCert ?? false,
            requiresColdChain: data.requiresColdChain ?? false,
            requiresPurityCert: data.requiresPurityCert ?? false,
            isDualUse: data.isDualUse ?? false,
            isAMLSensitive: data.isAMLSensitive ?? false,
            isPerishable: data.isPerishable ?? false,
            isHazmat: data.isHazmat ?? false,
            validIncoterms: data.validIncoterms ?? [],
          },
          create: {
            ...entry,
            requiresPhytoCert: data.requiresPhytoCert ?? false,
            requiresColdChain: data.requiresColdChain ?? false,
            requiresPurityCert: data.requiresPurityCert ?? false,
            isDualUse: data.isDualUse ?? false,
            isAMLSensitive: data.isAMLSensitive ?? false,
            isPerishable: data.isPerishable ?? false,
            isHazmat: data.isHazmat ?? false,
            validIncoterms: data.validIncoterms ?? [],
          },
        });
      }),
    );

    return this.findAll();
  }
}
