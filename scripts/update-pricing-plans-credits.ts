import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';
import path from 'path';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Updating pricing plans with credit benefits...\n');

  const client = postgres(connectionString);

  try {
    // Monthly Plans
    console.log('Updating monthly plans...');
    
    const monthlyUpdates = [
      { price: '29.99', credits: 3000 },
      { price: '99.99', credits: 110000 },
      { price: '199.99', credits: 24000 },
    ];

    for (const plan of monthlyUpdates) {
      const result = await client`
        UPDATE pricing_plans
        SET benefits_jsonb = ${JSON.stringify({ monthlyCredits: plan.credits })}::jsonb
        WHERE price = ${plan.price}
          AND payment_type = 'recurring'
          AND recurring_interval = 'month'
          AND environment = 'test'
        RETURNING id, card_title, price, benefits_jsonb;
      `;
      
      if (result.length > 0) {
        console.log(`  ✓ Updated $${plan.price}/month → ${plan.credits.toLocaleString()} credits/month`);
        result.forEach(row => {
          console.log(`    - ${row.card_title} (ID: ${row.id})`);
        });
      } else {
        console.log(`  ⚠ No plan found for $${plan.price}/month`);
      }
    }

    // Annual Plans
    console.log('\nUpdating annual plans...');
    
    const annualUpdates = [
      { price: '299.9', credits: 3000 },
      { price: '999.9', credits: 110000 },
      { price: '1999.9', credits: 24000 },
    ];

    for (const plan of annualUpdates) {
      const result = await client`
        UPDATE pricing_plans
        SET benefits_jsonb = ${JSON.stringify({ monthlyCredits: plan.credits, totalMonths: 12 })}::jsonb
        WHERE price = ${plan.price}
          AND payment_type = 'recurring'
          AND recurring_interval = 'year'
          AND environment = 'test'
        RETURNING id, card_title, price, benefits_jsonb;
      `;
      
      if (result.length > 0) {
        console.log(`  ✓ Updated $${plan.price}/year → ${plan.credits.toLocaleString()} credits/month (12 months)`);
        result.forEach(row => {
          console.log(`    - ${row.card_title} (ID: ${row.id})`);
        });
      } else {
        console.log(`  ⚠ No plan found for $${plan.price}/year`);
      }
    }

    // One-Time Plans
    console.log('\nUpdating one-time plans...');
    
    const result = await client`
      UPDATE pricing_plans
      SET benefits_jsonb = ${JSON.stringify({ oneTimeCredits: 5000 })}::jsonb
      WHERE price = '49.99'
        AND payment_type IN ('one_time', 'onetime')
        AND environment = 'test'
      RETURNING id, card_title, price, benefits_jsonb;
    `;
    
    if (result.length > 0) {
      console.log(`  ✓ Updated $49.99 → 5,000 credits`);
      result.forEach(row => {
        console.log(`    - ${row.card_title} (ID: ${row.id})`);
      });
    } else {
      console.log(`  ⚠ No one-time plan found for $49.99`);
    }

    // Verification
    console.log('\nVerifying updates...');
    const verification = await client`
      SELECT 
        id,
        card_title,
        price,
        payment_type,
        recurring_interval,
        benefits_jsonb
      FROM pricing_plans
      WHERE environment = 'test'
      ORDER BY payment_type, recurring_interval, price;
    `;

    console.log(`\n✓ Total plans updated: ${verification.length}`);
    console.log('\nUpdated plans:');
    verification.forEach(plan => {
      const benefits = plan.benefits_jsonb as any;
      if (benefits.monthlyCredits) {
        console.log(`  - ${plan.card_title}: ${benefits.monthlyCredits.toLocaleString()} credits/month${benefits.totalMonths ? ` (${benefits.totalMonths} months)` : ''}`);
      } else if (benefits.oneTimeCredits) {
        console.log(`  - ${plan.card_title}: ${benefits.oneTimeCredits.toLocaleString()} credits (one-time)`);
      }
    });

    console.log('\n✅ Pricing plans updated successfully!');
  } catch (error) {
    console.error('❌ Error updating pricing plans:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

