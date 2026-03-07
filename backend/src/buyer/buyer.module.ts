import { Module } from "@nestjs/common";
import { BuyerController } from "./buyer.controller";
import { BuyerService } from "./buyer.service";
import { PrismaModule } from "../prisma/prisma.module";
import { TradeOperationsModule } from "../trade-operations/trade-operations.module";

@Module({
  imports: [PrismaModule, TradeOperationsModule],
  controllers: [BuyerController],
  providers: [BuyerService],
  exports: [BuyerService],
})
export class BuyerModule {}
