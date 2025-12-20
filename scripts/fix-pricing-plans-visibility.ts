import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Fixing pricing plans visibility...\n');

  const client = postgres(connectionString);

  try {
    const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';

    // Plans to keep active (the ones we want to show)
    const activePlanIds = [
      // Monthly plans
      'a57a9fb9-53d9-4f92-8608-3a1116878331', // $29.99/month
      'cd982ab8-29e2-4af9-b82f-25a8cc0b4b3a', // $99.99/month
      'f3350301-7e5d-497f-9c31-38b47a625fae', // $199.99/month
      
      // Annual plans
      '20d4d1d2-34ac-4d28-958d-da6ea48db83e', // $299.9/year
      '0ae9cd6a-8e48-4f88-b781-6b5148177aba', // $999.9/year
      '4d2bce51-b8c9-4b33-8e0b-469aaf05edf1', // $1999.9/year
      
      // One-time plan
      '8703c689-1938-46cb-998a-48a6526cd04a', // $49.99 one-time
    ];

    // First, get all plans in test environment
    const allPlans = await client`
      SELECT id, card_title, price, payment_type, recurring_interval, is_active
      FROM pricing_plans
      WHERE environment = ${environment}
    `;

    console.log(`Found ${allPlans.length} plans in ${environment} environment\n`);

    // Deactivate plans that are not in our active list
    let deactivatedCount = 0;
    for (const plan of allPlans) {
      if (!activePlanIds.includes(plan.id) && plan.is_active) {
        await client`
          UPDATE pricing_plans
          SET is_active = false
          WHERE id = ${plan.id}
        `;
        console.log(`  ❌ Deactivated: ${plan.card_title} ($${plan.price})`);
        deactivatedCount++;
      }
    }

    // Ensure our desired plans are active
    let activatedCount = 0;
    for (const planId of activePlanIds) {
      const result = await client`
        UPDATE pricing_plans
        SET is_active = true
        WHERE id = ${planId}
          AND environment = ${environment}
        RETURNING card_title, price, payment_type, recurring_interval;
      `;
      
      if (result.length > 0) {
        const plan = result[0];
        if (!plan.is_active) {
          console.log(`  ✅ Activated: ${plan.card_title} ($${plan.price})`);
          activatedCount++;
        }
      }
    }

    // Update display_order for better sorting
    console.log('\nUpdating display order...');
    const displayOrders = [
      { id: 'a57a9fb9-53d9-4f92-8608-3a1116878331', order: 1 }, // $29.99/month
      { id: 'cd982ab8-29e2-4af9-b82f-25a8cc0b4b3a', order: 2 }, // $99.99/month
      { id: 'f3350301-7e5d-497f-9c31-38b47a625fae', order: 3 }, // $199.99/month
      { id: '20d4d1d2-34ac-4d28-958d-da6ea48db83e', order: 4 }, // $299.9/year
      { id: '0ae9cd6a-8e48-4f88-b781-6b5148177aba', order: 5 }, // $999.9/year
      { id: '4d2bce51-b8c9-4b33-8e0b-469aaf05edf1', order: 6 }, // $1999.9/year
      { id: '8703c689-1938-46cb-998a-48a6526cd04a', order: 7 }, // $49.99 one-time
    ];

    for (const { id, order } of displayOrders) {
      await client`
        UPDATE pricing_plans
        SET display_order = ${order}
        WHERE id = ${id}
          AND environment = ${environment}
      `;
    }

    // Verify
    console.log('\n✅ Verification - Active plans:');
    const activePlans = await client`
      SELECT 
        id,
        card_title,
        price,
        payment_type,
        recurring_interval,
        display_order,
        benefits_jsonb
      FROM pricing_plans
      WHERE environment = ${environment}
        AND is_active = true
      ORDER BY display_order, payment_type, recurring_interval, price;
    `;

    activePlans.forEach(plan => {
      const benefits = plan.benefits_jsonb as any;
      const credits = benefits?.monthlyCredits 
        ? `${benefits.monthlyCredits.toLocaleString()} credits/month${benefits.totalMonths ? ` (${benefits.totalMonths} months)` : ''}`
        : benefits?.oneTimeCredits 
        ? `${benefits.oneTimeCredits.toLocaleString()} credits (one-time)`
        : 'No credits';
      
      console.log(`  [${plan.display_order}] ${plan.card_title}: $${plan.price}`);
      console.log(`      ${plan.payment_type}${plan.recurring_interval ? ` / ${plan.recurring_interval}` : ''} → ${credits}`);
    });

    console.log(`\n✅ Summary:`);
    console.log(`  - Deactivated: ${deactivatedCount} plans`);
    console.log(`  - Active plans: ${activePlans.length}`);
    console.log(`  - Display order updated`);

  } catch (error) {
    console.error('❌ Error fixing pricing plans:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

