# Geocoding Instructions

## Overview
We need real GPS coordinates for all buyer and seller addresses to make transport cost calculations work properly.

## Current Status
- ✅ **addresses-for-geocoding.json** created with 30 addresses
- 📦 13 Buyers with 27 listings
- 🌾 18 Sellers (Farmers) with 57 listings

## Step-by-Step Process

### 1. Extract Addresses (DONE ✅)
```bash
npx tsx extract-addresses-for-geocoding.ts
```
This creates `addresses-for-geocoding.json` with all current addresses.

### 2. Generate Real Coordinates (YOUR TASK)
Open `addresses-for-geocoding.json` and for each address:
- Look at the `street`, `city`, `country` fields
- Use a geocoding service (Google Maps, OpenStreetMap, etc.) to get real coordinates
- Fill in `newLatitude` and `newLongitude` fields

**Example:**
```json
{
  "addressId": "cmgxfth9w001e123lefl26aa6",
  "street": "Industrial Complex 92",
  "city": "cmgxfliba0009rluwc1hwv3lc",
  "postalCode": "8245",
  "country": "Bulgaria",
  "currentLat": 42.66020773955191,
  "currentLng": 23.35281654780956,
  "newLatitude": 42.6977,     // <-- FILL THIS IN
  "newLongitude": 23.3219     // <-- FILL THIS IN
}
```

### 3. Save Geocoded File
Save the updated file as `addresses-with-geocoding.json`

### 4. Update Database
```bash
npx tsx update-addresses-with-geocoding.ts
```
This will update all addresses in the database with the new coordinates.

### 5. Verify
```bash
npx tsx check-coordinates.ts
```
This checks that all listings now have proper coordinates.

## Notes
- The `city` field contains a Prisma ID, not the actual city name
- You may need to look up Bulgarian cities by postal code
- If an address already has good coordinates, you can leave `newLatitude`/`newLongitude` as `null` and it will be skipped
- Common Bulgarian cities in our data:
  - Sofia (capital)
  - Plovdiv
  - Varna
  - Burgas
  - Ruse
  - Stara Zagora

## Files
- `extract-addresses-for-geocoding.ts` - Extract current addresses
- `addresses-for-geocoding.json` - Output file with addresses to geocode
- `addresses-with-geocoding.json` - YOUR file with filled coordinates
- `update-addresses-with-geocoding.ts` - Update database with new coordinates
- `check-coordinates.ts` - Verify all addresses have coordinates
