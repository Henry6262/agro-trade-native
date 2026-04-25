import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CommodityRegistryController } from "./commodity-registry.controller";
import { CommodityRegistryService } from "./commodity-registry.service";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CommodityRegistryController],
  providers: [CommodityRegistryService],
  exports: [CommodityRegistryService],
})
export class CommodityRegistryModule {}
