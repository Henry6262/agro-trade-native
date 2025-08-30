import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductCategory, ProductStatus } from '@prisma/client';

@Injectable()
export class ProductsService {
  private productMetadata: any[];

  constructor(private prisma: PrismaService) {
    this.initializeProductMetadata();
  }

  private initializeProductMetadata() {
    // Hardcoded metadata for products - works on Vercel
    this.productMetadata = [
      {
        category: 'WHEAT',
        name: 'Wheat',
        displayName: 'Wheat',
        description: 'High-quality wheat varieties for milling and baking',
        image: '/images/products/wheat.jpg',
        unit: 'TON',
        specifications: {
          protein: '11-14%',
          moisture: 'Max 14%',
          testWeight: 'Min 76 kg/hl'
        }
      },
      {
        category: 'CORN',
        name: 'Corn',
        displayName: 'Corn / Maize',
        description: 'Yellow corn suitable for feed and processing',
        image: '/images/products/corn.jpg',
        unit: 'TON',
        specifications: {
          moisture: 'Max 14%',
          brokenKernels: 'Max 3%',
          foreignMatter: 'Max 2%'
        }
      },
      {
        category: 'SUNFLOWER',
        name: 'Sunflower',
        displayName: 'Sunflower Seeds',
        description: 'High-oil content sunflower seeds',
        image: '/images/products/sunflower.jpg',
        unit: 'TON',
        specifications: {
          oilContent: 'Min 44%',
          moisture: 'Max 9%',
          impurities: 'Max 3%'
        }
      },
      {
        category: 'BARLEY',
        name: 'Barley',
        displayName: 'Barley',
        description: 'Feed and malting barley',
        image: '/images/products/barley.jpg',
        unit: 'TON',
        specifications: {
          protein: '9-12%',
          moisture: 'Max 14%',
          germination: 'Min 95% (malting)'
        }
      },
      {
        category: 'OATS',
        name: 'Oats',
        displayName: 'Oats',
        description: 'Premium oats for human consumption and animal feed',
        image: '/images/products/oats.jpg',
        unit: 'TON',
        specifications: {
          testWeight: 'Min 50 kg/hl',
          moisture: 'Max 14%',
          groats: 'Min 70%'
        }
      },
      {
        category: 'RAPESEED',
        name: 'Rapeseed',
        displayName: 'Rapeseed / Canola',
        description: 'Premium rapeseed for oil production',
        image: '/images/products/rapeseed.jpg',
        unit: 'TON',
        specifications: {
          oilContent: 'Min 42%',
          moisture: 'Max 9%',
          erucicAcid: 'Max 2%'
        }
      },
      {
        category: 'PEAS',
        name: 'Peas',
        displayName: 'Peas',
        description: 'Yellow and green peas for food and feed',
        image: '/images/products/peas.jpg',
        unit: 'TON',
        specifications: {
          protein: 'Min 23%',
          moisture: 'Max 14%',
          foreignMatter: 'Max 1%'
        }
      },
      {
        category: 'SOYBEAN_MEAL',
        name: 'Soybean Meal',
        displayName: 'Soybean Meal',
        description: 'High-protein soybean meal for animal feed',
        image: '/images/products/soybean-meal.jpg',
        unit: 'TON',
        specifications: {
          protein: 'Min 44-48%',
          moisture: 'Max 12%',
          fiber: 'Max 7%'
        }
      },
      {
        category: 'WHEAT_BRAN',
        name: 'Wheat Bran',
        displayName: 'Wheat Bran',
        description: 'Premium wheat bran for animal feed',
        image: '/images/products/wheat-bran.jpg',
        unit: 'TON',
        specifications: {
          protein: 'Min 15%',
          fiber: '10-12%',
          moisture: 'Max 14%'
        }
      },
      {
        category: 'ALFALFA',
        name: 'Alfalfa',
        displayName: 'Alfalfa Pellets',
        description: 'High-quality alfalfa pellets for livestock',
        image: '/images/products/alfalfa.jpg',
        unit: 'TON',
        specifications: {
          protein: 'Min 17%',
          fiber: 'Max 32%',
          moisture: 'Max 12%'
        }
      }
    ];
  }

  async getProductMetadata() {
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
      data: this.productMetadata,
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
            phoneNumber: true
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
            phoneNumber: true,
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
        const metadata = this.productMetadata.find(m => m.category === category);
        
        // Count available products for this category
        const productCount = await this.prisma.product.count({
          where: {
            category,
            status: ProductStatus.AVAILABLE
          }
        });
        
        return {
          category,
          name: metadata?.name || category,
          image: metadata?.image || null,
          description: metadata?.description || null,
          availableProducts: productCount
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