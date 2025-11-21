import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { Roles } from "../../auth/decorators/roles.decorator";
import {
  UserRole,
  TradePhase,
  TradeStatus,
  ProductUnit,
  SellerStatus,
} from "@prisma/client";
import { TradeOperationService } from "../services/trade-operation.service";
import { ProfitCalculationService } from "../services/profit-calculation.service";
import { TransportCostService } from "../../transport/services/transport-cost.service";
import { PrismaService } from "../../prisma/prisma.service";
import { NegotiationService } from "../../negotiations/services/negotiation.service";
import {
  AddSellersDto,
  CreateTradeOperationWithOffersDto,
} from "../dto/create-trade-operation.dto";
import {
  UpdateTradeOperationDto,
  FinalizeTradeDto,
} from "../dto/update-trade-operation.dto";
import {
  TradeOperationResponseDto,
  TradeAnalyticsDto,
} from "../dto/trade-operation-response.dto";
import {
  AddSellersResponseDto,
  OptimizeTransportResponseDto,
  FinalizeTradeResponseDto,
  TradeProfitResponseDto,
  TradeSellerDto,
  CalculateTransportRequestDto,
  CalculateTransportResponseDto,
} from "../dto/operations-extra.dto";

@ApiTags("Trade Operations")
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard) // Temporarily disabled for testing
@Controller("trade-operations")
export class TradeOperationController {
  constructor(
    private readonly tradeOperationService: TradeOperationService,
    private readonly profitCalculationService: ProfitCalculationService,
    private readonly transportCostService: TransportCostService,
    private readonly prisma: PrismaService,
    private readonly negotiationService: NegotiationService,
  ) {}

  @Post()
  // @Roles(UserRole.ADMIN) // Temporarily disabled for testing
  @ApiOperation({
    summary: "Create a new trade operation with initial offers to sellers",
    description:
      "Creates a trade operation, adds sellers, and sends initial negotiation offers with 48-hour expiry",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Trade operation created successfully with negotiations",
    schema: {
      example: {
        tradeOperationId: "clxyz123",
        operationNumber: "OP-1234567890-ABC",
        negotiations: [
          {
            id: "nego123",
            sellerId: "seller1",
            status: "PENDING",
            offerPrice: 340,
            quantity: 100,
            expiresAt: "2025-10-13T12:00:00Z",
            hoursUntilExpiry: 48,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid input data",
  })
  async create(
    @Body() createDto: CreateTradeOperationWithOffersDto,
    @Request() req: any,
  ): Promise<any> {
    // Use default admin ID if no user is authenticated
    const adminId = req.user?.id || "cmhhfgc1u0000g1rqjcd4y1lx"; // Default admin from DB (admin@test.com)

    // Validate buy listing exists
    const buyListing = await this.prisma.buyListing.findUnique({
      where: { id: createDto.buyListingId },
      include: {
        buyer: true,
        product: true,
      },
    });

    if (!buyListing) {
      throw new NotFoundException("Buy listing not found");
    }

    if (buyListing.status !== "ACTIVE") {
      throw new BadRequestException("Buy listing is not active");
    }

    // Check if trade operation already exists for this buy listing
    let tradeOperation = await this.prisma.tradeOperation.findUnique({
      where: { buyListingId: createDto.buyListingId },
    });

    // If not exists, create new trade operation
    if (!tradeOperation) {
      const operationNumber = `OP-${Date.now()}`;
      tradeOperation = await this.prisma.tradeOperation.create({
        data: {
          operationNumber,
          buyListingId: createDto.buyListingId,
          adminId,
          phase: "SELLER_NEGOTIATION",
          status: "ACTIVE",
          sellingPrice: buyListing.maxPricePerUnit,
          currency: "EUR",
        },
      });
    }

    // Create trade sellers and negotiations
    const { negotiations } =
      await this.negotiationService.createTradeSellersWithOffers(
        tradeOperation.id,
        createDto.sellers,
      );

    return {
      tradeOperationId: tradeOperation.id,
      operationNumber: tradeOperation.operationNumber,
      phase: tradeOperation.phase,
      status: tradeOperation.status,
      negotiations: negotiations.map((n) => ({
        id: n.id,
        tradeSellerId: n.tradeSellerId,
        saleListingId: n.tradeSeller.saleListing.id,
        sellerId: n.tradeSeller.seller.id,
        sellerName: n.tradeSeller.seller.name,
        status: n.status,
        offerPrice: n.currentOffer?.price,
        quantity: n.currentOffer?.quantity,
        expiresAt: n.expiresAt,
        hoursUntilExpiry: n.hoursUntilExpiry,
      })),
    };
  }

  @Get()
  // @Roles(UserRole.ADMIN) // Temporarily disabled for testing
  @ApiOperation({ summary: "Get all trade operations with filters" })
  @ApiQuery({ name: "phase", enum: TradePhase, required: false })
  @ApiQuery({ name: "status", enum: TradeStatus, required: false })
  @ApiQuery({ name: "minProfitMargin", type: Number, required: false })
  @ApiQuery({
    name: "buyListingId",
    type: String,
    required: false,
    description: "Filter operations by buy listing",
  })
  @ApiQuery({ name: "page", type: Number, required: false, example: 1 })
  @ApiQuery({ name: "limit", type: Number, required: false, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of trade operations with full details",
    schema: {
      example: {
        data: [
          {
            id: "trade123",
            operationNumber: "OP-1234567890",
            phase: "SELLER_NEGOTIATION",
            status: "ACTIVE",
            buyListing: {
              id: "buy123",
              quantity: 500,
              buyer: { id: "buyer1", name: "Buyer Name" },
            },
            sellers: [
              {
                id: "ts1",
                sellerId: "seller1",
                status: "NEGOTIATING",
              },
            ],
            negotiations: [
              {
                id: "nego1",
                status: "PENDING",
                expiresAt: "2025-10-13T12:00:00Z",
              },
            ],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      },
    },
  })
  async findAll(
    @Query("phase") phase?: TradePhase,
    @Query("status") status?: TradeStatus,
    @Query("minProfitMargin") minProfitMargin?: string,
    @Query("page") page = "1",
    @Query("limit") limit = "10",
    @Query("buyListingId") buyListingId?: string,
  ): Promise<any> {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (phase) {
      where.phase = phase;
    }

    if (status) {
      where.status = status;
    }

    if (buyListingId) {
      where.buyListingId = buyListingId;
    }

    // Get trade operations with all related data
    const [operations, total] = await Promise.all([
      this.prisma.tradeOperation.findMany({
        where,
        include: {
          buyListing: {
            include: {
              buyer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                },
              },
            },
          },
          sellers: {
            include: {
              seller: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              saleListing: {
                select: {
                  id: true,
                  quantity: true,
                  askingPrice: true,
                },
              },
            },
          },
          negotiations: {
            include: {
              tradeSeller: {
                include: {
                  seller: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limitNum,
      }),
      this.prisma.tradeOperation.count({ where }),
    ]);

    return {
      data: operations,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  @Get("buy-listing/:buyListingId/latest")
  @ApiOperation({ summary: "Get the latest trade operation for a buy listing" })
  @ApiParam({ name: "buyListingId", description: "Buy listing ID" })
  async getLatestByBuyListing(
    @Param("buyListingId") buyListingId: string,
  ): Promise<any> {
    const tradeOperation =
      await this.tradeOperationService.getLatestByBuyListingId(buyListingId);

    if (!tradeOperation) {
      return {
        data: null,
      };
    }

    return {
      data: tradeOperation,
    };
  }

  @Get("analytics")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get trade analytics and profit metrics" })
  @ApiQuery({ name: "startDate", type: String, required: false })
  @ApiQuery({ name: "endDate", type: String, required: false })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Trade analytics data",
    type: TradeAnalyticsDto,
  })
  async getAnalytics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ): Promise<TradeAnalyticsDto> {
    const dateRange =
      startDate && endDate
        ? {
            start: new Date(startDate),
            end: new Date(endDate),
          }
        : undefined;

    const analytics =
      await this.tradeOperationService.getProfitAnalytics(dateRange);

    return {
      ...analytics,
      periodStart: dateRange?.start,
      periodEnd: dateRange?.end,
    };
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get a specific trade operation" })
  @ApiParam({ name: "id", description: "Trade operation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Trade operation details",
    type: TradeOperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Trade operation not found",
  })
  async findOne(@Param("id") id: string): Promise<TradeOperationResponseDto> {
    const summary =
      await this.tradeOperationService.getTradeOperationSummary(id);
    return this.mapToResponseDto(summary);
  }

  @Get(":id/profit")
  // @Roles(UserRole.ADMIN) // Temporarily disabled for testing
  @ApiOperation({ summary: "Get profit data for a trade operation" })
  @ApiParam({ name: "id", description: "Trade operation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Trade operation profit data",
    type: TradeProfitResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Trade operation not found",
  })
  async getProfit(@Param("id") id: string): Promise<TradeProfitResponseDto> {
    try {
      const tradeOperation =
        await this.tradeOperationService.getTradeOperationSummary(id);

      if (!tradeOperation) {
        throw new NotFoundException("Trade operation not found");
      }

      // Calculate profit using the existing service
      const profitData =
        await this.profitCalculationService.calculateProfit(id);

      return {
        success: true,
        data: profitData,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to calculate profit: ${error.message}`,
      );
    }
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update a trade operation" })
  @ApiParam({ name: "id", description: "Trade operation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Trade operation updated successfully",
    type: TradeOperationResponseDto,
  })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateTradeOperationDto,
  ): Promise<TradeOperationResponseDto> {
    void id;
    void updateDto;
    // This would need to be implemented in the service
    throw new BadRequestException("Update method not yet implemented");
  }

  @Patch(":id/phase")
  // @Roles(UserRole.ADMIN) // Temporarily disabled for testing
  @ApiOperation({ summary: "Update the phase of a trade operation" })
  @ApiParam({ name: "id", description: "Trade operation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Trade operation phase updated successfully",
    type: TradeOperationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Trade operation not found",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid phase transition",
  })
  async updatePhase(
    @Param("id") id: string,
    @Body() body: { phase: TradePhase },
  ): Promise<TradeOperationResponseDto> {
    try {
      // Validate that the trade operation exists
      const existingTrade =
        await this.tradeOperationService.getTradeOperationSummary(id);
      if (!existingTrade) {
        throw new NotFoundException("Trade operation not found");
      }

      // Update the phase using the service
      await this.tradeOperationService.updateTradePhase(id, body.phase);

      // Return the updated trade operation
      const summary =
        await this.tradeOperationService.getTradeOperationSummary(id);
      return this.mapToResponseDto(summary);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update phase: ${error.message}`);
    }
  }

  @Post(":id/sellers")
  // @Roles(UserRole.ADMIN) // Temporarily disabled for testing
  @ApiOperation({ summary: "Add sellers to a trade operation" })
  @ApiParam({ name: "id", description: "Trade operation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Sellers added successfully",
    type: AddSellersResponseDto,
  })
  async addSellers(
    @Param("id") id: string,
    @Body() addSellersDto: AddSellersDto,
  ): Promise<AddSellersResponseDto> {
    const sellers = await this.tradeOperationService.addSellersToTrade(
      id,
      addSellersDto.sellers,
    );

    return {
      message: "Sellers added successfully",
      sellersAdded: sellers.map((seller) => this.mapTradeSeller(seller)),
    };
  }

  @Get(":id/matching-sellers")
  // @Roles(UserRole.ADMIN) // Temporarily disabled for testing
  @ApiOperation({ summary: "Find matching sellers for a trade operation" })
  @ApiParam({ name: "id", description: "Trade operation ID" })
  @ApiQuery({
    name: "quality",
    enum: ["PREMIUM", "STANDARD", "ECONOMY", "ANY"],
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of matching sellers",
  })
  async findMatchingSellers(
    @Param("id") id: string,
    @Query("quality") quality?: string,
  ): Promise<any> {
    const matches = await this.tradeOperationService.findMatchingSellers(id, {
      qualityPreference: quality as any,
    });

    // Map matches to include full saleListing data for frontend
    const enrichedMatches = matches.map((match) => ({
      ...match,
      saleListing: {
        id: match.saleListingId,
        seller: {
          id: match.sellerId,
          name: match.sellerName,
        },
        product: {
          // This would need to be added to the service if needed
          name: "Product",
        },
        unit: "TON",
        address: {
          latitude: match.location.lat,
          longitude: match.location.lng,
        },
      },
    }));

    // Calculate summary data
    const totalQuantityAvailable = matches.reduce(
      (sum, s) => sum + s.availableQuantity,
      0,
    );
    const averagePrice =
      matches.length > 0
        ? matches.reduce((sum, s) => sum + s.askingPrice, 0) / matches.length
        : 0;

    // Recommend top 3 sellers by score
    const recommendedSellers = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.sellerId);

    return {
      sellers: enrichedMatches,
      totalQuantityAvailable,
      averagePrice: Math.round(averagePrice * 100) / 100,
      recommendedSellers,
    };
  }

  @Get(":id/verification-status")
  @ApiOperation({ summary: "Get verification status for a trade operation" })
  @ApiParam({ name: "id", description: "Trade operation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Verification status retrieved",
    schema: {
      example: {
        totalSellers: 3,
        verifiedSellers: 2,
        allVerified: false,
        pendingInspections: [
          {
            id: "insp123",
            saleListingId: "sale123",
            sellerId: "seller123",
            sellerName: "John Doe Farm",
            status: "PENDING",
            priority: "HIGH",
            requestedDate: "2025-10-11T10:00:00Z",
          },
        ],
      },
    },
  })
  async getVerificationStatus(@Param("id") id: string) {
    // Get trade operation with sellers
    const tradeOp = await this.prisma.tradeOperation.findUnique({
      where: { id },
      include: {
        sellers: {
          where: {
            status: { in: ["ACCEPTED", "CONFIRMED"] },
          },
          include: {
            seller: {
              select: {
                id: true,
                name: true,
              },
            },
            saleListing: true,
          },
        },
        inspections: {
          where: {
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
          include: {
            saleListing: {
              include: {
                seller: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            priority: "desc",
          },
        },
      },
    });

    if (!tradeOp) {
      throw new NotFoundException("Trade operation not found");
    }

    const totalSellers = tradeOp.sellers.length;
    const verifiedSellers = tradeOp.sellers.filter((s) => s.isVerified).length;
    const allVerified = totalSellers > 0 && verifiedSellers === totalSellers;

    const pendingInspections = tradeOp.inspections.map((inspection) => ({
      id: inspection.id,
      saleListingId: inspection.saleListingId,
      sellerId: inspection.saleListing.sellerId,
      sellerName: inspection.saleListing.seller.name || "Unknown",
      status: inspection.status,
      priority: inspection.priority,
      requestedDate: inspection.requestedDate,
      scheduledDate: inspection.scheduledDate,
    }));

    return {
      totalSellers,
      verifiedSellers,
      allVerified,
      pendingInspections,
    };
  }

  @Post(":id/optimize-transport")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Optimize transport route for a trade operation" })
  @ApiParam({ name: "id", description: "Trade operation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Transport route optimized",
  })
  async optimizeTransport(
    @Param("id") id: string,
  ): Promise<OptimizeTransportResponseDto> {
    const result = await this.tradeOperationService.optimizeTransport(id);

    return {
      message: "Transport route optimized successfully",
      ...result,
    };
  }

  @Post(":id/finalize")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Finalize a trade operation" })
  @ApiParam({ name: "id", description: "Trade operation ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Trade operation finalized",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Cannot finalize trade operation",
  })
  async finalize(
    @Param("id") id: string,
    @Body() finalizeDto?: FinalizeTradeDto,
  ): Promise<FinalizeTradeResponseDto> {
    void finalizeDto;
    const result = await this.tradeOperationService.finalizeTrade(id);

    if (!result.success) {
      throw new BadRequestException(result.message);
    }

    return result;
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Cancel a trade operation" })
  @ApiParam({ name: "id", description: "Trade operation ID" })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: "Trade operation cancelled",
  })
  async cancel(@Param("id") id: string): Promise<void> {
    void id;
    // This would need to be implemented in the service
    throw new BadRequestException("Cancel method not yet implemented");
  }

  /**
   * Map internal summary to response DTO
   */
  private mapToResponseDto(summary: any): TradeOperationResponseDto {
    return {
      id: summary.id,
      phase: summary.phase,
      status: summary.status,
      buyer: summary.buyer,
      sellers: summary.sellers.map((seller: any) =>
        this.mapTradeSeller(seller),
      ),
      profit: summary.profit,
      transport: summary.transport,
      createdAt: summary.timeline.created,
      updatedAt: summary.timeline.lastUpdated,
      expectedDeliveryDate: summary.timeline.expectedCompletion,
      confirmedAt: summary.confirmedAt,
      completedAt: summary.completedAt,
    };
  }

  private mapTradeSeller(tradeSeller: any): TradeSellerDto {
    return {
      id: tradeSeller.id,
      sellerId: tradeSeller.sellerId || tradeSeller.seller?.id,
      saleListingId: tradeSeller.saleListingId,
      name: tradeSeller.name || tradeSeller.seller?.name,
      requestedQuantity: Number(
        tradeSeller.requestedQuantity ?? tradeSeller.quantity ?? 0,
      ),
      offeredQuantity: Number(tradeSeller.offeredQuantity ?? 0),
      agreedQuantity:
        tradeSeller.agreedQuantity !== undefined &&
        tradeSeller.agreedQuantity !== null
          ? Number(tradeSeller.agreedQuantity)
          : undefined,
      unit: (tradeSeller.unit as ProductUnit) || ProductUnit.TON,
      price: tradeSeller.price ? Number(tradeSeller.price) : undefined,
      status: tradeSeller.status as SellerStatus,
      inspection: tradeSeller.inspection
        ? {
            id: tradeSeller.inspection.id,
            status: tradeSeller.inspection.status,
            priority: tradeSeller.inspection.priority,
            requestedDate: tradeSeller.inspection.requestedDate,
            scheduledDate: tradeSeller.inspection.scheduledDate,
            completedDate: tradeSeller.inspection.completedDate,
            inspector: tradeSeller.inspection.inspector
              ? {
                  id: tradeSeller.inspection.inspector.id,
                  name: tradeSeller.inspection.inspector.name,
                  email: tradeSeller.inspection.inspector.email,
                }
              : null,
          }
        : undefined,
    };
  }

  @Post(":id/request-inspections")
  // @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Request inspections for selected sellers" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Inspection requests created",
  })
  async requestInspections(
    @Param("id") tradeOperationId: string,
    @Body()
    data: {
      sellerIds: string[];
      priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    },
  ) {
    const inspections = await this.tradeOperationService.requestInspections(
      tradeOperationId,
      data.sellerIds,
      data.priority,
    );

    return {
      success: true,
      count: inspections.length,
      inspections,
    };
  }

  @Post("calculate-transport")
  // @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Calculate transport costs for selected sellers to buyer address",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Transport costs calculated",
    type: CalculateTransportResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Invalid request data or addresses not found",
  })
  async calculateTransport(
    @Body() data: CalculateTransportRequestDto,
  ): Promise<CalculateTransportResponseDto> {
    try {
      const warnings: string[] = [];
      const fallbackBuyerLocation = { lat: 42.6977, lng: 23.3219 }; // Sofia city centre fallback

      // Fetch seller addresses with lat/lng
      const sellers = await this.prisma.saleListing.findMany({
        where: {
          sellerId: { in: data.sellerIds },
        },
        include: {
          address: true,
        },
      });

      // Fetch buyer address with lat/lng
      let buyerAddressCoordinates: { lat: number; lng: number } | null = null;
      if (data.buyerAddressId) {
        const buyerAddress = await this.prisma.address.findUnique({
          where: { id: data.buyerAddressId },
        });

        if (
          buyerAddress?.latitude !== null &&
          buyerAddress?.latitude !== undefined &&
          buyerAddress?.longitude !== null &&
          buyerAddress?.longitude !== undefined
        ) {
          buyerAddressCoordinates = {
            lat: buyerAddress.latitude,
            lng: buyerAddress.longitude,
          };
        }
      }

      if (!buyerAddressCoordinates) {
        warnings.push(
          "Buyer delivery address missing coordinates. Using central fallback.",
        );
        buyerAddressCoordinates = fallbackBuyerLocation;
      }

      // Prepare seller addresses with coordinates
      const sellersWithCoordinates = sellers
        .filter((s) => s.address && s.address.latitude && s.address.longitude)
        .map((s) => ({
          id: s.sellerId,
          lat: s.address!.latitude!,
          lng: s.address!.longitude!,
        }));

      const missingSellerCoords = sellers
        .filter(
          (s) => !s.address || !s.address.latitude || !s.address.longitude,
        )
        .map((s) => s.sellerId);

      if (missingSellerCoords.length > 0) {
        warnings.push(
          `Skipped ${missingSellerCoords.length} seller(s) without coordinates.`,
        );
      }

      if (sellersWithCoordinates.length === 0) {
        warnings.push(
          "No sellers with coordinates available for transport estimate.",
        );
        return {
          success: true,
          results: [],
          totalCost: 0,
          currency: "EUR",
          warnings,
        };
      }

      // Calculate transport costs
      const results = await this.transportCostService.calculateTransportCosts(
        sellersWithCoordinates,
        buyerAddressCoordinates,
      );

      // Calculate total cost
      const totalCost = results.reduce((sum, r) => sum + r.transportCost, 0);

      return {
        success: true,
        results,
        totalCost: Math.round(totalCost * 100) / 100,
        currency: "EUR",
        warnings: warnings.length ? warnings : undefined,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to calculate transport costs: ${error.message}`,
      );
    }
  }
}
