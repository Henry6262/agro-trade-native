import { Injectable } from "@nestjs/common";
import { CityDto, RegionDto } from "./dto/regions.dto";

@Injectable()
export class RegionsService {
  // Bulgaria NUTS-2 Regions
  private readonly regions: RegionDto[] = [
    {
      id: "BG31",
      name: "Severozapaden (Northwest)",
      centerLat: 43.4,
      centerLng: 23.2,
      color: "#4CAF50",
    },
    {
      id: "BG32",
      name: "Severen tsentralen (North Central)",
      centerLat: 43.2,
      centerLng: 25.6,
      color: "#2196F3",
    },
    {
      id: "BG33",
      name: "Severoiztochen (Northeast)",
      centerLat: 43.5,
      centerLng: 27.5,
      color: "#FF9800",
    },
    {
      id: "BG34",
      name: "Yugoiztochen (Southeast)",
      centerLat: 42.1,
      centerLng: 26.5,
      color: "#9C27B0",
    },
    {
      id: "BG41",
      name: "Yugozapaden (Southwest)",
      centerLat: 42.1,
      centerLng: 23.3,
      color: "#F44336",
    },
    {
      id: "BG42",
      name: "Yuzhen tsentralen (South Central)",
      centerLat: 42.0,
      centerLng: 25.0,
      color: "#00BCD4",
    },
  ];

  // Major cities per region
  private readonly cities: CityDto[] = [
    // BG31 - Severozapaden (Northwest)
    {
      id: "vidin",
      name: "Vidin",
      regionId: "BG31",
      lat: 43.9866,
      lng: 22.8735,
      population: 48071,
    },
    {
      id: "montana",
      name: "Montana",
      regionId: "BG31",
      lat: 43.4092,
      lng: 23.2269,
      population: 43400,
    },
    {
      id: "vratsa",
      name: "Vratsa",
      regionId: "BG31",
      lat: 43.21,
      lng: 23.5628,
      population: 60692,
    },

    // BG32 - Severen tsentralen (North Central)
    {
      id: "pleven",
      name: "Pleven",
      regionId: "BG32",
      lat: 43.417,
      lng: 24.6167,
      population: 106954,
    },
    {
      id: "veliko-tarnovo",
      name: "Veliko Tarnovo",
      regionId: "BG32",
      lat: 43.0757,
      lng: 25.6172,
      population: 68783,
    },
    {
      id: "gabrovo",
      name: "Gabrovo",
      regionId: "BG32",
      lat: 42.8747,
      lng: 25.3178,
      population: 58950,
    },

    // BG33 - Severoiztochen (Northeast)
    {
      id: "varna",
      name: "Varna",
      regionId: "BG33",
      lat: 43.2141,
      lng: 27.9147,
      population: 334870,
    },
    {
      id: "shumen",
      name: "Shumen",
      regionId: "BG33",
      lat: 43.2706,
      lng: 26.9256,
      population: 80855,
    },
    {
      id: "ruse",
      name: "Ruse",
      regionId: "BG33",
      lat: 43.8356,
      lng: 25.9656,
      population: 149642,
    },

    // BG34 - Yugoiztochen (Southeast)
    {
      id: "burgas",
      name: "Burgas",
      regionId: "BG34",
      lat: 42.5048,
      lng: 27.4626,
      population: 202694,
    },
    {
      id: "sliven",
      name: "Sliven",
      regionId: "BG34",
      lat: 42.6824,
      lng: 26.315,
      population: 91620,
    },
    {
      id: "yambol",
      name: "Yambol",
      regionId: "BG34",
      lat: 42.4836,
      lng: 26.5039,
      population: 74132,
    },

    // BG41 - Yugozapaden (Southwest)
    {
      id: "sofia",
      name: "Sofia",
      regionId: "BG41",
      lat: 42.6977,
      lng: 23.3219,
      population: 1241675,
    },
    {
      id: "pernik",
      name: "Pernik",
      regionId: "BG41",
      lat: 42.6056,
      lng: 23.0372,
      population: 80191,
    },
    {
      id: "blagoevgrad",
      name: "Blagoevgrad",
      regionId: "BG41",
      lat: 42.0116,
      lng: 23.0942,
      population: 70881,
    },

    // BG42 - Yuzhen tsentralen (South Central)
    {
      id: "plovdiv",
      name: "Plovdiv",
      regionId: "BG42",
      lat: 42.1354,
      lng: 24.7453,
      population: 346893,
    },
    {
      id: "stara-zagora",
      name: "Stara Zagora",
      regionId: "BG42",
      lat: 42.4258,
      lng: 25.6342,
      population: 138272,
    },
    {
      id: "pazardzhik",
      name: "Pazardzhik",
      regionId: "BG42",
      lat: 42.1897,
      lng: 24.3336,
      population: 71979,
    },
  ];

  async getRegions(): Promise<Region[]> {
    return this.regions;
  }

  async getCities(regionId?: string): Promise<City[]> {
    if (regionId) {
      return this.cities.filter((city) => city.regionId === regionId);
    }
    return this.cities;
  }
}
