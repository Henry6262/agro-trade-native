import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Logger,
} from "@nestjs/common";
import { EbsiService, GrainQualityCredential } from "./ebsi.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@Controller("ebsi")
export class EbsiController {
  private readonly logger = new Logger(EbsiController.name);

  constructor(private readonly ebsiService: EbsiService) {}

  /**
   * Resolve a DID to its document.
   * Public endpoint for verifier wallets.
   */
  @Get("did/:did")
  async resolveDid(@Param("did") did: string) {
    const doc = await this.ebsiService.resolveDid(did);
    if (!doc) {
      return { status: "not_found", did };
    }
    return { status: "resolved", did, document: doc };
  }

  /**
   * Check if a DID is a registered Trusted Issuer.
   * Public endpoint — no auth required for TIR lookups.
   */
  @Get("tir/:did")
  async checkTrustedIssuer(@Param("did") did: string) {
    const trusted = await this.ebsiService.isTrustedIssuer(did);
    return { did, trustedIssuer: trusted };
  }

  /**
   * Issue a Grain Quality VC for an inspection.
   * Admin-only: inspectors trigger this via internal flow.
   */
  @Post("vc/issue/:inspectionId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async issueVC(@Param("inspectionId") inspectionId: string) {
    const vc = await this.ebsiService.issueGrainQualityVC(inspectionId);
    if (!vc) {
      return { status: "error", message: "Inspection not found or incomplete" };
    }
    return { status: "issued", vc };
  }

  /**
   * Verify a presented VC.
   * Public endpoint for buyers, banks, customs.
   */
  @Post("vc/verify")
  async verifyVC(@Body() vc: GrainQualityCredential) {
    const valid = await this.ebsiService.verifyVC(vc);
    return {
      status: valid ? "valid" : "invalid",
      vcId: vc.id,
      issuerDid: vc.issuerDid,
    };
  }
}
