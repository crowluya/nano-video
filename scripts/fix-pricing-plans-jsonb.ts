import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Fixing pricing plans JSONB format...\n');

  const client = postgres(connectionString);

  try {
    // Fix monthly plans
    console.log('Fixing monthly plans...');
    
    const monthlyPlans = [
      { price: '29.99', credits: 3000 },
      { price: '99.99', credits: 110000 },
      { price: '199.99', credits: 24000 },
    ];

    for (const plan of monthlyPlans) {
      // First, get the current value to check if it's a string
      const current = await client`
        SELECT id, card_title, benefits_jsonb
        FROM pricing_plans
        WHERE price = ${plan.price}
          AND payment_type = 'recurring'
          AND recurring_interval = 'month'
          AND environment = 'test'
        LIMIT 1;
      `;

      if (current.length > 0) {
        const currentValue = current[0].benefits_jsonb;
        let newValue: any;

        // Check if it's a string (double-encoded JSON)
        if (typeof currentValue === 'string') {
          try {
            // Try to parse the string
            newValue = JSON.parse(currentValue);
            console.log(`  Found string format for $${plan.price}, parsing...`);
          } catch {
            // If parsing fails, use the correct value
            newValue = { monthlyCredits: plan.credits };
            console.log(`  Invalid JSON string for $${plan.price}, setting correct value...`);
          }
        } else {
          // Already an object, just update the credits
          newValue = { monthlyCredits: plan.credits };
        }

        // Update with proper JSONB format
        const result = await client`
          UPDATE pricing_plans
          SET benefits_jsonb = ${JSON.stringify(newValue)}::jsonb
          WHERE id = ${current[0].id}
          RETURNING id, card_title, price, benefits_jsonb;
        `;

        if (result.length > 0) {
          console.log(`  ✓ Fixed $${plan.price}/month → ${plan.credits.toLocaleString()} credits/month`);
          console.log(`    - ${result[0].card_title} (ID: ${result[0].id})`);
          console.log(`    - New JSONB: ${JSON.stringify(result[0].benefits_jsonb)}`);
        }
      }
    }

    // Fix annual plans
    console.log('\nFixing annual plans...');
    
    const annualPlans = [
      { price: '299.9', credits: 3000 },
      { price: '999.9', credits: 110000 },
      { price: '1999.9', credits: 24000 },
    ];

    for (const plan of annualPlans) {
      const current = await client`
        SELECT id, card_title, benefits_jsonb
        FROM pricing_plans
        WHERE price = ${plan.price}
          AND payment_type = 'recurring'
          AND recurring_interval = 'year'
          AND environment = 'test'
        LIMIT 1;
      `;

      if (current.length > 0) {
        const currentValue = current[0].benefits_jsonb;
        let newValue: any;

        if (typeof currentValue === 'string') {
          try {
            newValue = JSON.parse(currentValue);
            console.log(`  Found string format for $${plan.price}, parsing...`);
          } catch {
            newValue = { monthlyCredits: plan.credits, totalMonths: 12 };
            console.log(`  Invalid JSON string for $${plan.price}, setting correct value...`);
          }
        } else {
          newValue = { monthlyCredits: plan.credits, totalMonths: 12 };
        }

        const result = await client`
          UPDATE pricing_plans
          SET benefits_jsonb = ${JSON.stringify(newValue)}::jsonb
          WHERE id = ${current[0].id}
          RETURNING id, card_title, price, benefits_jsonb;
        `;

        if (result.length > 0) {
          console.log(`  ✓ Fixed $${plan.price}/year → ${plan.credits.toLocaleString()} credits/month (12 months)`);
          console.log(`    - ${result[0].card_title} (ID: ${result[0].id})`);
          console.log(`    - New JSONB: ${JSON.stringify(result[0].benefits_jsonb)}`);
        }
      }
    }

    // Fix one-time plans
    console.log('\nFixing one-time plans...');
    
    const current = await client`
      SELECT id, card_title, benefits_jsonb
      FROM pricing_plans
      WHERE price = '49.99'
        AND payment_type IN ('one_time', 'onetime')
        AND environment = 'test'
      LIMIT 1;
    `;

    if (current.length > 0) {
      const currentValue = current[0].benefits_jsonb;
      let newValue: any;

      if (typeof currentValue === 'string') {
        try {
          newValue = JSON.parse(currentValue);
          console.log(`  Found string format for $49.99, parsing...`);
        } catch {
          newValue = { oneTimeCredits: 5000 };
          console.log(`  Invalid JSON string for $49.99, setting correct value...`);
        }
      } else {
        newValue = { oneTimeCredits: 5000 };
      }

      const result = await client`
        UPDATE pricing_plans
        SET benefits_jsonb = ${JSON.stringify(newValue)}::jsonb
        WHERE id = ${current[0].id}
        RETURNING id, card_title, price, benefits_jsonb;
      `;

      if (result.length > 0) {
        console.log(`  ✓ Fixed $49.99 → 5,000 credits`);
        console.log(`    - ${result[0].card_title} (ID: ${result[0].id})`);
        console.log(`    - New JSONB: ${JSON.stringify(result[0].benefits_jsonb)}`);
      }
    }

    // Verify
    console.log('\n✅ Verification:');
    const verification = await client`
      SELECT 
        card_title,
        price,
        payment_type,
        recurring_interval,
        benefits_jsonb
      FROM pricing_plans
      WHERE environment = 'test'
        AND (
          (price IN ('29.99', '99.99', '199.99') AND payment_type = 'recurring' AND recurring_interval = 'month')
          OR (price IN ('299.9', '999.9', '1999.9') AND payment_type = 'recurring' AND recurring_interval = 'year')
          OR (price = '49.99' AND payment_type IN ('one_time', 'onetime'))
        )
      ORDER BY payment_type, recurring_interval, price;
    `;

    console.log('\nUpdated plans:');
    verification.forEach(plan => {
      const benefits = plan.benefits_jsonb as any;
      const isString = typeof benefits === 'string';
      const parsed = isString ? JSON.parse(benefits) : benefits;
      
      if (parsed.monthlyCredits) {
        console.log(`  - ${plan.card_title}: $${plan.price} → ${parsed.monthlyCredits.toLocaleString()} credits/month${parsed.totalMonths ? ` (${parsed.totalMonths} months)` : ''}`);
      } else if (parsed.oneTimeCredits) {
        console.log(`  - ${plan.card_title}: $${plan.price} → ${parsed.oneTimeCredits.toLocaleString()} credits (one-time)`);
      } else {
        console.log(`  - ${plan.card_title}: $${plan.price} → NO CREDITS SET`);
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

