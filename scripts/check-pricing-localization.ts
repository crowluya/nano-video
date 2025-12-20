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
        is_active,
        lang_jsonb,
        benefits_jsonb
      FROM pricing_plans
      WHERE environment = ${environment}
        AND is_active = true
      ORDER BY display_order;
    `;

    console.log('Checking pricing plans localization and display:\n');
    
    plans.forEach(plan => {
      const langJsonb = plan.lang_jsonb as any;
      const benefits = plan.benefits_jsonb as any;
      
      console.log(`${plan.card_title} ($${plan.price}):`);
      console.log(`  Display Price: ${plan.display_price || 'NOT SET'}`);
      console.log(`  Lang JSONB: ${langJsonb ? JSON.stringify(langJsonb).substring(0, 100) + '...' : 'EMPTY'}`);
      
      // Check if has English localization
      const enLocalization = langJsonb?.en;
      if (enLocalization) {
        console.log(`  ✅ Has English localization`);
        console.log(`     Title: ${enLocalization.cardTitle || 'NOT SET'}`);
        console.log(`     Display Price: ${enLocalization.displayPrice || 'NOT SET'}`);
      } else {
        console.log(`  ⚠️  No English localization - will use card_title: ${plan.card_title}`);
      }
      
      // Check credits
      const credits = benefits?.monthlyCredits 
        ? `${benefits.monthlyCredits.toLocaleString()} credits/month${benefits.totalMonths ? ` (${benefits.totalMonths} months)` : ''}`
        : benefits?.oneTimeCredits 
        ? `${benefits.oneTimeCredits.toLocaleString()} credits (one-time)`
        : 'No credits';
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

