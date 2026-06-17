import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PlantationRoundsController } from './plantation-rounds.controller';
import { PlantationRoundsService } from './plantation-rounds.service';
import { PlantationNftsService } from './plantation-nfts.service';
import { GroveStakingService } from './grove-staking.service';
import { PlantationEventsService } from './plantation-events.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PlantationRoundsController],
  providers: [
    PlantationRoundsService,
    PlantationNftsService,
    GroveStakingService,
    PlantationEventsService,
  ],
  exports: [PlantationRoundsService],
})
export class PlantationRoundsModule {}
