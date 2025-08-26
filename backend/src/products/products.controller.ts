import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('products')
@Controller('products')
@Public() // Make all product endpoints public
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('metadata')
  @ApiOperation({ summary: 'Get all product metadata with images' })
  @ApiResponse({ status: 200, description: 'Returns product metadata including images and descriptions' })
  async getProductMetadata() {
    return this.productsService.getProductMetadata();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories with metadata and available product count' })
  @ApiResponse({ status: 200, description: 'Returns categories with their metadata and product counts' })
  async getCategoriesWithMetadata() {
    return this.productsService.getCategoriesWithMetadata();
  }

  @Get()
  @ApiOperation({ summary: 'Get all available products' })
  @ApiResponse({ status: 200, description: 'Returns all available products from database' })
  async getAllProducts(@Query('status') status?: string) {
    return this.productsService.getAllProducts(status);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Returns products filtered by category' })
  async getProductsByCategory(@Param('category') category: string) {
    return this.productsService.getProductsByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Returns a specific product' })
  async getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }
}