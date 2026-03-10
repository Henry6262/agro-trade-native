import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RealtimeModule } from "./realtime/realtime.module";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { ProductsModule } from "./products/products.module";
import { SellerModule } from "./seller/seller.module";
import { BuyerModule } from "./buyer/buyer.module";
import { TradeOperationsModule } from "./trade-operations/trade-operations.module";
import { TransportModule } from "./transport/transport.module";
import { NegotiationsModule } from "./negotiations/negotiations.module";
import { InspectionModule } from "./inspections/inspection.module";
import { InspectorModule } from "./modules/inspector/inspector.module";
import { NotificationModule } from "./notifications/notification.module";
import { TransportCompanyModule } from "./transport-company/transport-company.module";
import { SimulationModule } from "./simulation/simulation.module";
import { RegionsModule } from "./regions/regions.module";
import { OrdersModule } from "./orders/orders.module";
import { LocationModule } from "./location/location.module";
import { CacheModule } from "./cache/cache.module";
import { ResponseTimeMiddleware } from "./common/middleware/response-time.middleware";
import { SeedModule } from "./seed/seed.module";

@Module({
  imports: [
    RealtimeModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ScheduleModule.forRoot(),
    CacheModule, // Add cache module for performance
    PrismaModule,
    SeedModule,
    AuthModule,
    OnboardingModule,
    ProductsModule,
    SellerModule,
    BuyerModule,
    TradeOperationsModule,
    TransportModule,
    TransportCompanyModule,
    NegotiationsModule,
    InspectionModule,
    InspectorModule,
    NotificationModule,
    SimulationModule,
    RegionsModule,
    OrdersModule,
    LocationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply response time logging to all routes
    consumer.apply(ResponseTimeMiddleware).forRoutes("*");
  }
}
