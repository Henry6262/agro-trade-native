-- =============================================================================
-- Migration: 20260401000000_ni21_missing_indexes
-- NI-21: Add composite index for the trade_events table.
--        The trade_events table is created in 20260310100000_add_trade_events
--        which only adds single-column indexes. This migration adds the
--        composite index needed for efficient audit-trail queries that filter
--        by both operation and event type.
-- =============================================================================

-- TradeEvent: frequent filter/lookup by operation + event type (audit queries)
CREATE INDEX IF NOT EXISTS "trade_events_trade_operation_id_event_type_idx"
    ON "trade_events"("trade_operation_id", "event_type");
