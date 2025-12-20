import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Finding all plans that might be displayed (including inactive)...\n');

  const client = postgres(connectionString);

  try {
    const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    
    // Get ALL plans in test environment
    const allPlans = await client`
      SELECT 
        id,
        card_title,
        price,
        payment_type,
        recurring_interval,
        is_active,
        display_order,
        provider
      FROM pricing_plans
      WHERE environment = ${environment}
      ORDER BY is_active DESC, display_order, payment_type, recurring_interval, price;
    `;

    console.log(`Total plans in ${environment} environment: ${allPlans.length}\n`);

    // Group by active/inactive
    const activePlans = allPlans.filter(p => p.is_active);
    const inactivePlans = allPlans.filter(p => !p.is_active);

    console.log(`Active: ${activePlans.length}, Inactive: ${inactivePlans.length}\n`);

    // Check for plans that match the unwanted prices from the image
    const unwantedPatterns = [
      { price: '9.9', desc: '$9.90' },
      { price: '19', desc: '$19.00' },
      { price: '99', desc: '$99.00 (not 99.99)' },
      { price: '199', desc: '$199.00 (not 199.99)' },
      { price: '256', desc: '$256.00' },
    ];

    console.log('🔍 Checking for unwanted plans:\n');
    
    for (const pattern of unwantedPatterns) {
      const plans = await client`
        SELECT id, card_title, price, payment_type, recurring_interval, is_active, display_order
        FROM pricing_plans
        WHERE price::text = ${pattern.price}
          AND environment = ${environment}
        ORDER BY is_active DESC;
      `;
      
      if (plans.length > 0) {
        console.log(`${pattern.desc}:`);
        plans.forEach(p => {
          console.log(`  - ${p.card_title}: $${p.price} (${p.is_active ? '✅ ACTIVE' : '❌ INACTIVE'}, Order: ${p.display_order})`);
          console.log(`    Type: ${p.payment_type}${p.recurring_interval ? ` (${p.recurring_interval})` : ''}`);
          console.log(`    ID: ${p.id}`);
        });
        console.log('');
      }
    }

    // Also check for "Monthly Plan" and other generic names
    console.log('🔍 Checking for plans with generic names:\n');
    const genericNames = ['Monthly Plan', 'Annual Plan', 'Annual Credits Plan', 'Pro', 'Pro - creem'];
    
    for (const name of genericNames) {
      const plans = await client`
        SELECT id, card_title, price, payment_type, recurring_interval, is_active, display_order
        FROM pricing_plans
        WHERE card_title = ${name}
          AND environment = ${environment}
        ORDER BY is_active DESC, price;
      `;
      
      if (plans.length > 0) {
        console.log(`Plans named "${name}":`);
        plans.forEach(p => {
          console.log(`  - $${p.price} (${p.is_active ? '✅ ACTIVE' : '❌ INACTIVE'}, Order: ${p.display_order})`);
          console.log(`    Type: ${p.payment_type}${p.recurring_interval ? ` (${p.recurring_interval})` : ''}`);
          console.log(`    ID: ${p.id}`);
        });
        console.log('');
      }
    }

    // Show summary
    console.log('\n📊 Summary:');
    console.log(`Expected active plans: 7 (29.99, 99.99, 199.99 monthly + 299.9, 999.9, 1999.9 yearly + 49.99 one-time)`);
    console.log(`Current active plans: ${activePlans.length}`);
    
    if (activePlans.length > 7) {
      console.log(`\n⚠️  WARNING: More than 7 active plans found!`);
      console.log('The following plans should be deactivated:');
      activePlans.forEach((plan, index) => {
        const isExpected = 
          (plan.price === '29.99' && plan.recurring_interval === 'month') ||
          (plan.price === '99.99' && plan.recurring_interval === 'month') ||
          (plan.price === '199.99' && plan.recurring_interval === 'month') ||
          (plan.price === '299.9' && plan.recurring_interval === 'year') ||
          (plan.price === '999.9' && plan.recurring_interval === 'year') ||
          (plan.price === '1999.9' && plan.recurring_interval === 'year') ||
          (plan.price === '49.99' && (plan.payment_type === 'one_time' || plan.payment_type === 'onetime'));
        
        if (!isExpected) {
          console.log(`  - ${plan.card_title}: $${plan.price} (ID: ${plan.id})`);
        }
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

