import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('DATABASE_URL'),
        },
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log database queries in development
    if (configService.get('NODE_ENV') === 'development') {
      this.$on('query', (e) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    this.$on('error', (e) => {
      this.logger.error(`Database Error: ${e.message}`);
    });

    this.$on('info', (e) => {
      this.logger.log(`Database Info: ${e.message}`);
    });

    this.$on('warn', (e) => {
      this.logger.warn(`Database Warning: ${e.message}`);
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to PostgreSQL database');
      
      // Test PostGIS extension
      await this.testPostGISConnection();
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL database');
  }

  private async testPostGISConnection() {
    try {
      // Test if PostGIS is available
      const result = await this.$queryRaw`SELECT PostGIS_Version() as version`;
      this.logger.log(`PostGIS is available: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.warn('PostGIS extension may not be available:', error.message);
    }
  }

  // Utility methods for geographic queries
  async findNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number,
    tableName: string,
    limit: number = 50,
  ) {
    const query = `
      SELECT *, 
        ST_Distance(
          location,
          ST_SetSRID(ST_Point($2, $1), 4326)::geography
        ) / 1000 as distance_km
      FROM ${tableName}
      WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_Point($2, $1), 4326)::geography,
        $3 * 1000
      )
      ORDER BY distance_km
      LIMIT $4;
    `;

    return this.$queryRawUnsafe(query, latitude, longitude, radiusKm, limit);
  }

  // Helper to create PostGIS point from coordinates
  createPoint(latitude: number, longitude: number) {
    return `ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)`;
  }

  // Helper to get distance between two points
  async getDistance(point1: any, point2: any): Promise<number> {
    const result = await this.$queryRaw`
      SELECT ST_Distance(${point1}::geography, ${point2}::geography) / 1000 as distance_km
    `;
    return result[0]?.distance_km || 0;
  }

  // Clean shutdown
  async enableShutdownHooks(app: any) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}