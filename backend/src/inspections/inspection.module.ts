import { Module } from "@nestjs/common";
import { InspectionController } from "./inspection.controller";
import { InspectionService } from "./inspection.service";
import { PrismaModule } from "../prisma/prisma.module";
import { NotificationModule } from "../notifications/notification.module";
import { TransportModule } from "../transport/transport.module";
import { TradeEventsModule } from "../trade-events/trade-events.module";

@Module({
  imports: [PrismaModule, NotificationModule, TransportModule, TradeEventsModule],
  controllers: [InspectionController],
  providers: [InspectionService],
  exports: [InspectionService],
})
export class InspectionModule {}
