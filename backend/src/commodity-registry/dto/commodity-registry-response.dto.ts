import { CommodityParentCategory, Incoterm, ProductCategory } from "@prisma/client";

export class CommodityRegistryResponseDto {
  id: string;
  name: string;
  hsCode: string;
  parentCategory: CommodityParentCategory;
  productCategoryRef: ProductCategory | null;
  requiresPhytoCert: boolean;
  requiresColdChain: boolean;
  requiresPurityCert: boolean;
  isDualUse: boolean;
  isAMLSensitive: boolean;
  isPerishable: boolean;
  isHazmat: boolean;
  validIncoterms: Incoterm[];
  createdAt: Date;
  updatedAt: Date;
}
