-- Bring the hand-written V2 migration into line with the Prisma model.
-- Incoterm is optional in the application and defaults to DDP when supplied.
ALTER TABLE "trade_operations"
ALTER COLUMN "incoterm" DROP NOT NULL;

-- The original migration used snake_case while the Prisma field was created
-- without an @map annotation.
ALTER TABLE "commodity_registries"
RENAME COLUMN "valid_incoterms" TO "validIncoterms";

-- This field was added to the model in the V2 schema change but omitted from
-- its migration.
ALTER TABLE "transport_requests"
ADD COLUMN "cargo_description" TEXT;
