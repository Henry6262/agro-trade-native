import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { BuyerModule } from "../buyer/buyer.module";

@Module({
  imports: [BuyerModule],
  controllers: [OrdersController],
})
export class OrdersModule {}
