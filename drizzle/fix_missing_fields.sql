-- Fix Missing Fields Script
-- Run this to add missing timestamp fields to existing tables

-- Add missing fields to missions table
ALTER TABLE "missions" 
ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- Add missing fields to loyalty_programs table
ALTER TABLE "loyalty_programs" 
ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL,
ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- Add missing fields to mission_registry table
ALTER TABLE "mission_registry" 
ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL,
ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

-- Verify the changes
SELECT 
    'missions' as table_name,
    COUNT(*) as total_records,
    COUNT(updated_at) as updated_at_count
FROM missions
UNION ALL
SELECT 
    'loyalty_programs' as table_name,
    COUNT(*) as total_records,
    COUNT(created_at) as created_at_count
FROM loyalty_programs
UNION ALL
SELECT 
    'mission_registry' as table_name,
    COUNT(*) as total_records,
    COUNT(created_at) as created_at_count
FROM mission_registry; 