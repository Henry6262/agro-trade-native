import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { TradeEventsModule } from "../trade-events/trade-events.module";
import { EscrowModule } from "../escrow/escrow.module";
import { InvestmentsModule } from "../investments/investments.module";
import { TransportModule } from "../transport/transport.module";
import { AuthModule } from "../auth/auth.module";
import { NegotiationsModule } from "../negotiations/negotiations.module";

// Services
import { TradeOperationService } from "./services/trade-operation.service";

// Controllers
import { TradeOperationController } from "./controllers/trade-operation.controller";

@Module({
  imports: [
    PrismaModule,
    RealtimeModule,
    TradeEventsModule,
    EscrowModule,
    InvestmentsModule,
    TransportModule,
    AuthModule,
    forwardRef(() => NegotiationsModule),
  ],
  controllers: [TradeOperationController],
  providers: [TradeOperationService],
  exports: [TradeOperationService],
})
export class TradeOperationsModule {}
