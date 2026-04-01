-- =============================================================================
-- Migration: 20250900000000_add_core_trade_schema
-- Purpose  : Create all core trade-related tables and enums that were missing
--            from the migration history. This unblocks the subsequent
--            20260310100000_add_trade_events migration which requires
--            the "trade_operations" table to exist.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extend existing enums (idempotent via IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COMPANY_ADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'INSPECTOR';

ALTER TYPE "TruckType" ADD VALUE IF NOT EXISTS 'REFRIGERATED';
ALTER TYPE "TruckType" ADD VALUE IF NOT EXISTS 'CONTAINER';
ALTER TYPE "TruckType" ADD VALUE IF NOT EXISTS 'CURTAIN_SIDE';
ALTER TYPE "TruckType" ADD VALUE IF NOT EXISTS 'BOX_TRUCK';

ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'SOFT_WHEAT';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'DURUM_WHEAT';
ALTER TYPE "ProductCategory" ADD VALUE IF NOT EXISTS 'CORN_MAIZE';

ALTER TYPE "ProductUnit" ADD VALUE IF NOT EXISTS 'LITER';
ALTER TYPE "ProductUnit" ADD VALUE IF NOT EXISTS 'PIECE';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create new enums (idempotent via exception handling)
-- ─────────────────────────────────────────────────────────────────────────────

-- NegotiationStatus is created in 20250101000000_add_negotiation_enhancements
-- which runs first. Ensure it exists here as a safety fallback.
DO $$ BEGIN
  CREATE TYPE "NegotiationStatus" AS ENUM (
    'PENDING','ACCEPTED','REJECTED','COUNTERED','EXPIRED','WITHDRAWN'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AddressType" AS ENUM (
    'BILLING','SHIPPING','FARM','WAREHOUSE','OFFICE','PICKUP','DELIVERY','OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DataType" AS ENUM ('NUMBER','TEXT','BOOLEAN','ENUM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Importance" AS ENUM ('CRITICAL','IMPORTANT','OPTIONAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "QualityImpact" AS ENUM ('POSITIVE','NEUTRAL','NEGATIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Strictness" AS ENUM ('MANDATORY','PREFERRED','OPTIONAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ListingStatus" AS ENUM (
    'ACTIVE','SOLD','PENDING','EXPIRED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "RequestStatus" AS ENUM (
    'ACTIVE','FULFILLED','PARTIALLY_FULFILLED','EXPIRED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OfferStatus" AS ENUM (
    'PENDING','ACCEPTED','REJECTED','EXPIRED','WITHDRAWN','NEGOTIATING'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OfferCreator" AS ENUM ('PLATFORM','SELLER','BUYER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TradePhase" AS ENUM (
    'INITIATION','SELLER_MATCHING','SELLER_NEGOTIATION','INSPECTION_PENDING',
    'TRANSPORT_MATCHING','TRANSPORT_BIDDING','IN_TRANSIT','DELIVERED',
    'COMPLETED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TradeStatus" AS ENUM (
    'ACTIVE','ON_HOLD','COMPLETED','CANCELLED','DISPUTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SellerStatus" AS ENUM (
    'INVITED','NEGOTIATING','ACCEPTED','REJECTED','CONFIRMED','WITHDRAWN','FAILED_INSPECTION'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TransporterStatus" AS ENUM (
    'INVITED','BIDDING','SELECTED','CONFIRMED','IN_TRANSIT','DELIVERED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OfferParty" AS ENUM ('BUYER','SELLER','PLATFORM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OfferResponse" AS ENUM ('ACCEPTED','REJECTED','COUNTERED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "InspectionPriority" AS ENUM ('LOW','MEDIUM','HIGH','URGENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "InspectionStatus" AS ENUM (
    'PENDING','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "BidStatus" AS ENUM (
    'PENDING','ACCEPTED','REJECTED','EXPIRED','WITHDRAWN'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TransportRequestStatus" AS ENUM (
    'OPEN','BIDDING','EVALUATING','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UrgencyLevel" AS ENUM ('STANDARD','URGENT','EXPRESS','EMERGENCY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TransportJobStatus" AS ENUM (
    'ASSIGNED','STARTED','PICKING_UP','IN_TRANSIT','DELIVERING',
    'COMPLETED','DELAYED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyType" AS ENUM ('INTERNAL','EXTERNAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DriverType" AS ENUM ('INTERNAL','EXTERNAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AdminLevel" AS ENUM ('OWNER','MANAGER','DISPATCHER','VIEWER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "OwnerType" AS ENUM ('AGROTRADE','COMPANY','INDIVIDUAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DriverStatus" AS ENUM (
    'OFFLINE','AVAILABLE','ON_BREAK','ASSIGNED','EN_ROUTE',
    'AT_PICKUP','IN_TRANSIT','AT_DELIVERY','COMPLETED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CompanyDocumentType" AS ENUM (
    'REGISTRATION_CERTIFICATE','OPERATING_LICENSE','INSURANCE_CERTIFICATE',
    'TAX_CERTIFICATE','SAFETY_CERTIFICATE','OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DriverDocumentType" AS ENUM (
    'DRIVING_LICENSE','MEDICAL_CERTIFICATE','TRAINING_CERTIFICATE',
    'IDENTITY_CARD','OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Update existing tables: add missing columns to "users"
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "password"              TEXT,
  ADD COLUMN IF NOT EXISTS "phone_number"          VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "is_active"             BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "is_email_verified"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "is_phone_verified"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "onboarding_completed"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "last_login"            TIMESTAMP(3);

-- Unique constraint on phone_number (safe, only adds if absent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_phone_number_key' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_phone_number_key" UNIQUE ("phone_number");
  END IF;
END $$;

-- Unique index on email (already exists from init, but ensure it)
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Recreate "products" to match current Prisma schema (Product catalogue)
--    The old products table (from 20250826090045) has a per-farmer listing
--    structure that conflicts with the current model.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS "products" CASCADE;

CREATE TABLE "products" (
    "id"                       TEXT          NOT NULL,
    "category"                 "ProductCategory" NOT NULL,
    "name"                     TEXT          NOT NULL,
    "display_name"             TEXT          NOT NULL,
    "description"              TEXT,
    "image"                    TEXT,
    "harvest_season"           TEXT,
    "storage_recommendations"  TEXT,
    "price_range_min"          DECIMAL(10,2),
    "price_range_max"          DECIMAL(10,2),
    "default_unit"             "ProductUnit" NOT NULL DEFAULT 'TON',
    "is_active"                BOOLEAN       NOT NULL DEFAULT true,
    "sort_order"               INTEGER,
    "created_at"               TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"               TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "products_category_key" ON "products"("category");
CREATE UNIQUE INDEX "products_name_key"     ON "products"("name");
CREATE INDEX "products_category_idx"        ON "products"("category");
CREATE INDEX "products_is_active_idx"       ON "products"("is_active");

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Recreate "trucks" to match current Prisma schema
--    The old trucks table from the init migration has incompatible columns.
-- ─────────────────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS "trucks" CASCADE;

-- Will be recreated with full FK constraints after dependent tables are created.
-- Placeholder created here so FK references from other tables can succeed.
CREATE TABLE "trucks" (
    "id"                   TEXT           NOT NULL,
    "owner_id"             TEXT           NOT NULL,
    "owner_type"           "OwnerType"    NOT NULL DEFAULT 'INDIVIDUAL',
    "transport_company_id" TEXT,
    "current_driver_id"    TEXT,
    "plate_number"         TEXT           NOT NULL,
    "capacity"             DOUBLE PRECISION NOT NULL,
    "unit"                 "ProductUnit"  NOT NULL DEFAULT 'TON',
    "type"                 "TruckType"    NOT NULL,
    "current_location"     TEXT,
    "latitude"             DOUBLE PRECISION,
    "longitude"            DOUBLE PRECISION,
    "is_available"         BOOLEAN        NOT NULL DEFAULT true,
    "created_at"           TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trucks_pkey"              PRIMARY KEY ("id"),
    CONSTRAINT "trucks_plate_number_key"  UNIQUE ("plate_number"),
    CONSTRAINT "trucks_current_driver_id_key" UNIQUE ("current_driver_id")
);

CREATE INDEX "trucks_owner_id_idx" ON "trucks"("owner_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Create "phone_otps"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "phone_otps" (
    "id"         TEXT         NOT NULL,
    "phone"      VARCHAR(20)  NOT NULL,
    "code_hash"  TEXT         NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used"       BOOLEAN      NOT NULL DEFAULT false,
    "attempts"   INTEGER      NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "phone_otps_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "phone_otps_phone_used_expires_at_idx"
    ON "phone_otps"("phone", "used", "expires_at");

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Create "companies"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "companies" (
    "id"                  TEXT         NOT NULL,
    "user_id"             TEXT         NOT NULL,
    "legal_name"          TEXT         NOT NULL,
    "registration_number" TEXT,
    "vat_number"          TEXT,
    "phone_number"        TEXT,
    "email"               TEXT,
    "website"             TEXT,
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "companies_pkey"    PRIMARY KEY ("id"),
    CONSTRAINT "companies_user_id_key" UNIQUE ("user_id")
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Create "addresses"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "addresses" (
    "id"           TEXT          NOT NULL,
    "user_id"      TEXT,
    "company_id"   TEXT,
    "address_type" "AddressType" NOT NULL,
    "label"        TEXT,
    "street"       TEXT,
    "city_id"      TEXT,
    "postal_code"  TEXT,
    "country"      TEXT,
    "latitude"     DOUBLE PRECISION,
    "longitude"    DOUBLE PRECISION,
    "is_default"   BOOLEAN       NOT NULL DEFAULT false,
    "created_at"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "addresses_user_id_idx"    ON "addresses"("user_id");
CREATE INDEX IF NOT EXISTS "addresses_company_id_idx" ON "addresses"("company_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Create "specification_types"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "specification_types" (
    "id"          TEXT       NOT NULL,
    "code"        TEXT       NOT NULL,
    "name"        TEXT       NOT NULL,
    "unit"        TEXT,
    "data_type"   "DataType" NOT NULL,
    "enum_options" JSONB,
    "min_value"   DOUBLE PRECISION,
    "max_value"   DOUBLE PRECISION,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "specification_types_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "specification_types_code_key" UNIQUE ("code")
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Create "product_spec_templates"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "product_spec_templates" (
    "id"             TEXT         NOT NULL,
    "product_id"     TEXT         NOT NULL,
    "spec_type_id"   TEXT         NOT NULL,
    "importance"     "Importance" NOT NULL,
    "display_order"  INTEGER      NOT NULL DEFAULT 0,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_spec_templates_pkey"                    PRIMARY KEY ("id"),
    CONSTRAINT "product_spec_templates_product_id_spec_type_id_key" UNIQUE ("product_id", "spec_type_id")
);

CREATE INDEX IF NOT EXISTS "product_spec_templates_product_id_idx"
    ON "product_spec_templates"("product_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. Create "sale_listings"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sale_listings" (
    "id"             TEXT            NOT NULL,
    "product_id"     TEXT            NOT NULL,
    "seller_id"      TEXT            NOT NULL,
    "address_id"     TEXT,
    "quantity"       DECIMAL(10,2)   NOT NULL,
    "unit"           "ProductUnit"   NOT NULL DEFAULT 'TON',
    "asking_price"   DECIMAL(10,2),
    "harvest_date"   TIMESTAMP(3),
    "quality_score"  INTEGER,
    "quality_grade"  TEXT,
    "status"         "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "view_count"     INTEGER         NOT NULL DEFAULT 0,
    "created_at"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sale_listings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "sale_listings_seller_id_idx"  ON "sale_listings"("seller_id");
CREATE INDEX IF NOT EXISTS "sale_listings_product_id_idx" ON "sale_listings"("product_id");
CREATE INDEX IF NOT EXISTS "sale_listings_address_id_idx" ON "sale_listings"("address_id");
CREATE INDEX IF NOT EXISTS "sale_listings_status_idx"     ON "sale_listings"("status");

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. Create "buy_listings"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "buy_listings" (
    "id"                   TEXT             NOT NULL,
    "product_id"           TEXT             NOT NULL,
    "buyer_id"             TEXT             NOT NULL,
    "delivery_address_id"  TEXT,
    "quantity"             DECIMAL(10,2)    NOT NULL,
    "unit"                 "ProductUnit"    NOT NULL DEFAULT 'TON',
    "max_price_per_unit"   DECIMAL(10,2),
    "needed_by"            TIMESTAMP(3),
    "status"               "RequestStatus"  NOT NULL DEFAULT 'ACTIVE',
    "created_at"           TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "buy_listings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "buy_listings_buyer_id_idx"            ON "buy_listings"("buyer_id");
CREATE INDEX IF NOT EXISTS "buy_listings_product_id_idx"          ON "buy_listings"("product_id");
CREATE INDEX IF NOT EXISTS "buy_listings_delivery_address_id_idx" ON "buy_listings"("delivery_address_id");
CREATE INDEX IF NOT EXISTS "buy_listings_status_idx"              ON "buy_listings"("status");

-- ─────────────────────────────────────────────────────────────────────────────
-- 13. Create "listing_specs"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "listing_specs" (
    "id"                       TEXT             NOT NULL,
    "sale_listing_id"          TEXT,
    "buy_listing_id"           TEXT,
    "spec_type_id"             TEXT             NOT NULL,
    "value_number"             DOUBLE PRECISION,
    "value_text"               TEXT,
    "value_bool"               BOOLEAN,
    "min_value"                DOUBLE PRECISION,
    "max_value"                DOUBLE PRECISION,
    "quality_impact"           "QualityImpact",
    "strictness"               "Strictness",
    "price_adjustment_per_unit" DECIMAL(10,2),
    "created_at"               TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"               TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "listing_specs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "listing_specs_sale_listing_id_spec_type_id_key"
        UNIQUE ("sale_listing_id", "spec_type_id"),
    CONSTRAINT "listing_specs_buy_listing_id_spec_type_id_key"
        UNIQUE ("buy_listing_id", "spec_type_id")
);

CREATE INDEX IF NOT EXISTS "listing_specs_sale_listing_id_idx" ON "listing_specs"("sale_listing_id");
CREATE INDEX IF NOT EXISTS "listing_specs_buy_listing_id_idx"  ON "listing_specs"("buy_listing_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 14. Create "offers"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "offers" (
    "id"                  TEXT           NOT NULL,
    "sale_listing_id"     TEXT,
    "buy_listing_id"      TEXT,
    "offered_price"       DECIMAL(10,2)  NOT NULL,
    "quantity"            DECIMAL(10,2)  NOT NULL,
    "unit"                "ProductUnit"  NOT NULL DEFAULT 'TON',
    "match_score"         INTEGER        NOT NULL,
    "match_details"       JSONB,
    "base_price"          DECIMAL(10,2)  NOT NULL,
    "quality_adjustment"  DECIMAL(10,2),
    "quantity_discount"   DECIMAL(10,2),
    "transport_cost"      DECIMAL(10,2),
    "final_price"         DECIMAL(10,2)  NOT NULL,
    "valid_until"         TIMESTAMP(3)   NOT NULL,
    "delivery_terms"      TEXT,
    "payment_terms"       TEXT,
    "status"              "OfferStatus"  NOT NULL DEFAULT 'PENDING',
    "rejection_reason"    TEXT,
    "created_by"          "OfferCreator" NOT NULL,
    "created_at"          TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "offers_sale_listing_id_idx" ON "offers"("sale_listing_id");
CREATE INDEX IF NOT EXISTS "offers_buy_listing_id_idx"  ON "offers"("buy_listing_id");
CREATE INDEX IF NOT EXISTS "offers_status_idx"          ON "offers"("status");

-- ─────────────────────────────────────────────────────────────────────────────
-- 15. Create "regional_prices"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "regional_prices" (
    "id"            TEXT           NOT NULL,
    "city_id"       TEXT           NOT NULL,
    "product_id"    TEXT           NOT NULL,
    "price_per_unit" DECIMAL(10,2) NOT NULL,
    "currency"      TEXT           NOT NULL DEFAULT 'EUR',
    "unit"          "ProductUnit"  NOT NULL DEFAULT 'TON',
    "last_updated"  TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "regional_prices_pkey"               PRIMARY KEY ("id"),
    CONSTRAINT "regional_prices_city_id_product_id_key" UNIQUE ("city_id", "product_id")
);

CREATE INDEX IF NOT EXISTS "regional_prices_city_id_idx"    ON "regional_prices"("city_id");
CREATE INDEX IF NOT EXISTS "regional_prices_product_id_idx" ON "regional_prices"("product_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 16. Create "transport_cost_settings"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "transport_cost_settings" (
    "id"                       TEXT          NOT NULL,
    "base_rate_per_km"         DECIMAL(10,4) NOT NULL DEFAULT 0.15,
    "flatbed_multiplier"       DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "refrigerated_multiplier"  DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "tanker_multiplier"        DOUBLE PRECISION NOT NULL DEFAULT 1.2,
    "container_multiplier"     DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "tier1_max_km"             INTEGER       NOT NULL DEFAULT 50,
    "tier1_rate"               DECIMAL(10,4) NOT NULL DEFAULT 0.15,
    "tier2_max_km"             INTEGER       NOT NULL DEFAULT 200,
    "tier2_rate"               DECIMAL(10,4) NOT NULL DEFAULT 0.13,
    "tier3_rate"               DECIMAL(10,4) NOT NULL DEFAULT 0.11,
    "loading_cost_per_ton"     DECIMAL(10,2) NOT NULL DEFAULT 0.50,
    "urgency_surcharge"        DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "effective_from"           TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to"             TIMESTAMP(3),
    "is_active"                BOOLEAN       NOT NULL DEFAULT true,
    "created_at"               TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"               TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_cost_settings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "transport_cost_settings_is_active_effective_from_idx"
    ON "transport_cost_settings"("is_active", "effective_from");

-- ─────────────────────────────────────────────────────────────────────────────
-- 17. Create "transport_companies"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "transport_companies" (
    "id"                    TEXT          NOT NULL,
    "company_name"          TEXT          NOT NULL,
    "registration_number"   TEXT          NOT NULL,
    "vat_number"            TEXT,
    "main_email"            TEXT          NOT NULL,
    "main_phone"            TEXT          NOT NULL,
    "website"               TEXT,
    "company_type"          "CompanyType" NOT NULL DEFAULT 'EXTERNAL',
    "is_verified"           BOOLEAN       NOT NULL DEFAULT false,
    "verified_at"           TIMESTAMP(3),
    "verified_by"           TEXT,
    "operating_regions"     TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
    "specializations"       TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
    "fleet_size"            INTEGER       NOT NULL DEFAULT 0,
    "total_jobs_completed"  INTEGER       NOT NULL DEFAULT 0,
    "average_rating"        DOUBLE PRECISION,
    "on_time_delivery_rate" DOUBLE PRECISION,
    "credit_limit"          DECIMAL(10,2),
    "current_balance"       DECIMAL(10,2),
    "created_at"            TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_companies_pkey"                PRIMARY KEY ("id"),
    CONSTRAINT "transport_companies_company_name_key"    UNIQUE ("company_name"),
    CONSTRAINT "transport_companies_registration_number_key" UNIQUE ("registration_number"),
    CONSTRAINT "transport_companies_vat_number_key"      UNIQUE ("vat_number"),
    CONSTRAINT "transport_companies_main_email_key"      UNIQUE ("main_email")
);

CREATE INDEX IF NOT EXISTS "transport_companies_company_type_idx" ON "transport_companies"("company_type");
CREATE INDEX IF NOT EXISTS "transport_companies_is_verified_idx"  ON "transport_companies"("is_verified");

-- ─────────────────────────────────────────────────────────────────────────────
-- 18. Create "company_admins"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "company_admins" (
    "id"                    TEXT          NOT NULL,
    "user_id"               TEXT          NOT NULL,
    "transport_company_id"  TEXT          NOT NULL,
    "admin_level"           "AdminLevel"  NOT NULL DEFAULT 'MANAGER',
    "can_manage_drivers"    BOOLEAN       NOT NULL DEFAULT true,
    "can_manage_fleet"      BOOLEAN       NOT NULL DEFAULT true,
    "can_submit_bids"       BOOLEAN       NOT NULL DEFAULT true,
    "can_manage_finances"   BOOLEAN       NOT NULL DEFAULT false,
    "can_view_reports"      BOOLEAN       NOT NULL DEFAULT true,
    "last_active_at"        TIMESTAMP(3),
    "created_at"            TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "company_admins_pkey"          PRIMARY KEY ("id"),
    CONSTRAINT "company_admins_user_id_key"   UNIQUE ("user_id"),
    CONSTRAINT "company_admins_user_id_transport_company_id_key"
        UNIQUE ("user_id", "transport_company_id")
);

CREATE INDEX IF NOT EXISTS "company_admins_transport_company_id_idx"
    ON "company_admins"("transport_company_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 19. Create "drivers" (current_job_id FK deferred until transport_jobs exists)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "drivers" (
    "id"                        TEXT           NOT NULL,
    "driver_type"               "DriverType"   NOT NULL,
    "user_id"                   TEXT,
    "transport_company_id"      TEXT,
    "email"                     TEXT,
    "phone_number"              TEXT,
    "first_name"                TEXT,
    "last_name"                 TEXT,
    "license_number"            TEXT           NOT NULL,
    "license_class"             TEXT[]         NOT NULL DEFAULT ARRAY[]::TEXT[],
    "license_expiry_date"       TIMESTAMP(3)   NOT NULL,
    "medical_certificate_expiry" TIMESTAMP(3),
    "last_safety_training"      TIMESTAMP(3),
    "status"                    "DriverStatus" NOT NULL DEFAULT 'OFFLINE',
    "is_available"              BOOLEAN        NOT NULL DEFAULT false,
    "current_location"          JSONB,
    "last_location_update"      TIMESTAMP(3),
    "current_job_id"            TEXT,
    "total_jobs"                INTEGER        NOT NULL DEFAULT 0,
    "total_distance"            DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_rating"            DOUBLE PRECISION,
    "on_time_rate"              DOUBLE PRECISION,
    "weekly_hours_worked"       DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_rest_period"          TIMESTAMP(3),
    "created_at"                TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "drivers_pkey"                PRIMARY KEY ("id"),
    CONSTRAINT "drivers_user_id_key"         UNIQUE ("user_id"),
    CONSTRAINT "drivers_email_key"           UNIQUE ("email"),
    CONSTRAINT "drivers_phone_number_key"    UNIQUE ("phone_number"),
    CONSTRAINT "drivers_license_number_key"  UNIQUE ("license_number"),
    CONSTRAINT "drivers_current_job_id_key"  UNIQUE ("current_job_id")
);

CREATE INDEX IF NOT EXISTS "drivers_driver_type_idx"          ON "drivers"("driver_type");
CREATE INDEX IF NOT EXISTS "drivers_transport_company_id_idx" ON "drivers"("transport_company_id");
CREATE INDEX IF NOT EXISTS "drivers_status_idx"               ON "drivers"("status");
CREATE INDEX IF NOT EXISTS "drivers_is_available_idx"         ON "drivers"("is_available");

-- ─────────────────────────────────────────────────────────────────────────────
-- 21. Add current_driver_id FK to "trucks" now that "drivers" exists
-- ─────────────────────────────────────────────────────────────────────────────

-- Column already created in the CREATE TABLE above; just add FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trucks_current_driver_id_fkey'
  ) THEN
    ALTER TABLE "trucks"
      ADD CONSTRAINT "trucks_current_driver_id_fkey"
      FOREIGN KEY ("current_driver_id") REFERENCES "drivers"("id");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trucks_owner_id_fkey'
  ) THEN
    ALTER TABLE "trucks"
      ADD CONSTRAINT "trucks_owner_id_fkey"
      FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trucks_transport_company_id_fkey'
  ) THEN
    ALTER TABLE "trucks"
      ADD CONSTRAINT "trucks_transport_company_id_fkey"
      FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id");
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 22. Create "trade_operations"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "trade_operations" (
    "id"                       TEXT           NOT NULL,
    "operation_number"         TEXT           NOT NULL,
    "admin_id"                 TEXT           NOT NULL,
    "buy_listing_id"           TEXT           NOT NULL,
    "phase"                    "TradePhase"   NOT NULL DEFAULT 'INITIATION',
    "status"                   "TradeStatus"  NOT NULL DEFAULT 'ACTIVE',
    "currency"                 TEXT           NOT NULL DEFAULT 'EUR',
    "total_purchase_cost"      DECIMAL(10,2),
    "avg_purchase_price"       DECIMAL(10,2),
    "selling_price"            DECIMAL(10,2),
    "total_revenue"            DECIMAL(10,2),
    "estimated_transport_cost" DECIMAL(10,2),
    "actual_transport_cost"    DECIMAL(10,2),
    "total_distance_km"        DOUBLE PRECISION,
    "estimated_profit"         DECIMAL(10,2),
    "actual_profit"            DECIMAL(10,2),
    "profit_margin"            DOUBLE PRECISION,
    "initiated_at"             TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at"             TIMESTAMP(3),
    "metadata"                 JSONB,
    "created_at"               TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"               TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trade_operations_pkey"               PRIMARY KEY ("id"),
    CONSTRAINT "trade_operations_operation_number_key" UNIQUE ("operation_number"),
    CONSTRAINT "trade_operations_buy_listing_id_key"  UNIQUE ("buy_listing_id")
);

CREATE INDEX IF NOT EXISTS "trade_operations_admin_id_idx"       ON "trade_operations"("admin_id");
CREATE INDEX IF NOT EXISTS "trade_operations_buy_listing_id_idx" ON "trade_operations"("buy_listing_id");
CREATE INDEX IF NOT EXISTS "trade_operations_phase_idx"          ON "trade_operations"("phase");
CREATE INDEX IF NOT EXISTS "trade_operations_status_idx"         ON "trade_operations"("status");
-- NI-21: Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "trade_operations_admin_id_status_idx"  ON "trade_operations"("admin_id", "status");
CREATE INDEX IF NOT EXISTS "trade_operations_status_phase_idx"     ON "trade_operations"("status", "phase");
CREATE INDEX IF NOT EXISTS "trade_operations_created_at_idx"       ON "trade_operations"("created_at");

-- ─────────────────────────────────────────────────────────────────────────────
-- 23. Create "trade_sellers"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "trade_sellers" (
    "id"                  TEXT           NOT NULL,
    "trade_operation_id"  TEXT           NOT NULL,
    "seller_id"           TEXT           NOT NULL,
    "sale_listing_id"     TEXT           NOT NULL,
    "requested_quantity"  DECIMAL(10,2)  NOT NULL,
    "offered_quantity"    DECIMAL(10,2)  NOT NULL,
    "agreed_quantity"     DECIMAL(10,2),
    "unit"                "ProductUnit"  NOT NULL DEFAULT 'TON',
    "agreed_price"        DECIMAL(10,2),
    "is_verified"         BOOLEAN        NOT NULL DEFAULT false,
    "match_score"         INTEGER,
    "status"              "SellerStatus" NOT NULL DEFAULT 'INVITED',
    "joined_at"           TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at"        TIMESTAMP(3),
    CONSTRAINT "trade_sellers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "trade_sellers_trade_operation_id_sale_listing_id_key"
        UNIQUE ("trade_operation_id", "sale_listing_id")
);

CREATE INDEX IF NOT EXISTS "trade_sellers_trade_operation_id_idx" ON "trade_sellers"("trade_operation_id");
CREATE INDEX IF NOT EXISTS "trade_sellers_seller_id_idx"          ON "trade_sellers"("seller_id");
CREATE INDEX IF NOT EXISTS "trade_sellers_sale_listing_id_idx"    ON "trade_sellers"("sale_listing_id");
CREATE INDEX IF NOT EXISTS "trade_sellers_status_idx"             ON "trade_sellers"("status");

-- ─────────────────────────────────────────────────────────────────────────────
-- 24. Create "trade_transporters"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "trade_transporters" (
    "id"                  TEXT                NOT NULL,
    "trade_operation_id"  TEXT                NOT NULL,
    "transporter_id"      TEXT                NOT NULL,
    "pickup_seller_id"    TEXT,
    "route"               JSONB,
    "estimated_distance"  DOUBLE PRECISION,
    "estimated_duration"  INTEGER,
    "agreed_price"        DECIMAL(10,2),
    "vehicle_id"          TEXT,
    "status"              "TransporterStatus" NOT NULL DEFAULT 'INVITED',
    "assigned_at"         TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at"        TIMESTAMP(3),
    "delivered_at"        TIMESTAMP(3),
    CONSTRAINT "trade_transporters_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "trade_transporters_trade_operation_id_transporter_id_key"
        UNIQUE ("trade_operation_id", "transporter_id")
);

CREATE INDEX IF NOT EXISTS "trade_transporters_trade_operation_id_idx" ON "trade_transporters"("trade_operation_id");
CREATE INDEX IF NOT EXISTS "trade_transporters_transporter_id_idx"     ON "trade_transporters"("transporter_id");
CREATE INDEX IF NOT EXISTS "trade_transporters_status_idx"             ON "trade_transporters"("status");

-- ─────────────────────────────────────────────────────────────────────────────
-- 25. Create "offer_negotiations"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "offer_negotiations" (
    "id"                  TEXT                NOT NULL,
    "trade_operation_id"  TEXT                NOT NULL,
    "trade_seller_id"     TEXT                NOT NULL,
    "status"              "NegotiationStatus" NOT NULL DEFAULT 'PENDING',
    "current_offer"       JSONB               NOT NULL,
    "counter_offer"       JSONB,
    "offer_history"       JSONB[]             NOT NULL DEFAULT ARRAY[]::JSONB[],
    "final_price"         DECIMAL(10,2),
    "final_quantity"      DECIMAL(10,2),
    "unit"                "ProductUnit"       NOT NULL DEFAULT 'TON',
    "started_at"          TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at"        TIMESTAMP(3),
    "concluded_at"        TIMESTAMP(3),
    "expires_at"          TIMESTAMP(3)        NOT NULL,
    CONSTRAINT "offer_negotiations_pkey"           PRIMARY KEY ("id"),
    CONSTRAINT "offer_negotiations_trade_seller_id_key" UNIQUE ("trade_seller_id")
);

CREATE INDEX IF NOT EXISTS "offer_negotiations_trade_operation_id_idx" ON "offer_negotiations"("trade_operation_id");
CREATE INDEX IF NOT EXISTS "offer_negotiations_trade_seller_id_idx"    ON "offer_negotiations"("trade_seller_id");
CREATE INDEX IF NOT EXISTS "offer_negotiations_status_idx"             ON "offer_negotiations"("status");
CREATE INDEX IF NOT EXISTS "offer_negotiations_expires_at_idx"         ON "offer_negotiations"("expires_at");

-- ─────────────────────────────────────────────────────────────────────────────
-- 26. Create "offer_rounds"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "offer_rounds" (
    "id"             TEXT            NOT NULL,
    "negotiation_id" TEXT            NOT NULL,
    "round_number"   INTEGER         NOT NULL,
    "offered_by"     "OfferParty"    NOT NULL,
    "price"          DECIMAL(10,2)   NOT NULL,
    "quantity"       DECIMAL(10,2)   NOT NULL,
    "terms"          TEXT,
    "response"       "OfferResponse",
    "response_note"  TEXT,
    "created_at"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at"   TIMESTAMP(3),
    CONSTRAINT "offer_rounds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "offer_rounds_negotiation_id_round_number_key"
        UNIQUE ("negotiation_id", "round_number")
);

CREATE INDEX IF NOT EXISTS "offer_rounds_negotiation_id_idx" ON "offer_rounds"("negotiation_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 27. Create "inspection_requests"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "inspection_requests" (
    "id"                  TEXT                 NOT NULL,
    "trade_operation_id"  TEXT,
    "sale_listing_id"     TEXT                 NOT NULL,
    "inspector_id"        TEXT,
    "priority"            "InspectionPriority" NOT NULL DEFAULT 'MEDIUM',
    "requested_date"      TIMESTAMP(3),
    "scheduled_date"      TIMESTAMP(3),
    "completed_date"      TIMESTAMP(3),
    "latitude"            DOUBLE PRECISION     NOT NULL,
    "longitude"           DOUBLE PRECISION     NOT NULL,
    "address"             TEXT,
    "status"              "InspectionStatus"   NOT NULL DEFAULT 'PENDING',
    "quality_score"       INTEGER,
    "verification_result" JSONB,
    "notes"               TEXT,
    "photos"              TEXT[]               NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at"          TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inspection_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "inspection_requests_trade_operation_id_idx" ON "inspection_requests"("trade_operation_id");
CREATE INDEX IF NOT EXISTS "inspection_requests_sale_listing_id_idx"    ON "inspection_requests"("sale_listing_id");
CREATE INDEX IF NOT EXISTS "inspection_requests_inspector_id_idx"       ON "inspection_requests"("inspector_id");
CREATE INDEX IF NOT EXISTS "inspection_requests_status_idx"             ON "inspection_requests"("status");
CREATE INDEX IF NOT EXISTS "inspection_requests_priority_idx"           ON "inspection_requests"("priority");

-- ─────────────────────────────────────────────────────────────────────────────
-- 28. Create "transport_requests" (selected_bid_id FK added after transport_bids)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "transport_requests" (
    "id"                    TEXT                     NOT NULL,
    "request_number"        TEXT                     NOT NULL,
    "trade_operation_id"    TEXT                     NOT NULL,
    "total_weight"          DOUBLE PRECISION         NOT NULL,
    "required_vehicle_type" "TruckType",
    "special_requirements"  TEXT[]                   NOT NULL DEFAULT ARRAY[]::TEXT[],
    "pickup_points"         JSONB                    NOT NULL,
    "delivery_point"        JSONB                    NOT NULL,
    "estimated_distance"    DOUBLE PRECISION,
    "pickup_window_start"   TIMESTAMP(3),
    "pickup_window_end"     TIMESTAMP(3),
    "delivery_deadline"     TIMESTAMP(3),
    "urgency_level"         "UrgencyLevel"           NOT NULL DEFAULT 'STANDARD',
    "status"                "TransportRequestStatus" NOT NULL DEFAULT 'OPEN',
    "bidding_deadline"      TIMESTAMP(3)             NOT NULL,
    "max_budget"            DECIMAL(10,2),
    "selected_bid_id"       TEXT,
    "created_at"            TIMESTAMP(3)             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3)             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_requests_pkey"                    PRIMARY KEY ("id"),
    CONSTRAINT "transport_requests_request_number_key"      UNIQUE ("request_number"),
    CONSTRAINT "transport_requests_trade_operation_id_key"  UNIQUE ("trade_operation_id"),
    CONSTRAINT "transport_requests_selected_bid_id_key"     UNIQUE ("selected_bid_id")
);

CREATE INDEX IF NOT EXISTS "transport_requests_status_idx"        ON "transport_requests"("status");
CREATE INDEX IF NOT EXISTS "transport_requests_urgency_level_idx" ON "transport_requests"("urgency_level");
CREATE INDEX IF NOT EXISTS "transport_requests_bidding_deadline_idx" ON "transport_requests"("bidding_deadline");

-- ─────────────────────────────────────────────────────────────────────────────
-- 29. Create "transport_bids"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "transport_bids" (
    "id"                   TEXT          NOT NULL,
    "transport_request_id" TEXT          NOT NULL,
    "trade_operation_id"   TEXT          NOT NULL,
    "transporter_id"       TEXT          NOT NULL,
    "transport_company_id" TEXT,
    "bid_amount"           DECIMAL(10,2) NOT NULL,
    "estimated_duration"   INTEGER       NOT NULL,
    "vehicle_type"         "TruckType"   NOT NULL,
    "vehicle_capacity"     DOUBLE PRECISION NOT NULL,
    "assigned_truck_id"    TEXT,
    "special_equipment"    TEXT[]        NOT NULL DEFAULT ARRAY[]::TEXT[],
    "insurance_coverage"   DECIMAL(10,2),
    "proposed_route"       JSONB,
    "pickup_schedule"      JSONB,
    "status"               "BidStatus"   NOT NULL DEFAULT 'PENDING',
    "submitted_at"         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at"           TIMESTAMP(3)  NOT NULL,
    "evaluated_at"         TIMESTAMP(3),
    "accepted_at"          TIMESTAMP(3),
    CONSTRAINT "transport_bids_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "transport_bids_transport_request_id_idx" ON "transport_bids"("transport_request_id");
CREATE INDEX IF NOT EXISTS "transport_bids_trade_operation_id_idx"   ON "transport_bids"("trade_operation_id");
CREATE INDEX IF NOT EXISTS "transport_bids_transporter_id_idx"       ON "transport_bids"("transporter_id");
CREATE INDEX IF NOT EXISTS "transport_bids_status_idx"               ON "transport_bids"("status");

-- ─────────────────────────────────────────────────────────────────────────────
-- 30. Add FK from transport_requests.selected_bid_id -> transport_bids
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transport_requests_selected_bid_id_fkey'
  ) THEN
    ALTER TABLE "transport_requests"
      ADD CONSTRAINT "transport_requests_selected_bid_id_fkey"
      FOREIGN KEY ("selected_bid_id") REFERENCES "transport_bids"("id");
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 31. Create "transport_jobs" (current driver FK deferred)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "transport_jobs" (
    "id"                    TEXT                  NOT NULL,
    "job_number"            TEXT                  NOT NULL,
    "transport_request_id"  TEXT                  NOT NULL,
    "transport_bid_id"      TEXT                  NOT NULL,
    "trade_operation_id"    TEXT                  NOT NULL,
    "transporter_id"        TEXT                  NOT NULL,
    "assigned_driver_id"    TEXT,
    "transport_company_id"  TEXT,
    "status"                "TransportJobStatus"  NOT NULL DEFAULT 'ASSIGNED',
    "pickups_completed"     JSONB                 NOT NULL DEFAULT '[]',
    "all_pickups_complete"  BOOLEAN               NOT NULL DEFAULT false,
    "current_location"      JSONB,
    "estimated_arrival"     TIMESTAMP(3),
    "actual_delivery"       TIMESTAMP(3),
    "pickup_photos"         TEXT[]                NOT NULL DEFAULT ARRAY[]::TEXT[],
    "delivery_photos"       TEXT[]                NOT NULL DEFAULT ARRAY[]::TEXT[],
    "proof_of_delivery"     TEXT,
    "on_time_pickup"        BOOLEAN,
    "on_time_delivery"      BOOLEAN,
    "customer_rating"       INTEGER,
    "notes"                 TEXT,
    "started_at"            TIMESTAMP(3),
    "completed_at"          TIMESTAMP(3),
    "created_at"            TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_jobs_pkey"                   PRIMARY KEY ("id"),
    CONSTRAINT "transport_jobs_job_number_key"          UNIQUE ("job_number"),
    CONSTRAINT "transport_jobs_transport_request_id_key" UNIQUE ("transport_request_id"),
    CONSTRAINT "transport_jobs_transport_bid_id_key"    UNIQUE ("transport_bid_id")
);

CREATE INDEX IF NOT EXISTS "transport_jobs_status_idx"             ON "transport_jobs"("status");
CREATE INDEX IF NOT EXISTS "transport_jobs_transporter_id_idx"     ON "transport_jobs"("transporter_id");
CREATE INDEX IF NOT EXISTS "transport_jobs_trade_operation_id_idx" ON "transport_jobs"("trade_operation_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 32. Add current_job_id FK to "drivers" now that "transport_jobs" exists
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'drivers_current_job_id_fkey'
  ) THEN
    ALTER TABLE "drivers"
      ADD CONSTRAINT "drivers_current_job_id_fkey"
      FOREIGN KEY ("current_job_id") REFERENCES "transport_jobs"("id");
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 33. Create "trade_state_history"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "trade_state_history" (
    "id"                  TEXT         NOT NULL,
    "trade_operation_id"  TEXT         NOT NULL,
    "from_phase"          "TradePhase",
    "to_phase"            "TradePhase" NOT NULL,
    "from_status"         "TradeStatus",
    "to_status"           "TradeStatus",
    "changed_by"          TEXT         NOT NULL,
    "reason"              TEXT,
    "metadata"            JSONB,
    "changed_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trade_state_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "trade_state_history_trade_operation_id_idx" ON "trade_state_history"("trade_operation_id");
CREATE INDEX IF NOT EXISTS "trade_state_history_changed_by_idx"         ON "trade_state_history"("changed_by");
CREATE INDEX IF NOT EXISTS "trade_state_history_changed_at_idx"         ON "trade_state_history"("changed_at");

-- ─────────────────────────────────────────────────────────────────────────────
-- 34. Create "trade_notes"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "trade_notes" (
    "id"                  TEXT         NOT NULL,
    "trade_operation_id"  TEXT         NOT NULL,
    "author_id"           TEXT         NOT NULL,
    "content"             TEXT         NOT NULL,
    "is_internal"         BOOLEAN      NOT NULL DEFAULT true,
    "attachments"         TEXT[]       NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "trade_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "trade_notes_trade_operation_id_idx" ON "trade_notes"("trade_operation_id");
CREATE INDEX IF NOT EXISTS "trade_notes_author_id_idx"          ON "trade_notes"("author_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 35. Create "transport_cost_calculations"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "transport_cost_calculations" (
    "id"                  TEXT          NOT NULL,
    "trade_operation_id"  TEXT          NOT NULL,
    "pickup_points"       JSONB         NOT NULL,
    "delivery_point"      JSONB         NOT NULL,
    "optimal_route"       JSONB,
    "total_distance"      DOUBLE PRECISION NOT NULL,
    "base_rate_per_km"    DECIMAL(10,4) NOT NULL,
    "vehicle_type"        "TruckType",
    "distance_cost"       DECIMAL(10,2) NOT NULL,
    "loading_costs"       DECIMAL(10,2),
    "urgency_surcharge"   DECIMAL(10,2),
    "total_cost"          DECIMAL(10,2) NOT NULL,
    "calculated_by"       TEXT          NOT NULL,
    "calculated_at"       TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transport_cost_calculations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "transport_cost_calculations_trade_operation_id_idx"
    ON "transport_cost_calculations"("trade_operation_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 36. Create "profit_estimations"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "profit_estimations" (
    "id"                      TEXT          NOT NULL,
    "trade_operation_id"      TEXT          NOT NULL,
    "proposed_buyer_price"    DECIMAL(10,2) NOT NULL,
    "proposed_seller_prices"  JSONB         NOT NULL,
    "estimated_revenue"       DECIMAL(10,2) NOT NULL,
    "estimated_purchase_cost" DECIMAL(10,2) NOT NULL,
    "estimated_transport_cost" DECIMAL(10,2) NOT NULL,
    "estimated_profit"        DECIMAL(10,2) NOT NULL,
    "profit_margin"           DOUBLE PRECISION NOT NULL,
    "price_volatility_risk"   DOUBLE PRECISION,
    "quality_risk"            DOUBLE PRECISION,
    "transport_risk"          DOUBLE PRECISION,
    "overall_risk"            DOUBLE PRECISION,
    "notes"                   TEXT,
    "created_by"              TEXT          NOT NULL,
    "created_at"              TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profit_estimations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "profit_estimations_trade_operation_id_idx" ON "profit_estimations"("trade_operation_id");
CREATE INDEX IF NOT EXISTS "profit_estimations_created_at_idx"         ON "profit_estimations"("created_at");

-- ─────────────────────────────────────────────────────────────────────────────
-- 37. Create "company_documents"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "company_documents" (
    "id"                    TEXT                  NOT NULL,
    "transport_company_id"  TEXT                  NOT NULL,
    "document_type"         "CompanyDocumentType" NOT NULL,
    "document_number"       TEXT,
    "document_url"          TEXT                  NOT NULL,
    "issued_date"           TIMESTAMP(3),
    "expiry_date"           TIMESTAMP(3),
    "is_verified"           BOOLEAN               NOT NULL DEFAULT false,
    "verified_at"           TIMESTAMP(3),
    "verified_by"           TEXT,
    "created_at"            TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "company_documents_transport_company_id_idx" ON "company_documents"("transport_company_id");
CREATE INDEX IF NOT EXISTS "company_documents_document_type_idx"        ON "company_documents"("document_type");

-- ─────────────────────────────────────────────────────────────────────────────
-- 38. Create "driver_documents"
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "driver_documents" (
    "id"              TEXT                 NOT NULL,
    "driver_id"       TEXT                 NOT NULL,
    "document_type"   "DriverDocumentType" NOT NULL,
    "document_number" TEXT,
    "document_url"    TEXT                 NOT NULL,
    "issued_date"     TIMESTAMP(3),
    "expiry_date"     TIMESTAMP(3),
    "is_verified"     BOOLEAN              NOT NULL DEFAULT false,
    "verified_at"     TIMESTAMP(3),
    "verified_by"     TEXT,
    "created_at"      TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "driver_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "driver_documents_driver_id_idx"       ON "driver_documents"("driver_id");
CREATE INDEX IF NOT EXISTS "driver_documents_document_type_idx"   ON "driver_documents"("document_type");

-- ─────────────────────────────────────────────────────────────────────────────
-- 39. Add all remaining FK constraints
-- ─────────────────────────────────────────────────────────────────────────────

-- companies
ALTER TABLE "companies"
  ADD CONSTRAINT "companies_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- addresses
ALTER TABLE "addresses"
  ADD CONSTRAINT "addresses_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "addresses"
  ADD CONSTRAINT "addresses_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "addresses"
  ADD CONSTRAINT "addresses_city_id_fkey"
  FOREIGN KEY ("city_id") REFERENCES "cities"("id");

-- product_spec_templates
ALTER TABLE "product_spec_templates"
  ADD CONSTRAINT "product_spec_templates_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_spec_templates"
  ADD CONSTRAINT "product_spec_templates_spec_type_id_fkey"
  FOREIGN KEY ("spec_type_id") REFERENCES "specification_types"("id");

-- sale_listings
ALTER TABLE "sale_listings"
  ADD CONSTRAINT "sale_listings_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id");

ALTER TABLE "sale_listings"
  ADD CONSTRAINT "sale_listings_seller_id_fkey"
  FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sale_listings"
  ADD CONSTRAINT "sale_listings_address_id_fkey"
  FOREIGN KEY ("address_id") REFERENCES "addresses"("id");

-- buy_listings
ALTER TABLE "buy_listings"
  ADD CONSTRAINT "buy_listings_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id");

ALTER TABLE "buy_listings"
  ADD CONSTRAINT "buy_listings_buyer_id_fkey"
  FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "buy_listings"
  ADD CONSTRAINT "buy_listings_delivery_address_id_fkey"
  FOREIGN KEY ("delivery_address_id") REFERENCES "addresses"("id");

-- listing_specs
ALTER TABLE "listing_specs"
  ADD CONSTRAINT "listing_specs_sale_listing_id_fkey"
  FOREIGN KEY ("sale_listing_id") REFERENCES "sale_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "listing_specs"
  ADD CONSTRAINT "listing_specs_buy_listing_id_fkey"
  FOREIGN KEY ("buy_listing_id") REFERENCES "buy_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "listing_specs"
  ADD CONSTRAINT "listing_specs_spec_type_id_fkey"
  FOREIGN KEY ("spec_type_id") REFERENCES "specification_types"("id");

-- offers
ALTER TABLE "offers"
  ADD CONSTRAINT "offers_sale_listing_id_fkey"
  FOREIGN KEY ("sale_listing_id") REFERENCES "sale_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "offers"
  ADD CONSTRAINT "offers_buy_listing_id_fkey"
  FOREIGN KEY ("buy_listing_id") REFERENCES "buy_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- regional_prices
ALTER TABLE "regional_prices"
  ADD CONSTRAINT "regional_prices_city_id_fkey"
  FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regional_prices"
  ADD CONSTRAINT "regional_prices_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- company_admins
ALTER TABLE "company_admins"
  ADD CONSTRAINT "company_admins_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_admins"
  ADD CONSTRAINT "company_admins_transport_company_id_fkey"
  FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- drivers
ALTER TABLE "drivers"
  ADD CONSTRAINT "drivers_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id");

ALTER TABLE "drivers"
  ADD CONSTRAINT "drivers_transport_company_id_fkey"
  FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id");

-- trade_operations
ALTER TABLE "trade_operations"
  ADD CONSTRAINT "trade_operations_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "users"("id");

ALTER TABLE "trade_operations"
  ADD CONSTRAINT "trade_operations_buy_listing_id_fkey"
  FOREIGN KEY ("buy_listing_id") REFERENCES "buy_listings"("id");

-- trade_sellers
ALTER TABLE "trade_sellers"
  ADD CONSTRAINT "trade_sellers_trade_operation_id_fkey"
  FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trade_sellers"
  ADD CONSTRAINT "trade_sellers_seller_id_fkey"
  FOREIGN KEY ("seller_id") REFERENCES "users"("id");

ALTER TABLE "trade_sellers"
  ADD CONSTRAINT "trade_sellers_sale_listing_id_fkey"
  FOREIGN KEY ("sale_listing_id") REFERENCES "sale_listings"("id");

-- trade_transporters
ALTER TABLE "trade_transporters"
  ADD CONSTRAINT "trade_transporters_trade_operation_id_fkey"
  FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trade_transporters"
  ADD CONSTRAINT "trade_transporters_transporter_id_fkey"
  FOREIGN KEY ("transporter_id") REFERENCES "users"("id");

ALTER TABLE "trade_transporters"
  ADD CONSTRAINT "trade_transporters_vehicle_id_fkey"
  FOREIGN KEY ("vehicle_id") REFERENCES "trucks"("id");

-- offer_negotiations
ALTER TABLE "offer_negotiations"
  ADD CONSTRAINT "offer_negotiations_trade_operation_id_fkey"
  FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "offer_negotiations"
  ADD CONSTRAINT "offer_negotiations_trade_seller_id_fkey"
  FOREIGN KEY ("trade_seller_id") REFERENCES "trade_sellers"("id");

-- offer_rounds
ALTER TABLE "offer_rounds"
  ADD CONSTRAINT "offer_rounds_negotiation_id_fkey"
  FOREIGN KEY ("negotiation_id") REFERENCES "offer_negotiations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- inspection_requests
ALTER TABLE "inspection_requests"
  ADD CONSTRAINT "inspection_requests_trade_operation_id_fkey"
  FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id");

ALTER TABLE "inspection_requests"
  ADD CONSTRAINT "inspection_requests_sale_listing_id_fkey"
  FOREIGN KEY ("sale_listing_id") REFERENCES "sale_listings"("id");

ALTER TABLE "inspection_requests"
  ADD CONSTRAINT "inspection_requests_inspector_id_fkey"
  FOREIGN KEY ("inspector_id") REFERENCES "users"("id");

-- transport_requests
ALTER TABLE "transport_requests"
  ADD CONSTRAINT "transport_requests_trade_operation_id_fkey"
  FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- transport_bids
ALTER TABLE "transport_bids"
  ADD CONSTRAINT "transport_bids_transport_request_id_fkey"
  FOREIGN KEY ("transport_request_id") REFERENCES "transport_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transport_bids"
  ADD CONSTRAINT "transport_bids_trade_operation_id_fkey"
  FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transport_bids"
  ADD CONSTRAINT "transport_bids_transporter_id_fkey"
  FOREIGN KEY ("transporter_id") REFERENCES "users"("id");

ALTER TABLE "transport_bids"
  ADD CONSTRAINT "transport_bids_transport_company_id_fkey"
  FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id");

ALTER TABLE "transport_bids"
  ADD CONSTRAINT "transport_bids_assigned_truck_id_fkey"
  FOREIGN KEY ("assigned_truck_id") REFERENCES "trucks"("id");

-- transport_jobs
ALTER TABLE "transport_jobs"
  ADD CONSTRAINT "transport_jobs_transport_request_id_fkey"
  FOREIGN KEY ("transport_request_id") REFERENCES "transport_requests"("id");

ALTER TABLE "transport_jobs"
  ADD CONSTRAINT "transport_jobs_transport_bid_id_fkey"
  FOREIGN KEY ("transport_bid_id") REFERENCES "transport_bids"("id");

ALTER TABLE "transport_jobs"
  ADD CONSTRAINT "transport_jobs_trade_operation_id_fkey"
  FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id");

ALTER TABLE "transport_jobs"
  ADD CONSTRAINT "transport_jobs_transporter_id_fkey"
  FOREIGN KEY ("transporter_id") REFERENCES "users"("id");

ALTER TABLE "transport_jobs"
  ADD CONSTRAINT "transport_jobs_assigned_driver_id_fkey"
  FOREIGN KEY ("assigned_driver_id") REFERENCES "drivers"("id");

ALTER TABLE "transport_jobs"
  ADD CONSTRAINT "transport_jobs_transport_company_id_fkey"
  FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id");

-- trade_state_history
ALTER TABLE "trade_state_history"
  ADD CONSTRAINT "trade_state_history_trade_operation_id_fkey"
  FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trade_state_history"
  ADD CONSTRAINT "trade_state_history_changed_by_fkey"
  FOREIGN KEY ("changed_by") REFERENCES "users"("id");

-- trade_notes
ALTER TABLE "trade_notes"
  ADD CONSTRAINT "trade_notes_trade_operation_id_fkey"
  FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trade_notes"
  ADD CONSTRAINT "trade_notes_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id");

-- transport_cost_calculations
ALTER TABLE "transport_cost_calculations"
  ADD CONSTRAINT "transport_cost_calculations_trade_operation_id_fkey"
  FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transport_cost_calculations"
  ADD CONSTRAINT "transport_cost_calculations_calculated_by_fkey"
  FOREIGN KEY ("calculated_by") REFERENCES "users"("id");

-- profit_estimations
ALTER TABLE "profit_estimations"
  ADD CONSTRAINT "profit_estimations_trade_operation_id_fkey"
  FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profit_estimations"
  ADD CONSTRAINT "profit_estimations_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id");

-- company_documents
ALTER TABLE "company_documents"
  ADD CONSTRAINT "company_documents_transport_company_id_fkey"
  FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- driver_documents
ALTER TABLE "driver_documents"
  ADD CONSTRAINT "driver_documents_driver_id_fkey"
  FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 40. NI-21: Additional composite indexes for common query patterns
-- ─────────────────────────────────────────────────────────────────────────────

-- TradeEvent composite (will be added by 20260310100000, but define pattern here)
-- Offer composite indexes (NI-21)
CREATE INDEX IF NOT EXISTS "offers_buy_listing_id_status_idx"  ON "offers"("buy_listing_id", "status");
CREATE INDEX IF NOT EXISTS "offers_sale_listing_id_status_idx" ON "offers"("sale_listing_id", "status");

-- SaleListing / BuyListing composite indexes (NI-21)
CREATE INDEX IF NOT EXISTS "sale_listings_product_id_status_idx" ON "sale_listings"("product_id", "status");
CREATE INDEX IF NOT EXISTS "buy_listings_product_id_status_idx"  ON "buy_listings"("product_id", "status");

-- TransportBid composite indexes (NI-21)
CREATE INDEX IF NOT EXISTS "transport_bids_status_expires_at_idx" ON "transport_bids"("status", "expires_at");

-- OfferNegotiation composite indexes (NI-21)
CREATE INDEX IF NOT EXISTS "offer_negotiations_status_expires_at_idx"
    ON "offer_negotiations"("status", "expires_at");

-- TransportJob composite indexes (NI-21)
CREATE INDEX IF NOT EXISTS "transport_jobs_transporter_id_status_idx"
    ON "transport_jobs"("transporter_id", "status");

-- TradeNote composite indexes (NI-21)
CREATE INDEX IF NOT EXISTS "trade_notes_trade_operation_id_author_id_idx"
    ON "trade_notes"("trade_operation_id", "author_id");

-- TradeStateHistory composite indexes (NI-21)
CREATE INDEX IF NOT EXISTS "trade_state_history_trade_operation_id_changed_at_idx"
    ON "trade_state_history"("trade_operation_id", "changed_at");

-- User role+active composite index (NI-21)
CREATE INDEX IF NOT EXISTS "users_role_is_active_idx" ON "users"("role", "is_active");
