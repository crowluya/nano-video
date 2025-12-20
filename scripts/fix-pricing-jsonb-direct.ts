import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import fs from 'fs';
import path from 'path';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Fixing pricing plans JSONB using direct SQL...\n');

  const client = postgres(connectionString);

  try {
    // Use unsafe to execute raw SQL
    const sql = `
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
    `;

    await client.unsafe(sql);
    console.log('✅ All pricing plans updated using direct SQL\n');

    // Verify
    const verification = await client`
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
    `;

    console.log('Verification Results:');
    verification.forEach(plan => {
      const benefits = plan.benefits_jsonb as any;
      const jsonbType = plan.jsonb_type;
      console.log(`\n  ${plan.card_title}: $${plan.price}`);
      console.log(`    JSONB Type: ${jsonbType}`);
      console.log(`    Benefits: ${JSON.stringify(benefits)}`);
      
      if (jsonbType === 'object' && benefits) {
        if (benefits.monthlyCredits) {
          console.log(`    ✓ Credits: ${benefits.monthlyCredits.toLocaleString()} credits/month${benefits.totalMonths ? ` (${benefits.totalMonths} months)` : ''}`);
        } else if (benefits.oneTimeCredits) {
          console.log(`    ✓ Credits: ${benefits.oneTimeCredits.toLocaleString()} credits (one-time)`);
        }
      } else {
        console.log(`    ⚠️  Invalid JSONB format`);
      }
    });

    console.log('\n✅ All pricing plans fixed!');
  } catch (error) {
    console.error('❌ Error fixing pricing plans:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

