CREATE TABLE "mission_registry" (
  "id" SERIAL PRIMARY KEY,
  "customer_id" INTEGER NOT NULL,
  "mission_id" INTEGER NOT NULL,
  "business_id" INTEGER NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('in_progress', 'completed', 'failed')),
  "started_at" TIMESTAMP DEFAULT NOW(),
  "completed_at" TIMESTAMP,
  "discount_amount" DECIMAL(10,2) DEFAULT '0',
  "discount_percentage" DECIMAL(5,2) DEFAULT '0',
  "notes" TEXT
);

ALTER TABLE "mission_registry" ADD CONSTRAINT "mission_registry_customer_id_fkey" 
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE;

ALTER TABLE "mission_registry" ADD CONSTRAINT "mission_registry_mission_id_fkey" 
  FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE;

ALTER TABLE "mission_registry" ADD CONSTRAINT "mission_registry_business_id_fkey" 
  FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE;

CREATE INDEX "mission_registry_customer_id_idx" ON "mission_registry"("customer_id");
CREATE INDEX "mission_registry_mission_id_idx" ON "mission_registry"("mission_id");
CREATE INDEX "mission_registry_business_id_idx" ON "mission_registry"("business_id");
CREATE INDEX "mission_registry_status_idx" ON "mission_registry"("status");

COMMENT ON TABLE "mission_registry" IS 'Tracks customer progress on missions and completion status';
COMMENT ON COLUMN "mission_registry"."status" IS 'Current status: in_progress, completed, or failed';
COMMENT ON COLUMN "mission_registry"."discount_amount" IS 'Fixed discount amount in currency';
COMMENT ON COLUMN "mission_registry"."discount_percentage" IS 'Percentage discount (0-100)';
COMMENT ON COLUMN "mission_registry"."notes" IS 'Additional notes from cashier or business'; 