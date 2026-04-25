import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { TradeEventsModule } from "../trade-events/trade-events.module";

// Services
import { TransportService } from "./services/transport.service";
import { TransportCostService } from "./services/transport-cost.service";
import { RouteOptimizationService } from "./services/route-optimization.service";
import { TransportCostSettingsService } from "./services/transport-settings.service";

// Controllers
import { TransportController } from "./controllers/transport.controller";

@Module({
  imports: [PrismaModule, AuthModule, TradeEventsModule],
  controllers: [TransportController],
  providers: [
    TransportService,
    TransportCostService,
    RouteOptimizationService,
    TransportCostSettingsService,
  ],
  exports: [
    TransportService,
    TransportCostService,
    RouteOptimizationService,
    TransportCostSettingsService,
  ],
})
export class TransportModule {}
