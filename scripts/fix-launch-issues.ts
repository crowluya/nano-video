/**
 * Fix Launch Issues Script
 *
 * 修复上线前的数据问题：
 * 1. "Stande Plan" → "Standard Plan" 拼写错误
 * 2. Standard Plan 积分 110,000 → 11,000
 * 3. 隐藏 Creem 相关套餐 (is_active = false)
 */

import postgres from 'postgres';
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('🔧 Fixing launch issues...\n');

  const client = postgres(connectionString);

  try {
    // ========================================
    // FIX-001: 修复 "Stande Plan" 拼写错误
    // ========================================
    console.log('📝 FIX-001: Fixing "Stande Plan" → "Standard Plan"...');

    const fixSpelling = await client`
      UPDATE pricing_plans
      SET
        card_title = REPLACE(card_title, 'Stande Plan', 'Standard Plan'),
        lang_jsonb = REPLACE(lang_jsonb::text, 'Stande Plan', 'Standard Plan')::jsonb
      WHERE card_title LIKE '%Stande%'
      RETURNING id, card_title;
    `;

    if (fixSpelling.length > 0) {
      console.log(`  ✓ Fixed ${fixSpelling.length} plan(s):`);
      fixSpelling.forEach(p => console.log(`    - ${p.card_title} (ID: ${p.id})`));
    } else {
      console.log('  ℹ No "Stande Plan" found (may already be fixed)');
    }

    // ========================================
    // FIX-002: 修复 Standard Plan 积分 (110,000 → 11,000)
    // ========================================
    console.log('\n📝 FIX-002: Fixing Standard Plan credits (110,000 → 11,000)...');

    // 月度 Standard Plan ($99.99/month)
    const fixMonthlyStandard = await client`
      UPDATE pricing_plans
      SET benefits_jsonb = '{"monthlyCredits": 11000}'::jsonb
      WHERE price = '99.99'
        AND payment_type = 'recurring'
        AND recurring_interval = 'month'
        AND environment = 'test'
      RETURNING id, card_title, price, benefits_jsonb;
    `;

    if (fixMonthlyStandard.length > 0) {
      console.log(`  ✓ Fixed monthly Standard Plan:`);
      fixMonthlyStandard.forEach(p =>
        console.log(`    - ${p.card_title}: $${p.price}/month → 11,000 credits/month`)
      );
    }

    // 年度 Standard Plan ($999.90/year)
    const fixAnnualStandard = await client`
      UPDATE pricing_plans
      SET benefits_jsonb = '{"monthlyCredits": 11000, "totalMonths": 12}'::jsonb
      WHERE price = '999.9'
        AND payment_type = 'recurring'
        AND recurring_interval = 'year'
        AND environment = 'test'
      RETURNING id, card_title, price, benefits_jsonb;
    `;

    if (fixAnnualStandard.length > 0) {
      console.log(`  ✓ Fixed annual Standard Plan:`);
      fixAnnualStandard.forEach(p =>
        console.log(`    - ${p.card_title}: $${p.price}/year → 11,000 credits/month`)
      );
    }

    // ========================================
    // FIX-003: 隐藏 Creem 相关套餐
    // ========================================
    console.log('\n📝 FIX-003: Hiding Creem plans (is_active = false)...');

    const hideCreem = await client`
      UPDATE pricing_plans
      SET is_active = false
      WHERE provider = 'creem'
      RETURNING id, card_title, provider;
    `;

    if (hideCreem.length > 0) {
      console.log(`  ✓ Hidden ${hideCreem.length} Creem plan(s):`);
      hideCreem.forEach(p => console.log(`    - ${p.card_title} (provider: ${p.provider})`));
    } else {
      console.log('  ℹ No Creem plans found or already hidden');
    }

    // ========================================
    // 验证修复结果
    // ========================================
    console.log('\n✅ Verification:');

    const verification = await client`
      SELECT
        card_title,
        price,
        payment_type,
        recurring_interval,
        provider,
        is_active,
        benefits_jsonb
      FROM pricing_plans
      WHERE environment = 'test'
        AND is_active = true
        AND provider = 'stripe'
      ORDER BY
        CASE payment_type
          WHEN 'recurring' THEN 1
          WHEN 'one_time' THEN 2
        END,
        CASE recurring_interval
          WHEN 'month' THEN 1
          WHEN 'year' THEN 2
        END,
        price::numeric;
    `;

    console.log('\n📊 Active Stripe Plans:');
    console.log('─'.repeat(70));

    verification.forEach(plan => {
      const benefits = plan.benefits_jsonb as any;
      let creditsInfo = 'No credits';

      if (benefits?.monthlyCredits) {
        creditsInfo = `${benefits.monthlyCredits.toLocaleString()} credits/month`;
      } else if (benefits?.oneTimeCredits) {
        creditsInfo = `${benefits.oneTimeCredits.toLocaleString()} credits (one-time)`;
      }

      const interval = plan.recurring_interval === 'month' ? '/month' :
                       plan.recurring_interval === 'year' ? '/year' : '';

      console.log(`  ${plan.card_title.padEnd(25)} $${plan.price}${interval.padEnd(8)} → ${creditsInfo}`);
    });

    console.log('─'.repeat(70));
    console.log('\n🎉 All launch issues fixed!');

  } catch (error) {
    console.error('❌ Error fixing launch issues:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
