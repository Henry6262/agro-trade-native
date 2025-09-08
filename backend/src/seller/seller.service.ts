import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto, ListingStatus, OfferType } from './dto/create-listing.dto';

@Injectable()
export class SellerService {
  constructor(private prisma: PrismaService) {}

  async createListing(createListingDto: CreateListingDto, userId: string) {
    try {
      // Verify the product exists
      const product = await this.prisma.product.findUnique({
        where: { id: createListingDto.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${createListingDto.productId} not found`);
      }

      // First, create or get the address
      let addressId: string | null = null;
      if (createListingDto.location) {
        // Find or create region first
        let region = await this.prisma.region.findFirst({
          where: {
            name: createListingDto.location.region || 'Default Region',
          },
        });

        if (!region) {
          region = await this.prisma.region.create({
            data: {
              name: createListingDto.location.region || 'Default Region',
              country: createListingDto.location.country || 'Unknown',
            },
          });
        }

        // Find or create city
        let city = await this.prisma.city.findFirst({
          where: {
            name: createListingDto.location.city || 'Unknown',
            regionId: region.id,
          },
        });

        if (!city) {
          city = await this.prisma.city.create({
            data: {
              name: createListingDto.location.city || 'Unknown',
              regionId: region.id,
            },
          });
        }

        // Create address
        const address = await this.prisma.address.create({
          data: {
            userId,
            addressType: 'FARM',
            label: 'Primary Location',
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
          unit: (createListingDto.unit?.toUpperCase() as any) || 'TON',
          askingPrice: createListingDto.priceExpectation?.max || null,
          addressId,
          status: createListingDto.status === 'active' ? 'ACTIVE' : 'PENDING',
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
      if (createListingDto.offerType === OfferType.CUSTOM_OFFER && createListingDto.specifications) {
        // Get all specification types
        const specTypes = await this.prisma.specificationType.findMany();

        // Store specifications as ListingSpec entries
        const specPromises = Object.entries(createListingDto.specifications).map(async ([key, value]) => {
          // Try to find matching specification type by code or name
          let specType = specTypes.find(st => st.code === key || st.name === key);
          
          // If not found, create a new specification type
          if (!specType) {
            specType = await this.prisma.specificationType.create({
              data: {
                code: key,
                name: key,
                dataType: typeof value === 'number' ? 'NUMBER' : 
                         typeof value === 'boolean' ? 'BOOLEAN' : 'TEXT',
              },
            });
          }

          const specData: any = {
            saleListingId: listing.id,
            specTypeId: specType.id,
          };

          // Store value based on data type
          if (specType.dataType === 'NUMBER') {
            specData.valueNumber = parseFloat(String(value));
          } else if (specType.dataType === 'BOOLEAN') {
            specData.valueBool = value === 'true' || value === true;
          } else {
            specData.valueText = String(value);
          }

          return this.prisma.listingSpec.create({
            data: specData,
          });
        });
        
        const results = await Promise.all(specPromises);
        const validSpecs = results.filter(r => r !== null);
        
        // Create notification for admin review
        await this.createCustomOfferNotification(listing.id, userId);
      }

      return {
        success: true,
        message: createListingDto.offerType === OfferType.CUSTOM_OFFER 
          ? 'Custom offer submitted successfully. You will receive a quote within 24 hours.'
          : 'Listing created successfully and is now visible on the marketplace.',
        data: listing,
      };
    } catch (error) {
      console.error('Error creating listing:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create listing. Please try again.');
    }
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
        createdAt: 'desc',
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
        createdAt: 'desc',
      },
    });

    // Transform listings to match frontend SellerProduct interface
    return listings.map(listing => ({
      id: listing.id,
      name: listing.product.name,
      category: listing.product.category || 'General',
      subcategory: '', // Product model doesn't have subcategory
      quantity: listing.quantity,
      unit: listing.unit.toLowerCase(),
      pricePerUnit: listing.askingPrice || 0,
      currency: 'USD',
      location: {
        address: listing.address?.street || '',
        city: listing.address?.city?.name || '',
        state: listing.address?.city?.region?.name || '',
        country: listing.address?.country || '',
        coordinates: listing.address?.latitude && listing.address?.longitude ? {
          latitude: listing.address.latitude,
          longitude: listing.address.longitude,
        } : undefined,
      },
      qualityTags: this.extractQualityTags(listing.specifications),
      certifications: [], // TODO: Add certifications support
      description: listing.product.description || '',
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
    
    specifications?.forEach(spec => {
      if (spec.specificationType) {
        const { name, code } = spec.specificationType;
        let value = '';
        
        if (spec.valueText) value = spec.valueText;
        else if (spec.valueNumber !== null) value = spec.valueNumber.toString();
        else if (spec.valueBool !== null) value = spec.valueBool ? 'Yes' : 'No';
        
        if (value) {
          // Format as tag (e.g., "Organic", "Protein 15%", etc.)
          if (name.toLowerCase().includes('organic') && spec.valueBool) {
            tags.push('Organic');
          } else if (name.toLowerCase().includes('gmo') && !spec.valueBool) {
            tags.push('Non-GMO');
          } else if (name.toLowerCase().includes('protein') && spec.valueNumber) {
            tags.push(`Protein ${spec.valueNumber}%`);
          } else if (name.toLowerCase().includes('grade')) {
            tags.push(`Grade ${value}`);
          } else if (value !== 'No' && value !== 'false') {
            tags.push(`${name}: ${value}`);
          }
        }
      }
    });
    
    return tags;
  }

  private mapListingStatus(status: string): 'active' | 'inactive' | 'sold_out' {
    switch (status) {
      case 'ACTIVE':
        return 'active';
      case 'EXPIRED':
        return 'sold_out';
      case 'PENDING':
      default:
        return 'inactive';
    }
  }

  // Get offers for seller's products (placeholder - implement when offer system is ready)
  async getSellerOffers(userId: string) {
    // TODO: Implement proper offer fetching from database
    // For now, return empty array to prevent frontend errors
    return [];
  }

  // Get active trades for seller (placeholder - implement when trade system is ready)
  async getSellerTrades(userId: string) {
    // TODO: Implement proper trade fetching from database
    // For now, return empty array to prevent frontend errors
    return [];
  }

  // Get seller statistics
  async getSellerStats(userId: string) {
    const listings = await this.prisma.saleListing.findMany({
      where: { sellerId: userId },
    });

    const activeListings = listings.filter(l => l.status === 'ACTIVE').length;
    const totalProducts = listings.length;

    // TODO: Implement proper statistics calculation
    return {
      totalProducts,
      activeListings,
      totalOffers: 0, // TODO: Count actual offers
      pendingOffers: 0, // TODO: Count pending offers
      totalTrades: 0, // TODO: Count completed trades
      completedTrades: 0, // TODO: Count completed trades
      totalRevenue: 0, // TODO: Calculate actual revenue
      monthlyRevenue: 0, // TODO: Calculate monthly revenue
      averageRating: 0, // TODO: Calculate average rating
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
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  async updateListingStatus(listingId: string, status: ListingStatus, userId: string) {
    const listing = await this.prisma.saleListing.findFirst({
      where: {
        id: listingId,
        sellerId: userId,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const updatedListing = await this.prisma.saleListing.update({
      where: { id: listingId },
      data: { 
        status: status === 'active' ? 'ACTIVE' : status === 'draft' ? 'PENDING' : 'EXPIRED'
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

  private async createCustomOfferNotification(listingId: string, sellerId: string) {
    try {
      // For now, just log the notification
      // In production, this would integrate with a notification service
      console.log('Custom offer notification:', {
        type: 'CUSTOM_OFFER_REVIEW',
        title: 'New Custom Offer Request',
        message: `A seller has submitted a custom offer request for review.`,
        metadata: {
          listingId,
          sellerId,
        },
        recipientRole: 'ADMIN',
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't throw error as this is not critical for listing creation
    }
  }
}