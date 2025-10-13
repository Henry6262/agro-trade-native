import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, TransportRequestStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SimulationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all users by role for simulation purposes
   */
  async getUsersByRole(role: UserRole) {
    const users = await this.prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        company: {
          select: {
            id: true,
            legalName: true,
          },
        },
      },
    });

    return users;
  }

  /**
   * Get complete trade operation state for scenario orchestration
   */
  async getFullTradeState(tradeOperationId: string) {
    const operation = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
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
            product: true,
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
            saleListing: true,
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
                    email: true,
                  },
                },
              },
            },
          },
        },
        transportRequest: {
          include: {
            bids: {
              include: {
                transporter: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            transportJob: true,
          },
        },
        inspections: {
          include: {
            inspector: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            saleListing: {
              include: {
                seller: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!operation) {
      throw new Error(`Trade operation ${tradeOperationId} not found`);
    }

    // Calculate derived state
    const totalQuantityNeeded = Number(operation.buyListing.quantity);
    const securedQuantity = operation.sellers
      .filter((s) => s.status === 'ACCEPTED')
      .reduce((sum, s) => sum + Number(s.offeredQuantity || 0), 0);

    const pendingNegotiations = operation.negotiations.filter(
      (n) => n.status === 'PENDING'
    ).length;

    const activeTransport = operation.transportRequest &&
      (operation.transportRequest.status === TransportRequestStatus.ASSIGNED || operation.transportRequest.status === TransportRequestStatus.IN_PROGRESS)
      ? operation.transportRequest
      : null;

    return {
      operation,
      state: {
        phase: operation.phase,
        status: operation.status,
        totalQuantityNeeded,
        securedQuantity,
        quantityGap: totalQuantityNeeded - securedQuantity,
        pendingNegotiations,
        activeTransport: activeTransport
          ? {
              id: activeTransport.id,
              status: activeTransport.status,
              bidsCount: activeTransport.bids.length,
              selectedBid: activeTransport.bids.find(
                (b) => b.status === 'ACCEPTED'
              ),
            }
          : null,
        inspections: {
          total: operation.inspections.length,
          pending: operation.inspections.filter(
            (i) => i.status === 'PENDING'
          ).length,
          completed: operation.inspections.filter(
            (i) => i.status === 'COMPLETED'
          ).length,
        },
      },
      actors: {
        buyer: operation.buyListing.buyer,
        sellers: operation.sellers.map((s: any) => ({
          id: s.seller.id,
          name: s.seller.name,
          email: s.seller.email,
          tradeSellerStatus: s.status,
          isVerified: s.isVerified,
          offeredQuantity: Number(s.offeredQuantity),
        })),
        transporters: activeTransport
          ? activeTransport.bids.map((b: any) => ({
              id: b.transporter.id,
              name: b.transporter.name,
              email: b.transporter.email,
              bidAmount: Number(b.bidAmount),
              bidStatus: b.status,
            }))
          : [],
        inspectors: (operation as any).inspectionRequests?.map((i: any) => ({
          inspector: i.inspector,
          inspectionStatus: i.status,
          verificationResult: i.verificationResult,
        })) || [],
      },
    };
  }

  /**
   * Create a sale listing for a farmer with mock product and location data
   */
  async createFarmerSaleListing(farmerId: string, data: {
    productCategory: string;
    quantity: number;
    pricePerUnit: number;
    latitude?: number;
    longitude?: number;
  }) {
    try {
      console.log('[createFarmerSaleListing] Input:', { farmerId, data });

      // Get or create product
      let product = await this.prisma.product.findFirst({
        where: { category: data.productCategory as any },
      });

      console.log('[createFarmerSaleListing] Found product:', product);

      if (!product) {
        // Create a basic product if it doesn't exist
        product = await this.prisma.product.create({
          data: {
            category: data.productCategory as any,
            name: data.productCategory.toLowerCase(),
            displayName: data.productCategory,
          },
        });
        console.log('[createFarmerSaleListing] Created product:', product);
      }

      // Create sale listing
      const saleListingData = {
        sellerId: farmerId,
        productId: product.id,
        quantity: data.quantity,
        unit: 'TON' as any,
        askingPrice: data.pricePerUnit,
        qualityGrade: 'Premium',
        status: 'ACTIVE' as any,
      };

      console.log('[createFarmerSaleListing] Creating sale listing with data:', saleListingData);

      const saleListing = await this.prisma.saleListing.create({
        data: saleListingData,
      });

      console.log('[createFarmerSaleListing] Created sale listing:', saleListing);
      return saleListing;
    } catch (error) {
      console.error('[createFarmerSaleListing] ERROR:', error);
      throw error;
    }
  }

  /**
   * Create trade operation from buy listing (admin action)
   */
  async createTradeOperation(buyListingId: string, data: {
    adminMargin: number;
    buyerCommission: number;
    sellerCommission: number;
  }) {
    const buyListing = await this.prisma.buyListing.findUnique({
      where: { id: buyListingId },
      include: { product: true },
    });

    if (!buyListing) {
      throw new Error('Buy listing not found');
    }

    // Get an admin user (in simulation, use the first admin found)
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      throw new Error('No admin user found');
    }

    // Create trade operation
    const operationNumber = `OP-${Date.now()}`;
    const tradeOp = await this.prisma.tradeOperation.create({
      data: {
        operationNumber,
        adminId: admin.id,
        buyListingId,
        phase: 'SELLER_MATCHING',
        status: 'ACTIVE',
      },
    });

    return tradeOp;
  }

  /**
   * Send offers to multiple farmers (create TradeSeller + OfferNegotiation)
   */
  async sendOffersToFarmers(tradeOperationId: string, offers: Array<{
    farmerId: string;
    saleListingId: string;
    requestedQuantity: number;
    offeredPrice: number;
  }>) {
    const results = [];

    for (const offer of offers) {
      // Create TradeSeller
      const tradeSeller = await this.prisma.tradeSeller.create({
        data: {
          tradeOperationId,
          sellerId: offer.farmerId,
          saleListingId: offer.saleListingId,
          requestedQuantity: offer.requestedQuantity,
          offeredQuantity: offer.requestedQuantity,
          unit: 'TON',
          status: 'INVITED',
        },
      });

      // Create OfferNegotiation (expires in 48 hours)
      const negotiation = await this.prisma.offerNegotiation.create({
        data: {
          tradeSellerId: tradeSeller.id,
          tradeOperationId,
          status: 'PENDING',
          currentOffer: {
            price: offer.offeredPrice,
            quantity: offer.requestedQuantity,
            timestamp: new Date().toISOString(),
          },
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      results.push({ tradeSeller, negotiation });
    }

    return results;
  }

  /**
   * Admin accepts a counter-offer from farmer
   */
  async adminAcceptCounterOffer(negotiationId: string) {
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: { tradeSeller: true },
    });

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    const counterOffer = negotiation.counterOffer as any;

    // Update negotiation
    await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    });

    // Update trade seller
    await this.prisma.tradeSeller.update({
      where: { id: negotiation.tradeSellerId },
      data: {
        status: 'ACCEPTED',
        agreedQuantity: counterOffer?.quantity || negotiation.tradeSeller.requestedQuantity,
        agreedPrice: counterOffer?.price,
      },
    });

    return { success: true };
  }

  /**
   * Assign inspector to trade sellers for verification
   */
  async assignInspector(tradeOperationId: string, inspectorId: string) {
    // Get all accepted trade sellers
    const tradeSellers = await this.prisma.tradeSeller.findMany({
      where: {
        tradeOperationId,
        status: 'ACCEPTED',
      },
      include: { saleListing: true },
    });

    const inspections = [];

    for (const ts of tradeSellers) {
      const inspection = await this.prisma.inspectionRequest.create({
        data: {
          saleListingId: ts.saleListingId,
          tradeOperationId,
          inspectorId,
          status: 'SCHEDULED',
          scheduledDate: new Date(),
          latitude: 24.4539, // Default Abu Dhabi coordinates for simulation
          longitude: 54.3773,
          address: 'Farm Location',
        },
      });

      inspections.push(inspection);
    }

    // Update trade operation phase
    await this.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: { phase: 'INSPECTION_PENDING' },
    });

    return inspections;
  }

  /**
   * Create transport request and accept a transport bid
   */
  async createAndAcceptTransportBid(tradeOperationId: string, data: {
    transporterId: string;
    pickupLat: number;
    pickupLng: number;
    deliveryLat: number;
    deliveryLng: number;
    bidAmount: number;
    estimatedDuration: number;
  }) {
    // Calculate distance in km (simple Euclidean for simulation)
    const distanceKm = Math.sqrt(
      Math.pow((data.deliveryLat - data.pickupLat) * 111, 2) +
      Math.pow((data.deliveryLng - data.pickupLng) * 111, 2)
    );

    // Get trade operation to calculate total weight
    const tradeOp = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        buyListing: true,
        sellers: {
          where: { status: 'ACCEPTED' }
        }
      }
    });

    if (!tradeOp) {
      throw new Error('Trade operation not found');
    }

    const totalWeight = tradeOp.sellers.reduce((sum, s) => sum + Number(s.agreedQuantity || 0), 0);

    // Create transport request using correct schema
    const requestNumber = `TR-${Date.now()}`;
    const transportRequest = await this.prisma.transportRequest.create({
      data: {
        requestNumber,
        tradeOperationId,
        totalWeight,
        pickupPoints: [{ lat: data.pickupLat, lng: data.pickupLng, address: 'Farm Location' }],
        deliveryPoint: { lat: data.deliveryLat, lng: data.deliveryLng, address: 'Buyer Location' },
        estimatedDistance: distanceKm,
        status: 'OPEN',
        biddingDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
        deliveryDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Create transport bid
    const transportBid = await this.prisma.transportBid.create({
      data: {
        transportRequestId: transportRequest.id,
        transporterId: data.transporterId,
        tradeOperationId,
        bidAmount: data.bidAmount,
        estimatedDuration: data.estimatedDuration,
        vehicleType: 'FLATBED',
        vehicleCapacity: 30,
        status: 'ACCEPTED',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        acceptedAt: new Date(),
        evaluatedAt: new Date(),
      },
    });

    // Create transport job
    const jobNumber = `JOB-${Date.now()}`;
    const transportJob = await this.prisma.transportJob.create({
      data: {
        jobNumber,
        transportRequestId: transportRequest.id,
        transportBidId: transportBid.id,
        transporterId: data.transporterId,
        tradeOperationId,
        status: 'ASSIGNED',
      },
    });

    // Update transport request to ASSIGNED
    await this.prisma.transportRequest.update({
      where: { id: transportRequest.id },
      data: {
        status: 'ASSIGNED',
        selectedBidId: transportBid.id,
      },
    });

    // Update trade operation to IN_TRANSIT
    await this.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: { phase: 'IN_TRANSIT' },
    });

    return { transportRequest, transportBid, transportJob, distanceKm };
  }

  /**
   * Complete trade operation (mark as delivered and completed)
   */
  async completeTradeOperation(tradeOperationId: string) {
    // Update trade operation
    await this.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: {
        phase: 'DELIVERED',
        status: 'COMPLETED',
      },
    });

    return { success: true, message: 'Trade completed successfully' };
  }

  /**
   * Create transport request WITHOUT accepting a bid (for bidding competition scenarios)
   */
  async createTransportRequest(tradeOperationId: string, data: {
    pickupLat: number;
    pickupLng: number;
    deliveryLat: number;
    deliveryLng: number;
    distanceKm?: number;
  }) {
    const distanceKm = data.distanceKm || Math.sqrt(
      Math.pow((data.deliveryLat - data.pickupLat) * 111, 2) +
      Math.pow((data.deliveryLng - data.pickupLng) * 111, 2)
    );

    // Get trade operation to calculate total weight
    const tradeOp = await this.prisma.tradeOperation.findUnique({
      where: { id: tradeOperationId },
      include: {
        sellers: {
          where: { status: 'ACCEPTED' }
        }
      }
    });

    if (!tradeOp) {
      throw new Error('Trade operation not found');
    }

    const totalWeight = tradeOp.sellers.reduce((sum, s) => sum + Number(s.agreedQuantity || 0), 0);

    const requestNumber = `TR-${Date.now()}`;
    const transportRequest = await this.prisma.transportRequest.create({
      data: {
        requestNumber,
        tradeOperationId,
        totalWeight,
        pickupPoints: [{ lat: data.pickupLat, lng: data.pickupLng, address: 'Farm Location' }],
        deliveryPoint: { lat: data.deliveryLat, lng: data.deliveryLng, address: 'Buyer Location' },
        estimatedDistance: distanceKm,
        status: 'OPEN',
        biddingDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
        deliveryDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { transportRequest, distanceKm };
  }

  /**
   * Transporter submits a bid for a transport request
   */
  async transporterSubmitBid(transportRequestId: string, data: {
    transporterId: string;
    tradeOperationId: string;
    bidAmount: number;
    estimatedDuration: number;
    vehicleType?: string;
    notes?: string;
  }) {
    const transportBid = await this.prisma.transportBid.create({
      data: {
        transportRequestId,
        transporterId: data.transporterId,
        tradeOperationId: data.tradeOperationId,
        bidAmount: data.bidAmount,
        estimatedDuration: data.estimatedDuration,
        vehicleType: (data.vehicleType || 'FLATBED') as any,
        vehicleCapacity: 30,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    return { transportBid, message: `Bid submitted: €${data.bidAmount} (${data.estimatedDuration}h)` };
  }

  /**
   * Admin selects a winning bid from multiple submissions
   */
  async adminSelectTransportBid(transportRequestId: string, bidId: string) {
    // Get the winning bid
    const winningBid = await this.prisma.transportBid.findUnique({
      where: { id: bidId },
      include: { transportRequest: true },
    });

    if (!winningBid) {
      throw new Error('Bid not found');
    }

    // Update bid status
    await this.prisma.transportBid.update({
      where: { id: bidId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        evaluatedAt: new Date(),
      },
    });

    // Reject other bids
    await this.prisma.transportBid.updateMany({
      where: {
        transportRequestId,
        id: { not: bidId },
        status: 'PENDING',
      },
      data: {
        status: 'REJECTED',
        evaluatedAt: new Date(),
      },
    });

    // Create transport job
    const jobNumber = `JOB-${Date.now()}`;
    const transportJob = await this.prisma.transportJob.create({
      data: {
        jobNumber,
        transportRequestId,
        transportBidId: bidId,
        transporterId: winningBid.transporterId,
        tradeOperationId: winningBid.tradeOperationId,
        status: 'ASSIGNED',
      },
    });

    // Update transport request
    await this.prisma.transportRequest.update({
      where: { id: transportRequestId },
      data: {
        status: 'ASSIGNED',
        selectedBidId: bidId,
      },
    });

    // Update trade operation phase
    await this.prisma.tradeOperation.update({
      where: { id: winningBid.tradeOperationId },
      data: { phase: 'IN_TRANSIT' },
    });

    return { transportJob, winningBid, message: `Selected bid from transporter for €${winningBid.bidAmount}` };
  }

  /**
   * Update negotiation pricing (for quality disputes with price adjustments)
   */
  async updateNegotiationPricing(negotiationId: string, data: {
    newPrice: number;
    reason?: string;
  }) {
    const negotiation = await this.prisma.offerNegotiation.findUnique({
      where: { id: negotiationId },
      include: { tradeSeller: true },
    });

    if (!negotiation) {
      throw new Error('Negotiation not found');
    }

    // Update negotiation current offer
    const currentOffer = negotiation.currentOffer as any;
    const updatedOffer = {
      ...currentOffer,
      price: data.newPrice,
      adjustedForQuality: true,
      adjustmentReason: data.reason || 'Quality-based price adjustment',
      timestamp: new Date().toISOString(),
    };

    await this.prisma.offerNegotiation.update({
      where: { id: negotiationId },
      data: {
        currentOffer: updatedOffer,
      },
    });

    // Update trade seller final price
    await this.prisma.tradeSeller.update({
      where: { id: negotiation.tradeSellerId },
      data: {
        agreedPrice: data.newPrice,
      },
    });

    return {
      negotiation: { ...negotiation, currentOffer: updatedOffer },
      message: `Price adjusted to €${data.newPrice} - ${data.reason || 'Quality adjustment'}`,
    };
  }

  /**
   * Create a mock/test user for scenario testing
   */
  async createTestUser(role: UserRole, data: any = {}) {
    const timestamp = Date.now();
    const email = `test-${role.toLowerCase()}-${timestamp}@test.com`;

    // Hash password for testing
    const hashedPassword = await bcrypt.hash('test123', 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        name: data?.name || `Test ${role}`,
        password: hashedPassword,
        phoneNumber: `+1555${timestamp.toString().slice(-7)}`, // Unique phone number
        role: role as UserRole, // Ensure role is treated as enum
        isEmailVerified: true,
        onboardingCompleted: true,
        isActive: true,
      },
    });

    // For buyers and farmers, we may want to create a company
    if (role === UserRole.BUYER && data?.companyName) {
      await this.prisma.company.create({
        data: {
          userId: user.id,
          legalName: data.companyName || `Test Company ${timestamp}`,
        },
      });
    }

    if (role === UserRole.FARMER && data?.companyName) {
      await this.prisma.company.create({
        data: {
          userId: user.id,
          legalName: data.companyName || data.farmName || `Test Farm ${timestamp}`,
        },
      });
    }

    if (role === UserRole.TRANSPORTER && data?.companyName) {
      await this.prisma.company.create({
        data: {
          userId: user.id,
          legalName: data.companyName || `Test Transport ${timestamp}`,
        },
      });
    }

    const createdUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        company: true,
      },
    });

    return createdUser;
  }

  /**
   * Cleanup all test data (users with test- emails and their related data)
   */
  async cleanupTestData() {
    try {
      // Find all test users
      const testUsers = await this.prisma.user.findMany({
        where: {
          email: {
            startsWith: 'test-',
          },
        },
        select: {
          id: true,
          email: true,
        },
      });

      if (testUsers.length === 0) {
        return {
          success: true,
          message: 'No test users found to clean up',
          deletedCount: 0,
        };
      }

      const userIds = testUsers.map((u) => u.id);

      // Delete in correct order to respect foreign key constraints
      // Note: Cascade deletes should handle most of this, but being explicit

      // Delete related data first
      await this.prisma.transportBid.deleteMany({
        where: { transporterId: { in: userIds } },
      });

      await this.prisma.transportJob.deleteMany({
        where: { transporterId: { in: userIds } },
      });

      await this.prisma.inspectionRequest.deleteMany({
        where: { inspectorId: { in: userIds } },
      });

      await this.prisma.tradeSeller.deleteMany({
        where: { sellerId: { in: userIds } },
      });

      await this.prisma.tradeTransporter.deleteMany({
        where: { transporterId: { in: userIds } },
      });

      // Delete listings
      await this.prisma.saleListing.deleteMany({
        where: { sellerId: { in: userIds } },
      });

      await this.prisma.buyListing.deleteMany({
        where: { buyerId: { in: userIds } },
      });

      // Delete users (cascade should handle companies and addresses)
      const deleteResult = await this.prisma.user.deleteMany({
        where: {
          id: { in: userIds },
        },
      });

      return {
        success: true,
        message: `Successfully cleaned up ${deleteResult.count} test users and their related data`,
        deletedCount: deleteResult.count,
        emails: testUsers.map((u) => u.email),
      };
    } catch (error) {
      console.error('Cleanup test data error:', error);
      throw new Error(`Failed to cleanup test data: ${error.message}`);
    }
  }
}
