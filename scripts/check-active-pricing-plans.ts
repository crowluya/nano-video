import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Checking active pricing plans that will be displayed on homepage...\n');

  const client = postgres(connectionString);

  try {
    // Check what getPublicPricingPlans would return
    const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    console.log(`Environment: ${environment}\n`);

    const plans = await client`
      SELECT 
        id,
        card_title,
        price,
        payment_type,
        recurring_interval,
        environment,
        is_active,
        display_order,
        benefits_jsonb
      FROM pricing_plans
      WHERE environment = ${environment}
        AND is_active = true
      ORDER BY display_order, payment_type, recurring_interval, price;
    `;

    console.log(`Found ${plans.length} active plans in ${environment} environment:\n`);

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
      console.log('📅 Monthly Plans (will be displayed):');
      monthlyPlans.forEach(plan => {
        const benefits = plan.benefits_jsonb as any;
        const credits = benefits?.monthlyCredits || 'NOT SET';
        console.log(`  - ${plan.card_title}: $${plan.price}/month`);
        console.log(`    Credits: ${typeof credits === 'number' ? credits.toLocaleString() : credits}`);
        console.log(`    Display Order: ${plan.display_order}`);
        console.log(`    ID: ${plan.id}`);
        console.log('');
      });
    }

    if (annualPlans.length > 0) {
      console.log('📅 Annual Plans (will be displayed):');
      annualPlans.forEach(plan => {
        const benefits = plan.benefits_jsonb as any;
        const credits = benefits?.monthlyCredits || 'NOT SET';
        console.log(`  - ${plan.card_title}: $${plan.price}/year`);
        console.log(`    Credits: ${typeof credits === 'number' ? credits.toLocaleString() : credits} credits/month`);
        console.log(`    Display Order: ${plan.display_order}`);
        console.log(`    ID: ${plan.id}`);
        console.log('');
      });
    }

    if (oneTimePlans.length > 0) {
      console.log('💰 One-Time Plans (will be displayed):');
      oneTimePlans.forEach(plan => {
        const benefits = plan.benefits_jsonb as any;
        const credits = benefits?.oneTimeCredits || 'NOT SET';
        console.log(`  - ${plan.card_title}: $${plan.price}`);
        console.log(`    Credits: ${typeof credits === 'number' ? credits.toLocaleString() : credits}`);
        console.log(`    Display Order: ${plan.display_order}`);
        console.log(`    ID: ${plan.id}`);
        console.log('');
      });
    }

    // Check if the expected plans are active
    console.log('\n🔍 Checking expected plans (29.99, 99.99, 199.99, 49.99):\n');
    
    const expectedPrices = {
      monthly: ['29.99', '99.99', '199.99'],
      annual: ['299.9', '999.9', '1999.9'],
      oneTime: ['49.99']
    };

    for (const price of expectedPrices.monthly) {
      const plan = await client`
        SELECT id, card_title, price, is_active, display_order
        FROM pricing_plans
        WHERE price = ${price}
          AND payment_type = 'recurring'
          AND recurring_interval = 'month'
          AND environment = ${environment}
        LIMIT 1;
      `;
      
      if (plan.length > 0) {
        const p = plan[0];
        console.log(`$${price}/month: ${p.is_active ? '✅ ACTIVE' : '❌ INACTIVE'} (Order: ${p.display_order})`);
        console.log(`  - ${p.card_title} (ID: ${p.id})`);
      } else {
        console.log(`$${price}/month: ❌ NOT FOUND`);
      }
    }

    for (const price of expectedPrices.annual) {
      const plan = await client`
        SELECT id, card_title, price, is_active, display_order
        FROM pricing_plans
        WHERE price = ${price}
          AND payment_type = 'recurring'
          AND recurring_interval = 'year'
          AND environment = ${environment}
        LIMIT 1;
      `;
      
      if (plan.length > 0) {
        const p = plan[0];
        console.log(`$${price}/year: ${p.is_active ? '✅ ACTIVE' : '❌ INACTIVE'} (Order: ${p.display_order})`);
        console.log(`  - ${p.card_title} (ID: ${p.id})`);
      } else {
        console.log(`$${price}/year: ❌ NOT FOUND`);
      }
    }

    for (const price of expectedPrices.oneTime) {
      const plan = await client`
        SELECT id, card_title, price, is_active, display_order
        FROM pricing_plans
        WHERE price = ${price}
          AND payment_type IN ('one_time', 'onetime')
          AND environment = ${environment}
        LIMIT 1;
      `;
      
      if (plan.length > 0) {
        const p = plan[0];
        console.log(`$${price} one-time: ${p.is_active ? '✅ ACTIVE' : '❌ INACTIVE'} (Order: ${p.display_order})`);
        console.log(`  - ${p.card_title} (ID: ${p.id})`);
      } else {
        console.log(`$${price} one-time: ❌ NOT FOUND`);
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
