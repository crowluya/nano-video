import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function updatePricingPlans() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Connecting to database...');
  const client = postgres(connectionString);

  try {
    // Monthly Plans
    console.log('\n📝 Updating monthly plans...');
    
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
        console.log(`  ✅ Updated: $${plan.price}/month → ${plan.credits.toLocaleString()} credits/month`);
      } else {
        console.log(`  ⚠️  No plan found for $${plan.price}/month`);
      }
    }

    // Annual Plans
    console.log('\n📝 Updating annual plans...');
    
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
        console.log(`  ✅ Updated: $${plan.price}/year → ${plan.credits.toLocaleString()} credits/month (12 months)`);
      } else {
        console.log(`  ⚠️  No plan found for $${plan.price}/year`);
      }
    }

    // One-Time Plans
    console.log('\n📝 Updating one-time plans...');
    
    const result = await client`
      UPDATE pricing_plans
      SET benefits_jsonb = ${JSON.stringify({ oneTimeCredits: 5000 })}::jsonb
      WHERE price = '49.99'
        AND payment_type IN ('one_time', 'onetime')
        AND environment = 'test'
      RETURNING id, card_title, price, benefits_jsonb;
    `;
    
    if (result.length > 0) {
      console.log(`  ✅ Updated: $49.99 one-time → 5,000 credits`);
    } else {
      console.log(`  ⚠️  No plan found for $49.99 one-time`);
    }

    // Verification
    console.log('\n📊 Verification:');
    const allPlans = await client`
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

    console.log(`\n  Total plans in test environment: ${allPlans.length}`);
    for (const plan of allPlans) {
      const benefits = plan.benefits_jsonb as any;
      const creditsInfo = benefits.monthlyCredits 
        ? `${benefits.monthlyCredits.toLocaleString()} credits/month${benefits.totalMonths ? ` (${benefits.totalMonths} months)` : ''}`
        : benefits.oneTimeCredits 
        ? `${benefits.oneTimeCredits.toLocaleString()} credits (one-time)`
        : 'No credits configured';
      
      console.log(`  - ${plan.card_title}: $${plan.price} → ${creditsInfo}`);
    }

    console.log('\n✅ Pricing plans updated successfully!');
  } catch (error) {
    console.error('❌ Error updating pricing plans:', error);
    throw error;
  } finally {
    await client.end();
  }
}

updatePricingPlans()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

