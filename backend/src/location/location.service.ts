import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

interface GeocodingResult {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface PricingData {
  productId: string;
  productName: string;
  minPrice: number;
  maxPrice: number;
  avgPrice?: number;
  currency: string;
  confidence?: number;
}

@Injectable()
export class LocationService {
  private readonly geocodingApiKey: string;
  private readonly geocodingApiUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

  constructor(
    private configService: ConfigService,
    public prisma: PrismaService,
  ) {
    this.geocodingApiKey = this.configService.get('GOOGLE_MAPS_API_KEY') || '';
  }

  /**
   * Reverse geocode coordinates to get location details
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    try {
      const response = await axios.get(this.geocodingApiUrl, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.geocodingApiKey,
          result_type: 'locality|administrative_area_level_1|country',
        },
      });

      if (response.data.status !== 'OK' || !response.data.results.length) {
        throw new HttpException(
          'Unable to determine location from coordinates',
          HttpStatus.NOT_FOUND,
        );
      }

      const result = response.data.results[0];
      const components = result.address_components;
      
      // Extract location components
      const locationData: GeocodingResult = {
        city: this.extractComponent(components, 'locality'),
        region: this.extractComponent(components, 'administrative_area_level_1'),
        country: this.extractComponent(components, 'country'),
        countryCode: this.extractComponent(components, 'country', true),
        latitude: lat,
        longitude: lng,
        formattedAddress: result.formatted_address,
      };

      return locationData;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new HttpException(
        'Failed to geocode location',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    try {
      const response = await axios.get(this.geocodingApiUrl, {
        params: {
          address,
          key: this.geocodingApiKey,
          region: 'bg|gr', // Bias results to Bulgaria and Greece
        },
      });

      if (response.data.status !== 'OK' || !response.data.results.length) {
        throw new HttpException(
          'Unable to find location for the given address',
          HttpStatus.NOT_FOUND,
        );
      }

      const result = response.data.results[0];
      const components = result.address_components;
      const location = result.geometry.location;

      const locationData: GeocodingResult = {
        city: this.extractComponent(components, 'locality'),
        region: this.extractComponent(components, 'administrative_area_level_1'),
        country: this.extractComponent(components, 'country'),
        countryCode: this.extractComponent(components, 'country', true),
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
      };

      return locationData;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new HttpException(
        'Failed to geocode address',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Get or create city in database
   */
  async findOrCreateCity(locationData: GeocodingResult) {
    // Check if country exists
    let country = await this.prisma.country.findUnique({
      where: { code: locationData.countryCode },
    });

    if (!country) {
      // Create country if it doesn't exist (shouldn't happen for BG/GR)
      const flagEmojis: Record<string, string> = {
        'BG': '🇧🇬',
        'GR': '🇬🇷',
      };
      
      const currencies: Record<string, string> = {
        'BG': 'BGN',
        'GR': 'EUR',
      };

      country = await this.prisma.country.create({
        data: {
          name: locationData.country,
          code: locationData.countryCode,
          flagEmoji: flagEmojis[locationData.countryCode] || '🏳️',
          currencyCode: currencies[locationData.countryCode] || 'EUR',
        },
      });
    }

    // Check if region exists
    let region = await this.prisma.region.findFirst({
      where: {
        countryId: country.id,
        name: locationData.region,
      },
    });

    if (!region) {
      region = await this.prisma.region.create({
        data: {
          countryId: country.id,
          name: locationData.region,
        },
      });
    }

    // Check if city exists
    let city = await this.prisma.city.findFirst({
      where: {
        regionId: region.id,
        name: locationData.city,
      },
    });

    if (!city) {
      city = await this.prisma.city.create({
        data: {
          regionId: region.id,
          name: locationData.city,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        },
      });
    }

    return { city, region, country };
  }

  /**
   * Get pricing for a specific location
   */
  async getPricingForLocation(
    latitude: number,
    longitude: number,
    productIds?: string[],
  ): Promise<PricingData[]> {
    // Get location details
    const locationData = await this.reverseGeocode(latitude, longitude);
    
    // Find or create city
    const { city } = await this.findOrCreateCity(locationData);

    // Find pricing zones for this city
    const cityPricingZones = await this.prisma.cityPricingZone.findMany({
      where: { cityId: city.id },
      include: {
        pricingZone: true,
      },
      orderBy: {
        priority: 'desc',
      },
    });

    if (!cityPricingZones.length) {
      // No specific pricing zones, use default/national pricing
      return this.getDefaultPricing(productIds);
    }

    // Get the primary pricing zone or the highest priority one
    const primaryZone = cityPricingZones.find(cpz => cpz.isDefault) || cityPricingZones[0];

    // If productIds are category names (like WHEAT, CORN), we need to find the actual product IDs
    let actualProductIds: string[] | undefined;
    if (productIds && productIds.length > 0) {
      // Check if these are category names
      const products = await this.prisma.productCatalog.findMany({
        where: {
          OR: [
            // Try matching by name (case-insensitive)
            { name: { in: productIds.map(id => id.toLowerCase().replace(/_/g, ' ')) } },
            // Also try exact ID match in case they're actual IDs
            { id: { in: productIds } }
          ]
        }
      });
      
      actualProductIds = products.map(p => p.id);
      
      // If no products found by name, maybe they're actual IDs already
      if (actualProductIds.length === 0) {
        actualProductIds = productIds;
      }
    }

    // Get current prices for products in this zone
    const now = new Date();
    const productPrices = await this.prisma.productPrice.findMany({
      where: {
        pricingZoneId: primaryZone.pricingZoneId,
        ...(actualProductIds && actualProductIds.length > 0 && { productId: { in: actualProductIds } }),
        effectiveDate: { lte: now },
        OR: [
          { expiresDate: null },
          { expiresDate: { gte: now } },
        ],
      },
      include: {
        product: true,
      },
      orderBy: {
        effectiveDate: 'desc',
      },
    });

    // Get seasonal adjustments
    const currentMonth = now.getMonth() + 1;
    const seasonalAdjustments = await this.prisma.seasonalPricing.findMany({
      where: {
        pricingZoneId: primaryZone.pricingZoneId,
        ...(actualProductIds && actualProductIds.length > 0 && { productId: { in: actualProductIds } }),
        startMonth: { lte: currentMonth },
        endMonth: { gte: currentMonth },
      },
    });

    // Apply seasonal adjustments and format response
    const pricingData: PricingData[] = productPrices.map(price => {
      const seasonal = seasonalAdjustments.find(s => s.productId === price.productId);
      const multiplier = seasonal?.priceMultiplier || 1;

      // Convert product name to category format for frontend
      const categoryName = price.product.name
        .toUpperCase()
        .replace(/ /g, '_')
        .replace(/ALFALFA_PELLETS/, 'ALFALFA')
        .replace(/SOYBEAN_MEAL/, 'SOYBEAN_MEAL');

      return {
        productId: categoryName, // Use category name as ID for frontend compatibility
        productName: price.product.name,
        minPrice: Number(price.minPrice) * multiplier,
        maxPrice: Number(price.maxPrice) * multiplier,
        currency: price.currency,
        confidence: price.confidenceLevel || undefined,
      };
    });

    return pricingData;
  }

  /**
   * Get default pricing when no zone-specific pricing exists
   */
  private async getDefaultPricing(productIds?: string[]): Promise<PricingData[]> {
    // Try to get all product prices from any zone
    const productPrices = await this.prisma.productPrice.findMany({
      where: productIds ? {
        OR: [
          { product: { name: { in: productIds.map(id => id.toLowerCase().replace(/_/g, ' ')) } } },
          { productId: { in: productIds } }
        ]
      } : undefined,
      include: {
        product: true,
      },
      take: 20, // Limit results
    });

    if (productPrices.length > 0) {
      return productPrices.map(price => {
        // Convert product name to category format for frontend
        const categoryName = price.product.name
          .toUpperCase()
          .replace(/ /g, '_')
          .replace(/ALFALFA_PELLETS/, 'ALFALFA')
          .replace(/SOYBEAN_MEAL/, 'SOYBEAN_MEAL');

        return {
          productId: categoryName,
          productName: price.product.name,
          minPrice: Number(price.minPrice),
          maxPrice: Number(price.maxPrice),
          currency: price.currency,
          confidence: 0.5, // Medium confidence for general prices
        };
      });
    }

    // If still no prices, return hardcoded defaults based on metadata
    const defaultPrices: Record<string, { min: number; max: number }> = {
      'WHEAT': { min: 280, max: 350 },
      'CORN': { min: 220, max: 300 },
      'SUNFLOWER': { min: 420, max: 520 },
      'BARLEY': { min: 200, max: 280 },
      'OATS': { min: 180, max: 250 },
      'SOYBEAN_MEAL': { min: 380, max: 480 },
      'PEAS': { min: 320, max: 400 },
      'CANOLA': { min: 450, max: 550 },
      'RAPESEED': { min: 450, max: 550 },
      'WHEAT_BRAN': { min: 160, max: 220 },
      'ALFALFA': { min: 230, max: 320 },
      'OTHER': { min: 200, max: 300 },
    };

    if (productIds) {
      return productIds.map(id => ({
        productId: id,
        productName: id.toLowerCase().replace(/_/g, ' '),
        minPrice: defaultPrices[id]?.min || 200,
        maxPrice: defaultPrices[id]?.max || 300,
        currency: 'EUR',
        confidence: 0.3, // Low confidence for hardcoded prices
      }));
    }

    // Return all defaults if no specific products requested
    return Object.entries(defaultPrices).map(([id, prices]) => ({
      productId: id,
      productName: id.toLowerCase().replace(/_/g, ' '),
      minPrice: prices.min,
      maxPrice: prices.max,
      currency: 'EUR',
      confidence: 0.3,
    }));
  }

  /**
   * Save user's location preference
   */
  async saveUserLocation(
    userId: string,
    latitude: number,
    longitude: number,
    detectionMethod: 'auto' | 'manual' | 'ip-based',
    accuracy?: number,
  ) {
    const locationData = await this.reverseGeocode(latitude, longitude);
    const { city } = await this.findOrCreateCity(locationData);

    // Upsert user location profile
    const locationProfile = await this.prisma.userLocationProfile.upsert({
      where: { userId },
      update: {
        cityId: city.id,
        latitude,
        longitude,
        geocodingSource: detectionMethod,
        geocodingAccuracy: accuracy?.toString(),
        lastLocationUpdate: new Date(),
      },
      create: {
        userId,
        cityId: city.id,
        latitude,
        longitude,
        geocodingSource: detectionMethod,
        geocodingAccuracy: accuracy?.toString(),
      },
    });

    return locationProfile;
  }

  /**
   * Search cities by name
   */
  async searchCities(query: string, countryCode?: string) {
    const cities = await this.prisma.city.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
        ...(countryCode && {
          region: {
            country: {
              code: countryCode,
            },
          },
        }),
      },
      include: {
        region: {
          include: {
            country: true,
          },
        },
      },
      take: 10,
    });

    return cities.map(city => ({
      id: city.id,
      name: city.name,
      region: city.region.name,
      country: city.region.country.name,
      countryCode: city.region.country.code,
      flagEmoji: city.region.country.flagEmoji,
      latitude: city.latitude,
      longitude: city.longitude,
    }));
  }

  /**
   * Get supported countries
   */
  async getSupportedCountries() {
    return this.prisma.country.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        flagEmoji: true,
        currencyCode: true,
      },
    });
  }

  /**
   * Helper to extract component from Google geocoding response
   */
  private extractComponent(
    components: any[],
    type: string,
    shortName = false,
  ): string {
    const component = components.find(c => c.types.includes(type));
    return component ? (shortName ? component.short_name : component.long_name) : '';
  }
}