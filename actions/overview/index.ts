'use server';

import { actionResponse, ActionResult } from '@/lib/action-response';
import { isAdmin } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { orders as ordersSchema, pricingPlans as pricingPlansSchema, user as userSchema } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/error-utils';
import { and, count, eq, gte, inArray, lt, sql } from 'drizzle-orm';

interface IStats {
  today: number;
  yesterday: number;
  growthRate: number;
  total?: number;
}

interface IOrderStats {
  count: IStats;
  revenue: IStats;
}

interface IOrderStatsResult {
  oneTime: { count: number; revenue: number };
  monthly: { count: number; revenue: number };
  yearly: { count: number; revenue: number };
}

export interface IOverviewStats {
  users: IStats;
  oneTimePayments: IOrderStats;
  monthlySubscriptions: IOrderStats;
  yearlySubscriptions: IOrderStats;
}

export interface IDailyGrowthStats {
  reportDate: string;
  newUsersCount: number;
  newOrdersCount: number;
}

function calculateGrowthRate(today: number, yesterday: number): number {
  if (yesterday === 0) {
    return today > 0 ? Infinity : 0;
  }
  return ((today - yesterday) / yesterday) * 100;
}

export const getOverviewStats = async (): Promise<ActionResult<IOverviewStats>> => {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.');
  }
  try {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const yesterdayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );

    // User stats
    const totalUsersResult = await db.select({ value: count() }).from(userSchema);
    const totalUsers = totalUsersResult[0].value;

    const todayUsersResult = await db
      .select({ value: count() })
      .from(userSchema)
      .where(gte(userSchema.createdAt, todayStart));
    const todayUsers = todayUsersResult[0].value;

    const yesterdayUsersResult = await db
      .select({ value: count() })
      .from(userSchema)
      .where(
        and(
          gte(userSchema.createdAt, yesterdayStart),
          lt(userSchema.createdAt, todayStart)
        )
      );
    const yesterdayUsers = yesterdayUsersResult[0].value;

    // Order stats
    const getOrderStatsForPeriod = async (
      startDate: Date,
      endDate: Date
    ): Promise<IOrderStatsResult> => {
      const result = await db
        .select({
          oneTimeCount:
            sql`COUNT(*) FILTER (WHERE ${ordersSchema.orderType} = 'one_time_purchase')`.mapWith(
              Number
            ),
          oneTimeRevenue:
            sql`COALESCE(SUM(${ordersSchema.amountTotal}) FILTER (WHERE ${ordersSchema.orderType} = 'one_time_purchase'), 0)`.mapWith(
              Number
            ),
          monthlyCount:
            sql`COUNT(*) FILTER (WHERE ${ordersSchema.orderType} IN ('subscription_initial', 'subscription_renewal') AND ${pricingPlansSchema.recurringInterval} = 'month')`.mapWith(
              Number
            ),
          monthlyRevenue:
            sql`COALESCE(SUM(${ordersSchema.amountTotal}) FILTER (WHERE ${pricingPlansSchema.recurringInterval} = 'month'), 0)`.mapWith(
              Number
            ),
          yearlyCount:
            sql`COUNT(*) FILTER (WHERE ${ordersSchema.orderType} IN ('subscription_initial', 'subscription_renewal') AND ${pricingPlansSchema.recurringInterval} = 'year')`.mapWith(
              Number
            ),
          yearlyRevenue:
            sql`COALESCE(SUM(${ordersSchema.amountTotal}) FILTER (WHERE ${pricingPlansSchema.recurringInterval} = 'year'), 0)`.mapWith(
              Number
            ),
        })
        .from(ordersSchema)
        .leftJoin(pricingPlansSchema, eq(ordersSchema.planId, pricingPlansSchema.id))
        .where(
          and(
            gte(ordersSchema.createdAt, startDate),
            lt(ordersSchema.createdAt, endDate),
            inArray(ordersSchema.status, ['succeeded', 'active'])
          )
        )

      const stats = result[0];
      return {
        oneTime: {
          count: stats.oneTimeCount,
          revenue: stats.oneTimeRevenue,
        },
        monthly: {
          count: stats.monthlyCount,
          revenue: stats.monthlyRevenue,
        },
        yearly: {
          count: stats.yearlyCount,
          revenue: stats.yearlyRevenue,
        },
      };
    };

    const todayOrderStats = await getOrderStatsForPeriod(todayStart, now);
    const yesterdayOrderStats = await getOrderStatsForPeriod(
      yesterdayStart,
      todayStart
    );

    const stats: IOverviewStats = {
      users: {
        today: todayUsers,
        yesterday: yesterdayUsers,
        growthRate: calculateGrowthRate(todayUsers, yesterdayUsers),
        total: totalUsers ?? 0,
      },
      oneTimePayments: {
        count: {
          today: todayOrderStats.oneTime.count,
          yesterday: yesterdayOrderStats.oneTime.count,
          growthRate: calculateGrowthRate(
            todayOrderStats.oneTime.count,
            yesterdayOrderStats.oneTime.count
          ),
        },
        revenue: {
          today: todayOrderStats.oneTime.revenue,
          yesterday: yesterdayOrderStats.oneTime.revenue,
          growthRate: calculateGrowthRate(
            todayOrderStats.oneTime.revenue,
            yesterdayOrderStats.oneTime.revenue
          ),
        },
      },
      monthlySubscriptions: {
        count: {
          today: todayOrderStats.monthly.count,
          yesterday: yesterdayOrderStats.monthly.count,
          growthRate: calculateGrowthRate(
            todayOrderStats.monthly.count,
            yesterdayOrderStats.monthly.count
          ),
        },
        revenue: {
          today: todayOrderStats.monthly.revenue,
          yesterday: yesterdayOrderStats.monthly.revenue,
          growthRate: calculateGrowthRate(
            todayOrderStats.monthly.revenue,
            yesterdayOrderStats.monthly.revenue
          ),
        },
      },
      yearlySubscriptions: {
        count: {
          today: todayOrderStats.yearly.count,
          yesterday: yesterdayOrderStats.yearly.count,
          growthRate: calculateGrowthRate(
            todayOrderStats.yearly.count,
            yesterdayOrderStats.yearly.count
          ),
        },
        revenue: {
          today: todayOrderStats.yearly.revenue,
          yesterday: yesterdayOrderStats.yearly.revenue,
          growthRate: calculateGrowthRate(
            todayOrderStats.yearly.revenue,
            yesterdayOrderStats.yearly.revenue
          ),
        },
      },
    };
    return actionResponse.success(stats);
  } catch (error) {
    return actionResponse.error(getErrorMessage(error));
  }
};

export const getDailyGrowthStats = async (
  period: '7d' | '30d' | '90d'
): Promise<ActionResult<IDailyGrowthStats[]>> => {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.');
  }
  try {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(new Date().setDate(now.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(new Date().setMonth(now.getMonth() - 1));
        break;
      case '90d':
        startDate = new Date(new Date().setMonth(now.getMonth() - 3));
        break;
      default:
        throw new Error('Invalid period specified.');
    }

    const userDateTrunc = sql`date_trunc('day', ${userSchema.createdAt})`

    const dailyUsers = await db
      .select({
        date: userDateTrunc,
        count: count(userSchema.id),
      })
      .from(userSchema)
      .where(gte(userSchema.createdAt, startDate))
      .groupBy(userDateTrunc)

    const orderDateTrunc = sql`date_trunc('day', ${ordersSchema.createdAt})`

    const dailyOrders = await db
      .select({
        date: orderDateTrunc,
        count: count(ordersSchema.id),
      })
      .from(ordersSchema)
      .where(
        and(
          gte(ordersSchema.createdAt, startDate),
          inArray(ordersSchema.status, ['succeeded', 'active']),
          inArray(ordersSchema.orderType, [
            'one_time_purchase',
            'subscription_initial',
            'subscription_renewal',
          ])
        )
      )
      .groupBy(orderDateTrunc)

    const dailyUsersMap = new Map(
      dailyUsers.map((r) => {
        let dateStr: string;
        if (r.date instanceof Date) {
          dateStr = r.date.toISOString().split('T')[0];
        } else {
          dateStr = new Date(r.date as string).toISOString().split('T')[0];
        }
        return [dateStr, r.count];
      })
    );
    const dailyOrdersMap = new Map(
      dailyOrders.map((r) => {
        let dateStr: string;
        if (r.date instanceof Date) {
          dateStr = r.date.toISOString().split('T')[0];
        } else {
          dateStr = new Date(r.date as string).toISOString().split('T')[0];
        }
        return [dateStr, r.count];
      })
    );

    const result: IDailyGrowthStats[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        reportDate: dateStr,
        newUsersCount: dailyUsersMap.get(dateStr) || 0,
        newOrdersCount: dailyOrdersMap.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return actionResponse.success(result);
  } catch (error) {
    return actionResponse.error(getErrorMessage(error));
  }
};