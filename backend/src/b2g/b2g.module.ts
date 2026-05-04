import { Module } from "@nestjs/common";
import { B2gService } from "./b2g.service";
import { B2gController } from "./b2g.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [B2gController],
  providers: [B2gService],
  exports: [B2gService],
})
export class B2gModule {}
