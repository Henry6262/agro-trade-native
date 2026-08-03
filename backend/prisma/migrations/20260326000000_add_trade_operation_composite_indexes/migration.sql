-- Add the composite indexes used by the operations dashboard query paths.
CREATE INDEX "trade_operations_admin_id_status_idx"
ON "trade_operations"("admin_id", "status");

CREATE INDEX "trade_operations_status_phase_idx"
ON "trade_operations"("status", "phase");

CREATE INDEX "trade_operations_created_at_idx"
ON "trade_operations"("created_at");
