import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransportCostSettings, TruckType } from '@prisma/client';

/**
 * Adapter service to work with the existing Prisma schema
 * Converts between individual fields and the JSON structure expected by other services
 */
@Injectable()
export class TransportSettingsAdapterService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveSettings(): Promise<any> {
    const settings = await this.prisma.transportCostSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      return this.getDefaultSettings();
    }

    return this.convertToServiceFormat(settings);
  }

  private convertToServiceFormat(settings: TransportCostSettings): any {
    return {
      id: settings.id,
      baseRatePerKm: settings.baseRatePerKm,
      vehicleMultipliers: {
        FLATBED: settings.flatbedMultiplier,
        REFRIGERATED: settings.refrigeratedMultiplier,
        TANKER: settings.tankerMultiplier,
        CONTAINER: settings.containerMultiplier,
        CURTAIN_SIDE: 1.05, // Default value
        BOX_TRUCK: 1.0, // Default value
      },
      distanceTiers: [
        { minKm: 0, maxKm: settings.tier1MaxKm, ratePerKm: settings.tier1Rate?.toNumber() || 0.15 },
        { minKm: settings.tier1MaxKm, maxKm: settings.tier2MaxKm, ratePerKm: settings.tier2Rate?.toNumber() || 0.13 },
        { minKm: settings.tier2MaxKm, maxKm: null, ratePerKm: settings.tier3Rate?.toNumber() || 0.11 },
      ],
      loadingCostPerTon: settings.loadingCostPerTon,
      urgencySurcharge: settings.urgencySurcharge || 0.3,
      bulkDiscountThreshold: 100, // Default value
      bulkDiscountRate: 0.1, // Default value
      isActive: settings.isActive,
      effectiveFrom: settings.effectiveFrom,
      effectiveTo: settings.effectiveTo,
    };
  }

  private getDefaultSettings(): any {
    return {
      id: 'default',
      baseRatePerKm: 0.15,
      vehicleMultipliers: {
        FLATBED: 1.0,
        REFRIGERATED: 1.3,
        TANKER: 1.2,
        CONTAINER: 1.1,
        CURTAIN_SIDE: 1.05,
        BOX_TRUCK: 1.0,
      },
      distanceTiers: [
        { minKm: 0, maxKm: 50, ratePerKm: 0.15 },
        { minKm: 50, maxKm: 200, ratePerKm: 0.13 },
        { minKm: 200, maxKm: null, ratePerKm: 0.11 },
      ],
      loadingCostPerTon: 0.5,
      urgencySurcharge: 0.3,
      bulkDiscountThreshold: 100,
      bulkDiscountRate: 0.1,
      isActive: true,
      effectiveFrom: new Date(),
    };
  }
}