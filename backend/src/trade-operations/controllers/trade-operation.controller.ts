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
import { NegotiationService } from "../../negotiations/services/negotiation.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole, TradePhase } from "@prisma/client";
import {
  AddSellersDto,
  CreateTradeOperationDto,
} from "../dto/create-trade-operation.dto";
import { UpdateTradeOperationDto } from "../dto/update-trade-operation.dto";

@ApiTags("Trade Operations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("trade-operations")
export class TradeOperationController {
  constructor(
    private readonly tradeOperationService: TradeOperationService,
    private readonly negotiationService: NegotiationService,
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
  @ApiOperation({ summary: "Get trade operation by ID" })
  async findOne(@Param("id") id: string) {
    return await this.tradeOperationService.findOne(id);
  }

  @Post(":id/sellers")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Add sellers to a trade operation" })
  async addSellers(@Param("id") id: string, @Body() dto: AddSellersDto) {
    return await this.tradeOperationService.addSellersToTrade(id, dto);
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

  @Post(":id/finalize")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Finalize a trade operation" })
  async finalize(@Param("id") id: string) {
    return await this.tradeOperationService.finalizeTrade(id);
  }

  @Put(":id")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update trade operation" })
  async update(@Param("id") id: string, @Body() dto: UpdateTradeOperationDto) {
    return await this.tradeOperationService.update(id, dto);
  }

  @Post(":id/phase")
  @Patch(":id/phase")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Update trade phase" })
  async updatePhase(@Param("id") id: string, @Body("phase") phase: TradePhase) {
    return await this.tradeOperationService.updatePhase(id, phase);
  }

  @Get(":id/profit")
  @ApiOperation({ summary: "Get trade profit calculation" })
  async getProfit(@Param("id") id: string) {
    return await this.tradeOperationService.calculateProfit(id);
  }
}
