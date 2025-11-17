import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Product, ProductCategory, ListingStatus } from "@prisma/client";
import {
  ApiResponseDto,
  CategoryMetadataDto,
  ProductMetadataDto,
  RegionWithCitiesDto,
  SpecificationTypeDto,
} from "./dto/product.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // Get all products with their specifications (for metadata)
  async getProductMetadata(): Promise<ApiResponseDto<ProductMetadataDto[]>> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        specTemplates: {
          include: {
            specificationType: true,
          },
          orderBy: { displayOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return {
      success: true,
      data: products.map((product) => ({
        id: product.id,
        category: product.category,
        name: product.name,
        displayName: product.displayName,
        description: product.description,
        image: product.image,
        harvestSeason: product.harvestSeason,
        storageRecommendations: product.storageRecommendations,
        priceRangeMin: product.priceRangeMin,
        priceRangeMax: product.priceRangeMax,
        defaultUnit: product.defaultUnit,
        // Include specifications with full details
        specifications: product.specTemplates.map((spec) => ({
          id: spec.specificationType.id,
          code: spec.specificationType.code,
          name: spec.specificationType.name,
          unit: spec.specificationType.unit,
          dataType: spec.specificationType.dataType,
          importance: spec.importance,
          displayOrder: spec.displayOrder,
          // Validation rules
          minValue: spec.specificationType.minValue,
          maxValue: spec.specificationType.maxValue,
        })),
      })) as ProductMetadataDto[],
      message: "Product metadata retrieved successfully",
    };
  }

  // Get all products (simplified, without specs)
  async getAllProducts(): Promise<ApiResponseDto<Product[]>> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    return {
      success: true,
      data: products,
      total: products.length,
      message: "Products retrieved successfully",
    };
  }

  // Get products by category
  async getProductsByCategory(
    category: string,
  ): Promise<ApiResponseDto<ProductMetadataDto>> {
    const categoryEnum = category
      .toUpperCase()
      .replace("-", "_") as ProductCategory;

    if (!Object.values(ProductCategory).includes(categoryEnum)) {
      throw new NotFoundException(`Category ${category} not found`);
    }

    const product = await this.prisma.product.findUnique({
      where: { category: categoryEnum },
      include: {
        specTemplates: {
          include: {
            specificationType: true,
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product for category ${category} not found`);
    }

    return {
      success: true,
      data: {
        ...product,
        specifications: product.specTemplates.map((spec) => ({
          id: spec.specificationType.id,
          code: spec.specificationType.code,
          name: spec.specificationType.name,
          unit: spec.specificationType.unit,
          dataType: spec.specificationType.dataType,
          importance: spec.importance,
          displayOrder: spec.displayOrder,
          minValue: spec.specificationType.minValue,
          maxValue: spec.specificationType.maxValue,
        })) as ProductMetadataDto["specifications"],
      },
      message: `Product in category ${category} retrieved successfully`,
    };
  }

  // Get product by ID with full specifications
  async getProductById(
    id: string,
  ): Promise<ApiResponseDto<ProductMetadataDto>> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        specTemplates: {
          include: {
            specificationType: true,
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      success: true,
      data: {
        ...product,
        specifications: product.specTemplates.map((spec) => ({
          id: spec.specificationType.id,
          code: spec.specificationType.code,
          name: spec.specificationType.name,
          unit: spec.specificationType.unit,
          dataType: spec.specificationType.dataType,
          importance: spec.importance,
          displayOrder: spec.displayOrder,
          minValue: spec.specificationType.minValue,
          maxValue: spec.specificationType.maxValue,
        })) as ProductMetadataDto["specifications"],
      },
      message: "Product retrieved successfully",
    };
  }

  // Get all categories with product count (from sale listings)
  async getCategoriesWithMetadata(): Promise<
    ApiResponseDto<CategoryMetadataDto[]>
  > {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    // Count active sale listings for each category
    const categoriesWithData = await Promise.all(
      products.map(async (product) => {
        const listingCount = await this.prisma.saleListing.count({
          where: {
            productId: product.id,
            status: ListingStatus.ACTIVE,
          },
        });

        return {
          id: product.id,
          category: product.category,
          name: product.displayName,
          image: product.image,
          description: product.description,
          availableListings: listingCount,
        } as CategoryMetadataDto;
      }),
    );

    return {
      success: true,
      data: categoriesWithData,
      message: "Categories retrieved successfully",
    };
  }

  // NEW: Get regions with cities
  async getRegionsWithCities(): Promise<ApiResponseDto<RegionWithCitiesDto[]>> {
    const regions = await this.prisma.region.findMany({
      where: { isActive: true },
      include: {
        cities: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: [{ country: "asc" }, { name: "asc" }],
    });

    return {
      success: true,
      data: regions as unknown as RegionWithCitiesDto[],
      message: "Regions retrieved successfully",
    };
  }

  // NEW: Get all specification types
  async getSpecificationTypes(): Promise<
    ApiResponseDto<SpecificationTypeDto[]>
  > {
    const specTypes = await this.prisma.specificationType.findMany({
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: specTypes as SpecificationTypeDto[],
      message: "Specification types retrieved successfully",
    };
  }
}
