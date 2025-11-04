-- Add CDN URL fields for external storage
ALTER TABLE wedding_photos ADD COLUMN IF NOT EXISTS cdn_full_url TEXT;
ALTER TABLE wedding_photos ADD COLUMN IF NOT EXISTS cdn_thumbnail_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_wedding_photos_display_order ON wedding_photos(display_order);