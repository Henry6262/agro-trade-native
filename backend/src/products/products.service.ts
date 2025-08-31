import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductCategory, ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async getProductMetadata() {
    // Get from database ProductCatalog table
    const catalogItems = await this.prisma.productCatalog.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    // Also get actual products from database
    const products = await this.prisma.product.findMany({
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return {
      success: true,
      data: catalogItems.map(item => ({
        category: item.category,
        name: item.name,
        displayName: item.displayName,
        description: item.description,
        image: item.image,
        nutritionalInfo: item.nutritionalInfo,
        useCases: item.useCases,
        harvestSeason: item.harvestSeason,
        storageRecommendations: item.storageRecommendations,
        priceRangeMin: item.priceRangeMin,
        priceRangeMax: item.priceRangeMax,
        unit: item.defaultUnit,
        qualityGrades: item.qualityGrades,
        certifications: item.certifications,
        specifications: item.specifications
      })),
      products: products,
      message: 'Product metadata retrieved successfully'
    };
  }

  async getAllProducts(status?: string) {
    const where = status ? { status: status as ProductStatus } : {};
    
    const products = await this.prisma.product.findMany({
      where,
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    // Get catalog data for enrichment
    const catalogItems = await this.prisma.productCatalog.findMany({
      where: { isActive: true }
    });

    // Create a map for quick lookup
    const catalogMap = new Map(catalogItems.map(item => [item.category, item]));

    // Enrich products with catalog metadata
    const enrichedProducts = products.map(product => {
      const catalogData = catalogMap.get(product.category);
      return {
        ...product,
        metadata: catalogData ? {
          displayName: catalogData.displayName,
          image: catalogData.image,
          description: catalogData.description,
          specifications: catalogData.specifications
        } : null
      };
    });

    return {
      success: true,
      data: enrichedProducts,
      total: enrichedProducts.length,
      message: 'Products retrieved successfully'
    };
  }

  async getProductsByCategory(category: string) {
    const categoryEnum = category.toUpperCase() as ProductCategory;
    
    if (!Object.values(ProductCategory).includes(categoryEnum)) {
      throw new NotFoundException(`Category ${category} not found`);
    }

    const products = await this.prisma.product.findMany({
      where: {
        category: categoryEnum,
        status: ProductStatus.AVAILABLE
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });

    // Get catalog metadata for this category
    const catalogData = await this.prisma.productCatalog.findUnique({
      where: { category: categoryEnum }
    });

    return {
      success: true,
      data: {
        products,
        metadata: catalogData ? {
          displayName: catalogData.displayName,
          image: catalogData.image,
          description: catalogData.description,
          nutritionalInfo: catalogData.nutritionalInfo,
          useCases: catalogData.useCases,
          specifications: catalogData.specifications,
          qualityGrades: catalogData.qualityGrades,
          certifications: catalogData.certifications
        } : null
      },
      total: products.length,
      message: `Products in category ${category} retrieved successfully`
    };
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            farmerProfile: true
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Get catalog metadata
    const catalogData = await this.prisma.productCatalog.findUnique({
      where: { category: product.category }
    });

    return {
      success: true,
      data: {
        ...product,
        metadata: catalogData ? {
          displayName: catalogData.displayName,
          image: catalogData.image,
          description: catalogData.description,
          specifications: catalogData.specifications
        } : null
      },
      message: 'Product retrieved successfully'
    };
  }

  // Helper method to get all categories with their metadata
  async getCategoriesWithMetadata() {
    // Get all catalog entries
    const catalogItems = await this.prisma.productCatalog.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
    
    // Count available products for each category
    const categoriesWithData = await Promise.all(
      catalogItems.map(async (catalogItem) => {
        const productCount = await this.prisma.product.count({
          where: {
            category: catalogItem.category,
            status: ProductStatus.AVAILABLE
          }
        });
        
        return {
          category: catalogItem.category,
          name: catalogItem.displayName,
          image: catalogItem.image,
          description: catalogItem.description,
          availableProducts: productCount
        };
      })
    );

    return {
      success: true,
      data: categoriesWithData,
      message: 'Categories retrieved successfully'
    };
  }
}