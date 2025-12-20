import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Debugging pricing display data...\n');

  const client = postgres(connectionString);

  try {
    const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    
    // Simulate what getPublicPricingPlans returns
    const plans = await client`
      SELECT 
        id,
        card_title,
        price,
        payment_type,
        recurring_interval,
        display_price,
        benefits_jsonb,
        is_active,
        display_order
      FROM pricing_plans
      WHERE environment = ${environment}
        AND is_active = true
      ORDER BY display_order;
    `;

    console.log(`Environment: ${environment}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`Total active plans: ${plans.length}\n`);

    plans.forEach((plan, index) => {
      console.log(`\n${index + 1}. ${plan.card_title}`);
      console.log(`   Price: $${plan.price}`);
      console.log(`   Display Price: ${plan.display_price || 'N/A'}`);
      console.log(`   Payment Type: ${plan.payment_type}`);
      console.log(`   Recurring Interval: ${plan.recurring_interval || 'N/A'}`);
      console.log(`   Display Order: ${plan.display_order}`);
      console.log(`   Benefits JSONB Type: ${typeof plan.benefits_jsonb}`);
      console.log(`   Benefits JSONB: ${JSON.stringify(plan.benefits_jsonb, null, 2)}`);
      
      // Parse benefits
      const benefits = plan.benefits_jsonb as any;
      if (benefits && typeof benefits === 'object') {
        if (benefits.monthlyCredits) {
          console.log(`   ✓ Monthly Credits: ${benefits.monthlyCredits.toLocaleString()}`);
        }
        if (benefits.oneTimeCredits) {
          console.log(`   ✓ One-Time Credits: ${benefits.oneTimeCredits.toLocaleString()}`);
        }
        if (benefits.totalMonths) {
          console.log(`   ✓ Total Months: ${benefits.totalMonths}`);
        }
      } else {
        console.log(`   ⚠️  Benefits is not an object or is null`);
      }
    });

    // Check what the component would render
    console.log('\n\n📋 What would be displayed on homepage:\n');
    
    const monthlyPlans = plans.filter(p => 
      p.payment_type === 'recurring' && 
      (p.recurring_interval === 'month' || p.recurring_interval === 'every-month')
    );
    
    const annualPlans = plans.filter(p => 
      p.payment_type === 'recurring' && 
      (p.recurring_interval === 'year' || p.recurring_interval === 'every-year')
    );
    
    const oneTimePlans = plans.filter(p => 
      p.payment_type === 'one_time' || p.payment_type === 'onetime'
    );

    if (monthlyPlans.length > 0) {
      console.log('Monthly Plans:');
      monthlyPlans.forEach(p => {
        const benefits = p.benefits_jsonb as any;
        const credits = benefits?.monthlyCredits || 0;
        console.log(`  - ${p.card_title}: $${p.price}/month → ${credits > 0 ? credits.toLocaleString() + ' credits/month' : 'NO CREDITS'}`);
      });
    }

    if (annualPlans.length > 0) {
      console.log('\nAnnual Plans:');
      annualPlans.forEach(p => {
        const benefits = p.benefits_jsonb as any;
        const credits = benefits?.monthlyCredits || 0;
        const months = benefits?.totalMonths || 0;
        console.log(`  - ${p.card_title}: $${p.price}/year → ${credits > 0 ? credits.toLocaleString() + ' credits/month' : 'NO CREDITS'}${months > 0 ? ` (${months} months)` : ''}`);
      });
    }

    if (oneTimePlans.length > 0) {
      console.log('\nOne-Time Plans:');
      oneTimePlans.forEach(p => {
        const benefits = p.benefits_jsonb as any;
        const credits = benefits?.oneTimeCredits || 0;
        console.log(`  - ${p.card_title}: $${p.price} → ${credits > 0 ? credits.toLocaleString() + ' credits' : 'NO CREDITS'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

