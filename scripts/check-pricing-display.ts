import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = postgres(connectionString);

  try {
    const environment = 'test';
    
    const plans = await client`
      SELECT 
        id,
        card_title,
        price,
        display_price,
        payment_type,
        recurring_interval,
        display_order,
        is_active,
        benefits_jsonb
      FROM pricing_plans
      WHERE environment = ${environment}
        AND is_active = true
      ORDER BY display_order;
    `;

    console.log('Active pricing plans display info:\n');
    
    plans.forEach(plan => {
      const benefits = plan.benefits_jsonb as any;
      const credits = benefits?.monthlyCredits 
        ? `${benefits.monthlyCredits.toLocaleString()} credits/month${benefits.totalMonths ? ` (${benefits.totalMonths} months)` : ''}`
        : benefits?.oneTimeCredits 
        ? `${benefits.oneTimeCredits.toLocaleString()} credits (one-time)`
        : 'No credits';
      
      console.log(`[${plan.display_order}] ${plan.card_title}`);
      console.log(`  Price (DB): $${plan.price}`);
      console.log(`  Display Price: ${plan.display_price || 'NOT SET'}`);
      console.log(`  Type: ${plan.payment_type}${plan.recurring_interval ? ` / ${plan.recurring_interval}` : ''}`);
      console.log(`  Credits: ${credits}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

