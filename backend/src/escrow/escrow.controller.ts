import { Controller, Post, Get, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { EscrowService } from "./escrow.service";
import { CreateEscrowDto, ResolveDisputeDto } from "./dto/escrow.dto";

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
      dto.chain,
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

  @Post(":tradeOperationId/resolve")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Resolve a disputed escrow — release to seller or refund buyer" })
  async resolveDispute(
    @Param("tradeOperationId") tradeOperationId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.escrowService.resolveDispute(tradeOperationId, dto.releaseToBuyer);
  }

  @Post(":tradeOperationId/refund")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Refund escrowed funds to buyer (admin only)" })
  async refund(@Param("tradeOperationId") tradeOperationId: string) {
    return this.escrowService.refund(tradeOperationId);
  }

  @Get(":tradeOperationId/status")
  @Roles("ADMIN")
  @ApiOperation({ summary: "Get on-chain escrow status" })
  async getStatus(@Param("tradeOperationId") tradeOperationId: string) {
    return this.escrowService.getStatus(tradeOperationId);
  }
}
