import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function checkRecentOrders() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Connecting to database...');
  const client = postgres(connectionString);

  try {
    // Check recent orders
    console.log('\n📦 Recent Orders (Last 5):');
    const orders = await client`
      SELECT id, user_id, status, order_type, plan_id, amount_total, created_at 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    if (orders.length === 0) {
      console.log('  ⚠️  No orders found');
    } else {
      orders.forEach((order, index) => {
        console.log(`\n  ${index + 1}. Order ID: ${order.id}`);
        console.log(`     User ID: ${order.user_id}`);
        console.log(`     Status: ${order.status}`);
        console.log(`     Type: ${order.order_type}`);
        console.log(`     Plan ID: ${order.plan_id}`);
        console.log(`     Amount: ${order.amount_total}`);
        console.log(`     Created: ${order.created_at}`);
      });
    }

    // Check credit logs for the most recent order
    if (orders.length > 0) {
      const latestOrder = orders[0];
      console.log(`\n💰 Credit Logs for Order ${latestOrder.id}:`);
      const creditLogs = await client`
        SELECT id, user_id, amount, type, notes, created_at
        FROM credit_logs
        WHERE related_order_id = ${latestOrder.id}
        ORDER BY created_at DESC
      `;
      
      if (creditLogs.length === 0) {
        console.log('  ⚠️  No credit logs found for this order');
      } else {
        creditLogs.forEach((log, index) => {
          console.log(`\n  ${index + 1}. Log ID: ${log.id}`);
          console.log(`     Amount: ${log.amount}`);
          console.log(`     Type: ${log.type}`);
          console.log(`     Notes: ${log.notes}`);
          console.log(`     Created: ${log.created_at}`);
        });
      }

      // Check user's current credit balance
      console.log(`\n💳 User Credit Balance (User ${latestOrder.user_id}):`);
      const usage = await client`
        SELECT one_time_credits_balance, subscription_credits_balance
        FROM usage
        WHERE user_id = ${latestOrder.user_id}
      `;
      
      if (usage.length === 0) {
        console.log('  ⚠️  No usage record found for this user');
      } else {
        console.log(`  One-Time Credits: ${usage[0].one_time_credits_balance}`);
        console.log(`  Subscription Credits: ${usage[0].subscription_credits_balance}`);
        console.log(`  Total: ${usage[0].one_time_credits_balance + usage[0].subscription_credits_balance}`);
      }
    }

    console.log('\n✅ Check complete!');
  } catch (error) {
    console.error('❌ Error checking orders:', error);
    throw error;
  } finally {
    await client.end();
  }
}

checkRecentOrders()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

