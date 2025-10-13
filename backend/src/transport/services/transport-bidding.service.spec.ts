import { Test, TestingModule } from '@nestjs/testing';
import { TransportBiddingService } from './transport-bidding.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransportCostService } from './transport-cost.service';
import {
  TransportRequestStatus,
  BidStatus,
  TransportJobStatus,
  UrgencyLevel,
  TradePhase,
  TruckType,
  Prisma
} from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TransportBiddingService', () => {
  let service: TransportBiddingService;
  let prisma: PrismaService;
  let transportCostService: TransportCostService;

  const mockPrisma: any = {
    tradeOperation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transportRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    transportBid: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
    },
    transportJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  mockPrisma.$transaction = jest.fn((callback: any) => callback(mockPrisma));

  const mockTransportCostService = {
    estimateCost: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportBiddingService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: TransportCostService,
          useValue: mockTransportCostService,
        },
      ],
    }).compile();

    service = module.get<TransportBiddingService>(TransportBiddingService);
    prisma = module.get<PrismaService>(PrismaService);
    transportCostService = module.get<TransportCostService>(TransportCostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTransportRequest', () => {
    it('should create transport request with distance and cost calculation', async () => {
      const mockTradeOperation = {
        id: 'trade-1',
        buyListing: {
          buyerId: 'buyer-1',
          buyer: { name: 'Buyer Company' },
          deliveryAddress: {
            latitude: 42.6977,
            longitude: 23.3219,
            street: 'Sofia Central Warehouse'
          },
          product: { name: 'Soft Wheat' }
        },
        sellers: [
          {
            sellerId: 'seller-1',
            saleListingId: 'listing-1',
            seller: { name: 'Seller 1' },
            saleListing: {
              address: {
                latitude: 42.5,
                longitude: 23.5,
                street: 'Farm 1'
              }
            },
            agreedQuantity: new Prisma.Decimal(50),
            requestedQuantity: new Prisma.Decimal(50),
            unit: 'TON',
            status: 'ACCEPTED'
          }
        ]
      };

      const mockEstimation = {
        totalDistance: 120.5,
        totalCost: 1807.5,
        currency: 'EUR',
        breakdown: {
          distanceCost: 1500,
          loadingCosts: 25,
          vehicleMultiplier: 1.0,
          appliedRate: 0.15
        },
        route: {
          pickupSequence: [],
          deliveryPoint: { lat: 42.6977, lng: 23.3219 }
        },
        vehicleInfo: {
          type: TruckType.FLATBED,
          requiredCapacity: 50,
          multiplier: 1.0
        }
      };

      mockPrisma.tradeOperation.findUnique.mockResolvedValue(mockTradeOperation);
      mockTransportCostService.estimateCost.mockResolvedValue(mockEstimation);
      mockPrisma.transportRequest.create.mockResolvedValue({
        id: 'request-1',
        requestNumber: 'TR-TEST123',
        totalWeight: 50,
        estimatedDistance: 120.5,
        status: TransportRequestStatus.OPEN
      });
      mockPrisma.tradeOperation.update.mockResolvedValue({});

      const dto = {
        tradeOperationId: 'trade-1',
        totalWeight: 50,
        biddingDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      };

      const result = await service.createTransportRequest(dto);

      expect(result).toBeDefined();
      expect(result.estimatedDistance).toBe(120.5);
      expect(mockTransportCostService.estimateCost).toHaveBeenCalled();
      expect(mockPrisma.tradeOperation.update).toHaveBeenCalledWith({
        where: { id: 'trade-1' },
        data: expect.objectContaining({
          phase: TradePhase.TRANSPORT_MATCHING,
          estimatedTransportCost: expect.any(Prisma.Decimal),
          totalDistanceKm: 120.5
        })
      });
    });

    it('should throw NotFoundException if trade operation not found', async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(null);

      const dto = {
        tradeOperationId: 'invalid-id',
        totalWeight: 50,
        biddingDeadline: new Date().toISOString(),
      };

      await expect(service.createTransportRequest(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no accepted sellers', async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue({
        id: 'trade-1',
        buyListing: {
          deliveryAddress: { latitude: 42.6977, longitude: 23.3219 }
        },
        sellers: []
      });

      const dto = {
        tradeOperationId: 'trade-1',
        totalWeight: 50,
        biddingDeadline: new Date().toISOString(),
      };

      await expect(service.createTransportRequest(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransportRequestById', () => {
    it('should return transport request with truck tracking', async () => {
      const mockRequest = {
        id: 'request-1',
        totalWeight: 100,
        estimatedDistance: 200,
        pickupPoints: [
          {
            sellerId: 'seller-1',
            location: { lat: 42.5, lng: 23.5 },
            quantity: 100
          }
        ],
        deliveryPoint: {
          location: { lat: 42.6977, lng: 23.3219 }
        },
        urgencyLevel: UrgencyLevel.STANDARD,
        requiredVehicleType: TruckType.FLATBED,
        bids: [
          {
            id: 'bid-1',
            status: BidStatus.ACCEPTED,
            vehicleCapacity: 40,
            proposedRoute: { truckCount: 2 }
          },
          {
            id: 'bid-2',
            status: BidStatus.PENDING,
            vehicleCapacity: 20,
            proposedRoute: {}
          }
        ],
        tradeOperation: {
          buyListing: {
            product: { name: 'Soft Wheat' },
            buyer: { name: 'Buyer Company' }
          },
          sellers: []
        }
      };

      mockPrisma.transportRequest.findUnique.mockResolvedValue(mockRequest);
      mockTransportCostService.estimateCost.mockResolvedValue({
        totalCost: 3000,
        totalDistance: 200
      });

      const result = await service.getTransportRequestById('request-1');

      expect(result).toBeDefined();
      expect(result.truckTracking).toEqual({
        totalWeight: 100,
        truckCapacity: 20,
        trucksNeeded: 5, // 100 / 20 = 5
        trucksReserved: 2, // From accepted bid
        trucksRemaining: 3,
        fulfillmentPercentage: 40,
        isFullyAssigned: false
      });
    });
  });

  describe('createTransportBid', () => {
    it('should create transport bid with truck count', async () => {
      const mockRequest = {
        id: 'request-1',
        tradeOperationId: 'trade-1',
        status: TransportRequestStatus.OPEN,
        biddingDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      mockPrisma.transportRequest.findUnique.mockResolvedValue(mockRequest);
      mockPrisma.transportBid.findFirst.mockResolvedValue(null);
      mockPrisma.transportBid.create.mockResolvedValue({
        id: 'bid-1',
        transportRequestId: 'request-1',
        transporterId: 'transporter-1',
        bidAmount: new Prisma.Decimal(2500),
        truckCount: 3,
        status: BidStatus.PENDING
      });

      const dto = {
        transportRequestId: 'request-1',
        bidAmount: 2500,
        truckCount: 3,
        estimatedDuration: 6,
        vehicleType: TruckType.FLATBED,
        vehicleCapacity: 20,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      };

      const result = await service.createTransportBid('transporter-1', dto);

      expect(result).toBeDefined();
      expect(mockPrisma.transportBid.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            proposedRoute: expect.objectContaining({ truckCount: 3 })
          })
        })
      );
    });

    it('should throw BadRequestException if bidding deadline passed', async () => {
      const mockRequest = {
        id: 'request-1',
        status: TransportRequestStatus.OPEN,
        biddingDeadline: new Date(Date.now() - 1000) // Past deadline
      };

      mockPrisma.transportRequest.findUnique.mockResolvedValue(mockRequest);

      const dto = {
        transportRequestId: 'request-1',
        bidAmount: 2500,
        truckCount: 3,
        estimatedDuration: 6,
        vehicleType: TruckType.FLATBED,
        vehicleCapacity: 20,
        expiresAt: new Date().toISOString()
      };

      await expect(service.createTransportBid('transporter-1', dto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('acceptTransportBid', () => {
    it('should accept bid and create transport job', async () => {
      const mockBid = {
        id: 'bid-1',
        transportRequestId: 'request-1',
        tradeOperationId: 'trade-1',
        transporterId: 'transporter-1',
        bidAmount: new Prisma.Decimal(2500),
        status: BidStatus.PENDING
      };

      mockPrisma.transportBid.findUnique.mockResolvedValue(mockBid);
      mockPrisma.transportBid.update.mockResolvedValue({
        ...mockBid,
        status: BidStatus.ACCEPTED
      });
      mockPrisma.transportBid.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.transportRequest.update.mockResolvedValue({});
      mockPrisma.transportJob.create.mockResolvedValue({
        id: 'job-1',
        jobNumber: 'JOB-123',
        status: TransportJobStatus.ASSIGNED
      });
      mockPrisma.tradeOperation.update.mockResolvedValue({});

      const result = await service.acceptTransportBid('bid-1', 'admin-1');

      expect(result.acceptedBid).toBeDefined();
      expect(result.transportJob).toBeDefined();
      expect(mockPrisma.transportBid.updateMany).toHaveBeenCalled(); // Reject other bids
      expect(mockPrisma.tradeOperation.update).toHaveBeenCalledWith({
        where: { id: 'trade-1' },
        data: expect.objectContaining({
          phase: TradePhase.IN_TRANSIT
        })
      });
    });
  });

  describe('autoCreateTransportRequestForTrade', () => {
    it('should auto-create transport request when all sellers verified', async () => {
      const mockTradeOperation = {
        id: 'trade-1',
        sellers: [
          {
            sellerId: 'seller-1',
            status: 'ACCEPTED',
            isVerified: true,
            agreedQuantity: new Prisma.Decimal(50),
            requestedQuantity: new Prisma.Decimal(50)
          },
          {
            sellerId: 'seller-2',
            status: 'ACCEPTED',
            isVerified: true,
            agreedQuantity: new Prisma.Decimal(30),
            requestedQuantity: new Prisma.Decimal(30)
          }
        ]
      };

      mockPrisma.tradeOperation.findUnique.mockResolvedValue(mockTradeOperation);

      // Mock the createTransportRequest call
      jest.spyOn(service, 'createTransportRequest').mockResolvedValue({
        id: 'request-1',
        requestNumber: 'TR-AUTO123',
        totalWeight: 80
      } as any);

      const result = await service.autoCreateTransportRequestForTrade('trade-1');

      expect(result).toBeDefined();
      expect(service.createTransportRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          tradeOperationId: 'trade-1',
          totalWeight: 80,
          urgencyLevel: UrgencyLevel.STANDARD
        })
      );
    });

    it('should return null if no weight to transport', async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue({
        id: 'trade-1',
        sellers: []
      });

      const result = await service.autoCreateTransportRequestForTrade('trade-1');

      expect(result).toBeNull();
    });
  });
});
