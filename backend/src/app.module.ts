import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { ProductsModule } from './products/products.module';
import { SellerModule } from './seller/seller.module';
import { BuyerModule } from './buyer/buyer.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TradeOperationsModule } from './trade-operations/trade-operations.module';
import { TransportModule } from './transport/transport.module';
import { NegotiationsModule } from './negotiations/negotiations.module';
import { InspectionModule } from './inspections/inspection.module';
import { NotificationModule } from './notifications/notification.module';
import { TransportCompanyModule } from './transport-company/transport-company.module';
import { SimulationModule } from './simulation/simulation.module';
import { RegionsModule } from './regions/regions.module';
import { CacheModule } from './cache/cache.module';
import { ResponseTimeMiddleware } from './common/middleware/response-time.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule, // Add cache module for performance
    PrismaModule,
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
    NotificationModule,
    SimulationModule,
    RegionsModule,
  ],
  providers: [
    // Temporarily disabled for testing
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard, // Global JWT guard
    // },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply response time logging to all routes
    consumer
      .apply(ResponseTimeMiddleware)
      .forRoutes('*');
  }
}