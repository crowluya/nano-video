-- Fix JSONB format for pricing plans
-- This script directly updates the JSONB field using SQL

-- Monthly Plans
UPDATE pricing_plans
SET benefits_jsonb = jsonb_build_object('monthlyCredits', 3000)
WHERE price = '29.99' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'month'
  AND environment = 'test';

UPDATE pricing_plans
SET benefits_jsonb = jsonb_build_object('monthlyCredits', 110000)
WHERE price = '99.99' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'month'
  AND environment = 'test';

UPDATE pricing_plans
SET benefits_jsonb = jsonb_build_object('monthlyCredits', 24000)
WHERE price = '199.99' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'month'
  AND environment = 'test';

-- Annual Plans
UPDATE pricing_plans
SET benefits_jsonb = jsonb_build_object('monthlyCredits', 3000, 'totalMonths', 12)
WHERE price = '299.9' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'year'
  AND environment = 'test';

UPDATE pricing_plans
SET benefits_jsonb = jsonb_build_object('monthlyCredits', 110000, 'totalMonths', 12)
WHERE price = '999.9' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'year'
  AND environment = 'test';

UPDATE pricing_plans
SET benefits_jsonb = jsonb_build_object('monthlyCredits', 24000, 'totalMonths', 12)
WHERE price = '1999.9' 
  AND payment_type = 'recurring' 
  AND recurring_interval = 'year'
  AND environment = 'test';

-- One-Time Plans
UPDATE pricing_plans
SET benefits_jsonb = jsonb_build_object('oneTimeCredits', 5000)
WHERE price = '49.99' 
  AND payment_type IN ('one_time', 'onetime')
  AND environment = 'test';

-- Verification
SELECT 
  card_title,
  price,
  payment_type,
  recurring_interval,
  benefits_jsonb,
  jsonb_typeof(benefits_jsonb) as jsonb_type
FROM pricing_plans
WHERE environment = 'test'
  AND (
    (price IN ('29.99', '99.99', '199.99') AND payment_type = 'recurring' AND recurring_interval = 'month')
    OR (price IN ('299.9', '999.9', '1999.9') AND payment_type = 'recurring' AND recurring_interval = 'year')
    OR (price = '49.99' AND payment_type IN ('one_time', 'onetime'))
  )
ORDER BY payment_type, recurring_interval, price;

