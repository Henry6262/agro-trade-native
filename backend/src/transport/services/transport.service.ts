import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import {
  TransportRequestStatus,
  BidStatus,
  TransportJobStatus,
  UrgencyLevel,
  TradePhase,
  TruckType,
  Prisma,
  User,
  UserRole,
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
} from "../dto/transport-bidding.dto";
import { TransportCostService } from "./transport-cost.service";
import { TradeEventsService } from "../../trade-events/trade-events.service";
import { RealtimeService } from "../../realtime/realtime.service";
import { TransporterAnalyticsMetricsDto } from "../dto/transporter-analytics.dto";

@Injectable()
export class TransportService {
  private readonly logger = new Logger(TransportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transportCostService: TransportCostService,
    private readonly tradeEventsService: TradeEventsService,
    private readonly realtimeService: RealtimeService,
  ) {}

  // ==================== TRANSPORT REQUESTS ====================

  /**
   * Auto-create transport request when all sellers are verified
   */
  async autoCreateTransportRequestForTrade(
    tradeOperationId: string,
  ): Promise<any> {
    this.logger.log(
      `Auto-creating transport request for trade operation: ${tradeOperationId}`,
    );

    const existing = await this.prisma.transportRequest.findUnique({
      where: { tradeOperationId },
    });

    if (existing) {
      this.logger.log(
        `Transport request already exists for trade ${tradeOperationId}. Skipping auto-create.`,
      );
      return existing;
    }

    const tradeOperation = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        sellers: {
          where: { status: "ACCEPTED", isVerified: true },
        },
      },
    });

    if (!tradeOperation) {
      throw new NotFoundException("Trade operation not found");
    }

    const totalWeight = tradeOperation.sellers.reduce(
      (sum, seller) =>
        sum + Number(seller.agreedQuantity || seller.requestedQuantity),
      0,
    );

    if (totalWeight === 0) {
      this.logger.warn(
        `No weight to transport for trade operation ${tradeOperationId}`,
      );
      return null;
    }

    const biddingDeadline = new Date();
    biddingDeadline.setHours(biddingDeadline.getHours() + 48);

    const deliveryDeadline = new Date();
    deliveryDeadline.setDate(deliveryDeadline.getDate() + 7);

    const dto: CreateTransportRequestDto = {
      tradeOperationId,
      totalWeight,
      requiredVehicleType: undefined,
      specialRequirements: [],
      urgencyLevel: UrgencyLevel.STANDARD,
      biddingDeadline: biddingDeadline.toISOString(),
      deliveryDeadline: deliveryDeadline.toISOString(),
    };

    return this.createTransportRequest(dto);
  }

  /**
   * Create a transport request (Manual or Auto)
   * Fixes P0 #37: Supports manual pickupPoints, deliveryPoint, and cargoDescription
   */
  async createTransportRequest(dto: CreateTransportRequestDto) {
    const tradeOperation = await this.prisma.tradeOperation.findUnique({
      where: { id: dto.tradeOperationId },
      include: {
        buyListing: {
          include: {
            buyer: true,
            deliveryAddress: true,
            product: true,
          },
        },
        sellers: {
          include: {
            seller: true,
            saleListing: {
              include: {
                address: true,
              },
            },
          },
          where: {
            status: "ACCEPTED",
          },
        },
      },
    });

    if (!tradeOperation) {
      throw new NotFoundException("Trade operation not found");
    }

    if (tradeOperation.sellers.length === 0 && !dto.pickupPoints) {
      throw new BadRequestException(
        "No accepted sellers in this trade operation and no manual pickup points provided",
      );
    }

    if (
      !dto.deliveryPoint &&
      (
        tradeOperation.buyListing.deliveryAddress?.latitude == null ||
        tradeOperation.buyListing.deliveryAddress?.longitude == null
      )
    ) {
      throw new BadRequestException(
        "Buyer delivery address must include coordinates or a manual delivery point must be provided",
      );
    }

    // Use manual pickup points if provided, otherwise create from accepted sellers
    const pickupPoints = dto.pickupPoints || tradeOperation.sellers.map((s) => ({
      sellerId: s.sellerId,
      saleListingId: s.saleListingId,
      sellerName: s.seller.name,
      location: {
        lat: s.saleListing.address?.latitude || 0,
        lng: s.saleListing.address?.longitude || 0,
        address: s.saleListing.address?.street || "Unknown",
      },
      quantity: Number(s.agreedQuantity || s.requestedQuantity),
      unit: s.unit,
    }));

    // Use manual delivery point if provided, otherwise create from buyer info
    const deliveryPoint = dto.deliveryPoint || {
      buyerId: tradeOperation.buyListing.buyerId,
      buyerName: tradeOperation.buyListing.buyer.name,
      location: {
        lat: tradeOperation.buyListing.deliveryAddress?.latitude || 0,
        lng: tradeOperation.buyListing.deliveryAddress?.longitude || 0,
        address: tradeOperation.buyListing.deliveryAddress?.street || "Unknown",
      },
    };

    // Calculate distance and estimated cost
    let estimatedDistance = 0;
    let estimatedCost = 0;

    try {
      const pointsForEstimation = (pickupPoints as any[]).map((p) => {
        const lat = p.location?.lat ?? p.lat ?? 0;
        const lng = p.location?.lng ?? p.lng ?? 0;
        return {
          lat,
          lng,
          quantity: p.quantity,
          id: p.sellerId || p.sellerName || "manual",
        };
      });

      const destLat = (deliveryPoint as any).location?.lat ?? (deliveryPoint as any).lat ?? 0;
      const destLng = (deliveryPoint as any).location?.lng ?? (deliveryPoint as any).lng ?? 0;

      const estimation = await this.transportCostService.estimateCost(
        pointsForEstimation,
        { lat: destLat, lng: destLng },
        {
          vehicleType: dto.requiredVehicleType,
          urgency: dto.urgencyLevel === UrgencyLevel.EXPRESS ? "EXPRESS" : "NORMAL",
        },
      );

      estimatedDistance = estimation.totalDistance;
      estimatedCost = estimation.totalCost;
    } catch (error) {
      this.logger.error("Failed to calculate transport cost", error);
    }

    const requestNumber = `TR-${Date.now().toString(36).toUpperCase()}`;

    const transportRequest = await this.prisma.transportRequest.create({
      data: {
        requestNumber,
        tradeOperationId: dto.tradeOperationId,
        totalWeight: dto.totalWeight,
        cargoDescription: dto.cargoDescription,
        requiredVehicleType: dto.requiredVehicleType,
        specialRequirements: dto.specialRequirements || [],
        pickupPoints,
        deliveryPoint,
        estimatedDistance: estimatedDistance > 0 ? estimatedDistance : undefined,
        pickupWindowStart: dto.pickupWindowStart ? new Date(dto.pickupWindowStart) : undefined,
        pickupWindowEnd: dto.pickupWindowEnd ? new Date(dto.pickupWindowEnd) : undefined,
        deliveryDeadline: dto.deliveryDeadline ? new Date(dto.deliveryDeadline) : undefined,
        urgencyLevel: dto.urgencyLevel || UrgencyLevel.STANDARD,
        status: TransportRequestStatus.OPEN,
        biddingDeadline: new Date(dto.biddingDeadline),
        maxBudget: dto.maxBudget || (estimatedCost > 0 ? new Prisma.Decimal(estimatedCost * 1.3) : undefined),
      },
      include: {
        tradeOperation: {
          include: {
            buyListing: { include: { product: true } },
          },
        },
      },
    });

    // Update trade operation phase
    await this.prisma.tradeOperation.update({
      where: { id: dto.tradeOperationId },
      data: {
        phase: TradePhase.TRANSPORT_MATCHING,
        estimatedTransportCost: estimatedCost > 0 ? new Prisma.Decimal(estimatedCost) : undefined,
        totalDistanceKm: estimatedDistance > 0 ? estimatedDistance : undefined,
      },
    });

    return transportRequest;
  }

  async getTransportRequests(query: GetTransportRequestsQueryDto) {
    const where: Prisma.TransportRequestWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.urgencyLevel) where.urgencyLevel = query.urgencyLevel;
    if (query.tradeOperationId) where.tradeOperationId = query.tradeOperationId;

    if (query.transporterId) {
      where.status = TransportRequestStatus.OPEN;
      where.biddingDeadline = { gt: new Date() };
    }

    const [requests, total] = await Promise.all([
      this.prisma.transportRequest.findMany({
        where,
        include: {
          tradeOperation: {
            include: {
              buyListing: { include: { product: true } },
            },
          },
          _count: { select: { bids: true } },
        },
        skip: query.offset || 0,
        take: query.limit || 20,
        orderBy: [{ urgencyLevel: "desc" }, { createdAt: "desc" }],
      }),
      this.prisma.transportRequest.count({ where }),
    ]);

    const requestsWithStats = await Promise.all(
      requests.map(async (req) => {
        const bidStats = await this.prisma.transportBid.aggregate({
          where: { transportRequestId: req.id },
          _avg: { bidAmount: true },
          _min: { bidAmount: true },
        });

        return {
          ...req,
          bidsCount: req._count.bids,
          lowestBid: bidStats._min.bidAmount,
          averageBid: bidStats._avg.bidAmount,
        };
      }),
    );

    return {
      data: requestsWithStats,
      total,
      page: Math.floor((query.offset || 0) / (query.limit || 20)) + 1,
      limit: query.limit || 20,
    };
  }

  async getAvailableRequests(filters: {
    transporterId: string;
    radius?: number;
    minWeight?: number;
    maxWeight?: number;
  }) {
    const transporter = await this.prisma.user.findUnique({
      where: { id: filters.transporterId },
      include: { company: true },
    });

    if (!transporter) throw new NotFoundException("Transporter not found");

    const where: any = { status: TransportRequestStatus.OPEN };
    if (filters.minWeight || filters.maxWeight) {
      where.totalWeight = {};
      if (filters.minWeight) where.totalWeight.gte = filters.minWeight;
      if (filters.maxWeight) where.totalWeight.lte = filters.maxWeight;
    }

    const requests = await this.prisma.transportRequest.findMany({
      where,
      include: {
        tradeOperation: {
          include: {
            buyListing: { include: { product: true, buyer: true } },
          },
        },
        bids: { where: { transporterId: filters.transporterId } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (filters.radius && transporter.company) {
      const transporterCoords = (transporter.company as any).metadata?.coordinates;
      if (transporterCoords?.lat && transporterCoords?.lng) {
        return requests.filter((request) => {
          const pickupPoints = request.pickupPoints as any[];
          if (!pickupPoints || pickupPoints.length === 0) return false;
          const firstPickup = pickupPoints[0];
          const dist = this.calculateDistance(
            transporterCoords.lat,
            transporterCoords.lng,
            firstPickup?.lat || firstPickup?.location?.lat || 0,
            firstPickup?.lng || firstPickup?.location?.lng || 0,
          );
          return dist <= filters.radius!;
        });
      }
    }

    return requests;
  }

  async getRequestById(id: string) {
    const request = await this.prisma.transportRequest.findUnique({
      where: { id },
      include: {
        tradeOperation: {
          include: {
            buyListing: { include: { product: true, buyer: true } },
            sellers: { include: { seller: true } },
          },
        },
        bids: {
          include: {
            transporter: { include: { company: true } },
            assignedTruck: true,
            transportCompany: true,
          },
          orderBy: { bidAmount: "asc" },
        },
        transportJob: true,
      },
    });

    if (!request) throw new NotFoundException("Transport request not found");
    return request;
  }

  async getTransportRequestById(id: string) {
    const request = await this.getRequestById(id);
    const defaultTruckCapacity = 20;
    const trucksNeeded = Math.ceil(Number(request.totalWeight || 0) / defaultTruckCapacity);
    const acceptedBids = request.bids.filter((bid) => bid.status === BidStatus.ACCEPTED);
    const trucksReserved = acceptedBids.reduce((sum, bid) => {
      const route = bid.proposedRoute as Record<string, unknown> | null;
      const truckCount = Number(route?.truckCount || 0);
      if (truckCount > 0) return sum + truckCount;
      return sum + Math.max(1, Math.ceil(Number(bid.vehicleCapacity || defaultTruckCapacity) / defaultTruckCapacity));
    }, 0);
    const trucksRemaining = Math.max(0, trucksNeeded - trucksReserved);
    const fulfillmentPercentage = trucksNeeded > 0
      ? Math.min(100, Math.round((trucksReserved / trucksNeeded) * 100))
      : 0;

    let estimatedCostFromPlatform: number | undefined;
    if (request.estimatedDistance) {
      try {
        const pickupPoints = (request.pickupPoints as any[]).map((point) => ({
          lat: point.location?.lat ?? point.lat ?? 0,
          lng: point.location?.lng ?? point.lng ?? 0,
          quantity: point.quantity,
          id: point.sellerId || point.sellerName || "pickup",
        }));
        const destination = {
          lat: (request.deliveryPoint as any)?.location?.lat ?? (request.deliveryPoint as any)?.lat ?? 0,
          lng: (request.deliveryPoint as any)?.location?.lng ?? (request.deliveryPoint as any)?.lng ?? 0,
        };
        const estimate = await this.transportCostService.estimateCost(pickupPoints, destination, {});
        estimatedCostFromPlatform = estimate.totalCost;
      } catch (error) {
        this.logger.warn(`Failed to refresh transport estimate for request ${id}`);
      }
    }

    return {
      ...request,
      truckTracking: {
        trucksNeeded,
        trucksReserved,
        trucksRemaining,
        fulfillmentPercentage,
        isFullyAssigned: trucksRemaining === 0 && trucksNeeded > 0,
      },
      estimatedCostFromPlatform,
    };
  }

  // ==================== TRANSPORT BIDS ====================

  async submitBid(transporterId: string, dto: CreateTransportBidDto) {
    const request = await this.prisma.transportRequest.findUnique({
      where: { id: dto.transportRequestId },
    });

    if (!request) throw new NotFoundException("Transport request not found");
    if (request.status !== TransportRequestStatus.OPEN) {
      throw new BadRequestException("Transport request is not open for bidding");
    }
    if (request.biddingDeadline && new Date(request.biddingDeadline) <= new Date()) {
      throw new BadRequestException("Bidding deadline has passed");
    }

    const existingBid = await this.prisma.transportBid.findFirst({
      where: {
        transportRequestId: dto.transportRequestId,
        transporterId,
        status: { not: BidStatus.WITHDRAWN },
      },
    });

    if (existingBid) {
      throw new BadRequestException("You already have an active bid for this request");
    }

    const proposedRoute = dto.proposedRoute || {};
    if (dto.truckCount) (proposedRoute as any).truckCount = dto.truckCount;

    return this.prisma.transportBid.create({
      data: {
        transportRequestId: dto.transportRequestId,
        tradeOperationId: request.tradeOperationId,
        transporterId,
        bidAmount: dto.bidAmount,
        estimatedDuration: dto.estimatedDuration,
        vehicleType: dto.vehicleType || TruckType.FLATBED,
        vehicleCapacity: dto.vehicleCapacity || 20,
        assignedTruckId: dto.assignedTruckId,
        specialEquipment: dto.specialEquipment || [],
        insuranceCoverage: dto.insuranceCoverage,
        proposedRoute,
        pickupSchedule: dto.pickupSchedule,
        status: BidStatus.PENDING,
        submittedAt: new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
      include: { transporter: { include: { company: true } }, assignedTruck: true },
    });
  }

  async updateBid(bidId: string, transporterId: string, updateData: any) {
    const bid = await this.prisma.transportBid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException("Bid not found");
    if (bid.transporterId !== transporterId) throw new ForbiddenException("Not your bid");
    if (bid.status !== BidStatus.PENDING) throw new BadRequestException("Can only update pending bids");

    return this.prisma.transportBid.update({
      where: { id: bidId },
      data: updateData,
      include: { transporter: { include: { company: true } }, transportRequest: true },
    });
  }

  async withdrawBid(bidId: string, transporterId: string) {
    const bid = await this.prisma.transportBid.findUnique({ where: { id: bidId } });
    if (!bid) throw new NotFoundException("Bid not found");
    if (bid.transporterId !== transporterId) throw new ForbiddenException("Not your bid");
    
    return this.prisma.transportBid.update({
      where: { id: bidId },
      data: { status: BidStatus.WITHDRAWN },
    });
  }

  async getTransportBids(query: GetTransportBidsQueryDto) {
    const where: Prisma.TransportBidWhereInput = {};
    if (query.transportRequestId) where.transportRequestId = query.transportRequestId;
    if (query.transporterId) where.transporterId = query.transporterId;
    if (query.status) where.status = query.status;

    const [bids, total] = await Promise.all([
      this.prisma.transportBid.findMany({
        where,
        include: { transporter: { include: { company: true } }, transportRequest: true },
        skip: query.offset || 0,
        take: query.limit || 20,
        orderBy: [{ status: "asc" }, { bidAmount: "asc" }],
      }),
      this.prisma.transportBid.count({ where }),
    ]);

    const bidsWithRanking = bids.map((bid, index) => {
      const lowestBid = bids[0]?.bidAmount || bid.bidAmount;
      const ratio = Number(bid.bidAmount) / Number(lowestBid);
      let competitiveness = "OVERPRICED";
      if (ratio === 1) competitiveness = "LOWEST";
      else if (ratio < 1.1) competitiveness = "COMPETITIVE";
      else if (ratio < 1.25) competitiveness = "HIGH";

      return { ...bid, ranking: index + 1, competitiveness };
    });

    return { data: bidsWithRanking, total };
  }

  async acceptBid(bidId: string) {
    return this.prisma.$transaction(async (tx) => {
      const bid = await tx.transportBid.findUnique({
        where: { id: bidId },
        include: { transportRequest: true },
      });

      if (!bid || bid.status !== BidStatus.PENDING) {
        throw new BadRequestException("Bid not found or not pending");
      }

      await tx.transportBid.update({
        where: { id: bidId },
        data: { status: BidStatus.ACCEPTED, acceptedAt: new Date(), evaluatedAt: new Date() },
      });

      await tx.transportBid.updateMany({
        where: { transportRequestId: bid.transportRequestId, id: { not: bidId }, status: BidStatus.PENDING },
        data: { status: BidStatus.REJECTED, evaluatedAt: new Date() },
      });

      await tx.transportRequest.update({
        where: { id: bid.transportRequestId },
        data: { status: TransportRequestStatus.ASSIGNED, selectedBidId: bidId },
      });

      const jobNumber = `JOB-${Date.now().toString(36).toUpperCase()}`;
      const job = await tx.transportJob.create({
        data: {
          jobNumber,
          transportRequestId: bid.transportRequestId,
          transportBidId: bidId,
          tradeOperationId: bid.tradeOperationId,
          transporterId: bid.transporterId,
          status: TransportJobStatus.ASSIGNED,
        },
      });

      await tx.tradeOperation.update({
        where: { id: bid.tradeOperationId },
        data: { phase: TradePhase.IN_TRANSIT, estimatedTransportCost: bid.bidAmount },
      });

      // Emit real-time update to buyer
      const tradeOp = await tx.tradeOperation.findUnique({
        where: { id: bid.tradeOperationId },
        include: { buyListing: { select: { buyerId: true } } },
      });
      if (tradeOp?.buyListing?.buyerId) {
        this.realtimeService.emitToUser(tradeOp.buyListing.buyerId, 'trade:updated', {
          tradeOperationId: tradeOp.id,
          phase: TradePhase.IN_TRANSIT,
          status: tradeOp.status,
        });
      }

      return job;
    });
  }

  async createTransportBid(transporterId: string, dto: CreateTransportBidDto) {
    return this.submitBid(transporterId, dto);
  }

  async acceptTransportBid(bidId: string, _adminId?: string) {
    const bid = await this.prisma.transportBid.findUnique({
      where: { id: bidId },
      include: { transportRequest: true },
    });

    if (!bid) {
      throw new NotFoundException("Bid not found");
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException("Bid is not pending");
    }

    const transportJob = await this.acceptBid(bidId);
    return {
      acceptedBid: {
        ...bid,
        status: BidStatus.ACCEPTED,
      },
      transportJob,
    };
  }

  async rejectBid(bidId: string, reason?: string) {
    void reason;
    return this.prisma.transportBid.update({
      where: { id: bidId },
      data: { status: BidStatus.REJECTED, evaluatedAt: new Date() },
    });
  }

  async rejectTransportBid(bidId: string, _adminId?: string, reason?: string) {
    const bid = await this.prisma.transportBid.findUnique({ where: { id: bidId } });
    if (!bid) {
      throw new NotFoundException("Bid not found");
    }
    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException("Bid is not pending");
    }
    return this.rejectBid(bidId, reason);
  }

  // ==================== TRANSPORT JOBS ====================

  async getTransportJobs(query: GetTransportJobsQueryDto) {
    const where: Prisma.TransportJobWhereInput = {};
    if (query.transporterId) where.transporterId = query.transporterId;
    if (query.status) where.status = query.status;

    const [jobs, total] = await Promise.all([
      this.prisma.transportJob.findMany({
        where,
        include: {
          transporter: { include: { company: true } },
          transportRequest: {
            include: { tradeOperation: { include: { buyListing: { include: { product: true } } } } },
          },
          transportBid: true,
        },
        skip: query.offset || 0,
        take: query.limit || 20,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.transportJob.count({ where }),
    ]);

    return { data: jobs, total };
  }

  async startJob(jobId: string, transporterId: string, data: any = {}) {
    const job = await this.prisma.transportJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException("Transport job not found");
    if (job.transporterId !== transporterId) throw new ForbiddenException("Invalid job");
    if (job.status !== TransportJobStatus.ASSIGNED) throw new BadRequestException("Job already started");

    return this.prisma.transportJob.update({
      where: { id: jobId },
      data: { status: TransportJobStatus.STARTED, startedAt: data.actualPickupTime || new Date(), notes: data.notes },
    });
  }

  async confirmPickup(jobId: string, transporterId: string, data: any) {
    const job = await this.prisma.transportJob.findUnique({
      where: { id: jobId },
      include: { transportRequest: true },
    });
    if (!job || job.transporterId !== transporterId) throw new ForbiddenException("Invalid job");

    const pickupsCompleted = (job.pickupsCompleted as any[]) || [];
    pickupsCompleted.push({
      sellerId: data.sellerId,
      quantityPickedUp: data.actualWeight,
      completedAt: new Date(),
      notes: data.pickupNotes,
    });

    const pickupPoints = job.transportRequest.pickupPoints as any[];
    const allPickupsComplete = pickupPoints.every((point) =>
      pickupsCompleted.some((p) => p.sellerId === point.sellerId),
    );

    const updatedJob = await this.prisma.transportJob.update({
      where: { id: jobId },
      data: {
        status: allPickupsComplete ? TransportJobStatus.IN_TRANSIT : TransportJobStatus.PICKING_UP,
        allPickupsComplete,
        pickupsCompleted,
        pickupPhotos: [...(job.pickupPhotos || []), ...(data.pickupPhotos || [])],
      },
    });

    if (job.tradeOperationId) {
      await this.tradeEventsService.record({
        tradeOperationId: job.tradeOperationId,
        eventType: "TRANSPORT_PICKUP",
        actorRole: "TRANSPORTER",
        actorId: transporterId,
      }).catch(() => {});

      // Notify buyer of pickup
      const tradeOp = await this.prisma.tradeOperation.findUnique({
        where: { id: job.tradeOperationId },
        include: { buyListing: { select: { buyerId: true } } },
      });
      if (tradeOp?.buyListing?.buyerId) {
        this.realtimeService.emitToUser(tradeOp.buyListing.buyerId, 'trade:updated', {
          tradeOperationId: tradeOp.id,
          phase: tradeOp.phase,
          status: tradeOp.status,
          message: allPickupsComplete ? 'Cargo picked up and in transit' : 'Pickup in progress',
        });
      }
    }

    return updatedJob;
  }

  async confirmDelivery(jobId: string, transporterId: string, data: any) {
    const job = await this.prisma.transportJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException("Transport job not found");
    if (job.transporterId !== transporterId) throw new ForbiddenException("Invalid job");
    if (!job.allPickupsComplete) {
      throw new BadRequestException("All pickups must be completed before delivery");
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedJob = await tx.transportJob.update({
        where: { id: jobId },
        data: {
          status: TransportJobStatus.COMPLETED,
          actualDelivery: new Date(),
          completedAt: new Date(),
          deliveryPhotos: data.deliveryPhotos || [],
          proofOfDelivery: data.recipientSignature || data.proofOfDelivery,
          notes: data.deliveryNotes || job.notes,
          onTimeDelivery: true,
        },
      });

      const updatedTrade = await tx.tradeOperation.update({
        where: { id: job.tradeOperationId },
        data: { phase: TradePhase.COMPLETED },
      });

      await tx.transportRequest.update({
        where: { id: job.transportRequestId },
        data: { status: TransportRequestStatus.COMPLETED },
      });

      if (job.tradeOperationId) {
        await this.tradeEventsService.record({
          tradeOperationId: job.tradeOperationId,
          eventType: "TRANSPORT_DELIVERED",
          actorRole: "TRANSPORTER",
          actorId: transporterId,
        }).catch(() => {});

        // Notify buyer of delivery completion
        const tradeOp = await tx.tradeOperation.findUnique({
          where: { id: job.tradeOperationId },
          include: { buyListing: { select: { buyerId: true } } },
        });
        if (tradeOp?.buyListing?.buyerId) {
          this.realtimeService.emitToUser(tradeOp.buyListing.buyerId, 'trade:updated', {
            tradeOperationId: tradeOp.id,
            phase: TradePhase.COMPLETED,
            status: tradeOp.status,
            message: 'Your cargo has been delivered!',
          });
        }
      }

      return updatedJob;
    });
  }

  async startTransportJob(jobId: string, transporterId: string, data: any = {}) {
    return this.startJob(jobId, transporterId, data);
  }

  async updateTransportJobStatus(jobId: string, transporterId: string, data: UpdateTransportJobStatusDto) {
    const job = await this.prisma.transportJob.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException("Transport job not found");
    if (job.transporterId !== transporterId) throw new ForbiddenException("Invalid job");

    const updatedJob = await this.prisma.transportJob.update({
      where: { id: jobId },
      data: {
        status: data.status,
        notes: data.notes ?? job.notes,
      },
    });

    if (data.status === TransportJobStatus.DELIVERING) {
      await this.prisma.tradeOperation.update({
        where: { id: job.tradeOperationId },
        data: { phase: TradePhase.DELIVERED },
      });
    }

    return updatedJob;
  }

  async completePickup(jobId: string, transporterId: string, data: any) {
    const normalizedData = {
      ...data,
      actualWeight: data.actualWeight ?? data.quantityPickedUp,
      pickupNotes: data.pickupNotes ?? data.notes,
    };
    const job = await this.confirmPickup(jobId, transporterId, normalizedData);

    if (job.allPickupsComplete && job.status === TransportJobStatus.IN_TRANSIT) {
      return {
        ...job,
        status: TransportJobStatus.DELIVERING,
      };
    }

    return job;
  }

  async completeDelivery(jobId: string, transporterId: string, data: any) {
    return this.confirmDelivery(jobId, transporterId, data);
  }

  async updateJobLocation(jobId: string, transporterId: string, data: any) {
    const job = await this.prisma.transportJob.findUnique({ where: { id: jobId } });
    if (!job || job.transporterId !== transporterId) throw new ForbiddenException("Invalid job");

    return this.prisma.transportJob.update({
      where: { id: jobId },
      data: {
        currentLocation: {
          lat: data.latitude,
          lng: data.longitude,
          timestamp: data.timestamp || new Date(),
          address: data.address || "In transit",
        },
      },
    });
  }

  // ========== ANALYTICS ==========

  async compareBids(requestId: string) {
    const bids = await this.prisma.transportBid.findMany({
      where: { transportRequestId: requestId, status: { not: BidStatus.WITHDRAWN } },
      include: { transporter: { include: { company: true } } },
      orderBy: { bidAmount: "asc" },
    });

    const request = await this.prisma.transportRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException("Request not found");

    const comparison = bids.map((bid) => ({
      bidId: bid.id,
      transporter: { id: bid.transporterId, name: bid.transporter.name, company: bid.transporter.company?.legalName },
      bidAmount: bid.bidAmount,
      estimatedDuration: bid.estimatedDuration,
      pricePerKm: request.estimatedDistance ? Number(bid.bidAmount) / request.estimatedDistance : 0,
      pricePerTon: request.totalWeight ? Number(bid.bidAmount) / request.totalWeight : 0,
      status: bid.status,
    }));

    return {
      request: { id: request.id, distance: request.estimatedDistance, weight: request.totalWeight },
      bids: comparison,
      statistics: {
        totalBids: bids.length,
        averagePrice: bids.length > 0 ? bids.reduce((sum, b) => sum + Number(b.bidAmount), 0) / bids.length : 0,
        lowestBid: bids[0]?.bidAmount || 0,
        highestBid: bids[bids.length - 1]?.bidAmount || 0,
      },
    };
  }

  async getTransporterPerformance(transporterId: string) {
    const [completedJobs, totalJobs, onTimeDeliveries] = await Promise.all([
      this.prisma.transportJob.count({ where: { transporterId, status: TransportJobStatus.COMPLETED } }),
      this.prisma.transportJob.count({ where: { transporterId } }),
      this.prisma.transportJob.count({ where: { transporterId, status: TransportJobStatus.COMPLETED, onTimeDelivery: true } }),
    ]);

    const recentJobs = await this.prisma.transportJob.findMany({
      where: { transporterId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        transportRequest: {
          include: { tradeOperation: { include: { buyListing: { include: { product: true } } } } },
        },
      },
    });

    return {
      transporterId,
      metrics: {
        completedJobs,
        totalJobs,
        completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
        onTimeDeliveryRate: completedJobs > 0 ? (onTimeDeliveries / completedJobs) * 100 : 0,
      },
      recentJobs,
    };
  }

  async getTransporterAnalyticsSummary(transporterId: string): Promise<{
    metrics: TransporterAnalyticsMetricsDto;
    recentJobs: any[];
  }> {
    const [totalBids, acceptedBids, pendingBids, avgAccepted, activeJobs, completedJobs, onTimeDeliveries] = await Promise.all([
      this.prisma.transportBid.count({ where: { transporterId } }),
      this.prisma.transportBid.count({ where: { transporterId, status: BidStatus.ACCEPTED } }),
      this.prisma.transportBid.count({ where: { transporterId, status: BidStatus.PENDING } }),
      this.prisma.transportBid.aggregate({ where: { transporterId, status: BidStatus.ACCEPTED }, _avg: { bidAmount: true } }),
      this.prisma.transportJob.count({ where: { transporterId, status: { in: [TransportJobStatus.ASSIGNED, TransportJobStatus.STARTED, TransportJobStatus.IN_TRANSIT] } } }),
      this.prisma.transportJob.count({ where: { transporterId, status: TransportJobStatus.COMPLETED } }),
      this.prisma.transportJob.count({ where: { transporterId, status: TransportJobStatus.COMPLETED, onTimeDelivery: true } }),
    ]);

    const recentJobs = await this.prisma.transportJob.findMany({
      where: { transporterId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        transportRequest: {
          include: { tradeOperation: { include: { buyListing: { include: { product: true } } } } },
        },
      },
    });

    return {
      metrics: {
        totalBids,
        acceptedBids,
        winRate: totalBids > 0 ? (acceptedBids / totalBids) * 100 : 0,
        pendingBids,
        activeJobs,
        completedJobs,
        onTimeDeliveryRate: completedJobs > 0 ? (onTimeDeliveries / completedJobs) * 100 : 0,
        averageBidAmount: avgAccepted._avg.bidAmount ? Number(avgAccepted._avg.bidAmount) : 0,
      },
      recentJobs,
    };
  }

  // ========== HELPERS ==========

  async userHasBidOnRequest(userId: string, requestId: string): Promise<boolean> {
    const bid = await this.prisma.transportBid.findFirst({ where: { transporterId: userId, transportRequestId: requestId } });
    return !!bid;
  }

  async getTransportDataForTradeOperation(tradeOperationId: string) {
    const request = await this.prisma.transportRequest.findUnique({
      where: { tradeOperationId },
      include: {
        bids: { include: { transporter: { include: { company: true } }, transportCompany: true }, orderBy: { submittedAt: "asc" } },
        transportJob: true,
      },
    });
    return { request, bids: request?.bids ?? [], job: request?.transportJob ?? null };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number { return deg * (Math.PI / 180); }
}
