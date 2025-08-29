import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductUnit } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== PRICING ZONES ====================

  async getAllPricingZones() {
    return this.prisma.pricingZone.findMany({
      include: {
        cities: {
          include: {
            city: {
              include: {
                region: {
                  include: {
                    country: true,
                  },
                },
              },
            },
          },
        },
        productPrices: {
          where: {
            effectiveDate: { lte: new Date() },
            OR: [
              { expiresDate: null },
              { expiresDate: { gte: new Date() } },
            ],
          },
          include: {
            product: true,
          },
        },
        _count: {
          select: {
            cities: true,
            productPrices: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createPricingZone(data: {
    name: string;
    description?: string;
    color?: string;
    marketSize?: string;
    transportAccess?: string;
    storageCapacity?: string;
  }) {
    try {
      return await this.prisma.pricingZone.create({
        data,
        include: {
          cities: {
            include: {
              city: {
                include: {
                  region: {
                    include: {
                      country: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('A pricing zone with this name already exists');
      }
      throw error;
    }
  }

  async updatePricingZone(
    id: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      marketSize?: string;
      transportAccess?: string;
      storageCapacity?: string;
      isActive?: boolean;
    },
  ) {
    const zone = await this.prisma.pricingZone.findUnique({ where: { id } });
    if (!zone) {
      throw new NotFoundException('Pricing zone not found');
    }

    return this.prisma.pricingZone.update({
      where: { id },
      data,
      include: {
        cities: {
          include: {
            city: {
              include: {
                region: {
                  include: {
                    country: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async deletePricingZone(id: string) {
    const zone = await this.prisma.pricingZone.findUnique({ where: { id } });
    if (!zone) {
      throw new NotFoundException('Pricing zone not found');
    }

    // Check if zone has active cities
    const cityCount = await this.prisma.cityPricingZone.count({
      where: { pricingZoneId: id },
    });

    if (cityCount > 0) {
      throw new ConflictException(
        'Cannot delete pricing zone that has cities assigned to it',
      );
    }

    return this.prisma.pricingZone.delete({ where: { id } });
  }

  // ==================== CITIES ====================

  async getAllCities(countryCode?: string, search?: string) {
    const where: any = {
      isActive: true,
    };

    if (countryCode) {
      where.region = {
        country: {
          code: countryCode,
        },
      };
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    return this.prisma.city.findMany({
      where,
      include: {
        region: {
          include: {
            country: true,
          },
        },
        pricingZones: {
          include: {
            pricingZone: true,
          },
        },
      },
      orderBy: [
        { region: { country: { name: 'asc' } } },
        { region: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  async assignCityToPricingZone(
    cityId: string,
    pricingZoneId: string,
    priority: number = 1,
    isDefault: boolean = false,
  ) {
    // Verify city and pricing zone exist
    const city = await this.prisma.city.findUnique({ where: { id: cityId } });
    if (!city) {
      throw new NotFoundException('City not found');
    }

    const zone = await this.prisma.pricingZone.findUnique({
      where: { id: pricingZoneId },
    });
    if (!zone) {
      throw new NotFoundException('Pricing zone not found');
    }

    // Check if assignment already exists
    const existing = await this.prisma.cityPricingZone.findUnique({
      where: {
        cityId_pricingZoneId: {
          cityId,
          pricingZoneId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('City is already assigned to this pricing zone');
    }

    // If this is set as default, remove default from other zones for this city
    if (isDefault) {
      await this.prisma.cityPricingZone.updateMany({
        where: { cityId },
        data: { isDefault: false },
      });
    }

    return this.prisma.cityPricingZone.create({
      data: {
        cityId,
        pricingZoneId,
        priority,
        isDefault,
      },
      include: {
        city: {
          include: {
            region: {
              include: {
                country: true,
              },
            },
          },
        },
        pricingZone: true,
      },
    });
  }

  async removeCityFromPricingZone(cityId: string, pricingZoneId: string) {
    const assignment = await this.prisma.cityPricingZone.findUnique({
      where: {
        cityId_pricingZoneId: {
          cityId,
          pricingZoneId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('City pricing zone assignment not found');
    }

    return this.prisma.cityPricingZone.delete({
      where: {
        cityId_pricingZoneId: {
          cityId,
          pricingZoneId,
        },
      },
    });
  }

  // ==================== PRODUCT PRICES ====================

  async getProductPricesForZone(pricingZoneId: string) {
    return this.prisma.productPrice.findMany({
      where: {
        pricingZoneId,
        effectiveDate: { lte: new Date() },
        OR: [
          { expiresDate: null },
          { expiresDate: { gte: new Date() } },
        ],
      },
      include: {
        product: true,
        pricingZone: true,
      },
      orderBy: {
        product: { displayName: 'asc' },
      },
    });
  }

  async createProductPrice(data: {
    productId: string;
    pricingZoneId: string;
    minPrice: number;
    maxPrice: number;
    currency: string;
    unit: ProductUnit;
    qualityGrade?: string;
    effectiveDate?: Date;
    expiresDate?: Date;
  }) {
    return this.prisma.productPrice.create({
      data: {
        ...data,
        effectiveDate: data.effectiveDate || new Date(),
        confidenceLevel: 0.8, // Default confidence level
        dataSource: 'manual',
      },
      include: {
        product: true,
        pricingZone: true,
      },
    });
  }

  async updateProductPrice(
    id: string,
    data: {
      minPrice?: number;
      maxPrice?: number;
      currency?: string;
      unit?: ProductUnit;
      qualityGrade?: string;
      effectiveDate?: Date;
      expiresDate?: Date;
    },
  ) {
    const price = await this.prisma.productPrice.findUnique({ where: { id } });
    if (!price) {
      throw new NotFoundException('Product price not found');
    }

    return this.prisma.productPrice.update({
      where: { id },
      data,
      include: {
        product: true,
        pricingZone: true,
      },
    });
  }

  async deleteProductPrice(id: string) {
    const price = await this.prisma.productPrice.findUnique({ where: { id } });
    if (!price) {
      throw new NotFoundException('Product price not found');
    }

    return this.prisma.productPrice.delete({ where: { id } });
  }

  async bulkUpdatePricesForZone(
    pricingZoneId: string,
    prices: Array<{
      productId: string;
      minPrice: number;
      maxPrice: number;
      currency: string;
      unit: ProductUnit;
      qualityGrade?: string;
    }>,
  ) {
    const results = [];

    for (const priceData of prices) {
      // Check if price already exists
      const existing = await this.prisma.productPrice.findFirst({
        where: {
          productId: priceData.productId,
          pricingZoneId,
          qualityGrade: priceData.qualityGrade || 'Standard',
          effectiveDate: { lte: new Date() },
          OR: [
            { expiresDate: null },
            { expiresDate: { gte: new Date() } },
          ],
        },
      });

      if (existing) {
        // Update existing price
        const updated = await this.prisma.productPrice.update({
          where: { id: existing.id },
          data: {
            minPrice: priceData.minPrice,
            maxPrice: priceData.maxPrice,
            currency: priceData.currency,
            unit: priceData.unit as ProductUnit,
          },
          include: {
            product: true,
            pricingZone: true,
          },
        });
        results.push(updated);
      } else {
        // Create new price
        const created = await this.createProductPrice({
          ...priceData,
          pricingZoneId,
        });
        results.push(created);
      }
    }

    return results;
  }

  // ==================== MARKET CONDITIONS ====================

  async getMarketConditions(
    pricingZoneId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: any = { pricingZoneId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    return this.prisma.marketCondition.findMany({
      where,
      include: {
        pricingZone: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async updateMarketConditions(
    pricingZoneId: string,
    data: {
      date: Date;
      supplyLevel: number;
      demandLevel: number;
      weatherImpact?: number;
      transportCost?: number;
      notes?: string;
    },
  ) {
    return this.prisma.marketCondition.upsert({
      where: {
        pricingZoneId_date: {
          pricingZoneId,
          date: data.date,
        },
      },
      update: {
        supplyLevel: data.supplyLevel,
        demandLevel: data.demandLevel,
        weatherImpact: data.weatherImpact,
        transportCost: data.transportCost,
        notes: data.notes,
      },
      create: {
        pricingZoneId,
        date: data.date,
        supplyLevel: data.supplyLevel,
        demandLevel: data.demandLevel,
        weatherImpact: data.weatherImpact,
        transportCost: data.transportCost,
        notes: data.notes,
        dataSource: 'manual',
      },
      include: {
        pricingZone: true,
      },
    });
  }

  // ==================== ANALYTICS ====================

  async getPricingAnalytics() {
    const [
      totalZones,
      totalCities,
      totalPrices,
      avgPricesByProduct,
      zoneStats,
    ] = await Promise.all([
      this.prisma.pricingZone.count({ where: { isActive: true } }),
      this.prisma.city.count({ where: { isActive: true } }),
      this.prisma.productPrice.count({
        where: {
          effectiveDate: { lte: new Date() },
          OR: [
            { expiresDate: null },
            { expiresDate: { gte: new Date() } },
          ],
        },
      }),
      this.prisma.productPrice.groupBy({
        by: ['productId'],
        _avg: {
          minPrice: true,
          maxPrice: true,
        },
        _count: true,
        where: {
          effectiveDate: { lte: new Date() },
          OR: [
            { expiresDate: null },
            { expiresDate: { gte: new Date() } },
          ],
        },
      }),
      this.prisma.pricingZone.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              cities: true,
              productPrices: true,
            },
          },
        },
        where: { isActive: true },
      }),
    ]);

    return {
      overview: {
        totalPricingZones: totalZones,
        totalCities: totalCities,
        totalActivePrices: totalPrices,
      },
      productStats: avgPricesByProduct,
      zoneStats,
    };
  }

  async getMapDataForPricingZones() {
    const zones = await this.prisma.pricingZone.findMany({
      where: { isActive: true },
      include: {
        cities: {
          include: {
            city: {
              include: {
                region: {
                  include: {
                    country: true,
                  },
                },
              },
            },
          },
        },
        productPrices: {
          where: {
            effectiveDate: { lte: new Date() },
            OR: [
              { expiresDate: null },
              { expiresDate: { gte: new Date() } },
            ],
          },
          include: {
            product: true,
          },
          take: 3, // Top 3 products for map display
          orderBy: {
            minPrice: 'asc',
          },
        },
      },
    });

    return zones.map(zone => ({
      id: zone.id,
      name: zone.name,
      color: zone.color || '#3B82F6',
      cities: zone.cities.map(cpz => ({
        id: cpz.city.id,
        name: cpz.city.name,
        latitude: cpz.city.latitude,
        longitude: cpz.city.longitude,
        country: cpz.city.region.country.name,
        countryCode: cpz.city.region.country.code,
        flagEmoji: cpz.city.region.country.flagEmoji,
        isDefault: cpz.isDefault,
      })),
      samplePrices: zone.productPrices.map(price => ({
        productName: price.product.displayName,
        range: `${price.currency}${price.minPrice}-${price.maxPrice}`,
        unit: price.unit,
      })),
    }));
  }

  // ==================== IMPORT/EXPORT ====================

  async exportPricingData(format: string = 'csv') {
    const data = await this.prisma.productPrice.findMany({
      where: {
        effectiveDate: { lte: new Date() },
        OR: [
          { expiresDate: null },
          { expiresDate: { gte: new Date() } },
        ],
      },
      include: {
        product: true,
        pricingZone: {
          include: {
            cities: {
              include: {
                city: {
                  include: {
                    region: {
                      include: {
                        country: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (format === 'csv') {
      const csvRows = [
        'Product,Category,Pricing Zone,Cities,Min Price,Max Price,Currency,Quality Grade,Effective Date',
      ];

      data.forEach(price => {
        const cities = price.pricingZone.cities
          .map(cpz => `${cpz.city.name}, ${cpz.city.region.country.code}`)
          .join('; ');

        csvRows.push([
          price.product.displayName,
          price.product.category,
          price.pricingZone.name,
          cities,
          price.minPrice.toString(),
          price.maxPrice.toString(),
          price.currency,
          price.qualityGrade || 'Standard',
          price.effectiveDate.toISOString().split('T')[0],
        ].join(','));
      });

      return csvRows.join('\n');
    }

    return data;
  }

  async importCitiesFromCsv(csvData: string) {
    // Basic CSV parsing - in production, use a proper CSV parser
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    const results = { created: 0, updated: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',');
        const cityData: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          cityData[header.trim()] = values[index]?.trim();
        });

        // Process city data here
        // This would need to be implemented based on your CSV format
        
        results.created++;
      } catch (error) {
        results.errors.push(`Line ${i + 1}: ${(error as Error).message}`);
      }
    }

    return results;
  }
}