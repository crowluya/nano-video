import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Checking ALL active pricing plans...\n');

  const client = postgres(connectionString);

  try {
    const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    
    const allPlans = await client`
      SELECT 
        id,
        card_title,
        price,
        payment_type,
        recurring_interval,
        environment,
        is_active,
        display_order,
        provider
      FROM pricing_plans
      WHERE environment = ${environment}
        AND is_active = true
      ORDER BY display_order, payment_type, recurring_interval, price;
    `;

    console.log(`Total active plans in ${environment}: ${allPlans.length}\n`);

    allPlans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.card_title}`);
      console.log(`   Price: $${plan.price}`);
      console.log(`   Type: ${plan.payment_type}${plan.recurring_interval ? ` (${plan.recurring_interval})` : ''}`);
      console.log(`   Provider: ${plan.provider || 'none'}`);
      console.log(`   Display Order: ${plan.display_order}`);
      console.log(`   ID: ${plan.id}`);
      console.log('');
    });

    // Check for plans that should be deactivated
    const unwantedPrices = ['9.9', '19', '99', '199', '256'];
    console.log('\n🔍 Checking for unwanted plans that should be deactivated:\n');
    
    for (const price of unwantedPrices) {
      const plans = await client`
        SELECT id, card_title, price, is_active, display_order
        FROM pricing_plans
        WHERE price::text LIKE ${price + '%'}
          AND environment = ${environment}
          AND is_active = true
        ORDER BY price;
      `;
      
      if (plans.length > 0) {
        console.log(`Plans with price like $${price}:`);
        plans.forEach(p => {
          console.log(`  - ${p.card_title}: $${p.price} (${p.is_active ? 'ACTIVE' : 'INACTIVE'}, Order: ${p.display_order})`);
          console.log(`    ID: ${p.id}`);
        });
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

