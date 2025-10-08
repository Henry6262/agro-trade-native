import { Module } from '@nestjs/common';
import { InspectionController } from './inspection.controller';
import { InspectionService } from './inspection.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [InspectionController],
  providers: [InspectionService],
  exports: [InspectionService],
})
export class InspectionModule {}