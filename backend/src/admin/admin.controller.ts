import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { ProductUnit } from '@prisma/client';

class CreatePricingZoneDto {
  name: string;
  description?: string;
  color?: string;
  marketSize?: string;
  transportAccess?: string;
  storageCapacity?: string;
}

class UpdatePricingZoneDto extends CreatePricingZoneDto {
  isActive?: boolean;
}

class CreateProductPriceDto {
  productId: string;
  pricingZoneId: string;
  minPrice: number;
  maxPrice: number;
  currency: string;
  unit: ProductUnit;
  qualityGrade?: string;
  effectiveDate?: Date;
  expiresDate?: Date;
}

class UpdateProductPriceDto extends CreateProductPriceDto {
  id: string;
}

class AssignCityToPricingZoneDto {
  cityId: string;
  pricingZoneId: string;
  priority?: number;
  isDefault?: boolean;
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== PRICING ZONES ====================

  /**
   * Get all pricing zones with cities and prices
   */
  @Get('pricing-zones')
  async getPricingZones() {
    const zones = await this.adminService.getAllPricingZones();
    return {
      success: true,
      data: zones,
    };
  }

  /**
   * Create a new pricing zone
   */
  @Post('pricing-zones')
  @HttpCode(HttpStatus.CREATED)
  async createPricingZone(@Body() dto: CreatePricingZoneDto) {
    const zone = await this.adminService.createPricingZone(dto);
    return {
      success: true,
      data: zone,
    };
  }

  /**
   * Update pricing zone
   */
  @Put('pricing-zones/:id')
  async updatePricingZone(
    @Param('id') id: string,
    @Body() dto: UpdatePricingZoneDto,
  ) {
    const zone = await this.adminService.updatePricingZone(id, dto);
    return {
      success: true,
      data: zone,
    };
  }

  /**
   * Delete pricing zone
   */
  @Delete('pricing-zones/:id')
  async deletePricingZone(@Param('id') id: string) {
    await this.adminService.deletePricingZone(id);
    return {
      success: true,
      message: 'Pricing zone deleted successfully',
    };
  }

  // ==================== CITIES ====================

  /**
   * Get all cities with their pricing zones
   */
  @Get('cities')
  async getCities(
    @Query('countryCode') countryCode?: string,
    @Query('search') search?: string,
  ) {
    const cities = await this.adminService.getAllCities(countryCode, search);
    return {
      success: true,
      data: cities,
    };
  }

  /**
   * Assign city to pricing zone
   */
  @Post('cities/assign-pricing-zone')
  @HttpCode(HttpStatus.CREATED)
  async assignCityToPricingZone(@Body() dto: AssignCityToPricingZoneDto) {
    const assignment = await this.adminService.assignCityToPricingZone(
      dto.cityId,
      dto.pricingZoneId,
      dto.priority,
      dto.isDefault,
    );
    return {
      success: true,
      data: assignment,
    };
  }

  /**
   * Remove city from pricing zone
   */
  @Delete('cities/:cityId/pricing-zones/:pricingZoneId')
  async removeCityFromPricingZone(
    @Param('cityId') cityId: string,
    @Param('pricingZoneId') pricingZoneId: string,
  ) {
    await this.adminService.removeCityFromPricingZone(cityId, pricingZoneId);
    return {
      success: true,
      message: 'City removed from pricing zone successfully',
    };
  }

  // ==================== PRODUCT PRICES ====================

  /**
   * Get product prices for a pricing zone
   */
  @Get('pricing-zones/:zoneId/product-prices')
  async getProductPricesForZone(@Param('zoneId') zoneId: string) {
    const prices = await this.adminService.getProductPricesForZone(zoneId);
    return {
      success: true,
      data: prices,
    };
  }

  /**
   * Create product price
   */
  @Post('product-prices')
  @HttpCode(HttpStatus.CREATED)
  async createProductPrice(@Body() dto: CreateProductPriceDto) {
    if (dto.minPrice >= dto.maxPrice) {
      throw new BadRequestException('Minimum price must be less than maximum price');
    }

    const price = await this.adminService.createProductPrice(dto);
    return {
      success: true,
      data: price,
    };
  }

  /**
   * Update product price
   */
  @Put('product-prices/:id')
  async updateProductPrice(
    @Param('id') id: string,
    @Body() dto: UpdateProductPriceDto,
  ) {
    if (dto.minPrice >= dto.maxPrice) {
      throw new BadRequestException('Minimum price must be less than maximum price');
    }

    const price = await this.adminService.updateProductPrice(id, dto);
    return {
      success: true,
      data: price,
    };
  }

  /**
   * Delete product price
   */
  @Delete('product-prices/:id')
  async deleteProductPrice(@Param('id') id: string) {
    await this.adminService.deleteProductPrice(id);
    return {
      success: true,
      message: 'Product price deleted successfully',
    };
  }

  /**
   * Bulk update product prices for a zone
   */
  @Put('pricing-zones/:zoneId/bulk-update-prices')
  async bulkUpdatePricesForZone(
    @Param('zoneId') zoneId: string,
    @Body() dto: { prices: CreateProductPriceDto[] },
  ) {
    const prices = await this.adminService.bulkUpdatePricesForZone(zoneId, dto.prices);
    return {
      success: true,
      data: prices,
    };
  }

  // ==================== MARKET CONDITIONS ====================

  /**
   * Get market conditions for a pricing zone
   */
  @Get('pricing-zones/:zoneId/market-conditions')
  async getMarketConditions(
    @Param('zoneId') zoneId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const conditions = await this.adminService.getMarketConditions(
      zoneId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      success: true,
      data: conditions,
    };
  }

  /**
   * Update market conditions
   */
  @Post('pricing-zones/:zoneId/market-conditions')
  @HttpCode(HttpStatus.CREATED)
  async updateMarketConditions(
    @Param('zoneId') zoneId: string,
    @Body() dto: {
      date: Date;
      supplyLevel: number;
      demandLevel: number;
      weatherImpact?: number;
      transportCost?: number;
      notes?: string;
    },
  ) {
    if (dto.supplyLevel < 1 || dto.supplyLevel > 10) {
      throw new BadRequestException('Supply level must be between 1 and 10');
    }
    if (dto.demandLevel < 1 || dto.demandLevel > 10) {
      throw new BadRequestException('Demand level must be between 1 and 10');
    }

    const condition = await this.adminService.updateMarketConditions(zoneId, dto);
    return {
      success: true,
      data: condition,
    };
  }

  // ==================== ANALYTICS ====================

  /**
   * Get pricing analytics and statistics
   */
  @Get('analytics/pricing-overview')
  async getPricingAnalytics() {
    const analytics = await this.adminService.getPricingAnalytics();
    return {
      success: true,
      data: analytics,
    };
  }

  /**
   * Get map data for pricing zones visualization
   */
  @Get('analytics/map-data')
  async getMapData() {
    const mapData = await this.adminService.getMapDataForPricingZones();
    return {
      success: true,
      data: mapData,
    };
  }

  // ==================== IMPORT/EXPORT ====================

  /**
   * Export pricing data as CSV
   */
  @Get('export/pricing-data')
  async exportPricingData(@Query('format') format: string = 'csv') {
    const data = await this.adminService.exportPricingData(format);
    return {
      success: true,
      data,
    };
  }

  /**
   * Import cities from CSV
   */
  @Post('import/cities')
  @HttpCode(HttpStatus.CREATED)
  async importCities(@Body() dto: { csvData: string }) {
    const result = await this.adminService.importCitiesFromCsv(dto.csvData);
    return {
      success: true,
      data: result,
    };
  }
}