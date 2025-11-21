import { Module } from "@nestjs/common";
import { SimulationController } from "./simulation.controller";
import { SimulationService } from "./simulation.service";
import { PrismaModule } from "../prisma/prisma.module";
import { BuyerModule } from "../buyer/buyer.module";
import { SellerModule } from "../seller/seller.module";
import { NegotiationsModule } from "../negotiations/negotiations.module";
import { TransportModule } from "../transport/transport.module";
import { InspectionModule } from "../inspections/inspection.module";
import { TradeOperationsModule } from "../trade-operations/trade-operations.module";

@Module({
  imports: [
    PrismaModule,
    BuyerModule,
    SellerModule,
    NegotiationsModule,
    TransportModule,
    InspectionModule,
    TradeOperationsModule,
  ],
  controllers: [SimulationController],
  providers: [SimulationService],
  exports: [SimulationService],
})
export class SimulationModule {}
