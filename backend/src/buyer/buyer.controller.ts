import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  BadRequestException,
  Query,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BuyerService } from "./buyer.service";
import {
  CreateBuyListingDto,
  UpdateBuyListingDto,
} from "./dto/create-buy-listing.dto";
import {
  BuyListingResponseDto,
  BuyerOfferSummaryDto,
  BuyerStatsDto,
} from "./dto/buyer-response.dto";
import { RequestStatus, UserRole } from "@prisma/client";

interface AuthRequest {
  user: {
    id: string;
    role?: UserRole;
  };
}

@ApiTags("Buyer")
@Controller("buyer")
export class BuyerController {
  constructor(private readonly buyerService: BuyerService) {}

  @Post("listings")
  @ApiOperation({ summary: "Create a buy listing" })
  @ApiBody({ type: CreateBuyListingDto })
  @ApiOkResponse({
    description: "Created buy listing",
    type: BuyListingResponseDto,
  })
  async createBuyListing(
    @Body() createBuyListingDto: CreateBuyListingDto,
    @Request() req: AuthRequest,
  ) {
    const listing = await this.buyerService.createBuyListing(
      createBuyListingDto,
      req.user.id,
    );

    return this.serializeBuyListing(listing);
  }

  @Get("listings")
  @ApiOperation({ summary: "Get buy listings for current user" })
  @ApiOkResponse({
    description: "Buyer listings",
    type: BuyListingResponseDto,
    isArray: true,
  })
  async getMyBuyListings(
    @Request() req?: AuthRequest,
    @Query("includeTradeOps") includeTradeOps?: string,
  ) {
    const listings = await this.buyerService.getAllBuyListings(
      includeTradeOps === "true",
    );
    return listings.map((listing) => this.serializeBuyListing(listing));
  }

  @Get("listings/:id")
  @ApiOperation({ summary: "Get buy listing by id" })
  @ApiOkResponse({
    description: "Buy listing detail",
    type: BuyListingResponseDto,
  })
  async getBuyListingById(
    @Param("id") id: string,
    @Request() req: AuthRequest,
  ) {
    const listing = await this.buyerService.getBuyListingById(id, req.user.id);
    return this.serializeBuyListing(listing);
  }

  @Get("offers")
  @ApiOperation({ summary: "Get offers for current buyer listings" })
  @ApiOkResponse({
    description: "Buyer offers",
    type: BuyerOfferSummaryDto,
    isArray: true,
  })
  async getMyOffers(@Request() req: AuthRequest) {
    const offers = await this.buyerService.getBuyerOffers(req.user.id);
    return offers.map((offer) => this.serializeOffer(offer));
  }

  @Get("trades")
  @ApiOperation({ summary: "Get accepted trade offers for buyer" })
  @ApiOkResponse({
    description: "Buyer trades",
    type: BuyerOfferSummaryDto,
    isArray: true,
  })
  async getMyTrades(@Request() req: AuthRequest) {
    const trades = await this.buyerService.getBuyerTrades(req.user.id);
    return trades.map((offer) => this.serializeOffer(offer));
  }

  @Get("stats")
  @ApiOperation({ summary: "Get buyer statistics" })
  @ApiOkResponse({
    description: "Buyer statistics",
    type: BuyerStatsDto,
  })
  async getMyStats(@Request() req: AuthRequest) {
    return this.buyerService.getBuyerStats(req.user.id);
  }

  @Patch("listings/:id/status")
  @ApiOperation({ summary: "Update buy listing status" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: Object.values(RequestStatus),
        },
      },
      required: ["status"],
    },
  })
  @ApiOkResponse({
    description: "Updated listing",
    type: BuyListingResponseDto,
  })
  async updateBuyListingStatus(
    @Param("id") id: string,
    @Body("status") status: RequestStatus,
    @Request() req: AuthRequest,
  ) {
    const listing = await this.buyerService.updateBuyListingStatus(
      id,
      status,
      req.user.id,
    );

    return this.serializeBuyListing(listing);
  }

  @Patch("listings/:id")
  @ApiOperation({ summary: "Update buy listing" })
  @ApiBody({ type: UpdateBuyListingDto })
  @ApiOkResponse({
    description: "Updated listing",
    type: BuyListingResponseDto,
  })
  async updateBuyListing(
    @Param("id") id: string,
    @Body() updateDto: UpdateBuyListingDto,
    @Request() req: AuthRequest,
  ) {
    const listing = await this.buyerService.updateBuyListing(
      id,
      updateDto,
      req.user.id,
    );

    return this.serializeBuyListing(listing);
  }

  @Delete("listings/:id")
  @ApiOperation({ summary: "Delete buy listing" })
  @ApiOkResponse({
    description: "Deleted buy listing",
    type: BuyListingResponseDto,
  })
  async deleteBuyListing(@Param("id") id: string, @Request() req: AuthRequest) {
    const deleted = await this.buyerService.deleteBuyListing(id, req.user.id);
    return this.serializeBuyListing(deleted);
  }

  private serializeBuyListing(entity: any): BuyListingResponseDto {
    if (!entity) {
      throw new BadRequestException("Invalid buy listing payload");
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

    const buyer = entity.buyer
      ? {
          id: entity.buyer.id,
          name: entity.buyer.name,
          email: entity.buyer.email,
          businessName: entity.buyer.company?.legalName || entity.buyer.name,
          company: entity.buyer.company
            ? {
                id: entity.buyer.company.id,
                legalName: entity.buyer.company.legalName,
                registrationNumber: entity.buyer.company.registrationNumber,
                phoneNumber: entity.buyer.company.phoneNumber,
                email: entity.buyer.company.email,
              }
            : null,
        }
      : null;

    const deliveryAddress = entity.deliveryAddress
      ? {
          id: entity.deliveryAddress.id,
          street: entity.deliveryAddress.street,
          city:
            entity.deliveryAddress.city?.name ?? entity.deliveryAddress.city,
          region: entity.deliveryAddress.city?.region?.name ?? null,
          country: entity.deliveryAddress.country,
          address: entity.deliveryAddress.street,
          latitude: entity.deliveryAddress.latitude
            ? Number(entity.deliveryAddress.latitude)
            : null,
          longitude: entity.deliveryAddress.longitude
            ? Number(entity.deliveryAddress.longitude)
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
      BuyListingResponseDto,
      {
        id: entity.id,
        buyerId: entity.buyerId,
        productId: entity.productId,
        quantity: Number(entity.quantity),
        unit: entity.unit,
        maxPricePerUnit: entity.maxPricePerUnit
          ? Number(entity.maxPricePerUnit)
          : null,
        neededBy: entity.neededBy?.toISOString?.() ?? null,
        status: entity.status,
        notes: entity.notes ?? null,
        deliveryAddress,
        product,
        buyer,
        specifications,
        createdAt:
          entity.createdAt?.toISOString?.() ?? new Date().toISOString(),
        updatedAt:
          entity.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      },
      { excludeExtraneousValues: false },
    );
  }

  private serializeOffer(entity: any): BuyerOfferSummaryDto {
    if (!entity) {
      throw new BadRequestException("Invalid offer payload");
    }

    const saleListing = entity.saleListing
      ? {
          id: entity.saleListing.id,
          sellerId: entity.saleListing.sellerId,
          quantity: entity.saleListing.quantity
            ? Number(entity.saleListing.quantity)
            : null,
          askingPrice: entity.saleListing.askingPrice
            ? Number(entity.saleListing.askingPrice)
            : null,
          product: entity.saleListing.product
            ? {
                id: entity.saleListing.product.id,
                name: entity.saleListing.product.name,
                category: entity.saleListing.product.category,
              }
            : null,
        }
      : null;

    return plainToInstance(
      BuyerOfferSummaryDto,
      {
        id: entity.id,
        buyListingId: entity.buyListingId,
        tradeOperationId: entity.tradeOperationId,
        price: entity.price ? Number(entity.price) : null,
        quantity: entity.quantity ? Number(entity.quantity) : null,
        status: entity.status,
        saleListing,
        product: entity.buyListing?.product
          ? {
              id: entity.buyListing.product.id,
              name: entity.buyListing.product.name,
              category: entity.buyListing.product.category,
            }
          : (saleListing?.product ?? null),
        createdAt: entity.createdAt?.toISOString?.() ?? null,
        updatedAt: entity.updatedAt?.toISOString?.() ?? null,
      },
      { excludeExtraneousValues: false },
    );
  }
}
