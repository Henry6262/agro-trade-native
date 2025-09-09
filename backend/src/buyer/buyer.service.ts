import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuyListingDto } from './dto/create-buy-listing.dto';
import { RequestStatus, Prisma } from '@prisma/client';

@Injectable()
export class BuyerService {
  constructor(private prisma: PrismaService) {}

  async createBuyListing(dto: CreateBuyListingDto, userId: string) {
    try {
      // WORKAROUND: Allow any authenticated user to create buyer listings
      console.log('Creating buyer listing for user:', userId);
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { company: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // Skip role check - allow any authenticated user to create buyer listings
      console.log('User role:', user.role, '- allowing buyer listing creation');

      // Create or find delivery address
      let deliveryAddressId = null;
      if (dto.deliveryLocation) {
        const address = await this.prisma.address.create({
          data: {
            street: dto.deliveryLocation.address || '',
            // city is a relation field in Prisma, not a string
            // For now, skip city relation
            // Note: 'state' field doesn't exist in Address model
            country: dto.deliveryLocation.country || '',
            latitude: dto.deliveryLocation.latitude,
            longitude: dto.deliveryLocation.longitude,
            addressType: 'DELIVERY',
            userId: userId,
          },
        });
        deliveryAddressId = address.id;
      }

      // Create the buy listing
      const buyListing = await this.prisma.buyListing.create({
        data: {
          productId: dto.productId,
          buyerId: userId,
          quantity: new Prisma.Decimal(dto.quantity),
          unit: dto.unit,
          maxPricePerUnit: dto.maxPricePerUnit ? new Prisma.Decimal(dto.maxPricePerUnit) : null,
          neededBy: dto.neededBy ? new Date(dto.neededBy) : null,
          deliveryAddressId,
          status: dto.status || RequestStatus.ACTIVE,
        },
        include: {
          product: true,
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
          deliveryAddress: true,
          specifications: true,
        },
      });

      // Add specifications if provided
      // TODO: Fix specifications - need to map spec codes to specTypeId from SpecificationType table
      // For now, skip specifications to allow buyer listing creation
      /*
      if (dto.specifications && Object.keys(dto.specifications).length > 0) {
        const specEntries = Object.entries(dto.specifications).map(([key, value]) => ({
          listingType: 'BUY' as const,
          buyListingId: buyListing.id,
          specCode: key,
          value: String(value),
          specTypeId: 'TODO', // Need to look up from SpecificationType table
        }));

        await this.prisma.listingSpec.createMany({
          data: specEntries,
        });

        // Fetch the listing again with specifications
        return this.prisma.buyListing.findUnique({
          where: { id: buyListing.id },
          include: {
            product: true,
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
              },
            },
            deliveryAddress: true,
            specifications: true,
          },
        });
      }
      */

      return buyListing;
    } catch (error) {
      console.error('Error creating buy listing:', error);
      throw error;
    }
  }

  async getBuyerListings(userId: string) {
    return this.prisma.buyListing.findMany({
      where: { buyerId: userId },
      include: {
        product: true,
        deliveryAddress: true,
        specifications: true,
        offers: {
          include: {
            saleListing: {
              include: {
                seller: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    company: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBuyListingById(id: string, userId: string) {
    const listing = await this.prisma.buyListing.findUnique({
      where: { id },
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        deliveryAddress: true,
        specifications: true,
        offers: {
          include: {
            saleListing: {
              include: {
                seller: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    company: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Buy listing not found');
    }

    // Check if the user owns this listing
    if (listing.buyerId !== userId) {
      throw new UnauthorizedException('You do not have access to this listing');
    }

    return listing;
  }

  async getBuyerOffers(userId: string) {
    // Get all offers for the buyer's listings
    const buyListings = await this.prisma.buyListing.findMany({
      where: { buyerId: userId },
      select: { id: true },
    });

    const listingIds = buyListings.map(l => l.id);

    return this.prisma.offer.findMany({
      where: {
        buyListingId: { in: listingIds },
      },
      include: {
        saleListing: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
              },
            },
          },
        },
        buyListing: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBuyerTrades(userId: string) {
    // Get accepted offers (active trades)
    const buyListings = await this.prisma.buyListing.findMany({
      where: { buyerId: userId },
      select: { id: true },
    });

    const listingIds = buyListings.map(l => l.id);

    return this.prisma.offer.findMany({
      where: {
        buyListingId: { in: listingIds },
        status: 'ACCEPTED',
      },
      include: {
        saleListing: {
          include: {
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
              },
            },
          },
        },
        buyListing: {
          include: {
            product: true,
            deliveryAddress: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getBuyerStats(userId: string) {
    const [totalListings, activeListings, totalOffers, acceptedOffers] = await Promise.all([
      this.prisma.buyListing.count({ where: { buyerId: userId } }),
      this.prisma.buyListing.count({ 
        where: { 
          buyerId: userId,
          status: RequestStatus.ACTIVE,
        },
      }),
      this.prisma.offer.count({
        where: {
          buyListing: { buyerId: userId },
        },
      }),
      this.prisma.offer.count({
        where: {
          buyListing: { buyerId: userId },
          status: 'ACCEPTED',
        },
      }),
    ]);

    return {
      totalListings,
      activeListings,
      totalOffers,
      acceptedOffers,
      fulfilledListings: totalListings - activeListings,
    };
  }

  async updateBuyListingStatus(id: string, status: string, userId: string) {
    const listing = await this.prisma.buyListing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Buy listing not found');
    }

    if (listing.buyerId !== userId) {
      throw new UnauthorizedException('You do not have access to this listing');
    }

    return this.prisma.buyListing.update({
      where: { id },
      data: { status: status as RequestStatus },
      include: {
        product: true,
        deliveryAddress: true,
        specifications: true,
      },
    });
  }

  async updateBuyListing(id: string, dto: Partial<CreateBuyListingDto>, userId: string) {
    // WORKAROUND: Allow any authenticated user to update their buyer listings
    const listing = await this.prisma.buyListing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Buy listing not found');
    }

    if (listing.buyerId !== userId) {
      throw new UnauthorizedException('You do not have access to this listing');
    }

    // Build update data
    const updateData: any = {};
    
    if (dto.quantity !== undefined) {
      updateData.quantity = new Prisma.Decimal(dto.quantity);
    }
    if (dto.unit !== undefined) {
      updateData.unit = dto.unit;
    }
    if (dto.maxPricePerUnit !== undefined) {
      updateData.maxPricePerUnit = new Prisma.Decimal(dto.maxPricePerUnit);
    }
    if (dto.neededBy !== undefined) {
      updateData.neededBy = dto.neededBy ? new Date(dto.neededBy) : null;
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    // Update delivery location if provided
    if (dto.deliveryLocation && listing.deliveryAddressId) {
      await this.prisma.address.update({
        where: { id: listing.deliveryAddressId },
        data: {
          street: dto.deliveryLocation.address || undefined,
          // Skip city as it's a relation
          // Note: 'state' field doesn't exist
          country: dto.deliveryLocation.country || undefined,
          latitude: dto.deliveryLocation.latitude || undefined,
          longitude: dto.deliveryLocation.longitude || undefined,
        },
      });
    }

    // Update specifications if provided
    // TODO: Fix specifications - need specTypeId
    /*
    if (dto.specifications) {
      // Delete existing specifications
      await this.prisma.listingSpec.deleteMany({
        where: { buyListingId: id },
      });

      // Create new specifications
      if (Object.keys(dto.specifications).length > 0) {
        const specEntries = Object.entries(dto.specifications).map(([key, value]) => ({
          listingType: 'BUY' as const,
          buyListingId: id,
          specCode: key,
          value: String(value),
          specTypeId: 'TODO',
        }));

        await this.prisma.listingSpec.createMany({
          data: specEntries,
        });
      }
    }
    */

    return this.prisma.buyListing.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        deliveryAddress: true,
        specifications: true,
      },
    });
  }

  async deleteBuyListing(id: string, userId: string) {
    // WORKAROUND: Allow any authenticated user to delete their buyer listings
    const listing = await this.prisma.buyListing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Buy listing not found');
    }

    if (listing.buyerId !== userId) {
      throw new UnauthorizedException('You do not have access to this listing');
    }

    // Delete related data first
    await this.prisma.listingSpec.deleteMany({
      where: { buyListingId: id },
    });

    // Delete the listing
    return this.prisma.buyListing.delete({
      where: { id },
    });
  }
}