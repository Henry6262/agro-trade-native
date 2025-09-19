import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Services
import { TransportCostService } from './services/transport-cost.service';
import { RouteOptimizationService } from './services/route-optimization.service';
import { TransportCostSettingsService } from './services/transport-settings.service';
import { TransportSettingsAdapterService } from './services/transport-settings-adapter.service';

// Controllers
import { TransportController } from './controllers/transport.controller';

@Module({
  imports: [PrismaModule],
  providers: [
    TransportCostService,
    RouteOptimizationService,
    TransportCostSettingsService,
    TransportSettingsAdapterService,
  ],
  controllers: [TransportController],
  exports: [
    TransportCostService,
    RouteOptimizationService,
    TransportCostSettingsService,
    TransportSettingsAdapterService,
  ],
})
export class TransportModule {}