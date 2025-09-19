-- Migration: Update to Profit-Based Trading Model
-- Removes commission-based fields and adds profit tracking fields

-- ==================== UPDATE TradeOperation ====================

-- Add new profit-related fields
ALTER TABLE "trade_operations" ADD COLUMN IF NOT EXISTS "target_profit_margin" DOUBLE PRECISION;
ALTER TABLE "trade_operations" ADD COLUMN IF NOT EXISTS "actual_profit_margin" DOUBLE PRECISION;
ALTER TABLE "trade_operations" ADD COLUMN IF NOT EXISTS "transport_optimized" BOOLEAN DEFAULT FALSE;
ALTER TABLE "trade_operations" ADD COLUMN IF NOT EXISTS "expected_delivery_date" TIMESTAMP(3);
ALTER TABLE "trade_operations" ADD COLUMN IF NOT EXISTS "actual_delivery_date" TIMESTAMP(3);
ALTER TABLE "trade_operations" ADD COLUMN IF NOT EXISTS "confirmed_at" TIMESTAMP(3);

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS "trade_operations_profit_margin_idx" ON "trade_operations"("profit_margin");
CREATE INDEX IF NOT EXISTS "trade_operations_target_profit_margin_idx" ON "trade_operations"("target_profit_margin");

-- ==================== NEW TABLES ====================

-- Transport Cost Settings table
CREATE TABLE IF NOT EXISTS "transport_cost_settings" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "base_rate_per_km" DECIMAL(10,3) NOT NULL DEFAULT 0.15,
  "vehicle_multipliers" JSONB NOT NULL DEFAULT '{}',
  "distance_tiers" JSONB NOT NULL DEFAULT '[]',
  "loading_cost_per_ton" DECIMAL(10,2) DEFAULT 0.5,
  "urgency_surcharge" DECIMAL(5,2) DEFAULT 0.3,
  "bulk_discount_threshold" DECIMAL(10,2) DEFAULT 100,
  "bulk_discount_rate" DECIMAL(5,2) DEFAULT 0.1,
  "fuel_surcharge_rate" DECIMAL(5,2) DEFAULT 0,
  "toll_estimate_per_km" DECIMAL(10,3) DEFAULT 0,
  "driver_cost_per_hour" DECIMAL(10,2) DEFAULT 0,
  "maintenance_cost_per_km" DECIMAL(10,3) DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "effective_from" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "effective_to" TIMESTAMP(3),
  "changed_by" TEXT,
  "change_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Profit Estimation History table
CREATE TABLE IF NOT EXISTS "profit_estimations" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "trade_operation_id" TEXT NOT NULL,
  "proposed_buyer_price" DECIMAL(10,2) NOT NULL,
  "proposed_seller_prices" JSONB NOT NULL,
  "estimated_revenue" DECIMAL(10,2) NOT NULL,
  "estimated_costs" DECIMAL(10,2) NOT NULL,
  "estimated_profit" DECIMAL(10,2) NOT NULL,
  "profit_margin" DOUBLE PRECISION NOT NULL,
  "is_viable" BOOLEAN NOT NULL DEFAULT false,
  "warnings" TEXT[],
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "profit_estimations_trade_operation_id_fkey" 
    FOREIGN KEY ("trade_operation_id") 
    REFERENCES "trade_operations"("id") ON DELETE CASCADE
);

-- Price Scenarios table
CREATE TABLE IF NOT EXISTS "price_scenarios" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "trade_operation_id" TEXT NOT NULL,
  "scenario_name" TEXT NOT NULL,
  "buyer_price" DECIMAL(10,2) NOT NULL,
  "seller_prices" JSONB NOT NULL,
  "transport_cost" DECIMAL(10,2) NOT NULL,
  "estimated_profit" DECIMAL(10,2) NOT NULL,
  "profit_margin" DOUBLE PRECISION NOT NULL,
  "viability" TEXT NOT NULL CHECK ("viability" IN ('HIGH', 'MEDIUM', 'LOW', 'UNVIABLE')),
  "acceptance_probability" DOUBLE PRECISION NOT NULL,
  "rank" INTEGER,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "price_scenarios_trade_operation_id_fkey" 
    FOREIGN KEY ("trade_operation_id") 
    REFERENCES "trade_operations"("id") ON DELETE CASCADE
);

-- Route Optimizations table
CREATE TABLE IF NOT EXISTS "route_optimizations" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "trade_operation_id" TEXT NOT NULL,
  "original_distance" DOUBLE PRECISION NOT NULL,
  "optimized_distance" DOUBLE PRECISION NOT NULL,
  "distance_saved" DOUBLE PRECISION NOT NULL,
  "percentage_saved" DOUBLE PRECISION NOT NULL,
  "algorithm" TEXT NOT NULL,
  "route_sequence" JSONB NOT NULL,
  "computation_time" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "route_optimizations_trade_operation_id_fkey" 
    FOREIGN KEY ("trade_operation_id") 
    REFERENCES "trade_operations"("id") ON DELETE CASCADE
);

-- Transport Cost Calculations table (update if exists)
ALTER TABLE "transport_cost_calculations" 
  ADD COLUMN IF NOT EXISTS "route_optimized" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "vehicle_type" TEXT,
  ADD COLUMN IF NOT EXISTS "urgency" TEXT DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS "bulk_discount_applied" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "breakdown" JSONB;

-- ==================== UPDATE EXISTING TABLES ====================

-- Update TradeSeller table
ALTER TABLE "trade_sellers" 
  ADD COLUMN IF NOT EXISTS "current_negotiation_price" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "profit_impact" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "margin_impact" DOUBLE PRECISION;

-- Update OfferNegotiation table  
ALTER TABLE "offer_negotiations"
  ADD COLUMN IF NOT EXISTS "profit_at_start" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "profit_at_end" DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "margin_at_start" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "margin_at_end" DOUBLE PRECISION;

-- Update OfferRound table
ALTER TABLE "offer_rounds"
  ADD COLUMN IF NOT EXISTS "profit_impact" JSONB,
  ADD COLUMN IF NOT EXISTS "cumulative_profit" DECIMAL(10,2);

-- ==================== CREATE INDEXES ====================

CREATE INDEX IF NOT EXISTS "profit_estimations_trade_operation_id_idx" 
  ON "profit_estimations"("trade_operation_id");
CREATE INDEX IF NOT EXISTS "profit_estimations_created_by_idx" 
  ON "profit_estimations"("created_by");
CREATE INDEX IF NOT EXISTS "profit_estimations_profit_margin_idx" 
  ON "profit_estimations"("profit_margin");

CREATE INDEX IF NOT EXISTS "price_scenarios_trade_operation_id_idx" 
  ON "price_scenarios"("trade_operation_id");
CREATE INDEX IF NOT EXISTS "price_scenarios_viability_idx" 
  ON "price_scenarios"("viability");
CREATE INDEX IF NOT EXISTS "price_scenarios_rank_idx" 
  ON "price_scenarios"("rank");

CREATE INDEX IF NOT EXISTS "route_optimizations_trade_operation_id_idx" 
  ON "route_optimizations"("trade_operation_id");

CREATE INDEX IF NOT EXISTS "transport_cost_settings_is_active_idx" 
  ON "transport_cost_settings"("is_active");
CREATE INDEX IF NOT EXISTS "transport_cost_settings_effective_from_idx" 
  ON "transport_cost_settings"("effective_from");

-- ==================== DROP COMMISSION FIELDS (if they exist) ====================

-- Note: These ALTER TABLE DROP COLUMN statements are commented out for safety
-- Uncomment and run them separately after backing up data if commission fields exist

-- ALTER TABLE "trade_operations" DROP COLUMN IF EXISTS "commission_rate";
-- ALTER TABLE "trade_operations" DROP COLUMN IF EXISTS "commission_amount";
-- ALTER TABLE "trade_operations" DROP COLUMN IF EXISTS "buyer_commission";
-- ALTER TABLE "trade_operations" DROP COLUMN IF EXISTS "seller_commission";

-- DROP TABLE IF EXISTS "commission_calculations";
-- DROP TABLE IF EXISTS "commission_settings";

-- ==================== DEFAULT DATA ====================

-- Insert default transport cost settings
INSERT INTO "transport_cost_settings" (
  "base_rate_per_km",
  "vehicle_multipliers",
  "distance_tiers",
  "loading_cost_per_ton",
  "urgency_surcharge",
  "bulk_discount_threshold",
  "bulk_discount_rate",
  "is_active",
  "changed_by",
  "change_reason"
) VALUES (
  0.15,
  '{"FLATBED": 1.0, "REFRIGERATED": 1.3, "TANKER": 1.2, "CONTAINER": 1.1, "CURTAIN_SIDE": 1.05, "BOX_TRUCK": 1.0}',
  '[{"minKm": 0, "maxKm": 50, "ratePerKm": 0.15}, {"minKm": 50, "maxKm": 200, "ratePerKm": 0.13}, {"minKm": 200, "maxKm": null, "ratePerKm": 0.11}]',
  0.5,
  0.3,
  100,
  0.1,
  true,
  'System',
  'Initial configuration for profit-based model'
) ON CONFLICT DO NOTHING;