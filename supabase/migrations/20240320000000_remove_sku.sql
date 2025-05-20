-- Remove SKU column from productVariants table
ALTER TABLE "public"."productVariants" DROP COLUMN IF EXISTS "sku";

-- Update any existing triggers or functions that might reference the SKU column
-- (if there are any, they would need to be modified here) 