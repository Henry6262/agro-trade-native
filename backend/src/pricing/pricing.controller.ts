import {
  Controller,
  Get,
  Query,
  BadRequestException,
  ValidationPipe,
} from "@nestjs/common";
import { PricingService } from "./pricing.service";
import {
  LocationPricingQueryDto,
  LocationPricingResponseDto,
} from "./dto/location-pricing.dto";

@Controller("pricing")
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get("location-based")
  async getLocationBasedPricing(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: LocationPricingQueryDto,
  ): Promise<LocationPricingResponseDto> {
    if (!query.productId) {
      throw new BadRequestException("Missing required parameter: productId");
    }

    return this.pricingService.getLocationBasedPricing(
      query.productId,
      query.quantity,
      query.latitude,
      query.longitude,
    );
  }
}
