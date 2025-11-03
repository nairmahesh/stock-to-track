-- Add new columns to products table for better merchandise management
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'units',
ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS requires_dimensions BOOLEAN DEFAULT false;

COMMENT ON COLUMN products.unit_type IS 'Type of unit: units, pieces, sets, etc.';
COMMENT ON COLUMN products.min_quantity IS 'Minimum order quantity';
COMMENT ON COLUMN products.requires_dimensions IS 'Whether product requires dimension input (banners, etc.)';

-- Update existing products with proper specifications
UPDATE products SET 
  unit_type = 'pieces',
  min_quantity = 200
WHERE sku = 'BC-001'; -- Business Cards

UPDATE products SET 
  unit_type = 'units',
  min_quantity = 1,
  requires_dimensions = true
WHERE name = 'Banners' OR category = 'Banners';

UPDATE products SET 
  unit_type = 'units',
  min_quantity = 10
WHERE sku IN ('PN-001', 'KC-001'); -- Pens, Keychains

UPDATE products SET 
  unit_type = 'pieces',
  min_quantity = 50
WHERE sku IN ('TS-001', 'MG-001'); -- T-Shirts, Mugs

UPDATE products SET 
  unit_type = 'packs',
  min_quantity = 10
WHERE sku IN ('BR-001', 'LS-001'); -- Brochures, Stickers