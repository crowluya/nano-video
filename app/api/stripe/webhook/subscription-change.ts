import { db } from '@/lib/db';
import {
  pricingPlans as pricingPlansSchema
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

/**
 * Subscription change type details
 * 订阅变更类型详情
 * サブスクリプション変更タイプの詳細
 */
export type SubscriptionChangeType =
  | 'monthly_to_monthly_upgrade'
  | 'monthly_to_monthly_downgrade'
  | 'yearly_to_yearly_upgrade'
  | 'yearly_to_yearly_downgrade'
  | 'monthly_to_yearly_change'
  | 'yearly_to_monthly_change'
  | 'none'; // no change

/**
 * Subscription change detection result
 * 订阅变更检测结果
 * サブスクリプション変更検出結果
 */
export interface SubscriptionChangeResult {
  changeType: SubscriptionChangeType;
  previousPriceId?: string;
  currentPriceId?: string;
  previousPlanId?: string;
  currentPlanId?: string;
  previousInterval?: string;
  currentInterval?: string;
  previousPrice?: string;
  currentPrice?: string;
}

const getChangeType = (prevInterval: string, currInterval: string, prevAmount: number, currAmount: number) => {
  if (prevInterval !== currInterval) {
    return `${prevInterval}_to_${currInterval}_change`
  }

  if (prevAmount === currAmount) return 'none';

  const direction = currAmount > prevAmount ? 'upgrade' : 'downgrade';
  return `${currInterval}_to_${currInterval}_${direction}`
};

/**
 * Detects if a subscription update is an upgrade, downgrade, or interval change
 * 检测订阅更新是升级、降级还是周期变更
 * サブスクリプションの更新がアップグレード、ダウングレード、または期間変更かを検出
 */
export async function detectSubscriptionChange(
  currentPriceId: string,
  previousPriceId: string
): Promise<SubscriptionChangeResult> {
  const defaultResult: SubscriptionChangeResult = {
    changeType: 'none',
  };

  if (!currentPriceId || !previousPriceId) {
    return defaultResult;
  }

  // Fetch plan information from database to compare
  const [currentPlanResults, previousPlanResults] = await Promise.all([
    db
      .select({
        id: pricingPlansSchema.id,
        price: pricingPlansSchema.price,
        recurringInterval: pricingPlansSchema.recurringInterval,
        benefitsJsonb: pricingPlansSchema.benefitsJsonb,
      })
      .from(pricingPlansSchema)
      .where(eq(pricingPlansSchema.stripePriceId, currentPriceId))
      .limit(1),
    db
      .select({
        id: pricingPlansSchema.id,
        price: pricingPlansSchema.price,
        recurringInterval: pricingPlansSchema.recurringInterval,
        benefitsJsonb: pricingPlansSchema.benefitsJsonb,
      })
      .from(pricingPlansSchema)
      .where(eq(pricingPlansSchema.stripePriceId, previousPriceId))
      .limit(1),
  ]);

  const currentPlan = currentPlanResults[0];
  const previousPlan = previousPlanResults[0];

  if (!currentPlan || !previousPlan) {
    console.warn(`Could not find plan data for price comparison. Current: ${currentPriceId}, Previous: ${previousPriceId}`);
    return defaultResult;
  }

  const currentInterval = currentPlan.recurringInterval?.toLowerCase();
  const previousInterval = previousPlan.recurringInterval?.toLowerCase();
  const currentAmount = parseFloat(currentPlan.price || '0');
  const previousAmount = parseFloat(previousPlan.price || '0');

  // Determine change type based on interval and price
  const changeType = getChangeType(previousInterval as string, currentInterval as string, previousAmount, currentAmount);

  return {
    changeType: changeType as SubscriptionChangeType,
    previousPriceId,
    currentPriceId,
    previousPlanId: previousPlan.id,
    currentPlanId: currentPlan.id,
    previousInterval: previousInterval || undefined,
    currentInterval: currentInterval || undefined,
    previousPrice: previousPlan.price || undefined,
    currentPrice: currentPlan.price || undefined,
  };
}

/**
 * Main router function for handling subscription changes
 * 订阅变更的主路由函数
 * サブスクリプション変更のメインルーター関数
 */
export async function handleSubscriptionChange(
  subscription: Stripe.Subscription,
  changeResult: SubscriptionChangeResult
) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error(`Cannot handle subscription change: userId missing for subscription ${subscription.id}`);
    return;
  }

  console.log(`Routing subscription change for user ${userId}:`, {
    subscriptionId: subscription.id,
    changeType: changeResult.changeType,
  });

  switch (changeResult.changeType) {
    case 'monthly_to_monthly_upgrade':
      await handleMonthlyToMonthlyUpgrade(subscription, changeResult);
      break;
    case 'monthly_to_monthly_downgrade':
      await handleMonthlyToMonthlyDowngrade(subscription, changeResult);
      break;
    case 'yearly_to_yearly_upgrade':
      await handleYearlyToYearlyUpgrade(subscription, changeResult);
      break;
    case 'yearly_to_yearly_downgrade':
      await handleYearlyToYearlyDowngrade(subscription, changeResult);
      break;
    case 'monthly_to_yearly_change':
      await handleMonthlyToYearlyChange(subscription, changeResult);
      break;
    case 'yearly_to_monthly_change':
      await handleYearlyToMonthlyChange(subscription, changeResult);
      break;
    case 'none':
    default:
      console.log(`No subscription change detected for subscription ${subscription.id}`);
      break;
  }
}

/**
 * Handle monthly plan upgrade to monthly plan
 * 处理月计划升级到月计划
 * 月プランから月プランへのアップグレードを処理
 */
export async function handleMonthlyToMonthlyUpgrade(
  subscription: Stripe.Subscription,
  changeResult: SubscriptionChangeResult
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error(`Cannot handle monthly-to-monthly upgrade: userId missing`);
    return;
  }

  console.log(`Processing MONTHLY → MONTHLY UPGRADE for user ${userId}:`, {
    subscriptionId: subscription.id,
    from: changeResult.previousPriceId,
    to: changeResult.currentPriceId,
    fromPlan: changeResult.previousPlanId,
    toPlan: changeResult.currentPlanId,
  });

  // --- TODO: [custom] Implement your monthly-to-monthly upgrade logic here ---
  /**
   * Implementation Guide:
   * 
   * 1. Fetch current and new plan benefits:
   *    - Get monthlyCredits from previousPlanId's benefitsJsonb
   *    - Get monthlyCredits from currentPlanId's benefitsJsonb
   * 
   * 2. Calculate prorated credits:
   *    - Get subscription.current_period_start and current_period_end
   *    - Calculate remaining days: (current_period_end - now) / (current_period_end - current_period_start)
   *    - Calculate prorated credits: remaining_ratio * (new_monthly_credits - old_monthly_credits)
   * 
   * 3. Update usage table:
   *    - Get current subscriptionCreditsBalance
   *    - Add prorated credits to current balance
   *    - Update monthlyAllocationDetails in balanceJsonb with new plan's monthlyCredits
   *    - Update subscriptionCreditsBalance
   * 
   * 4. Record credit log:
   *    - Create credit_logs entry with type 'subscription_upgrade'
   *    - Record the prorated credit amount added
   *    - Link to orderId if available
   * 
   * Example:
   * - User upgrades from Basic ($10/month, 100 credits) to Pro ($20/month, 300 credits)
   * - 15 days remaining in current period (50% of month)
   * - Prorated credits: 0.5 * (300 - 100) = 100 credits
   * - New balance: current_balance + 100 credits
   * - Update monthly allocation to 300 credits for next period
   * 
   * 实现指南：
   * 
   * 1. 获取当前和新计划的权益：
   *    - 从 previousPlanId 的 benefitsJsonb 获取 monthlyCredits
   *    - 从 currentPlanId 的 benefitsJsonb 获取 monthlyCredits
   * 
   * 2. 计算按比例积分：
   *    - 获取 subscription.current_period_start 和 current_period_end
   *    - 计算剩余天数：剩余天数 / 总天数
   *    - 计算按比例积分：剩余比例 * (新月度积分 - 旧月度积分)
   * 
   * 3. 更新 usage 表：
   *    - 获取当前 subscriptionCreditsBalance
   *    - 将按比例积分添加到当前余额
   *    - 更新 balanceJsonb 中的 monthlyAllocationDetails，使用新计划的 monthlyCredits
   *    - 更新 subscriptionCreditsBalance
   * 
   * 4. 记录积分日志：
   *    - 插入 credit_logs 条目，类型为 'subscription_upgrade'
   *    - 记录添加的按比例积分数
   */

  // Example structure:
  // const previousPlan = await getPlanBenefits(changeResult.previousPlanId);
  // const currentPlan = await getPlanBenefits(changeResult.currentPlanId);
  // const proratedCredits = calculateProratedCredits(subscription, previousPlan, currentPlan);
  // await updateUsageAndLog(userId, proratedCredits, 'subscription_upgrade');

  // --- End: [custom] Implement your monthly-to-monthly upgrade logic here ---
}

/**
 * Handle monthly plan downgrade to monthly plan
 * 处理月计划降级到月计划
 * 月プランから月プランへのダウングレードを処理
 */
export async function handleMonthlyToMonthlyDowngrade(
  subscription: Stripe.Subscription,
  changeResult: SubscriptionChangeResult
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error(`Cannot handle monthly-to-monthly downgrade: userId missing`);
    return;
  }

  console.log(`Processing MONTHLY → MONTHLY DOWNGRADE for user ${userId}:`, {
    subscriptionId: subscription.id,
    from: changeResult.previousPriceId,
    to: changeResult.currentPriceId,
    fromPlan: changeResult.previousPlanId,
    toPlan: changeResult.currentPlanId,
  });

  // --- TODO: [custom] Implement your monthly-to-monthly downgrade logic here ---
  /**
   * Implementation Guide:
   * 
   * 1. Fetch current and new plan benefits:
   *    - Get monthlyCredits from previousPlanId's benefitsJsonb
   *    - Get monthlyCredits from currentPlanId's benefitsJsonb
   * 
   * 2. Get current usage:
   *    - Fetch current subscriptionCreditsBalance
   *    - Fetch monthlyAllocationDetails from balanceJsonb
   * 
   * 3. Handle excess credits (choose one strategy):
   *    Strategy A - Keep until period end (recommended, can reuse upgradeSubscriptionCredits):
   *      - Keep current balance unchanged
   *      - Update monthlyAllocationDetails for next period only
   *      - Log the downgrade
   * 
   *    Strategy B - Revoke excess immediately:
   *      - Calculate excess: current_balance - new_monthly_credits
   *      - If excess > 0, reduce balance to new_monthly_credits
   *      - Update monthlyAllocationDetails
   *      - Log the revocation
   * 
   *    Strategy C - Carry over with limit:
   *      - Calculate excess credits
   *      - Apply carry-over limit (e.g., max 50% of new plan's credits)
   *      - Update balance accordingly
   *      - Update monthlyAllocationDetails
   *      - Log the adjustment
   * 
   * 4. Update usage table:
   *    - Update subscriptionCreditsBalance based on chosen strategy
   *    - Update monthlyAllocationDetails in balanceJsonb
   * 
   * 5. Record credit log:
   *    - Create credit_logs entry with type 'subscription_downgrade'
   *    - Record any credits revoked/adjusted
   * 
   * Example (Strategy B):
   * - User downgrades from Pro ($20/month, 300 credits) to Basic ($10/month, 100 credits)
   * - Current balance: 250 credits
   * - Excess credits: 250 - 100 = 150 credits
   * - New balance: 100 credits (revoke 150)
   * - Update monthly allocation to 100 credits for next period
   * 
   * 实现指南：
   * 
   * 1. 获取当前和新计划的权益
   * 2. 获取当前使用情况
   * 3. 处理多余积分（选择一种策略）：
   *    策略A - 保留到周期结束(推荐，可复用 upgradeSubscriptionCredits)
   *    策略B - 立即撤销多余积分
   *    策略C - 结转但有限制
   * 4. 更新 usage 表
   * 5. credit_logs 表记录积分日志
   */

  // Example structure:
  // const previousPlan = await getPlanBenefits(changeResult.previousPlanId);
  // const currentPlan = await getPlanBenefits(changeResult.currentPlanId);
  // const currentUsage = await getCurrentUsage(userId);
  // const excessCredits = calculateExcessCredits(currentUsage, currentPlan);
  // await handleExcessCredits(userId, excessCredits, currentPlan, 'monthly_downgrade');

  // --- End: [custom] Implement your monthly-to-monthly downgrade logic here ---
}

/**
 * Handle yearly plan upgrade to yearly plan
 * 处理年计划升级到年计划
 * 年プランから年プランへのアップグレードを処理
 */
export async function handleYearlyToYearlyUpgrade(
  subscription: Stripe.Subscription,
  changeResult: SubscriptionChangeResult
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error(`Cannot handle yearly-to-yearly upgrade: userId missing`);
    return;
  }

  console.log(`Processing YEARLY → YEARLY UPGRADE for user ${userId}:`, {
    subscriptionId: subscription.id,
    from: changeResult.previousPriceId,
    to: changeResult.currentPriceId,
    fromPlan: changeResult.previousPlanId,
    toPlan: changeResult.currentPlanId,
  });

  // --- TODO: [custom] Implement your yearly-to-yearly upgrade logic here ---
  /**
   * Implementation Guide:
   * 
   * 1. Fetch current and new plan benefits:
   *    - Get monthlyCredits and totalMonths from previousPlanId's benefitsJsonb
   *    - Get monthlyCredits and totalMonths from currentPlanId's benefitsJsonb
   * 
   * 2. Get current yearly allocation:
   *    - Fetch yearlyAllocationDetails from balanceJsonb
   *    - Get remainingMonths, monthlyCredits, lastAllocatedMonth
   * 
   * 3. Calculate prorated credits:
   *    - Calculate remaining months: remainingMonths from yearlyAllocationDetails
   *    - Calculate prorated monthly credits: (remaining_months / total_months) * (new_monthly_credits - old_monthly_credits)
   *    - Or: remaining_months * (new_monthly_credits - old_monthly_credits)
   * 
   * 4. Update yearly allocation:
   *    - Calculate new remaining months (consider subscription period)
   *    - Update monthlyCredits in yearlyAllocationDetails
   *    - Adjust nextCreditDate if needed
   *    - Update lastAllocatedMonth
   * 
   * 5. Update usage table:
   *    - Add prorated credits to current subscriptionCreditsBalance
   *    - Update yearlyAllocationDetails in balanceJsonb
   * 
   * 6. Record credit log:
   *    - Create credit_logs entry with type 'subscription_upgrade'
   *    - Record the prorated credit amount added
   * 
   * Example:
   * - User upgrades from Basic ($100/year, 100 credits/month) to Pro ($200/year, 300 credits/month)
   * - 6 months remaining in yearly subscription
   * - Prorated credits: 6 * (300 - 100) = 1200 credits
   * - Update yearly allocation: remainingMonths=6, monthlyCredits=300
   * - Add 1200 credits to current balance
   * 
   * 实现指南：
   * 
   * 1. 获取当前和新计划的权益
   * 2. 获取当前年度分配情况
   * 3. 计算按比例积分
   * 4. 更新年度分配
   * 5. 更新 usage 表
   * 6. credit_logs 表记录积分日志
   */

  // Example structure:
  // const previousPlan = await getPlanBenefits(changeResult.previousPlanId);
  // const currentPlan = await getPlanBenefits(changeResult.currentPlanId);
  // const currentYearlyAllocation = await getYearlyAllocation(userId);
  // const proratedCredits = calculateYearlyProratedCredits(currentYearlyAllocation, previousPlan, currentPlan);
  // await updateYearlyAllocationAndLog(userId, proratedCredits, currentPlan, 'subscription_upgrade');

  // --- End: [custom] Implement your yearly-to-yearly upgrade logic here ---
}

/**
 * Handle yearly plan downgrade to yearly plan
 * 处理年计划降级到年计划
 * 年プランから年プランへのダウングレードを処理
 */
export async function handleYearlyToYearlyDowngrade(
  subscription: Stripe.Subscription,
  changeResult: SubscriptionChangeResult
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error(`Cannot handle yearly-to-yearly downgrade: userId missing`);
    return;
  }

  console.log(`Processing YEARLY → YEARLY DOWNGRADE for user ${userId}:`, {
    subscriptionId: subscription.id,
    from: changeResult.previousPriceId,
    to: changeResult.currentPriceId,
    fromPlan: changeResult.previousPlanId,
    toPlan: changeResult.currentPlanId,
  });

  // --- TODO: [custom] Implement your yearly-to-yearly downgrade logic here ---
  /**
   * Implementation Guide:
   * 
   * 1. Fetch current and new plan benefits:
   *    - Get monthlyCredits and totalMonths from previousPlanId's benefitsJsonb
   *    - Get monthlyCredits and totalMonths from currentPlanId's benefitsJsonb
   * 
   * 2. Get current yearly allocation:
   *    - Fetch yearlyAllocationDetails from balanceJsonb
   *    - Get remainingMonths, monthlyCredits, current balance
   * 
   * 3. Handle excess credits (choose one strategy):
   *    Strategy A - Adjust allocation only:
   *      - Keep current balance
   *      - Update monthlyCredits in yearlyAllocationDetails for future allocations
   *      - Future monthly allocations will use new lower amount
   * 
   *    Strategy B - Revoke excess immediately:
   *      - Calculate excess: (remaining_months * old_monthly_credits) - (remaining_months * new_monthly_credits)
   *      - Reduce balance by excess amount
   *      - Update monthlyCredits in yearlyAllocationDetails
   * 
   *    Strategy C - Gradual reduction:
   *      - Reduce balance proportionally
   *      - Update monthlyCredits for future allocations
   *      - Log the adjustment
   * 
   * 4. Update yearly allocation:
   *    - Update monthlyCredits in yearlyAllocationDetails
   *    - Adjust remainingMonths if needed
   *    - Update lastAllocatedMonth
   * 
   * 5. Update usage table:
   *    - Update subscriptionCreditsBalance based on chosen strategy
   *    - Update yearlyAllocationDetails in balanceJsonb
   * 
   * 6. Record credit log:
   *    - Create credit_logs entry with type 'subscription_downgrade'
   *    - Record any credits revoked/adjusted
   * 
   * Example (Strategy B):
   * - User downgrades from Pro ($200/year, 300 credits/month) to Basic ($100/year, 100 credits/month)
   * - 6 months remaining
   * - Excess: (6 * 300) - (6 * 100) = 1200 credits
   * - Reduce balance by 1200 credits
   * - Update monthlyCredits to 100 for future allocations
   * 
   * 实现指南：
   * 
   * 1. 获取当前和新计划的权益
   * 2. 获取当前年度分配情况
   * 3. 处理多余积分（选择一种策略）
   * 4. 更新年度分配
   * 5. 更新 usage 表
   * 6. credit_logs 表记录积分日志
   */

  // Example structure:
  // const previousPlan = await getPlanBenefits(changeResult.previousPlanId);
  // const currentPlan = await getPlanBenefits(changeResult.currentPlanId);
  // const currentYearlyAllocation = await getYearlyAllocation(userId);
  // const excessCredits = calculateYearlyExcessCredits(currentYearlyAllocation, previousPlan, currentPlan);
  // await handleYearlyExcessCredits(userId, excessCredits, currentPlan, 'yearly_downgrade');

  // --- End: [custom] Implement your yearly-to-yearly downgrade logic here ---
}

/**
 * Handle monthly plan change to yearly plan
 * 处理月计划变更为年计划
 * 月プランから年プランへの変更を処理
 */
export async function handleMonthlyToYearlyChange(
  subscription: Stripe.Subscription,
  changeResult: SubscriptionChangeResult
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error(`Cannot handle monthly-to-yearly change: userId missing`);
    return;
  }

  console.log(`Processing MONTHLY → YEARLY CHANGE for user ${userId}:`, {
    subscriptionId: subscription.id,
    from: changeResult.previousPriceId,
    to: changeResult.currentPriceId,
    fromPlan: changeResult.previousPlanId,
    toPlan: changeResult.currentPlanId,
  });

  // --- TODO: [custom] Implement your monthly-to-yearly change logic here ---
  /**
   * Implementation Guide:
   * 
   * 1. Fetch plans:
   *    - Get monthlyCredits from previousPlanId (monthly plan)
   *    - Get monthlyCredits and totalMonths from currentPlanId (yearly plan)
   * 
   * 2. Get current monthly allocation:
   *    - Fetch monthlyAllocationDetails from balanceJsonb
   *    - Get current subscriptionCreditsBalance
   * 
   * 3. Calculate conversion:
   *    - Get remaining days in current monthly period
   *    - Convert remaining monthly credits to one-time credits (optional)
   *    - Or: Add remaining monthly credits to new yearly allocation
   * 
   * 4. Initialize yearly allocation:
   *    - Calculate remaining months from subscription start date
   *    - Set up yearlyAllocationDetails:
   *      - remainingMonths: calculated from subscription period
   *      - monthlyCredits: from new yearly plan
   *      - nextCreditDate: first of next month
   *      - lastAllocatedMonth: current month
   * 
   * 5. Update usage table:
   *    - Clear monthlyAllocationDetails
   *    - Set yearlyAllocationDetails
   *    - Update subscriptionCreditsBalance:
   *      - Option A: Keep current balance + grant first month's credits
   *      - Option B: Reset to first month's credits only
   *      - Option C: Keep current balance, grant credits on next allocation date
   * 
   * 6. Record credit log:
   *    - Create credit_logs entry with type 'subscription_interval_change'
   *    - Record the conversion details
   * 
   * Example:
   * - User switches from Basic ($10/month, 100 credits/month) to Basic ($100/year, 100 credits/month)
   * - Current balance: 50 credits (half month remaining)
   * - Option A: Keep 50 credits, grant 100 credits immediately = 150 credits total
   * - Option B: Reset to 100 credits (new plan's first month)
   * - Initialize yearly plan with 12 months remaining, 100 credits/month
   * 
   * 实现指南：
   * 
   * 1. 获取计划信息
   * 2. 获取当前月度分配情况
   * 3. 计算转换
   * 4. 初始化年度分配
   * 5. 更新 usage 表
   * 6. credit_logs 表记录积分日志
   */

  // Example structure:
  // const monthlyPlan = await getPlanBenefits(changeResult.previousPlanId);
  // const yearlyPlan = await getPlanBenefits(changeResult.currentPlanId);
  // const currentMonthlyAllocation = await getMonthlyAllocation(userId);
  // await convertMonthlyToYearly(userId, subscription, monthlyPlan, yearlyPlan, currentMonthlyAllocation);

  // --- End: [custom] Implement your monthly-to-yearly change logic here ---
}

/**
 * Handle yearly plan change to monthly plan
 * 处理年计划变更为月计划
 * 年プランから月プランへの変更を処理
 */
export async function handleYearlyToMonthlyChange(
  subscription: Stripe.Subscription,
  changeResult: SubscriptionChangeResult
) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error(`Cannot handle yearly-to-monthly change: userId missing`);
    return;
  }

  console.log(`Processing YEARLY → MONTHLY CHANGE for user ${userId}:`, {
    subscriptionId: subscription.id,
    from: changeResult.previousPriceId,
    to: changeResult.currentPriceId,
    fromPlan: changeResult.previousPlanId,
    toPlan: changeResult.currentPlanId,
  });

  // --- TODO: [custom] Implement your yearly-to-monthly change logic here ---
  /**
   * Implementation Guide:
   * 
   * 1. Fetch plans:
   *    - Get monthlyCredits and totalMonths from previousPlanId (yearly plan)
   *    - Get monthlyCredits from currentPlanId (monthly plan)
   * 
   * 2. Get current yearly allocation:
   *    - Fetch yearlyAllocationDetails from balanceJsonb
   *    - Get remainingMonths, monthlyCredits, current balance
   * 
   * 3. Calculate conversion:
   *    - Calculate remaining months credits: remainingMonths * old_monthly_credits
   *    - Convert to new monthly plan:
   *      - Option A: Grant all remaining credits immediately as one-time credits
   *      - Option B: Grant credits proportionally over remaining months
   *      - Option C: Grant first month's credits, forfeit rest
   * 
   * 4. Initialize monthly allocation:
   *    - Set up monthlyAllocationDetails:
   *      - monthlyCredits: from new monthly plan
   *      - relatedOrderId: current order
   * 
   * 5. Update usage table:
   *    - Clear yearlyAllocationDetails
   *    - Set monthlyAllocationDetails
   *    - Update subscriptionCreditsBalance:
   *      - Option A: current_balance + remaining_credits (as one-time)
   *      - Option B: Set to new plan's monthlyCredits
   *      - Option C: current_balance + first_month_credits
   * 
   * 6. Record credit log:
   *    - Create credit_logs entry with type 'subscription_interval_change'
   *    - Record the conversion details and any credits granted/forfeited
   * 
   * Example:
   * - User switches from Basic ($100/year, 100 credits/month) to Basic ($10/month, 100 credits/month)
   * - 6 months remaining in yearly subscription
   * - Remaining credits: 6 * 100 = 600 credits
   * - Option A: Grant 600 credits as one-time credits, set monthly plan to 100 credits/month
   * - Option B: Set balance to 100 credits (first month), forfeit remaining 500 credits
   * - Option C: Grant 100 credits (first month), convert 500 to one-time credits
   * 
   * 实现指南：
   * 
   * 1. 获取计划信息
   * 2. 获取当前年度分配情况
   * 3. 计算转换
   * 4. 初始化月度分配
   * 5. 更新 usage 表
   * 6. credit_logs 表记录积分日志
   */

  // Example structure:
  // const yearlyPlan = await getPlanBenefits(changeResult.previousPlanId);
  // const monthlyPlan = await getPlanBenefits(changeResult.currentPlanId);
  // const currentYearlyAllocation = await getYearlyAllocation(userId);
  // await convertYearlyToMonthly(userId, subscription, yearlyPlan, monthlyPlan, currentYearlyAllocation);

  // --- End: [custom] Implement your yearly-to-monthly change logic here ---
}