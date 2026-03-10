import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";

@ApiTags("analytics")
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("platform-impact")
  @ApiOperation({ summary: "Public platform impact metrics for EU grant reporting" })
  async getPlatformImpact() {
    return this.analyticsService.getPlatformImpact();
  }

  @Get("commodity-breakdown")
  @ApiOperation({ summary: "Commodity volume and trade breakdown" })
  async getCommodityBreakdown() {
    return this.analyticsService.getCommodityBreakdown();
  }

  @Get("regional-heatmap")
  @ApiOperation({ summary: "Regional trade activity heatmap" })
  async getRegionalHeatmap() {
    return this.analyticsService.getRegionalHeatmap();
  }

  @Get("timeline")
  @ApiOperation({ summary: "Trade activity timeline" })
  async getTimeline(@Query("period") period: string = "30d") {
    return this.analyticsService.getTimeline(period);
  }
}
