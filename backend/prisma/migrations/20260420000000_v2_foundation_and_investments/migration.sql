-- CreateEnum
CREATE TYPE "Incoterm" AS ENUM ('EXW', 'FCA', 'FOB', 'CFR', 'CIF', 'DAP', 'DDP');

-- CreateEnum
CREATE TYPE "CommodityParentCategory" AS ENUM ('AGRICULTURE', 'METALS', 'MEAT', 'ELECTRONICS');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('PENDING', 'EXECUTED', 'FAILED', 'REFUNDED');

-- AlterEnum
ALTER TYPE "TradeEventType" ADD VALUE IF NOT EXISTS 'INVESTMENT_EXECUTED';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "commodity_registry_id" TEXT;

-- AlterTable
ALTER TABLE "trade_operations" ADD COLUMN     "incoterm" "Incoterm" NOT NULL DEFAULT 'DDP';

-- CreateTable
CREATE TABLE "commodity_registries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hs_code" VARCHAR(10) NOT NULL,
    "parent_category" "CommodityParentCategory" NOT NULL,
    "product_category_ref" "ProductCategory",
    "requires_phyto_cert" BOOLEAN NOT NULL DEFAULT false,
    "requires_cold_chain" BOOLEAN NOT NULL DEFAULT false,
    "requires_purity_cert" BOOLEAN NOT NULL DEFAULT false,
    "is_dual_use" BOOLEAN NOT NULL DEFAULT false,
    "is_aml_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "is_perishable" BOOLEAN NOT NULL DEFAULT false,
    "is_hazmat" BOOLEAN NOT NULL DEFAULT false,
    "valid_incoterms" "Incoterm"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commodity_registries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_positions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "trade_operation_id" TEXT,
    "asset_symbol" TEXT NOT NULL,
    "amount_usdc" DECIMAL(18,6) NOT NULL,
    "token_amount" DECIMAL(18,9) NOT NULL,
    "input_mint" TEXT NOT NULL,
    "output_mint" TEXT NOT NULL,
    "tx_signature" TEXT,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_investment_preferences" (
    "user_id" TEXT NOT NULL,
    "auto_invest" BOOLEAN NOT NULL DEFAULT false,
    "asset_symbol" TEXT NOT NULL DEFAULT 'PAXG',
    "percentage" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_investment_preferences_pkey" PRIMARY KEY ("user_id"),
    CONSTRAINT "percentage_check" CHECK (percentage >= 0 AND percentage <= 100)
);

-- CreateIndex
CREATE UNIQUE INDEX "commodity_registries_name_key" ON "commodity_registries"("name");

-- CreateIndex
CREATE INDEX "commodity_registries_parent_category_idx" ON "commodity_registries"("parent_category");

-- CreateIndex
CREATE INDEX "commodity_registries_product_category_ref_idx" ON "commodity_registries"("product_category_ref");

-- CreateIndex
CREATE INDEX "investment_positions_user_id_idx" ON "investment_positions"("user_id");

-- CreateIndex
CREATE INDEX "investment_positions_trade_operation_id_idx" ON "investment_positions"("trade_operation_id");

-- CreateIndex
CREATE INDEX "investment_positions_status_idx" ON "investment_positions"("status");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_commodity_registry_id_fkey" FOREIGN KEY ("commodity_registry_id") REFERENCES "commodity_registries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_positions" ADD CONSTRAINT "investment_positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_positions" ADD CONSTRAINT "investment_positions_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_investment_preferences" ADD CONSTRAINT "user_investment_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
