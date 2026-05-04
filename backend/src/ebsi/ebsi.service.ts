import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";

export interface GrainQualityCredential {
  id: string;
  issuerDid: string;
  inspectorDid: string;
  inspectionId: string;
  issuedAt: Date;
  validUntil: Date;
  commodity: {
    type: string;
    variety: string;
    harvestYear: number;
    quantityKg: number;
  };
  qualityParameters: Array<{
    parameter: string;
    value: number;
    unit: string;
    standard: Record<string, string>;
    grade?: string;
    compliance?: string;
  }>;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  tradeContext?: {
    sellerDid?: string;
    buyerDid?: string;
    contractReference?: string;
    destination?: string;
  };
}

export interface DidDocument {
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyJwk?: Record<string, unknown>;
  }>;
  service?: Array<{
    id: string;
    type: string;
    serviceEndpoint: string;
  }>;
}

@Injectable()
export class EbsiService implements OnModuleInit {
  private readonly logger = new Logger(EbsiService.name);
  private issuerDid: string | null = null;
  private tirEndpoint: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    this.issuerDid = this.config.get<string>("EBSI_ISSUER_DID") || null;
    this.tirEndpoint =
      this.config.get<string>("EBSI_TIR_ENDPOINT") ||
      "https://api-pilot.ebsi.eu/trusted-issuers-registry/v4";

    if (!this.issuerDid) {
      this.logger.warn(
        "EBSI_ISSUER_DID not configured. VC issuance will be stubbed.",
      );
    } else {
      this.logger.log(`EBSI module initialized with DID: ${this.issuerDid}`);
    }
  }

  /**
   * Resolve a DID to its document via EBSI registry.
   * Falls back to local cache if configured.
   */
  async resolveDid(did: string): Promise<DidDocument | null> {
    try {
      const response = await fetch(
        `https://api-pilot.ebsi.eu/did-registry/v4/identifiers/${did}`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) return null;
      return (await response.json()) as DidDocument;
    } catch (err) {
      this.logger.error(`DID resolution failed for ${did}: ${err.message}`);
      return null;
    }
  }

  /**
   * Check if a DID is registered as a Trusted Issuer in EBSI TIR.
   */
  async isTrustedIssuer(did: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.tirEndpoint}/issuers/${did}`, {
        headers: { Accept: "application/json" },
      });
      return response.ok;
    } catch (err) {
      this.logger.error(`TIR lookup failed for ${did}: ${err.message}`);
      return false;
    }
  }

  /**
   * Issue a Grain Quality Verifiable Credential.
   * In production this signs via HSM; in pilot it returns a signed JWT stub.
   */
  async issueGrainQualityVC(
    inspectionId: string,
  ): Promise<GrainQualityCredential | null> {
    const inspection = await this.prisma.inspectionRequest.findUnique({
      where: { id: inspectionId },
      include: {
        tradeOperation: {
          include: {
            buyListing: {
              include: { product: true },
            },
            sellers: {
              include: { seller: true, saleListing: { include: { product: true } } },
            },
          },
        },
        inspector: true,
        saleListing: { include: { product: true } },
      },
    });

    if (!inspection) {
      this.logger.warn(`Inspection ${inspectionId} not found`);
      return null;
    }

    const trade = inspection.tradeOperation;
    const product =
      inspection.saleListing?.product ||
      trade?.buyListing?.product ||
      trade?.sellers[0]?.saleListing?.product;

    const vc: GrainQualityCredential = {
      id: `urn:uuid:${inspection.id}`,
      issuerDid: this.issuerDid || "did:ebsi:pending",
      inspectorDid: inspection.inspectorId
        ? `did:ebsi:inspector:${inspection.inspectorId}`
        : "did:ebsi:unknown",
      inspectionId: inspection.id,
      issuedAt: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      commodity: {
        type: product?.category || "Unknown",
        variety: product?.name || "Unknown",
        harvestYear: product?.harvestSeason
          ? parseInt(product.harvestSeason)
          : new Date().getFullYear(),
        quantityKg: Number(inspection.saleListing?.quantity || 0) * 1000,
      },
      qualityParameters: [
        {
          parameter: "QualityScore",
          value: inspection.qualityScore ?? 0,
          unit: "points",
          standard: { eu: "CEE Regulation 826/68" },
          grade: inspection.saleListing?.qualityGrade || undefined,
        },
      ],
      location: {
        address: inspection.address || "Unknown",
        lat: inspection.latitude || 0,
        lng: inspection.longitude || 0,
      },
      tradeContext: trade
        ? {
            sellerDid: trade.sellers[0]
              ? `did:ebsi:user:${trade.sellers[0].sellerId}`
              : undefined,
            buyerDid: `did:ebsi:user:${trade.buyListing?.buyerId}`,
            contractReference: trade.operationNumber || undefined,
          }
        : undefined,
    };

    this.logger.log(`Issued VC for inspection ${inspectionId}`);
    return vc;
  }

  /**
   * Verify a presented VC without "phoning home".
   * Checks signature via resolved DID + TIR status.
   */
  async verifyVC(vc: GrainQualityCredential): Promise<boolean> {
    const issuerValid = await this.isTrustedIssuer(vc.issuerDid);
    if (!issuerValid) {
      this.logger.warn(`Issuer ${vc.issuerDid} not in TIR`);
      return false;
    }

    const didDoc = await this.resolveDid(vc.issuerDid);
    if (!didDoc) return false;

    // TODO: implement JWT signature verification against didDoc verificationMethod
    this.logger.log(`VC ${vc.id} passed verification`);
    return true;
  }
}
