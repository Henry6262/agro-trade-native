-- Baseline reconciliation for the pre-production prototype schema.
--
-- This migration deliberately retires the legacy catalog/listing tables and
-- must not be applied blindly to a populated environment. Back up and inspect
-- real data first, then rehearse a data-preserving mapping or mark an already
-- materialized equivalent as applied with `prisma migrate resolve`.

-- Fail closed when this retroactive migration is discovered by an environment
-- that already advanced past it, or when any application table contains data.
-- Fresh CI databases are empty here; real environments need an explicit,
-- rehearsed baseline or data-preserving migration instead.
DO $$
DECLARE
    application_table RECORD;
    table_has_rows BOOLEAN;
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "_prisma_migrations"
        WHERE migration_name > '20260307000000_reconcile_core_trade_schema'
          AND finished_at IS NOT NULL
          AND rolled_back_at IS NULL
    ) THEN
        RAISE EXCEPTION USING
            MESSAGE = 'Unsafe retroactive reconciliation blocked: later migrations are already recorded.',
            HINT = 'Rehearse a data-preserving baseline and use prisma migrate resolve only after verifying schema equivalence.';
    END IF;

    FOR application_table IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '_prisma_migrations'
    LOOP
        EXECUTE format(
            'SELECT EXISTS (SELECT 1 FROM %I.%I LIMIT 1)',
            'public',
            application_table.tablename
        ) INTO table_has_rows;

        IF table_has_rows THEN
            RAISE EXCEPTION USING
                MESSAGE = format(
                    'Unsafe reconciliation blocked: public.%I contains data.',
                    application_table.tablename
                ),
                HINT = 'Back up the database and create a reviewed, data-preserving migration plan before proceeding.';
        END IF;
    END LOOP;
END $$;

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('BILLING', 'SHIPPING', 'FARM', 'WAREHOUSE', 'OFFICE', 'PICKUP', 'DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('NUMBER', 'TEXT', 'BOOLEAN', 'ENUM');

-- CreateEnum
CREATE TYPE "Importance" AS ENUM ('CRITICAL', 'IMPORTANT', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "QualityImpact" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "Strictness" AS ENUM ('MANDATORY', 'PREFERRED', 'OPTIONAL');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('ACTIVE', 'FULFILLED', 'PARTIALLY_FULFILLED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN', 'NEGOTIATING');

-- CreateEnum
CREATE TYPE "OfferCreator" AS ENUM ('PLATFORM', 'SELLER', 'BUYER');

-- CreateEnum
CREATE TYPE "TradePhase" AS ENUM ('INITIATION', 'SELLER_MATCHING', 'SELLER_NEGOTIATION', 'INSPECTION_PENDING', 'TRANSPORT_MATCHING', 'TRANSPORT_BIDDING', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "SellerStatus" AS ENUM ('INVITED', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'CONFIRMED', 'WITHDRAWN', 'FAILED_INSPECTION');

-- CreateEnum
CREATE TYPE "TransporterStatus" AS ENUM ('INVITED', 'BIDDING', 'SELECTED', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfferParty" AS ENUM ('BUYER', 'SELLER', 'PLATFORM');

-- CreateEnum
CREATE TYPE "OfferResponse" AS ENUM ('ACCEPTED', 'REJECTED', 'COUNTERED');

-- CreateEnum
CREATE TYPE "InspectionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "TransportRequestStatus" AS ENUM ('OPEN', 'BIDDING', 'EVALUATING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('STANDARD', 'URGENT', 'EXPRESS', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "TransportJobStatus" AS ENUM ('ASSIGNED', 'STARTED', 'PICKING_UP', 'IN_TRANSIT', 'DELIVERING', 'COMPLETED', 'DELAYED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "DriverType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "AdminLevel" AS ENUM ('OWNER', 'MANAGER', 'DISPATCHER', 'VIEWER');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('AGROTRADE', 'COMPANY', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('OFFLINE', 'AVAILABLE', 'ON_BREAK', 'ASSIGNED', 'EN_ROUTE', 'AT_PICKUP', 'IN_TRANSIT', 'AT_DELIVERY', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CompanyDocumentType" AS ENUM ('REGISTRATION_CERTIFICATE', 'OPERATING_LICENSE', 'INSURANCE_CERTIFICATE', 'TAX_CERTIFICATE', 'SAFETY_CERTIFICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "DriverDocumentType" AS ENUM ('DRIVING_LICENSE', 'MEDICAL_CERTIFICATE', 'TRAINING_CERTIFICATE', 'IDENTITY_CARD', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProductUnit" ADD VALUE 'LITER';
ALTER TYPE "ProductUnit" ADD VALUE 'PIECE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'COMPANY_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'INSPECTOR';

-- DropForeignKey
ALTER TABLE "base_demands" DROP CONSTRAINT "base_demands_base_id_fkey";

-- DropForeignKey
ALTER TABLE "base_demands" DROP CONSTRAINT "base_demands_product_id_fkey";

-- DropForeignKey
ALTER TABLE "base_demands" DROP CONSTRAINT "base_demands_user_id_fkey";

-- DropForeignKey
ALTER TABLE "base_stocks" DROP CONSTRAINT "base_stocks_base_id_fkey";

-- DropForeignKey
ALTER TABLE "base_stocks" DROP CONSTRAINT "base_stocks_product_id_fkey";

-- DropForeignKey
ALTER TABLE "base_stocks" DROP CONSTRAINT "base_stocks_user_id_fkey";

-- DropForeignKey
ALTER TABLE "bases" DROP CONSTRAINT "bases_user_id_fkey";

-- DropForeignKey
ALTER TABLE "buyer_profiles" DROP CONSTRAINT "buyer_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "city_pricing_zones" DROP CONSTRAINT "city_pricing_zones_city_id_fkey";

-- DropForeignKey
ALTER TABLE "city_pricing_zones" DROP CONSTRAINT "city_pricing_zones_pricing_zone_id_fkey";

-- DropForeignKey
ALTER TABLE "company_info" DROP CONSTRAINT "company_info_user_id_fkey";

-- DropForeignKey
ALTER TABLE "farmer_profiles" DROP CONSTRAINT "farmer_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "fleet_vehicles" DROP CONSTRAINT "fleet_vehicles_transporter_id_fkey";

-- DropForeignKey
ALTER TABLE "kyc_documents" DROP CONSTRAINT "kyc_documents_user_id_fkey";

-- DropForeignKey
ALTER TABLE "market_conditions" DROP CONSTRAINT "market_conditions_pricing_zone_id_fkey";

-- DropForeignKey
ALTER TABLE "product_listings" DROP CONSTRAINT "product_listings_base_id_fkey";

-- DropForeignKey
ALTER TABLE "product_listings" DROP CONSTRAINT "product_listings_product_id_fkey";

-- DropForeignKey
ALTER TABLE "product_listings" DROP CONSTRAINT "product_listings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "product_prices" DROP CONSTRAINT "product_prices_pricing_zone_id_fkey";

-- DropForeignKey
ALTER TABLE "product_prices" DROP CONSTRAINT "product_prices_product_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_farmer_id_fkey";

-- DropForeignKey
ALTER TABLE "regions" DROP CONSTRAINT "regions_country_id_fkey";

-- DropForeignKey
ALTER TABLE "seasonal_pricing" DROP CONSTRAINT "seasonal_pricing_pricing_zone_id_fkey";

-- DropForeignKey
ALTER TABLE "seasonal_pricing" DROP CONSTRAINT "seasonal_pricing_product_id_fkey";

-- DropForeignKey
ALTER TABLE "transporter_profiles" DROP CONSTRAINT "transporter_profiles_user_id_fkey";

-- DropForeignKey
ALTER TABLE "trucks" DROP CONSTRAINT "trucks_transporter_id_fkey";

-- DropForeignKey
ALTER TABLE "user_location_profiles" DROP CONSTRAINT "user_location_profiles_city_id_fkey";

-- DropForeignKey
ALTER TABLE "user_location_profiles" DROP CONSTRAINT "user_location_profiles_user_id_fkey";

-- DropIndex
DROP INDEX "cities_latitude_longitude_idx";

-- DropIndex
DROP INDEX "cities_region_id_name_key";

-- DropIndex
DROP INDEX "products_farmer_id_idx";

-- DropIndex
DROP INDEX "products_status_idx";

-- DropIndex
DROP INDEX "regions_country_id_idx";

-- DropIndex
DROP INDEX "regions_country_id_name_key";

-- DropIndex
DROP INDEX "trucks_transporter_id_idx";

-- DropIndex
DROP INDEX "users_google_id_key";

-- AlterTable
ALTER TABLE "cities" DROP COLUMN "is_active",
DROP COLUMN "is_capital",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "population";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "farmer_id",
DROP COLUMN "harvest_date",
DROP COLUMN "location",
DROP COLUMN "price_per_unit",
DROP COLUMN "quantity",
DROP COLUMN "status",
DROP COLUMN "unit",
ADD COLUMN     "default_unit" "ProductUnit" NOT NULL DEFAULT 'TON',
ADD COLUMN     "display_name" TEXT NOT NULL,
ADD COLUMN     "harvest_season" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "price_range_max" DECIMAL(10,2),
ADD COLUMN     "price_range_min" DECIMAL(10,2),
ADD COLUMN     "sort_order" INTEGER,
ADD COLUMN     "storage_recommendations" TEXT;

-- AlterTable
ALTER TABLE "regions" DROP COLUMN "code",
DROP COLUMN "country_id",
ADD COLUMN     "country" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "trucks" DROP COLUMN "active",
DROP COLUMN "capacity_kg",
DROP COLUMN "transporter_id",
ADD COLUMN     "capacity" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "current_driver_id" TEXT,
ADD COLUMN     "current_location" TEXT,
ADD COLUMN     "is_available" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "owner_id" TEXT NOT NULL,
ADD COLUMN     "owner_type" "OwnerType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "transport_company_id" TEXT,
ADD COLUMN     "unit" "ProductUnit" NOT NULL DEFAULT 'TON';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "google_id",
DROP COLUMN "phone",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_login" TIMESTAMP(3),
ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "phone_number" TEXT,
ALTER COLUMN "role" SET DEFAULT 'BUYER';

-- DropTable
DROP TABLE "base_demands";

-- DropTable
DROP TABLE "base_stocks";

-- DropTable
DROP TABLE "bases";

-- DropTable
DROP TABLE "buyer_profiles";

-- DropTable
DROP TABLE "city_pricing_zones";

-- DropTable
DROP TABLE "company_info";

-- DropTable
DROP TABLE "countries";

-- DropTable
DROP TABLE "farmer_profiles";

-- DropTable
DROP TABLE "fleet_vehicles";

-- DropTable
DROP TABLE "kyc_documents";

-- DropTable
DROP TABLE "market_conditions";

-- DropTable
DROP TABLE "pricing_zones";

-- DropTable
DROP TABLE "product_catalog";

-- DropTable
DROP TABLE "product_listings";

-- DropTable
DROP TABLE "product_prices";

-- DropTable
DROP TABLE "seasonal_pricing";

-- DropTable
DROP TABLE "transporter_profiles";

-- DropTable
DROP TABLE "user_location_profiles";

-- Replace enums only after the retired tables that still depend on their old
-- definitions have been removed.  The generated diff originally tried to
-- alter tables that are introduced later in this migration.
CREATE TYPE "ListingStatus_new" AS ENUM ('ACTIVE', 'SOLD', 'PENDING', 'EXPIRED', 'CANCELLED');
ALTER TYPE "ListingStatus" RENAME TO "ListingStatus_old";
ALTER TYPE "ListingStatus_new" RENAME TO "ListingStatus";
DROP TYPE "ListingStatus_old";

CREATE TYPE "ProductCategory_new" AS ENUM ('SOFT_WHEAT', 'DURUM_WHEAT', 'CORN_MAIZE', 'BARLEY', 'OATS', 'SUNFLOWER', 'RAPESEED', 'PEAS', 'SOYBEAN_MEAL', 'WHEAT_BRAN', 'ALFALFA', 'OTHER');
ALTER TABLE "products" ALTER COLUMN "category" TYPE "ProductCategory_new"
USING (
    CASE "category"::text
        WHEN 'WHEAT' THEN 'SOFT_WHEAT'
        WHEN 'CORN' THEN 'CORN_MAIZE'
        ELSE "category"::text
    END::"ProductCategory_new"
);
ALTER TYPE "ProductCategory" RENAME TO "ProductCategory_old";
ALTER TYPE "ProductCategory_new" RENAME TO "ProductCategory";
DROP TYPE "ProductCategory_old";

CREATE TYPE "TruckType_new" AS ENUM ('FLATBED', 'REFRIGERATED', 'TANKER', 'CONTAINER', 'CURTAIN_SIDE', 'BOX_TRUCK', 'OTHER');
ALTER TABLE "trucks" ALTER COLUMN "type" TYPE "TruckType_new"
USING (
    CASE "type"::text
        WHEN 'REEFER' THEN 'REFRIGERATED'
        ELSE "type"::text
    END::"TruckType_new"
);
ALTER TYPE "TruckType" RENAME TO "TruckType_old";
ALTER TYPE "TruckType_new" RENAME TO "TruckType";
DROP TYPE "TruckType_old";

-- DropEnum
DROP TYPE "BaseType";

-- DropEnum
DROP TYPE "DocumentType";

-- DropEnum
DROP TYPE "ListingType";

-- DropEnum
DROP TYPE "ProductStatus";

-- DropEnum
DROP TYPE "StockStatus";

-- DropEnum
DROP TYPE "VerificationStatus";

-- CreateTable
CREATE TABLE "phone_otps" (
    "id" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phone_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "registration_number" TEXT,
    "vat_number" TEXT,
    "phone_number" TEXT,
    "email" TEXT,
    "website" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "company_id" TEXT,
    "address_type" "AddressType" NOT NULL,
    "label" TEXT,
    "street" TEXT,
    "city_id" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specification_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "dataType" "DataType" NOT NULL,
    "enumOptions" JSONB,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specification_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_spec_templates" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "spec_type_id" TEXT NOT NULL,
    "importance" "Importance" NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_spec_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_listings" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "address_id" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" "ProductUnit" NOT NULL DEFAULT 'TON',
    "asking_price" DECIMAL(10,2),
    "harvest_date" TIMESTAMP(3),
    "quality_score" INTEGER,
    "quality_grade" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buy_listings" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "delivery_address_id" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" "ProductUnit" NOT NULL DEFAULT 'TON',
    "max_price_per_unit" DECIMAL(10,2),
    "needed_by" TIMESTAMP(3),
    "status" "RequestStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buy_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_specs" (
    "id" TEXT NOT NULL,
    "sale_listing_id" TEXT,
    "buy_listing_id" TEXT,
    "spec_type_id" TEXT NOT NULL,
    "value_number" DOUBLE PRECISION,
    "value_text" TEXT,
    "value_bool" BOOLEAN,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "quality_impact" "QualityImpact",
    "strictness" "Strictness",
    "price_adjustment_per_unit" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "sale_listing_id" TEXT,
    "buy_listing_id" TEXT,
    "offered_price" DECIMAL(10,2) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" "ProductUnit" NOT NULL DEFAULT 'TON',
    "match_score" INTEGER NOT NULL,
    "match_details" JSONB,
    "base_price" DECIMAL(10,2) NOT NULL,
    "quality_adjustment" DECIMAL(10,2),
    "quantity_discount" DECIMAL(10,2),
    "transport_cost" DECIMAL(10,2),
    "final_price" DECIMAL(10,2) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "delivery_terms" TEXT,
    "payment_terms" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "created_by" "OfferCreator" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regional_prices" (
    "id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "price_per_unit" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "unit" "ProductUnit" NOT NULL DEFAULT 'TON',
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regional_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_operations" (
    "id" TEXT NOT NULL,
    "operation_number" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "buy_listing_id" TEXT NOT NULL,
    "phase" "TradePhase" NOT NULL DEFAULT 'INITIATION',
    "status" "TradeStatus" NOT NULL DEFAULT 'ACTIVE',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "total_purchase_cost" DECIMAL(10,2),
    "avg_purchase_price" DECIMAL(10,2),
    "selling_price" DECIMAL(10,2),
    "total_revenue" DECIMAL(10,2),
    "estimated_transport_cost" DECIMAL(10,2),
    "actual_transport_cost" DECIMAL(10,2),
    "total_distance_km" DOUBLE PRECISION,
    "estimated_profit" DECIMAL(10,2),
    "actual_profit" DECIMAL(10,2),
    "profit_margin" DOUBLE PRECISION,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_sellers" (
    "id" TEXT NOT NULL,
    "trade_operation_id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "sale_listing_id" TEXT NOT NULL,
    "requested_quantity" DECIMAL(10,2) NOT NULL,
    "offered_quantity" DECIMAL(10,2) NOT NULL,
    "agreed_quantity" DECIMAL(10,2),
    "unit" "ProductUnit" NOT NULL DEFAULT 'TON',
    "agreed_price" DECIMAL(10,2),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "match_score" INTEGER,
    "status" "SellerStatus" NOT NULL DEFAULT 'INVITED',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "trade_sellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_transporters" (
    "id" TEXT NOT NULL,
    "trade_operation_id" TEXT NOT NULL,
    "transporter_id" TEXT NOT NULL,
    "pickup_seller_id" TEXT,
    "route" JSONB,
    "estimated_distance" DOUBLE PRECISION,
    "estimated_duration" INTEGER,
    "agreed_price" DECIMAL(10,2),
    "vehicle_id" TEXT,
    "status" "TransporterStatus" NOT NULL DEFAULT 'INVITED',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),

    CONSTRAINT "trade_transporters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_negotiations" (
    "id" TEXT NOT NULL,
    "trade_operation_id" TEXT NOT NULL,
    "trade_seller_id" TEXT NOT NULL,
    "status" "NegotiationStatus" NOT NULL DEFAULT 'PENDING',
    "current_offer" JSONB NOT NULL,
    "counter_offer" JSONB,
    "offer_history" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "final_price" DECIMAL(10,2),
    "final_quantity" DECIMAL(10,2),
    "unit" "ProductUnit" NOT NULL DEFAULT 'TON',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "concluded_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_negotiations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_rounds" (
    "id" TEXT NOT NULL,
    "negotiation_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "offered_by" "OfferParty" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "terms" TEXT,
    "response" "OfferResponse",
    "response_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "offer_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_requests" (
    "id" TEXT NOT NULL,
    "trade_operation_id" TEXT,
    "sale_listing_id" TEXT NOT NULL,
    "inspector_id" TEXT,
    "priority" "InspectionPriority" NOT NULL DEFAULT 'MEDIUM',
    "requested_date" TIMESTAMP(3),
    "scheduled_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "status" "InspectionStatus" NOT NULL DEFAULT 'PENDING',
    "quality_score" INTEGER,
    "verification_result" JSONB,
    "notes" TEXT,
    "photos" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_requests" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "trade_operation_id" TEXT NOT NULL,
    "total_weight" DOUBLE PRECISION NOT NULL,
    "required_vehicle_type" "TruckType",
    "special_requirements" TEXT[],
    "pickup_points" JSONB NOT NULL,
    "delivery_point" JSONB NOT NULL,
    "estimated_distance" DOUBLE PRECISION,
    "pickup_window_start" TIMESTAMP(3),
    "pickup_window_end" TIMESTAMP(3),
    "delivery_deadline" TIMESTAMP(3),
    "urgency_level" "UrgencyLevel" NOT NULL DEFAULT 'STANDARD',
    "status" "TransportRequestStatus" NOT NULL DEFAULT 'OPEN',
    "bidding_deadline" TIMESTAMP(3) NOT NULL,
    "max_budget" DECIMAL(10,2),
    "selected_bid_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_bids" (
    "id" TEXT NOT NULL,
    "transport_request_id" TEXT NOT NULL,
    "trade_operation_id" TEXT NOT NULL,
    "transporter_id" TEXT NOT NULL,
    "transport_company_id" TEXT,
    "bid_amount" DECIMAL(10,2) NOT NULL,
    "estimated_duration" INTEGER NOT NULL,
    "vehicle_type" "TruckType" NOT NULL,
    "vehicle_capacity" DOUBLE PRECISION NOT NULL,
    "assigned_truck_id" TEXT,
    "special_equipment" TEXT[],
    "insurance_coverage" DECIMAL(10,2),
    "proposed_route" JSONB,
    "pickup_schedule" JSONB,
    "status" "BidStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "evaluated_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "transport_bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_jobs" (
    "id" TEXT NOT NULL,
    "job_number" TEXT NOT NULL,
    "transport_request_id" TEXT NOT NULL,
    "transport_bid_id" TEXT NOT NULL,
    "trade_operation_id" TEXT NOT NULL,
    "transporter_id" TEXT NOT NULL,
    "assigned_driver_id" TEXT,
    "transport_company_id" TEXT,
    "status" "TransportJobStatus" NOT NULL DEFAULT 'ASSIGNED',
    "pickups_completed" JSONB NOT NULL DEFAULT '[]',
    "all_pickups_complete" BOOLEAN NOT NULL DEFAULT false,
    "current_location" JSONB,
    "estimated_arrival" TIMESTAMP(3),
    "actual_delivery" TIMESTAMP(3),
    "pickup_photos" TEXT[],
    "delivery_photos" TEXT[],
    "proof_of_delivery" TEXT,
    "on_time_pickup" BOOLEAN,
    "on_time_delivery" BOOLEAN,
    "customer_rating" INTEGER,
    "notes" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_state_history" (
    "id" TEXT NOT NULL,
    "trade_operation_id" TEXT NOT NULL,
    "from_phase" "TradePhase",
    "to_phase" "TradePhase" NOT NULL,
    "from_status" "TradeStatus",
    "to_status" "TradeStatus",
    "changed_by" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_state_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_notes" (
    "id" TEXT NOT NULL,
    "trade_operation_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT true,
    "attachments" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_cost_calculations" (
    "id" TEXT NOT NULL,
    "trade_operation_id" TEXT NOT NULL,
    "pickup_points" JSONB NOT NULL,
    "delivery_point" JSONB NOT NULL,
    "optimal_route" JSONB,
    "total_distance" DOUBLE PRECISION NOT NULL,
    "base_rate_per_km" DECIMAL(10,4) NOT NULL,
    "vehicle_type" "TruckType",
    "distance_cost" DECIMAL(10,2) NOT NULL,
    "loading_costs" DECIMAL(10,2),
    "urgency_surcharge" DECIMAL(10,2),
    "total_cost" DECIMAL(10,2) NOT NULL,
    "calculated_by" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transport_cost_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profit_estimations" (
    "id" TEXT NOT NULL,
    "trade_operation_id" TEXT NOT NULL,
    "proposed_buyer_price" DECIMAL(10,2) NOT NULL,
    "proposed_seller_prices" JSONB NOT NULL,
    "estimated_revenue" DECIMAL(10,2) NOT NULL,
    "estimated_purchase_cost" DECIMAL(10,2) NOT NULL,
    "estimated_transport_cost" DECIMAL(10,2) NOT NULL,
    "estimated_profit" DECIMAL(10,2) NOT NULL,
    "profit_margin" DOUBLE PRECISION NOT NULL,
    "price_volatility_risk" DOUBLE PRECISION,
    "quality_risk" DOUBLE PRECISION,
    "transport_risk" DOUBLE PRECISION,
    "overall_risk" DOUBLE PRECISION,
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profit_estimations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_cost_settings" (
    "id" TEXT NOT NULL,
    "base_rate_per_km" DECIMAL(10,4) NOT NULL DEFAULT 0.15,
    "flatbed_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "refrigerated_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.3,
    "tanker_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.2,
    "container_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.1,
    "tier1_max_km" INTEGER NOT NULL DEFAULT 50,
    "tier1_rate" DECIMAL(10,4) NOT NULL DEFAULT 0.15,
    "tier2_max_km" INTEGER NOT NULL DEFAULT 200,
    "tier2_rate" DECIMAL(10,4) NOT NULL DEFAULT 0.13,
    "tier3_rate" DECIMAL(10,4) NOT NULL DEFAULT 0.11,
    "loading_cost_per_ton" DECIMAL(10,2) NOT NULL DEFAULT 0.50,
    "urgency_surcharge" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_cost_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_companies" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "vat_number" TEXT,
    "main_email" TEXT NOT NULL,
    "main_phone" TEXT NOT NULL,
    "website" TEXT,
    "company_type" "CompanyType" NOT NULL DEFAULT 'EXTERNAL',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "operating_regions" TEXT[],
    "specializations" TEXT[],
    "fleet_size" INTEGER NOT NULL DEFAULT 0,
    "total_jobs_completed" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DOUBLE PRECISION,
    "on_time_delivery_rate" DOUBLE PRECISION,
    "credit_limit" DECIMAL(10,2),
    "current_balance" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_admins" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transport_company_id" TEXT NOT NULL,
    "admin_level" "AdminLevel" NOT NULL DEFAULT 'MANAGER',
    "can_manage_drivers" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_fleet" BOOLEAN NOT NULL DEFAULT true,
    "can_submit_bids" BOOLEAN NOT NULL DEFAULT true,
    "can_manage_finances" BOOLEAN NOT NULL DEFAULT false,
    "can_view_reports" BOOLEAN NOT NULL DEFAULT true,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "driver_type" "DriverType" NOT NULL,
    "user_id" TEXT,
    "transport_company_id" TEXT,
    "email" TEXT,
    "phone_number" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "license_number" TEXT NOT NULL,
    "license_class" TEXT[],
    "license_expiry_date" TIMESTAMP(3) NOT NULL,
    "medical_certificate_expiry" TIMESTAMP(3),
    "last_safety_training" TIMESTAMP(3),
    "status" "DriverStatus" NOT NULL DEFAULT 'OFFLINE',
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "current_location" JSONB,
    "last_location_update" TIMESTAMP(3),
    "current_job_id" TEXT,
    "total_jobs" INTEGER NOT NULL DEFAULT 0,
    "total_distance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_rating" DOUBLE PRECISION,
    "on_time_rate" DOUBLE PRECISION,
    "weekly_hours_worked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_rest_period" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_documents" (
    "id" TEXT NOT NULL,
    "transport_company_id" TEXT NOT NULL,
    "document_type" "CompanyDocumentType" NOT NULL,
    "document_number" TEXT,
    "document_url" TEXT NOT NULL,
    "issued_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_documents" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "document_type" "DriverDocumentType" NOT NULL,
    "document_number" TEXT,
    "document_url" TEXT NOT NULL,
    "issued_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "phone_otps_phone_used_expires_at_idx" ON "phone_otps"("phone", "used", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "companies_user_id_key" ON "companies"("user_id");

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE INDEX "addresses_company_id_idx" ON "addresses"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "specification_types_code_key" ON "specification_types"("code");

-- CreateIndex
CREATE INDEX "product_spec_templates_product_id_idx" ON "product_spec_templates"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_spec_templates_product_id_spec_type_id_key" ON "product_spec_templates"("product_id", "spec_type_id");

-- CreateIndex
CREATE INDEX "sale_listings_seller_id_idx" ON "sale_listings"("seller_id");

-- CreateIndex
CREATE INDEX "sale_listings_product_id_idx" ON "sale_listings"("product_id");

-- CreateIndex
CREATE INDEX "sale_listings_address_id_idx" ON "sale_listings"("address_id");

-- CreateIndex
CREATE INDEX "sale_listings_status_idx" ON "sale_listings"("status");

-- CreateIndex
CREATE INDEX "buy_listings_buyer_id_idx" ON "buy_listings"("buyer_id");

-- CreateIndex
CREATE INDEX "buy_listings_product_id_idx" ON "buy_listings"("product_id");

-- CreateIndex
CREATE INDEX "buy_listings_delivery_address_id_idx" ON "buy_listings"("delivery_address_id");

-- CreateIndex
CREATE INDEX "buy_listings_status_idx" ON "buy_listings"("status");

-- CreateIndex
CREATE INDEX "listing_specs_sale_listing_id_idx" ON "listing_specs"("sale_listing_id");

-- CreateIndex
CREATE INDEX "listing_specs_buy_listing_id_idx" ON "listing_specs"("buy_listing_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_specs_sale_listing_id_spec_type_id_key" ON "listing_specs"("sale_listing_id", "spec_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "listing_specs_buy_listing_id_spec_type_id_key" ON "listing_specs"("buy_listing_id", "spec_type_id");

-- CreateIndex
CREATE INDEX "offers_sale_listing_id_idx" ON "offers"("sale_listing_id");

-- CreateIndex
CREATE INDEX "offers_buy_listing_id_idx" ON "offers"("buy_listing_id");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "offers"("status");

-- CreateIndex
CREATE INDEX "regional_prices_city_id_idx" ON "regional_prices"("city_id");

-- CreateIndex
CREATE INDEX "regional_prices_product_id_idx" ON "regional_prices"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "regional_prices_city_id_product_id_key" ON "regional_prices"("city_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "trade_operations_operation_number_key" ON "trade_operations"("operation_number");

-- CreateIndex
CREATE UNIQUE INDEX "trade_operations_buy_listing_id_key" ON "trade_operations"("buy_listing_id");

-- CreateIndex
CREATE INDEX "trade_operations_admin_id_idx" ON "trade_operations"("admin_id");

-- CreateIndex
CREATE INDEX "trade_operations_buy_listing_id_idx" ON "trade_operations"("buy_listing_id");

-- CreateIndex
CREATE INDEX "trade_operations_phase_idx" ON "trade_operations"("phase");

-- CreateIndex
CREATE INDEX "trade_operations_status_idx" ON "trade_operations"("status");

-- CreateIndex
CREATE INDEX "trade_sellers_trade_operation_id_idx" ON "trade_sellers"("trade_operation_id");

-- CreateIndex
CREATE INDEX "trade_sellers_seller_id_idx" ON "trade_sellers"("seller_id");

-- CreateIndex
CREATE INDEX "trade_sellers_sale_listing_id_idx" ON "trade_sellers"("sale_listing_id");

-- CreateIndex
CREATE INDEX "trade_sellers_status_idx" ON "trade_sellers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trade_sellers_trade_operation_id_sale_listing_id_key" ON "trade_sellers"("trade_operation_id", "sale_listing_id");

-- CreateIndex
CREATE INDEX "trade_transporters_trade_operation_id_idx" ON "trade_transporters"("trade_operation_id");

-- CreateIndex
CREATE INDEX "trade_transporters_transporter_id_idx" ON "trade_transporters"("transporter_id");

-- CreateIndex
CREATE INDEX "trade_transporters_status_idx" ON "trade_transporters"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trade_transporters_trade_operation_id_transporter_id_key" ON "trade_transporters"("trade_operation_id", "transporter_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_negotiations_trade_seller_id_key" ON "offer_negotiations"("trade_seller_id");

-- CreateIndex
CREATE INDEX "offer_negotiations_trade_operation_id_idx" ON "offer_negotiations"("trade_operation_id");

-- CreateIndex
CREATE INDEX "offer_negotiations_trade_seller_id_idx" ON "offer_negotiations"("trade_seller_id");

-- CreateIndex
CREATE INDEX "offer_negotiations_status_idx" ON "offer_negotiations"("status");

-- CreateIndex
CREATE INDEX "offer_negotiations_expires_at_idx" ON "offer_negotiations"("expires_at");

-- CreateIndex
CREATE INDEX "offer_rounds_negotiation_id_idx" ON "offer_rounds"("negotiation_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_rounds_negotiation_id_round_number_key" ON "offer_rounds"("negotiation_id", "round_number");

-- CreateIndex
CREATE INDEX "inspection_requests_trade_operation_id_idx" ON "inspection_requests"("trade_operation_id");

-- CreateIndex
CREATE INDEX "inspection_requests_sale_listing_id_idx" ON "inspection_requests"("sale_listing_id");

-- CreateIndex
CREATE INDEX "inspection_requests_inspector_id_idx" ON "inspection_requests"("inspector_id");

-- CreateIndex
CREATE INDEX "inspection_requests_status_idx" ON "inspection_requests"("status");

-- CreateIndex
CREATE INDEX "inspection_requests_priority_idx" ON "inspection_requests"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "transport_requests_request_number_key" ON "transport_requests"("request_number");

-- CreateIndex
CREATE UNIQUE INDEX "transport_requests_trade_operation_id_key" ON "transport_requests"("trade_operation_id");

-- CreateIndex
CREATE UNIQUE INDEX "transport_requests_selected_bid_id_key" ON "transport_requests"("selected_bid_id");

-- CreateIndex
CREATE INDEX "transport_requests_status_idx" ON "transport_requests"("status");

-- CreateIndex
CREATE INDEX "transport_requests_urgency_level_idx" ON "transport_requests"("urgency_level");

-- CreateIndex
CREATE INDEX "transport_requests_bidding_deadline_idx" ON "transport_requests"("bidding_deadline");

-- CreateIndex
CREATE INDEX "transport_bids_transport_request_id_idx" ON "transport_bids"("transport_request_id");

-- CreateIndex
CREATE INDEX "transport_bids_trade_operation_id_idx" ON "transport_bids"("trade_operation_id");

-- CreateIndex
CREATE INDEX "transport_bids_transporter_id_idx" ON "transport_bids"("transporter_id");

-- CreateIndex
CREATE INDEX "transport_bids_status_idx" ON "transport_bids"("status");

-- CreateIndex
CREATE UNIQUE INDEX "transport_jobs_job_number_key" ON "transport_jobs"("job_number");

-- CreateIndex
CREATE UNIQUE INDEX "transport_jobs_transport_request_id_key" ON "transport_jobs"("transport_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "transport_jobs_transport_bid_id_key" ON "transport_jobs"("transport_bid_id");

-- CreateIndex
CREATE INDEX "transport_jobs_status_idx" ON "transport_jobs"("status");

-- CreateIndex
CREATE INDEX "transport_jobs_transporter_id_idx" ON "transport_jobs"("transporter_id");

-- CreateIndex
CREATE INDEX "transport_jobs_trade_operation_id_idx" ON "transport_jobs"("trade_operation_id");

-- CreateIndex
CREATE INDEX "trade_state_history_trade_operation_id_idx" ON "trade_state_history"("trade_operation_id");

-- CreateIndex
CREATE INDEX "trade_state_history_changed_by_idx" ON "trade_state_history"("changed_by");

-- CreateIndex
CREATE INDEX "trade_state_history_changed_at_idx" ON "trade_state_history"("changed_at");

-- CreateIndex
CREATE INDEX "trade_notes_trade_operation_id_idx" ON "trade_notes"("trade_operation_id");

-- CreateIndex
CREATE INDEX "trade_notes_author_id_idx" ON "trade_notes"("author_id");

-- CreateIndex
CREATE INDEX "transport_cost_calculations_trade_operation_id_idx" ON "transport_cost_calculations"("trade_operation_id");

-- CreateIndex
CREATE INDEX "profit_estimations_trade_operation_id_idx" ON "profit_estimations"("trade_operation_id");

-- CreateIndex
CREATE INDEX "profit_estimations_created_at_idx" ON "profit_estimations"("created_at");

-- CreateIndex
CREATE INDEX "transport_cost_settings_is_active_effective_from_idx" ON "transport_cost_settings"("is_active", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "transport_companies_company_name_key" ON "transport_companies"("company_name");

-- CreateIndex
CREATE UNIQUE INDEX "transport_companies_registration_number_key" ON "transport_companies"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "transport_companies_vat_number_key" ON "transport_companies"("vat_number");

-- CreateIndex
CREATE UNIQUE INDEX "transport_companies_main_email_key" ON "transport_companies"("main_email");

-- CreateIndex
CREATE INDEX "transport_companies_company_type_idx" ON "transport_companies"("company_type");

-- CreateIndex
CREATE INDEX "transport_companies_is_verified_idx" ON "transport_companies"("is_verified");

-- CreateIndex
CREATE UNIQUE INDEX "company_admins_user_id_key" ON "company_admins"("user_id");

-- CreateIndex
CREATE INDEX "company_admins_transport_company_id_idx" ON "company_admins"("transport_company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_admins_user_id_transport_company_id_key" ON "company_admins"("user_id", "transport_company_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_user_id_key" ON "drivers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_email_key" ON "drivers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_phone_number_key" ON "drivers"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_license_number_key" ON "drivers"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "drivers_current_job_id_key" ON "drivers"("current_job_id");

-- CreateIndex
CREATE INDEX "drivers_driver_type_idx" ON "drivers"("driver_type");

-- CreateIndex
CREATE INDEX "drivers_transport_company_id_idx" ON "drivers"("transport_company_id");

-- CreateIndex
CREATE INDEX "drivers_status_idx" ON "drivers"("status");

-- CreateIndex
CREATE INDEX "drivers_is_available_idx" ON "drivers"("is_available");

-- CreateIndex
CREATE INDEX "company_documents_transport_company_id_idx" ON "company_documents"("transport_company_id");

-- CreateIndex
CREATE INDEX "company_documents_document_type_idx" ON "company_documents"("document_type");

-- CreateIndex
CREATE INDEX "driver_documents_driver_id_idx" ON "driver_documents"("driver_id");

-- CreateIndex
CREATE INDEX "driver_documents_document_type_idx" ON "driver_documents"("document_type");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_region_id_key" ON "cities"("name", "region_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_category_key" ON "products"("category");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_is_active_idx" ON "products"("is_active");

-- CreateIndex
CREATE INDEX "regions_country_idx" ON "regions"("country");

-- CreateIndex
CREATE UNIQUE INDEX "regions_name_country_key" ON "regions"("name", "country");

-- CreateIndex
CREATE UNIQUE INDEX "trucks_current_driver_id_key" ON "trucks"("current_driver_id");

-- CreateIndex
CREATE UNIQUE INDEX "trucks_plate_number_key" ON "trucks"("plate_number");

-- CreateIndex
CREATE INDEX "trucks_owner_id_idx" ON "trucks"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_spec_templates" ADD CONSTRAINT "product_spec_templates_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_spec_templates" ADD CONSTRAINT "product_spec_templates_spec_type_id_fkey" FOREIGN KEY ("spec_type_id") REFERENCES "specification_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_listings" ADD CONSTRAINT "sale_listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_listings" ADD CONSTRAINT "sale_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_listings" ADD CONSTRAINT "sale_listings_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_listings" ADD CONSTRAINT "buy_listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_listings" ADD CONSTRAINT "buy_listings_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_listings" ADD CONSTRAINT "buy_listings_delivery_address_id_fkey" FOREIGN KEY ("delivery_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_specs" ADD CONSTRAINT "listing_specs_sale_listing_id_fkey" FOREIGN KEY ("sale_listing_id") REFERENCES "sale_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_specs" ADD CONSTRAINT "listing_specs_buy_listing_id_fkey" FOREIGN KEY ("buy_listing_id") REFERENCES "buy_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_specs" ADD CONSTRAINT "listing_specs_spec_type_id_fkey" FOREIGN KEY ("spec_type_id") REFERENCES "specification_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_sale_listing_id_fkey" FOREIGN KEY ("sale_listing_id") REFERENCES "sale_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_buy_listing_id_fkey" FOREIGN KEY ("buy_listing_id") REFERENCES "buy_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regional_prices" ADD CONSTRAINT "regional_prices_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regional_prices" ADD CONSTRAINT "regional_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_transport_company_id_fkey" FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_current_driver_id_fkey" FOREIGN KEY ("current_driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_operations" ADD CONSTRAINT "trade_operations_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_operations" ADD CONSTRAINT "trade_operations_buy_listing_id_fkey" FOREIGN KEY ("buy_listing_id") REFERENCES "buy_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_sellers" ADD CONSTRAINT "trade_sellers_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_sellers" ADD CONSTRAINT "trade_sellers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_sellers" ADD CONSTRAINT "trade_sellers_sale_listing_id_fkey" FOREIGN KEY ("sale_listing_id") REFERENCES "sale_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_transporters" ADD CONSTRAINT "trade_transporters_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_transporters" ADD CONSTRAINT "trade_transporters_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_transporters" ADD CONSTRAINT "trade_transporters_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "trucks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_negotiations" ADD CONSTRAINT "offer_negotiations_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_negotiations" ADD CONSTRAINT "offer_negotiations_trade_seller_id_fkey" FOREIGN KEY ("trade_seller_id") REFERENCES "trade_sellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_rounds" ADD CONSTRAINT "offer_rounds_negotiation_id_fkey" FOREIGN KEY ("negotiation_id") REFERENCES "offer_negotiations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_sale_listing_id_fkey" FOREIGN KEY ("sale_listing_id") REFERENCES "sale_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_requests" ADD CONSTRAINT "transport_requests_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_requests" ADD CONSTRAINT "transport_requests_selected_bid_id_fkey" FOREIGN KEY ("selected_bid_id") REFERENCES "transport_bids"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bids" ADD CONSTRAINT "transport_bids_transport_request_id_fkey" FOREIGN KEY ("transport_request_id") REFERENCES "transport_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bids" ADD CONSTRAINT "transport_bids_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bids" ADD CONSTRAINT "transport_bids_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bids" ADD CONSTRAINT "transport_bids_transport_company_id_fkey" FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_bids" ADD CONSTRAINT "transport_bids_assigned_truck_id_fkey" FOREIGN KEY ("assigned_truck_id") REFERENCES "trucks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_transport_request_id_fkey" FOREIGN KEY ("transport_request_id") REFERENCES "transport_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_transport_bid_id_fkey" FOREIGN KEY ("transport_bid_id") REFERENCES "transport_bids"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_assigned_driver_id_fkey" FOREIGN KEY ("assigned_driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_jobs" ADD CONSTRAINT "transport_jobs_transport_company_id_fkey" FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_state_history" ADD CONSTRAINT "trade_state_history_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_state_history" ADD CONSTRAINT "trade_state_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_notes" ADD CONSTRAINT "trade_notes_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_notes" ADD CONSTRAINT "trade_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_cost_calculations" ADD CONSTRAINT "transport_cost_calculations_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_cost_calculations" ADD CONSTRAINT "transport_cost_calculations_calculated_by_fkey" FOREIGN KEY ("calculated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_estimations" ADD CONSTRAINT "profit_estimations_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_estimations" ADD CONSTRAINT "profit_estimations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_admins" ADD CONSTRAINT "company_admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_admins" ADD CONSTRAINT "company_admins_transport_company_id_fkey" FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_transport_company_id_fkey" FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drivers" ADD CONSTRAINT "drivers_current_job_id_fkey" FOREIGN KEY ("current_job_id") REFERENCES "transport_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_documents" ADD CONSTRAINT "company_documents_transport_company_id_fkey" FOREIGN KEY ("transport_company_id") REFERENCES "transport_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
