import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TransportRequestStatus,
  BidStatus,
  TransportJobStatus,
  UrgencyLevel,
  TradePhase,
  Prisma
} from '@prisma/client';
import {
  CreateTransportRequestDto,
  CreateTransportBidDto,
  UpdateTransportJobStatusDto,
  CompletePickupDto,
  CompleteDeliveryDto,
  GetTransportRequestsQueryDto,
  GetTransportBidsQueryDto,
  GetTransportJobsQueryDto
} from '../dto/transport-bidding.dto';
import { TransportCostService } from './transport-cost.service';

@Injectable()
export class TransportBiddingService {
  private readonly logger = new Logger(TransportBiddingService.name);

  constructor(
    private prisma: PrismaService,
    private transportCostService: TransportCostService
  ) {}

  // ==================== TRANSPORT REQUESTS ====================

  /**
   * Auto-create transport request when all sellers are verified
   * This is called internally when trade operation phase changes to TRANSPORT_MATCHING
   */
  async autoCreateTransportRequestForTrade(tradeOperationId: string): Promise<any> {
    this.logger.log(`Auto-creating transport request for trade operation: ${tradeOperationId}`);

    const existing = await this.prisma.transportRequest.findUnique({
      where: { tradeOperationId },
    });

    if (existing) {
      this.logger.log(`Transport request already exists for trade ${tradeOperationId}. Skipping auto-create.`);
      return existing;
    }

    // Get trade operation to calculate total weight
    const tradeOperation = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        sellers: {
          where: { status: 'ACCEPTED', isVerified: true }
        }
      }
    });

    if (!tradeOperation) {
      throw new NotFoundException('Trade operation not found');
    }

    // Calculate total weight from all accepted sellers
    const totalWeight = tradeOperation.sellers.reduce(
      (sum, seller) => sum + Number(seller.agreedQuantity || seller.requestedQuantity),
      0
    );

    if (totalWeight === 0) {
      this.logger.warn(`No weight to transport for trade operation ${tradeOperationId}`);
      return null;
    }

    // Set bidding deadline to 48 hours from now
    const biddingDeadline = new Date();
    biddingDeadline.setHours(biddingDeadline.getHours() + 48);

    // Set delivery deadline to 7 days from now (can be adjusted)
    const deliveryDeadline = new Date();
    deliveryDeadline.setDate(deliveryDeadline.getDate() + 7);

    const dto: CreateTransportRequestDto = {
      tradeOperationId,
      totalWeight,
      requiredVehicleType: undefined, // Let transporters decide
      specialRequirements: [],
      urgencyLevel: UrgencyLevel.STANDARD,
      biddingDeadline: biddingDeadline.toISOString(),
      deliveryDeadline: deliveryDeadline.toISOString()
    };

    return this.createTransportRequest(dto);
  }

  async createTransportRequest(dto: CreateTransportRequestDto) {
    // Get trade operation with sellers and buyer info
    const tradeOperation = await this.prisma.tradeOperation.findUnique({
      where: { id: dto.tradeOperationId },
      include: {
        buyListing: {
          include: {
            buyer: true,
            deliveryAddress: true,
            product: true
          }
        },
        sellers: {
          include: {
            seller: true,
            saleListing: {
              include: {
                address: true
              }
            }
          },
          where: {
            status: 'ACCEPTED'
          }
        }
      }
    });

    if (!tradeOperation) {
      throw new NotFoundException('Trade operation not found');
    }

    if (tradeOperation.sellers.length === 0) {
      throw new BadRequestException('No accepted sellers in this trade operation');
    }

    // Check if delivery address has coordinates
    if (!tradeOperation.buyListing.deliveryAddress?.latitude ||
        !tradeOperation.buyListing.deliveryAddress?.longitude) {
      throw new BadRequestException('Buyer delivery address must have valid coordinates');
    }

    // Create pickup points from accepted sellers
    const pickupPoints = tradeOperation.sellers.map(s => {
      if (!s.saleListing.address?.latitude || !s.saleListing.address?.longitude) {
        this.logger.warn(`Seller ${s.sellerId} has no valid coordinates`);
      }
      return {
        sellerId: s.sellerId,
        saleListingId: s.saleListingId,
        sellerName: s.seller.name,
        location: {
          lat: s.saleListing.address?.latitude || 0,
          lng: s.saleListing.address?.longitude || 0,
          address: s.saleListing.address?.street || 'Unknown'
        },
        quantity: Number(s.agreedQuantity || s.requestedQuantity),
        unit: s.unit
      };
    });

    // Create delivery point from buyer
    const deliveryPoint = {
      buyerId: tradeOperation.buyListing.buyerId,
      buyerName: tradeOperation.buyListing.buyer.name,
      location: {
        lat: tradeOperation.buyListing.deliveryAddress.latitude,
        lng: tradeOperation.buyListing.deliveryAddress.longitude,
        address: tradeOperation.buyListing.deliveryAddress.street || 'Unknown'
      }
    };

    // Calculate distance and estimated cost using TransportCostService
    let estimatedDistance = 0;
    let estimatedCost = 0;

    try {
      const estimation = await this.transportCostService.estimateCost(
        pickupPoints.map(p => ({
          lat: p.location.lat,
          lng: p.location.lng,
          quantity: p.quantity,
          id: p.sellerId
        })),
        {
          lat: deliveryPoint.location.lat,
          lng: deliveryPoint.location.lng
        },
        {
          vehicleType: dto.requiredVehicleType,
          urgency: dto.urgencyLevel === UrgencyLevel.EXPRESS ? 'EXPRESS' : 'NORMAL'
        }
      );

      estimatedDistance = estimation.totalDistance;
      estimatedCost = estimation.totalCost;

      this.logger.log(`Transport estimation: ${estimatedDistance}km, €${estimatedCost}`);
    } catch (error) {
      this.logger.error('Failed to calculate transport cost', error);
      // Continue with request creation even if estimation fails
    }

    // Generate request number
    const requestNumber = `TR-${Date.now().toString(36).toUpperCase()}`;

    // Create transport request
    const transportRequest = await this.prisma.transportRequest.create({
      data: {
        requestNumber,
        tradeOperationId: dto.tradeOperationId,
        totalWeight: dto.totalWeight,
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
        maxBudget: dto.maxBudget || (estimatedCost > 0 ? new Prisma.Decimal(estimatedCost * 1.3) : undefined)
      }
    });

    // Update trade operation phase and estimated transport cost
    await this.prisma.tradeOperation.update({
      where: { id: dto.tradeOperationId },
      data: {
        phase: TradePhase.TRANSPORT_MATCHING,
        estimatedTransportCost: estimatedCost > 0 ? new Prisma.Decimal(estimatedCost) : undefined,
        totalDistanceKm: estimatedDistance > 0 ? estimatedDistance : undefined
      }
    });

    return transportRequest;
  }

  async getTransportRequests(query: GetTransportRequestsQueryDto) {
    const where: Prisma.TransportRequestWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.urgencyLevel) {
      where.urgencyLevel = query.urgencyLevel;
    }

    // For transporters, only show open requests
    if (query.transporterId) {
      where.status = TransportRequestStatus.OPEN;
      where.biddingDeadline = {
        gt: new Date()
      };
    }

    const [requests, total] = await Promise.all([
      this.prisma.transportRequest.findMany({
        where,
        include: {
          tradeOperation: {
            include: {
              buyListing: {
                include: {
                  product: true
                }
              }
            }
          },
          _count: {
            select: { bids: true }
          }
        },
        skip: query.offset || 0,
        take: query.limit || 20,
        orderBy: [
          { urgencyLevel: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      this.prisma.transportRequest.count({ where })
    ]);

    // Add bid statistics
    const requestsWithStats = await Promise.all(
      requests.map(async (req) => {
        const bidStats = await this.prisma.transportBid.aggregate({
          where: { transportRequestId: req.id },
          _avg: { bidAmount: true },
          _min: { bidAmount: true }
        });

        return {
          ...req,
          bidsCount: req._count.bids,
          lowestBid: bidStats._min.bidAmount,
          averageBid: bidStats._avg.bidAmount
        };
      })
    );

    return {
      data: requestsWithStats,
      total,
      page: Math.floor((query.offset || 0) / (query.limit || 20)) + 1,
      limit: query.limit || 20
    };
  }

  async getTransportRequestById(id: string) {
    const request = await this.prisma.transportRequest.findUnique({
      where: { id },
      include: {
        tradeOperation: {
          include: {
            buyListing: {
              include: {
                product: true,
                buyer: true
              }
            },
            sellers: {
              include: {
                seller: true
              }
            }
          }
        },
        bids: {
          include: {
            transporter: true,
            assignedTruck: true,
            transportCompany: true
          },
          orderBy: {
            bidAmount: 'asc'
          }
        }
      }
    });

    if (!request) {
      throw new NotFoundException('Transport request not found');
    }

    // Calculate truck tracking logic
    const totalWeight = request.totalWeight;
    const TRUCK_CAPACITY = 20; // Assume 1 truck = 20 tons capacity
    const trucksNeeded = Math.ceil(totalWeight / TRUCK_CAPACITY);

    // Count accepted bids' truck counts
    const acceptedBids = request.bids.filter(b => b.status === BidStatus.ACCEPTED);
    const trucksReserved = acceptedBids.reduce((sum, bid) => {
      // If bid has truckCount metadata in proposedRoute, use it
      // Otherwise calculate from vehicle capacity
      const truckCount = (bid.proposedRoute as any)?.truckCount || Math.ceil(bid.vehicleCapacity / TRUCK_CAPACITY);
      return sum + truckCount;
    }, 0);

    const trucksRemaining = Math.max(0, trucksNeeded - trucksReserved);
    const fulfillmentPercentage = trucksNeeded > 0 ? Math.round((trucksReserved / trucksNeeded) * 100) : 0;

    // Also include estimated cost from platform
    let estimatedCostFromPlatform = null;
    if (request.estimatedDistance) {
      try {
        const estimation = await this.transportCostService.estimateCost(
          (request.pickupPoints as any[]).map(p => ({
            lat: p.location.lat,
            lng: p.location.lng,
            quantity: p.quantity,
            id: p.sellerId
          })),
          {
            lat: (request.deliveryPoint as any).location.lat,
            lng: (request.deliveryPoint as any).location.lng
          },
          {
            vehicleType: request.requiredVehicleType || undefined,
            urgency: request.urgencyLevel === UrgencyLevel.EXPRESS ? 'EXPRESS' : 'NORMAL'
          }
        );
        estimatedCostFromPlatform = estimation.totalCost;
      } catch (error) {
        this.logger.error('Failed to recalculate transport cost', error);
      }
    }

    return {
      ...request,
      estimatedCostFromPlatform,
      truckTracking: {
        totalWeight,
        truckCapacity: TRUCK_CAPACITY,
        trucksNeeded,
        trucksReserved,
        trucksRemaining,
        fulfillmentPercentage,
        isFullyAssigned: trucksRemaining === 0
      }
    };
  }

  // ==================== TRANSPORT BIDS ====================

  async createTransportBid(transporterId: string, dto: CreateTransportBidDto) {
    // Check if transport request exists and is open
    const request = await this.prisma.transportRequest.findUnique({
      where: { id: dto.transportRequestId }
    });

    if (!request) {
      throw new NotFoundException('Transport request not found');
    }

    if (request.status !== TransportRequestStatus.OPEN) {
      throw new BadRequestException('Transport request is not open for bidding');
    }

    if (new Date() > request.biddingDeadline) {
      throw new BadRequestException('Bidding deadline has passed');
    }

    // Check if transporter already has a bid
    const existingBid = await this.prisma.transportBid.findFirst({
      where: {
        transportRequestId: dto.transportRequestId,
        transporterId,
        status: BidStatus.PENDING
      }
    });

    if (existingBid) {
      throw new BadRequestException('You already have an active bid for this request');
    }

    // Create bid with truckCount metadata in proposedRoute
    const proposedRoute = dto.proposedRoute || {};
    if (dto.truckCount) {
      (proposedRoute as any).truckCount = dto.truckCount;
    }

    const bid = await this.prisma.transportBid.create({
      data: {
        transportRequestId: dto.transportRequestId,
        tradeOperationId: request.tradeOperationId,
        transporterId,
        bidAmount: dto.bidAmount,
        estimatedDuration: dto.estimatedDuration,
        vehicleType: dto.vehicleType,
        vehicleCapacity: dto.vehicleCapacity,
        assignedTruckId: dto.assignedTruckId,
        specialEquipment: dto.specialEquipment || [],
        insuranceCoverage: dto.insuranceCoverage,
        proposedRoute,
        pickupSchedule: dto.pickupSchedule,
        status: BidStatus.PENDING,
        submittedAt: new Date(),
        expiresAt: new Date(dto.expiresAt)
      },
      include: {
        transporter: true,
        assignedTruck: true
      }
    });

    return bid;
  }

  async getTransportBids(query: GetTransportBidsQueryDto) {
    const where: Prisma.TransportBidWhereInput = {};

    if (query.transportRequestId) {
      where.transportRequestId = query.transportRequestId;
    }

    if (query.transporterId) {
      where.transporterId = query.transporterId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [bids, total] = await Promise.all([
      this.prisma.transportBid.findMany({
        where,
        include: {
          transporter: true,
            transportRequest: true
        },
        skip: query.offset || 0,
        take: query.limit || 20,
        orderBy: [
          { status: 'asc' },
          { bidAmount: 'asc' }
        ]
      }),
      this.prisma.transportBid.count({ where })
    ]);

    // Add competitiveness ranking
    const bidsWithRanking = bids.map((bid, index) => {
      let competitiveness: string;
      const lowestBid = bids[0]?.bidAmount || bid.bidAmount;
      const ratio = Number(bid.bidAmount) / Number(lowestBid);

      if (ratio === 1) competitiveness = 'LOWEST';
      else if (ratio < 1.1) competitiveness = 'COMPETITIVE';
      else if (ratio < 1.25) competitiveness = 'HIGH';
      else competitiveness = 'OVERPRICED';

      return {
        ...bid,
        ranking: index + 1,
        competitiveness
      };
    });

    return {
      data: bidsWithRanking,
      total,
      page: Math.floor((query.offset || 0) / (query.limit || 20)) + 1,
      limit: query.limit || 20
    };
  }

  async acceptTransportBid(bidId: string, adminId: string) {
    const bid = await this.prisma.transportBid.findUnique({
      where: { id: bidId },
      include: { transportRequest: true }
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Bid is not available for acceptance');
    }

    // Start transaction to accept bid and create job
    const result = await this.prisma.$transaction(async (tx) => {
      // Accept the bid
      const acceptedBid = await tx.transportBid.update({
        where: { id: bidId },
        data: {
          status: BidStatus.ACCEPTED,
          acceptedAt: new Date(),
          evaluatedAt: new Date()
        }
      });

      // Reject all other bids
      await tx.transportBid.updateMany({
        where: {
          transportRequestId: bid.transportRequestId,
          id: { not: bidId },
          status: BidStatus.PENDING
        },
        data: {
          status: BidStatus.REJECTED,
          evaluatedAt: new Date()
        }
      });

      // Close the transport request
      await tx.transportRequest.update({
        where: { id: bid.transportRequestId },
        data: { 
          status: TransportRequestStatus.ASSIGNED
        }
      });

      // Create transport job
      const jobNumber = `JOB-${Date.now().toString(36).toUpperCase()}`;
      const transportJob = await tx.transportJob.create({
        data: {
          jobNumber,
          transportRequestId: bid.transportRequestId,
          transportBidId: bidId,
          tradeOperationId: bid.tradeOperationId,
          transporterId: bid.transporterId,
          status: TransportJobStatus.ASSIGNED,
          pickupsCompleted: [],
          allPickupsComplete: false,
          pickupPhotos: [],
          deliveryPhotos: []
        }
      });

      // Update trade operation phase
      await tx.tradeOperation.update({
        where: { id: bid.tradeOperationId },
        data: { 
          phase: TradePhase.IN_TRANSIT,
          estimatedTransportCost: bid.bidAmount
        }
      });

      return { acceptedBid, transportJob };
    });

    return result;
  }

  async rejectTransportBid(bidId: string, adminId: string, reason?: string) {
    const bid = await this.prisma.transportBid.findUnique({
      where: { id: bidId }
    });

    if (!bid) {
      throw new NotFoundException('Bid not found');
    }

    if (bid.status !== BidStatus.PENDING) {
      throw new BadRequestException('Bid is not available for rejection');
    }

    const rejectedBid = await this.prisma.transportBid.update({
      where: { id: bidId },
      data: {
        status: BidStatus.REJECTED,
        evaluatedAt: new Date()
      }
    });

    return rejectedBid;
  }

  // ==================== TRANSPORT JOBS ====================

  async getTransportJobs(query: GetTransportJobsQueryDto) {
    const where: Prisma.TransportJobWhereInput = {};

    if (query.transporterId) {
      where.transporterId = query.transporterId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.transportJob.findMany({
        where,
        include: {
          transporter: true,
          transportRequest: {
            include: {
              tradeOperation: {
                include: {
                  buyListing: {
                    include: {
                      product: true
                    }
                  }
                }
              }
            }
          },
          transportBid: true,
        },
        skip: query.offset || 0,
        take: query.limit || 20,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.transportJob.count({ where })
    ]);

    return {
      data: jobs,
      total,
      page: Math.floor((query.offset || 0) / (query.limit || 20)) + 1,
      limit: query.limit || 20
    };
  }

  async startTransportJob(jobId: string, transporterId: string) {
    const job = await this.prisma.transportJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new NotFoundException('Transport job not found');
    }

    if (job.transporterId !== transporterId) {
      throw new ForbiddenException('You are not assigned to this job');
    }

    if (job.status !== TransportJobStatus.ASSIGNED) {
      throw new BadRequestException('Job has already been started');
    }

    const updatedJob = await this.prisma.transportJob.update({
      where: { id: jobId },
      data: {
        status: TransportJobStatus.STARTED,
        startedAt: new Date()
      }
    });

    return updatedJob;
  }

  async updateTransportJobStatus(
    jobId: string, 
    transporterId: string, 
    dto: UpdateTransportJobStatusDto
  ) {
    const job = await this.prisma.transportJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new NotFoundException('Transport job not found');
    }

    if (job.transporterId !== transporterId) {
      throw new ForbiddenException('You are not assigned to this job');
    }

    const updateData: any = {
      status: dto.status,
      updatedAt: new Date()
    };

    if (dto.currentLocation) {
      updateData.currentLocation = dto.currentLocation;
    }

    if (dto.estimatedArrival) {
      updateData.estimatedArrival = new Date(dto.estimatedArrival);
    }

    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    const updatedJob = await this.prisma.transportJob.update({
      where: { id: jobId },
      data: updateData
    });

    // Update trade operation phase if delivering
    if (dto.status === TransportJobStatus.DELIVERING) {
      await this.prisma.tradeOperation.update({
        where: { id: job.tradeOperationId },
        data: { phase: TradePhase.DELIVERED }
      });
    }

    return updatedJob;
  }

  async completePickup(
    jobId: string, 
    transporterId: string, 
    dto: CompletePickupDto
  ) {
    const job = await this.prisma.transportJob.findUnique({
      where: { id: jobId },
      include: { transportRequest: true }
    });

    if (!job) {
      throw new NotFoundException('Transport job not found');
    }

    if (job.transporterId !== transporterId) {
      throw new ForbiddenException('You are not assigned to this job');
    }

    const pickupsCompleted = job.pickupsCompleted as any[] || [];
    pickupsCompleted.push({
      sellerId: dto.sellerId,
      quantityPickedUp: dto.quantityPickedUp,
      completedAt: dto.completedAt,
      notes: dto.notes
    });

    const pickupPhotos = [...(job.pickupPhotos || []), ...(dto.pickupPhotos || [])];

    // Check if all pickups are complete
    const pickupPoints = job.transportRequest.pickupPoints as any[];
    const allPickupsComplete = pickupPoints.every(
      point => pickupsCompleted.some(pickup => pickup.sellerId === point.sellerId)
    );

    const updatedJob = await this.prisma.transportJob.update({
      where: { id: jobId },
      data: {
        pickupsCompleted,
        pickupPhotos,
        allPickupsComplete,
        status: allPickupsComplete ? TransportJobStatus.DELIVERING : TransportJobStatus.PICKING_UP
      }
    });

    return updatedJob;
  }

  async completeDelivery(
    jobId: string, 
    transporterId: string, 
    dto: CompleteDeliveryDto
  ) {
    const job = await this.prisma.transportJob.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new NotFoundException('Transport job not found');
    }

    if (job.transporterId !== transporterId) {
      throw new ForbiddenException('You are not assigned to this job');
    }

    if (!job.allPickupsComplete) {
      throw new BadRequestException('All pickups must be completed before delivery');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedJob = await tx.transportJob.update({
        where: { id: jobId },
        data: {
          status: TransportJobStatus.COMPLETED,
          actualDelivery: new Date(dto.completedAt),
          deliveryPhotos: dto.deliveryPhotos || [],
          proofOfDelivery: dto.proofOfDelivery,
          customerRating: dto.customerRating,
          completedAt: new Date(dto.completedAt),
          onTimeDelivery: true // TODO: Calculate based on deadline
        }
      });

      // Update trade operation to PAYMENT phase
      await tx.tradeOperation.update({
        where: { id: job.tradeOperationId },
        data: { 
          phase: TradePhase.COMPLETED
        }
      });

      // Close transport request
      await tx.transportRequest.update({
        where: { id: job.transportRequestId },
        data: { status: TransportRequestStatus.COMPLETED }
      });

      return updatedJob;
    });

    return result;
  }

  async getTransportDataForTradeOperation(tradeOperationId: string) {
    const request = await this.prisma.transportRequest.findUnique({
      where: { tradeOperationId },
      include: {
        bids: {
          include: {
            transporter: {
              include: { company: true },
            },
            transportCompany: true,
          },
          orderBy: { submittedAt: 'asc' },
        },
        transportJob: true,
      },
    });

    return {
      request,
      bids: request?.bids ?? [],
      job: request?.transportJob ?? null,
    };
  }
}
