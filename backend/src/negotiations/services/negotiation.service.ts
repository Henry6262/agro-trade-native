import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { TradeOperationService } from "../../trade-operations/services/trade-operation.service";
import { InspectionService } from "../../inspections/inspection.service";
import { RealtimeService } from "../../realtime/realtime.service";
import {
  NegotiationStatus,
  TradeStatus,
  SellerStatus,
  TradePhase,
  Prisma,
  InspectionPriority,
  Incoterm,
} from "@prisma/client";
import { CreateOfferDto, CounterOfferDto } from "../dto/negotiation.dto";

export interface NegotiationWithDetails {
  id: string;
  tradeOperationId: string;
  tradeSellerId: string;
  saleListingId?: string;
  status: NegotiationStatus;
  currentOffer: any;
  counterOffer?: any;
  offerHistory: any[];
  finalPrice?: number;
  finalQuantity?: number;
  expiresAt: Date;
  hoursUntilExpiry?: number;
  isExpiringSoon?: boolean;
  tradeSeller: {
    id: string;
    requestedQuantity: number;
    offeredQuantity: number;
    status: string;
    seller: {
      id: string;
      name: string;
      email: string;
    };
    saleListing: {
      id: string;
      quantity: number;
      askingPrice: number;
    };
  };
  profitImpact?: {
    estimatedProfit: number;
    profitMargin: number;
    priceChange?: number;
    warning?: string;
  };
}

export interface NegotiationSummary {
  tradeOperationId: string;
  totalNegotiations: number;
  negotiations: NegotiationWithDetails[];
  summary: {
    pending: number;
    countered: number;
    accepted: number;
    rejected: number;
    expired: number;
    withdrawn: number;
  };
  profitAnalysis?: {
    totalRequestedQuantity: number;
    totalAgreedQuantity: number;
    averageOfferPrice: number;
    averageAgreedPrice: number;
    estimatedTotalCost: number;
    estimatedProfit: number;
    profitMargin: number;
  };
  phaseTransition?: {
    allSellersAccepted: boolean;
    readyForNextPhase: boolean;
    nextPhase?: string;
    message?: string;
  };
}

@Injectable()
export class NegotiationService {
  private readonly logger = new Logger(NegotiationService.name);
  private readonly MIN_PROFIT_MARGIN = 5;
  private readonly TARGET_PROFIT_MARGIN = 7;
  private readonly DEFAULT_EXPIRY_HOURS = 48;
  private readonly MAX_EXTENSIONS = 2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tradeOperationService: TradeOperationService,
    @Inject(forwardRef(() => InspectionService))
    private readonly inspectionService: InspectionService,
    private readonly realtimeService: RealtimeService,
  ) {}

  /**
   * Send initial offer to seller
   */
  async sendOffer(
    tradeOperationId: string,
    dto: CreateOfferDto,
  ): Promise<NegotiationWithDetails> {
    // Validate trade operation
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: true,
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

    if (trade.status !== TradeStatus.ACTIVE) {
      throw new BadRequestException("Trade operation is not active");
    }

    // Validate trade seller belongs to this trade
    const tradeSeller = trade.sellers.find((s) => s.id === dto.tradeSellerId);
    if (!tradeSeller) {
      throw new BadRequestException(
        "Trade seller not part of this trade operation",
      );
    }

    // Validate price and quantity
    if (dto.price <= 0) {
      throw new BadRequestException("Price must be positive");
    }

    if (dto.quantity <= 0) {
      throw new BadRequestException("Quantity must be positive");
    }

    // ── WebSocket Notification Setup ──────────────────────────────────
    const buyerId = trade.buyListing.buyerId;
    const sellerId = tradeSeller.sellerId;
    // ──────────────────────────────────────────────────────────────────

    // Create negotiation
    const offerData = {
      price: dto.price,
      quantity: dto.quantity,
      terms: dto.terms || "Standard terms",
      createdAt: new Date().toISOString(),
      offeredBy: dto.offeredBy || "BUYER",
    };
    const negotiation = await this.prisma.offerNegotiation.upsert({
      where: { tradeSellerId: tradeSeller.id },
      update: {
        currentOffer: offerData,
        expiresAt: new Date(
          Date.now() + (this.DEFAULT_EXPIRY_HOURS || 48) * 60 * 60 * 1000,
        ),
      },
      create: {
        tradeOperationId,
        tradeSellerId: tradeSeller.id,
        status: NegotiationStatus.PENDING,
        currentOffer: offerData,
        offerHistory: [offerData],
        expiresAt: new Date(
          Date.now() + (this.DEFAULT_EXPIRY_HOURS || 48) * 60 * 60 * 1000,
        ),
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: {
              include: {
                product: true,
              },
            },
          },
        },
        tradeOperation: {
          include: {
            buyListing: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    // Update trade seller status
    await this.prisma.tradeSeller.update({
      where: { id: dto.tradeSellerId },
      data: { status: SellerStatus.NEGOTIATING },
    });

    if (trade.phase === TradePhase.INITIATION || trade.phase === TradePhase.SELLER_MATCHING) {
      await this.tradeOperationService.setInitialNegotiationPhase(tradeOperationId);
    }

    // Calculate profit impact
    const profitImpact = await this.calculateProfitImpact(
      trade,
      dto.price,
      dto.quantity,
    );

    const result = this.formatNegotiationWithDetails(negotiation, profitImpact);
    
    // Notify both parties
    this.realtimeService.emitToUser(sellerId, "offer:new", result);
    this.realtimeService.emitToUser(buyerId, "offer:updated", result);
    
    return result;
  }

  /**
   * Send batch offers to multiple sellers
   */
  async sendBatchOffers(
    tradeOperationId: string,
    offers: CreateOfferDto[],
  ): Promise<{
    created: number;
    failed: number;
    negotiations: NegotiationWithDetails[];
    errors?: Array<{ tradeSellerId: string; error: string }>;
  }> {
    const results = {
      created: 0,
      failed: 0,
      negotiations: [] as NegotiationWithDetails[],
      errors: [] as Array<{ tradeSellerId: string; error: string }>,
    };

    for (const offer of offers) {
      try {
        const negotiation = await this.sendOffer(tradeOperationId, offer);
        results.created++;
        results.negotiations.push(negotiation);
      } catch (error) {
        results.failed++;
        results.errors.push({
          tradeSellerId: offer.tradeSellerId,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Create trade sellers and send batch offers in one transaction
   * Used when creating a new trade operation with sellers
   */
  async createTradeSellersWithOffers(
    tradeOperationId: string,
    sellerOffers: Array<{
      saleListingId: string;
      sellerId: string;
      quantity: number;
      offerPrice: number;
    }>,
  ): Promise<{
    tradeSellers: any[];
    negotiations: NegotiationWithDetails[];
  }> {
    const tradeSellers = [];
    const negotiations = [];

    // Validate trade operation exists
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!trade) {
      throw new NotFoundException("Trade operation not found");
    }

    // Create each trade seller and negotiation
    for (const offer of sellerOffers) {
      const listingId = typeof offer.saleListingId === 'object' ? (offer.saleListingId as any).id : offer.saleListingId;
      
      // Validate sale listing
      const saleListing = await this.prisma.saleListing.findUnique({
        where: { id: listingId },
        include: {
          seller: true,
        },
      });

      if (!saleListing) {
        throw new BadRequestException(
          `Sale listing ${listingId} not found`,
        );
      }

      if (saleListing.sellerId !== offer.sellerId) {
        throw new BadRequestException(
          `Sale listing ${listingId} does not belong to seller ${offer.sellerId}`,
        );
      }

      if (saleListing.productId !== trade.buyListing.productId) {
        throw new BadRequestException(
          `Sale listing ${listingId} product mismatch`,
        );
      }

      // Upsert trade seller to handle cases where it already exists
      const tradeSeller = await this.prisma.tradeSeller.upsert({
        where: {
          tradeOperationId_saleListingId: {
            tradeOperationId,
            saleListingId: offer.saleListingId,
          },
        },
        update: {
          requestedQuantity: offer.quantity,
          offeredQuantity: Number(saleListing.quantity),
          unit: saleListing.unit,
        },
        create: {
          tradeOperationId,
          sellerId: offer.sellerId,
          saleListingId: offer.saleListingId,
          requestedQuantity: offer.quantity,
          offeredQuantity: Number(saleListing.quantity),
          unit: saleListing.unit,
          status: "INVITED",
        },
        include: {
          seller: true,
          saleListing: true,
        },
      });

      tradeSellers.push(tradeSeller);

      // Create negotiation with 48-hour expiry
      const offerData = {
        price: offer.offerPrice,
        quantity: offer.quantity,
        terms: "Standard terms",
        createdAt: new Date().toISOString(),
      };
      const negotiation = await this.prisma.offerNegotiation.upsert({
        where: { tradeSellerId: tradeSeller.id },
        update: {
          currentOffer: offerData,
          expiresAt: new Date(
            Date.now() + (this.DEFAULT_EXPIRY_HOURS || 48) * 60 * 60 * 1000,
          ),
        },
        create: {
          tradeOperationId,
          tradeSellerId: tradeSeller.id,
          status: NegotiationStatus.PENDING,
          currentOffer: offerData,
          offerHistory: [offerData],
          expiresAt: new Date(
            Date.now() + (this.DEFAULT_EXPIRY_HOURS || 48) * 60 * 60 * 1000,
          ),
        },
        include: {
          tradeSeller: {
            include: {
              seller: true,
              saleListing: true,
            },
          },
        },
      });

      negotiations.push(this.formatNegotiationWithDetails(negotiation));
    }

    return {
      tradeSellers,
      negotiations,
    };
  }

  /**
   * Get all negotiations for a trade operation
   */
  async getNegotiations(
    tradeOperationId: string,
    status?: NegotiationStatus | NegotiationStatus[],
    limit?: number,
    offset?: number,
  ): Promise<NegotiationSummary> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: true,
      },
    });

    if (!trade) {
      throw new NotFoundException("Trade operation not found");
    }

    // Build where clause
    const where: Prisma.OfferNegotiationWhereInput = {
      tradeOperationId,
    };

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    // Get negotiations with details
    const [negotiations, total] = await Promise.all([
      this.prisma.offerNegotiation.findMany({
        where,
        include: {
          tradeSeller: {
            include: {
              seller: true,
              saleListing: true,
            },
          },
        },
        orderBy: [
          { status: "asc" }, // Priority order
          { expiresAt: "asc" },
        ],
        take: limit,
        skip: offset,
      }),
      this.prisma.offerNegotiation.count({ where }),
    ]);

    // Calculate summary
    const summary: Record<string, number> = {
      pending: 0,
      countered: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      withdrawn: 0,
    };

    const formattedNegotiations: NegotiationWithDetails[] = [];

    for (const nego of negotiations) {
      const statusKey = nego.status.toLowerCase();
      summary[statusKey] = (summary[statusKey] || 0) + 1;

      // Calculate profit impact for each
      const currentOffer = nego.currentOffer as any;
      const profitImpact = await this.calculateProfitImpact(
        trade,
        currentOffer?.price || 0,
        currentOffer?.quantity || 0,
      );

      formattedNegotiations.push(
        this.formatNegotiationWithDetails(nego, profitImpact),
      );
    }

    // Calculate profit analysis
    const profitAnalysis = await this.calculateProfitAnalysis(
      trade,
      negotiations,
    );

    // Check phase transition
    const phaseTransition = await this.checkPhaseTransition(trade);

    return {
      tradeOperationId,
      totalNegotiations: total,
      negotiations: formattedNegotiations,
      summary: {
        pending: summary.pending || 0,
        countered: summary.countered || 0,
        accepted: summary.accepted || 0,
        rejected: summary.rejected || 0,
        expired: summary.expired || 0,
        withdrawn: summary.withdrawn || 0,
      },
      profitAnalysis,
      phaseTransition,
    };
  }

  /**
   * Get single negotiation details
   */
  async getNegotiationById(
    negotiationId: string,
  ): Promise<NegotiationWithDetails> {
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    if (!negotiation) {
      throw new NotFoundException("Negotiation not found");
    }

    const currentOffer = negotiation.currentOffer as any;
    const profitImpact = await this.calculateProfitImpact(
      negotiation.tradeOperation,
      currentOffer?.price || 0,
      currentOffer?.quantity || 0,
    );

    return this.formatNegotiationWithDetails(negotiation, profitImpact);
  }

  /**
   * Counter an offer
   */
  async counterOffer(
    negotiationId: string,
    dto: CounterOfferDto,
    userId?: string,
  ): Promise<NegotiationWithDetails> {
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: {
          include: {
            buyListing: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new NotFoundException("Negotiation not found");
    }

    // ── WebSocket Notification Setup ──────────────────────────────────
    const buyerId = negotiation.tradeOperation.buyListing.buyerId;
    const sellerId = negotiation.tradeSeller.sellerId;
    // ──────────────────────────────────────────────────────────────────

    // Validate status
    if (negotiation.status === NegotiationStatus.ACCEPTED) {
      throw new BadRequestException("Cannot counter an accepted negotiation");
    }

    if (negotiation.status === NegotiationStatus.REJECTED) {
      throw new BadRequestException("Cannot counter a rejected negotiation");
    }

    if (negotiation.status === NegotiationStatus.EXPIRED) {
      throw new BadRequestException("Negotiation has expired");
    }

    // Validate price and quantity
    if (dto.price <= 0) {
      throw new BadRequestException("Price must be positive");
    }

    if (dto.quantity <= 0) {
      throw new BadRequestException("Quantity must be positive");
    }

    // Create counter offer
    const counterOfferData = {
      price: dto.price,
      quantity: dto.quantity,
      terms: dto.terms || "Counter offer",
      reason: dto.reason,
      receivedAt: new Date().toISOString(),
      offeredBy: this.determineOfferedBy(negotiation, userId),
    };

    // Add to offer history
    const offerHistory = [...((negotiation.offerHistory as any[]) || [])];
    offerHistory.push({
      ...counterOfferData,
      isCounterOffer: true,
      createdAt: new Date().toISOString(),
    });

    // Update negotiation
    const updated = await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.COUNTERED,
        counterOffer: counterOfferData,
        offerHistory,
        respondedAt: new Date(),
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    // Calculate profit impact
    const profitImpact = await this.calculateProfitImpact(
      updated.tradeOperation,
      dto.price,
      dto.quantity,
      (negotiation.currentOffer as any)?.price,
    );

    // Add warning if profit too low
    if (profitImpact.profitMargin < this.MIN_PROFIT_MARGIN) {
      profitImpact.warning = `Profit margin below minimum ${this.MIN_PROFIT_MARGIN}%`;
    }

    const result = this.formatNegotiationWithDetails(updated, profitImpact);
    
    // Notify both parties
    this.realtimeService.emitToUser(sellerId, "offer:countered", result);
    this.realtimeService.emitToUser(buyerId, "offer:updated", result);

    return result;
  }

  /**
   * Accept an offer
   */
  async acceptOffer(
    negotiationId: string,
    acceptanceNote?: string,
    userId?: string,
  ): Promise<NegotiationWithDetails> {
    void acceptanceNote;
    void userId;
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: {
          include: {
            buyListing: true,
            sellers: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new NotFoundException("Negotiation not found");
    }

    // ── WebSocket Notification Setup ──────────────────────────────────
    const buyerId = negotiation.tradeOperation.buyListing.buyerId;
    const sellerId = negotiation.tradeSeller.sellerId;
    // ──────────────────────────────────────────────────────────────────

    // Validate status
    if (negotiation.status === NegotiationStatus.ACCEPTED) {
      throw new BadRequestException("Negotiation already accepted");
    }

    if (negotiation.status === NegotiationStatus.REJECTED) {
      throw new BadRequestException("Cannot accept a rejected negotiation");
    }

    if (negotiation.status === NegotiationStatus.EXPIRED) {
      throw new BadRequestException("Negotiation has expired");
    }

    // Check if offer has actually expired (time-based validation)
    const now = new Date();
    const expiresAt = new Date(negotiation.expiresAt);
    if (now > expiresAt) {
      throw new BadRequestException("Negotiation has expired");
    }

    // Determine final price and quantity
    const finalOffer =
      negotiation.status === NegotiationStatus.COUNTERED
        ? (negotiation.counterOffer as any)
        : (negotiation.currentOffer as any);

    const finalPrice = finalOffer.price;
    const finalQuantity = finalOffer.quantity;

    // 1. Update trade seller FIRST so relations fetch it correctly
    await this.prisma.tradeSeller.update({
      where: { id: negotiation.tradeSellerId },
      data: {
        status: SellerStatus.ACCEPTED,
        agreedPrice: finalPrice,
        agreedQuantity: finalQuantity,
      },
    });

    // 2. Update negotiation and fetch with relations
    const updated = await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.ACCEPTED,
        finalPrice,
        finalQuantity,
        respondedAt: new Date(),
        concludedAt: new Date(),
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: {
          include: {
            sellers: true,
          },
        },
      },
    });

    // Update trade operation totals
    await this.updateTradeOperationTotals(negotiation.tradeOperationId);

    // Auto-create inspection request for this accepted seller
    await this.autoCreateInspection(
      negotiation.tradeOperationId,
      negotiation.tradeSeller.saleListingId,
    );

    // Check if all sellers accepted
    const updatedWithRelations = updated as any;
    const allAccepted =
      updatedWithRelations.tradeOperation?.sellers?.every(
        (s: any) => s.status === SellerStatus.ACCEPTED,
      ) || false;

    // Calculate final profit impact
    const profitImpact = await this.calculateProfitImpact(
      updatedWithRelations.tradeOperation,
      finalPrice,
      finalQuantity,
    );
    profitImpact.isFinal = true;

    const result = this.formatNegotiationWithDetails(updated, profitImpact);

    // Add phase transition info
    if (allAccepted) {
      // Trigger auto-advance in trade operation
      await this.tradeOperationService.autoAdvancePhase(
        negotiation.tradeOperationId,
      );

      (result as any)["phaseTransition"] = {
        allSellersAccepted: true,
        readyForNextPhase: true,
        nextPhase:
          negotiation.tradeOperation.incoterm === Incoterm.EXW ||
          negotiation.tradeOperation.incoterm === Incoterm.FCA
            ? "TRANSPORT_MATCHING"
            : "INSPECTION_PENDING",
        message:
          "All sellers have accepted. Ready to proceed to inspection phase.",
      };
    }

    // Add quantity gap info if partial
    const requestedQty = Number(negotiation.tradeSeller.requestedQuantity);
    if (finalQuantity < requestedQty) {
      (result as any)["quantityGap"] = {
        requested: requestedQty,
        secured: finalQuantity,
        shortfall: requestedQty - finalQuantity,
        message: `${requestedQty - finalQuantity} tons still needed`,
      };
    }

    // Notify both parties
    this.realtimeService.emitToUser(sellerId, "offer:accepted", result);
    this.realtimeService.emitToUser(buyerId, "offer:updated", result);

    return result;
  }

  /**
   * Reject an offer
   */
  async rejectOffer(
    negotiationId: string,
    reason?: string,
    userId?: string,
  ): Promise<NegotiationWithDetails> {
    void reason;
    void userId;
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: {
          include: {
            buyListing: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new NotFoundException("Negotiation not found");
    }

    // ── WebSocket Notification Setup ──────────────────────────────────
    const buyerId = negotiation.tradeOperation.buyListing.buyerId;
    const sellerId = negotiation.tradeSeller.sellerId;
    // ──────────────────────────────────────────────────────────────────

    // Validate status
    if (negotiation.status === NegotiationStatus.ACCEPTED) {
      throw new BadRequestException("Cannot reject an accepted negotiation");
    }

    if (negotiation.status === NegotiationStatus.REJECTED) {
      throw new BadRequestException("Negotiation already rejected");
    }

    // Update negotiation
    const updated = await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.REJECTED,
        respondedAt: new Date(),
        concludedAt: new Date(),
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    // Update trade seller
    await this.prisma.tradeSeller.update({
      where: { id: negotiation.tradeSellerId },
      data: {
        status: SellerStatus.REJECTED,
      },
    });

    // Re-activate sale listing
    await this.prisma.saleListing.update({
      where: { id: negotiation.tradeSeller.saleListingId },
      data: { status: "ACTIVE" },
    });

    const result = this.formatNegotiationWithDetails(updated);

    // Notify both parties
    this.realtimeService.emitToUser(sellerId, "offer:rejected", result);
    this.realtimeService.emitToUser(buyerId, "offer:updated", result);

    // Add seller release info
    (result as any)["sellerRelease"] = {
      released: true,
      sellerId: negotiation.tradeSeller.sellerId,
      message: "Seller released and available for other trades",
    };

    // Add replacement suggestions
    const replacements = await this.findReplacementSellers(
      negotiation.tradeOperation,
      Number(negotiation.tradeSeller.requestedQuantity),
    );

    if (replacements.length > 0) {
      (result as any)["replacementSuggestions"] = {
        available: true,
        suggestions: replacements,
      };
    }

    return result;
  }

  /**
   * Withdraw an offer (admin only)
   */
  async withdrawOffer(
    negotiationId: string,
    reason?: string,
    userId?: string,
  ): Promise<NegotiationWithDetails> {
    void reason;
    void userId;
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    if (!negotiation) {
      throw new NotFoundException("Negotiation not found");
    }

    // Only admins can withdraw
    // TODO: Verify user is admin

    // Validate status
    if (negotiation.status === NegotiationStatus.ACCEPTED) {
      throw new BadRequestException("Cannot withdraw accepted negotiation");
    }

    if (negotiation.status === NegotiationStatus.WITHDRAWN) {
      throw new BadRequestException("Negotiation already withdrawn");
    }

    // Update negotiation
    const updated = await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        status: NegotiationStatus.WITHDRAWN,
        concludedAt: new Date(),
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    // Update trade seller
    await this.prisma.tradeSeller.update({
      where: { id: negotiation.tradeSellerId },
      data: {
        status: SellerStatus.WITHDRAWN,
      },
    });

    // Re-activate sale listing
    await this.prisma.saleListing.update({
      where: { id: negotiation.tradeSeller.saleListingId },
      data: { status: "ACTIVE" },
    });

    const result = this.formatNegotiationWithDetails(updated);

    // Add metrics
    const offerHistory = (negotiation.offerHistory as any[]) || [];
    (result as any)["negotiationMetrics"] = {
      rounds: offerHistory.length,
      priceRange: {
        min: Math.min(...offerHistory.map((h) => h.price)),
        max: Math.max(...offerHistory.map((h) => h.price)),
      },
      negotiationDuration:
        new Date().getTime() -
        new Date((negotiation as any).createdAt || new Date()).getTime(),
    };

    return result;
  }

  /**
   * Extend negotiation expiry
   */
  async extendExpiry(
    negotiationId: string,
    hours: number,
    reason?: string,
  ): Promise<NegotiationWithDetails> {
    void reason;
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    if (!negotiation) {
      throw new NotFoundException("Negotiation not found");
    }

    // Check extension count
    const extensionCount = (negotiation as any).extensionCount || 0;
    if (extensionCount >= this.MAX_EXTENSIONS) {
      throw new BadRequestException("Maximum extensions reached");
    }

    const currentExpiry = new Date(negotiation.expiresAt);
    const newExpiry = new Date(
      currentExpiry.getTime() + hours * 60 * 60 * 1000,
    );

    const updated = await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        expiresAt: newExpiry,
      },
      include: {
        tradeSeller: {
          include: {
            seller: true,
            saleListing: true,
          },
        },
        tradeOperation: true,
      },
    });

    const result = this.formatNegotiationWithDetails(updated);

    (result as any)["extension"] = {
      previousExpiry: currentExpiry.toISOString(),
      newExpiry: newExpiry.toISOString(),
      extensionHours: hours,
      totalExtensions: extensionCount + 1,
    };

    return result;
  }

  /**
   * Get all negotiations for a specific seller
   */
  async getNegotiationsBySeller(
    sellerId: string,
    status?: NegotiationStatus | NegotiationStatus[],
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    negotiations: NegotiationWithDetails[];
    total: number;
  }> {
    // Build where clause
    const where: Prisma.OfferNegotiationWhereInput = {
      tradeSeller: {
        sellerId: sellerId,
      },
    };

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    // Get negotiations with details
    const [negotiations, total] = await Promise.all([
      this.prisma.offerNegotiation.findMany({
        where,
        include: {
          tradeSeller: {
            include: {
              seller: true,
              saleListing: {
                include: {
                  product: true,
                },
              },
            },
          },
          tradeOperation: {
            include: {
              buyListing: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
        orderBy: { startedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      this.prisma.offerNegotiation.count({ where }),
    ]);

    const formattedNegotiations = negotiations.map((nego) =>
      this.formatNegotiationWithDetails(nego),
    );

    return {
      negotiations: formattedNegotiations,
      total,
    };
  }

  // Helper methods

  private formatNegotiationWithDetails(
    negotiation: any,
    profitImpact?: any,
  ): NegotiationWithDetails {
    const now = new Date();
    const expiresAt = new Date(negotiation.expiresAt);
    const hoursUntilExpiry =
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    return {
      id: negotiation.id,
      tradeOperationId: negotiation.tradeOperationId,
      tradeSellerId: negotiation.tradeSellerId,
      saleListingId:
        negotiation.tradeSeller?.saleListing?.id ||
        negotiation.tradeSeller?.saleListingId,
      status: negotiation.status,
      currentOffer: negotiation.currentOffer,
      counterOffer: negotiation.counterOffer,
      offerHistory: negotiation.offerHistory || [],
      finalPrice: negotiation.finalPrice,
      finalQuantity: negotiation.finalQuantity,
      expiresAt: negotiation.expiresAt,
      hoursUntilExpiry: Math.max(0, hoursUntilExpiry),
      isExpiringSoon: hoursUntilExpiry < 12 && hoursUntilExpiry > 0,
      tradeSeller: negotiation.tradeSeller,
      profitImpact,
    };
  }

  private async calculateProfitImpact(
    trade: any,
    price: number,
    quantity: number,
    previousPrice?: number,
  ): Promise<any> {
    const sellingPrice = trade.sellingPrice || 0;
    const totalRevenue = Number(sellingPrice) * quantity;
    const purchaseCost = price * quantity;
    const transportCost = Number(trade.estimatedTransportCost || 0);

    const estimatedProfit = totalRevenue - purchaseCost - transportCost;
    const profitMargin =
      totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

    const result: any = {
      estimatedProfit,
      profitMargin,
    };

    if (previousPrice) {
      result.newPurchasePrice = price;
      result.previousPurchasePrice = previousPrice;
      result.priceChange = price - previousPrice;

      const previousProfit =
        totalRevenue - previousPrice * quantity - transportCost;
      result.profitReduction = previousProfit - estimatedProfit;
    }

    return result;
  }

  private async calculateProfitAnalysis(
    trade: any,
    negotiations: any[],
  ): Promise<any> {
    let totalRequestedQuantity = 0;
    let totalAgreedQuantity = 0;
    let totalOfferValue = 0;
    let totalAgreedValue = 0;
    let offerCount = 0;
    let agreedCount = 0;

    for (const nego of negotiations) {
      const quantity = nego.currentOffer?.quantity || 0;
      const price = nego.currentOffer?.price || 0;

      totalRequestedQuantity += quantity;
      totalOfferValue += price * quantity;
      offerCount++;

      if (nego.status === NegotiationStatus.ACCEPTED && nego.finalPrice) {
        totalAgreedQuantity += nego.finalQuantity || 0;
        totalAgreedValue += nego.finalPrice * (nego.finalQuantity || 0);
        agreedCount++;
      }
    }

    const averageOfferPrice =
      offerCount > 0 ? totalOfferValue / totalRequestedQuantity : 0;
    const averageAgreedPrice =
      agreedCount > 0 ? totalAgreedValue / totalAgreedQuantity : 0;

    const sellingPrice = Number(trade.sellingPrice || 0);
    const totalRevenue = sellingPrice * Number(trade.buyListing.quantity);
    const estimatedTotalCost = totalAgreedValue || totalOfferValue;
    const transportCost = Number(trade.estimatedTransportCost || 0);
    const estimatedProfit = totalRevenue - estimatedTotalCost - transportCost;
    const profitMargin =
      totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

    return {
      totalRequestedQuantity,
      totalAgreedQuantity,
      averageOfferPrice,
      averageAgreedPrice,
      estimatedTotalCost,
      estimatedProfit,
      profitMargin,
    };
  }

  private async checkPhaseTransition(trade: any): Promise<any> {
    const allSellers = await this.prisma.tradeSeller.count({
      where: { tradeOperationId: trade.id },
    });

    const acceptedSellers = await this.prisma.tradeSeller.count({
      where: {
        tradeOperationId: trade.id,
        status: SellerStatus.ACCEPTED,
      },
    });

    const allAccepted = allSellers === acceptedSellers && allSellers > 0;

    return {
      allSellersAccepted: allAccepted,
      readyForNextPhase: allAccepted,
      nextPhase: allAccepted
        ? trade.incoterm === Incoterm.EXW || trade.incoterm === Incoterm.FCA
          ? "TRANSPORT_MATCHING"
          : "INSPECTION_PENDING"
        : undefined,
      message: allAccepted
        ? "All sellers have accepted. Ready for inspection phase."
        : `${acceptedSellers} of ${allSellers} sellers accepted`,
    };
  }

  private async updateTradeOperationTotals(
    tradeOperationId: string,
  ): Promise<void> {
    const trade = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        sellers: true,
        buyListing: true,
      },
    });

    if (!trade) return;

    let totalPurchaseCost = 0;

    for (const seller of trade.sellers) {
      if (seller.agreedPrice && seller.agreedQuantity) {
        const price = Number(seller.agreedPrice);
        const quantity = Number(seller.agreedQuantity);
        totalPurchaseCost += price * quantity;
      }
    }

    const sellingPrice = Number(trade.sellingPrice || 0);
    const totalRevenue = sellingPrice * Number(trade.buyListing.quantity);
    const transportCost = Number(trade.estimatedTransportCost || 0);
    const estimatedProfit = totalRevenue - totalPurchaseCost - transportCost;
    await this.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: {
        totalPurchaseCost,
        estimatedProfit,
        actualProfit: estimatedProfit,
      },
    });
  }

  private async findReplacementSellers(
    trade: any,
    quantity: number,
  ): Promise<any[]> {
    // Find available sellers not in current trade
    const existingSellerIds = await this.prisma.tradeSeller.findMany({
      where: { tradeOperationId: trade.id },
      select: { sellerId: true },
    });

    const availableListings = await this.prisma.saleListing.findMany({
      where: {
        status: "ACTIVE",
        quantity: { gte: quantity * 0.8 }, // At least 80% of needed quantity
        productId: trade.buyListing?.productId,
        sellerId: {
          notIn: existingSellerIds.map((s) => s.sellerId),
        },
      },
      include: {
        seller: true,
      },
      orderBy: {
        askingPrice: "asc",
      },
      take: 3,
    });

    return availableListings.map((listing) => ({
      sellerId: listing.sellerId,
      name: listing.seller.name,
      quantity: listing.quantity,
      askingPrice: listing.askingPrice,
      priceComparison: `+${Number(listing.askingPrice || 0) - Number(trade.avgPurchasePrice || 0)} EUR vs average`,
    }));
  }

  private determineOfferedBy(negotiation: any, userId?: string): string {
    // If we have a userId, check against the seller on the negotiation
    if (userId && negotiation.tradeSeller?.sellerId) {
      return userId === negotiation.tradeSeller.sellerId ? "SELLER" : "BUYER";
    }

    // Fallback: if the last counter was from SELLER, this one is from BUYER, and vice versa
    if (negotiation.status === NegotiationStatus.COUNTERED && negotiation.counterOffer?.offeredBy) {
      return negotiation.counterOffer.offeredBy === "SELLER" ? "BUYER" : "SELLER";
    }

    // Default: initial offers come from the buyer/admin side
    return "BUYER";
  }

  /**
   * Auto-create inspection request when offer is accepted
   */
  private async autoCreateInspection(
    tradeOperationId: string,
    saleListingId: string,
  ): Promise<void> {
    try {
      // Check if sale listing is already verified
      const saleListing = await this.prisma.saleListing.findUnique({
        where: { id: saleListingId },
      });

      if (!saleListing) {
        this.logger.warn(
          `Sale listing ${saleListingId} not found for inspection`,
        );
        return;
      }

      // If already verified (has qualityScore and qualityGrade), skip
      if (saleListing.qualityScore && saleListing.qualityGrade) {
        this.logger.log(
          `Sale listing ${saleListingId} already verified. Skipping inspection creation.`,
        );

        // Mark trade seller as verified
        await this.prisma.tradeSeller.updateMany({
          where: {
            tradeOperationId,
            saleListingId,
          },
          data: {
            isVerified: true,
          },
        });

        return;
      }

      // Check if inspection already exists
      const existingInspection = await this.prisma.inspectionRequest.findFirst({
        where: {
          tradeOperationId,
          saleListingId,
        },
      });

      if (existingInspection) {
        this.logger.log(
          `Inspection already exists for sale listing ${saleListingId} in trade ${tradeOperationId}`,
        );
        return;
      }

      // Determine priority based on trade operation urgency
      const tradeOp = await this.prisma.tradeOperation.findUnique({
        where: { id: tradeOperationId },
        include: {
          buyListing: true,
        },
      });

      let priority: InspectionPriority = InspectionPriority.MEDIUM;

      if (tradeOp?.buyListing?.neededBy) {
        const daysUntilNeeded = Math.floor(
          (new Date(tradeOp.buyListing.neededBy).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );

        if (daysUntilNeeded <= 3) {
          priority = InspectionPriority.HIGH;
        } else if (daysUntilNeeded <= 7) {
          priority = InspectionPriority.MEDIUM;
        } else {
          priority = InspectionPriority.LOW;
        }
      }

      // Create inspection request
      const inspection = await this.inspectionService.createInspectionRequest({
        tradeOperationId,
        saleListingId,
        priority,
        requestedDate: new Date(),
        notes: "Auto-created after offer acceptance",
      });

      this.logger.log(
        `✅ Auto-created inspection request ${inspection.id} for sale listing ${saleListingId} ` +
          `in trade operation ${tradeOperationId} with priority ${priority}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to auto-create inspection for sale listing ${saleListingId}: ${error.message}`,
        error.stack,
      );
      // Don't throw - inspection creation failure shouldn't block offer acceptance
    }
  }
}
