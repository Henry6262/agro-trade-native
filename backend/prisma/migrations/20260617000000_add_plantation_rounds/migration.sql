-- CreateEnum
CREATE TYPE "PlantationRoundStatus" AS ENUM ('OPEN', 'FUNDED', 'ACTIVE', 'DISTRIBUTING', 'CLOSED');

-- CreateTable
CREATE TABLE "plantation_rounds" (
    "id" TEXT NOT NULL,
    "on_chain_round_id" VARCHAR(78),
    "seller_id" TEXT NOT NULL,
    "crop_type" TEXT NOT NULL,
    "farm_location" TEXT NOT NULL,
    "target_cusd" DECIMAL(36,18) NOT NULL,
    "price_per_share_cusd" DECIMAL(36,18) NOT NULL,
    "total_shares" INTEGER NOT NULL,
    "shares_sold" INTEGER NOT NULL DEFAULT 0,
    "harvest_deadline" TIMESTAMP(3) NOT NULL,
    "projected_apy_pct" DECIMAL(10,4),
    "status" "PlantationRoundStatus" NOT NULL DEFAULT 'OPEN',
    "metadata_uri" TEXT,
    "contract_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plantation_rounds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "plantation_rounds_share_bounds_check" CHECK (
        "total_shares" > 0
        AND "shares_sold" >= 0
        AND "shares_sold" <= "total_shares"
    ),
    CONSTRAINT "plantation_rounds_on_chain_round_id_check" CHECK (
        "on_chain_round_id" IS NULL
        OR CASE
            WHEN "on_chain_round_id" ~ '^(0|[1-9][0-9]{0,77})$'
            THEN "on_chain_round_id"::NUMERIC <= 115792089237316195423570985008687907853269984665640564039457584007913129639935::NUMERIC
            ELSE FALSE
        END
    )
);

-- CreateTable
CREATE TABLE "plantation_nfts" (
    "id" TEXT NOT NULL,
    "token_id" VARCHAR(78),
    "round_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "share_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantation_nfts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "plantation_nfts_share_index_check" CHECK ("share_index" >= 0),
    CONSTRAINT "plantation_nfts_token_id_check" CHECK (
        "token_id" IS NULL
        OR CASE
            WHEN "token_id" ~ '^(0|[1-9][0-9]{0,77})$'
            THEN "token_id"::NUMERIC <= 115792089237316195423570985008687907853269984665640564039457584007913129639935::NUMERIC
            ELSE FALSE
        END
    )
);

-- CreateTable
CREATE TABLE "staking_positions" (
    "id" TEXT NOT NULL,
    "nft_id" TEXT NOT NULL,
    "staked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unstaked_at" TIMESTAMP(3),
    "claimed_cusd" DECIMAL(36,18) NOT NULL DEFAULT 0,

    CONSTRAINT "staking_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plantation_rounds_on_chain_round_id_key" ON "plantation_rounds"("on_chain_round_id");

-- CreateIndex
CREATE UNIQUE INDEX "plantation_nfts_token_id_key" ON "plantation_nfts"("token_id");

-- CreateIndex
CREATE UNIQUE INDEX "plantation_nfts_round_id_share_index_key" ON "plantation_nfts"("round_id", "share_index");

-- CreateIndex
CREATE UNIQUE INDEX "staking_positions_nft_id_key" ON "staking_positions"("nft_id");

-- AddForeignKey
ALTER TABLE "plantation_rounds" ADD CONSTRAINT "plantation_rounds_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantation_nfts" ADD CONSTRAINT "plantation_nfts_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "plantation_rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plantation_nfts" ADD CONSTRAINT "plantation_nfts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staking_positions" ADD CONSTRAINT "staking_positions_nft_id_fkey" FOREIGN KEY ("nft_id") REFERENCES "plantation_nfts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
