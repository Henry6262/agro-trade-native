import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RealtimeModule } from "./realtime/realtime.module";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { validate } from "./common/config/env.validation";
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
import { TradeEventsModule } from "./trade-events/trade-events.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { TraceabilityModule } from "./traceability/traceability.module";
import { EscrowModule } from "./escrow/escrow.module";
import { HealthModule } from "./health/health.module";
import { CommodityRegistryModule } from "./commodity-registry/commodity-registry.module";
import { InvestmentsModule } from "./investments/investments.module";

@Module({
  imports: [
    RealtimeModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === "test"
          ? [".env.test", ".env"]
          : ".env",
      validate,
    }),
    ScheduleModule.forRoot(),
    CacheModule,
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
    TradeEventsModule,
    AnalyticsModule,
    TraceabilityModule,
    EscrowModule,
    CommodityRegistryModule,
    InvestmentsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ResponseTimeMiddleware).forRoutes("*");
  }
}
