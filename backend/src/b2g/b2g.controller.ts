import {
  Controller,
  Get,
  Query,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { B2gService } from "./b2g.service";

@Controller("b2g")
export class B2gController {
  constructor(private readonly b2gService: B2gService) {}

  private validateKey(key: string | undefined): void {
    if (!key || !this.b2gService.validateApiKey(key)) {
      throw new UnauthorizedException("Invalid or missing B2G API key");
    }
  }

  /**
   * Aggregated trade data for public-sector bodies.
   * EU Data Act Art. 14 — voluntary B2G data sharing endpoint.
   */
  @Get("aggregated-trades")
  async getAggregatedTrades(
    @Headers("x-b2g-api-key") apiKey: string,
    @Query("start") start: string,
    @Query("end") end: string,
    @Query("region") region?: string,
    @Query("commodity") commodityType?: string,
  ) {
    this.validateKey(apiKey);

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid start or end date");
    }

    const data = await this.b2gService.getAggregatedTradeData({
      startDate,
      endDate,
      region,
      commodityType,
    });

    return {
      meta: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        region: region || "all",
        commodityType: commodityType || "all",
        recordCount: data.length,
      },
      data,
    };
  }

  /**
   * Real-time food-security snapshot.
   * Designed for DG AGRI "exceptional need" monitoring.
   */
  @Get("food-security-snapshot")
  async getFoodSecuritySnapshot(
    @Headers("x-b2g-api-key") apiKey: string,
  ) {
    this.validateKey(apiKey);
    return this.b2gService.getFoodSecuritySnapshot();
  }
}
