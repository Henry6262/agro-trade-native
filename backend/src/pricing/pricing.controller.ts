import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { PricingService } from './pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('location-based')
  async getLocationBasedPricing(
    @Query('productId') productId: string,
    @Query('quantity') quantity: string,
    @Query('lat') latitude: string,
    @Query('lng') longitude: string,
  ) {
    if (!productId || !quantity || !latitude || !longitude) {
      throw new BadRequestException('Missing required parameters: productId, quantity, lat, lng');
    }

    const quantityNum = parseFloat(quantity);
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(quantityNum) || isNaN(lat) || isNaN(lng)) {
      throw new BadRequestException('Invalid numeric values for quantity, latitude, or longitude');
    }

    return this.pricingService.getLocationBasedPricing(productId, quantityNum, lat, lng);
  }
}