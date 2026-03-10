import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as QRCode from "qrcode";

@Injectable()
export class TraceabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getProvenance(tradeOperationId: string) {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      select: { id: true },
    });

    if (!trade) {
      throw new NotFoundException(`Trade operation ${tradeOperationId} not found`);
    }

    const events = await this.prisma.tradeEvent.findMany({
      where: { tradeOperationId },
      orderBy: { timestamp: "asc" },
    });

    return {
      tradeId: tradeOperationId,
      events: events.map((ev) => ({
        type: ev.eventType,
        timestamp: ev.timestamp.toISOString(),
        actorRole: ev.actorRole,
        location: {
          lat: ev.locationLat ?? undefined,
          lng: ev.locationLng ?? undefined,
          region: ev.regionCode ?? undefined,
        },
        grade: ev.inspectionGrade ?? undefined,
        verified: !!ev.blockchainTxHash,
        blockchainTxHash: ev.blockchainTxHash ?? undefined,
      })),
    };
  }

  async generateQR(tradeOperationId: string): Promise<Buffer> {
    const url = `https://agrotrade.app/trace/${tradeOperationId}`;
    return QRCode.toBuffer(url, { type: "png", width: 300, margin: 2 });
  }

  async getCertificate(tradeOperationId: string) {
    const provenance = await this.getProvenance(tradeOperationId);
    const completedEvent = provenance.events.find((e) => e.type === "PAYMENT_RELEASED");
    const inspectionEvent = provenance.events.find((e) => e.type === "INSPECTION_COMPLETED");

    return {
      certificateId: `CERT-${tradeOperationId.slice(0, 8).toUpperCase()}`,
      tradeId: tradeOperationId,
      issuedAt: new Date().toISOString(),
      standard: "GS1 Agricultural Traceability",
      completedAt: completedEvent?.timestamp ?? null,
      inspectionGrade: inspectionEvent?.grade ?? null,
      verified: provenance.events.some((e) => e.verified),
      eventCount: provenance.events.length,
    };
  }
}
