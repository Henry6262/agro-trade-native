import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductCategory, ProductStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProductsService {
  private productMetadata: any[];

  constructor(private prisma: PrismaService) {
    this.loadProductMetadata();
  }

  private loadProductMetadata() {
    try {
      const metadataPath = path.join(process.cwd(), 'src', 'data', 'products-metadata.json');
      if (fs.existsSync(metadataPath)) {
        const data = fs.readFileSync(metadataPath, 'utf-8');
        this.productMetadata = JSON.parse(data);
      } else {
        console.warn('Product metadata file not found. Run npm run prisma:seed-products to generate it.');
        this.productMetadata = [];
      }
    } catch (error) {
      console.error('Error loading product metadata:', error);
      this.productMetadata = [];
    }
  }

  async getProductMetadata() {
    return {
      success: true,
      data: this.productMetadata,
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
            phone: true
          }
        }
      }
    });

    // Enrich products with metadata
    const enrichedProducts = products.map(product => {
      const metadata = this.productMetadata.find(m => m.category === product.category);
      return {
        ...product,
        metadata: metadata || null
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
            phone: true
          }
        }
      }
    });

    // Get metadata for this category
    const metadata = this.productMetadata.find(m => m.category === categoryEnum);

    return {
      success: true,
      data: {
        products,
        metadata: metadata || null
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
            phone: true,
            farmerProfile: true
          }
        }
      }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Enrich with metadata
    const metadata = this.productMetadata.find(m => m.category === product.category);

    return {
      success: true,
      data: {
        ...product,
        metadata: metadata || null
      },
      message: 'Product retrieved successfully'
    };
  }

  // Helper method to get product image URL
  getProductImage(category: ProductCategory): string | null {
    const metadata = this.productMetadata.find(m => m.category === category);
    return metadata?.image || null;
  }

  // Helper method to get all categories with their metadata
  async getCategoriesWithMetadata() {
    const categories = Object.values(ProductCategory);
    
    const categoriesWithData = await Promise.all(
      categories.map(async (category) => {
        // Check if category exists in catalog
        const catalogEntry = await this.prisma.productCatalog.findUnique({
          where: { category }
        });
        
        if (!catalogEntry) {
          return null;
        }
        
        const metadata = this.productMetadata.find(m => m.category === category);
        
        return {
          category,
          name: metadata?.name || catalogEntry.displayName || category,
          image: metadata?.image || catalogEntry.image || null,
          description: metadata?.description || catalogEntry.description || null,
          availableProducts: 1 // For now, show 1 if category exists in catalog
        };
      })
    );

    return {
      success: true,
      data: categoriesWithData.filter(c => c !== null),
      message: 'Categories retrieved successfully'
    };
  }
}