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

  console.log('Checking pricing plans...\n');

  const client = postgres(connectionString);

  try {
    // Check all pricing plans
    const plans = await client`
      SELECT 
        id,
        card_title,
        price,
        payment_type,
        recurring_interval,
        environment,
        benefits_jsonb
      FROM pricing_plans
      WHERE environment = 'test'
      ORDER BY payment_type, recurring_interval, price;
    `;

    console.log(`Found ${plans.length} pricing plans in test environment:\n`);

    // Group by payment type
    const monthlyPlans = plans.filter(p => 
      p.payment_type === 'recurring' && p.recurring_interval === 'month'
    );
    const annualPlans = plans.filter(p => 
      p.payment_type === 'recurring' && p.recurring_interval === 'year'
    );
    const oneTimePlans = plans.filter(p => 
      p.payment_type === 'one_time' || p.payment_type === 'onetime'
    );

    if (monthlyPlans.length > 0) {
      console.log('📅 Monthly Plans:');
      monthlyPlans.forEach(plan => {
        const benefits = plan.benefits_jsonb as any;
        const credits = benefits?.monthlyCredits || 'NOT SET';
        console.log(`  - ${plan.card_title}: $${plan.price}/month`);
        console.log(`    Credits: ${typeof credits === 'number' ? credits.toLocaleString() : credits}`);
        console.log(`    ID: ${plan.id}`);
        console.log(`    Benefits JSON: ${JSON.stringify(benefits)}`);
        console.log('');
      });
    }

    if (annualPlans.length > 0) {
      console.log('📅 Annual Plans:');
      annualPlans.forEach(plan => {
        const benefits = plan.benefits_jsonb as any;
        const credits = benefits?.monthlyCredits || 'NOT SET';
        const months = benefits?.totalMonths || 'NOT SET';
        console.log(`  - ${plan.card_title}: $${plan.price}/year`);
        console.log(`    Credits: ${typeof credits === 'number' ? credits.toLocaleString() : 'NOT SET'} credits/month`);
        console.log(`    Total Months: ${months}`);
        console.log(`    ID: ${plan.id}`);
        console.log(`    Benefits JSON: ${JSON.stringify(benefits)}`);
        console.log('');
      });
    }

    if (oneTimePlans.length > 0) {
      console.log('💰 One-Time Plans:');
      oneTimePlans.forEach(plan => {
        const benefits = plan.benefits_jsonb as any;
        const credits = benefits?.oneTimeCredits || 'NOT SET';
        console.log(`  - ${plan.card_title}: $${plan.price}`);
        console.log(`    Credits: ${typeof credits === 'number' ? credits.toLocaleString() : credits}`);
        console.log(`    ID: ${plan.id}`);
        console.log(`    Benefits JSON: ${JSON.stringify(benefits)}`);
        console.log('');
      });
    }

    // Check specific plans
    console.log('\n🔍 Checking specific plans (29.99, 99.99, 199.99):\n');
    
    const specificPrices = ['29.99', '99.99', '199.99'];
    for (const price of specificPrices) {
      const plan = await client`
        SELECT 
          id,
          card_title,
          price,
          payment_type,
          recurring_interval,
          benefits_jsonb
        FROM pricing_plans
        WHERE price = ${price}
          AND payment_type = 'recurring'
          AND recurring_interval = 'month'
          AND environment = 'test'
        LIMIT 1;
      `;
      
      if (plan.length > 0) {
        const p = plan[0];
        const benefits = p.benefits_jsonb as any;
        const credits = benefits?.monthlyCredits;
        console.log(`$${price}/month:`);
        console.log(`  Title: ${p.card_title}`);
        console.log(`  ID: ${p.id}`);
        console.log(`  Credits: ${credits ? credits.toLocaleString() : 'NOT SET'}`);
        console.log(`  Full Benefits: ${JSON.stringify(benefits, null, 2)}`);
        console.log('');
      } else {
        console.log(`$${price}/month: NOT FOUND`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error checking pricing plans:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

