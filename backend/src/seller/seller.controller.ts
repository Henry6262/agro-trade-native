import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  BadRequestException,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { SellerService } from "./seller.service";
import { CreateListingDto, ListingStatus } from "./dto/create-listing.dto";
import {
  SellerCreateListingResponseDto,
  SellerListingResponseDto,
  SellerOffersResponseDto,
  SellerProductListingDto,
  SellerStatsDto,
} from "./dto/seller-response.dto";
import { SellerTimelineResponseDto } from "./dto/timeline.dto";

interface AuthRequest {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags("Seller")
@Controller("seller")
@UseGuards(JwtAuthGuard)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Post("listings")
  @ApiOperation({ summary: "Create a sale listing" })
  @ApiBody({ type: CreateListingDto })
  @ApiOkResponse({
    description: "Created listing",
    type: SellerCreateListingResponseDto,
  })
  async createListing(
    @Body() createListingDto: CreateListingDto,
    @Request() req: AuthRequest,
  ) {
    const result = await this.sellerService.createListing(
      createListingDto,
      req.user.id,
    );

    return plainToInstance(
      SellerCreateListingResponseDto,
      {
        success: result.success,
        message: result.message,
        data: this.serializeListing(result.data),
      },
      { excludeExtraneousValues: false },
    );
  }

  @Get("listings")
  @ApiOperation({ summary: "Get seller listings" })
  @ApiOkResponse({
    description: "Seller listings",
    type: SellerListingResponseDto,
    isArray: true,
  })
  async getMyListings(
    @Request() req?: AuthRequest,
    @Query("buyListingId") buyListingId?: string,
    @Query("tradeOperationId") tradeOperationId?: string,
  ) {
    const listings = await this.sellerService.getAllSellerListings(
      buyListingId,
      tradeOperationId,
    );
    return listings.map((listing) => this.serializeListing(listing));
  }

  @Get("listings/:id")
  @ApiOperation({ summary: "Get listing by id" })
  @ApiOkResponse({
    description: "Seller listing detail",
    type: SellerListingResponseDto,
  })
  async getListingById(@Param("id") id: string, @Request() req: AuthRequest) {
    const listing = await this.sellerService.getListingById(id, req.user.id);
    return this.serializeListing(listing);
  }

  @Get("products")
  @ApiOperation({ summary: "Get seller products view" })
  @ApiOkResponse({
    description: "Seller products",
    type: SellerProductListingDto,
    isArray: true,
  })
  async getMyProducts(@Request() req: AuthRequest) {
    const products = await this.sellerService.getSellerProducts(req.user.id);
    return products.map((product) =>
      plainToInstance(SellerProductListingDto, product, {
        excludeExtraneousValues: false,
      }),
    );
  }

  @Get("offers")
  @ApiOperation({ summary: "Get offers for seller" })
  @ApiOkResponse({
    description: "Seller offers and stats",
    type: SellerOffersResponseDto,
  })
  async getMyOffers(@Request() req: AuthRequest) {
    const offers = await this.sellerService.getSellerOffers(req.user.id);
    return plainToInstance(SellerOffersResponseDto, offers, {
      excludeExtraneousValues: false,
    });
  }

  @Get("trades")
  @ApiOperation({ summary: "Get active trades for seller" })
  @ApiOkResponse({
    description: "Seller trades",
    schema: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true,
      },
    },
  })
  async getMyTrades(@Request() req: AuthRequest) {
    return this.sellerService.getSellerTrades(req.user.id);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get seller statistics" })
  @ApiOkResponse({
    description: "Seller stats",
    type: SellerStatsDto,
  })
  async getMyStats(@Request() req: AuthRequest) {
    const stats = await this.sellerService.getSellerStats(req.user.id);
    return plainToInstance(SellerStatsDto, stats, {
      excludeExtraneousValues: false,
    });
  }

  @Get("timeline")
  @ApiOperation({ summary: "Get seller timeline events" })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Number of events to fetch (default 20, max 50)",
  })
  @ApiQuery({
    name: "cursor",
    required: false,
    description: "Pagination cursor (last event ID from previous response)",
  })
  @ApiOkResponse({
    description: "Seller timeline events",
    type: SellerTimelineResponseDto,
  })
  async getSellerTimeline(
    @Request() req: AuthRequest,
    @Query("limit") limit = "20",
    @Query("cursor") cursor?: string,
  ): Promise<SellerTimelineResponseDto> {
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
    return this.sellerService.getTimeline(req.user.id, parsedLimit, cursor);
  }

  @Patch("listings/:id/status")
  @ApiOperation({ summary: "Update listing status" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: Object.values(ListingStatus),
        },
      },
      required: ["status"],
    },
  })
  @ApiOkResponse({
    description: "Updated listing",
    type: SellerListingResponseDto,
  })
  async updateListingStatus(
    @Param("id") id: string,
    @Body("status") status: ListingStatus,
    @Request() req: AuthRequest,
  ) {
    const listing = await this.sellerService.updateListingStatus(
      id,
      status,
      req.user.id,
    );

    return this.serializeListing(listing);
  }

  private serializeListing(entity: any): SellerListingResponseDto {
    if (!entity) {
      throw new BadRequestException("Invalid listing payload");
    }

    const product = entity.product
      ? {
          id: entity.product.id,
          name: entity.product.name,
          displayName: entity.product.displayName,
          category: entity.product.category,
          description: entity.product.description,
          image: entity.product.image,
        }
      : null;

    const seller = entity.seller
      ? {
          id: entity.seller.id,
          name: entity.seller.name,
          email: entity.seller.email,
          businessName: entity.seller.company?.legalName || entity.seller.name,
          verificationStatus: entity.seller.verificationStatus,
          company: entity.seller.company
            ? {
                id: entity.seller.company.id,
                legalName: entity.seller.company.legalName,
                registrationNumber: entity.seller.company.registrationNumber,
                phoneNumber: entity.seller.company.phoneNumber,
                email: entity.seller.company.email,
              }
            : null,
        }
      : null;

    const address = entity.address
      ? {
          id: entity.address.id,
          street: entity.address.street,
          city: entity.address.city?.name ?? entity.address.city,
          region: entity.address.city?.region?.name ?? null,
          country: entity.address.country,
          address: entity.address.street,
          latitude: entity.address.latitude
            ? Number(entity.address.latitude)
            : null,
          longitude: entity.address.longitude
            ? Number(entity.address.longitude)
            : null,
        }
      : null;

    const specifications = entity.specifications
      ? entity.specifications.map((spec: any) => ({
          id: spec.id,
          specTypeId: spec.specTypeId,
          valueText: spec.valueText,
          valueNumber: spec.valueNumber ? Number(spec.valueNumber) : null,
          valueBool: spec.valueBool,
          specificationType: spec.specificationType
            ? {
                id: spec.specificationType.id,
                code: spec.specificationType.code,
                name: spec.specificationType.name,
                unit: spec.specificationType.unit,
                dataType: spec.specificationType.dataType,
              }
            : null,
        }))
      : null;

    return plainToInstance(
      SellerListingResponseDto,
      {
        id: entity.id,
        sellerId: entity.sellerId,
        productId: entity.productId,
        quantity: Number(entity.quantity),
        unit: entity.unit,
        askingPrice: entity.askingPrice ? Number(entity.askingPrice) : null,
        status: (entity.status ?? "PENDING")
          .toString()
          .toLowerCase() as ListingStatus,
        product,
        seller,
        address,
        specifications,
        createdAt:
          entity.createdAt?.toISOString?.() ?? new Date().toISOString(),
        updatedAt:
          entity.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      },
      { excludeExtraneousValues: false },
    );
  }
}
