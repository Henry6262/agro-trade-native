import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

// Services
import { TransportCostService } from "./services/transport-cost.service";
import { RouteOptimizationService } from "./services/route-optimization.service";
import { TransportCostSettingsService } from "./services/transport-settings.service";
import { TransportSettingsAdapterService } from "./services/transport-settings-adapter.service";
import { TransportBiddingService } from "./services/transport-bidding.service";
import { TransportService } from "./services/transport-main.service";

// Controllers
import { TransportController } from "./controllers/transport.controller";
import { TransportBiddingController } from "./controllers/transport-bidding.controller";
import { TransportController as TransportMainController } from "./controllers/transport-main.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    TransportCostService,
    RouteOptimizationService,
    TransportCostSettingsService,
    TransportSettingsAdapterService,
    TransportBiddingService,
    TransportService,
  ],
  controllers: [
    TransportMainController, // must be first — its specific routes (requests/available) beat TransportBiddingController's wildcard (requests/:id)
    TransportController,
    TransportBiddingController,
  ],
  exports: [
    TransportCostService,
    RouteOptimizationService,
    TransportCostSettingsService,
    TransportSettingsAdapterService,
    TransportBiddingService,
    TransportService,
  ],
})
export class TransportModule {}
