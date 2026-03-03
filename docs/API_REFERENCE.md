# AgroTrade API Reference

Base URL: `http://localhost:4000/api`

## Auth

All protected endpoints require: `Authorization: Bearer <token>`

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agrotrade.com | admin123 |
| Farmer/Seller | seller1@agrotrade.com | password123 |
| Farmer/Seller | seller2@agrotrade.com | password123 |
| Buyer | buyer@agrotrade.com | password123 |

---

## Auth Module (`/auth`)

### POST /auth/login
- **Auth:** Public
- **Body:** `{ email: string, password: string }`
- **Response:** `{ success: true, access_token: string, refresh_token: string, user: { id, email, name, phoneNumber, role } }`
- **Errors:** 400 Invalid credentials, 400 Account is not active

### POST /auth/register
- **Auth:** Public
- **Body:** `{ email: string, password: string (min 6), name: string, phoneNumber?: string, role: UserRole }`
- **Role values:** `ADMIN | FARMER | BUYER | TRANSPORTER | INSPECTOR`
- **Response:** `{ success: true, message: string, access_token: string, refresh_token: string, user: { id, email, name, phoneNumber, role } }`
- **Errors:** 400 Email already registered

### POST /auth/register/transporter
- **Auth:** Public
- **Body:** `{ email: string, password: string (min 6), name: string, phoneNumber?: string, companyName: string, licenseNumber: string, fleetSize?: number, baseLocation?: string, coordinates?: { lat: number, lng: number }, insuranceProvider?: string, insurancePolicyNumber?: string }`
- **Response:** `{ success: true, message: string, access_token: string, refresh_token: string, user: { id, email, name, phoneNumber, role }, transporter: { companyName, licenseNumber, fleetSize } }`
- **Errors:** 400 Email already registered

### POST /auth/refresh
- **Auth:** Public
- **Body:** `{ refreshToken: string }`
- **Response:** `{ success: true, access_token: string, refresh_token: string }`
- **Errors:** 401 Invalid refresh token

### POST /auth/logout
- **Auth:** JWT
- **Body:** none
- **Response:** `{ success: true, message: string }`

### GET /auth/me
- **Auth:** JWT
- **Response:** `{ id, email, name, phoneNumber, role, createdAt, updatedAt, companyContext, company, bases[] }`

### PATCH /auth/me
- **Auth:** JWT
- **Body:** `{ name?: string, email?: string, phoneNumber?: string }`
- **Response:** `{ success: true, message: string, user: { id, email, name, phoneNumber, role, createdAt, updatedAt } }`
- **Errors:** 409 Email already in use, 409 Phone number already in use

### GET /auth/me/company
- **Auth:** JWT
- **Response:** `{ success: true, company: { id, legalName, registrationNumber?, vatNumber?, phoneNumber?, email?, website?, createdAt, updatedAt } | null }`

### PATCH /auth/me/company
- **Auth:** JWT
- **Body:** `{ legalName?: string, registrationNumber?: string, vatNumber?: string, phoneNumber?: string, email?: string, website?: string }`
- **Response:** `{ success: true, message: string, company: { id, legalName, registrationNumber?, vatNumber?, phoneNumber?, email?, website? } }`

### GET /auth/me/bases
- **Auth:** JWT
- **Response:** `{ success: true, bases: [{ id, label, addressType, street?, cityId?, postalCode?, country?, latitude?, longitude?, isDefault }] }`

### POST /auth/me/bases
- **Auth:** JWT
- **Body:** `{ label: string, addressType: string (WAREHOUSE|FARM|OFFICE|PICKUP|DELIVERY|OTHER), street?: string, cityId?: string, postalCode?: string, country?: string, latitude?: number, longitude?: number, isDefault?: boolean }`
- **Response:** `{ success: true, message: string, base: { id, label, addressType, street?, cityId?, postalCode?, country?, latitude?, longitude?, isDefault } }`
- **Errors:** 400 Invalid addressType

### PATCH /auth/me/bases/:baseId
- **Auth:** JWT
- **Params:** `baseId: string`
- **Body:** Same as POST /auth/me/bases (all fields optional)
- **Response:** `{ success: true, message: string, base: { id, label, addressType, ... } }`
- **Errors:** 404 Base not found, 400 Invalid addressType

### DELETE /auth/me/bases/:baseId
- **Auth:** JWT
- **Params:** `baseId: string`
- **Response:** `{ success: true, message: string }`
- **Errors:** 404 Base not found

### GET /auth/google
- **Auth:** Public
- **Response:** Redirects to Google OAuth flow

### GET /auth/google/callback
- **Auth:** Public (Google OAuth callback)
- **Response:** Redirects to frontend with `?accessToken=...&hasProfile=...&userId=...&userEmail=...&userName=...`

### POST /auth/google/mobile
- **Auth:** Public
- **Body:** `{ code: string (Google ID token), redirectUri: string, role?: string (seller|farmer|buyer|transporter|admin) }`
- **Response:** `{ success: true, access_token: string, refresh_token: string, user: { id, email, name, phoneNumber, role, hasProfile } }`
- **Errors:** 400 Invalid Google token, 400 Failed to authenticate with Google

### POST /auth/google/native
- **Auth:** Public
- **Body:** `{ idToken: string, role?: string, userInfo?: { id, email, name?, givenName?, familyName?, photo? } }`
- **Response:** `{ success: true, access_token: string, refresh_token: string, user: { id, email, name, phoneNumber, role, hasProfile } }`
- **Errors:** 400 Google ID token is required, 400 Invalid Google token

### POST /auth/privy/login
- **Auth:** Public
- **Body:** `{ privyToken: string, role: string, email?: string, name?: string }`
- **Response:** `{ success: true, message: string, access_token: string, refresh_token: string, user: { id, email, name, phoneNumber, role, hasProfile } }`
- **Errors:** 400 Failed to authenticate with Privy

---

## Onboarding Module (`/onboarding`)

### POST /onboarding/seller
- **Auth:** JWT
- **Role:** FARMER
- **Body:**
  ```json
  {
    "farmName": "string?",
    "locationAddress": "string?",
    "locationLat": "number?",
    "locationLng": "number?",
    "businessId": "string?",
    "iban": "string?",
    "certifications": ["string"]?,
    "companyInfo": {
      "companyName": "string",
      "vatNumber": "string?",
      "businessLicense": "string?",
      "companyAddress": { "street?", "city?", "state?", "zip?", "country?" },
      "website": "string?",
      "establishedYear": "number?"
    }?,
    "selectedProducts": [{
      "name": "string?",
      "category": "ProductCategory",
      "quantity": "number",
      "unit": "ProductUnit",
      "pricePerTon": "number?",
      "locationBasedPricing": { "latitude", "longitude", "city?", "country?", "priceRange?" }?,
      "wantCustomOffer": "boolean?"
    }]
  }
  ```
- **Response:** `{ id, email, name, phoneNumber, role, onboardingCompleted }`
- **Errors:** 400 Onboarding is not complete

### POST /onboarding/buyer
- **Auth:** JWT
- **Role:** BUYER
- **Body:**
  ```json
  {
    "companyName": "string?",
    "vatId": "string?",
    "billingAddress": { "street?", "city?", "state?", "zip?", "country?" }?,
    "paymentMethod": { "type?", "details?" }?,
    "companyInfo": { "companyName", "vatNumber?", "businessLicense?", ... }?,
    "requirements": [{
      "category": "ProductCategory",
      "estimatedQuantity": "number",
      "unit": "ProductUnit",
      "preferredLocation": "string?",
      "frequency": "string?"
    }]
  }
  ```
- **Response:** `{ id, email, name, phoneNumber, role, onboardingCompleted }`

### POST /onboarding/transporter
- **Auth:** JWT
- **Role:** TRANSPORTER
- **Body:**
  ```json
  {
    "transportCompanyId": "string?",
    "companyInviteCode": "string?",
    "isIndependent": "boolean?",
    "companyName": "string?",
    "licenseNumber": "string?",
    "baseLocationAddress": "string?",
    "baseLocationLat": "number?",
    "baseLocationLng": "number?",
    "insuranceDocUrl": "string?",
    "iban": "string?",
    "companyInfo": { ... }?,
    "bases": [{ "name", "address", "latitude", "longitude", "isPrimary?" }],
    "fleetVehicles": [{
      "plateNumber", "vehicleType": "TruckType", "capacityKg": "number",
      "year?", "make?", "model?", "fuelType?", "registrationDoc?", "insuranceDoc?", "active?"
    }]
  }
  ```
- **Response:** `{ id, email, name, phoneNumber, role, onboardingCompleted }`

### GET /onboarding/status
- **Auth:** JWT
- **Response:**
  ```json
  {
    "userId": "string",
    "role": "UserRole",
    "isComplete": "boolean",
    "onboardingCompleted": "boolean",
    "missingFields": ["string"],
    "data": {
      "company": { "id", "legalName", "registrationNumber?", "vatNumber?", "phoneNumber?", "email?", "website?" } | null,
      "addresses": [{ "id", "addressType", "label", "street?", "cityId?", "postalCode?", "country?", "latitude?", "longitude?", "isDefault" }],
      "trucks": [{ "id", "plateNumber", "capacity?", "type", "currentLocation?", "latitude?", "longitude?", "isAvailable" }]
    }
  }
  ```

---

## Buyer Module (`/buyer`)

### POST /buyer/listings
- **Auth:** JWT
- **Role:** BUYER
- **Body:**
  ```json
  {
    "productId": "string",
    "quantity": "number (>=0)",
    "unit": "ProductUnit",
    "maxPricePerUnit": "number?",
    "neededBy": "string? (ISO date)",
    "deliveryLocation": { "latitude": "number", "longitude": "number", "city?", "region?", "country?", "address?" },
    "specifications": "object?",
    "notes": "string?",
    "buyerId": "string?",
    "status": "RequestStatus?"
  }
  ```
- **Response:** BuyListingResponseDto `{ id, buyerId, productId, quantity, unit, maxPricePerUnit?, neededBy?, status, notes?, deliveryAddress, product, buyer, specifications, createdAt, updatedAt }`

### GET /buyer/listings
- **Auth:** JWT
- **Query:** `includeTradeOps?: boolean`
- **Response:** `BuyListingResponseDto[]`

### GET /buyer/listings/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Response:** `BuyListingResponseDto`

### PATCH /buyer/listings/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** All fields from CreateBuyListingDto (all optional)
- **Response:** `BuyListingResponseDto`

### PATCH /buyer/listings/:id/status
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ status: RequestStatus (PENDING|ACTIVE|COMPLETED|CANCELLED|EXPIRED) }`
- **Response:** `BuyListingResponseDto`

### DELETE /buyer/listings/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Response:** `BuyListingResponseDto`

### GET /buyer/offers
- **Auth:** JWT
- **Response:** `BuyerOfferSummaryDto[]` — `{ id, buyListingId, tradeOperationId?, price?, quantity?, status, saleListing, product, createdAt, updatedAt }`

### GET /buyer/trades
- **Auth:** JWT
- **Response:** `BuyerOfferSummaryDto[]` (accepted offers only)

### GET /buyer/stats
- **Auth:** JWT
- **Response:** Buyer statistics object

### GET /buyer/timeline
- **Auth:** JWT
- **Query:** `limit?: number (1-50, default 20)`, `cursor?: string`
- **Response:** `{ events: [...], nextCursor?: string }`

---

## Seller Module (`/seller`)

### POST /seller/listings
- **Auth:** JWT
- **Role:** FARMER
- **Body:**
  ```json
  {
    "productId": "string",
    "quantity": "number (>=0)",
    "unit": "string",
    "offerType": "listing | custom-offer",
    "location": { "latitude": "number", "longitude": "number", "city?", "region?", "country?", "address?" },
    "specifications": "object?",
    "priceExpectation": { "min?": "number", "max?": "number", "currency": "string" }?,
    "sellerId": "string?",
    "status": "draft | active | pending | sold | expired"
  }
  ```
- **Response:** `{ success: boolean, message: string, data: SellerListingResponseDto }`

### GET /seller/listings
- **Auth:** JWT
- **Query:** `buyListingId?: string`, `tradeOperationId?: string`
- **Response:** `SellerListingResponseDto[]` — `{ id, sellerId, productId, quantity, unit, askingPrice?, status, product, seller, address, specifications, createdAt, updatedAt }`

### GET /seller/listings/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Response:** `SellerListingResponseDto`

### PATCH /seller/listings/:id/status
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ status: draft | active | pending | sold | expired }`
- **Response:** `SellerListingResponseDto`

### GET /seller/products
- **Auth:** JWT
- **Response:** `SellerProductListingDto[]`

### GET /seller/offers
- **Auth:** JWT
- **Response:** `SellerOffersResponseDto`

### GET /seller/trades
- **Auth:** JWT
- **Response:** Active trades array

### GET /seller/stats
- **Auth:** JWT
- **Response:** `SellerStatsDto`

### GET /seller/timeline
- **Auth:** JWT
- **Query:** `limit?: number (1-50, default 20)`, `cursor?: string`
- **Response:** `SellerTimelineResponseDto { events: [...], nextCursor?: string }`

---

## Products Module (`/products`)

### GET /products/metadata
- **Auth:** Public
- **Response:** `{ data: ProductMetadataDto[] }` — product info with images/descriptions

### GET /products/categories
- **Auth:** Public
- **Response:** `{ data: CategoryMetadataDto[] }` — categories with metadata and product counts

### GET /products
- **Auth:** Public
- **Response:** `{ data: Product[] }`

### GET /products/category/:category
- **Auth:** Public
- **Params:** `category: string`
- **Response:** `{ data: ProductMetadataDto }`

### GET /products/regions
- **Auth:** Public
- **Response:** `{ data: RegionWithCitiesDto[] }`

### GET /products/specifications
- **Auth:** Public
- **Response:** `{ data: SpecificationTypeDto[] }`

### GET /products/:id
- **Auth:** Public
- **Params:** `id: string`
- **Response:** `{ data: ProductMetadataDto }`
- **Errors:** 404 Product not found

---

## Regions Module (`/regions`)

### GET /regions
- **Auth:** Public
- **Response:** Bulgaria NUTS-2 regions with coordinates (cached 1 hour)

### GET /regions/cities
- **Auth:** Public
- **Query:** `regionId?: string`
- **Response:** Cities for specified region (cached 1 hour)

---

## Pricing Module (`/pricing`)

### GET /pricing/location-based
- **Auth:** Public
- **Query:** `productId: string`, `quantity: number`, `latitude: number`, `longitude: number`
- **Response:**
  ```json
  {
    "priceRange": { "min": "number", "max": "number", "currency": "EUR", "confidence": "high|medium|low" },
    "marketData": { "averagePrice": "number", "trend": "rising|stable|falling", "demandLevel": "high|medium|low" }
  }
  ```
- **Errors:** 400 Missing required parameter: productId

---

## Trade Operations Module (`/trade-operations`)

### POST /trade-operations
- **Auth:** JWT
- **Role:** ADMIN
- **Body:**
  ```json
  {
    "buyListingId": "string",
    "adminId": "string?",
    "sellers": [{
      "saleListingId": "string",
      "sellerId": "string",
      "quantity": "number",
      "offerPrice": "number"
    }]
  }
  ```
- **Response:** `{ tradeOperationId, operationNumber, phase, status, negotiations: [{ id, tradeSellerId, saleListingId, sellerId, sellerName, status, offerPrice, quantity, expiresAt, hoursUntilExpiry }] }`
- **Errors:** 400 Buy listing not found, 400 Buy listing is not active

### GET /trade-operations
- **Auth:** JWT
- **Role:** ADMIN
- **Query:** `phase?: TradePhase`, `status?: TradeStatus`, `minProfitMargin?: number`, `buyListingId?: string`, `page?: number (default 1)`, `limit?: number (default 10)`
- **Response:** `{ data: TradeOperation[], total, page, limit }`

### GET /trade-operations/analytics
- **Auth:** JWT
- **Role:** ADMIN
- **Query:** `startDate?: string`, `endDate?: string`
- **Response:** `TradeAnalyticsDto`

### GET /trade-operations/buy-listing/:buyListingId/latest
- **Auth:** JWT
- **Params:** `buyListingId: string`
- **Response:** `{ data: TradeOperation | null }`

### GET /trade-operations/calculate-transport
- **Auth:** JWT
- **Role:** ADMIN
- **Body:**
  ```json
  {
    "sellerIds": ["string"],
    "buyerAddressId": "string?"
  }
  ```
- **Response:** `{ success: true, results: [{ sellerId, transportCost, distanceKm }], totalCost, currency: "EUR", warnings?: string[] }`

### GET /trade-operations/:id
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Response:** `TradeOperationResponseDto { id, phase, status, buyer, sellers, profit, transport, createdAt, updatedAt, expectedDeliveryDate, confirmedAt, completedAt }`
- **Errors:** 404 Trade operation not found

### GET /trade-operations/:id/profit
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Response:** `{ success: true, data: { profitData } }`

### GET /trade-operations/:id/matching-sellers
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Query:** `quality?: PREMIUM|STANDARD|ECONOMY|ANY`
- **Response:** `{ sellers: [...], totalQuantityAvailable, averagePrice, recommendedSellers: [sellerId] }`

### GET /trade-operations/:id/verification-status
- **Auth:** JWT
- **Params:** `id: string`
- **Response:** `{ totalSellers, verifiedSellers, allVerified, pendingInspections: [{ id, saleListingId, sellerId, sellerName, status, priority, requestedDate, scheduledDate }] }`

### PATCH /trade-operations/:id
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Body:** `{ phase?: TradePhase, status?: TradeStatus, sellingPrice?: number, targetProfitMargin?: number (5-20), expectedDeliveryDate?: Date, transportOptimized?: boolean, adminNotes?: string }`
- **Response:** `TradeOperationResponseDto`

### PATCH /trade-operations/:id/phase
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Body:** `{ phase: TradePhase }`
- **Response:** `TradeOperationResponseDto`

### POST /trade-operations/:id/sellers
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Body:** `{ sellers: [{ sellerId, saleListingId, requestedQuantity }] }`
- **Response:** `{ message: string, sellersAdded: TradeSellerDto[] }`

### POST /trade-operations/:id/optimize-transport
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Response:** `{ message: string, ...routeData }`

### POST /trade-operations/:id/finalize
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Body:** `{ actualTransportCost?: number, actualDeliveryDate?: Date, finalNotes?: string }`
- **Response:** `FinalizeTradeResponseDto`
- **Errors:** 400 Cannot finalize trade operation

### POST /trade-operations/:id/cancel
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Body:** `{ reason?: string }`
- **Response:** `{ success: true, message: string, data: { id, operationNumber, status, phase, completedAt } }`

### POST /trade-operations/:id/request-inspections
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Body:** `{ sellerIds: string[], priority?: LOW|MEDIUM|HIGH|URGENT }`
- **Response:** `{ success: true, count: number, inspections: [] }`

---

## Negotiations Module (`/negotiations`)

### GET /negotiations/trade-operation/:tradeOperationId
- **Auth:** JWT
- **Params:** `tradeOperationId: string`
- **Query:** `status?: string (or comma-separated)`, `limit?: number (default 100)`, `offset?: number (default 0)`
- **Response:** `{ success: true, data: { negotiations: [], total, statusBreakdown, priceComparison? } }`

### POST /negotiations/trade-operation/:tradeOperationId
- **Auth:** JWT
- **Params:** `tradeOperationId: string`
- **Body:** `{ tradeSellerId: string, price: number, quantity: number, terms?: string }`
- **Response:** `{ success: true, data: NegotiationWithDetailsDto }`

### GET /negotiations/trade-operations/:tradeOperationId/negotiations
- **Auth:** JWT
- **Params:** `tradeOperationId: string`
- **Query:** `status?: string`, `limit?: number (default 100)`, `offset?: number (default 0)`
- **Response:** `NegotiationSummaryWrapperDto`

### GET /negotiations/trade-operations/:tradeOperationId/negotiations/expiring
- **Auth:** JWT
- **Params:** `tradeOperationId: string`
- **Query:** `hours?: number (default 24)`
- **Response:** `{ success: true, data: { expiringSoon: [{ id, hoursRemaining, urgency: HIGH|MEDIUM|LOW, recommendedAction }], summary: { total, expiringSoon, expired } } }`

### GET /negotiations/trade-operations/:tradeOperationId/negotiations/metrics
- **Auth:** JWT
- **Params:** `tradeOperationId: string`
- **Response:** `{ success: true, data: { totalNegotiations, counterOfferRate, acceptanceAfterCounter, rejectionAfterCounter, averageRounds, averagePriceMovement } }`

### POST /negotiations/trade-operations/:tradeOperationId/offers
- **Auth:** JWT
- **Params:** `tradeOperationId: string`
- **Body:** `{ tradeSellerId: string, price: number, quantity: number, terms?: string }`
- **Response:** `{ success: true, data: NegotiationWithDetailsDto } | { success: false, error: { code, message } }`

### POST /negotiations/trade-operations/:tradeOperationId/offers/batch
- **Auth:** JWT
- **Params:** `tradeOperationId: string`
- **Body:** `{ offers: [{ tradeSellerId, price, quantity, terms? }] }`
- **Response:** `{ success: true, data: { created, failed, negotiations: [], errors: [] } }`

### GET /negotiations/:negotiationId
- **Auth:** JWT
- **Params:** `negotiationId: string`
- **Response:** `NegotiationWithDetailsDto`

### POST /negotiations/:negotiationId/counter
- **Auth:** JWT
- **Params:** `negotiationId: string`
- **Body:** `{ price: number, quantity: number, terms?: string, reason?: string }`
- **Response:** `{ success: true, data: negotiation } | { success: false, error: { code: NEGOTIATION_EXPIRED|COUNTER_FAILED, message } }`

### POST /negotiations/:negotiationId/accept
- **Auth:** JWT
- **Params:** `negotiationId: string`
- **Body:** `{ acceptanceNote?: string }`
- **Response:** `NegotiationWithDetailsDto`

### POST /negotiations/:negotiationId/reject
- **Auth:** JWT
- **Params:** `negotiationId: string`
- **Body:** `{ reason?: string }`
- **Response:** `{ success: true, data: negotiation, cascadeRisk?: { level, message, potentialImpact } } | { success: false, error: { code: REJECT_FAILED, message } }`

### POST /negotiations/:negotiationId/withdraw
- **Auth:** JWT
- **Params:** `negotiationId: string`
- **Body:** `{ reason?: string }`
- **Response:** `{ success: true, data: negotiation } | { success: false, error: { code: WITHDRAW_FAILED, message } }`

### POST /negotiations/:negotiationId/extend
- **Auth:** JWT
- **Params:** `negotiationId: string`
- **Body:** `{ hours: number (>=1), reason?: string }`
- **Response:** `{ success: true, data: { id, previousExpiry, newExpiry, extensionHours, totalExtensions } } | { success: false, error: { code: MAX_EXTENSIONS_REACHED|EXTEND_FAILED, message } }`

---

## Inspections Module (`/inspections`)

### POST /inspections
- **Auth:** JWT
- **Body:** `{ tradeOperationId: string, saleListingId: string, priority?: LOW|MEDIUM|HIGH|URGENT, requestedDate?: string (ISO), notes?: string }`
- **Response:** `InspectionResponseDto { id, status, priority, requestedDate, scheduledDate?, completedDate?, qualityScore?, verificationResult?, notes?, photos?, latitude, longitude, address?, saleListing, inspector, tradeOperation, createdAt, updatedAt }`

### POST /inspections/batch
- **Auth:** JWT
- **Body:** `{ tradeOperationId: string, saleListingIds: string[], priority?: InspectionPriority }`
- **Response:** `InspectionResponseDto[]`

### GET /inspections
- **Auth:** JWT
- **Query:** `status?: InspectionStatus (PENDING|SCHEDULED|IN_PROGRESS|COMPLETED|CANCELLED)`, `priority?: InspectionPriority`, `page?: number (default 1)`, `limit?: number (default 20, max 100)`
- **Response:** `{ data: InspectionResponseDto[], pagination: { page, limit, total, totalPages } }`

### GET /inspections/inspectors
- **Auth:** JWT
- **Response:** `InspectionAssigneeDto[]` — `{ id, name?, email?, activeAssignments?, latitude?, longitude?, city?, region?, lastSeenAt? }`

### GET /inspections/stats
- **Auth:** JWT
- **Response:** `InspectionStatsDto { total, pending, scheduled, inProgress, completed, avgQualityScore }`

### GET /inspections/trade-operation/:tradeOperationId
- **Auth:** JWT
- **Params:** `tradeOperationId: string`
- **Response:** `InspectionResponseDto[]`

### GET /inspections/inspector/:inspectorId
- **Auth:** JWT
- **Params:** `inspectorId: string`
- **Query:** `status?: InspectionStatus`
- **Response:** `InspectorMissionDto[]`

### GET /inspections/inspector/:inspectorId/active
- **Auth:** JWT
- **Params:** `inspectorId: string`
- **Response:** `InspectorMissionDto | null`

### PUT /inspections/:id/assign
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ inspectorId: string }`
- **Response:** `InspectionResponseDto`

### PUT /inspections/:id/status
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ status: InspectionStatus }`
- **Response:** `InspectionResponseDto`

### POST /inspections/:id/results
- **Auth:** JWT
- **Params:** `id: string`
- **Body:**
  ```json
  {
    "qualityScore": "number",
    "verificationResult": {
      "actualQuantity": "number?",
      "actualQuality": "string?",
      "moistureContent": "number?",
      "foreignMatter": "number?",
      "brokenGrains": "number?",
      "discoloration": "boolean?",
      "pestDamage": "boolean?",
      "productSpecifications": { "variety?", "grade?", "origin?", "harvestDate?" }?
    },
    "notes": "string?",
    "photos": ["string"]?,
    "recommendVerification": "boolean"
  }
  ```
- **Response:** `InspectionResponseDto`

### PATCH /inspections/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ status?: InspectionStatus, qualityScore?: number, qualityGrade?: string, notes?: string, photos?: string[] }`
- **Response:** `InspectionResponseDto`

---

## Inspector Module (`/api/inspector`)

### GET /api/inspector/jobs
- **Auth:** JWT
- **Query:** `priority?: LOW|MEDIUM|HIGH`, `status?: PENDING|ASSIGNED|IN_PROGRESS|COMPLETED|FAILED|CANCELLED`, `lat?: number`, `lng?: number`, `radius?: number`
- **Response:** `{ success: true, data: jobs[] } | { success: false, error: string }`

### GET /api/inspector/jobs/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Response:** `{ success: true, data: job } | { success: false, error: string }`

### POST /api/inspector/jobs/:id/accept
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ inspectorId: string, estimatedArrival: string }`
- **Response:** `{ success: true, data: job } | { success: false, error: string }`

### POST /api/inspector/jobs/:id/complete
- **Auth:** JWT
- **Params:** `id: string`
- **Body:**
  ```json
  {
    "jobId": "string",
    "inspectorId": "string",
    "sellerListingId": "string?",
    "originalSpecs": "object",
    "verifiedSpecs": "object",
    "testMethods": [{ "parameter", "method", "equipment", "standardUsed?" }],
    "evidence": [{ "type": "photo|document|video", "url", "caption?", "timestamp" }],
    "notes": "string",
    "verificationStatus": "VERIFIED|PARTIALLY_VERIFIED|FAILED|PENDING_REVIEW",
    "signature": "string?",
    "verifiedAt": "string"
  }
  ```
- **Response:** `{ success: true, data: result } | { success: false, error: string }`

### POST /api/inspector/location
- **Auth:** JWT
- **Body:** `{ inspectorId: string, jobId?: string, coordinates: { latitude, longitude, accuracy, heading?, speed? }, timestamp: string, batteryLevel?: number, networkType?: wifi|cellular|none, isMoving: boolean }`
- **Response:** `{ success: true|false, ... }`

### GET /api/inspector/profile
- **Auth:** JWT
- **Response:** `{ success: true, data: profile } | { success: false, error: string }`

---

## Transport Module (`/transport`)

### POST /transport/estimate
- **Auth:** JWT
- **Role:** ADMIN or TRANSPORTER
- **Body:** `TransportEstimationRequestDto { pickupPoints, deliveryPoint, vehicleType?, urgency?, includeAlternatives? }`
- **Response:** `TransportEstimationResponseDto { totalCost, breakdown, alternatives? }`

### POST /transport/optimize-route
- **Auth:** JWT
- **Role:** ADMIN or TRANSPORTER
- **Body:** `RouteOptimizationRequestDto { warehouseLocation, pickups, deliveryLocation, algorithm?, maxDistance?, maxDuration?, priorityPickupsFirst?, vehicleCapacity? }`
- **Response:** `RouteOptimizationResponseDto { ...routeData, multiTripSuggestion? }`

### GET /transport/settings
- **Auth:** JWT
- **Role:** ADMIN
- **Response:** `{ id, baseRatePerKm, vehicleMultipliers, distanceTiers, loadingCostPerTon, urgencySurcharge, bulkDiscountThreshold, bulkDiscountRate, isActive, effectiveFrom }`

### PUT /transport/settings
- **Auth:** JWT
- **Role:** ADMIN
- **Body:** Transport settings object
- **Response:** `{ message: string, settings: { id, baseRatePerKm, effectiveFrom } }`

### GET /transport/settings/history
- **Auth:** JWT
- **Role:** ADMIN
- **Query:** `limit?: number (default 10)`, `offset?: number (default 0)`
- **Response:** `{ data: settings[], total }`

### POST /transport/settings/compare
- **Auth:** JWT
- **Role:** ADMIN
- **Body:** `{ newSettings: object, sampleRoutes: [{ distance, quantity, vehicleType: TruckType, isUrgent }] }`
- **Response:** Comparison results

### POST /transport/settings/optimize
- **Auth:** JWT
- **Role:** ADMIN
- **Body:** `{ targetMargin, currentAverageMargin, constraints?: { maxBaseRate?, minBulkDiscount?, maxUrgencySurcharge? } }`
- **Response:** `{ message, optimizedSettings, expectedImpact }`

### GET /transport/settings/export
- **Auth:** JWT
- **Role:** ADMIN
- **Response:** `{ data: settingsJson, exportedAt }`

### POST /transport/settings/import
- **Auth:** JWT
- **Role:** ADMIN
- **Body:** Settings JSON object
- **Response:** `{ message, settings: { id, effectiveFrom } }`

### POST /transport/clear-cache
- **Auth:** JWT
- **Role:** ADMIN
- **Response:** `{ message, timestamp }`

### GET /transport/cost-breakdown
- **Auth:** JWT
- **Role:** ADMIN or TRANSPORTER
- **Query:** `distance: number`, `quantity: number`, `vehicleType: TruckType`, `isUrgent?: boolean`
- **Response:** `{ inputs, breakdown, summary: { totalCost, costPerKm, costPerTon } }`
- **Errors:** 400 distance, quantity, and vehicleType are required

### GET /transport/requests/available
- **Auth:** JWT
- **Role:** TRANSPORTER
- **Query:** `radius?: number (km)`, `minWeight?: number`, `maxWeight?: number`
- **Response:** `{ data: TransportRequestDto[] }`

### GET /transport/requests
- **Auth:** JWT
- **Role:** ADMIN
- **Query:** `status?: TransportRequestStatus`, `tradeOperationId?: string`
- **Response:** `{ data: TransportRequestDto[] }`

### POST /transport/requests
- **Auth:** JWT
- **Role:** ADMIN
- **Body:**
  ```json
  {
    "tradeOperationId": "string",
    "pickupLocation": "string",
    "pickupLatitude": "number",
    "pickupLongitude": "number",
    "deliveryLocation": "string",
    "deliveryLatitude": "number",
    "deliveryLongitude": "number",
    "estimatedWeight": "number",
    "estimatedVolume": "number",
    "requiredVehicleType": "string?",
    "pickupDate": "Date",
    "deliveryDate": "Date",
    "specialRequirements": ["string"]?
  }
  ```
- **Response:** `{ data: TransportRequestDto }`

### GET /transport/requests/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Response:** `{ data: TransportRequestDto }`
- **Errors:** 403 Cannot view this transport request (transporter role restriction)

### GET /transport/requests/:id/bids
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Response:** `{ data: TransportBidDto[] }`

### POST /transport/bids
- **Auth:** JWT
- **Role:** TRANSPORTER
- **Body:** `{ transportRequestId: string, bidAmount: number, estimatedDuration: number, vehicleType?: string, notes?: string }`
- **Response:** `{ data: TransportBidDto }`
- **Errors:** 403 Only transporters can submit bids

### PUT /transport/bids/:id
- **Auth:** JWT
- **Role:** TRANSPORTER
- **Params:** `id: string`
- **Body:** `{ bidAmount?: number, estimatedDuration?: number, notes?: string }`
- **Response:** `{ data: TransportBidDto }`

### PUT /transport/bids/:id/withdraw
- **Auth:** JWT
- **Role:** TRANSPORTER
- **Params:** `id: string`
- **Response:** `{ data: TransportBidDto }`

### PUT /transport/bids/:id/accept
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Response:** `{ data: TransportJobDto }`

### PUT /transport/bids/:id/reject
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Body:** `{ reason?: string }` (via @Body("reason"))
- **Response:** `{ data: TransportBidDto }`

### GET /transport/my-bids
- **Auth:** JWT
- **Role:** TRANSPORTER
- **Query:** `status?: BidStatus`
- **Response:** `{ data: TransportBidDto[] }`

### GET /transport/my-jobs
- **Auth:** JWT
- **Role:** TRANSPORTER
- **Query:** `status?: string`
- **Response:** `{ data: TransportJobDto[] }`

### PUT /transport/jobs/:id/start
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ actualPickupTime?: Date, notes?: string }`
- **Response:** `{ data: TransportJobDto }`

### PUT /transport/jobs/:id/pickup
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ pickupPhotos?: string[], pickupNotes?: string, actualWeight?: number }`
- **Response:** `{ data: TransportJobDto }`

### PUT /transport/jobs/:id/deliver
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ deliveryPhotos: string[], deliveryNotes?: string, recipientName: string, recipientSignature?: string }`
- **Response:** `{ data: TransportJobDto }`

### PUT /transport/jobs/:id/location
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ latitude: number, longitude: number, timestamp?: Date }`
- **Response:** `{ data: TransportJobDto }`

### GET /transport/analytics/bid-comparison/:requestId
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `requestId: string`
- **Response:** `{ data: { request: { id, distance?, weight? }, bids: [{ bidId, transporter, bidAmount, estimatedDuration, pricePerKm, pricePerTon, status }], statistics: { totalBids, averagePrice, lowestBid, highestBid } } }`

### GET /transport/analytics/transporter-performance/:transporterId
- **Auth:** JWT
- **Role:** ADMIN or own TRANSPORTER
- **Params:** `transporterId: string`
- **Response:** `{ data: { transporterId, completedJobs, totalJobs, completionRate, onTimeDeliveryRate, recentJobs } }`

### GET /transport/me/analytics
- **Auth:** JWT
- **Role:** TRANSPORTER or ADMIN
- **Response:** `TransporterAnalyticsResponseDto { metrics, recentJobs }`

---

## Transport Bidding Module (`/transport`) — Additional routes from TransportBiddingController

### POST /transport/requests (admin, creates via bidding service)
- **Auth:** JWT
- **Role:** ADMIN
- **Body:**
  ```json
  {
    "tradeOperationId": "string",
    "totalWeight": "number (>=0.1)",
    "requiredVehicleType": "TruckType?",
    "specialRequirements": ["string"]?,
    "pickupWindowStart": "string? (ISO)",
    "pickupWindowEnd": "string? (ISO)",
    "deliveryDeadline": "string? (ISO)",
    "urgencyLevel": "UrgencyLevel?",
    "biddingDeadline": "string (ISO)",
    "maxBudget": "number?"
  }
  ```
- **Response:** `TransportRequestResponseDto`

### POST /transport/requests/auto
- **Auth:** JWT
- **Body:** `{ tradeOperationId: string }`
- **Response:** Auto-created transport request

### GET /transport/requests (ADMIN or TRANSPORTER via bidding service)
- **Auth:** JWT
- **Role:** ADMIN or TRANSPORTER
- **Query:** `status?: TransportRequestStatus`, `urgencyLevel?: UrgencyLevel`, `maxDistance?: number`, `minCapacity?: number`, `limit?: number (default 20)`, `offset?: number (default 0)`
- **Response:** `TransportRequestResponseDto[]`

### POST /transport/bids (via bidding service)
- **Auth:** JWT
- **Role:** TRANSPORTER (Company Admin or Independent)
- **Body:**
  ```json
  {
    "transportRequestId": "string",
    "bidAmount": "number (>=1)",
    "truckCount": "number (1-10)",
    "estimatedDuration": "number hours (1-72)",
    "vehicleType": "TruckType",
    "vehicleCapacity": "number (>=1, tons per truck)",
    "assignedTruckId": "string?",
    "specialEquipment": ["string"]?,
    "insuranceCoverage": "number?",
    "proposedRoute": "any?",
    "pickupSchedule": "any?",
    "expiresAt": "string (ISO)"
  }
  ```
- **Response:** `TransportBidResponseDto`
- **Errors:** 403 User not authorized to submit transport bids

### GET /transport/bids
- **Auth:** JWT
- **Role:** ADMIN or TRANSPORTER
- **Query:** `transportRequestId?: string`, `transporterId?: string`, `status?: BidStatus`, `limit?: number`, `offset?: number`
- **Response:** `TransportBidResponseDto[]`

### POST /transport/bids/:id/accept
- **Auth:** JWT
- **Params:** `id: string`
- **Response:** Job created from accepted bid

### POST /transport/bids/:id/reject
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Body:** `{ reason?: string }` (via @Body("reason"))
- **Response:** Rejected bid

### GET /transport/jobs
- **Auth:** JWT
- **Role:** ADMIN or TRANSPORTER
- **Query:** `transporterId?: string`, `status?: TransportJobStatus`, `limit?: number`, `offset?: number`
- **Response:** `TransportJobResponseDto[]`

### POST /transport/jobs/:id/start
- **Auth:** JWT
- **Role:** TRANSPORTER
- **Params:** `id: string`
- **Response:** Started job

### PUT /transport/jobs/:id/status
- **Auth:** JWT
- **Role:** TRANSPORTER
- **Params:** `id: string`
- **Body:** `{ status: TransportJobStatus, currentLocation?: { lat, lng, address?, timestamp }, estimatedArrival?: string (ISO), notes?: string }`
- **Response:** Updated job

### POST /transport/jobs/:id/pickup
- **Auth:** JWT
- **Role:** TRANSPORTER
- **Params:** `id: string`
- **Body:** `{ sellerId: string, quantityPickedUp: number, pickupPhotos?: string[], notes?: string, completedAt: string (ISO) }`
- **Response:** Updated job

### POST /transport/jobs/:id/delivery
- **Auth:** JWT
- **Role:** TRANSPORTER
- **Params:** `id: string`
- **Body:** `{ deliveryPhotos?: string[], proofOfDelivery?: string, customerRating?: number (1-5), notes?: string, completedAt: string (ISO) }`
- **Response:** Completed job

### GET /transport/requests/:requestId/bids
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `requestId: string`
- **Response:** `TransportBidResponseDto[]`

### GET /transport/trade-operations/:tradeOperationId/transport
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `tradeOperationId: string`
- **Response:** Transport data for trade operation

---

## Transport Company Module (`/transport-company`)

### POST /transport-company/register
- **Auth:** Public
- **Body:**
  ```json
  {
    "companyName": "string (>=2 chars)",
    "registrationNumber": "string (6-20 alphanumeric)",
    "vatNumber": "string? (2 letters + 8-12 digits)",
    "mainEmail": "string (email)",
    "mainPhone": "string (international format)",
    "website": "string?",
    "operatingRegions": ["string"],
    "specializations": ["string"]?,
    "adminName": "string (>=2 chars)",
    "adminEmail": "string (email)",
    "adminPassword": "string (>=8 chars, must contain uppercase/lowercase/digit/special)",
    "adminPhone": "string?"
  }
  ```
- **Response:** Company registration result

### POST /transport-company/verify
- **Auth:** JWT
- **Role:** ADMIN
- **Body:** `{ companyId: string, notes?: string }`
- **Response:** Verified company

### GET /transport-company/unverified
- **Auth:** JWT
- **Role:** ADMIN
- **Response:** Unverified companies list

### GET /transport-company/companies/available
- **Auth:** Public
- **Response:** Available companies transporters can join

### GET /transport-company/transporters/available
- **Auth:** JWT
- **Query:** `searchTerm?: string`, `region?: string`, `onlyAvailable?: boolean`
- **Response:** Available transporters

### GET /transport-company/my-company
- **Auth:** JWT
- **Response:** `{ success: true, data: company } | { success: false, message: string }`

### GET /transport-company/me/fleet
- **Auth:** JWT
- **Response:** `FleetResponseDto`

### GET /transport-company/profile/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Response:** Company profile

### PUT /transport-company/profile/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** Company update fields
- **Response:** `{ success: true, data: company } | { success: false, message: string }`

### GET /transport-company/stats/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Response:** Company stats

### POST /transport-company/:companyId/transporters/link
- **Auth:** JWT
- **Params:** `companyId: string`
- **Body:** `{ transporterId: string, canSubmitBids?: boolean, canManageTrucks?: boolean }`
- **Response:** Link result

### DELETE /transport-company/:companyId/transporters/unlink
- **Auth:** JWT
- **Params:** `companyId: string`
- **Body:** `{ transporterId: string }`
- **Response:** Unlink result

### GET /transport-company/:companyId/transporters
- **Auth:** JWT
- **Params:** `companyId: string`
- **Response:** Company transporters

### POST /transport-company/:companyId/transporters/invite
- **Auth:** JWT
- **Params:** `companyId: string`
- **Body:** `{ email: string, firstName: string, lastName: string, phoneNumber: string, licenseNumber: string, licenseClass?: string[] }`
- **Response:** Invite result

### POST /transport-company/me/trucks
- **Auth:** JWT
- **Body:** `{ licensePlate: string, model: string, capacityTons: number (>=0.1), location?: { lat, lng, address? }, vehicleType?: string }`
- **Response:** Created truck

### PUT /transport-company/me/trucks/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ licensePlate?: string, model?: string, capacityTons?: number, location?: object, vehicleType?: string, status?: available|assigned|maintenance }`
- **Response:** Updated truck

### DELETE /transport-company/me/trucks/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Response:** Deletion result

### POST /transport-company/me/drivers
- **Auth:** JWT
- **Body:** `{ firstName: string, lastName: string, licenseNumber: string, phone: string (international), experienceYears?: number, email?: string, licenseClasses?: string[] }`
- **Response:** Created driver

### PUT /transport-company/me/drivers/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Body:** `{ firstName?, lastName?, licenseNumber?, phone?, experienceYears?, email?, licenseClasses?, status?: available|assigned|offline|on_break }`
- **Response:** Updated driver

### DELETE /transport-company/me/drivers/:id
- **Auth:** JWT
- **Params:** `id: string`
- **Response:** Deletion result

### POST /transport-company/me/trucks/:truckId/assign-driver
- **Auth:** JWT
- **Params:** `truckId: string`
- **Body:** `{ driverId: string }`
- **Response:** Assignment result

### DELETE /transport-company/me/trucks/:truckId/unassign-driver
- **Auth:** JWT
- **Params:** `truckId: string`
- **Response:** Unassignment result

---

## Profit Calculations Module (`/profit`)

### GET /profit/:id/profit
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string` (trade operation ID)
- **Query:** `includeSensitivity?: boolean`, `includeRiskAssessment?: boolean`
- **Response:** `ProfitCalculationResponseDto { tradeOperationId, revenue, costs, profit, status, sensitivity?, riskAssessment? }`

### POST /profit/:id/profit/estimate
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Body:** `{ buyerPrice: number, sellerPrices: [{ sellerId, price, quantity }], transportCost?: number, saveEstimation?: boolean }`
- **Response:** `ProfitEstimationResponseDto`

### GET /profit/:id/profit/history
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Response:** `ProfitHistoryEntryDto[]`

### POST /profit/:id/profit/compare
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Body:** `{ buyerPrice?: number, sellerPrices?: [{ sellerId, price, quantity }], transportCost?: number }`
- **Response:** `{ current: { profit, margin }, proposed: { profit, margin }, profitDifference, marginDifference, trend: INCREASE|DECREASE|NO_CHANGE }`

### POST /profit/profit/compare-scenarios
- **Auth:** JWT
- **Role:** ADMIN
- **Body:** `ProfitEstimationResponseDto[]`
- **Response:** `ProfitScenarioComparisonDto { ...comparison, recommendation }`

### GET /profit/:id/profit/impact/:offerId
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`, `offerId: string`
- **Query:** `offerPrice: number`, `offerQuantity: number`, `offerType: BUYER|SELLER`
- **Response:** `ProfitImpactResponseDto { offerId, offerType, offerPrice, offerQuantity, ...impactData, recommendation }`
- **Errors:** 400 offerPrice, offerQuantity, and offerType are required

### GET /profit/:id/profit/validation
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `id: string`
- **Response:** `ProfitValidationDto { isValid, currentMargin, minimumMargin: 5, targetMargin: 7, warnings, recommendations, breakdown: { revenue, purchaseCosts, transportCosts, netProfit } }`

### GET /profit/:tradeOperationId/calculate
- **Auth:** JWT
- **Params:** `tradeOperationId: string`
- **Response:** `{ profit: { grossProfit, netProfit, profitMargin }, breakdown: { revenue, purchaseCosts, transportCosts, commissionCosts } }`

### POST /profit/:tradeOperationId/impact
- **Auth:** JWT
- **Params:** `tradeOperationId: string`
- **Body:** `{ newPrice: number, quantity: number, offerType: BUYER|SELLER }`
- **Response:** Profit impact analysis

### POST /profit/:tradeOperationId/optimize
- **Auth:** JWT
- **Params:** `tradeOperationId: string`
- **Body:** `{ targetMargin: number, constraints?: { maxBuyerPrice?, minSellerPrice?, maxTransportCost? } }`
- **Response:** `{ optimizedPrices: { buyerPrice, sellerPrices }, expectedProfit, expectedMargin, feasible }`

### POST /profit/validate-margins
- **Auth:** JWT
- **Body:** `{ operations: [{ tradeOperationId, sellingPrice, purchasePrice, transportCost, quantity }] }`
- **Response:** `{ validations: [{ tradeOperationId, isViable, profitMargin, profit, meetsMinimum, meetsTarget }], summary: { totalViable, totalOperations, averageMargin } }`

### GET /profit/cumulative
- **Auth:** JWT
- **Query:** `startDate?: string`, `endDate?: string`
- **Response:** `{ totalRevenue, totalCosts, totalProfit, averageMargin, operationCount, breakdown, period }`

### POST /profit/forecast
- **Auth:** JWT
- **Body:** `{ expectedOperations: [{ product, expectedQuantity, expectedBuyerPrice, expectedSellerPrice, estimatedTransportCost }], period: string }`
- **Response:** `{ forecastedProfit, forecastedMargin, confidence, period, breakdown }`

### GET /profit/benchmarks
- **Auth:** JWT
- **Response:** `{ minimumMargin: 5, targetMargin: 7, optimalMargin: 10, industryAverage: 8.5, currentPerformance: { averageMargin, trend, comparisonToIndustry } }`

---

## Price Scenarios Module (`/scenarios`)

### POST /scenarios/generate
- **Auth:** JWT
- **Role:** ADMIN
- **Body:** `ScenarioGenerationRequestDto { tradeOperationId, scenarioCount?, includeQualityFactors?, includeTransportVariations? }`
- **Response:** `ScenarioAnalysisResponseDto { scenarios: PriceScenarioDto[], optimal, recommendations }`

### POST /scenarios/sensitivity-analysis
- **Auth:** JWT
- **Role:** ADMIN
- **Body:** `{ tradeOperationId: string, baseSellerPrices: [...] }`
- **Response:** `{ ...analysis, analysis: { optimalRange, riskZones } }`

### POST /scenarios/compare-strategies
- **Auth:** JWT
- **Role:** ADMIN
- **Body:** `{ tradeOperationId: string, strategies: [...] }`
- **Response:** `{ ...comparison, insights }`

### POST /scenarios/quick-estimate
- **Auth:** JWT
- **Role:** ADMIN
- **Body:** `{ buyerPrice: number, avgSellerPrice: number, quantity: number, transportDistance?: number }`
- **Response:** `{ revenue, purchaseCost, transportCost, estimatedProfit, profitMargin, isViable, priceGuidance: { minSellerPrice, maxSellerPrice, targetSellerPrice } }`

### GET /scenarios/:tradeOperationId/scenarios
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `tradeOperationId: string`
- **Query:** `viability?: HIGH|MEDIUM|LOW|UNVIABLE`, `limit?: number (default 10)`
- **Response:** `{ tradeOperationId, scenarios: PriceScenarioDto[], total }`

### GET /scenarios/:tradeOperationId/optimal
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `tradeOperationId: string`
- **Response:** `{ optimal, reasoning, alternativeCount, betterThanOptimal }`

### POST /scenarios/:tradeOperationId/apply-scenario
- **Auth:** JWT
- **Role:** ADMIN
- **Params:** `tradeOperationId: string`
- **Body:** Scenario data
- **Response:** Applied scenario result

---

## Notifications Module (`/notifications`)

### GET /notifications
- **Auth:** JWT
- **Query:** `role?: UserRole`, `tradeOperationId?: string`, `limit?: number`
- **Response:** Notifications list

### POST /notifications/mark-read
- **Auth:** JWT
- **Body:** `{ notificationIds: string[] }`
- **Response:** `{ success: true, message: string }`

### POST /notifications/test
- **Auth:** JWT
- **Body:** `{ type: inspection|replacement|update, tradeOperationId?: string }`
- **Response:** `{ success: true, message: string }`

---

## Simulation Module (`/simulation`) — Admin Only

All endpoints require: **Auth:** JWT, **Role:** ADMIN

### GET /simulation/users/:role
- **Params:** `role: UserRole`
- **Response:** Users list by role

### GET /simulation/trade-operation/:id/full-state
- **Params:** `id: string`
- **Response:** Full trade operation state

### POST /simulation/users/create-test-user
- **Body:** `{ role: UserRole, name?: string, data?: object }`
- **Response:** Created test user

### POST /simulation/buyer/:userId/create-listing
- **Params:** `userId: string`
- **Body:** `{ productId, quantity, unit?, maxPricePerUnit?, neededBy? }`
- **Response:** Created buy listing

### POST /simulation/seller/:userId/accept-offer
- **Params:** `userId: string`
- **Body:** `{ negotiationId: string }`
- **Response:** `{ success: true, message: string }`

### POST /simulation/seller/:userId/counter-offer
- **Params:** `userId: string`
- **Body:** `{ negotiationId: string, counterPrice: number, counterQuantity?: number }`
- **Response:** `{ success: true, message: string }`

### POST /simulation/seller/:userId/reject-offer
- **Params:** `userId: string`
- **Body:** `{ negotiationId: string, reason?: string }`
- **Response:** `{ success: true, message: string }`

### POST /simulation/transporter/:userId/submit-bid
- **Params:** `userId: string`
- **Body:** `{ transportRequestId, bidAmount, estimatedDuration, vehicleType?, vehicleCapacity? }`
- **Response:** Created bid

### POST /simulation/transporter/:userId/start-job
- **Params:** `userId: string`
- **Body:** `{ jobId: string }`
- **Response:** `{ success: true, message: string }`

### POST /simulation/transporter/:userId/complete-delivery
- **Params:** `userId: string`
- **Body:** `{ jobId: string, deliveryNotes?: string }`
- **Response:** `{ success: true, message: string }`

### POST /simulation/inspector/:userId/accept-job
- **Params:** `userId: string`
- **Body:** `{ inspectionId: string }`
- **Response:** `{ success: true, message: string }`

### POST /simulation/inspector/:userId/submit-results
- **Params:** `userId: string`
- **Body:** `{ inspectionId, qualityScore, result: PASSED|FAILED, notes? }`
- **Response:** `{ success: true, message: string }`

### POST /simulation/admin/farmer/:farmerId/create-sale-listing
- **Params:** `farmerId: string`
- **Body:** `{ productCategory, quantity, pricePerUnit, latitude?, longitude? }`
- **Response:** Created sale listing

### POST /simulation/admin/create-trade-operation
- **Body:** `{ buyListingId, adminMargin, buyerCommission, sellerCommission }`
- **Response:** Created trade operation

### POST /simulation/admin/send-offers
- **Body:** `{ tradeOperationId, offers: [{ farmerId, saleListingId, requestedQuantity, offeredPrice }] }`
- **Response:** Sent offers

### POST /simulation/admin/accept-counter-offer
- **Body:** `{ negotiationId: string }`
- **Response:** Accepted counter-offer

### POST /simulation/admin/assign-inspector
- **Body:** `{ tradeOperationId: string, inspectorId: string }`
- **Response:** Inspector assigned

### POST /simulation/admin/create-transport
- **Body:** `{ tradeOperationId, transporterId, pickupLat, pickupLng, deliveryLat, deliveryLng, bidAmount, estimatedDuration }`
- **Response:** Created and accepted transport bid

### POST /simulation/admin/complete-trade
- **Body:** `{ tradeOperationId: string }`
- **Response:** Completed trade

### POST /simulation/admin/create-transport-request
- **Body:** `{ tradeOperationId, pickupLat, pickupLng, deliveryLat, deliveryLng, distanceKm? }`
- **Response:** Created transport request

### POST /simulation/admin/select-transport-bid
- **Body:** `{ transportRequestId: string, bidId: string }`
- **Response:** Selected bid result

### POST /simulation/admin/update-pricing
- **Body:** `{ negotiationId: string, newPrice: number, reason?: string }`
- **Response:** Updated pricing

### DELETE /simulation/admin/cleanup-test-data
- **Response:** Cleanup result

---

## Enum Reference

### UserRole
`ADMIN | FARMER | BUYER | TRANSPORTER | INSPECTOR`

### TradePhase
`SELLER_NEGOTIATION | INSPECTION | TRANSPORT_MATCHING | TRANSPORT | DELIVERED | COMPLETED | CANCELLED`

### TradeStatus
`ACTIVE | COMPLETED | CANCELLED | ON_HOLD`

### InspectionStatus
`PENDING | SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED`

### InspectionPriority
`LOW | MEDIUM | HIGH | URGENT`

### TransportRequestStatus
`OPEN | AWARDED | IN_PROGRESS | COMPLETED | CANCELLED`

### BidStatus
`PENDING | ACCEPTED | REJECTED | WITHDRAWN | EXPIRED`

### TransportJobStatus
`PENDING | IN_TRANSIT | COMPLETED | CANCELLED`

### TruckType
`FLATBED | REFRIGERATED | TANKER | CONTAINER | CURTAIN_SIDE | BOX_TRUCK | OTHER`

### UrgencyLevel
`LOW | MEDIUM | HIGH | URGENT`

### ProductUnit
`KG | TON | LITER | PIECE | BOX | PALLET`

### RequestStatus
`PENDING | ACTIVE | COMPLETED | CANCELLED | EXPIRED`

### AddressType
`WAREHOUSE | FARM | OFFICE | PICKUP | DELIVERY | OTHER`
