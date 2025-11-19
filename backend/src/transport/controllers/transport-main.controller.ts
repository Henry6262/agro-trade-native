import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
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
import { TransportService } from "../services/transport-main.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import {
  User,
  UserRole,
  TransportRequestStatus,
  BidStatus,
} from "@prisma/client";
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
import { TransporterAnalyticsResponseDto } from "../dto/transporter-analytics.dto";

@ApiTags("Transport")
@Controller("transport")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
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
  TransportAnalyticsResponseWrapperDto,
)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  // ========== TRANSPORTER ENDPOINTS ==========

  @Get("requests/available")
  @ApiOperation({ summary: "Get available transport requests for bidding" })
  @ApiQuery({
    name: "radius",
    required: false,
    description: "Search radius in km",
    example: 50,
  })
  @ApiQuery({ name: "minWeight", required: false, example: 10 })
  @ApiQuery({ name: "maxWeight", required: false, example: 100 })
  @ApiResponse({
    status: HttpStatus.OK,
    type: TransportRequestListResponseDto,
  })
  async getAvailableRequests(
    @CurrentUser() user: User,
    @Query("radius") radius?: number, // km from transporter's base
    @Query("minWeight") minWeight?: number,
    @Query("maxWeight") maxWeight?: number,
  ): Promise<TransportRequestListResponseDto> {
    // Only transporters can view available requests
    if (user.role !== UserRole.TRANSPORTER) {
      throw new ForbiddenException(
        "Only transporters can view transport requests",
      );
    }

    const requests = await this.transportService.getAvailableRequests({
      transporterId: user.id,
      radius,
      minWeight,
      maxWeight,
    });

    return {
      data: requests.map((request) => this.mapTransportRequest(request)),
    };
  }

  @Get("requests/:id")
  @ApiOperation({ summary: "Get transport request details" })
  @ApiParam({ name: "id", description: "Transport request ID" })
  @ApiResponse({ status: HttpStatus.OK, type: TransportRequestResponseDto })
  async getRequestDetails(
    @Param("id") requestId: string,
    @CurrentUser() user: User,
  ): Promise<TransportRequestResponseDto> {
    const request = await this.transportService.getRequestById(requestId);

    // Transporters can only see OPEN requests or ones they've bid on
    if (user.role === UserRole.TRANSPORTER) {
      const hasBid = await this.transportService.userHasBidOnRequest(
        user.id,
        requestId,
      );
      if (request.status !== TransportRequestStatus.OPEN && !hasBid) {
        throw new ForbiddenException("Cannot view this transport request");
      }
    }

    return {
      data: this.mapTransportRequest(request),
    };
  }

  @Post("bids")
  @ApiOperation({ summary: "Submit a bid for transport request" })
  @ApiResponse({ status: HttpStatus.CREATED, type: TransportBidResponseDto })
  async submitBid(
    @CurrentUser() user: User,
    @Body()
    bidData: {
      transportRequestId: string;
      bidAmount: number;
      estimatedDuration: number; // hours
      vehicleType?: string;
      notes?: string;
    },
  ): Promise<TransportBidResponseDto> {
    if (user.role !== UserRole.TRANSPORTER) {
      throw new ForbiddenException("Only transporters can submit bids");
    }

    const bid = await this.transportService.submitBid({
      ...bidData,
      transporterId: user.id,
    });

    return {
      data: this.mapTransportBid(bid),
    };
  }

  @Put("bids/:id")
  @ApiOperation({ summary: "Update an existing bid" })
  @ApiParam({ name: "id", description: "Bid ID" })
  @ApiResponse({ status: HttpStatus.OK, type: TransportBidResponseDto })
  async updateBid(
    @Param("id") bidId: string,
    @CurrentUser() user: User,
    @Body()
    updateData: {
      bidAmount?: number;
      estimatedDuration?: number;
      notes?: string;
    },
  ): Promise<TransportBidResponseDto> {
    if (user.role !== UserRole.TRANSPORTER) {
      throw new ForbiddenException("Only transporters can update bids");
    }

    const bid = await this.transportService.updateBid(
      bidId,
      user.id,
      updateData,
    );
    return {
      data: this.mapTransportBid(bid),
    };
  }

  @Put("bids/:id/withdraw")
  @ApiOperation({ summary: "Withdraw a bid" })
  @ApiParam({ name: "id", description: "Bid ID" })
  @ApiResponse({ status: HttpStatus.OK, type: TransportBidResponseDto })
  async withdrawBid(
    @Param("id") bidId: string,
    @CurrentUser() user: User,
  ): Promise<TransportBidResponseDto> {
    if (user.role !== UserRole.TRANSPORTER) {
      throw new ForbiddenException("Only transporters can withdraw bids");
    }

    const bid = await this.transportService.withdrawBid(bidId, user.id);
    return {
      data: this.mapTransportBid(bid),
    };
  }

  @Get("my-bids")
  @ApiOperation({ summary: "Get transporter's own bids" })
  @ApiQuery({ name: "status", required: false })
  @ApiResponse({ status: HttpStatus.OK, type: TransportBidListResponseDto })
  async getMyBids(
    @CurrentUser() user: User,
    @Query("status") status?: BidStatus,
  ): Promise<TransportBidListResponseDto> {
    if (user.role !== UserRole.TRANSPORTER) {
      throw new ForbiddenException("Only transporters can view their bids");
    }

    const bids = await this.transportService.getTransporterBids(
      user.id,
      status,
    );
    return {
      data: bids.map((bid) => this.mapTransportBid(bid)),
    };
  }

  @Get("my-jobs")
  @ApiOperation({ summary: "Get transporter's assigned jobs" })
  @ApiQuery({ name: "status", required: false })
  @ApiResponse({ status: HttpStatus.OK, type: TransportJobListResponseDto })
  async getMyJobs(
    @CurrentUser() user: User,
    @Query("status") status?: string,
  ): Promise<TransportJobListResponseDto> {
    if (user.role !== UserRole.TRANSPORTER) {
      throw new ForbiddenException("Only transporters can view their jobs");
    }

    const jobs = await this.transportService.getTransporterJobs(
      user.id,
      status,
    );
    return {
      data: jobs.map((job) => this.mapTransportJob(job)),
    };
  }

  // ========== ADMIN ENDPOINTS ==========

  @Get("requests")
  @ApiOperation({ summary: "Get all transport requests (Admin)" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "tradeOperationId", required: false })
  @ApiResponse({ status: HttpStatus.OK, type: TransportRequestListResponseDto })
  async getAllRequests(
    @CurrentUser() user: User,
    @Query("status") status?: TransportRequestStatus,
    @Query("tradeOperationId") tradeOperationId?: string,
  ): Promise<TransportRequestListResponseDto> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can view all requests");
    }

    const requests = await this.transportService.getAllRequests({
      status,
      tradeOperationId,
    });
    return {
      data: requests.map((request) => this.mapTransportRequest(request)),
    };
  }

  @Post("requests")
  @ApiOperation({ summary: "Create transport request (Admin)" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: TransportRequestResponseDto,
  })
  async createRequest(
    @CurrentUser() user: User,
    @Body()
    requestData: {
      tradeOperationId: string;
      pickupLocation: string;
      pickupLatitude: number;
      pickupLongitude: number;
      deliveryLocation: string;
      deliveryLatitude: number;
      deliveryLongitude: number;
      estimatedWeight: number;
      estimatedVolume: number;
      requiredVehicleType?: string;
      pickupDate: Date;
      deliveryDate: Date;
      specialRequirements?: string[];
    },
  ): Promise<TransportRequestResponseDto> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can create transport requests");
    }

    const request =
      await this.transportService.createTransportRequest(requestData);
    return {
      data: this.mapTransportRequest(request),
    };
  }

  @Get("requests/:id/bids")
  @ApiOperation({ summary: "Get all bids for a transport request (Admin)" })
  @ApiParam({ name: "id", description: "Transport request ID" })
  @ApiResponse({ status: HttpStatus.OK, type: TransportBidListResponseDto })
  async getRequestBids(
    @Param("id") requestId: string,
    @CurrentUser() user: User,
  ): Promise<TransportBidListResponseDto> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can view all bids");
    }

    const bids = await this.transportService.getRequestBids(requestId);
    return {
      data: bids.map((bid) => this.mapTransportBid(bid)),
    };
  }

  @Put("bids/:id/accept")
  @ApiOperation({ summary: "Accept a bid (Admin)" })
  @ApiParam({ name: "id", description: "Bid ID" })
  @ApiResponse({ status: HttpStatus.OK, type: TransportJobResponseDto })
  async acceptBid(
    @Param("id") bidId: string,
    @CurrentUser() user: User,
  ): Promise<TransportJobResponseDto> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can accept bids");
    }

    const job = await this.transportService.acceptBid(bidId);
    return {
      data: this.mapTransportJob(job),
    };
  }

  @Put("bids/:id/reject")
  @ApiOperation({ summary: "Reject a bid (Admin)" })
  @ApiParam({ name: "id", description: "Bid ID" })
  @ApiResponse({ status: HttpStatus.OK, type: TransportBidResponseDto })
  async rejectBid(
    @Param("id") bidId: string,
    @CurrentUser() user: User,
    @Body("reason") reason?: string,
  ): Promise<TransportBidResponseDto> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can reject bids");
    }

    const bid = await this.transportService.rejectBid(bidId, reason);
    return {
      data: this.mapTransportBid(bid),
    };
  }

  // ========== JOB MANAGEMENT ==========

  @Put("jobs/:id/start")
  @ApiOperation({ summary: "Start a transport job" })
  @ApiParam({ name: "id", description: "Transport job ID" })
  @ApiResponse({ status: HttpStatus.OK, type: TransportJobResponseDto })
  async startJob(
    @Param("id") jobId: string,
    @CurrentUser() user: User,
    @Body()
    data: {
      actualPickupTime?: Date;
      notes?: string;
    },
  ): Promise<TransportJobResponseDto> {
    const job = await this.transportService.startJob(jobId, user.id, data);
    return {
      data: this.mapTransportJob(job),
    };
  }

  @Put("jobs/:id/pickup")
  @ApiOperation({ summary: "Confirm pickup" })
  @ApiParam({ name: "id", description: "Transport job ID" })
  @ApiResponse({ status: HttpStatus.OK, type: TransportJobResponseDto })
  async confirmPickup(
    @Param("id") jobId: string,
    @CurrentUser() user: User,
    @Body()
    data: {
      pickupPhotos?: string[];
      pickupNotes?: string;
      actualWeight?: number;
    },
  ): Promise<TransportJobResponseDto> {
    const job = await this.transportService.confirmPickup(jobId, user.id, data);
    return {
      data: this.mapTransportJob(job),
    };
  }

  @Put("jobs/:id/deliver")
  @ApiOperation({ summary: "Confirm delivery" })
  @ApiParam({ name: "id", description: "Transport job ID" })
  @ApiResponse({ status: HttpStatus.OK, type: TransportJobResponseDto })
  async confirmDelivery(
    @Param("id") jobId: string,
    @CurrentUser() user: User,
    @Body()
    data: {
      deliveryPhotos: string[];
      deliveryNotes?: string;
      recipientName: string;
      recipientSignature?: string;
    },
  ): Promise<TransportJobResponseDto> {
    const job = await this.transportService.confirmDelivery(
      jobId,
      user.id,
      data,
    );
    return {
      data: this.mapTransportJob(job),
    };
  }

  @Put("jobs/:id/location")
  @ApiOperation({ summary: "Update current location" })
  @ApiParam({ name: "id", description: "Transport job ID" })
  @ApiResponse({ status: HttpStatus.OK, type: TransportJobResponseDto })
  async updateLocation(
    @Param("id") jobId: string,
    @CurrentUser() user: User,
    @Body()
    data: {
      latitude: number;
      longitude: number;
      timestamp?: Date;
    },
  ): Promise<TransportJobResponseDto> {
    const job = await this.transportService.updateJobLocation(
      jobId,
      user.id,
      data,
    );
    return {
      data: this.mapTransportJob(job),
    };
  }

  // ========== ANALYTICS ==========

  @Get("analytics/bid-comparison/:requestId")
  @ApiOperation({ summary: "Compare bids for a request (Admin)" })
  @ApiParam({ name: "requestId", description: "Transport request ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: TransportBidComparisonResponseDto,
  })
  async compareBids(
    @Param("requestId") requestId: string,
    @CurrentUser() user: User,
  ): Promise<TransportBidComparisonResponseDto> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Only admins can compare bids");
    }

    const result = await this.transportService.compareBids(requestId);
    return {
      data: this.mapBidComparison(result),
    };
  }

  @Get("analytics/transporter-performance/:transporterId")
  @ApiOperation({ summary: "Get transporter performance metrics" })
  @ApiParam({ name: "transporterId", description: "Transporter ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: TransporterPerformanceResponseDto,
  })
  async getTransporterPerformance(
    @Param("transporterId") transporterId: string,
    @CurrentUser() user: User,
  ): Promise<TransporterPerformanceResponseDto> {
    // Admins can see any, transporters can see their own
    if (user.role === UserRole.TRANSPORTER && user.id !== transporterId) {
      throw new ForbiddenException("Cannot view other transporter performance");
    }

    const performance =
      await this.transportService.getTransporterPerformance(transporterId);
    return {
      data: this.mapTransporterPerformance(performance),
    };
  }

  @Get("me/analytics")
  @ApiOperation({ summary: "Get analytics for the authenticated transporter" })
  @ApiResponse({
    status: HttpStatus.OK,
    type: TransporterAnalyticsResponseDto,
  })
  async getMyTransporterAnalytics(
    @CurrentUser() user: User,
  ): Promise<TransporterAnalyticsResponseDto> {
    if (user.role !== UserRole.TRANSPORTER && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        "Only transporters can access their analytics",
      );
    }

    const analytics =
      await this.transportService.getTransporterAnalyticsSummary(user.id);

    return {
      metrics: analytics.metrics,
      recentJobs: analytics.recentJobs.map((job) => this.mapTransportJob(job)),
    };
  }

  // ========== MAPPERS ==========

  private mapTransportRequest(
    request: any,
    options: { includeBids?: boolean; includeJob?: boolean } = {},
  ): TransportRequestDto {
    if (!request) {
      throw new BadRequestException("Invalid transport request payload");
    }

    const { includeBids = true, includeJob = true } = options;

    const pickupPoints = this.mapPickupPoints(request.pickupPoints);
    const deliveryPoint = this.mapDeliveryPoint(request.deliveryPoint);

    const bids =
      includeBids && Array.isArray(request.bids)
        ? request.bids.map((bid: any) =>
            this.mapTransportBid(bid, { includeRequest: false }),
          )
        : undefined;

    const transportJob =
      includeJob && request.transportJob
        ? this.mapTransportJob(request.transportJob, {
            includeRequest: false,
          })
        : undefined;

    const bidAmounts =
      bids
        ?.map((bid: TransportBidDto) => bid.bidAmount)
        .filter(
          (value: number | undefined): value is number =>
            typeof value === "number",
        ) ?? [];

    const dto: TransportRequestDto = {
      id: request.id,
      requestNumber: request.requestNumber,
      status: request.status,
      tradeOperationId: request.tradeOperationId,
      totalWeight: this.toNumber(request.totalWeight) ?? 0,
      requiredVehicleType: request.requiredVehicleType,
      pickupPoints,
      deliveryPoint,
      estimatedDistance: this.toNumber(request.estimatedDistance),
      urgencyLevel: request.urgencyLevel,
      biddingDeadline:
        this.toISOString(request.biddingDeadline) ?? new Date().toISOString(),
      maxBudget: this.toNumber(request.maxBudget),
      createdAt: this.toISOString(request.createdAt),
      updatedAt: this.toISOString(request.updatedAt),
      bidsCount:
        bids?.length ?? request.bids?.length ?? request._count?.bids ?? 0,
      lowestBid: bidAmounts.length ? Math.min(...bidAmounts) : undefined,
      tradeOperation: this.mapTradeOperationSummary(request.tradeOperation),
    };

    if (includeBids && bids) {
      dto.bids = bids;
    }

    if (includeJob && transportJob) {
      dto.transportJob = transportJob;
    }

    return dto;
  }

  private mapTransportBid(
    bid: any,
    options: { includeRequest?: boolean } = {},
  ): TransportBidDto {
    if (!bid) {
      throw new BadRequestException("Invalid transport bid payload");
    }

    const { includeRequest = true } = options;
    const transporter = this.mapBidTransporter(bid.transporter);

    const transportRequest =
      includeRequest && bid.transportRequest
        ? (this.mapTransportRequest(bid.transportRequest, {
            includeBids: false,
            includeJob: false,
          }) as TransportRequestSummaryDto)
        : undefined;

    return {
      id: bid.id,
      transportRequestId: bid.transportRequestId,
      tradeOperationId: bid.tradeOperationId,
      transporterId: bid.transporterId,
      bidAmount: this.toNumber(bid.bidAmount) ?? 0,
      estimatedDuration: bid.estimatedDuration ?? 0,
      vehicleType: bid.vehicleType,
      vehicleCapacity: this.toNumber(bid.vehicleCapacity),
      status: bid.status,
      submittedAt: this.toISOString(bid.submittedAt),
      expiresAt: this.toISOString(bid.expiresAt),
      transporter,
      transportRequest,
    };
  }

  private mapTransportJob(
    job: any,
    options: { includeRequest?: boolean } = {},
  ): TransportJobDto {
    if (!job) {
      throw new BadRequestException("Invalid transport job payload");
    }

    const { includeRequest = true } = options;

    const currentLocation = this.mapCurrentLocation(job.currentLocation);
    const pickupsCompleted = this.mapPickupRecords(job.pickupsCompleted);

    const transportRequest =
      includeRequest && job.transportRequest
        ? (this.mapTransportRequest(job.transportRequest, {
            includeBids: false,
            includeJob: false,
          }) as TransportRequestSummaryDto)
        : undefined;

    return {
      id: job.id,
      jobNumber: job.jobNumber,
      transportRequestId: job.transportRequestId,
      status: job.status,
      transporterId: job.transporterId,
      currentLocation,
      estimatedArrival: this.toISOString(job.estimatedArrival),
      pickupsCompleted,
      allPickupsComplete: job.allPickupsComplete ?? false,
      startedAt: this.toISOString(job.startedAt),
      completedAt: this.toISOString(job.completedAt),
      createdAt: this.toISOString(job.createdAt),
      updatedAt: this.toISOString(job.updatedAt),
      pickupPhotos: Array.isArray(job.pickupPhotos)
        ? job.pickupPhotos
        : undefined,
      deliveryPhotos: Array.isArray(job.deliveryPhotos)
        ? job.deliveryPhotos
        : undefined,
      proofOfDelivery: job.proofOfDelivery,
      notes: job.notes,
      transportRequest,
    };
  }

  private mapBidComparison(result: any): TransportBidComparisonDto {
    return {
      request: {
        id: result.request.id,
        distance: this.toNumber(result.request.distance),
        weight: this.toNumber(result.request.weight),
      },
      bids: (result.bids || []).map((bid: any) => ({
        bidId: bid.bidId,
        transporter:
          this.mapBidTransporter(bid.transporter) ??
          ({
            id: bid.transporter?.id ?? "unknown",
            name: bid.transporter?.name,
            company: bid.transporter?.company
              ? {
                  id: bid.transporter.company?.id ?? "unknown",
                  legalName: bid.transporter.company,
                }
              : undefined,
          } as TransportBidTransporterSummaryDto),
        bidAmount: this.toNumber(bid.bidAmount) ?? 0,
        estimatedDuration: bid.estimatedDuration ?? 0,
        pricePerKm: this.toNumber(bid.pricePerKm) ?? 0,
        pricePerTon: this.toNumber(bid.pricePerTon) ?? 0,
        status: bid.status,
      })),
      statistics: {
        totalBids: result.statistics?.totalBids ?? 0,
        averagePrice: this.toNumber(result.statistics?.averagePrice) ?? 0,
        lowestBid: this.toNumber(result.statistics?.lowestBid) ?? 0,
        highestBid: this.toNumber(result.statistics?.highestBid) ?? 0,
      },
    };
  }

  private mapTransporterPerformance(
    performance: any,
  ): TransporterPerformanceDto {
    const recentJobs = (performance.recentJobs || []).map((job: any) =>
      this.mapTransportJob(job, { includeRequest: true }),
    );

    return {
      transporterId: performance.transporterId,
      completedJobs: performance.metrics?.completedJobs ?? 0,
      totalJobs: performance.metrics?.totalJobs ?? 0,
      completionRate: performance.metrics?.completionRate ?? 0,
      onTimeDeliveryRate: performance.metrics?.onTimeDeliveryRate ?? 0,
      recentJobs,
    };
  }

  private mapPickupPoints(value: any): TransportPickupPointDto[] {
    return this.parseArray(value).map((point) => ({
      lat: this.toNumber(point?.lat) ?? 0,
      lng: this.toNumber(point?.lng) ?? 0,
      address: point?.address ?? point?.location ?? undefined,
      quantity: this.toNumber(point?.quantity),
      sellerId: point?.sellerId ?? point?.seller?.id,
      sellerName: point?.sellerName ?? point?.seller?.name,
      notes: point?.notes ?? undefined,
    }));
  }

  private mapDeliveryPoint(value: any): TransportDeliveryPointDto {
    const point = this.parseObject(value);
    return {
      lat: this.toNumber(point?.lat) ?? 0,
      lng: this.toNumber(point?.lng) ?? 0,
      address: point?.address ?? undefined,
      addressId: point?.addressId ?? undefined,
    };
  }

  private mapTradeOperationSummary(
    tradeOperation: any,
  ): TransportTradeOperationSummaryDto | undefined {
    if (!tradeOperation) {
      return undefined;
    }

    const buyListing = tradeOperation.buyListing
      ? {
          id: tradeOperation.buyListing.id,
          quantity: this.toNumber(tradeOperation.buyListing.quantity),
          unit: tradeOperation.buyListing.unit,
          product: tradeOperation.buyListing.product
            ? {
                id: tradeOperation.buyListing.product.id,
                name: tradeOperation.buyListing.product.name,
                category: tradeOperation.buyListing.product.category,
              }
            : undefined,
          buyer: tradeOperation.buyListing.buyer
            ? {
                id: tradeOperation.buyListing.buyer.id,
                name: tradeOperation.buyListing.buyer.name,
                email: tradeOperation.buyListing.buyer.email,
              }
            : undefined,
        }
      : undefined;

    return {
      id: tradeOperation.id,
      operationNumber: tradeOperation.operationNumber,
      status: tradeOperation.status,
      phase: tradeOperation.phase,
      profitMargin: this.toNumber(tradeOperation.profitMargin),
      buyListing,
    };
  }

  private mapBidTransporter(
    transporter: any,
  ): TransportBidTransporterSummaryDto | undefined {
    if (!transporter) {
      return undefined;
    }

    const company = transporter.company
      ? {
          id: transporter.company.id,
          legalName: transporter.company.legalName,
          registrationNumber: transporter.company.registrationNumber,
        }
      : transporter.companyName
        ? {
            id: transporter.companyId ?? "external-company",
            legalName: transporter.companyName,
            registrationNumber: undefined,
          }
        : undefined;

    return {
      id: transporter.id,
      name: transporter.name,
      email: transporter.email,
      phoneNumber: transporter.phoneNumber,
      company,
    };
  }

  private mapCurrentLocation(value: any): TransportJobLocationDto | undefined {
    if (!value) {
      return undefined;
    }
    const location = this.parseObject(value);
    return {
      lat: this.toNumber(location?.lat) ?? 0,
      lng: this.toNumber(location?.lng) ?? 0,
      address: location?.address,
      timestamp: this.toISOString(location?.timestamp),
    };
  }

  private mapPickupRecords(value: any): TransportPickupRecordDto[] {
    return this.parseArray(value).map((record) => ({
      sellerId: record?.sellerId,
      quantity: this.toNumber(record?.quantity),
      notes: record?.notes,
      completedAt: this.toISOString(record?.completedAt),
    }));
  }

  private toNumber(value: any): number | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    if (typeof value === "object" && typeof value.toNumber === "function") {
      return value.toNumber();
    }
    return undefined;
  }

  private toISOString(value: any): string | undefined {
    if (!value) {
      return undefined;
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  private parseArray(value: any): any[] {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }
    if (typeof value === "object" && value !== null) {
      return Array.isArray(value) ? value : [];
    }
    return [];
  }

  private parseObject(value: any): Record<string, any> {
    if (!value) {
      return {};
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === "object" && parsed !== null ? parsed : {};
      } catch (error) {
        return {};
      }
    }
    if (typeof value === "object") {
      return value ?? {};
    }
    return {};
  }
}
