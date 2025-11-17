export interface RegionDto {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  color: string;
}

export interface CityDto {
  id: string;
  name: string;
  regionId: string;
  lat: number;
  lng: number;
  population: number;
}
