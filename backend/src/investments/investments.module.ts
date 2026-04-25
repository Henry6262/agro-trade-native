import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { TradeEventsModule } from "../trade-events/trade-events.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { InvestmentsController } from "./investments.controller";
import { InvestmentsService } from "./investments.service";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HttpModule,
    TradeEventsModule,
    RealtimeModule,
  ],
  controllers: [InvestmentsController],
  providers: [InvestmentsService],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
