import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TradeEventsService } from "./trade-events.service";

@Module({
  imports: [PrismaModule],
  providers: [TradeEventsService],
  exports: [TradeEventsService],
})
export class TradeEventsModule {}
