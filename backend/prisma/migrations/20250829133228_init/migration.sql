-- DropIndex
DROP INDEX "product_prices_pricing_zone_id_idx";

-- DropIndex
DROP INDEX "product_prices_product_id_idx";

-- DropIndex
DROP INDEX "seasonal_pricing_pricing_zone_id_idx";

-- DropIndex
DROP INDEX "seasonal_pricing_product_id_idx";

-- AlterTable
ALTER TABLE "countries" ALTER COLUMN "code" SET DATA TYPE TEXT,
ALTER COLUMN "flag_emoji" SET DATA TYPE TEXT,
ALTER COLUMN "currency_code" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "market_conditions" ALTER COLUMN "weather_impact" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "transport_cost" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "pricing_zones" ALTER COLUMN "color" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "product_prices" ALTER COLUMN "currency" SET DEFAULT 'EUR',
ALTER COLUMN "currency" SET DATA TYPE TEXT,
ALTER COLUMN "confidence_level" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "regions" ALTER COLUMN "code" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "seasonal_pricing" ALTER COLUMN "price_multiplier" SET DATA TYPE DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "pricing_zones_is_active_idx" ON "pricing_zones"("is_active");

-- CreateIndex
CREATE INDEX "product_prices_product_id_pricing_zone_id_idx" ON "product_prices"("product_id", "pricing_zone_id");

-- CreateIndex
CREATE INDEX "seasonal_pricing_product_id_pricing_zone_id_idx" ON "seasonal_pricing"("product_id", "pricing_zone_id");

-- RenameIndex
ALTER INDEX "product_prices_product_id_pricing_zone_id_quality_grade_effecti" RENAME TO "product_prices_product_id_pricing_zone_id_quality_grade_eff_key";
