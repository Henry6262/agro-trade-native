import { ProductCategory } from "@prisma/client";

export interface ApiResponseDto<TData> {
  success: boolean;
  data: TData;
  message: string;
  total?: number;
}

export interface ProductSpecificationDto {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  dataType: string;
  importance: number | null;
  displayOrder: number | null;
  minValue: number | null;
  maxValue: number | null;
}

export interface ProductMetadataDto {
  id: string;
  category: ProductCategory;
  name: string;
  displayName: string;
  description: string | null;
  image: string | null;
  harvestSeason: string | null;
  storageRecommendations: string | null;
  priceRangeMin: number | null;
  priceRangeMax: number | null;
  defaultUnit: string | null;
  specifications: ProductSpecificationDto[];
}

export interface CategoryMetadataDto {
  id: string;
  category: ProductCategory;
  name: string;
  image: string | null;
  description: string | null;
  availableListings: number;
}

export interface RegionWithCitiesDto {
  id: string;
  country: string;
  name: string;
  cities: { id: string; name: string; lat: number; lng: number }[];
}

export interface SpecificationTypeDto {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  dataType: string;
  minValue: number | null;
  maxValue: number | null;
}
