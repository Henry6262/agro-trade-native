import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketDataService } from './market-data.service';
import { MarketDataController } from './market-data.controller';
import { AlphaVantageService } from './alpha-vantage.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    PrismaModule,
  ],
  controllers: [MarketDataController],
  providers: [MarketDataService, AlphaVantageService],
  exports: [MarketDataService],
})
export class MarketDataModule {}