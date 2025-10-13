import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { RegionsService } from './regions.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('regions')
@Controller('regions')
@Public()
@UseInterceptors(CacheInterceptor) // Enable caching for all endpoints in this controller
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  @CacheTTL(3600) // Cache for 1 hour (regions rarely change)
  @ApiOperation({ summary: 'Get all Bulgaria NUTS-2 regions' })
  @ApiResponse({ status: 200, description: 'Returns the 6 Bulgaria regions with coordinates' })
  async getRegions() {
    return this.regionsService.getRegions();
  }

  @Get('cities')
  @CacheTTL(3600) // Cache for 1 hour (cities rarely change)
  @ApiOperation({ summary: 'Get cities by region' })
  @ApiResponse({ status: 200, description: 'Returns major cities for specified region(s)' })
  async getCities(@Query('regionId') regionId?: string) {
    return this.regionsService.getCities(regionId);
  }
}
