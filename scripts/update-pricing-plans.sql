-- Update Pricing Plans with Credit Benefits
-- This script updates the benefitsJsonb field for pricing plans
-- Run this script after updating the pricing plans in the database

-- Note: Replace the plan IDs and prices with your actual plan IDs from the database
-- You can find plan IDs by querying: SELECT id, card_title, price, payment_type, recurring_interval FROM pricing_plans;

-- ============================================================================
-- Monthly Plans
-- ============================================================================

-- Plan 1: $29.99/month → 3000 credits/month
UPDATE pricing_plans
SET benefits_jsonb = '{"monthlyCredits": 3000}'::jsonb
WHERE price = '29.99' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'month'
  AND environment = 'test';

-- Plan 2: $99.99/month → 110000 credits/month (100000 * 1.1)
UPDATE pricing_plans
SET benefits_jsonb = '{"monthlyCredits": 110000}'::jsonb
WHERE price = '99.99' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'month'
  AND environment = 'test';

-- Plan 3: $199.99/month → 24000 credits/month (20000 * 1.2)
UPDATE pricing_plans
SET benefits_jsonb = '{"monthlyCredits": 24000}'::jsonb
WHERE price = '199.99' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'month'
  AND environment = 'test';

-- ============================================================================
-- Annual Plans (Monthly allocation, 12 months total)
-- ============================================================================

-- Plan 1: $299.9/year → 3000 credits/month (12 months)
UPDATE pricing_plans
SET benefits_jsonb = '{"monthlyCredits": 3000, "totalMonths": 12}'::jsonb
WHERE price = '299.9' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'year'
  AND environment = 'test';

-- Plan 2: $999.9/year → 110000 credits/month (12 months)
UPDATE pricing_plans
SET benefits_jsonb = '{"monthlyCredits": 110000, "totalMonths": 12}'::jsonb
WHERE price = '999.9' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'year'
  AND environment = 'test';

-- Plan 3: $1999.9/year → 24000 credits/month (12 months)
UPDATE pricing_plans
SET benefits_jsonb = '{"monthlyCredits": 24000, "totalMonths": 12}'::jsonb
WHERE price = '1999.9' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'year'
  AND environment = 'test';

-- ============================================================================
-- One-Time Plans
-- ============================================================================

-- One-time: $49.99 → 5000 credits
UPDATE pricing_plans
SET benefits_jsonb = '{"oneTimeCredits": 5000}'::jsonb
WHERE price = '49.99' 
  AND payment_type IN ('one_time', 'onetime')
  AND environment = 'test';

-- ============================================================================
-- Verification Query
-- ============================================================================

-- Run this query to verify the updates:
-- SELECT 
--   id,
--   card_title,
--   price,
--   payment_type,
--   recurring_interval,
--   benefits_jsonb
-- FROM pricing_plans
-- WHERE environment = 'test'
-- ORDER BY payment_type, recurring_interval, price;

