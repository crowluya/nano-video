import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Ensuring only correct pricing plans are active...\n');

  const client = postgres(connectionString);

  try {
    const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    
    // Expected plan IDs (from previous checks)
    const expectedPlanIds = [
      'a57a9fb9-53d9-4f92-8608-3a1116878331', // $29.99/month
      'cd982ab8-29e2-4af9-b82f-25a8cc0b4b3a', // $99.99/month
      'f3350301-7e5d-497f-9c31-38b47a625fae', // $199.99/month
      '20d4d1d2-34ac-4d28-958d-da6ea48db83e', // $299.90/year
      '0ae9cd6a-8e48-4f88-b781-6b5148177aba', // $999.90/year
      '4d2bce51-b8c9-4b33-8e0b-469aaf05edf1', // $1999.90/year
      '8703c689-1938-46cb-998a-48a6526cd04a', // $49.99 one-time
    ];

    // Deactivate all plans first
    console.log('Step 1: Deactivating all plans in test environment...');
    const deactivateResult = await client`
      UPDATE pricing_plans
      SET is_active = false
      WHERE environment = ${environment}
    `;
    console.log(`  ✓ Deactivated all plans\n`);

    // Activate only expected plans
    console.log('Step 2: Activating only expected plans...');
    for (const planId of expectedPlanIds) {
      const result = await client`
        UPDATE pricing_plans
        SET is_active = true
        WHERE id = ${planId}
          AND environment = ${environment}
        RETURNING id, card_title, price, payment_type, recurring_interval;
      `;
      
      if (result.length > 0) {
        const plan = result[0];
        console.log(`  ✓ Activated: ${plan.card_title} - $${plan.price}`);
      } else {
        console.log(`  ⚠️  Plan ID ${planId} not found`);
      }
    }

    // Verify
    console.log('\nStep 3: Verification...');
    const activePlans = await client`
      SELECT 
        id,
        card_title,
        price,
        payment_type,
        recurring_interval,
        is_active
      FROM pricing_plans
      WHERE environment = ${environment}
        AND is_active = true
      ORDER BY display_order;
    `;

    console.log(`\n✅ Total active plans: ${activePlans.length}`);
    console.log('\nActive plans:');
    activePlans.forEach((plan, index) => {
      console.log(`  ${index + 1}. ${plan.card_title}: $${plan.price} (${plan.payment_type}${plan.recurring_interval ? ` - ${plan.recurring_interval}` : ''})`);
    });

    // Check for any unwanted active plans
    const allActive = await client`
      SELECT id, card_title, price
      FROM pricing_plans
      WHERE environment = ${environment}
        AND is_active = true
    `;
    
    const unwantedActive = allActive.filter(p => !expectedPlanIds.includes(p.id));

    if (unwantedActive.length > 0) {
      console.log('\n⚠️  WARNING: Found unexpected active plans:');
      unwantedActive.forEach(plan => {
        console.log(`  - ${plan.card_title}: $${plan.price} (ID: ${plan.id})`);
      });
    } else {
      console.log('\n✅ All active plans are correct!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

