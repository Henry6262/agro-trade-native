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
  TruckType,
} from "@prisma/client";
import { TransporterAnalyticsMetricsDto } from "../dto/transporter-analytics.dto";

@Injectable()
export class TransportService {
  private readonly logger = new Logger(TransportService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ========== REQUEST MANAGEMENT ==========

  async createTransportRequest(data: {
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
  }) {
    // Verify trade operation exists
    const tradeOperation = await this.prisma.tradeOperation.findUnique({
      where: { id: data.tradeOperationId },
    });

    if (!tradeOperation) {
      throw new NotFoundException("Trade operation not found");
    }

    // Calculate distance between pickup and delivery
    const distance = this.calculateDistance(
      data.pickupLatitude,
      data.pickupLongitude,
      data.deliveryLatitude,
      data.deliveryLongitude,
    );

    // Generate request number
    const requestNumber = `TR-${Date.now()}`;

    const transportRequest = await this.prisma.transportRequest.create({
      data: {
        tradeOperationId: data.tradeOperationId,
        requestNumber,
        pickupPoints: [
          {
            lat: data.pickupLatitude,
            lng: data.pickupLongitude,
            address: data.pickupLocation,
            quantity: data.estimatedWeight,
            sellerId: null,
          },
        ],
        deliveryPoint: {
          lat: data.deliveryLatitude,
          lng: data.deliveryLongitude,
          address: data.deliveryLocation,
          addressId: null,
        },
        totalWeight: data.estimatedWeight,
        estimatedDistance: distance,
        requiredVehicleType:
          (data.requiredVehicleType as TruckType) || TruckType.FLATBED,
        specialRequirements: data.specialRequirements || [],
        pickupWindowStart: data.pickupDate,
        pickupWindowEnd: new Date(
          data.pickupDate.getTime() + 4 * 60 * 60 * 1000,
        ), // 4 hour window
        deliveryDeadline: data.deliveryDate,
        biddingDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        status: TransportRequestStatus.OPEN,
      },
      include: {
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

    this.logger.log(`Created transport request ${requestNumber}`);

    return transportRequest;
  }

  async getAvailableRequests(filters: {
    transporterId: string;
    radius?: number;
    minWeight?: number;
    maxWeight?: number;
  }) {
    // Get transporter's location from company/user data
    const transporter = await this.prisma.user.findUnique({
      where: { id: filters.transporterId },
      include: { company: true },
    });

    if (!transporter) {
      throw new NotFoundException("Transporter not found");
    }

    // Get all OPEN transport requests
    const baseQuery: any = {
      status: TransportRequestStatus.OPEN,
    };

    if (filters.minWeight || filters.maxWeight) {
      baseQuery.totalWeight = {};
      if (filters.minWeight) baseQuery.totalWeight.gte = filters.minWeight;
      if (filters.maxWeight) baseQuery.totalWeight.lte = filters.maxWeight;
    }

    const requests = await this.prisma.transportRequest.findMany({
      where: baseQuery,
      include: {
        tradeOperation: {
          include: {
            buyListing: {
              include: {
                product: true,
                buyer: true,
              },
            },
          },
        },
        bids: {
          where: { transporterId: filters.transporterId },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter by radius if provided and transporter has coordinates
    if (filters.radius && transporter.company) {
      const transporterCoords = (transporter.company as any).metadata
        ?.coordinates;
      if (transporterCoords?.lat && transporterCoords?.lng) {
        return requests.filter((request) => {
          const pickupPoints = request.pickupPoints as any[];
          if (!pickupPoints || pickupPoints.length === 0) return false;
          const firstPickup = pickupPoints[0];
          const distance = this.calculateDistance(
            transporterCoords.lat,
            transporterCoords.lng,
            firstPickup?.lat || 0,
            firstPickup?.lng || 0,
          );
          return distance <= filters.radius!;
        });
      }
    }

    return requests;
  }

  async getRequestById(requestId: string) {
    const request = await this.prisma.transportRequest.findUnique({
      where: { id: requestId },
      include: {
        tradeOperation: {
          include: {
            buyListing: {
              include: {
                product: true,
                buyer: true,
              },
            },
            sellers: {
              include: {
                seller: true,
                saleListing: true,
              },
            },
          },
        },
        bids: {
          include: {
            transporter: {
              include: { company: true },
            },
          },
        },
        transportJob: true,
      },
    });

    if (!request) {
      throw new NotFoundException("Transport request not found");
    }

    return request;
  }

  async getAllRequests(filters: {
    status?: TransportRequestStatus;
    tradeOperationId?: string;
  }) {
    return this.prisma.transportRequest.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.tradeOperationId && {
          tradeOperationId: filters.tradeOperationId,
        }),
      },
      include: {
        tradeOperation: {
          include: {
            buyListing: {
              include: {
                product: true,
              },
            },
          },
        },
        bids: {
          include: {
            transporter: true,
          },
        },
        transportJob: {
          include: {
            transporter: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // ========== BID MANAGEMENT ==========

  async submitBid(data: {
    transportRequestId: string;
    transporterId: string;
    bidAmount: number;
    estimatedDuration: number;
    vehicleType?: string;
    notes?: string;
  }) {
    // Check if transport request exists and is PENDING
    const request = await this.prisma.transportRequest.findUnique({
      where: { id: data.transportRequestId },
    });

    if (!request) {
      throw new NotFoundException("Transport request not found");
    }

    if (request.status !== TransportRequestStatus.OPEN) {
      throw new BadRequestException("Transport request is not accepting bids");
    }

    // Check if transporter already has a bid
    const existingBid = await this.prisma.transportBid.findFirst({
      where: {
        transportRequestId: data.transportRequestId,
        transporterId: data.transporterId,
        status: { not: BidStatus.WITHDRAWN },
      },
    });

    if (existingBid) {
      throw new BadRequestException(
        "You already have an active bid for this request",
      );
    }

    // Create the bid
    const bid = await this.prisma.transportBid.create({
      data: {
        transportRequestId: data.transportRequestId,
        tradeOperationId: request.tradeOperationId,
        transporterId: data.transporterId,
        bidAmount: data.bidAmount,
        estimatedDuration: data.estimatedDuration,
        vehicleType: (data.vehicleType as TruckType) || TruckType.FLATBED,
        vehicleCapacity: 20, // Default capacity in tons; overridden when transporter profile provides actual capacity
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        status: BidStatus.PENDING,
      },
      include: {
        transporter: {
          include: { company: true },
        },
        transportRequest: true,
      },
    });

    this.logger.log(
      `Bid submitted by ${data.transporterId} for request ${data.transportRequestId}`,
    );

    return bid;
  }

  async updateBid(
    bidId: string,
    transporterId: string,
    updateData: {
      bidAmount?: number;
      estimatedDuration?: number;
      notes?: string;
    },
  ) {
    // Verify bid exists and belongs to transporter
    const bid = await this.prisma.transportBid.findUnique({
      where: { id: bidId },
    });

    if (!bid) {
      throw new NotFoundException("Bid not found");
    }

    if (bid.transporterId !== transporterId) {
      throw new ForbiddenException("You can only update your own bids");
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException("Can only update pending bids");
    }

    return this.prisma.transportBid.update({
      where: { id: bidId },
      data: updateData,
      include: {
        transporter: {
          include: { company: true },
        },
        transportRequest: true,
      },
    });
  }

  async withdrawBid(bidId: string, transporterId: string) {
    const bid = await this.prisma.transportBid.findUnique({
      where: { id: bidId },
    });

    if (!bid) {
      throw new NotFoundException("Bid not found");
    }

    if (bid.transporterId !== transporterId) {
      throw new ForbiddenException("You can only withdraw your own bids");
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException("Can only withdraw pending bids");
    }

    return this.prisma.transportBid.update({
      where: { id: bidId },
      data: { status: BidStatus.WITHDRAWN },
    });
  }

  async getTransporterBids(transporterId: string, status?: BidStatus) {
    return this.prisma.transportBid.findMany({
      where: {
        transporterId,
        ...(status && { status }),
      },
      include: {
        transportRequest: {
          include: {
            tradeOperation: {
              include: {
                buyListing: {
                  include: { product: true },
                },
              },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
  }

  async getRequestBids(requestId: string) {
    return this.prisma.transportBid.findMany({
      where: { transportRequestId: requestId },
      include: {
        transporter: {
          include: { company: true },
        },
      },
      orderBy: { bidAmount: "asc" }, // Cheapest first
    });
  }

  async acceptBid(bidId: string) {
    // Start transaction to accept bid and reject others
    return this.prisma.$transaction(async (tx) => {
      // Get the bid
      const bid = await tx.transportBid.findUnique({
        where: { id: bidId },
        include: { transportRequest: true },
      });

      if (!bid) {
        throw new NotFoundException("Bid not found");
      }

      if (bid.status !== BidStatus.PENDING) {
        throw new BadRequestException("Bid is not pending");
      }

      // Accept this bid
      await tx.transportBid.update({
        where: { id: bidId },
        data: { status: BidStatus.ACCEPTED },
      });

      // Reject all other bids for this request
      await tx.transportBid.updateMany({
        where: {
          transportRequestId: bid.transportRequestId,
          id: { not: bidId },
          status: BidStatus.PENDING,
        },
        data: { status: BidStatus.REJECTED },
      });

      // Update transport request status
      await tx.transportRequest.update({
        where: { id: bid.transportRequestId },
        data: {
          status: TransportRequestStatus.ASSIGNED,
          selectedBidId: bidId,
        },
      });

      // Create transport job
      const jobNumber = `JOB-${Date.now()}`;
      const job = await tx.transportJob.create({
        data: {
          jobNumber,
          transportRequestId: bid.transportRequestId,
          transportBidId: bidId,
          tradeOperationId: bid.transportRequest.tradeOperationId,
          transporterId: bid.transporterId,
          status: TransportJobStatus.ASSIGNED,
        },
        include: {
          transporter: true,
          transportRequest: {
            include: {
              tradeOperation: true,
            },
          },
        },
      });

      this.logger.log(`Bid ${bidId} accepted, job created: ${job.id}`);

      return job;
    });
  }

  async rejectBid(bidId: string, reason?: string) {
    void reason;
    const bid = await this.prisma.transportBid.findUnique({
      where: { id: bidId },
    });

    if (!bid) {
      throw new NotFoundException("Bid not found");
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException("Bid is not pending");
    }

    return this.prisma.transportBid.update({
      where: { id: bidId },
      data: {
        status: BidStatus.REJECTED,
        evaluatedAt: new Date(),
      },
    });
  }

  // ========== JOB MANAGEMENT ==========

  async getTransporterJobs(transporterId: string, status?: string) {
    return this.prisma.transportJob.findMany({
      where: {
        transporterId,
        ...(status && { status: status as TransportJobStatus }),
      },
      include: {
        transportRequest: {
          include: {
            tradeOperation: {
              include: {
                buyListing: {
                  include: { product: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async startJob(jobId: string, transporterId: string, data: any) {
    const job = await this.prisma.transportJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    if (job.transporterId !== transporterId) {
      throw new ForbiddenException("You can only start your own jobs");
    }

    if (job.status !== TransportJobStatus.ASSIGNED) {
      throw new BadRequestException("Job is not assigned");
    }

    return this.prisma.transportJob.update({
      where: { id: jobId },
      data: {
        status: TransportJobStatus.STARTED,
        startedAt: data.actualPickupTime || new Date(),
        notes: data.notes,
      },
    });
  }

  async confirmPickup(jobId: string, transporterId: string, data: any) {
    const job = await this.prisma.transportJob.update({
      where: { id: jobId },
      data: {
        status: TransportJobStatus.IN_TRANSIT,
        allPickupsComplete: true,
        pickupPhotos: data.pickupPhotos || [],
        pickupsCompleted: [
          {
            timestamp: new Date(),
            notes: data.pickupNotes,
            weight: data.actualWeight,
          },
        ],
      },
    });

    this.logger.log(`Pickup confirmed for job ${jobId}`);
    return job;
  }

  async confirmDelivery(jobId: string, transporterId: string, data: any) {
    const job = await this.prisma.transportJob.update({
      where: { id: jobId },
      data: {
        status: TransportJobStatus.COMPLETED,
        actualDelivery: new Date(),
        completedAt: new Date(),
        deliveryPhotos: data.deliveryPhotos || [],
        proofOfDelivery: data.recipientSignature,
        notes: data.deliveryNotes || "",
        onTimeDelivery: true,
      },
    });

    // Update transport request status
    await this.prisma.transportRequest.update({
      where: { id: job.transportRequestId },
      data: { status: TransportRequestStatus.COMPLETED },
    });

    this.logger.log(`Delivery confirmed for job ${jobId}`);
    return job;
  }

  async updateJobLocation(jobId: string, transporterId: string, data: any) {
    // Store location update (you could create a separate LocationHistory table)
    const job = await this.prisma.transportJob.findUnique({
      where: { id: jobId },
    });

    if (!job || job.transporterId !== transporterId) {
      throw new ForbiddenException("Invalid job");
    }

    // Update metadata with latest location
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
      where: {
        transportRequestId: requestId,
        status: { not: BidStatus.WITHDRAWN },
      },
      include: {
        transporter: {
          include: { company: true },
        },
      },
      orderBy: { bidAmount: "asc" },
    });

    const request = await this.prisma.transportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException("Request not found");
    }

    // Calculate metrics for each bid
    const comparison = bids.map((bid) => ({
      bidId: bid.id,
      transporter: {
        id: bid.transporterId,
        name: bid.transporter.name,
        company: bid.transporter.company?.legalName,
      },
      bidAmount: bid.bidAmount,
      estimatedDuration: bid.estimatedDuration,
      pricePerKm: request.estimatedDistance
        ? Number(bid.bidAmount) / request.estimatedDistance
        : 0,
      pricePerTon: request.totalWeight
        ? Number(bid.bidAmount) / request.totalWeight
        : 0,
      status: bid.status,
    }));

    return {
      request: {
        id: request.id,
        distance: request.estimatedDistance,
        weight: request.totalWeight,
      },
      bids: comparison,
      statistics: {
        totalBids: bids.length,
        averagePrice:
          bids.length > 0
            ? bids.reduce((sum, b) => sum + Number(b.bidAmount), 0) /
              bids.length
            : 0,
        lowestBid: bids[0]?.bidAmount || 0,
        highestBid: bids[bids.length - 1]?.bidAmount || 0,
      },
    };
  }

  async getTransporterPerformance(transporterId: string) {
    const [completedJobs, totalJobs, onTimeDeliveries] = await Promise.all([
      this.prisma.transportJob.count({
        where: {
          transporterId,
          status: TransportJobStatus.COMPLETED,
        },
      }),
      this.prisma.transportJob.count({
        where: { transporterId },
      }),
      this.prisma.transportJob.count({
        where: {
          transporterId,
          status: TransportJobStatus.COMPLETED,
          onTimeDelivery: true,
        },
      }),
    ]);

    const recentJobs = await this.prisma.transportJob.findMany({
      where: { transporterId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        transportRequest: {
          include: {
            tradeOperation: {
              include: {
                buyListing: { include: { product: true } },
              },
            },
          },
        },
      },
    });

    return {
      transporterId,
      metrics: {
        completedJobs,
        totalJobs,
        completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0,
        onTimeDeliveryRate:
          completedJobs > 0 ? (onTimeDeliveries / completedJobs) * 100 : 0,
      },
      recentJobs,
    };
  }

  async getTransporterAnalyticsSummary(transporterId: string): Promise<{
    metrics: TransporterAnalyticsMetricsDto;
    recentJobs: any[];
  }> {
    const [
      totalBids,
      acceptedBids,
      pendingBids,
      averageAcceptedBid,
      activeJobs,
      completedJobs,
      onTimeDeliveries,
    ] = await Promise.all([
      this.prisma.transportBid.count({
        where: { transporterId },
      }),
      this.prisma.transportBid.count({
        where: { transporterId, status: BidStatus.ACCEPTED },
      }),
      this.prisma.transportBid.count({
        where: { transporterId, status: BidStatus.PENDING },
      }),
      this.prisma.transportBid.aggregate({
        where: { transporterId, status: BidStatus.ACCEPTED },
        _avg: { bidAmount: true },
      }),
      this.prisma.transportJob.count({
        where: {
          transporterId,
          status: {
            in: [TransportJobStatus.ASSIGNED, TransportJobStatus.STARTED, TransportJobStatus.IN_TRANSIT],
          },
        },
      }),
      this.prisma.transportJob.count({
        where: {
          transporterId,
          status: TransportJobStatus.COMPLETED,
        },
      }),
      this.prisma.transportJob.count({
        where: {
          transporterId,
          status: TransportJobStatus.COMPLETED,
          onTimeDelivery: true,
        },
      }),
    ]);

    const recentJobs = await this.prisma.transportJob.findMany({
      where: { transporterId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        transportRequest: {
          include: {
            tradeOperation: {
              include: {
                buyListing: { include: { product: true } },
              },
            },
          },
        },
      },
    });

    const metrics: TransporterAnalyticsMetricsDto = {
      totalBids,
      acceptedBids,
      winRate: totalBids > 0 ? (acceptedBids / totalBids) * 100 : 0,
      pendingBids,
      activeJobs,
      completedJobs,
      onTimeDeliveryRate:
        completedJobs > 0 ? (onTimeDeliveries / completedJobs) * 100 : 0,
      averageBidAmount:
        averageAcceptedBid._avg.bidAmount !== null &&
        averageAcceptedBid._avg.bidAmount !== undefined
          ? Number(averageAcceptedBid._avg.bidAmount)
          : 0,
    };

    return {
      metrics,
      recentJobs,
    };
  }

  // ========== HELPERS ==========

  async userHasBidOnRequest(
    userId: string,
    requestId: string,
  ): Promise<boolean> {
    const bid = await this.prisma.transportBid.findFirst({
      where: {
        transporterId: userId,
        transportRequestId: requestId,
      },
    });
    return !!bid;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
