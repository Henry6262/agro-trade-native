import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TradeOperationsModule } from '../trade-operations/trade-operations.module';

// Services
import { NegotiationService } from './services/negotiation.service';

// Controllers
import { NegotiationController } from './controllers/negotiation.controller';

@Module({
  imports: [
    PrismaModule,
    TradeOperationsModule, // Import for ProfitCalculationService
  ],
  providers: [NegotiationService],
  controllers: [NegotiationController],
  exports: [NegotiationService],
})
export class NegotiationsModule {}