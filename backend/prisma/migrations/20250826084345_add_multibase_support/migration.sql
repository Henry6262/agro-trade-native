/*
  Warnings:

  - You are about to drop the `transporter_bases` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BaseType" AS ENUM ('WAREHOUSE', 'SILO', 'DEPOT', 'OFFICE', 'PORT', 'FACTORY', 'FARM');

-- CreateEnum
CREATE TYPE "StockStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'IN_TRANSIT');

-- DropForeignKey
ALTER TABLE "transporter_bases" DROP CONSTRAINT "transporter_bases_transporter_id_fkey";

-- AlterTable
ALTER TABLE "product_listings" ADD COLUMN     "base_id" TEXT,
ADD COLUMN     "delivery_options" JSONB,
ADD COLUMN     "min_order_quantity" DECIMAL(10,2),
ADD COLUMN     "split_delivery" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "transporter_bases";

-- CreateTable
CREATE TABLE "bases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" "BaseType" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "country" TEXT NOT NULL DEFAULT 'Bulgaria',
    "postal_code" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "contact_person" TEXT,
    "contact_phone" TEXT,
    "contact_email" TEXT,
    "storage_capacity" DECIMAL(10,2),
    "current_usage" DECIMAL(10,2),
    "features" JSONB,
    "certifications" JSONB,
    "operating_hours" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "base_stocks" (
    "id" TEXT NOT NULL,
    "base_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" "ProductUnit" NOT NULL,
    "status" "StockStatus" NOT NULL DEFAULT 'AVAILABLE',
    "quality_grade" TEXT,
    "harvest_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "batch_number" TEXT,
    "storage_location" TEXT,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "price_per_unit" DECIMAL(10,2),
    "notes" TEXT,
    "last_inspection" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "base_stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "base_demands" (
    "id" TEXT NOT NULL,
    "base_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "required_quantity" DECIMAL(10,2) NOT NULL,
    "unit" "ProductUnit" NOT NULL,
    "urgency" TEXT,
    "quality_grade" TEXT,
    "specifications" JSONB,
    "max_price_per_unit" DECIMAL(10,2),
    "needed_by" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "fulfilled_quantity" DECIMAL(10,2),
    "remaining_quantity" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "base_demands_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bases_user_id_idx" ON "bases"("user_id");

-- CreateIndex
CREATE INDEX "bases_is_active_idx" ON "bases"("is_active");

-- CreateIndex
CREATE INDEX "bases_latitude_longitude_idx" ON "bases"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "bases_user_id_code_key" ON "bases"("user_id", "code");

-- CreateIndex
CREATE INDEX "base_stocks_base_id_idx" ON "base_stocks"("base_id");

-- CreateIndex
CREATE INDEX "base_stocks_product_id_idx" ON "base_stocks"("product_id");

-- CreateIndex
CREATE INDEX "base_stocks_status_idx" ON "base_stocks"("status");

-- CreateIndex
CREATE UNIQUE INDEX "base_stocks_base_id_product_id_batch_number_key" ON "base_stocks"("base_id", "product_id", "batch_number");

-- CreateIndex
CREATE INDEX "base_demands_base_id_idx" ON "base_demands"("base_id");

-- CreateIndex
CREATE INDEX "base_demands_product_id_idx" ON "base_demands"("product_id");

-- CreateIndex
CREATE INDEX "product_listings_base_id_idx" ON "product_listings"("base_id");

-- AddForeignKey
ALTER TABLE "bases" ADD CONSTRAINT "bases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base_stocks" ADD CONSTRAINT "base_stocks_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base_stocks" ADD CONSTRAINT "base_stocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base_stocks" ADD CONSTRAINT "base_stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base_demands" ADD CONSTRAINT "base_demands_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "bases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base_demands" ADD CONSTRAINT "base_demands_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "base_demands" ADD CONSTRAINT "base_demands_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_listings" ADD CONSTRAINT "product_listings_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "bases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
