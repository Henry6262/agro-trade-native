import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { TransportModule } from "../transport/transport.module";
import { NegotiationsModule } from "../negotiations/negotiations.module";
import { TradeEventsModule } from "../trade-events/trade-events.module";
import { EscrowModule } from "../escrow/escrow.module";

// Services
import { TradeOperationService } from "./services/trade-operation.service";
import { ProfitCalculationService } from "./services/profit-calculation.service";
import { PriceScenarioService } from "./services/price-scenario.service";

// Controllers
import { TradeOperationController } from "./controllers/trade-operation.controller";
import { ProfitController } from "./controllers/profit.controller";
import { ScenarioController } from "./controllers/scenario.controller";
import { TestController } from "./controllers/test.controller";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TransportModule,
    forwardRef(() => NegotiationsModule),
    TradeEventsModule,
    EscrowModule,
  ],
  providers: [
    TradeOperationService,
    ProfitCalculationService,
    PriceScenarioService,
  ],
  controllers: [
    TradeOperationController,
    ProfitController,
    ScenarioController,
    TestController,
  ],
  exports: [
    TradeOperationService,
    ProfitCalculationService,
    PriceScenarioService,
  ],
})
export class TradeOperationsModule {}
