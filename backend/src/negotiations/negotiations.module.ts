import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TradeOperationsModule } from '../trade-operations/trade-operations.module';
import { InspectionModule } from '../inspections/inspection.module';

// Services
import { NegotiationService } from './services/negotiation.service';

// Controllers
import { NegotiationController } from './controllers/negotiation.controller';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => TradeOperationsModule), // Import for ProfitCalculationService
    forwardRef(() => InspectionModule), // Import for InspectionService
  ],
  providers: [NegotiationService],
  controllers: [NegotiationController],
  exports: [NegotiationService],
})
export class NegotiationsModule {}