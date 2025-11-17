import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ProductsService } from "./products.service";
import { Public } from "../auth/decorators/public.decorator";
import {
  ApiResponseDto,
  CategoryMetadataDto,
  ProductMetadataDto,
  RegionWithCitiesDto,
  SpecificationTypeDto,
} from "./dto/product.dto";
import { Product } from "@prisma/client";

@ApiTags("products")
@Controller("products")
@Public() // Make all product endpoints public
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get("metadata")
  @ApiOperation({ summary: "Get all product metadata with images" })
  @ApiResponse({
    status: 200,
    description: "Returns product metadata including images and descriptions",
  })
  async getProductMetadata(): Promise<ApiResponseDto<ProductMetadataDto[]>> {
    return this.productsService.getProductMetadata();
  }

  @Get("categories")
  @ApiOperation({
    summary: "Get all categories with metadata and available product count",
  })
  @ApiResponse({
    status: 200,
    description: "Returns categories with their metadata and product counts",
  })
  async getCategoriesWithMetadata(): Promise<
    ApiResponseDto<CategoryMetadataDto[]>
  > {
    return this.productsService.getCategoriesWithMetadata();
  }

  @Get()
  @ApiOperation({ summary: "Get all available products" })
  @ApiResponse({
    status: 200,
    description: "Returns all available products from database",
  })
  async getAllProducts(): Promise<ApiResponseDto<Product[]>> {
    return this.productsService.getAllProducts();
  }

  @Get("category/:category")
  @ApiOperation({ summary: "Get products by category" })
  @ApiResponse({
    status: 200,
    description: "Returns products filtered by category",
  })
  async getProductsByCategory(
    @Param("category") category: string,
  ): Promise<ApiResponseDto<ProductMetadataDto>> {
    return this.productsService.getProductsByCategory(category);
  }

  @Get("regions")
  @ApiOperation({ summary: "Get all regions with cities" })
  @ApiResponse({
    status: 200,
    description: "Returns regions with their cities",
  })
  async getRegionsWithCities(): Promise<ApiResponseDto<RegionWithCitiesDto[]>> {
    return this.productsService.getRegionsWithCities();
  }

  @Get("specifications")
  @ApiOperation({ summary: "Get all specification types" })
  @ApiResponse({
    status: 200,
    description: "Returns all available specification types",
  })
  async getSpecificationTypes(): Promise<
    ApiResponseDto<SpecificationTypeDto[]>
  > {
    return this.productsService.getSpecificationTypes();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get product by ID" })
  @ApiResponse({ status: 200, description: "Returns a specific product" })
  async getProductById(
    @Param("id") id: string,
  ): Promise<ApiResponseDto<ProductMetadataDto>> {
    return this.productsService.getProductById(id);
  }
}
