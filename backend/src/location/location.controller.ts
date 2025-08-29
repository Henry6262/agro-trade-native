import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LocationService } from './location.service';
import { Public } from '../auth/decorators/public.decorator';

export class ReverseGeocodeDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;
  
  @IsNumber()
  @Type(() => Number)
  longitude: number;
}

export class GeocodeDto {
  @IsString()
  address: string;
}

export class UpdateLocationDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;
  
  @IsNumber()
  @Type(() => Number)
  longitude: number;
  
  @IsEnum(['auto', 'manual', 'ip-based'])
  detectionMethod: 'auto' | 'manual' | 'ip-based';
  
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  accuracy?: number;
}

export class GetPricingDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;
  
  @IsNumber()
  @Type(() => Number)
  longitude: number;
  
  @IsOptional()
  @IsString({ each: true })
  productIds?: string[];
}

@Controller('location')
export class LocationController {
  constructor(private locationService: LocationService) {}

  @Public()
  @Post('reverse-geocode')
  async reverseGeocode(@Body() dto: ReverseGeocodeDto) {
    return this.locationService.reverseGeocode(dto.latitude, dto.longitude);
  }

  @Public()
  @Post('geocode')
  async geocodeAddress(@Body() dto: GeocodeDto) {
    return this.locationService.geocodeAddress(dto.address);
  }

  @Post('update')
  @UseGuards(JwtAuthGuard)
  async updateUserLocation(
    @Request() req: any,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationService.saveUserLocation(
      req.user.sub,
      dto.latitude,
      dto.longitude,
      dto.detectionMethod,
      dto.accuracy,
    );
  }

  @Public()
  @Post('pricing')
  async getPricing(@Body() dto: GetPricingDto) {
    return this.locationService.getPricingForLocation(
      dto.latitude,
      dto.longitude,
      dto.productIds,
    );
  }

  @Get('user-pricing')
  @UseGuards(JwtAuthGuard)
  async getUserPricing(@Request() req: any) {
    // Get user's saved location and return pricing
    const userProfile = await this.locationService.prisma.userLocationProfile.findUnique({
      where: { userId: req.user.sub },
    });

    if (!userProfile || !userProfile.latitude || !userProfile.longitude) {
      return {
        error: 'No location saved for user',
        pricing: [],
      };
    }

    const pricing = await this.locationService.getPricingForLocation(
      userProfile.latitude,
      userProfile.longitude,
    );

    return {
      location: {
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
        cityId: userProfile.cityId,
      },
      pricing,
    };
  }

  @Public()
  @Get('cities/search')
  async searchCities(
    @Query('q') query: string,
    @Query('country') countryCode?: string,
  ) {
    if (!query || query.length < 2) {
      return [];
    }
    return this.locationService.searchCities(query, countryCode);
  }

  @Public()
  @Get('countries')
  async getSupportedCountries() {
    return this.locationService.getSupportedCountries();
  }
}