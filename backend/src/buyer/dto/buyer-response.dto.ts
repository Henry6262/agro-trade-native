import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductUnit, RequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class BuyerCompanySummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  legalName?: string | null;

  @ApiPropertyOptional()
  registrationNumber?: string | null;

  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @ApiPropertyOptional()
  email?: string | null;
}

export class BuyerUserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string | null;

  @ApiPropertyOptional()
  email?: string | null;

  @ApiPropertyOptional({ type: () => BuyerCompanySummaryDto })
  @Type(() => BuyerCompanySummaryDto)
  company?: BuyerCompanySummaryDto | null;
}

export class BuyerProductSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  category?: string | null;
}

export class BuyerDeliveryAddressDto {
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

export class BuyerListingSpecificationDto {
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

export class BuyListingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  buyerId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty({ type: Number })
  quantity: number;

  @ApiProperty({ enum: ProductUnit })
  unit: ProductUnit;

  @ApiPropertyOptional({ type: Number })
  maxPricePerUnit?: number | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  neededBy?: string | null;

  @ApiProperty({ enum: RequestStatus })
  status: RequestStatus;

  @ApiPropertyOptional({ type: String })
  notes?: string | null;

  @ApiPropertyOptional({ type: () => BuyerDeliveryAddressDto })
  @Type(() => BuyerDeliveryAddressDto)
  deliveryAddress?: BuyerDeliveryAddressDto | null;

  @ApiPropertyOptional({ type: () => BuyerProductSummaryDto })
  @Type(() => BuyerProductSummaryDto)
  product?: BuyerProductSummaryDto | null;

  @ApiPropertyOptional({ type: () => BuyerUserSummaryDto })
  @Type(() => BuyerUserSummaryDto)
  buyer?: BuyerUserSummaryDto | null;

  @ApiPropertyOptional({ type: () => [BuyerListingSpecificationDto] })
  @Type(() => BuyerListingSpecificationDto)
  specifications?: BuyerListingSpecificationDto[] | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;
}

export class BuyerOfferListingSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sellerId: string;

  @ApiPropertyOptional({ type: Number })
  quantity?: number | null;

  @ApiPropertyOptional({ type: Number })
  askingPrice?: number | null;

  @ApiPropertyOptional({ type: () => BuyerProductSummaryDto })
  @Type(() => BuyerProductSummaryDto)
  product?: BuyerProductSummaryDto | null;
}

export class BuyerOfferSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  buyListingId: string;

  @ApiPropertyOptional()
  tradeOperationId?: string | null;

  @ApiPropertyOptional({ type: Number })
  price?: number | null;

  @ApiPropertyOptional({ type: Number })
  quantity?: number | null;

  @ApiPropertyOptional()
  status?: string | null;

  @ApiPropertyOptional({ type: () => BuyerOfferListingSummaryDto })
  @Type(() => BuyerOfferListingSummaryDto)
  saleListing?: BuyerOfferListingSummaryDto | null;

  @ApiPropertyOptional({ type: () => BuyerProductSummaryDto })
  @Type(() => BuyerProductSummaryDto)
  product?: BuyerProductSummaryDto | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: string | null;
}

export class BuyerStatsDto {
  @ApiProperty({ type: Number })
  totalListings: number;

  @ApiProperty({ type: Number })
  activeListings: number;

  @ApiProperty({ type: Number })
  totalOffers: number;

  @ApiProperty({ type: Number })
  acceptedOffers: number;

  @ApiProperty({ type: Number })
  fulfilledListings: number;
}
