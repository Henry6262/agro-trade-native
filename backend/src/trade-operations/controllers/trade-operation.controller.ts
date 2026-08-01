import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Request,
  BadRequestException,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { TradeOperationService } from "../services/trade-operation.service";
import { ProfitCalculationService } from "../services/profit-calculation.service";
import { NegotiationService } from "../../negotiations/services/negotiation.service";
import { TransportCostService } from "../../transport/services/transport-cost.service";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole, TradePhase, NegotiationStatus } from "@prisma/client";
import {
  AddSellersDto,
  CreateOffersDto,
  CreateTradeOperationDto,
} from "../dto/create-trade-operation.dto";
import { UpdateTradeOperationDto } from "../dto/update-trade-operation.dto";
import {
  CalculateTransportRequestDto,
  CalculateTransportResponseDto,
} from "../dto/operations-extra.dto";
import {
  BatchOfferDto,
  CreateOfferDto,
} from "../../negotiations/dto/negotiation.dto";

@ApiTags("Trade Operations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("trade-operations")
export class TradeOperationController {
  constructor(
    private readonly tradeOperationService: TradeOperationService,
    private readonly profitCalculationService: ProfitCalculationService,
    private readonly negotiationService: NegotiationService,
    private readonly transportCostService: TransportCostService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Create a new trade operation" })
  async create(@Body() dto: CreateTradeOperationDto, @Request() req: any) {
    if (dto.sellers === undefined) {
      throw new BadRequestException("sellers is required");
    }

    const adminId = dto.adminId ?? req.user.id;
    const sellers = Array.isArray(dto.sellers) ? dto.sellers : [];
    const tradeOperation = await this.tradeOperationService.create(dto, adminId);

    let negotiations: unknown[] = [];
    let responsePhase = tradeOperation.phase;

    const normalizedSellerOffers = sellers
      .filter(
        (seller: any) =>
          seller?.saleListingId &&
          seller?.sellerId &&
          typeof seller?.offerPrice === "number" &&
          typeof (seller?.quantity ?? seller?.requestedQuantity) === "number",
      )
      .map((seller: any) => ({
        saleListingId: seller.saleListingId,
        sellerId: seller.sellerId,
        quantity: seller.quantity ?? seller.requestedQuantity,
        offerPrice: seller.offerPrice,
      }));

    if (normalizedSellerOffers.length > 0) {
      const created = await this.negotiationService.createTradeSellersWithOffers(
        tradeOperation.id,
        normalizedSellerOffers,
      );

      negotiations = created.negotiations;
      responsePhase = TradePhase.SELLER_NEGOTIATION;

      if (tradeOperation.phase !== TradePhase.SELLER_NEGOTIATION) {
        await this.tradeOperationService.setInitialNegotiationPhase(
          tradeOperation.id,
        );
      }
    } else if (dto.sellers !== undefined) {
      responsePhase = TradePhase.SELLER_NEGOTIATION;
    }

    return {
      ...tradeOperation,
      tradeOperationId: tradeOperation.id,
      phase: responsePhase,
      negotiations,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get all trade operations" })
  async findAll(@Query() query: any) {
    return await this.tradeOperationService.findAll(query);
  }

  @Get("analytics")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get trade operation analytics" })
  async getAnalytics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return await this.tradeOperationService.getAnalytics({ startDate, endDate });
  }

  @Get(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get trade operation by ID" })
  async findOne(@Param("id") id: string) {
    return await this.tradeOperationService.findOne(id);
  }

  /**
   * Backward-compatible negotiation route used by the mobile client.
   * The canonical route remains /negotiations/trade-operations/:id/offers.
   */
  @Post(":id/offers")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Send an offer for a trade operation" })
  async sendOffer(
    @Param("id") id: string,
    @Body() dto: CreateOfferDto,
  ) {
    const negotiation = await this.negotiationService.sendOffer(id, dto);
    return { success: true, data: negotiation };
  }

  /**
   * Backward-compatible batch route used by the mobile client.
   */
  @Post(":id/offers/batch")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Send batch offers for a trade operation" })
  async sendBatchOffers(
    @Param("id") id: string,
    @Body() dto: BatchOfferDto,
  ) {
    const result = await this.negotiationService.sendBatchOffers(
      id,
      dto.offers,
    );
    return { success: true, data: result };
  }

  /**
   * Backward-compatible list route used by the mobile client.
   */
  @Get(":id/negotiations")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get negotiations for a trade operation" })
  async getNegotiations(
    @Param("id") id: string,
    @Query("status") status?: string,
    @Query("limit") limit = "100",
    @Query("offset") offset = "0",
  ) {
    let statusFilter: NegotiationStatus | NegotiationStatus[] | undefined;
    if (status) {
      statusFilter = status.includes(",")
        ? (status
            .split(",")
            .map((value) => value.trim().toUpperCase()) as NegotiationStatus[])
        : (status.toUpperCase() as NegotiationStatus);
    }

    const data = await this.negotiationService.getNegotiations(
      id,
      statusFilter,
      Number(limit),
      Number(offset),
    );
    return { success: true, data };
  }

  /**
   * Backward-compatible expiring-negotiations route used by the mobile client.
   */
  @Get(":id/negotiations/expiring")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get expiring negotiations for a trade operation" })
  async getExpiringNegotiations(
    @Param("id") id: string,
    @Query("hours") hours = "24",
  ) {
    const data = await this.negotiationService.getNegotiations(
      id,
      NegotiationStatus.PENDING,
      100,
      0,
    );
    const now = Date.now();
    const threshold = now + Number(hours) * 60 * 60 * 1000;
    const expiringSoon = data.negotiations.filter((negotiation) => {
      const expiry = new Date(negotiation.expiresAt).getTime();
      return expiry > now && expiry <= threshold;
    });
    const expired = data.negotiations.filter(
      (negotiation) => new Date(negotiation.expiresAt).getTime() <= now,
    );

    return {
      success: true,
      data: {
        expiringSoon: expiringSoon.map((negotiation) => ({
          id: negotiation.id,
          hoursRemaining: negotiation.hoursUntilExpiry || 0,
          urgency:
            (negotiation.hoursUntilExpiry || 0) < 6
              ? "HIGH"
              : (negotiation.hoursUntilExpiry || 0) < 12
                ? "MEDIUM"
                : "LOW",
          recommendedAction:
            (negotiation.hoursUntilExpiry || 0) < 6
              ? "Follow up immediately"
              : "Schedule follow-up",
        })),
        summary: {
          total: data.negotiations.length,
          expiringSoon: expiringSoon.length,
          expired: expired.length,
        },
      },
    };
  }

  @Post(":id/sellers")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Add sellers to a trade operation" })
  async addSellers(@Param("id") id: string, @Body() dto: AddSellersDto) {
    return await this.tradeOperationService.addSellersToTrade(id, dto);
  }

  @Post(":id/create-offers")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create offers against a trade operation with price validation",
    description:
      "Validates each offer price against the buyer's maxPricePerUnit (hard reject above max; hard reject below 10% sanity floor), then creates trade sellers + negotiations in batch.",
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: "Negotiations created" })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Price validation failed" })
  async createOffers(@Param("id") id: string, @Body() dto: CreateOffersDto) {
    await this.negotiationService.validateOfferPrices(id, dto.offers);
    const result = await this.negotiationService.createTradeSellersWithOffers(
      id,
      dto.offers,
    );
    await this.tradeOperationService.setInitialNegotiationPhase(id);
    return result;
  }

  @Get(":id/matching-sellers")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Find matching sellers for a trade operation" })
  async findMatchingSellers(
    @Param("id") id: string,
    @Query("maxDistance") maxDistance?: string,
  ) {
    return await this.tradeOperationService.findMatchingSellers(
      id,
      maxDistance ? Number(maxDistance) : undefined,
    );
  }

  @Post(":id/optimize-transport")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Optimize transport for a trade operation" })
  async optimizeTransport(
    @Param("id") id: string,
    @Body("algorithm") algorithm?: string,
  ) {
    return await this.tradeOperationService.optimizeTransport(id, algorithm);
  }

  @Post("calculate-transport")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Calculate transport costs for sellers to a buyer address",
  })
  async calculateTransport(
    @Body() dto: CalculateTransportRequestDto,
  ): Promise<CalculateTransportResponseDto> {
    const buyerAddress = await this.prisma.address.findUnique({
      where: { id: dto.buyerAddressId },
    });
    if (
      buyerAddress?.latitude == null ||
      buyerAddress?.longitude == null
    ) {
      throw new BadRequestException(
        "Buyer address with valid coordinates is required",
      );
    }

    const [users, listings] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: dto.sellerIds } },
        include: { addresses: true },
      }),
      this.prisma.saleListing.findMany({
        where: { sellerId: { in: dto.sellerIds } },
        include: { address: true },
      }),
    ]);

    const sellerLocations = dto.sellerIds.flatMap((sellerId) => {
      const listingAddress = listings.find(
        (listing) =>
          listing.sellerId === sellerId &&
          listing.address?.latitude != null &&
          listing.address?.longitude != null,
      )?.address;
      const userAddress = users
        .find((user) => user.id === sellerId)
        ?.addresses.find(
          (address) =>
            address.latitude != null && address.longitude != null,
        );
      const address = listingAddress ?? userAddress;
      return address?.latitude != null && address.longitude != null
        ? [{ id: sellerId, lat: address.latitude, lng: address.longitude }]
        : [];
    });

    if (sellerLocations.length === 0) {
      throw new BadRequestException(
        "No selected seller has an address with valid coordinates",
      );
    }

    const results = await this.transportCostService.calculateTransportCosts(
      sellerLocations,
      { lat: buyerAddress.latitude, lng: buyerAddress.longitude },
    );
    const totalCost = results.reduce(
      (sum, result) => sum + result.transportCost,
      0,
    );

    const missingCount = dto.sellerIds.length - sellerLocations.length;
    return {
      success: true,
      results,
      totalCost: Math.round(totalCost * 100) / 100,
      currency: "EUR",
      warnings:
        missingCount > 0
          ? [`Skipped ${missingCount} seller(s) without coordinates.`]
          : undefined,
    };
  }

  @Post(":id/finalize")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Finalize a trade operation" })
  async finalize(@Param("id") id: string) {
    return await this.tradeOperationService.finalizeTrade(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update trade operation" })
  async update(@Param("id") id: string, @Body() dto: UpdateTradeOperationDto) {
    return await this.tradeOperationService.update(id, dto);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update trade operation (legacy PUT alias)" })
  async updateWithPut(
    @Param("id") id: string,
    @Body() dto: UpdateTradeOperationDto,
  ) {
    return await this.tradeOperationService.update(id, dto);
  }

  @Patch(":id/phase")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update trade phase" })
  async updatePhase(@Param("id") id: string, @Body("phase") phase: TradePhase) {
    return await this.tradeOperationService.updatePhase(id, phase);
  }

  @Post(":id/phase")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update trade phase (legacy POST alias)" })
  async updatePhaseWithPost(
    @Param("id") id: string,
    @Body("phase") phase: TradePhase,
  ) {
    return await this.tradeOperationService.updatePhase(id, phase);
  }

  @Get(":id/profit")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Get trade profit calculation" })
  async getProfit(@Param("id") id: string) {
    const data = await this.profitCalculationService.calculateProfit(id);
    const netProfit = data.profit.netProfit;
    const profitMargin = data.profit.profitMargin;

    // Keep the detailed contract under `data`, while preserving the flat
    // fields consumed by older mobile and E2E clients.
    return {
      success: true,
      revenue: data.revenue.totalRevenue,
      purchaseCost: data.costs.purchases.totalCost,
      transportCost:
        data.costs.transport.actualCost ?? data.costs.transport.estimatedCost,
      netProfit,
      margin: profitMargin,
      profitMargin,
      isViable: profitMargin >= 5,
      data,
    };
  }
}
