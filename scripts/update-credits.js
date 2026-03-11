require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // 更新月付套餐积分
  // Starter: 1000 credits
  await client.query(`
    UPDATE pricing_plans
    SET benefits_jsonb = '{"monthlyCredits": 1000}'::jsonb
    WHERE card_title = 'Starter' AND recurring_interval = 'month'
  `);

  // Pro: 3300 credits
  await client.query(`
    UPDATE pricing_plans
    SET benefits_jsonb = '{"monthlyCredits": 3300}'::jsonb
    WHERE card_title = 'Pro' AND recurring_interval = 'month'
  `);

  // Ultra: 12000 credits
  await client.query(`
    UPDATE pricing_plans
    SET benefits_jsonb = '{"monthlyCredits": 12000}'::jsonb
    WHERE card_title = 'Ultra' AND recurring_interval = 'month'
  `);

  console.log('✅ 月付积分已更新');

  // 更新年付套餐积分 (12个月 + 20% bonus)
  // Starter Yearly: 1000 * 12 * 1.2 = 12000
  await client.query(`
    UPDATE pricing_plans
    SET benefits_jsonb = '{"monthlyCredits": 1000, "totalCredits": 12000, "savePercent": 20}'::jsonb
    WHERE card_title = 'Starter Yearly' AND recurring_interval = 'year'
  `);

  // Pro Yearly: 3300 * 12 * 1.2 = 39600
  await client.query(`
    UPDATE pricing_plans
    SET benefits_jsonb = '{"monthlyCredits": 3300, "totalCredits": 39600, "savePercent": 20}'::jsonb
    WHERE card_title = 'Pro Yearly' AND recurring_interval = 'year'
  `);

  // Ultra Yearly: 12000 * 12 * 1.2 = 144000
  await client.query(`
    UPDATE pricing_plans
    SET benefits_jsonb = '{"monthlyCredits": 12000, "totalCredits": 144000, "savePercent": 20}'::jsonb
    WHERE card_title = 'Ultra Yearly' AND recurring_interval = 'year'
  `);

  console.log('✅ 年付积分已更新');

  // 显示所有套餐
  const plans = await client.query(`
    SELECT card_title, display_price, price_suffix, recurring_interval, benefits_jsonb
    FROM pricing_plans
    WHERE is_active = true
    ORDER BY price::numeric
  `);

  console.log('\n📋 更新后的套餐:');
  plans.rows.forEach(p => {
    const credits = p.benefits_jsonb?.monthlyCredits || p.benefits_jsonb?.totalCredits || 'N/A';
    console.log(`  ${p.card_title}: ${p.display_price}/${p.price_suffix} - ${credits} credits`);
  });

  await client.end();
}

main();
