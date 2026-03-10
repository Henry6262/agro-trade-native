import { Controller, Post, Get, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { EscrowService } from "./escrow.service";
import { CreateEscrowDto } from "./dto/escrow.dto";

@ApiTags("escrow")
@Controller("escrow")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Post("create")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Create on-chain escrow for a trade" })
  async createEscrow(@Body() dto: CreateEscrowDto) {
    return this.escrowService.createEscrow(
      dto.tradeOperationId,
      dto.sellerAddress,
      dto.amountEth,
    );
  }

  @Post(":tradeOperationId/release")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Release escrowed funds to seller" })
  async releaseFunds(@Param("tradeOperationId") tradeOperationId: string) {
    return this.escrowService.releaseFunds(tradeOperationId);
  }

  @Post(":tradeOperationId/dispute")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Raise a payment dispute" })
  async raiseDispute(@Param("tradeOperationId") tradeOperationId: string) {
    return this.escrowService.raiseDispute(tradeOperationId);
  }

  @Get(":tradeOperationId/status")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Get on-chain escrow status" })
  async getStatus(@Param("tradeOperationId") tradeOperationId: string) {
    return this.escrowService.getStatus(tradeOperationId);
  }
}
