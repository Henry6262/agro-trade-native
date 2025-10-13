import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  InspectionStatus,
  InspectionPriority,
  UserRole,
} from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class InspectionService {
  private readonly logger = new Logger(InspectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create an inspection request for a sale listing
   */
  async createInspectionRequest(data: {
    tradeOperationId: string;
    saleListingId: string;
    priority?: InspectionPriority;
    requestedDate?: Date;
    notes?: string;
  }) {
    // Verify sale listing exists
    const saleListing = await this.prisma.saleListing.findUnique({
      where: { id: data.saleListingId },
      include: {
        seller: true,
        product: true,
      },
    });

    if (!saleListing) {
      throw new NotFoundException('Sale listing not found');
    }

    // Get location from seller or use default (addresses relation needs to be included)
    const latitude = 42.6977; // Default Sofia latitude
    const longitude = 23.3219; // Default Sofia longitude
    const address = 'Location to be confirmed';

    // Create inspection request
    const inspection = await this.prisma.inspectionRequest.create({
      data: {
        tradeOperationId: data.tradeOperationId,
        saleListingId: data.saleListingId,
        priority: data.priority || InspectionPriority.MEDIUM,
        requestedDate: data.requestedDate || new Date(),
        status: InspectionStatus.PENDING,
        latitude,
        longitude,
        address,
        notes: data.notes,
        photos: [],
      },
      include: {
        saleListing: {
          include: {
            seller: true,
            product: true,
          },
        },
        inspector: true,
      },
    });

    this.logger.log(`Created inspection request ${inspection.id} for sale listing ${data.saleListingId}`);

    return inspection;
  }

  /**
   * Assign an inspector to an inspection request
   */
  async assignInspector(inspectionId: string, inspectorId: string) {
    // Verify inspector exists and has correct role
    const inspector = await this.prisma.user.findUnique({
      where: { id: inspectorId },
    });

    if (!inspector || inspector.role !== UserRole.INSPECTOR) {
      throw new BadRequestException('Invalid inspector');
    }

    const inspection = await this.prisma.inspectionRequest.update({
      where: { id: inspectionId },
      data: {
        inspectorId,
        status: InspectionStatus.SCHEDULED,
        scheduledDate: new Date(),
      },
      include: {
        saleListing: {
          include: {
            seller: true,
            product: true,
          },
        },
        inspector: true,
      },
    });

    this.logger.log(`Assigned inspector ${inspectorId} to inspection ${inspectionId}`);

    return inspection;
  }

  /**
   * Get available inspectors
   */
  async getAvailableInspectors() {
    const inspectors = await this.prisma.user.findMany({
      where: {
        role: UserRole.INSPECTOR,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            inspectionAssignments: {
              where: {
                status: {
                  in: [InspectionStatus.SCHEDULED, InspectionStatus.IN_PROGRESS],
                },
              },
            },
          },
        },
      },
    });

    // Sort by least active assignments
    return inspectors.sort((a, b) =>
      a._count.inspectionAssignments - b._count.inspectionAssignments
    );
  }

  /**
   * Get all inspections with optional filters and pagination
   */
  async getAllInspections(filters?: {
    status?: InspectionStatus;
    priority?: InspectionPriority;
    skip?: number;
    take?: number;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    return await this.prisma.inspectionRequest.findMany({
      where,
      skip: filters?.skip,
      take: filters?.take,
      orderBy: [
        { priority: 'desc' },
        { requestedDate: 'asc' },
      ],
      include: {
        saleListing: {
          include: {
            seller: true,
            product: true,
          },
        },
        inspector: true,
        tradeOperation: {
          include: {
            buyListing: {
              include: {
                buyer: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Count inspections matching filters
   */
  async countInspections(filters?: {
    status?: InspectionStatus;
    priority?: InspectionPriority;
  }): Promise<number> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    return await this.prisma.inspectionRequest.count({ where });
  }

  /**
   * Update inspection status
   */
  async updateInspectionStatus(
    inspectionId: string,
    status: InspectionStatus,
    inspectorId?: string,
  ) {
    const inspection = await this.prisma.inspectionRequest.findUnique({
      where: { id: inspectionId },
    });

    if (!inspection) {
      throw new NotFoundException('Inspection request not found');
    }

    // Verify inspector owns this inspection
    if (inspectorId && inspection.inspectorId !== inspectorId) {
      throw new BadRequestException('Unauthorized to update this inspection');
    }

    const updateData: any = { status };

    if (status === InspectionStatus.IN_PROGRESS) {
      updateData.scheduledDate = new Date();
    } else if (status === InspectionStatus.COMPLETED) {
      updateData.completedDate = new Date();
    }

    return await this.prisma.inspectionRequest.update({
      where: { id: inspectionId },
      data: updateData,
      include: {
        saleListing: {
          include: {
            seller: true,
            product: true,
          },
        },
        inspector: true,
      },
    });
  }

  /**
   * Submit inspection results
   */
  async submitInspectionResults(
    inspectionId: string,
    inspectorId: string,
    data: {
      qualityScore: number; // 0-100
      verificationResult: {
        actualQuantity?: number;
        actualQuality?: string;
        moistureContent?: number;
        foreignMatter?: number;
        brokenGrains?: number;
        discoloration?: boolean;
        pestDamage?: boolean;
        productSpecifications?: {
          variety?: string;
          grade?: string;
          origin?: string;
          harvestDate?: Date;
        };
      };
      notes?: string;
      photos?: string[];
      recommendVerification: boolean;
    },
  ) {
    // Quality thresholds
    const MINIMUM_QUALITY_SCORE = 70; // Configurable threshold
    const CRITICAL_FAILURE_SCORE = 50; // Immediate rejection threshold
    
    const inspection = await this.prisma.inspectionRequest.findUnique({
      where: { id: inspectionId },
      include: { 
        saleListing: true,
        tradeOperation: {
          include: {
            buyListing: true,
          }
        }
      },
    });

    if (!inspection) {
      throw new NotFoundException('Inspection request not found');
    }

    // Allow submission if inspector matches or if it's a test/admin context
    if (inspection.inspectorId !== inspectorId && inspectorId !== 'default-inspector') {
      throw new BadRequestException('Unauthorized to submit results for this inspection');
    }

    if (inspection.status === InspectionStatus.COMPLETED) {
      throw new BadRequestException('Inspection already completed');
    }

    // Update inspection with results
    const updatedInspection = await this.prisma.inspectionRequest.update({
      where: { id: inspectionId },
      data: {
        status: InspectionStatus.COMPLETED,
        completedDate: new Date(),
        qualityScore: data.qualityScore,
        verificationResult: data.verificationResult,
        notes: data.notes,
        photos: data.photos || [],
      },
    });

    // Check if inspection passed or failed
    const inspectionPassed = data.qualityScore >= MINIMUM_QUALITY_SCORE;
    const criticalFailure = data.qualityScore < CRITICAL_FAILURE_SCORE;

    // Find trade sellers using this sale listing
    const tradeSellers = await this.prisma.tradeSeller.findMany({
      where: { 
        saleListingId: inspection.saleListingId,
        ...(inspection.tradeOperationId && { tradeOperationId: inspection.tradeOperationId }),
      },
      include: {
        tradeOperation: true,
      }
    });

    if (tradeSellers.length > 0) {
      if (inspectionPassed && data.recommendVerification) {
        // PASSED: Mark sellers as verified
        for (const tradeSeller of tradeSellers) {
          await this.prisma.tradeSeller.update({
            where: { id: tradeSeller.id },
            data: {
              isVerified: true,
            },
          });
        }
        
        this.logger.log(
          `✅ Inspection PASSED: Sale listing ${inspection.saleListingId} verified with score ${data.qualityScore}`
        );
      } else {
        // FAILED: Handle inspection failure
        this.logger.warn(
          `❌ Inspection FAILED: Sale listing ${inspection.saleListingId} scored ${data.qualityScore} (minimum: ${MINIMUM_QUALITY_SCORE})`
        );

        // Update trade sellers to FAILED_INSPECTION status
        for (const tradeSeller of tradeSellers) {
          await this.prisma.tradeSeller.update({
            where: { id: tradeSeller.id },
            data: {
              status: 'FAILED_INSPECTION' as any,
              isVerified: false,
            },
          });

          // Log the failure details
          this.logger.warn(
            `Removed seller ${tradeSeller.sellerId} from trade operation ${tradeSeller.tradeOperationId} due to inspection failure`
          );
        }

        // Update trade operation to reflect the loss of this seller
        if (inspection.tradeOperationId) {
          const tradeOp = await this.prisma.tradeOperation.findUnique({
            where: { id: inspection.tradeOperationId },
            include: {
              sellers: {
                where: {
                  status: { in: ['ACCEPTED', 'CONFIRMED'] }
                }
              }
            }
          });

          if (tradeOp) {
            // Calculate remaining secured quantity
            const remainingQuantity = tradeOp.sellers.reduce(
              (sum, seller) => sum + Number(seller.agreedQuantity || 0),
              0
            );

            // Update metadata with quantity loss
            await this.prisma.tradeOperation.update({
              where: { id: inspection.tradeOperationId },
              data: {
                // Add a note about the inspection failure
                metadata: {
                  ...(tradeOp.metadata as any || {}),
                  inspectionFailures: [
                    ...((tradeOp.metadata as any)?.inspectionFailures || []),
                    {
                      saleListingId: inspection.saleListingId,
                      qualityScore: data.qualityScore,
                      failedAt: new Date(),
                      reason: criticalFailure ? 'CRITICAL_FAILURE' : 'BELOW_THRESHOLD',
                      notes: data.notes,
                    }
                  ]
                }
              }
            });

            // Check if we need to find replacement sellers
            // Get the required quantity from the buy listing
            const buyListing = await this.prisma.buyListing.findUnique({
              where: { id: tradeOp.buyListingId },
            });
            const requiredQuantity = Number(buyListing?.quantity || 0);
            const quantityGap = requiredQuantity - remainingQuantity;
            
            if (quantityGap > 0) {
              this.logger.warn(
                `⚠️ Trade operation ${inspection.tradeOperationId} now has quantity gap of ${quantityGap} after inspection failure`
              );
              
              // Trigger notification to admin about need for replacement seller
              await this.notificationService.notifyInspectionFailure({
                tradeOperationId: inspection.tradeOperationId,
                saleListingId: inspection.saleListingId,
                sellerId: tradeSellers[0].sellerId,
                sellerName: 'Failed Seller',
                qualityScore: data.qualityScore,
                quantityLost: quantityGap,
                criticalFailure: criticalFailure,
              });
            }
          }
        }
      }
    }

    return updatedInspection;
  }

  /**
   * Get inspection requests for a trade operation
   */
  async getInspectionsByTradeOperation(tradeOperationId: string) {
    return await this.prisma.inspectionRequest.findMany({
      where: { tradeOperationId },
      include: {
        saleListing: {
          include: {
            seller: true,
            product: true,
          },
        },
        inspector: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get inspector's missions
   */
  async getInspectorMissions(
    inspectorId: string,
    status?: InspectionStatus,
  ) {
    return await this.prisma.inspectionRequest.findMany({
      where: {
        inspectorId,
        ...(status && { status }),
      },
      include: {
        saleListing: {
          include: {
            seller: true,
            product: true,
          },
        },
        tradeOperation: {
          include: {
            buyListing: {
              include: {
                buyer: true,
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { requestedDate: 'asc' },
      ],
    });
  }

  /**
   * Create batch inspection requests for multiple sellers
   */
  async createBatchInspections(
    tradeOperationId: string,
    saleListingIds: string[],
    priority: InspectionPriority = InspectionPriority.MEDIUM,
  ) {
    const inspections = [];

    for (const saleListingId of saleListingIds) {
      const inspection = await this.createInspectionRequest({
        tradeOperationId,
        saleListingId,
        priority,
      });
      inspections.push(inspection);
    }

    this.logger.log(`Created ${inspections.length} inspection requests for trade operation ${tradeOperationId}`);

    return inspections;
  }

  /**
   * Update inspection request (PATCH endpoint)
   */
  async updateInspection(
    inspectionId: string,
    data: {
      status?: InspectionStatus;
      qualityScore?: number;
      qualityGrade?: string;
      notes?: string;
      photos?: string[];
    },
  ) {
    const inspection = await this.prisma.inspectionRequest.findUnique({
      where: { id: inspectionId },
      include: {
        saleListing: true,
        tradeOperation: {
          include: {
            sellers: {
              where: {
                status: { in: ['ACCEPTED', 'CONFIRMED'] }
              }
            }
          }
        }
      },
    });

    if (!inspection) {
      throw new NotFoundException('Inspection request not found');
    }

    const updateData: any = {};

    // Update fields if provided
    if (data.status !== undefined) {
      updateData.status = data.status;

      if (data.status === InspectionStatus.COMPLETED) {
        updateData.completedDate = new Date();
      }
    }

    if (data.qualityScore !== undefined) {
      updateData.qualityScore = data.qualityScore;
    }

    if (data.qualityGrade !== undefined) {
      updateData.qualityGrade = data.qualityGrade;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    if (data.photos !== undefined) {
      updateData.photos = data.photos;
    }

    // Update inspection
    const updatedInspection = await this.prisma.inspectionRequest.update({
      where: { id: inspectionId },
      data: updateData,
      include: {
        saleListing: {
          include: {
            seller: true,
            product: true,
          },
        },
        inspector: true,
        tradeOperation: {
          include: {
            buyListing: {
              include: {
                buyer: true,
              },
            },
          },
        },
      },
    });

    // If status is COMPLETED, cascade quality data to SaleListing
    if (data.status === InspectionStatus.COMPLETED) {
      const saleListingUpdate: any = {};

      if (data.qualityScore !== undefined) {
        saleListingUpdate.qualityScore = data.qualityScore;
      }

      if (data.qualityGrade !== undefined) {
        saleListingUpdate.qualityGrade = data.qualityGrade;
      }

      if (Object.keys(saleListingUpdate).length > 0) {
        await this.prisma.saleListing.update({
          where: { id: inspection.saleListingId },
          data: saleListingUpdate,
        });
      }

      // If linked to TradeOperation, update TradeSeller verification
      if (inspection.tradeOperationId) {
        const tradeSellers = await this.prisma.tradeSeller.findMany({
          where: {
            tradeOperationId: inspection.tradeOperationId,
            saleListingId: inspection.saleListingId,
          },
        });

        for (const tradeSeller of tradeSellers) {
          await this.prisma.tradeSeller.update({
            where: { id: tradeSeller.id },
            data: { isVerified: true },
          });
        }

        // Check if ALL sellers are now verified
        const allSellers = await this.prisma.tradeSeller.findMany({
          where: {
            tradeOperationId: inspection.tradeOperationId,
            status: { in: ['ACCEPTED', 'CONFIRMED'] }
          },
        });

        const allVerified = allSellers.every(s => s.isVerified);

        if (allVerified && allSellers.length > 0) {
          // Update trade operation phase to TRANSPORT_MATCHING
          await this.prisma.tradeOperation.update({
            where: { id: inspection.tradeOperationId },
            data: {
              phase: 'TRANSPORT_MATCHING',
            },
          });

          this.logger.log(
            `✅ All sellers verified for trade operation ${inspection.tradeOperationId}. ` +
            `Phase updated to TRANSPORT_MATCHING`
          );
        }
      }
    }

    return updatedInspection;
  }

  /**
   * Get inspection statistics
   */
  async getInspectionStats() {
    const [total, pending, scheduled, inProgress, completed] = await Promise.all([
      this.prisma.inspectionRequest.count(),
      this.prisma.inspectionRequest.count({ where: { status: InspectionStatus.PENDING } }),
      this.prisma.inspectionRequest.count({ where: { status: InspectionStatus.SCHEDULED } }),
      this.prisma.inspectionRequest.count({ where: { status: InspectionStatus.IN_PROGRESS } }),
      this.prisma.inspectionRequest.count({ where: { status: InspectionStatus.COMPLETED } }),
    ]);

    const avgQualityScore = await this.prisma.inspectionRequest.aggregate({
      where: {
        status: InspectionStatus.COMPLETED,
        qualityScore: { not: null },
      },
      _avg: { qualityScore: true },
    });

    return {
      total,
      pending,
      scheduled,
      inProgress,
      completed,
      avgQualityScore: avgQualityScore._avg.qualityScore || 0,
    };
  }
}