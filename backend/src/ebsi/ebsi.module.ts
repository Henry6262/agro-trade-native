import { Module } from "@nestjs/common";
import { EbsiService } from "./ebsi.service";
import { EbsiController } from "./ebsi.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [EbsiController],
  providers: [EbsiService],
  exports: [EbsiService],
})
export class EbsiModule {}
