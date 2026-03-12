import { db } from '@/lib/db';
import {
  creditLogs as creditLogsSchema,
  pricingPlans as pricingPlansSchema,
  usage as usageSchema,
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

interface PlanBenefits {
  monthlyCredits: number;
  totalMonths: number;
}

interface PlanRecord {
  id: string;
  recurringInterval: string | null;
  price: string | null;
  benefitsJsonb: unknown;
}

interface UsageMutationResult {
  subscriptionCreditsBalance: number;
  balanceJsonb: Record<string, unknown>;
  logType: string;
  notes: string;
  amount: number;
  forceLog?: boolean;
}

const getChangeType = (
  prevInterval: string,
  currInterval: string,
  prevAmount: number,
  currAmount: number
): SubscriptionChangeType => {
  if (prevInterval !== currInterval) {
    if (prevInterval === 'month' && currInterval === 'year') {
      return 'monthly_to_yearly_change';
    }
    if (prevInterval === 'year' && currInterval === 'month') {
      return 'yearly_to_monthly_change';
    }
    return 'none';
  }

  if (prevAmount === currAmount) {
    return 'none';
  }

  if (prevInterval === 'month') {
    return currAmount > prevAmount
      ? 'monthly_to_monthly_upgrade'
      : 'monthly_to_monthly_downgrade';
  }

  if (prevInterval === 'year') {
    return currAmount > prevAmount
      ? 'yearly_to_yearly_upgrade'
      : 'yearly_to_yearly_downgrade';
  }

  return 'none';
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

  if (!currentPriceId || !previousPriceId || currentPriceId === previousPriceId) {
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

  const changeType = getChangeType(
    previousInterval as string,
    currentInterval as string,
    previousAmount,
    currentAmount
  );

  return {
    changeType,
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

  switch (changeResult.changeType) {
    case 'monthly_to_monthly_upgrade':
      await handleMonthlyToMonthlyUpgrade(subscription, changeResult);
      return;
    case 'monthly_to_monthly_downgrade':
      await handleMonthlyToMonthlyDowngrade(subscription, changeResult);
      return;
    case 'yearly_to_yearly_upgrade':
      await handleYearlyToYearlyUpgrade(subscription, changeResult);
      return;
    case 'yearly_to_yearly_downgrade':
      await handleYearlyToYearlyDowngrade(subscription, changeResult);
      return;
    case 'monthly_to_yearly_change':
      await handleMonthlyToYearlyChange(subscription, changeResult);
      return;
    case 'yearly_to_monthly_change':
      await handleYearlyToMonthlyChange(subscription, changeResult);
      return;
    case 'none':
    default:
      return;
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
  if (!userId || !changeResult.previousPlanId || !changeResult.currentPlanId) {
    return;
  }

  const [previousPlan, currentPlan] = await Promise.all([
    getPlanById(changeResult.previousPlanId),
    getPlanById(changeResult.currentPlanId),
  ]);

  const previousCredits = getPlanBenefits(previousPlan).monthlyCredits;
  const currentCredits = getPlanBenefits(currentPlan).monthlyCredits;
  const bonusCredits = calculateProratedBonusCredits(
    subscription,
    currentCredits - previousCredits
  );

  await mutateUsageForPlanChange(userId, (usage, balanceJsonb) => {
    const monthlyDetails = getMonthlyAllocationDetails(balanceJsonb);

    balanceJsonb.monthlyAllocationDetails = {
      ...monthlyDetails,
      monthlyCredits: currentCredits,
      relatedOrderId: monthlyDetails?.relatedOrderId ?? null,
    };

    return {
      subscriptionCreditsBalance: usage.subscriptionCreditsBalance + bonusCredits,
      balanceJsonb,
      logType: 'subscription_upgrade',
      notes: `Stripe subscription ${subscription.id} upgraded from ${changeResult.previousPriceId} to ${changeResult.currentPriceId}.`,
      amount: bonusCredits,
      forceLog: bonusCredits === 0,
    };
  });
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
  if (!userId || !changeResult.currentPlanId) {
    return;
  }

  const currentPlan = await getPlanById(changeResult.currentPlanId);
  const currentCredits = getPlanBenefits(currentPlan).monthlyCredits;

  await mutateUsageForPlanChange(userId, (usage, balanceJsonb) => {
    const monthlyDetails = getMonthlyAllocationDetails(balanceJsonb);

    balanceJsonb.monthlyAllocationDetails = {
      ...monthlyDetails,
      monthlyCredits: currentCredits,
      relatedOrderId: monthlyDetails?.relatedOrderId ?? null,
    };

    return {
      subscriptionCreditsBalance: usage.subscriptionCreditsBalance,
      balanceJsonb,
      logType: 'subscription_downgrade',
      notes: `Stripe subscription ${subscription.id} downgraded from ${changeResult.previousPriceId} to ${changeResult.currentPriceId}. Future monthly allocation updated.`,
      amount: 0,
      forceLog: true,
    };
  });
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
  if (!userId || !changeResult.previousPlanId || !changeResult.currentPlanId) {
    return;
  }

  const [previousPlan, currentPlan] = await Promise.all([
    getPlanById(changeResult.previousPlanId),
    getPlanById(changeResult.currentPlanId),
  ]);

  const previousCredits = getPlanBenefits(previousPlan).monthlyCredits;
  const currentCredits = getPlanBenefits(currentPlan).monthlyCredits;
  const bonusCredits = calculateProratedBonusCredits(
    subscription,
    currentCredits - previousCredits
  );

  await mutateUsageForPlanChange(userId, (usage, balanceJsonb) => {
    const yearlyDetails = getYearlyAllocationDetails(balanceJsonb);

    balanceJsonb.yearlyAllocationDetails = {
      ...buildYearlyAllocationDetails(subscription, getPlanBenefits(currentPlan)),
      ...yearlyDetails,
      monthlyCredits: currentCredits,
      relatedOrderId: yearlyDetails?.relatedOrderId ?? null,
    };

    return {
      subscriptionCreditsBalance: usage.subscriptionCreditsBalance + bonusCredits,
      balanceJsonb,
      logType: 'subscription_upgrade',
      notes: `Stripe yearly subscription ${subscription.id} upgraded from ${changeResult.previousPriceId} to ${changeResult.currentPriceId}.`,
      amount: bonusCredits,
      forceLog: bonusCredits === 0,
    };
  });
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
  if (!userId || !changeResult.currentPlanId) {
    return;
  }

  const currentPlan = await getPlanById(changeResult.currentPlanId);
  const currentCredits = getPlanBenefits(currentPlan).monthlyCredits;

  await mutateUsageForPlanChange(userId, (usage, balanceJsonb) => {
    const yearlyDetails = getYearlyAllocationDetails(balanceJsonb);

    balanceJsonb.yearlyAllocationDetails = {
      ...buildYearlyAllocationDetails(subscription, getPlanBenefits(currentPlan)),
      ...yearlyDetails,
      monthlyCredits: currentCredits,
      relatedOrderId: yearlyDetails?.relatedOrderId ?? null,
    };

    return {
      subscriptionCreditsBalance: usage.subscriptionCreditsBalance,
      balanceJsonb,
      logType: 'subscription_downgrade',
      notes: `Stripe yearly subscription ${subscription.id} downgraded from ${changeResult.previousPriceId} to ${changeResult.currentPriceId}. Future monthly allocation updated.`,
      amount: 0,
      forceLog: true,
    };
  });
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
  if (!userId || !changeResult.currentPlanId) {
    return;
  }

  const currentPlan = await getPlanById(changeResult.currentPlanId);
  const currentBenefits = getPlanBenefits(currentPlan);

  await mutateUsageForPlanChange(userId, (usage, balanceJsonb) => {
    const currentBalance = usage.subscriptionCreditsBalance;
    const nextBalance = Math.max(currentBalance, currentBenefits.monthlyCredits);
    const bonusCredits = nextBalance - currentBalance;
    const previousMonthlyDetails = getMonthlyAllocationDetails(balanceJsonb);

    delete balanceJsonb.monthlyAllocationDetails;
    balanceJsonb.yearlyAllocationDetails = {
      ...buildYearlyAllocationDetails(subscription, currentBenefits),
      relatedOrderId: previousMonthlyDetails?.relatedOrderId ?? null,
    };

    return {
      subscriptionCreditsBalance: nextBalance,
      balanceJsonb,
      logType: 'subscription_interval_change',
      notes: `Stripe subscription ${subscription.id} changed from monthly to yearly (${changeResult.previousPriceId} -> ${changeResult.currentPriceId}).`,
      amount: bonusCredits,
      forceLog: true,
    };
  });
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
  if (!userId || !changeResult.currentPlanId) {
    return;
  }

  const currentPlan = await getPlanById(changeResult.currentPlanId);
  const currentBenefits = getPlanBenefits(currentPlan);

  await mutateUsageForPlanChange(userId, (usage, balanceJsonb) => {
    const currentBalance = usage.subscriptionCreditsBalance;
    const nextBalance = Math.max(currentBalance, currentBenefits.monthlyCredits);
    const bonusCredits = nextBalance - currentBalance;
    const previousYearlyDetails = getYearlyAllocationDetails(balanceJsonb);

    delete balanceJsonb.yearlyAllocationDetails;
    balanceJsonb.monthlyAllocationDetails = {
      monthlyCredits: currentBenefits.monthlyCredits,
      relatedOrderId: previousYearlyDetails?.relatedOrderId ?? null,
    };

    return {
      subscriptionCreditsBalance: nextBalance,
      balanceJsonb,
      logType: 'subscription_interval_change',
      notes: `Stripe subscription ${subscription.id} changed from yearly to monthly (${changeResult.previousPriceId} -> ${changeResult.currentPriceId}).`,
      amount: bonusCredits,
      forceLog: true,
    };
  });
}

async function getPlanById(planId: string): Promise<PlanRecord> {
  const results = await db
    .select({
      id: pricingPlansSchema.id,
      recurringInterval: pricingPlansSchema.recurringInterval,
      price: pricingPlansSchema.price,
      benefitsJsonb: pricingPlansSchema.benefitsJsonb,
    })
    .from(pricingPlansSchema)
    .where(eq(pricingPlansSchema.id, planId))
    .limit(1);

  const plan = results[0];
  if (!plan) {
    throw new Error(`Pricing plan ${planId} not found.`);
  }

  return plan;
}

function getPlanBenefits(plan: PlanRecord): PlanBenefits {
  const benefits = (plan.benefitsJsonb ?? {}) as Record<string, unknown>;

  return {
    monthlyCredits: toPositiveInt(benefits.monthlyCredits),
    totalMonths: Math.max(1, toPositiveInt(benefits.totalMonths) || 12),
  };
}

function toPositiveInt(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
}

function calculateProratedBonusCredits(
  subscription: Stripe.Subscription,
  creditDifference: number
): number {
  if (creditDifference <= 0) {
    return 0;
  }

  const item = subscription.items.data[0];
  const currentPeriodStart = item?.current_period_start
    ? item.current_period_start * 1000
    : null;
  const currentPeriodEnd = item?.current_period_end
    ? item.current_period_end * 1000
    : null;

  if (!currentPeriodStart || !currentPeriodEnd || currentPeriodEnd <= currentPeriodStart) {
    return creditDifference;
  }

  const now = Date.now();
  const remainingRatio = Math.max(
    0,
    Math.min(1, (currentPeriodEnd - now) / (currentPeriodEnd - currentPeriodStart))
  );

  return Math.round(creditDifference * remainingRatio);
}

function buildYearlyAllocationDetails(
  subscription: Stripe.Subscription,
  benefits: PlanBenefits
): Record<string, unknown> {
  const item = subscription.items.data[0];
  const startDate = item?.current_period_start
    ? new Date(item.current_period_start * 1000)
    : new Date();
  const nextCreditDate = new Date(startDate);
  nextCreditDate.setMonth(nextCreditDate.getMonth() + 1);

  return {
    remainingMonths: Math.max(0, benefits.totalMonths - 1),
    nextCreditDate: nextCreditDate.toISOString(),
    monthlyCredits: benefits.monthlyCredits,
    lastAllocatedMonth: formatYearMonth(startDate),
    relatedOrderId: null,
  };
}

function formatYearMonth(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function cloneBalanceJsonb(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function getMonthlyAllocationDetails(
  balanceJsonb: Record<string, unknown>
): Record<string, unknown> | undefined {
  const details = balanceJsonb.monthlyAllocationDetails;
  return details && typeof details === 'object'
    ? (details as Record<string, unknown>)
    : undefined;
}

function getYearlyAllocationDetails(
  balanceJsonb: Record<string, unknown>
): Record<string, unknown> | undefined {
  const details = balanceJsonb.yearlyAllocationDetails;
  return details && typeof details === 'object'
    ? (details as Record<string, unknown>)
    : undefined;
}

async function mutateUsageForPlanChange(
  userId: string,
  builder: (
    usage: {
      subscriptionCreditsBalance: number;
      oneTimeCreditsBalance: number;
    },
    balanceJsonb: Record<string, unknown>
  ) => UsageMutationResult
) {
  await db.transaction(async (tx) => {
    let usage = (
      await tx
        .select()
        .from(usageSchema)
        .where(eq(usageSchema.userId, userId))
        .for('update')
    )[0];

    if (!usage) {
      const inserted = await tx
        .insert(usageSchema)
        .values({
          userId,
          subscriptionCreditsBalance: 0,
          oneTimeCreditsBalance: 0,
          balanceJsonb: {},
        })
        .returning();

      usage = inserted[0];
    }

    if (!usage) {
      throw new Error(`Failed to initialize usage row for user ${userId}.`);
    }

    const balanceJsonb = cloneBalanceJsonb(usage.balanceJsonb);
    const nextState = builder(
      {
        subscriptionCreditsBalance: usage.subscriptionCreditsBalance,
        oneTimeCreditsBalance: usage.oneTimeCreditsBalance,
      },
      balanceJsonb
    );

    const nextSubscriptionBalance = Math.max(
      0,
      Math.floor(nextState.subscriptionCreditsBalance)
    );

    await tx
      .update(usageSchema)
      .set({
        subscriptionCreditsBalance: nextSubscriptionBalance,
        balanceJsonb: nextState.balanceJsonb,
      })
      .where(eq(usageSchema.userId, userId));

    if (nextState.amount !== 0 || nextState.forceLog) {
      await tx.insert(creditLogsSchema).values({
        userId,
        amount: nextState.amount,
        oneTimeBalanceAfter: usage.oneTimeCreditsBalance,
        subscriptionBalanceAfter: nextSubscriptionBalance,
        type: nextState.logType,
        notes: nextState.notes,
        relatedOrderId: null,
      });
    }
  });
}
