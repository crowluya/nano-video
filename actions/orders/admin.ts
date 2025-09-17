'use server';

import { ActionResult, actionResponse } from '@/lib/action-response';
import { isAdmin } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { orders as ordersSchema, user as userSchema } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/error-utils';
import { OrderWithUser } from '@/types/admin/orders';
import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';

const FilterSchema = z.object({
  pageIndex: z.coerce.number().default(0),
  pageSize: z.coerce.number().default(10),
  filter: z.string().optional(),
  provider: z.string().optional(),
  orderType: z.string().optional(),
  status: z.string().optional(),
});

export type GetOrdersResult = ActionResult<{
  orders: OrderWithUser[];
  totalCount: number;
}>;

export async function getOrders(
  params: z.infer<typeof FilterSchema>
): Promise<GetOrdersResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.');
  }
  try {
    const { pageIndex, pageSize, filter, provider, orderType, status } =
      FilterSchema.parse(params);

    const conditions = [];
    if (provider) {
      conditions.push(eq(ordersSchema.provider, provider));
    }
    if (orderType) {
      conditions.push(eq(ordersSchema.orderType, orderType));
    }
    if (status) {
      conditions.push(eq(ordersSchema.status, status));
    }
    if (filter) {
      conditions.push(
        or(
          ilike(userSchema.email, `%${filter}%`),
          ilike(ordersSchema.providerOrderId, `%${filter}%`),
          sql`CAST(${ordersSchema.id} AS TEXT) ILIKE ${`%${filter}%`}`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const ordersQuery = db
      .select({
        order: ordersSchema,
        user: { email: userSchema.email, name: userSchema.name },
      })
      .from(ordersSchema)
      .leftJoin(userSchema, eq(ordersSchema.userId, userSchema.id))
      .where(whereClause)
      .orderBy(desc(ordersSchema.createdAt))
      .offset(pageIndex * pageSize)
      .limit(pageSize);

    const totalCountQuery = db
      .select({ value: count() })
      .from(ordersSchema)
      .leftJoin(userSchema, eq(ordersSchema.userId, userSchema.id))
      .where(whereClause);

    const [results, totalCountResult] = await Promise.all([
      ordersQuery,
      totalCountQuery,
    ]);

    const totalCount = totalCountResult[0].value;

    const ordersData = results.map((r) => ({
      ...r.order,
      users: r.user,
    }));

    return actionResponse.success({
      orders: ordersData as unknown as OrderWithUser[],
      totalCount: totalCount,
    });
  } catch (error) {
    console.error('Error getting orders', error);
    return actionResponse.error(getErrorMessage(error));
  }
} 