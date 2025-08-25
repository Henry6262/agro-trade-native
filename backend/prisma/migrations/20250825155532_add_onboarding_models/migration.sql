-- CreateTable
CREATE TABLE "company_info" (
    "user_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "vat_number" TEXT,
    "business_license" TEXT,
    "company_address" JSONB,
    "website" TEXT,
    "established_year" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_info_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "transporter_bases" (
    "id" TEXT NOT NULL,
    "transporter_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transporter_bases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_vehicles" (
    "id" TEXT NOT NULL,
    "transporter_id" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "vehicle_type" "TruckType" NOT NULL,
    "capacity_kg" INTEGER NOT NULL,
    "year" INTEGER,
    "make" TEXT,
    "model" TEXT,
    "fuel_type" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "registration_doc" TEXT,
    "insurance_doc" TEXT,
    "license_doc" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fleet_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transporter_bases_transporter_id_idx" ON "transporter_bases"("transporter_id");

-- CreateIndex
CREATE INDEX "fleet_vehicles_transporter_id_idx" ON "fleet_vehicles"("transporter_id");

-- AddForeignKey
ALTER TABLE "company_info" ADD CONSTRAINT "company_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transporter_bases" ADD CONSTRAINT "transporter_bases_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_vehicles" ADD CONSTRAINT "fleet_vehicles_transporter_id_fkey" FOREIGN KEY ("transporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
