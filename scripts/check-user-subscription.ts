import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function checkUserSubscription() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Connecting to database...');
  const client = postgres(connectionString);

  try {
    // Check if there are any users
    console.log('\n👤 Users:');
    const users = await client`
      SELECT id, name, email, created_at
      FROM "user"
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    if (users.length === 0) {
      console.log('  ⚠️  No users found');
      return;
    }

    users.forEach((user, index) => {
      console.log(`\n  ${index + 1}. User: ${user.name || 'N/A'} (${user.email || 'N/A'})`);
      console.log(`     ID: ${user.id}`);
      console.log(`     Created: ${user.created_at}`);
    });

    // Check usage for the first user
    const firstUser = users[0];
    console.log(`\n\n💳 Checking usage for user ${firstUser.id}:`);
    const usage = await client`
      SELECT 
        one_time_credits_balance,
        subscription_credits_balance,
        balance_jsonb,
        created_at,
        updated_at
      FROM usage
      WHERE user_id = ${firstUser.id}
    `;
    
    if (usage.length === 0) {
      console.log('  ⚠️  No usage record found');
    } else {
      const u = usage[0];
      console.log(`  One-Time Credits: ${u.one_time_credits_balance}`);
      console.log(`  Subscription Credits: ${u.subscription_credits_balance}`);
      console.log(`  Total: ${u.one_time_credits_balance + u.subscription_credits_balance}`);
      console.log(`  Balance JSONB: ${JSON.stringify(u.balance_jsonb)}`);
      console.log(`  Updated: ${u.updated_at}`);
    }

    // Check subscriptions (orders table with subscription_id)
    console.log(`\n\n📅 Checking subscriptions for user ${firstUser.id}:`);
    const subscriptions = await client`
      SELECT 
        id,
        order_type,
        subscription_id,
        status,
        plan_id,
        amount_total,
        currency,
        created_at
      FROM orders
      WHERE user_id = ${firstUser.id}
        AND subscription_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    if (subscriptions.length === 0) {
      console.log('  ⚠️  No subscription orders found');
    } else {
      subscriptions.forEach((sub, index) => {
        console.log(`\n  ${index + 1}. Subscription Order:`);
        console.log(`     Order ID: ${sub.id}`);
        console.log(`     Type: ${sub.order_type}`);
        console.log(`     Subscription ID: ${sub.subscription_id}`);
        console.log(`     Status: ${sub.status}`);
        console.log(`     Plan ID: ${sub.plan_id}`);
        console.log(`     Amount: ${sub.amount_total} ${sub.currency}`);
        console.log(`     Created: ${sub.created_at}`);
      });
    }

    // Check all credit logs for this user
    console.log(`\n\n💰 Credit Logs for user ${firstUser.id}:`);
    const logs = await client`
      SELECT 
        id,
        amount,
        type,
        notes,
        related_order_id,
        created_at
      FROM credit_logs
      WHERE user_id = ${firstUser.id}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    if (logs.length === 0) {
      console.log('  ⚠️  No credit logs found');
    } else {
      logs.forEach((log, index) => {
        console.log(`\n  ${index + 1}. ${log.type}:`);
        console.log(`     Amount: ${log.amount}`);
        console.log(`     Notes: ${log.notes}`);
        console.log(`     Order ID: ${log.related_order_id || 'N/A'}`);
        console.log(`     Created: ${log.created_at}`);
      });
    }

    console.log('\n✅ Check complete!');
  } catch (error) {
    console.error('❌ Error checking subscription:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkUserSubscription()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

