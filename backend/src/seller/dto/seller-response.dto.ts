import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus } from './create-listing.dto';
import { Type } from 'class-transformer';

export class SellerProductSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  category?: string | null;

  @ApiPropertyOptional()
  description?: string | null;
}

export class SellerAddressDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  street?: string | null;

  @ApiPropertyOptional()
  city?: string | null;

  @ApiPropertyOptional()
  country?: string | null;

  @ApiPropertyOptional({ type: Number })
  latitude?: number | null;

  @ApiPropertyOptional({ type: Number })
  longitude?: number | null;
}

export class SellerListingSpecificationDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  specTypeId?: string | null;

  @ApiPropertyOptional()
  valueText?: string | null;

  @ApiPropertyOptional({ type: Number })
  valueNumber?: number | null;

  @ApiPropertyOptional()
  valueBool?: boolean | null;
}

export class SellerListingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sellerId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty({ type: Number })
  quantity: number;

  @ApiProperty()
  unit: string;

  @ApiPropertyOptional({ type: Number })
  askingPrice?: number | null;

  @ApiProperty({ enum: ListingStatus })
  status: ListingStatus;

  @ApiPropertyOptional({ type: () => SellerProductSummaryDto })
  @Type(() => SellerProductSummaryDto)
  product?: SellerProductSummaryDto | null;

  @ApiPropertyOptional({ type: () => SellerAddressDto })
  @Type(() => SellerAddressDto)
  address?: SellerAddressDto | null;

  @ApiPropertyOptional({ type: () => [SellerListingSpecificationDto] })
  @Type(() => SellerListingSpecificationDto)
  specifications?: SellerListingSpecificationDto[] | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;
}

export class SellerProductListingDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  subcategory?: string;

  @ApiProperty({ type: Number })
  quantity: number;

  @ApiProperty()
  unit: string;

  @ApiProperty({ type: Number })
  pricePerUnit: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional({ type: () => Object, additionalProperties: true })
  location?: Record<string, any>;

  @ApiPropertyOptional({ type: [String] })
  qualityTags?: string[];

  @ApiPropertyOptional({ type: [String] })
  certifications?: string[];

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional({ type: [String] })
  images?: string[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;

  @ApiProperty({ type: Number })
  views: number;

  @ApiProperty({ type: Number })
  inquiries: number;
}

export class SellerOfferStatsDto {
  @ApiProperty({ type: Number })
  totalOffers: number;

  @ApiProperty({ type: Number })
  pendingOffers: number;

  @ApiProperty({ type: Number })
  acceptedThisMonth: number;

  @ApiProperty({ type: Number })
  averageOfferValue: number;

  @ApiProperty()
  topRequestedProduct: string;

  @ApiProperty({ type: Number })
  conversionRate: number;
}

export class SellerOfferDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  product: string;

  @ApiProperty({ type: Number })
  quantity: number;

  @ApiProperty({ type: Number })
  offeredPricePerTon: number;

  @ApiProperty({ type: Number })
  totalValue: number;

  @ApiProperty()
  buyer: string;

  @ApiProperty()
  buyerLocation: string;

  @ApiProperty()
  buyerFlag: string;

  @ApiProperty()
  adminNote: string;

  @ApiProperty({ type: String, format: 'date-time' })
  deadline: string;

  @ApiProperty()
  responseTime: string;

  @ApiProperty({ type: Number })
  estimatedProfit: number;

  @ApiProperty({ type: [String] })
  qualityRequirements: string[];

  @ApiProperty()
  status: string;

  @ApiProperty()
  negotiationId: string;

  @ApiProperty()
  tradeOperationId: string;

  @ApiProperty()
  isExpiringSoon: boolean;

  @ApiProperty({ type: Number })
  hoursUntilExpiry: number;

  @ApiPropertyOptional({ type: () => Object, additionalProperties: true })
  counterOffer?: Record<string, any>;

  @ApiPropertyOptional({ type: () => Object, isArray: true, additionalProperties: true })
  offerHistory?: Record<string, any>[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;
}

export class SellerOffersDataDto {
  @ApiProperty({ type: () => [SellerOfferDto] })
  @Type(() => SellerOfferDto)
  offers: SellerOfferDto[];

  @ApiProperty({ type: () => SellerOfferStatsDto })
  @Type(() => SellerOfferStatsDto)
  stats: SellerOfferStatsDto;
}

export class SellerOffersResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: () => SellerOffersDataDto })
  @Type(() => SellerOffersDataDto)
  data: SellerOffersDataDto;
}

export class SellerStatsDto {
  @ApiProperty({ type: Number })
  totalProducts: number;

  @ApiProperty({ type: Number })
  activeListings: number;

  @ApiProperty({ type: Number })
  totalOffers: number;

  @ApiProperty({ type: Number })
  pendingOffers: number;

  @ApiProperty({ type: Number })
  totalTrades: number;

  @ApiProperty({ type: Number })
  completedTrades: number;

  @ApiProperty({ type: Number })
  totalRevenue: number;

  @ApiProperty({ type: Number })
  monthlyRevenue: number;

  @ApiProperty({ type: Number })
  averageRating: number;
}

export class SellerCreateListingResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ type: () => SellerListingResponseDto })
  @Type(() => SellerListingResponseDto)
  data: SellerListingResponseDto;
}
