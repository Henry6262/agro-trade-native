import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
  ForbiddenException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  UserRole,
  TruckType,
  BidStatus,
  TransportJobStatus,
  InspectionStatus,
  TradePhase,
  TradeStatus,
  SellerStatus,
  NegotiationStatus,
  RequestStatus,
} from "@prisma/client";
import { SimulationService } from "./simulation.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTestUserDto } from "./dto/create-test-user.dto";
import { successResponse } from "../common/utils/response.util";

@ApiTags("Simulation (Admin Only)")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("simulation")
export class SimulationController {
  private readonly logger = new Logger(SimulationController.name);

  constructor(
    private simulationService: SimulationService,
    private prisma: PrismaService,
  ) {
    // SECURITY: Disable all simulation endpoints in production
    if (process.env.NODE_ENV === "production") {
      this.logger.error("!!! CRITICAL: Simulation Controller accessed in PRODUCTION environment. Disabling access.");
    }
  }

  private ensureNotProduction() {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException("Simulation endpoints are disabled in production.");
    }
  }

  // ==================== STATE QUERIES ====================

  @Get("users/:role")
  @ApiOperation({ summary: "Get all users by role for simulation" })
  @ApiResponse({ status: 200, description: "List of users for the role" })
  async getUsersByRole(@Param("role") role: UserRole) {
    this.ensureNotProduction();
    const users = await this.simulationService.getUsersByRole(role);
    return successResponse(users, `Found ${users.length} ${role} users`);
  }

  @Get("trade-operation/:id/full-state")
  @ApiOperation({ summary: "Get complete trade operation state" })
  @ApiResponse({ status: 200, description: "Full trade state with all actors" })
  async getFullTradeState(@Param("id") id: string) {
    this.ensureNotProduction();
    return this.simulationService.getFullTradeState(id);
  }

  @Post("users/create-test-user")
  @ApiOperation({ summary: "Create a test user for scenarios" })
  @HttpCode(HttpStatus.CREATED)
  async createTestUser(@Body() dto: CreateTestUserDto) {
    this.ensureNotProduction();
    const data = dto.data || {};
    if (dto.name) {
      data.name = dto.name;
    }
    return this.simulationService.createTestUser(dto.role, data);
  }

  // ==================== BUYER SIMULATIONS ====================

  @Post("buyer/:userId/create-listing")
  @ApiOperation({ summary: "Simulate buyer creating a buy listing" })
  @HttpCode(HttpStatus.CREATED)
  async simulateBuyerCreateListing(
    @Param("userId") userId: string,
    @Body() dto: any,
  ) {
    this.ensureNotProduction();
    // Verify user is a buyer
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.BUYER) {
      throw new ForbiddenException("User is not a buyer");
    }

    // Get buyer's default address
    const buyerAddress = await this.prisma.address.findFirst({
      where: { userId, isDefault: true },
    });

    return this.prisma.buyListing.create({
      data: {
        buyerId: userId,
        productId: dto.productId,
        deliveryAddressId: buyerAddress?.id, // Link to buyer's address
        quantity: dto.quantity,
        unit: dto.unit || "TON",
        maxPricePerUnit: dto.maxPricePerUnit,
        neededBy: dto.neededBy
          ? new Date(dto.neededBy)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: RequestStatus.ACTIVE,
      },
    });
  }

  // ==================== SELLER SIMULATIONS ====================

  @Post("seller/:userId/accept-offer")
  @ApiOperation({ summary: "Simulate seller accepting an offer" })
  @HttpCode(HttpStatus.OK)
  async simulateSellerAcceptOffer(
    @Param("userId") userId: string,
    @Body() dto: { negotiationId: string },
  ) {
    this.ensureNotProduction();
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: dto.negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new NotFoundException("Negotiation not found");
    }

    if (negotiation.tradeSeller.sellerId !== userId) {
      throw new ForbiddenException("User is not authorized for this negotiation");
    }

    // Update negotiation to ACCEPTED
    await this.prisma.offerNegotiation.update({
      where: { id: dto.negotiationId },
      data: {
        status: NegotiationStatus.ACCEPTED,
        respondedAt: new Date(),
      },
    });

    // Get quantity from currentOffer JSON
    const offerData = negotiation.currentOffer as any;
    const quantity =
      offerData?.quantity || negotiation.tradeSeller.requestedQuantity;

    // Update trade seller status
    await this.prisma.tradeSeller.update({
      where: { id: negotiation.tradeSellerId },
      data: {
        status: SellerStatus.ACCEPTED,
        agreedQuantity: quantity,
      },
    });

    return { success: true, message: "Offer accepted" };
  }

  @Post("seller/:userId/counter-offer")
  @ApiOperation({ summary: "Simulate seller making a counter-offer" })
  @HttpCode(HttpStatus.OK)
  async simulateSellerCounterOffer(
    @Param("userId") userId: string,
    @Body()
    dto: {
      negotiationId: string;
      counterPrice: number;
      counterQuantity?: number;
    },
  ) {
    this.ensureNotProduction();
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: dto.negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new NotFoundException("Negotiation not found");
    }

    if (negotiation.tradeSeller.sellerId !== userId) {
      throw new ForbiddenException("User is not authorized for this negotiation");
    }

    // Get quantity from currentOffer JSON
    const offerData = negotiation.currentOffer as any;
    const currentQuantity = offerData?.quantity || 0;

    // Update negotiation with counter-offer
    await this.prisma.offerNegotiation.update({
      where: { id: dto.negotiationId },
      data: {
        status: NegotiationStatus.COUNTERED,
        counterOffer: {
          price: dto.counterPrice,
          quantity: dto.counterQuantity || currentQuantity,
          timestamp: new Date().toISOString(),
        },
        respondedAt: new Date(),
      },
    });

    return { success: true, message: "Counter-offer sent" };
  }

  @Post("seller/:userId/reject-offer")
  @ApiOperation({ summary: "Simulate seller rejecting an offer" })
  @HttpCode(HttpStatus.OK)
  async simulateSellerRejectOffer(
    @Param("userId") userId: string,
    @Body() dto: { negotiationId: string; reason?: string },
  ) {
    this.ensureNotProduction();
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: dto.negotiationId },
      include: {
        tradeSeller: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!negotiation) {
      throw new NotFoundException("Negotiation not found");
    }

    if (negotiation.tradeSeller.sellerId !== userId) {
      throw new ForbiddenException("User is not authorized for this negotiation");
    }

    // Update negotiation to REJECTED
    await this.prisma.offerNegotiation.update({
      where: { id: dto.negotiationId },
      data: {
        status: NegotiationStatus.REJECTED,
        respondedAt: new Date(),
      },
    });

    // Update trade seller status
    await this.prisma.tradeSeller.update({
      where: { id: negotiation.tradeSellerId },
      data: {
        status: SellerStatus.REJECTED,
      },
    });

    return { success: true, message: "Offer rejected" };
  }

  // ==================== TRANSPORTER SIMULATIONS ====================

  @Post("transporter/:userId/submit-bid")
  @ApiOperation({ summary: "Simulate transporter submitting a bid" })
  @HttpCode(HttpStatus.CREATED)
  async simulateTransporterBid(
    @Param("userId") userId: string,
    @Body()
    dto: {
      transportRequestId: string;
      bidAmount: number;
      estimatedDuration: number;
      vehicleType?: string;
      vehicleCapacity?: number;
    },
  ) {
    this.ensureNotProduction();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.TRANSPORTER) {
      throw new ForbiddenException("User is not a transporter");
    }

    const request = await this.prisma.transportRequest.findUnique({
      where: { id: dto.transportRequestId },
    });

    if (!request) {
      throw new NotFoundException("Transport request not found");
    }

    return this.prisma.transportBid.create({
      data: {
        transportRequestId: dto.transportRequestId,
        transporterId: userId,
        tradeOperationId: request.tradeOperationId,
        bidAmount: dto.bidAmount,
        estimatedDuration: dto.estimatedDuration,
        vehicleType: (dto.vehicleType as TruckType) || TruckType.FLATBED,
        vehicleCapacity: dto.vehicleCapacity || 20,
        status: BidStatus.PENDING,
        submittedAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
  }

  @Post("transporter/:userId/start-job")
  @ApiOperation({ summary: "Simulate transporter starting a transport job" })
  @HttpCode(HttpStatus.OK)
  async simulateStartTransportJob(
    @Param("userId") userId: string,
    @Body() dto: { jobId: string },
  ) {
    this.ensureNotProduction();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.TRANSPORTER) {
      throw new ForbiddenException("User is not a transporter");
    }

    const job = await this.prisma.transportJob.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException("Transport job not found");
    }

    if (job.transporterId !== userId) {
      throw new ForbiddenException("User is not authorized for this job");
    }

    await this.prisma.transportJob.update({
      where: { id: dto.jobId },
      data: {
        status: TransportJobStatus.IN_TRANSIT,
        startedAt: new Date(),
      },
    });

    return { success: true, message: "Job started" };
  }

  @Post("transporter/:userId/complete-delivery")
  @ApiOperation({ summary: "Simulate transporter completing delivery" })
  @HttpCode(HttpStatus.OK)
  async simulateCompleteDelivery(
    @Param("userId") userId: string,
    @Body() dto: { jobId: string; deliveryNotes?: string },
  ) {
    this.ensureNotProduction();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.TRANSPORTER) {
      throw new ForbiddenException("User is not a transporter");
    }

    const job = await this.prisma.transportJob.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException("Transport job not found");
    }

    if (job.transporterId !== userId) {
      throw new ForbiddenException("User is not authorized for this job");
    }

    await this.prisma.transportJob.update({
      where: { id: dto.jobId },
      data: {
        status: TransportJobStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    // Update trade operation phase to DELIVERED
    await this.prisma.tradeOperation.update({
      where: { id: job.tradeOperationId },
      data: {
        phase: TradePhase.DELIVERED,
      },
    });

    return { success: true, message: "Delivery completed" };
  }

  // ==================== INSPECTOR SIMULATIONS ====================

  @Post("inspector/:userId/accept-job")
  @ApiOperation({ summary: "Simulate inspector accepting an inspection job" })
  @HttpCode(HttpStatus.OK)
  async simulateInspectorAcceptJob(
    @Param("userId") userId: string,
    @Body() dto: { inspectionId: string },
  ) {
    this.ensureNotProduction();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.INSPECTOR) {
      throw new ForbiddenException("User is not an inspector");
    }

    await this.prisma.inspectionRequest.update({
      where: { id: dto.inspectionId },
      data: {
        status: InspectionStatus.IN_PROGRESS,
      },
    });

    return { success: true, message: "Inspection job accepted" };
  }

  @Post("inspector/:userId/submit-results")
  @ApiOperation({ summary: "Simulate inspector submitting inspection results" })
  @HttpCode(HttpStatus.OK)
  async simulateInspectionResults(
    @Param("userId") userId: string,
    @Body()
    dto: {
      inspectionId: string;
      qualityScore: number;
      result: "PASSED" | "FAILED";
      notes?: string;
    },
  ) {
    this.ensureNotProduction();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.INSPECTOR) {
      throw new ForbiddenException("User is not an inspector");
    }

    const inspection = await this.prisma.inspectionRequest.findUnique({
      where: { id: dto.inspectionId },
      include: {
        saleListing: true,
        tradeOperation: true,
      },
    });

    if (!inspection) {
      throw new NotFoundException("Inspection not found");
    }

    // Update inspection
    await this.prisma.inspectionRequest.update({
      where: { id: dto.inspectionId },
      data: {
        verificationResult: { result: dto.result },
        qualityScore: dto.qualityScore,
        notes: dto.notes,
        status: InspectionStatus.COMPLETED,
        completedDate: new Date(),
      },
    });

    // If failed, update trade seller
    if (dto.result === "FAILED" && inspection.tradeOperationId) {
      const tradeSeller = await this.prisma.tradeSeller.findFirst({
        where: {
          tradeOperationId: inspection.tradeOperationId,
          sellerId: inspection.saleListing.sellerId,
        },
      });

      if (tradeSeller) {
        await this.prisma.tradeSeller.update({
          where: { id: tradeSeller.id },
          data: {
            status: SellerStatus.FAILED_INSPECTION,
            isVerified: false,
          },
        });
      }
    }

    // If passed, mark seller as verified
    if (dto.result === "PASSED" && inspection.tradeOperationId) {
      const tradeSeller = await this.prisma.tradeSeller.findFirst({
        where: {
          tradeOperationId: inspection.tradeOperationId,
          sellerId: inspection.saleListing.sellerId,
        },
      });

      if (tradeSeller) {
        await this.prisma.tradeSeller.update({
          where: { id: tradeSeller.id },
          data: {
            isVerified: true,
          },
        });
      }
    }

    return { success: true, message: "Inspection results submitted" };
  }

  // ==================== ADMIN WORKFLOW SIMULATIONS ====================

  @Post("admin/farmer/:farmerId/create-sale-listing")
  @ApiOperation({ summary: "Create a sale listing for a farmer" })
  @HttpCode(HttpStatus.CREATED)
  async createFarmerSaleListing(
    @Param("farmerId") farmerId: string,
    @Body()
    dto: {
      productCategory: string;
      quantity: number;
      pricePerUnit: number;
      latitude?: number;
      longitude?: number;
    },
  ) {
    this.ensureNotProduction();
    try {
      this.logger.log("[Controller] createFarmerSaleListing called with:" + JSON.stringify({
        farmerId,
        dto,
      }));
      const result = await this.simulationService.createFarmerSaleListing(
        farmerId,
        dto,
      );
      this.logger.log("[Controller] createFarmerSaleListing success:" + JSON.stringify(result));
      return result;
    } catch (error) {
      this.logger.error("[Controller] createFarmerSaleListing ERROR:" + error);
      throw error;
    }
  }

  @Post("admin/create-trade-operation")
  @ApiOperation({ summary: "Create trade operation from buy listing" })
  @HttpCode(HttpStatus.CREATED)
  async createTradeOperation(
    @Body()
    dto: {
      buyListingId: string;
      adminMargin: number;
      buyerCommission: number;
      sellerCommission: number;
    },
  ) {
    this.ensureNotProduction();
    return this.simulationService.createTradeOperation(dto.buyListingId, {
      adminMargin: dto.adminMargin,
      buyerCommission: dto.buyerCommission,
      sellerCommission: dto.sellerCommission,
    });
  }

  @Post("admin/send-offers")
  @ApiOperation({ summary: "Send offers to multiple farmers" })
  @HttpCode(HttpStatus.CREATED)
  async sendOffersToFarmers(
    @Body()
    dto: {
      tradeOperationId: string;
      offers: Array<{
        farmerId: string;
        saleListingId: string;
        requestedQuantity: number;
        offeredPrice: number;
      }>;
    },
  ) {
    this.ensureNotProduction();
    return this.simulationService.sendOffersToFarmers(
      dto.tradeOperationId,
      dto.offers,
    );
  }

  @Post("admin/accept-counter-offer")
  @ApiOperation({ summary: "Admin accepts farmer counter-offer" })
  @HttpCode(HttpStatus.OK)
  async adminAcceptCounterOffer(@Body() dto: { negotiationId: string }) {
    this.ensureNotProduction();
    return this.simulationService.adminAcceptCounterOffer(dto.negotiationId);
  }

  @Post("admin/assign-inspector")
  @ApiOperation({ summary: "Assign inspector to trade operation" })
  @HttpCode(HttpStatus.CREATED)
  async assignInspector(
    @Body() dto: { tradeOperationId: string; inspectorId: string },
  ) {
    this.ensureNotProduction();
    return this.simulationService.assignInspector(
      dto.tradeOperationId,
      dto.inspectorId,
    );
  }

  @Post("admin/create-transport")
  @ApiOperation({ summary: "Create and accept transport bid" })
  @HttpCode(HttpStatus.CREATED)
  async createAndAcceptTransportBid(
    @Body()
    dto: {
      tradeOperationId: string;
      transporterId: string;
      pickupLat: number;
      pickupLng: number;
      deliveryLat: number;
      deliveryLng: number;
      bidAmount: number;
      estimatedDuration: number;
    },
  ) {
    this.ensureNotProduction();
    return this.simulationService.createAndAcceptTransportBid(
      dto.tradeOperationId,
      dto,
    );
  }

  @Post("admin/complete-trade")
  @ApiOperation({ summary: "Complete trade operation" })
  @HttpCode(HttpStatus.OK)
  async completeTradeOperation(@Body() dto: { tradeOperationId: string }) {
    this.ensureNotProduction();
    return this.simulationService.completeTradeOperation(dto.tradeOperationId);
  }

  @Post("admin/create-transport-request")
  @ApiOperation({
    summary: "Create transport request without bid (for bidding competition)",
  })
  @HttpCode(HttpStatus.CREATED)
  async createTransportRequest(
    @Body()
    dto: {
      tradeOperationId: string;
      pickupLat: number;
      pickupLng: number;
      deliveryLat: number;
      deliveryLng: number;
      distanceKm?: number;
    },
  ) {
    this.ensureNotProduction();
    return this.simulationService.createTransportRequest(dto.tradeOperationId, {
      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      deliveryLat: dto.deliveryLat,
      deliveryLng: dto.deliveryLng,
      distanceKm: dto.distanceKm,
    });
  }

  @Post("admin/select-transport-bid")
  @ApiOperation({ summary: "Select winning bid from multiple submissions" })
  @HttpCode(HttpStatus.OK)
  async selectTransportBid(
    @Body() dto: { transportRequestId: string; bidId: string },
  ) {
    this.ensureNotProduction();
    return this.simulationService.adminSelectTransportBid(
      dto.transportRequestId,
      dto.bidId,
    );
  }

  @Post("admin/update-pricing")
  @ApiOperation({
    summary: "Update negotiation pricing (quality dispute adjustments)",
  })
  @HttpCode(HttpStatus.OK)
  async updatePricing(
    @Body() dto: { negotiationId: string; newPrice: number; reason?: string },
  ) {
    this.ensureNotProduction();
    return this.simulationService.updateNegotiationPricing(dto.negotiationId, {
      newPrice: dto.newPrice,
      reason: dto.reason,
    });
  }

  @Delete("admin/cleanup-test-data")
  @ApiOperation({ summary: "Delete all test users and related data" })
  @HttpCode(HttpStatus.OK)
  async cleanupTestData() {
    this.ensureNotProduction();
    return this.simulationService.cleanupTestData();
  }
}
