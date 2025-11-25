-- Migration: Add blueprint fields to winning_ads table
-- Date: 2025-11-23
-- Description: Adds blueprint_json and blueprint_analyzed_at fields for Ad Remix Engine

ALTER TABLE winning_ads 
ADD COLUMN IF NOT EXISTS blueprint_json JSONB,
ADD COLUMN IF NOT EXISTS blueprint_analyzed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster blueprint queries
CREATE INDEX IF NOT EXISTS idx_winning_ads_blueprint 
ON winning_ads(blueprint_analyzed_at) 
WHERE blueprint_json IS NOT NULL;

-- Add comment
COMMENT ON COLUMN winning_ads.blueprint_json IS 'Deconstructed structural blueprint of the ad (layout, narrative, triggers, style)';
COMMENT ON COLUMN winning_ads.blueprint_analyzed_at IS 'Timestamp when the blueprint was created';
