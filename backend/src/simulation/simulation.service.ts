import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
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
        transportRequests: {
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
        inspectionRequests: {
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

    const activeTransport = operation.transportRequests.find(
      (r) => r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS'
    );

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
          total: operation.inspectionRequests.length,
          pending: operation.inspectionRequests.filter(
            (i) => i.status === 'PENDING'
          ).length,
          completed: operation.inspectionRequests.filter(
            (i) => i.status === 'COMPLETED'
          ).length,
        },
      },
      actors: {
        buyer: operation.buyListing.buyer,
        sellers: operation.sellers.map((s) => ({
          id: s.seller.id,
          name: s.seller.name,
          email: s.seller.email,
          tradeSellerStatus: s.status,
          isVerified: s.isVerified,
          offeredQuantity: Number(s.offeredQuantity),
        })),
        transporters: activeTransport
          ? activeTransport.bids.map((b) => ({
              id: b.transporter.id,
              name: b.transporter.name,
              email: b.transporter.email,
              bidAmount: Number(b.bidAmount),
              bidStatus: b.status,
            }))
          : [],
        inspectors: operation.inspectionRequests.map((i) => ({
          inspector: i.inspector,
          inspectionStatus: i.status,
          verificationResult: i.verificationResult,
        })),
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
    // Get or create product
    let product = await this.prisma.product.findFirst({
      where: { category: data.productCategory as any },
    });

    if (!product) {
      // Create a basic product if it doesn't exist
      product = await this.prisma.product.create({
        data: {
          category: data.productCategory as any,
          name: data.productCategory.toLowerCase(),
          displayName: data.productCategory,
        },
      });
    }

    // Create sale listing
    const saleListing = await this.prisma.saleListing.create({
      data: {
        sellerId: farmerId,
        productId: product.id,
        quantity: data.quantity,
        unit: 'TON',
        pricePerUnit: data.pricePerUnit,
        quality: 'PREMIUM',
        status: 'ACTIVE',
        availableFrom: new Date(),
        availableUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        latitude: data.latitude || 40.7128, // Default NYC
        longitude: data.longitude || -74.0060,
      },
    });

    return saleListing;
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

    // Create trade operation
    const tradeOp = await this.prisma.tradeOperation.create({
      data: {
        buyListingId,
        phase: 'SELLER_MATCHING',
        status: 'IN_PROGRESS',
        adminMargin: data.adminMargin,
        buyerCommission: data.buyerCommission,
        sellerCommission: data.sellerCommission,
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

      // Create OfferNegotiation
      const negotiation = await this.prisma.offerNegotiation.create({
        data: {
          tradeSellerId: tradeSeller.id,
          status: 'PENDING',
          currentOffer: {
            price: offer.offeredPrice,
            quantity: offer.requestedQuantity,
            timestamp: new Date().toISOString(),
          },
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
        finalPrice: counterOffer?.price,
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
          status: 'ASSIGNED',
          scheduledDate: new Date(),
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

    // Create transport request
    const transportRequest = await this.prisma.transportRequest.create({
      data: {
        tradeOperationId,
        pickupLatitude: data.pickupLat,
        pickupLongitude: data.pickupLng,
        deliveryLatitude: data.deliveryLat,
        deliveryLongitude: data.deliveryLng,
        status: 'PENDING',
        requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
        status: 'ACCEPTED', // Directly accept for simulation
        submittedAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    // Create transport job
    const transportJob = await this.prisma.transportJob.create({
      data: {
        transportRequestId: transportRequest.id,
        transporterId: data.transporterId,
        tradeOperationId,
        status: 'ASSIGNED',
        pickupLocation: `${data.pickupLat},${data.pickupLng}`,
        deliveryLocation: `${data.deliveryLat},${data.deliveryLng}`,
        estimatedDistance: distanceKm,
        agreedPrice: data.bidAmount,
      },
    });

    // Update transport request
    await this.prisma.transportRequest.update({
      where: { id: transportRequest.id },
      data: { status: 'ACCEPTED' },
    });

    // Update trade operation
    await this.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: { phase: 'TRANSPORT_IN_PROGRESS' },
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

    const transportRequest = await this.prisma.transportRequest.create({
      data: {
        tradeOperationId,
        pickupLatitude: data.pickupLat,
        pickupLongitude: data.pickupLng,
        deliveryLatitude: data.deliveryLat,
        deliveryLongitude: data.deliveryLng,
        status: 'PENDING',
        requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
        vehicleType: data.vehicleType || 'FLATBED',
        vehicleCapacity: 30,
        status: 'PENDING',
        submittedAt: new Date(),
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
      data: { status: 'ACCEPTED' },
    });

    // Reject other bids
    await this.prisma.transportBid.updateMany({
      where: {
        transportRequestId,
        id: { not: bidId },
        status: 'PENDING',
      },
      data: { status: 'REJECTED' },
    });

    // Create transport job
    const transportJob = await this.prisma.transportJob.create({
      data: {
        transportRequestId,
        transporterId: winningBid.transporterId,
        tradeOperationId: winningBid.tradeOperationId,
        status: 'ASSIGNED',
        pickupLocation: `${winningBid.transportRequest.pickupLatitude},${winningBid.transportRequest.pickupLongitude}`,
        deliveryLocation: `${winningBid.transportRequest.deliveryLatitude},${winningBid.transportRequest.deliveryLongitude}`,
        estimatedDistance: Math.sqrt(
          Math.pow((winningBid.transportRequest.deliveryLatitude - winningBid.transportRequest.pickupLatitude) * 111, 2) +
          Math.pow((winningBid.transportRequest.deliveryLongitude - winningBid.transportRequest.pickupLongitude) * 111, 2)
        ),
        agreedPrice: winningBid.bidAmount,
      },
    });

    // Update transport request
    await this.prisma.transportRequest.update({
      where: { id: transportRequestId },
      data: { status: 'ACCEPTED' },
    });

    // Update trade operation phase
    await this.prisma.tradeOperation.update({
      where: { id: winningBid.tradeOperationId },
      data: { phase: 'TRANSPORT_IN_PROGRESS' },
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
}
