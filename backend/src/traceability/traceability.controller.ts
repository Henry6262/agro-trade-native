import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { TraceabilityService } from "./traceability.service";

@ApiTags("traceability")
@Controller("traceability")
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  @Get(":tradeOperationId/provenance")
  @ApiOperation({ summary: "Get public anonymised provenance timeline for a trade" })
  async getProvenance(@Param("tradeOperationId") tradeOperationId: string) {
    return this.traceabilityService.getProvenance(tradeOperationId);
  }

  @Get(":tradeOperationId/qr")
  @ApiOperation({ summary: "Generate QR code for a trade (PNG)" })
  async getQR(@Param("tradeOperationId") tradeOperationId: string, @Res() res: Response) {
    const buffer = await this.traceabilityService.generateQR(tradeOperationId);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `inline; filename="trade-${tradeOperationId}.png"`);
    res.send(buffer);
  }

  @Get(":tradeOperationId/certificate")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get compliance certificate for a completed trade" })
  async getCertificate(@Param("tradeOperationId") tradeOperationId: string) {
    return this.traceabilityService.getCertificate(tradeOperationId);
  }
}
