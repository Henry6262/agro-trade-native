import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CommodityRegistryService } from "./commodity-registry.service";

@Controller("commodity-registry")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CommodityRegistryController {
  constructor(
    private readonly commodityRegistryService: CommodityRegistryService,
  ) {}

  @Get()
  findAll() {
    return this.commodityRegistryService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.commodityRegistryService.findById(id);
  }
}
