import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Location")
@Controller("location")
@Public()
export class LocationController {
  private readonly countries = [
    { id: "MA", name: "Morocco", code: "MA", flag: "\uD83C\uDDF2\uD83C\uDDE6" },
    { id: "DZ", name: "Algeria", code: "DZ", flag: "\uD83C\uDDE9\uD83C\uDDFF" },
    { id: "TN", name: "Tunisia", code: "TN", flag: "\uD83C\uDDF9\uD83C\uDDF3" },
    { id: "EG", name: "Egypt", code: "EG", flag: "\uD83C\uDDEA\uD83C\uDDEC" },
    { id: "SD", name: "Sudan", code: "SD", flag: "\uD83C\uDDF8\uD83C\uDDE9" },
    { id: "ET", name: "Ethiopia", code: "ET", flag: "\uD83C\uDDEA\uD83C\uDDF9" },
    { id: "KE", name: "Kenya", code: "KE", flag: "\uD83C\uDDF0\uD83C\uDDEA" },
    { id: "NG", name: "Nigeria", code: "NG", flag: "\uD83C\uDDF3\uD83C\uDDEC" },
    { id: "GH", name: "Ghana", code: "GH", flag: "\uD83C\uDDEC\uD83C\uDDED" },
    { id: "SN", name: "Senegal", code: "SN", flag: "\uD83C\uDDF8\uD83C\uDDF3" },
    { id: "CI", name: "Ivory Coast", code: "CI", flag: "\uD83C\uDDE8\uD83C\uDDEE" },
    { id: "CM", name: "Cameroon", code: "CM", flag: "\uD83C\uDDE8\uD83C\uDDF2" },
    { id: "TZ", name: "Tanzania", code: "TZ", flag: "\uD83C\uDDF9\uD83C\uDDFF" },
    { id: "ZA", name: "South Africa", code: "ZA", flag: "\uD83C\uDDFF\uD83C\uDDE6" },
    { id: "FR", name: "France", code: "FR", flag: "\uD83C\uDDEB\uD83C\uDDF7" },
    { id: "ES", name: "Spain", code: "ES", flag: "\uD83C\uDDEA\uD83C\uDDF8" },
    { id: "IT", name: "Italy", code: "IT", flag: "\uD83C\uDDEE\uD83C\uDDF9" },
    { id: "LY", name: "Libya", code: "LY", flag: "\uD83C\uDDF1\uD83C\uDDFE" },
    { id: "MR", name: "Mauritania", code: "MR", flag: "\uD83C\uDDF2\uD83C\uDDF7" },
    { id: "ML", name: "Mali", code: "ML", flag: "\uD83C\uDDF2\uD83C\uDDF1" },
  ];

  @Get("countries")
  @ApiOperation({ summary: "Get list of available countries" })
  @ApiResponse({ status: 200, description: "List of countries" })
  getCountries() {
    return {
      data: this.countries,
      total: this.countries.length,
    };
  }

  @Get("geocode")
  @ApiOperation({ summary: "Geocode an address (stub)" })
  @ApiQuery({ name: "address", required: false })
  @ApiResponse({ status: 200, description: "Geocode result" })
  geocode(@Query("address") address?: string) {
    return {
      lat: 0,
      lng: 0,
      address: address || "",
    };
  }

  @Get("reverse-geocode")
  @ApiOperation({ summary: "Reverse geocode coordinates (stub)" })
  @ApiQuery({ name: "lat", required: false })
  @ApiQuery({ name: "lng", required: false })
  @ApiResponse({ status: 200, description: "Reverse geocode result" })
  reverseGeocode(@Query("lat") lat?: string, @Query("lng") lng?: string) {
    return {
      address: "Unknown location",
      lat: parseFloat(lat || "0"),
      lng: parseFloat(lng || "0"),
    };
  }

  @Get("pricing")
  @ApiOperation({ summary: "Get location-based pricing (stub)" })
  @ApiResponse({ status: 200, description: "Pricing data" })
  getPricing() {
    return { price: 0, currency: "USD" };
  }

  @Get("user-pricing")
  @ApiOperation({ summary: "Get user-specific pricing (stub)" })
  @ApiResponse({ status: 200, description: "User pricing data" })
  getUserPricing() {
    return { price: 0, currency: "USD" };
  }
}
