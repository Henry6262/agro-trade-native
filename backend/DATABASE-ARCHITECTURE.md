# Agro-Trade Database Architecture

## Overview

Agro-Trade operates as a **mediator platform** connecting agricultural sellers and buyers. The platform facilitates price discovery and matching based on product specifications.

### Key Actors

1. **Sellers (Farmers)** - List what they have available
2. **Buyers** - Specify requirements for what they need
3. **Platform (Mediator)** - Matches sellers with buyers, creates custom offers

## Core Business Logic

### Seller Flow
1. Farmer creates a listing with product details (no strict requirements)
2. Provides specifications they know (moisture, protein, etc.)
3. Platform reviews listing against buyer requirements
4. Platform creates custom offers based on market demand

### Buyer Flow
1. Buyer specifies product requirements (strict specifications)
2. Sets acceptable ranges for quality parameters
3. Platform matches available listings to requirements
4. Platform negotiates pricing based on quality match

### Platform Role (Mediator)
- Maintains product specification templates
- Matches seller listings with buyer requirements
- Creates custom pricing based on quality parameters
- Facilitates transactions between parties

## Database Structure

### 1. Regional Hierarchy

```
Region (Country Level)
  └── City
       └── Product Listings (Seller Location)
       └── Buyer Requirements (Delivery Location)
```

#### Tables

**regions**
- Represents major agricultural regions (e.g., Northwestern Bulgaria)
- Groups cities for regional price trends

**cities**
- Individual cities within regions
- Used for precise location and logistics

### 2. Product Specification System

The system uses a **flexible specification framework** that allows different products to have different quality parameters.

#### Core Tables

**products**
- Master product catalog (Wheat, Corn, Sunflower, etc.)
- Defines what CAN be traded on the platform

**specification_types**
- All possible quality parameters (moisture, protein, oil content, etc.)
- Reusable across different products
- Includes units and validation rules

**product_specifications**
- Links products to their relevant specifications
- Defines which specs are important for each product
- Sets standard/premium thresholds

### 3. Two-Sided Marketplace

#### Seller Side

**product_listings**
- What sellers have available
- No mandatory fields (sellers provide what they know)
- Flexible quality specifications

**listing_specifications**
- Actual quality values for each listing
- Only includes specs the seller can provide
- Used for quality-based pricing

#### Buyer Side

**buyer_requirements**
- What buyers are looking for
- Strict specification requirements
- Acceptable quality ranges

**requirement_specifications**
- Required quality parameters
- Minimum/maximum acceptable values
- Price adjustments for quality variations

### 4. Matching & Offers

**offers**
- Platform-generated custom offers
- Links seller listings to buyer requirements
- Includes price calculation based on quality match

## Detailed Schema

### Location Tables

```prisma
model Region {
  id        String   @id
  name      String   // Northwestern, North Central, etc.
  country   String   // Bulgaria, Greece
  isActive  Boolean  @default(true)
  
  cities    City[]
  
  @@map("regions")
}

model City {
  id        String   @id
  name      String   // Sofia, Plovdiv, Varna
  regionId  String
  region    Region   @relation(...)
  
  // Locations for listings and requirements
  listings      ProductListing[]
  requirements  BuyerRequirement[]
  
  @@map("cities")
}
```

### Product Definition Tables

```prisma
model Product {
  id          String   @id
  category    ProductCategory  // WHEAT, CORN, SUNFLOWER, etc.
  name        String           // Internal name
  displayName String           // UI display name
  description String?
  
  // What specifications are relevant for this product
  specifications ProductSpecification[]
  
  // Marketplace activity
  listings      ProductListing[]
  requirements  BuyerRequirement[]
  
  @@map("products")
}

model SpecificationType {
  id          String   @id
  code        String   @unique  // moisture, protein, oil_content
  name        String            // Moisture Content
  unit        String?           // %, kg/hl, ppm
  dataType    DataType         // NUMBER, TEXT, BOOLEAN
  
  // Validation
  minValue    Float?
  maxValue    Float?
  
  // Used in specifications
  productSpecs  ProductSpecification[]
  listingSpecs  ListingSpecification[]
  requirementSpecs RequirementSpecification[]
  
  @@map("specification_types")
}

model ProductSpecification {
  id            String   @id
  
  productId     String
  product       Product  @relation(...)
  
  specTypeId    String
  specificationType SpecificationType @relation(...)
  
  // How important is this spec for this product?
  importance    Importance  // CRITICAL, IMPORTANT, OPTIONAL
  
  // Standard market values
  standardMin   Float?   // Industry standard minimum
  standardMax   Float?   // Industry standard maximum
  premiumMin    Float?   // Premium grade threshold
  
  displayOrder  Int      // Order in UI forms
  
  @@unique([productId, specTypeId])
  @@map("product_specifications")
}
```

### Seller Tables (Supply Side)

```prisma
model ProductListing {
  id            String   @id
  
  // What product is being sold
  productId     String
  product       Product  @relation(...)
  
  // Who is selling
  farmerId      String
  farmer        User     @relation(...)
  
  // Where is it located
  cityId        String?
  city          City?    @relation(...)
  address       String?
  latitude      Float?
  longitude     Float?
  
  // Basic listing info
  title         String
  description   String?
  quantity      Decimal    // Available amount
  unit          ProductUnit // TON, KG
  
  // Seller's asking price (optional)
  askingPrice   Decimal?
  
  // Harvest/production info
  harvestDate   DateTime?
  
  // Quality specifications (what seller knows)
  specifications ListingSpecification[]
  
  // Platform-calculated quality score
  qualityScore   Int?     // 0-100 based on provided specs
  
  // Status
  status        ListingStatus  // ACTIVE, SOLD, EXPIRED
  
  // Offers made for this listing
  offers        Offer[]
  
  @@map("product_listings")
}

model ListingSpecification {
  id          String   @id
  
  listingId   String
  listing     ProductListing @relation(...)
  
  specTypeId  String
  specificationType SpecificationType @relation(...)
  
  // Actual value provided by seller
  value       Float?    // For numeric specs
  textValue   String?   // For text specs
  
  // Platform assessment
  qualityImpact QualityImpact? // POSITIVE, NEUTRAL, NEGATIVE
  
  @@unique([listingId, specTypeId])
  @@map("listing_specifications")
}
```

### Buyer Tables (Demand Side)

```prisma
model BuyerRequirement {
  id            String   @id
  
  // What product is needed
  productId     String
  product       Product  @relation(...)
  
  // Who is buying
  buyerId       String
  buyer         User     @relation(...)
  
  // Where should it be delivered
  cityId        String?
  city          City?    @relation(...)
  deliveryAddress String?
  
  // Purchase details
  title         String
  description   String?
  quantity      Decimal    // Needed amount
  unit          ProductUnit
  
  // Budget
  maxPricePerUnit Decimal?
  
  // When needed
  neededBy      DateTime?
  
  // Required specifications
  specifications RequirementSpecification[]
  
  // Status
  status        RequirementStatus // ACTIVE, FULFILLED, CANCELLED
  
  // Offers received for this requirement
  offers        Offer[]
  
  @@map("buyer_requirements")
}

model RequirementSpecification {
  id            String   @id
  
  requirementId String
  requirement   BuyerRequirement @relation(...)
  
  specTypeId    String
  specificationType SpecificationType @relation(...)
  
  // Required range
  minValue      Float?
  maxValue      Float?
  exactValue    Float?
  
  // How strict is this requirement
  strictness    Strictness // MANDATORY, PREFERRED, OPTIONAL
  
  // Price impact for variations
  priceAdjustmentPerUnit Decimal? // Per % deviation
  
  @@unique([requirementId, specTypeId])
  @@map("requirement_specifications")
}
```

### Matching & Offers

```prisma
model Offer {
  id            String   @id
  
  // Linking supply and demand
  listingId     String?
  listing       ProductListing? @relation(...)
  
  requirementId String?
  requirement   BuyerRequirement? @relation(...)
  
  // Offer details
  offeredPrice  Decimal
  quantity      Decimal
  
  // Quality match score
  matchScore    Int      // 0-100 based on spec alignment
  
  // Price adjustments
  basePrice     Decimal
  qualityAdjustment Decimal?
  quantityDiscount Decimal?
  finalPrice    Decimal
  
  // Offer status
  status        OfferStatus // PENDING, ACCEPTED, REJECTED, EXPIRED
  expiresAt     DateTime
  
  // Who created the offer
  createdBy     OfferCreator // PLATFORM, SELLER, BUYER
  
  @@map("offers")
}
```

### Enums

```prisma
enum ProductCategory {
  SOFT_WHEAT      // Pastry/cake flour grade
  DURUM_WHEAT     // Pasta production grade
  CORN_MAIZE      // Feed and processing
  BARLEY          // Malting and feed
  OATS            // Milling and feed
  SUNFLOWER       // High oleic oil production
  RAPESEED        // Oil and biodiesel
  PEAS            // Food and feed grade
  SOYBEAN_MEAL    // High protein feed
  WHEAT_BRAN      // Animal feed
  ALFALFA         // Livestock feed
  OTHER           // Various cereals & oilseeds
}

enum DataType {
  NUMBER
  TEXT
  BOOLEAN
  ENUM
}

enum Importance {
  CRITICAL    // Must have for this product type
  IMPORTANT   // Should have for pricing
  OPTIONAL    // Nice to have
}

enum QualityImpact {
  POSITIVE    // Better than standard
  NEUTRAL     // Within standard range
  NEGATIVE    // Below standard
}

enum Strictness {
  MANDATORY   // Must meet requirement
  PREFERRED   // Should meet, but flexible
  OPTIONAL    // Nice to have
}

enum OfferCreator {
  PLATFORM    // Auto-generated by matching algorithm
  SELLER      // Direct offer from seller
  BUYER       // Counter-offer from buyer
}
```

## Example Data Setup

### 1. Soft Wheat Product Setup

```javascript
// Create the product
const softWheat = {
  category: 'SOFT_WHEAT',
  name: 'soft_wheat',
  displayName: 'Soft Wheat (Pastry/Cake Grade)'
}

// Define relevant specifications
const wheatSpecs = [
  { 
    specType: 'moisture',
    importance: 'CRITICAL',
    standardMax: 14,  // 14% max moisture
  },
  {
    specType: 'protein',
    importance: 'CRITICAL', 
    standardMin: 10,
    standardMax: 12,  // 10-12% protein for pastry
  },
  {
    specType: 'test_weight',
    importance: 'IMPORTANT',
    standardMin: 76,  // 76 kg/hl minimum
  },
  {
    specType: 'falling_number',
    importance: 'OPTIONAL',
    standardMin: 250, // 250 seconds minimum
  }
]
```

### 2. Seller Creates Listing

```javascript
// Farmer creates a listing (provides what they know)
const listing = {
  product: 'SOFT_WHEAT',
  title: 'Premium Soft Wheat - 2024 Harvest',
  quantity: 500,
  unit: 'TON',
  city: 'Plovdiv',
  
  // Seller provides some specs (not all required)
  specifications: [
    { type: 'moisture', value: 13.5 },    // Good
    { type: 'protein', value: 11.2 },     // Within range
    { type: 'test_weight', value: 78 },   // Above standard
    // Falling number not provided
  ]
}
```

### 3. Buyer Creates Requirement

```javascript
// Buyer specifies what they need
const requirement = {
  product: 'SOFT_WHEAT',
  title: 'Need Soft Wheat for Pastry Production',
  quantity: 300,
  unit: 'TON',
  city: 'Sofia',
  maxPricePerUnit: 280,
  
  // Buyer's strict requirements
  specifications: [
    { 
      type: 'moisture',
      maxValue: 14,
      strictness: 'MANDATORY'
    },
    {
      type: 'protein',
      minValue: 10,
      maxValue: 12,
      strictness: 'MANDATORY'
    },
    {
      type: 'test_weight',
      minValue: 75,
      strictness: 'PREFERRED',
      priceAdjustment: 2  // €2/ton per kg/hl above 75
    }
  ]
}
```

### 4. Platform Creates Offer

```javascript
// Platform matches and creates custom offer
const offer = {
  listing: listing.id,
  requirement: requirement.id,
  
  matchScore: 95,  // High match
  
  basePrice: 275,
  qualityAdjustment: +6,  // Premium for test_weight
  quantityDiscount: 0,
  finalPrice: 281,
  
  quantity: 300,  // What buyer needs
  status: 'PENDING',
  createdBy: 'PLATFORM'
}
```

## Implementation Priority

### Phase 1: Core Structure
1. Implement region/city hierarchy
2. Set up products and specification types
3. Create product specifications mapping

### Phase 2: Marketplace
1. Implement seller listings with flexible specs
2. Implement buyer requirements with strict specs
3. Basic matching algorithm

### Phase 3: Offers & Pricing
1. Platform offer generation
2. Quality-based pricing adjustments
3. Offer negotiation workflow

### Phase 4: Analytics
1. Price trends by region/city
2. Quality distribution analytics
3. Supply/demand matching metrics

## Benefits of This Architecture

1. **Flexibility**: Sellers provide what they know, buyers specify what they need
2. **Scalability**: Easy to add new products and specifications
3. **Market Intelligence**: Platform learns optimal pricing from transactions
4. **Quality Transparency**: Clear quality-to-price relationships
5. **Regional Insights**: Price variations by location
6. **Automated Matching**: Platform can auto-generate offers

## Next Steps

1. Review and approve this architecture
2. Implement the schema changes
3. Create seed data for all 12 product categories
4. Build matching algorithm
5. Develop pricing engine