import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  BadRequestException,
  ForbiddenException,
  Request,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { TransportService } from "../services/transport.service";
import { TransportCostService } from "../services/transport-cost.service";
import { RouteOptimizationService } from "../services/route-optimization.service";
import { TransportCostSettingsService } from "../services/transport-settings.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import {
  User,
  UserRole,
  TransportRequestStatus,
  BidStatus,
  TruckType,
} from "@prisma/client";
import {
  CreateTransportRequestDto,
  CreateTransportBidDto,
  UpdateTransportJobStatusDto,
  CompletePickupDto,
  CompleteDeliveryDto,
  GetTransportRequestsQueryDto,
  GetTransportBidsQueryDto,
  GetTransportJobsQueryDto,
  TransportRequestResponseDto as BiddingRequestResponseDto,
} from "../dto/transport-bidding.dto";
import {
  TransportEstimationRequestDto,
  RouteOptimizationRequestDto,
  TransportEstimationResponseDto,
  RouteOptimizationResponseDto,
} from "../dto/transport-estimation.dto";
import {
  TransportRequestDto,
  TransportRequestSummaryDto,
  TransportBidDto,
  TransportJobDto,
  TransportRequestListResponseDto,
  TransportRequestResponseDto,
  TransportBidListResponseDto,
  TransportBidResponseDto,
  TransportJobListResponseDto,
  TransportJobResponseDto,
  TransportBidComparisonDto,
  TransportBidComparisonResponseDto,
  TransporterPerformanceDto,
  TransporterPerformanceResponseDto,
  TransportAnalyticsResponseDto,
  TransportAnalyticsResponseWrapperDto,
  TransportPickupPointDto,
  TransportDeliveryPointDto,
  TransportTradeOperationSummaryDto,
  TransportBidTransporterSummaryDto,
  TransportJobLocationDto,
  TransportPickupRecordDto,
} from "../dto/transport-responses.dto";

@ApiTags("Transport")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("transport")
@ApiExtraModels(
  TransportRequestDto,
  TransportBidDto,
  TransportJobDto,
  TransportRequestListResponseDto,
  TransportRequestResponseDto,
  TransportBidListResponseDto,
  TransportBidResponseDto,
  TransportJobListResponseDto,
  TransportJobResponseDto,
  TransportBidComparisonDto,
  TransportBidComparisonResponseDto,
  TransporterPerformanceDto,
  TransporterPerformanceResponseDto,
  TransportAnalyticsResponseDto,
)
export class TransportController {
  constructor(
    private readonly transportService: TransportService,
    private readonly transportCostService: TransportCostService,
    private readonly routeOptimizationService: RouteOptimizationService,
    private readonly transportSettingsService: TransportCostSettingsService,
  ) {}

  // ==================== TRANSPORT REQUESTS ====================

  @Post("requests")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Create a transport request" })
  @ApiResponse({ status: HttpStatus.CREATED, type: TransportRequestResponseDto })
  async createRequest(@Body() dto: CreateTransportRequestDto): Promise<TransportRequestResponseDto> {
    const request = await this.transportService.createTransportRequest(dto);
    return { data: this.mapTransportRequest(request) };
  }

  @Post("requests/auto")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Auto-create transport request for trade" })
  async autoCreateRequest(@Body("tradeOperationId") tradeOperationId: string) {
    return await this.transportService.autoCreateTransportRequestForTrade(tradeOperationId);
  }

  @Get("requests")
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  @ApiOperation({ summary: "Get transport requests" })
  async getRequests(
    @Query() query: GetTransportRequestsQueryDto,
    @CurrentUser() user: User,
  ): Promise<TransportRequestListResponseDto> {
    if (user.role === UserRole.TRANSPORTER) {
      query.transporterId = user.id;
    }
    const result = await this.transportService.getTransportRequests(query);
    return {
      data: result.data.map((req) => this.mapTransportRequest(req)),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        hasMore: (result.page * result.limit) < result.total,
      },
    };
  }

  @Get("requests/available")
  @Roles(UserRole.TRANSPORTER)
  @ApiOperation({ summary: "Get available transport requests for bidding" })
  async getAvailableRequests(
    @CurrentUser() user: User,
    @Query("radius") radius?: number,
    @Query("minWeight") minWeight?: number,
    @Query("maxWeight") maxWeight?: number,
  ): Promise<TransportRequestListResponseDto> {
    const requests = await this.transportService.getAvailableRequests({
      transporterId: user.id,
      radius,
      minWeight,
      maxWeight,
    });
    return { data: requests.map((req) => this.mapTransportRequest(req)) };
  }

  @Get("requests/:id")
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  @ApiOperation({ summary: "Get transport request by ID" })
  async getRequestById(@Param("id") id: string): Promise<TransportRequestResponseDto> {
    const request = await this.transportService.getRequestById(id);
    return { data: this.mapTransportRequest(request) };
  }

  // ==================== TRANSPORT BIDS ====================

  @Post("bids")
  @Roles(UserRole.TRANSPORTER)
  @ApiOperation({ summary: "Submit a bid" })
  async submitBid(
    @CurrentUser() user: User,
    @Body() dto: CreateTransportBidDto,
  ): Promise<TransportBidResponseDto> {
    const bid = await this.transportService.submitBid(user.id, dto);
    return { data: this.mapTransportBid(bid) };
  }

  @Get("bids")
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  @ApiOperation({ summary: "Get transport bids" })
  async getBids(
    @Query() query: GetTransportBidsQueryDto,
    @CurrentUser() user: User,
  ): Promise<TransportBidListResponseDto> {
    if (user.role === UserRole.TRANSPORTER) {
      query.transporterId = user.id;
    }
    const result = await this.transportService.getTransportBids(query);
    return { data: result.data.map((bid) => this.mapTransportBid(bid)) };
  }

  @Post("bids/:id/accept")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Accept a bid" })
  async acceptBid(@Param("id") id: string): Promise<TransportJobResponseDto> {
    const job = await this.transportService.acceptBid(id);
    return { data: this.mapTransportJob(job) };
  }

  @Post("bids/:id/reject")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reject a bid" })
  async rejectBid(@Param("id") id: string, @Body("reason") reason?: string) {
    const bid = await this.transportService.rejectBid(id, reason);
    return { data: this.mapTransportBid(bid) };
  }

  // ==================== TRANSPORT JOBS ====================

  @Get("jobs")
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  @ApiOperation({ summary: "Get transport jobs" })
  async getJobs(
    @Query() query: GetTransportJobsQueryDto,
    @CurrentUser() user: User,
  ): Promise<TransportJobListResponseDto> {
    if (user.role === UserRole.TRANSPORTER) {
      query.transporterId = user.id;
    }
    const result = await this.transportService.getTransportJobs(query);
    return { data: result.data.map((job) => this.mapTransportJob(job)) };
  }

  @Post("jobs/:id/start")
  @Roles(UserRole.TRANSPORTER)
  @HttpCode(HttpStatus.OK)
  async startJob(@Param("id") id: string, @CurrentUser() user: User, @Body() data: any) {
    const job = await this.transportService.startJob(id, user.id, data);
    return { data: this.mapTransportJob(job) };
  }

  @Post("jobs/:id/pickup")
  @Roles(UserRole.TRANSPORTER)
  @HttpCode(HttpStatus.OK)
  async confirmPickup(@Param("id") id: string, @CurrentUser() user: User, @Body() data: any) {
    const job = await this.transportService.confirmPickup(id, user.id, data);
    return { data: this.mapTransportJob(job) };
  }

  @Post("jobs/:id/delivery")
  @Roles(UserRole.TRANSPORTER)
  @HttpCode(HttpStatus.OK)
  async confirmDelivery(@Param("id") id: string, @CurrentUser() user: User, @Body() data: any) {
    const job = await this.transportService.confirmDelivery(id, user.id, data);
    return { data: this.mapTransportJob(job) };
  }

  @Put("jobs/:id/location")
  @Roles(UserRole.TRANSPORTER)
  async updateLocation(@Param("id") id: string, @CurrentUser() user: User, @Body() data: any) {
    const job = await this.transportService.updateJobLocation(id, user.id, data);
    return { data: this.mapTransportJob(job) };
  }

  // ==================== ESTIMATION & OPTIMIZATION ====================

  @Post("estimate")
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  async estimateCost(@Body() dto: TransportEstimationRequestDto) {
    return await this.transportCostService.estimateCost(dto.pickupPoints, dto.deliveryPoint, dto);
  }

  @Post("optimize-route")
  @Roles(UserRole.ADMIN, UserRole.TRANSPORTER)
  async optimizeRoute(@Body() dto: RouteOptimizationRequestDto) {
    const pickupsWithIds = dto.pickups.map((p, index) => ({
      ...p,
      id: p.id || `pickup-${index}`,
    }));

    return await this.routeOptimizationService.optimizeRoute(
      dto.warehouseLocation,
      pickupsWithIds,
      dto.deliveryLocation,
      dto.algorithm || "tsp_2opt",
    );
  }

  // ==================== ANALYTICS ====================

  @Get("analytics/bid-comparison/:requestId")
  @Roles(UserRole.ADMIN)
  async compareBids(@Param("requestId") requestId: string): Promise<TransportBidComparisonResponseDto> {
    const result = await this.transportService.compareBids(requestId);
    return { data: this.mapBidComparison(result) };
  }

  @Get("me/analytics")
  @Roles(UserRole.TRANSPORTER)
  async getMyAnalytics(@CurrentUser() user: User): Promise<TransportAnalyticsResponseDto> {
    const result = await this.transportService.getTransporterAnalyticsSummary(user.id);
    return {
      metrics: result.metrics,
      recentJobs: result.recentJobs.map((job) => this.mapTransportJob(job)),
    };
  }

  // ==================== MAPPERS ====================

  private mapTransportRequest(req: any): TransportRequestDto {
    return {
      id: req.id,
      requestNumber: req.requestNumber,
      status: req.status,
      tradeOperationId: req.tradeOperationId,
      totalWeight: Number(req.totalWeight),
      cargoDescription: req.cargoDescription,
      requiredVehicleType: req.requiredVehicleType,
      pickupPoints: this.mapPickupPoints(req.pickupPoints),
      deliveryPoint: this.mapDeliveryPoint(req.deliveryPoint),
      estimatedDistance: req.estimatedDistance ? Number(req.estimatedDistance) : undefined,
      urgencyLevel: req.urgencyLevel,
      biddingDeadline: req.biddingDeadline.toISOString(),
      maxBudget: req.maxBudget ? Number(req.maxBudget) : undefined,
      createdAt: req.createdAt.toISOString(),
      updatedAt: req.updatedAt.toISOString(),
      bidsCount: req.bidsCount || req._count?.bids || 0,
      lowestBid: req.lowestBid ? Number(req.lowestBid) : undefined,
      tradeOperation: this.mapTradeOp(req.tradeOperation),
    };
  }

  private mapTransportBid(bid: any): TransportBidDto {
    return {
      id: bid.id,
      transportRequestId: bid.transportRequestId,
      tradeOperationId: bid.tradeOperationId,
      transporterId: bid.transporterId,
      bidAmount: Number(bid.bidAmount),
      estimatedDuration: bid.estimatedDuration,
      vehicleType: bid.vehicleType,
      status: bid.status,
      submittedAt: bid.submittedAt.toISOString(),
      expiresAt: bid.expiresAt?.toISOString(),
      transporter: this.mapTransporter(bid.transporter),
    };
  }

  private mapTransportJob(job: any): TransportJobDto {
    return {
      id: job.id,
      jobNumber: job.jobNumber,
      transportRequestId: job.transportRequestId,
      status: job.status,
      transporterId: job.transporterId,
      currentLocation: job.currentLocation,
      startedAt: job.startedAt?.toISOString(),
      completedAt: job.completedAt?.toISOString(),
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  private mapPickupPoints(points: any): TransportPickupPointDto[] {
    const parsed = Array.isArray(points) ? points : JSON.parse(points || "[]");
    return parsed.map((p: any) => ({
      lat: p.location?.lat ?? p.lat ?? 0,
      lng: p.location?.lng ?? p.lng ?? 0,
      address: p.location?.address ?? p.address,
      quantity: p.quantity,
      sellerId: p.sellerId,
      sellerName: p.sellerName,
    }));
  }

  private mapDeliveryPoint(point: any): TransportDeliveryPointDto {
    const p = typeof point === "string" ? JSON.parse(point) : point;
    return {
      lat: p?.location?.lat ?? p?.lat ?? 0,
      lng: p?.location?.lng ?? p?.lng ?? 0,
      address: p?.location?.address ?? p?.address,
    };
  }

  private mapTradeOp(op: any): TransportTradeOperationSummaryDto | undefined {
    if (!op) return undefined;
    return {
      id: op.id,
      operationNumber: op.operationNumber,
      status: op.status,
      phase: op.phase,
      buyListing: op.buyListing ? {
        id: op.buyListing.id,
        quantity: Number(op.buyListing.quantity),
        unit: op.buyListing.unit,
        product: op.buyListing.product ? {
          id: op.buyListing.product.id,
          name: op.buyListing.product.name,
        } : undefined,
        buyer: op.buyListing.buyer ? {
          id: op.buyListing.buyer.id,
          name: op.buyListing.buyer.name,
        } : undefined,
      } : undefined,
    };
  }

  private mapTransporter(t: any): TransportBidTransporterSummaryDto | undefined {
    if (!t) return undefined;
    return {
      id: t.id,
      name: t.name,
      email: t.email,
      company: t.company ? { id: t.company.id, legalName: t.company.legalName } : undefined,
    };
  }

  private mapBidComparison(result: any): TransportBidComparisonDto {
    return {
      request: result.request,
      bids: result.bids.map((b: any) => ({
        ...b,
        transporter: b.transporter,
      })),
      statistics: result.statistics,
    };
  }
}
