import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async geocode(address: string): Promise<GeocodeResult | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'AgroTrade/1.0' },
      });
      const data = (await response.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name,
        };
      }
      return null;
    } catch (error) {
      this.logger.error(`Geocode failed for "${address}"`, error);
      return null;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'AgroTrade/1.0' },
      });
      const data = (await response.json()) as { display_name?: string } | null;
      return data?.display_name ?? null;
    } catch (error) {
      this.logger.error(`Reverse geocode failed for (${lat}, ${lng})`, error);
      return null;
    }
  }
}
