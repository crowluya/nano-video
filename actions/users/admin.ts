"use server";

import type { ActionResult } from '@/lib/action-response';
import { actionResponse } from '@/lib/action-response';
import { isAdmin } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { user as userSchema } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/error-utils';
import { count, desc, eq, ilike, or } from 'drizzle-orm';

type UserType = typeof userSchema.$inferSelect;

export interface GetUsersResult {
  success: boolean;
  data?: {
    users: UserType[];
    totalCount: number;
  };
  error?: string;
}

const DEFAULT_PAGE_SIZE = 20;

export async function getUsers({
  pageIndex = 0,
  pageSize = DEFAULT_PAGE_SIZE,
  filter = "",
}: {
  pageIndex?: number;
  pageSize?: number;
  filter?: string;
}): Promise<GetUsersResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.');
  }

  try {
    const conditions = [];
    if (filter) {
      conditions.push(
        or(
          ilike(userSchema.email, `%${filter}%`),
          ilike(userSchema.name, `%${filter}%`)
        )
      );
    }

    const usersQuery = db
      .select()
      .from(userSchema)
      .where(conditions.length > 0 ? or(...conditions) : undefined)
      .orderBy(desc(userSchema.createdAt))
      .offset(pageIndex * pageSize)
      .limit(pageSize);

    const totalCountQuery = db
      .select({ value: count() })
      .from(userSchema)
      .where(conditions.length > 0 ? or(...conditions) : undefined);

    const [results, totalCountResult] = await Promise.all([
      usersQuery,
      totalCountQuery,
    ]);

    const totalCount = totalCountResult[0].value;

    return actionResponse.success({
      users: results as unknown as UserType[] || [],
      totalCount: totalCount,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function banUser({
  userId,
  reason,
}: {
  userId: string;
  reason?: string;
}): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.');
  }

  try {
    const target = await db
      .select({ id: userSchema.id, role: userSchema.role })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1);

    if (target.length === 0) {
      return actionResponse.notFound('User not found.');
    }

    if (target[0].role === 'admin') {
      return actionResponse.forbidden('Cannot ban admin users.');
    }

    await db
      .update(userSchema)
      .set({ banned: true, banReason: reason ?? 'Banned by admin', banExpires: null })
      .where(eq(userSchema.id, userId));

    return actionResponse.success();
  } catch (error: any) {
    return actionResponse.error(getErrorMessage(error));
  }
}

export async function unbanUser({
  userId,
}: {
  userId: string;
}): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.');
  }

  try {
    const target = await db
      .select({ id: userSchema.id })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1);

    if (target.length === 0) {
      return actionResponse.notFound('User not found.');
    }

    await db
      .update(userSchema)
      .set({ banned: false, banReason: null, banExpires: null })
      .where(eq(userSchema.id, userId));

    return actionResponse.success();
  } catch (error: any) {
    return actionResponse.error(getErrorMessage(error));
  }
}