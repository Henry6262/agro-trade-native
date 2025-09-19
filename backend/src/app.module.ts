import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    OnboardingModule,
    ProductsModule,
    SellerModule,
    BuyerModule,
    TradeOperationsModule,
    TransportModule,
    NegotiationsModule,
  ],
  providers: [
    // Temporarily disabled for testing
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard, // Global JWT guard
    // },
  ],
})
export class AppModule {}