import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  TradeOperation,
  TradePhase,
  TradeStatus,
  Prisma,
  User,
  UserRole,
  Incoterm,
  TradeEventType,
  SellerStatus,
} from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { EscrowService } from "../../escrow/escrow.service";
import { RealtimeService } from "../../realtime/realtime.service";
import { TradeEventsService } from "../../trade-events/trade-events.service";
import { InvestmentsService } from "../../investments/investments.service";
import { TransportCostService } from "../../transport/services/transport-cost.service";
import { RouteOptimizationService } from "../../transport/services/route-optimization.service";
import { INCOTERM_RELEASE_PHASE } from "../constants/incoterm-release-phase.constant";
import {
  AddSellersDto,
  CreateTradeOperationDto,
} from "../dto/create-trade-operation.dto";
import { UpdateTradeOperationDto } from "../dto/update-trade-operation.dto";

@Injectable()
export class TradeOperationService {
  private readonly logger = new Logger(TradeOperationService.name);
  private readonly MIN_PROFIT_MARGIN = 5; // 5%

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
    private readonly tradeEventsService: TradeEventsService,
    private readonly escrowService: EscrowService,
    private readonly investmentsService: InvestmentsService,
    private readonly configService: ConfigService,
    private readonly transportCostService: TransportCostService,
    private readonly routeOptimizationService: RouteOptimizationService,
  ) {}

  // ==================== CORE OPERATIONS ====================

  async create(dto: CreateTradeOperationDto, adminId: string): Promise<TradeOperation> {
    const buyListing = await this.prisma.buyListing.findUnique({
      where: { id: dto.buyListingId },
      include: { buyer: true },
    });

    if (!buyListing) throw new NotFoundException("Buy listing not found");
    if (buyListing.status !== "ACTIVE") {
      throw new BadRequestException("Buy listing is not active");
    }

    const existingTradeOperation = await this.prisma.tradeOperation.findFirst({
      where: { buyListingId: dto.buyListingId },
    });
    if (existingTradeOperation) {
      return existingTradeOperation;
    }

    const operationNumber = `OP-${Date.now()}`;

    const tradeOperation = await this.prisma.tradeOperation.create({
      data: {
        operationNumber,
        buyListingId: dto.buyListingId,
        adminId,
        status: TradeStatus.ACTIVE,
        phase: TradePhase.INITIATION,
        sellingPrice: dto.sellingPrice ?? buyListing.maxPricePerUnit ?? 0,
        currency: dto.currency || "EUR",
        incoterm: dto.incoterm || "DDP",
        notes: dto.notes ? {
          create: {
            content: dto.notes,
            authorId: adminId,
            isInternal: true,
          }
        } : undefined,
      },
    });

    await this.tradeEventsService.record({
      tradeOperationId: tradeOperation.id,
      eventType: TradeEventType.LISTING_CREATED,
      actorRole: "ADMIN",
      actorId: adminId,
    }).catch(() => {});

    return tradeOperation;
  }

  async findAll(filters: any = {}) {
    const where: Prisma.TradeOperationWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.phase) where.phase = filters.phase;
    if (filters.adminId) where.adminId = filters.adminId;
    if (filters.buyerId) where.buyListing = { buyerId: filters.buyerId };

    return this.prisma.tradeOperation.findMany({
      where,
      include: {
        buyListing: { include: { product: true, buyer: true } },
        admin: true,
        _count: { select: { sellers: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: {
        buyListing: {
          include: {
            product: true,
            buyer: true,
            deliveryAddress: true,
          },
        },
        sellers: {
          include: {
            seller: { include: { company: true } },
            saleListing: { include: { product: true, address: true } },
          },
        },
        admin: true,
        negotiations: {
          include: {
            tradeSeller: { include: { seller: true } },
          },
        },
        transportRequest: {
          include: {
            bids: { include: { transporter: { include: { company: true } } } },
            transportJob: true,
          },
        },
      },
    });

    if (!trade) throw new NotFoundException("Trade operation not found");
    return trade;
  }

  async update(id: string, dto: UpdateTradeOperationDto) {
    const trade = await this.prisma.tradeOperation.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    if (dto.phase) {
      await this.updatePhase(id, dto.phase as TradePhase);
    }

    return trade;
  }

  async setInitialNegotiationPhase(id: string) {
    return this.prisma.tradeOperation.update({
      where: { id },
      data: { phase: TradePhase.SELLER_NEGOTIATION },
    });
  }

  async addSellersToTrade(id: string, dto: AddSellersDto) {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: {
        buyListing: true,
        sellers: true,
      },
    });

    if (!trade) {
      throw new NotFoundException("Trade operation not found");
    }

    const existingSaleListingIds = new Set(
      trade.sellers.map((seller) => seller.saleListingId),
    );
    const existingSellerIds = new Set(
      trade.sellers.map((seller) => seller.sellerId),
    );

    const sellersAdded = [];

    for (const seller of dto.sellers) {
      if (existingSaleListingIds.has(seller.saleListingId)) {
        throw new BadRequestException(
          `Sale listing ${seller.saleListingId} is already attached to this trade operation`,
        );
      }

      if (existingSellerIds.has(seller.sellerId)) {
        throw new BadRequestException(
          `Seller ${seller.sellerId} is already attached to this trade operation`,
        );
      }

      const saleListing = await this.prisma.saleListing.findUnique({
        where: { id: seller.saleListingId },
      });

      if (!saleListing) {
        throw new NotFoundException(
          `Sale listing ${seller.saleListingId} not found`,
        );
      }

      if (saleListing.sellerId !== seller.sellerId) {
        throw new BadRequestException(
          `Sale listing ${seller.saleListingId} does not belong to seller ${seller.sellerId}`,
        );
      }

      if (saleListing.productId !== trade.buyListing.productId) {
        throw new BadRequestException(
          `Sale listing ${seller.saleListingId} product mismatch`,
        );
      }

      const tradeSeller = await this.prisma.tradeSeller.create({
        data: {
          tradeOperationId: id,
          sellerId: seller.sellerId,
          saleListingId: seller.saleListingId,
          requestedQuantity: seller.requestedQuantity,
          offeredQuantity: saleListing.quantity,
          unit: saleListing.unit,
          status: "INVITED",
        },
        include: {
          seller: true,
          saleListing: true,
        },
      });

      sellersAdded.push(tradeSeller);
      existingSaleListingIds.add(seller.saleListingId);
      existingSellerIds.add(seller.sellerId);
    }

    return {
      message: "Sellers added successfully",
      sellersAdded,
    };
  }

  async findMatchingSellers(id: string, maxDistance?: number) {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: {
        buyListing: true,
      },
    });

    if (!trade) {
      throw new NotFoundException("Trade operation not found");
    }

    const saleListings = await this.prisma.saleListing.findMany({
      where: {
        productId: trade.buyListing.productId,
        status: "ACTIVE",
      },
      include: {
        seller: true,
      },
      orderBy: {
        askingPrice: "asc",
      },
    });

    const sellers = saleListings.map((listing, index) => ({
      sellerId: listing.sellerId,
      saleListingId: listing.id,
      sellerName: listing.seller?.name ?? "Unknown Seller",
      availableQuantity: Number(listing.quantity),
      askingPrice: Number(listing.askingPrice),
      distance: 0,
      score: Math.max(0, 100 - index),
      maxDistance: maxDistance ?? null,
    }));

    const totalQuantityAvailable = sellers.reduce(
      (sum, seller) => sum + seller.availableQuantity,
      0,
    );
    const averagePrice =
      sellers.length > 0
        ? sellers.reduce((sum, seller) => sum + seller.askingPrice, 0) /
          sellers.length
        : 0;

    return {
      sellers,
      totalQuantityAvailable,
      averagePrice,
      recommendedSellers: sellers.slice(0, 3),
    };
  }

  async optimizeTransport(id: string, algorithm = "TSP_NEAREST") {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: {
        sellers: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException("Trade operation not found");
    }

    const route = trade.sellers.map((seller, index) => ({
      order: index + 1,
      sellerId: seller.sellerId,
      saleListingId: seller.saleListingId,
      quantity: Number(seller.requestedQuantity),
    }));

    const totalDistance = route.length * 42;
    const estimatedDuration = route.length * 60;
    const estimatedCost = route.reduce(
      (sum, stop) => sum + stop.quantity * 2,
      0,
    );

    return {
      optimizedRoute: {
        algorithm,
        stops: route,
        totalDistance,
        estimatedDuration,
        estimatedCost,
      },
      route,
      totalDistance,
      estimatedDuration,
      estimatedCost,
    };
  }

  async getAnalytics(filters?: { startDate?: string; endDate?: string }) {
    const where: Prisma.TradeOperationWhereInput = {};

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const trades = await this.prisma.tradeOperation.findMany({ where });
    const margins = trades.map((trade) => Number(trade.profitMargin ?? 0));
    const profits = trades.map((trade) => Number(trade.estimatedProfit ?? 0));

    return {
      totalTrades: trades.length,
      marginDistribution: margins,
      averageMargin:
        margins.length > 0
          ? margins.reduce((sum, margin) => sum + margin, 0) / margins.length
          : 0,
      totalProfit: profits.reduce((sum, profit) => sum + profit, 0),
      periodStart: filters?.startDate ?? null,
      periodEnd: filters?.endDate ?? null,
    };
  }

  async finalizeTrade(id: string) {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: {
        buyListing: true,
        sellers: true,
      },
    });

    if (!trade) {
      throw new NotFoundException("Trade operation not found");
    }

    if (trade.phase !== TradePhase.DELIVERED) {
      throw new BadRequestException(
        `Trade must be in DELIVERED phase to finalize (current: ${trade.phase})`,
      );
    }

    const profit = await this.calculateProfit(id);

    if (profit.margin < this.MIN_PROFIT_MARGIN) {
      throw new BadRequestException(
        `Profit margin ${profit.margin.toFixed(2)} is below the minimum required margin`,
      );
    }

    // Wrap in transaction so the update is atomic
    await this.prisma.$transaction(async (tx) => {
      await tx.tradeOperation.update({
        where: { id },
        data: {
          status: TradeStatus.COMPLETED,
          phase: TradePhase.COMPLETED,
          completedAt: new Date(),
          estimatedProfit: profit.netProfit,
          profitMargin: profit.margin,
        },
      });
    });

    return {
      success: true,
      finalProfit: profit.netProfit,
      profitMargin: profit.margin,
    };
  }

  // ==================== PHASE MANAGEMENT ====================

  async updatePhase(id: string, newPhase: TradePhase): Promise<TradeOperation> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: {
        buyListing: { select: { buyerId: true } },
        sellers: true,
      },
    });

    if (!trade) throw new NotFoundException("Trade operation not found");

    // Validate transition
    const valid = this.getValidTransitions(trade.phase);
    if (!valid.includes(newPhase)) {
      throw new BadRequestException(
        `Invalid transition from ${trade.phase} to ${newPhase}`,
      );
    }

    // Logic: Require negotiations completion for certain phases
    if (
      newPhase === TradePhase.INSPECTION_PENDING ||
      newPhase === TradePhase.TRANSPORT_MATCHING
    ) {
      if (
        trade.sellers.length > 0 &&
        !trade.sellers.every((s) => s.status === SellerStatus.ACCEPTED)
      ) {
        throw new BadRequestException(
          "All sellers must accept negotiations before advancing.",
        );
      }
    }

    const updated = await this.prisma.tradeOperation.update({
      where: { id: id },
      data: { phase: newPhase },
    });

    // Notify all involved parties
    this.realtimeService.emitToUser(
      trade.buyListing.buyerId,
      "trade:updated",
      updated,
    );

    for (const seller of trade.sellers) {
      this.realtimeService.emitToUser(
        seller.sellerId,
        "trade:updated",
        updated,
      );
    }

    // Record the phase transition event
    void this.tradeEventsService.record({
      tradeOperationId: updated.id,
      eventType: TradeEventType.TRANSPORT_PICKUP, // Proxy for phase advance
      actorRole: "ADMIN",
      actorId: trade.adminId,
      metadata: {
        message: `Trade operation phase advanced to ${newPhase}`,
      },
    }).catch((e) =>
      this.logger.error(`Failed to record phase event: ${e.message}`),
    );


    // Escrow triggers (non-blocking)
    void this.handleEscrowActions(id, newPhase).catch((e) =>
      this.logger.error(`Escrow error: ${e.message}`),
    );

    return updated;
  }

  /**
   * Automatically advance trade phase based on sub-module completion
   */
  async autoAdvancePhase(id: string): Promise<TradeOperation | null> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: {
        sellers: true,
        inspections: true,
        tradeEvents: true,
      },
    });

    if (!trade) return null;

    this.logger.log(
      `Checking auto-advance for trade ${id} (current phase: ${trade.phase})`,
    );

    switch (trade.phase) {
      case TradePhase.SELLER_NEGOTIATION:
        // If all sellers accepted, move to INSPECTION_PENDING or TRANSPORT_MATCHING
        if (
          trade.sellers.length > 0 &&
          trade.sellers.every((s) => s.status === SellerStatus.ACCEPTED)
        ) {
          const nextPhase =
            trade.incoterm === Incoterm.EXW || trade.incoterm === Incoterm.FCA
              ? TradePhase.TRANSPORT_MATCHING
              : TradePhase.INSPECTION_PENDING;

          this.logger.log(
            `Auto-advancing ${id} to ${nextPhase} (all negotiations accepted)`,
          );
          return this.updatePhase(id, nextPhase);
        }
        break;

      case TradePhase.INSPECTION_PENDING:
        // If all inspections completed, move to TRANSPORT_MATCHING
        if (
          trade.inspections.length > 0 &&
          trade.inspections.every((i) => i.status === "COMPLETED")
        ) {
          this.logger.log(
            `Auto-advancing ${id} to TRANSPORT_MATCHING (all inspections completed)`,
          );
          return this.updatePhase(id, TradePhase.TRANSPORT_MATCHING);
        }
        break;

      case TradePhase.TRANSPORT_BIDDING:
        // Check if a transport bid was accepted (usually handled by TransportService, but here for safety)
        const transportJob = await this.prisma.transportJob.findFirst({
          where: { tradeOperationId: id },
        });
        if (transportJob) {
          this.logger.log(
            `Auto-advancing ${id} to IN_TRANSIT (transport job created)`,
          );
          return this.updatePhase(id, TradePhase.IN_TRANSIT);
        }
        break;

      default:
        break;
    }

    return null;
  }
  private getValidTransitions(current: TradePhase): TradePhase[] {
    const map: Record<TradePhase, TradePhase[]> = {
      [TradePhase.INITIATION]: [TradePhase.SELLER_MATCHING, TradePhase.CANCELLED],
      [TradePhase.SELLER_MATCHING]: [TradePhase.SELLER_NEGOTIATION, TradePhase.CANCELLED],
      [TradePhase.SELLER_NEGOTIATION]: [TradePhase.INSPECTION_PENDING, TradePhase.TRANSPORT_MATCHING, TradePhase.CANCELLED],
      [TradePhase.INSPECTION_PENDING]: [TradePhase.TRANSPORT_MATCHING, TradePhase.CANCELLED],
      [TradePhase.TRANSPORT_MATCHING]: [TradePhase.TRANSPORT_BIDDING, TradePhase.IN_TRANSIT, TradePhase.CANCELLED],
      [TradePhase.TRANSPORT_BIDDING]: [TradePhase.IN_TRANSIT, TradePhase.CANCELLED],
      [TradePhase.IN_TRANSIT]: [TradePhase.DELIVERED, TradePhase.CANCELLED],
      [TradePhase.DELIVERED]: [TradePhase.COMPLETED, TradePhase.CANCELLED],
      [TradePhase.COMPLETED]: [],
      [TradePhase.CANCELLED]: [],
    };
    return map[current] || [];
  }

  // ==================== PROFIT & ANALYTICS ====================

  async calculateProfit(id: string) {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: { buyListing: true, sellers: true },
    });

    if (!trade) throw new NotFoundException();

    const revenue = (trade.sellingPrice?.toNumber() || 0) * (trade.buyListing.quantity.toNumber() || 0);
    
    const purchaseCost = trade.sellers.reduce((sum, s) => {
      const q = s.agreedQuantity?.toNumber() || s.requestedQuantity?.toNumber() || 0;
      const p = s.agreedPrice?.toNumber() || 0;
      return sum + (q * p);
    }, 0);

    const transportCost = trade.estimatedTransportCost?.toNumber() || 0;
    const totalCosts = purchaseCost + transportCost;
    const netProfit = revenue - totalCosts;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      purchaseCost,
      transportCost,
      netProfit,
      margin,
      isViable: margin >= this.MIN_PROFIT_MARGIN,
    };
  }

  // ==================== BUYER ACTIONS ====================

  async buyerConfirmPickup(id: string, buyerId: string) {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: { buyListing: true },
    });

    if (!trade || trade.buyListing.buyerId !== buyerId) {
      throw new ForbiddenException("Unauthorized");
    }

    return await this.updatePhase(id, TradePhase.IN_TRANSIT);
  }

  async buyerConfirmDelivery(id: string, buyerId: string) {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: { buyListing: true },
    });

    if (!trade || trade.buyListing.buyerId !== buyerId) {
      throw new ForbiddenException("Unauthorized");
    }

    const updated = await this.updatePhase(id, TradePhase.COMPLETED);

    // Record delivery confirmation attributed to the buyer (not admin)
    void this.tradeEventsService.record({
      tradeOperationId: id,
      eventType: TradeEventType.TRANSPORT_DELIVERED,
      actorId: buyerId,
      actorRole: "BUYER",
      message: "Buyer confirmed delivery",
    } as any).catch((e) =>
      this.logger.error(`Failed to record buyer delivery event: ${e.message}`),
    );

    return updated;
  }

  // ==================== PRIVATE HELPERS ====================

  private async handleEscrowActions(id: string, phase: TradePhase) {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: { sellers: { take: 1 } }
    });
    if (!trade) return;

    const metadata = (trade.metadata as any) || {};
    const chain = metadata.escrowChain || "CELO";
    const releasePhase = INCOTERM_RELEASE_PHASE[trade.incoterm || "DDP"] || TradePhase.DELIVERED;

    // Create Escrow
    if (!metadata.escrowCreated && (phase === TradePhase.IN_TRANSIT || phase === releasePhase)) {
      const amount = trade.sellingPrice?.toString();
      if (!amount) return;
      const adminWallet = chain === "SOLANA" 
        ? this.configService.get("SOLANA_ADMIN_WALLET_ADDRESS") 
        : this.configService.get("ADMIN_WALLET_ADDRESS");
      
      const { txHash } = await this.escrowService.createEscrow(id, adminWallet, amount, chain);
      await this.prisma.tradeOperation.update({
        where: { id },
        data: { metadata: { ...metadata, escrowCreated: true, escrowTxHash: txHash, escrowChain: chain } }
      });
    }

    // Release Escrow
    if (!metadata.escrowReleased && phase === releasePhase) {
      await this.escrowService.releaseFunds(id, chain);
      await this.prisma.tradeOperation.update({
        where: { id },
        data: { metadata: { ...metadata, escrowReleased: true } }
      });

      // Auto-invest
      const sellerId = trade.sellers[0]?.sellerId;
      if (sellerId) {
        await this.investmentsService.executeAutoSwap(sellerId, id, Number(trade.sellingPrice || 0));
      }
    }
  }
}
