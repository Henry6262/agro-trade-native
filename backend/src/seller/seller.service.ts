import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateListingDto,
  ListingStatus,
  OfferType,
} from "./dto/create-listing.dto";
import {
  SellerTimelineEventDto,
  SellerTimelineResponseDto,
} from "./dto/timeline.dto";

@Injectable()
export class SellerService {
  private readonly logger = new Logger(SellerService.name);

  constructor(private prisma: PrismaService) {}

  async createListing(createListingDto: CreateListingDto, userId: string) {
    try {
      // Verify the product exists
      const product = await this.prisma.product.findUnique({
        where: { id: createListingDto.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${createListingDto.productId} not found`,
        );
      }

      // First, create or get the address
      let addressId: string | null = null;
      if (createListingDto.location) {
        // Find or create region first
        let region = await this.prisma.region.findFirst({
          where: {
            name: createListingDto.location.region || "Default Region",
          },
        });

        if (!region) {
          region = await this.prisma.region.create({
            data: {
              name: createListingDto.location.region || "Default Region",
              country: createListingDto.location.country || "Unknown",
            },
          });
        }

        // Find or create city
        let city = await this.prisma.city.findFirst({
          where: {
            name: createListingDto.location.city || "Unknown",
            regionId: region.id,
          },
        });

        if (!city) {
          city = await this.prisma.city.create({
            data: {
              name: createListingDto.location.city || "Unknown",
              regionId: region.id,
            },
          });
        }

        // Create address
        const address = await this.prisma.address.create({
          data: {
            userId,
            addressType: "FARM",
            label: "Primary Location",
            street: createListingDto.location.address,
            cityId: city.id,
            country: createListingDto.location.country,
            latitude: createListingDto.location.latitude,
            longitude: createListingDto.location.longitude,
          },
        });
        addressId = address.id;
      }

      // Create the listing
      const listing = await this.prisma.saleListing.create({
        data: {
          sellerId: userId,
          productId: createListingDto.productId,
          quantity: createListingDto.quantity,
          unit: (createListingDto.unit?.toUpperCase() as any) || "TON",
          askingPrice: createListingDto.priceExpectation?.max || null,
          addressId,
          status: createListingDto.status === "active" ? "ACTIVE" : "PENDING",
        },
        include: {
          product: true,
          seller: true,
          address: {
            include: {
              city: true,
            },
          },
        },
      });

      // If it's a custom offer, store specifications and create notification
      if (
        createListingDto.offerType === OfferType.CUSTOM_OFFER &&
        createListingDto.specifications
      ) {
        // Get all specification types
        const specTypes = await this.prisma.specificationType.findMany();

        // Store specifications as ListingSpec entries
        const specPromises = Object.entries(
          createListingDto.specifications,
        ).map(async ([key, value]) => {
          // Try to find matching specification type by code or name
          let specType = specTypes.find(
            (st) => st.code === key || st.name === key,
          );

          // If not found, create a new specification type
          if (!specType) {
            specType = await this.prisma.specificationType.create({
              data: {
                code: key,
                name: key,
                dataType:
                  typeof value === "number"
                    ? "NUMBER"
                    : typeof value === "boolean"
                      ? "BOOLEAN"
                      : "TEXT",
              },
            });
          }

          const specData: any = {
            saleListingId: listing.id,
            specTypeId: specType.id,
          };

          // Store value based on data type
          if (specType.dataType === "NUMBER") {
            specData.valueNumber = parseFloat(String(value));
          } else if (specType.dataType === "BOOLEAN") {
            specData.valueBool = value === "true" || value === true;
          } else {
            specData.valueText = String(value);
          }

          return this.prisma.listingSpec.create({
            data: specData,
          });
        });

        await Promise.all(specPromises);

        // Create notification for admin review
        await this.createCustomOfferNotification(listing.id, userId);
      }

      return {
        success: true,
        message:
          createListingDto.offerType === OfferType.CUSTOM_OFFER
            ? "Custom offer submitted successfully. You will receive a quote within 24 hours."
            : "Listing created successfully and is now visible on the marketplace.",
        data: listing,
      };
    } catch (error) {
      this.logger.error("Error creating listing:" + error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        "Failed to create listing. Please try again.",
      );
    }
  }

  async getAllSellerListings(buyListingId?: string, tradeOperationId?: string, page = 1, limit = 50) {
    const tradeOperation = tradeOperationId
      ? await this.prisma.tradeOperation.findUnique({
          where: { id: tradeOperationId },
          include: {
            buyListing: true,
            sellers: {
              include: {
                negotiation: true,
              },
            },
          },
        })
      : buyListingId
        ? await this.prisma.tradeOperation.findUnique({
            where: { buyListingId },
            include: {
              buyListing: true,
              sellers: {
                include: {
                  negotiation: true,
                },
              },
            },
          })
        : null;

    const buyListing = buyListingId
      ? await this.prisma.buyListing.findUnique({
          where: { id: buyListingId },
        })
      : tradeOperation?.buyListing || null;

    const where: any = {};
    if (buyListing) {
      where.productId = buyListing.productId;
      where.status = "ACTIVE";
      where.quantity = {
        gt: 0,
      };

      if (buyListing.maxPricePerUnit) {
        where.askingPrice = {
          lte: buyListing.maxPricePerUnit,
        };
      }
    }

    const whereClause = Object.keys(where).length > 0 ? where : undefined;
    const [listings, total] = await Promise.all([
      this.prisma.saleListing.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            displayName: true,
            category: true,
            description: true,
            image: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            company: {
              select: {
                id: true,
                legalName: true,
                registrationNumber: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
        address: {
          select: {
            id: true,
            street: true,
            country: true,
            latitude: true,
            longitude: true,
            city: {
              select: {
                id: true,
                name: true,
                region: {
                  select: {
                    id: true,
                    name: true,
                    country: true,
                  },
                },
              },
            },
          },
        },
        specifications: {
          include: {
            specificationType: {
              select: {
                id: true,
                code: true,
                name: true,
                unit: true,
                dataType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
      this.prisma.saleListing.count({ where: whereClause }),
    ]);

    const tradeSellerMap = new Map<
      string,
      {
        status: string;
        negotiationStatus?: string;
      }
    >();

    if (tradeOperation?.sellers) {
      tradeOperation.sellers.forEach((seller) => {
        tradeSellerMap.set(seller.saleListingId, {
          status: seller.status,
          negotiationStatus: seller.negotiation?.status,
        });
      });
    }

    const data = listings.map((listing) => {
      const tradeContext = tradeSellerMap.get(listing.id);
      if (!tradeContext) {
        return listing;
      }

      return {
        ...listing,
        tradeSellerStatus: tradeContext.status,
        negotiationStatus: tradeContext.negotiationStatus,
      };
    });

    return { data, total };
  }

  async getSellerListings(userId: string) {
    const listings = await this.prisma.saleListing.findMany({
      where: { sellerId: userId },
      include: {
        product: true,
        address: {
          include: {
            city: true,
          },
        },
        specifications: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return listings;
  }

  // Format listings as products for frontend compatibility
  async getSellerProducts(userId: string) {
    const listings = await this.prisma.saleListing.findMany({
      where: { sellerId: userId },
      include: {
        product: true,
        address: {
          include: {
            city: {
              include: {
                region: true,
              },
            },
          },
        },
        specifications: {
          include: {
            specificationType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform listings to match frontend SellerProduct interface
    return listings.map((listing) => ({
      id: listing.id,
      name: listing.product.name,
      category: listing.product.category || "General",
      subcategory: "", // Product model doesn't have subcategory
      quantity: listing.quantity ? Number(listing.quantity) : 0,
      unit: listing.unit.toLowerCase(),
      pricePerUnit: listing.askingPrice ? Number(listing.askingPrice) : 0,
      currency: "USD",
      location: {
        address: listing.address?.street || "",
        city: listing.address?.city?.name || "",
        state: listing.address?.city?.region?.name || "",
        country: listing.address?.country || "",
        coordinates:
          listing.address?.latitude && listing.address?.longitude
            ? {
                latitude: Number(listing.address.latitude),
                longitude: Number(listing.address.longitude),
              }
            : undefined,
      },
      qualityTags: this.extractQualityTags(listing.specifications),
      certifications: [], // TODO: Add certifications support
      description: listing.product.description || "",
      images: [], // TODO: Add images support
      status: this.mapListingStatus(listing.status),
      isVerified: false, // SaleListing model doesn't have isVerified field
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      views: 0, // TODO: Add view tracking
      inquiries: 0, // TODO: Add inquiry tracking
    }));
  }

  private extractQualityTags(specifications: any[]): string[] {
    const tags: string[] = [];

    specifications?.forEach((spec) => {
      if (spec.specificationType) {
        const { name } = spec.specificationType;
        let value = "";

        if (spec.valueText) value = spec.valueText;
        else if (spec.valueNumber !== null) value = spec.valueNumber.toString();
        else if (spec.valueBool !== null) value = spec.valueBool ? "Yes" : "No";

        if (value) {
          // Format as tag (e.g., "Organic", "Protein 15%", etc.)
          if (name.toLowerCase().includes("organic") && spec.valueBool) {
            tags.push("Organic");
          } else if (name.toLowerCase().includes("gmo") && !spec.valueBool) {
            tags.push("Non-GMO");
          } else if (
            name.toLowerCase().includes("protein") &&
            spec.valueNumber
          ) {
            tags.push(`Protein ${spec.valueNumber}%`);
          } else if (name.toLowerCase().includes("grade")) {
            tags.push(`Grade ${value}`);
          } else if (value !== "No" && value !== "false") {
            tags.push(`${name}: ${value}`);
          }
        }
      }
    });

    return tags;
  }

  private mapListingStatus(status: string): "active" | "inactive" | "sold_out" {
    switch (status) {
      case "ACTIVE":
        return "active";
      case "EXPIRED":
        return "sold_out";
      case "PENDING":
      default:
        return "inactive";
    }
  }

  // Get offers for seller's products - fetch real negotiations
  async getSellerOffers(userId: string) {
    try {
      // Get all negotiations where this seller is involved
      const negotiations = await this.prisma.offerNegotiation.findMany({
        where: {
          tradeSeller: {
            sellerId: userId,
          },
        },
        include: {
          tradeSeller: {
            include: {
              seller: true,
              saleListing: {
                include: {
                  product: true,
                  address: true,
                },
              },
            },
          },
          tradeOperation: {
            include: {
              admin: true,
              buyListing: {
                include: {
                  product: true,
                  buyer: true,
                },
              },
            },
          },
        },
      });

      // Transform negotiations to match the frontend interface
      const offers = negotiations.map((negotiation: any) => {
        const tradeOperation = negotiation.tradeOperation;
        const buyer = tradeOperation.buyListing?.buyer;
        const buyListing = tradeOperation.buyListing;
        const product =
          buyListing?.product || negotiation.tradeSeller.saleListing?.product;

        // Calculate hours until expiry
        const expiryDate = new Date(negotiation.expiresAt);
        const now = new Date();
        const hoursUntilExpiry = Math.max(
          0,
          Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)),
        );
        const isExpiringSoon = hoursUntilExpiry <= 24;

        // Calculate estimated profit based on offer vs listing price
        const currentPrice = negotiation.currentOffer?.price || 0;
        const listingPrice =
          negotiation.tradeSeller.saleListing?.askingPrice || 0;
        const quantity = negotiation.currentOffer?.quantity || 0;
        const estimatedProfit = (currentPrice - listingPrice) * quantity;

        // Get buyer location info
        const buyerLocation = buyListing?.address?.city
          ? `${buyListing.address.city.name}, ${buyListing.address.city.region?.name || "Unknown"}`
          : "Location not specified";

        // Get quality requirements from buy listing or trade operation
        const qualityRequirements = this.extractQualityRequirements(buyListing);

        // Format for frontend
        return {
          id: negotiation.id,
          product: product?.name || "Unknown Product",
          quantity: negotiation.currentOffer?.quantity || 0,
          offeredPricePerTon: negotiation.currentOffer?.price || 0,
          totalValue:
            (negotiation.currentOffer?.price || 0) *
            (negotiation.currentOffer?.quantity || 0),
          buyer: buyer?.name || "Unknown Buyer",
          buyerLocation,
          buyerFlag: this.getCountryFlag(buyListing?.address?.country),
          adminNote:
            negotiation.currentOffer?.terms || "No additional notes provided.",
          deadline: negotiation.expiresAt,
          responseTime: `${hoursUntilExpiry} hours`,
          estimatedProfit: Math.max(0, estimatedProfit),
          qualityRequirements,
          status: negotiation.status.toLowerCase(),
          negotiationId: negotiation.id,
          tradeOperationId: negotiation.tradeOperationId,
          isExpiringSoon,
          hoursUntilExpiry,
          counterOffer: negotiation.counterOffer,
          offerHistory: negotiation.offerHistory || [],
          createdAt: negotiation.createdAt,
          updatedAt: negotiation.updatedAt,
        };
      });

      // Calculate summary statistics
      const stats = {
        totalOffers: offers.length,
        pendingOffers: offers.filter((o: any) => o.status === "pending").length,
        acceptedThisMonth: offers.filter((o: any) => {
          const offerDate = new Date(o.createdAt);
          const now = new Date();
          const firstDayOfMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
          );
          return o.status === "accepted" && offerDate >= firstDayOfMonth;
        }).length,
        averageOfferValue:
          offers.length > 0
            ? offers.reduce((sum: number, o: any) => sum + o.totalValue, 0) /
              offers.length
            : 0,
        topRequestedProduct: this.getTopRequestedProduct(offers),
        conversionRate: this.calculateConversionRate(offers),
      };

      return {
        success: true,
        data: {
          offers,
          stats,
        },
      };
    } catch (error) {
      this.logger.error("Error fetching seller offers:" + error);
      throw new BadRequestException(
        "Failed to fetch offers. Please try again.",
      );
    }
  }

  private extractQualityRequirements(buyListing: any): string[] {
    const requirements = [];

    if (buyListing?.specifications) {
      buyListing.specifications.forEach((spec: any) => {
        if (spec.specificationType) {
          const { name } = spec.specificationType;
          let value = "";

          if (spec.valueText) value = spec.valueText;
          else if (spec.valueNumber !== null)
            value = spec.valueNumber.toString();
          else if (spec.valueBool !== null)
            value = spec.valueBool ? "Yes" : "No";

          if (value && value !== "No") {
            if (name.toLowerCase().includes("organic") && spec.valueBool) {
              requirements.push("Organic");
            } else if (name.toLowerCase().includes("gmo") && !spec.valueBool) {
              requirements.push("Non-GMO");
            } else if (
              name.toLowerCase().includes("protein") &&
              spec.valueNumber
            ) {
              requirements.push(`Protein ${spec.valueNumber}%+`);
            } else if (name.toLowerCase().includes("grade")) {
              requirements.push(`Grade ${value}`);
            } else {
              requirements.push(`${name}: ${value}`);
            }
          }
        }
      });
    }

    // Default requirements if none specified
    if (requirements.length === 0) {
      requirements.push("Standard Quality");
    }

    return requirements;
  }

  private getCountryFlag(country: string | null | undefined): string {
    const flagMap: { [key: string]: string } = {
      "United States": "🇺🇸",
      USA: "🇺🇸",
      US: "🇺🇸",
      Canada: "🇨🇦",
      Germany: "🇩🇪",
      France: "🇫🇷",
      "United Kingdom": "🇬🇧",
      UK: "🇬🇧",
      Singapore: "🇸🇬",
      Japan: "🇯🇵",
      China: "🇨🇳",
      Brazil: "🇧🇷",
      Argentina: "🇦🇷",
      Australia: "🇦🇺",
      Netherlands: "🇳🇱",
    };

    return flagMap[country || ""] || "🌍";
  }

  private getTopRequestedProduct(offers: any[]): string {
    const productCounts: { [key: string]: number } = {};

    offers.forEach((offer) => {
      productCounts[offer.product] = (productCounts[offer.product] || 0) + 1;
    });

    const topProduct = Object.entries(productCounts).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return topProduct ? topProduct[0] : "N/A";
  }

  private calculateConversionRate(offers: any[]): number {
    if (offers.length === 0) return 0;

    const acceptedOffers = offers.filter((o) => o.status === "accepted").length;
    return (acceptedOffers / offers.length) * 100;
  }

  // Get active trades for seller
  async getSellerTrades(userId: string) {
    const tradeSellers = await this.prisma.tradeSeller.findMany({
      where: { sellerId: userId },
      include: {
        tradeOperation: {
          include: {
            buyListing: {
              include: {
                product: true,
                buyer: {
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
        saleListing: {
          include: {
            product: true,
          },
        },
        negotiation: true,
      },
      orderBy: { joinedAt: "desc" },
    });

    return tradeSellers.map((ts) => ({
      id: ts.id,
      tradeOperationId: ts.tradeOperationId,
      status: ts.status,
      requestedQuantity: ts.requestedQuantity
        ? Number(ts.requestedQuantity)
        : null,
      agreedQuantity: ts.agreedQuantity ? Number(ts.agreedQuantity) : null,
      agreedPrice: ts.agreedPrice ? Number(ts.agreedPrice) : null,
      unit: ts.unit,
      isVerified: ts.isVerified,
      matchScore: ts.matchScore,
      product:
        ts.tradeOperation?.buyListing?.product || ts.saleListing?.product,
      buyer: ts.tradeOperation?.buyListing?.buyer || null,
      tradePhase: ts.tradeOperation?.phase,
      tradeStatus: ts.tradeOperation?.status,
      negotiationStatus: ts.negotiation?.status || null,
      joinedAt: ts.joinedAt,
    }));
  }

  // Get seller statistics
  async getSellerStats(userId: string) {
    const listings = await this.prisma.saleListing.findMany({
      where: { sellerId: userId },
    });

    const activeListings = listings.filter((l) => l.status === "ACTIVE").length;
    const totalProducts = listings.length;

    // Count actual offers from negotiations
    const negotiations = await this.prisma.offerNegotiation.findMany({
      where: {
        tradeSeller: {
          sellerId: userId,
        },
      },
    });

    const totalOffers = negotiations.length;
    const pendingOffers = negotiations.filter(
      (n) => n.status === "PENDING",
    ).length;

    // Count trades (TradeSeller represents seller participation in trades)
    const trades = await this.prisma.tradeSeller.findMany({
      where: { sellerId: userId },
      include: {
        tradeOperation: true,
      },
    });

    const totalTrades = trades.length;
    const completedTrades = trades.filter(
      (t) => t.tradeOperation.status === "COMPLETED",
    ).length;

    // Calculate revenue from completed trades
    const completedTradeOperations = trades.filter(
      (t) => t.tradeOperation.status === "COMPLETED",
    );

    const totalRevenue = completedTradeOperations.reduce((sum, trade) => {
      const quantity = trade.agreedQuantity?.toNumber() || 0;
      const price = trade.agreedPrice?.toNumber() || 0;
      return sum + quantity * price;
    }, 0);

    // Calculate monthly revenue (current month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyTradeOperations = trades.filter(
      (t) =>
        t.tradeOperation.status === "COMPLETED" &&
        t.tradeOperation.completedAt &&
        t.tradeOperation.completedAt >= firstDayOfMonth,
    );

    const monthlyRevenue = monthlyTradeOperations.reduce((sum, trade) => {
      const quantity = trade.agreedQuantity?.toNumber() || 0;
      const price = trade.agreedPrice?.toNumber() || 0;
      return sum + quantity * price;
    }, 0);

    // Calculate average rating from completed trades with feedback
    // Note: The database doesn't have a rating field on TradeSeller or TradeOperation yet
    // So we'll return 0 for now. When rating system is added, update this calculation.
    const averageRating = 0; // Placeholder until rating system is implemented in schema

    return {
      totalProducts,
      activeListings,
      totalOffers,
      pendingOffers,
      totalTrades,
      completedTrades,
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimals
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100, // Round to 2 decimals
      averageRating,
    };
  }

  async getListingById(listingId: string, userId: string) {
    const listing = await this.prisma.saleListing.findFirst({
      where: {
        id: listingId,
        sellerId: userId,
      },
      include: {
        product: true,
        address: {
          include: {
            city: true,
          },
        },
        specifications: true,
      },
    });

    if (!listing) {
      throw new NotFoundException("Listing not found");
    }

    return listing;
  }

  async updateListingStatus(
    listingId: string,
    status: ListingStatus,
    userId: string,
  ) {
    const listing = await this.prisma.saleListing.findFirst({
      where: {
        id: listingId,
        sellerId: userId,
      },
    });

    if (!listing) {
      throw new NotFoundException("Listing not found");
    }

    const updatedListing = await this.prisma.saleListing.update({
      where: { id: listingId },
      data: {
        status:
          status === "active"
            ? "ACTIVE"
            : status === "draft"
              ? "PENDING"
              : "EXPIRED",
      },
      include: {
        product: true,
        address: {
          include: {
            city: true,
          },
        },
      },
    });

    return updatedListing;
  }

  async getTimeline(
    userId: string,
    limit = 20,
    cursor?: string,
  ): Promise<SellerTimelineResponseDto> {
    const take = limit;
    const events: any[] = [];

    // 1. Get Trade Operations
    const trades = await this.prisma.tradeOperation.findMany({
      where: {
        sellers: { some: { sellerId: userId } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: {
        buyListing: { include: { product: true, buyer: true } },
      },
    });

    for (const trade of trades) {
      events.push({
        id: `trade-${trade.id}`,
        type: "TRADE",
        title: `Trade ${trade.operationNumber}`,
        status: trade.phase,
        timestamp: trade.updatedAt,
        description: `Trade for ${trade.buyListing.product.displayName} is in ${trade.phase.replace(/_/g, " ")} phase.`,
        metadata: { buyerName: trade.buyListing.buyer.name },
      });
    }

    // 2. Get Negotiations
    const negotiations = await this.prisma.offerNegotiation.findMany({
      where: { tradeSeller: { sellerId: userId } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { tradeSeller: { include: { saleListing: { include: { product: true } } } } },
    });

    for (const neg of negotiations) {
      events.push({
        id: `neg-${neg.id}`,
        type: "NEGOTIATION",
        title: `Offer: ${neg.tradeSeller.saleListing.product.displayName}`,
        status: neg.status,
        timestamp: neg.updatedAt,
        description: `Offer status updated to ${neg.status}.`,
        metadata: { negotiationId: neg.id },
      });
    }

    // 3. Get Transport Jobs
    const transportJobs = await this.prisma.transportJob.findMany({
      where: { tradeOperation: { sellers: { some: { sellerId: userId } } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { transporter: true },
    });

    for (const job of transportJobs) {
      events.push({
        id: `trans-${job.id}`,
        type: "TRANSPORT",
        title: `Transport: ${job.jobNumber}`,
        status: job.status,
        timestamp: job.updatedAt,
        description: `Transporter ${job.transporter.name} status: ${job.status}.`,
        metadata: { transporterName: job.transporter.name },
      });
    }

    // Sort by timestamp desc and limit
    const sortedEvents = events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, take);

    return {
      events: sortedEvents.map(e => ({
        ...e,
        timestamp: e.timestamp, // Will be serialized to string by class-transformer
      })),
      nextCursor: null,
    };
  }

  private async createCustomOfferNotification(
    listingId: string,
    sellerId: string,
  ) {
    try {
      // For now, just log the notification
      // In production, this would integrate with a notification service
      this.logger.log("Custom offer notification:" + JSON.stringify({
        type: "CUSTOM_OFFER_REVIEW",
        title: "New Custom Offer Request",
        message: `A seller has submitted a custom offer request for review.`,
        metadata: {
          listingId,
          sellerId,
        },
        recipientRole: "ADMIN",
      }));
    } catch (error) {
      this.logger.error("Failed to create notification:" + error);
      // Don't throw error as this is not critical for listing creation
    }
  }
}
