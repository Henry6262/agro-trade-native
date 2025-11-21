-- CreateEnum or AlterEnum for NegotiationStatus
DO $$ 
BEGIN
  -- Check if the enum exists
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NegotiationStatus') THEN
    -- Rename existing enum
    ALTER TYPE "NegotiationStatus" RENAME TO "NegotiationStatus_old";
    
    -- Create new enum with updated values
    CREATE TYPE "NegotiationStatus" AS ENUM (
      'PENDING',
      'ACCEPTED', 
      'REJECTED',
      'COUNTERED',
      'EXPIRED',
      'WITHDRAWN'
    );
    
    -- Update existing data
    ALTER TABLE "offer_negotiations" 
      ALTER COLUMN "status" TYPE "NegotiationStatus" 
      USING (
        CASE 
          WHEN "status"::text = 'ACTIVE' THEN 'PENDING'::NegotiationStatus
          WHEN "status"::text = 'AGREED' THEN 'ACCEPTED'::NegotiationStatus
          WHEN "status"::text = 'FAILED' THEN 'REJECTED'::NegotiationStatus
          WHEN "status"::text = 'EXPIRED' THEN 'EXPIRED'::NegotiationStatus
          ELSE 'PENDING'::NegotiationStatus
        END
      );
    
    -- Drop old enum
    DROP TYPE "NegotiationStatus_old";
  ELSE
    -- Create new enum if it doesn't exist
    CREATE TYPE "NegotiationStatus" AS ENUM (
      'PENDING',
      'ACCEPTED', 
      'REJECTED',
      'COUNTERED',
      'EXPIRED',
      'WITHDRAWN'
    );
  END IF;
END $$;

-- Set default value for status column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'offer_negotiations' 
             AND column_name = 'status') THEN
    ALTER TABLE "offer_negotiations" ALTER COLUMN "status" SET DEFAULT 'PENDING';
  END IF;
END $$;

-- AlterTable - Update OfferNegotiation model if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'offer_negotiations') THEN
    
    -- Remove old columns
    ALTER TABLE "offer_negotiations" DROP COLUMN IF EXISTS "initial_offer";
    
    -- Check and modify current_offer column type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'offer_negotiations' 
               AND column_name = 'current_offer'
               AND data_type != 'jsonb') THEN
      ALTER TABLE "offer_negotiations" 
        ALTER COLUMN "current_offer" TYPE JSONB 
        USING to_jsonb(json_build_object('price', "current_offer", 'quantity', 0, 'terms', ''));
    END IF;
    
    -- Add new columns
    ALTER TABLE "offer_negotiations" 
      ADD COLUMN IF NOT EXISTS "counter_offer" JSONB,
      ADD COLUMN IF NOT EXISTS "offer_history" JSONB[] DEFAULT ARRAY[]::JSONB[],
      ADD COLUMN IF NOT EXISTS "final_quantity" DECIMAL(10,2),
      ADD COLUMN IF NOT EXISTS "responded_at" TIMESTAMP(3);
    
    -- CreateIndex
    -- Add index for expiration queries
    CREATE INDEX IF NOT EXISTS "offer_negotiations_expires_at_idx" ON "offer_negotiations"("expires_at");
    
    -- Update existing records to set expires_at if null
    UPDATE "offer_negotiations" 
    SET "expires_at" = "started_at" + INTERVAL '48 hours'
    WHERE "expires_at" IS NULL OR "expires_at" < NOW();
    
  END IF;
END $$;