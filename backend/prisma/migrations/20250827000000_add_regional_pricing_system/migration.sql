-- Add Regional Pricing System
-- Migration: 20250827000000_add_regional_pricing_system

-- Create Countries table
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "flag_emoji" VARCHAR(10) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- Create Regions table
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "country_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" VARCHAR(10),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- Create Cities table
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "region_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "population" INTEGER,
    "is_capital" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- Create Pricing Zones table
CREATE TABLE "pricing_zones" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "market_size" TEXT,
    "transport_access" TEXT,
    "storage_capacity" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_zones_pkey" PRIMARY KEY ("id")
);

-- Create City Pricing Zones junction table
CREATE TABLE "city_pricing_zones" (
    "city_id" TEXT NOT NULL,
    "pricing_zone_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_pricing_zones_pkey" PRIMARY KEY ("city_id","pricing_zone_id")
);

-- Create Product Prices table
CREATE TABLE "product_prices" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "pricing_zone_id" TEXT NOT NULL,
    "min_price" DECIMAL(10,2) NOT NULL,
    "max_price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "unit" "ProductUnit" NOT NULL DEFAULT 'TON',
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_date" TIMESTAMP(3),
    "quality_grade" TEXT,
    "confidence_level" REAL,
    "data_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- Create Seasonal Pricing table
CREATE TABLE "seasonal_pricing" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "pricing_zone_id" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "start_month" INTEGER NOT NULL,
    "end_month" INTEGER NOT NULL,
    "price_multiplier" REAL NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasonal_pricing_pkey" PRIMARY KEY ("id")
);

-- Create Market Conditions table
CREATE TABLE "market_conditions" (
    "id" TEXT NOT NULL,
    "pricing_zone_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "supply_level" INTEGER NOT NULL,
    "demand_level" INTEGER NOT NULL,
    "weather_impact" REAL,
    "transport_cost" REAL,
    "notes" TEXT,
    "data_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "market_conditions_pkey" PRIMARY KEY ("id")
);

-- Create User Location Profiles table
CREATE TABLE "user_location_profiles" (
    "user_id" TEXT NOT NULL,
    "city_id" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "detected_city" TEXT,
    "detected_region" TEXT,
    "detected_country" TEXT,
    "geocoding_source" TEXT,
    "geocoding_accuracy" TEXT,
    "prefers_metric_units" BOOLEAN NOT NULL DEFAULT true,
    "prefers_local_currency" BOOLEAN NOT NULL DEFAULT true,
    "last_location_update" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_location_profiles_pkey" PRIMARY KEY ("user_id")
);

-- Create Unique Indexes
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");
CREATE UNIQUE INDEX "regions_country_id_name_key" ON "regions"("country_id", "name");
CREATE UNIQUE INDEX "cities_region_id_name_key" ON "cities"("region_id", "name");
CREATE UNIQUE INDEX "pricing_zones_name_key" ON "pricing_zones"("name");
CREATE UNIQUE INDEX "product_prices_product_id_pricing_zone_id_quality_grade_effective_date_key" ON "product_prices"("product_id", "pricing_zone_id", "quality_grade", "effective_date");
CREATE UNIQUE INDEX "seasonal_pricing_product_id_pricing_zone_id_season_key" ON "seasonal_pricing"("product_id", "pricing_zone_id", "season");
CREATE UNIQUE INDEX "market_conditions_pricing_zone_id_date_key" ON "market_conditions"("pricing_zone_id", "date");

-- Create Regular Indexes
CREATE INDEX "regions_country_id_idx" ON "regions"("country_id");
CREATE INDEX "cities_region_id_idx" ON "cities"("region_id");
CREATE INDEX "cities_latitude_longitude_idx" ON "cities"("latitude", "longitude");
CREATE INDEX "city_pricing_zones_city_id_idx" ON "city_pricing_zones"("city_id");
CREATE INDEX "city_pricing_zones_pricing_zone_id_idx" ON "city_pricing_zones"("pricing_zone_id");
CREATE INDEX "product_prices_product_id_idx" ON "product_prices"("product_id");
CREATE INDEX "product_prices_pricing_zone_id_idx" ON "product_prices"("pricing_zone_id");
CREATE INDEX "product_prices_effective_date_idx" ON "product_prices"("effective_date");
CREATE INDEX "seasonal_pricing_product_id_idx" ON "seasonal_pricing"("product_id");
CREATE INDEX "seasonal_pricing_pricing_zone_id_idx" ON "seasonal_pricing"("pricing_zone_id");
CREATE INDEX "market_conditions_pricing_zone_id_idx" ON "market_conditions"("pricing_zone_id");
CREATE INDEX "market_conditions_date_idx" ON "market_conditions"("date");
CREATE INDEX "user_location_profiles_city_id_idx" ON "user_location_profiles"("city_id");

-- Add Foreign Key Constraints
ALTER TABLE "regions" ADD CONSTRAINT "regions_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cities" ADD CONSTRAINT "cities_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "regions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "city_pricing_zones" ADD CONSTRAINT "city_pricing_zones_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "city_pricing_zones" ADD CONSTRAINT "city_pricing_zones_pricing_zone_id_fkey" FOREIGN KEY ("pricing_zone_id") REFERENCES "pricing_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_pricing_zone_id_fkey" FOREIGN KEY ("pricing_zone_id") REFERENCES "pricing_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seasonal_pricing" ADD CONSTRAINT "seasonal_pricing_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "seasonal_pricing" ADD CONSTRAINT "seasonal_pricing_pricing_zone_id_fkey" FOREIGN KEY ("pricing_zone_id") REFERENCES "pricing_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "market_conditions" ADD CONSTRAINT "market_conditions_pricing_zone_id_fkey" FOREIGN KEY ("pricing_zone_id") REFERENCES "pricing_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_location_profiles" ADD CONSTRAINT "user_location_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_location_profiles" ADD CONSTRAINT "user_location_profiles_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;