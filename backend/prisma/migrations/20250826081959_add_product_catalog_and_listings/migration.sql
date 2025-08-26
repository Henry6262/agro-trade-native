/*
  Warnings:

  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('SELL', 'BUY');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'EXPIRED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_farmer_id_fkey";

-- DropTable
DROP TABLE "products";

-- DropEnum
DROP TYPE "ProductStatus";

-- CreateTable
CREATE TABLE "product_catalog" (
    "id" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "nutritional_info" TEXT,
    "use_cases" JSONB,
    "harvest_season" TEXT,
    "storage_recommendations" TEXT,
    "price_range_min" DECIMAL(10,2),
    "price_range_max" DECIMAL(10,2),
    "default_unit" "ProductUnit" NOT NULL DEFAULT 'TON',
    "quality_grades" JSONB,
    "certifications" JSONB,
    "specifications" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_listings" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "listing_type" "ListingType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" "ProductUnit" NOT NULL,
    "price_per_unit" DECIMAL(10,2) NOT NULL,
    "total_value" DECIMAL(12,2) NOT NULL,
    "negotiable" BOOLEAN NOT NULL DEFAULT true,
    "quality_grade" TEXT,
    "certifications" JSONB,
    "specifications" JSONB,
    "location_address" TEXT,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "available_from" TIMESTAMP(3),
    "available_to" TIMESTAMP(3),
    "harvest_date" TIMESTAMP(3),
    "delivery_by" TIMESTAMP(3),
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "images" JSONB,
    "documents" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "product_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_catalog_category_key" ON "product_catalog"("category");

-- CreateIndex
CREATE INDEX "product_catalog_is_active_idx" ON "product_catalog"("is_active");

-- CreateIndex
CREATE INDEX "product_catalog_sort_order_idx" ON "product_catalog"("sort_order");

-- CreateIndex
CREATE INDEX "product_listings_user_id_idx" ON "product_listings"("user_id");

-- CreateIndex
CREATE INDEX "product_listings_product_id_idx" ON "product_listings"("product_id");

-- CreateIndex
CREATE INDEX "product_listings_listing_type_idx" ON "product_listings"("listing_type");

-- CreateIndex
CREATE INDEX "product_listings_status_idx" ON "product_listings"("status");

-- CreateIndex
CREATE INDEX "product_listings_created_at_idx" ON "product_listings"("created_at");

-- AddForeignKey
ALTER TABLE "product_listings" ADD CONSTRAINT "product_listings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_listings" ADD CONSTRAINT "product_listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
