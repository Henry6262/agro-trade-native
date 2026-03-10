-- CreateEnum
CREATE TYPE "TradeEventType" AS ENUM ('LISTING_CREATED', 'BID_SUBMITTED', 'BID_ACCEPTED', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED', 'TRANSPORT_PICKUP', 'TRANSPORT_DELIVERED', 'PAYMENT_ESCROWED', 'PAYMENT_RELEASED', 'DISPUTE_RAISED');

-- CreateTable
CREATE TABLE "trade_events" (
    "id" TEXT NOT NULL,
    "trade_operation_id" TEXT NOT NULL,
    "event_type" "TradeEventType" NOT NULL,
    "actor_role" TEXT NOT NULL,
    "actor_id" TEXT,
    "commodity_code" TEXT,
    "quantity_kg" DOUBLE PRECISION,
    "price_per_kg" DOUBLE PRECISION,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "region_code" TEXT,
    "inspection_grade" TEXT,
    "blockchain_tx_hash" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trade_events_trade_operation_id_idx" ON "trade_events"("trade_operation_id");

-- CreateIndex
CREATE INDEX "trade_events_event_type_idx" ON "trade_events"("event_type");

-- CreateIndex
CREATE INDEX "trade_events_region_code_idx" ON "trade_events"("region_code");

-- CreateIndex
CREATE INDEX "trade_events_timestamp_idx" ON "trade_events"("timestamp");

-- AddForeignKey
ALTER TABLE "trade_events" ADD CONSTRAINT "trade_events_trade_operation_id_fkey" FOREIGN KEY ("trade_operation_id") REFERENCES "trade_operations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
