'use server';

import { actionResponse } from '@/lib/action-response';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { creditLogs as creditLogsSchema } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/error-utils';
import { count, desc, eq } from 'drizzle-orm';

export type CreditLog = typeof creditLogsSchema.$inferSelect;

interface ListCreditLogsParams {
  pageIndex?: number;
  pageSize?: number;
}

interface ListCreditLogsResult {
  success: boolean;
  data?: {
    logs: CreditLog[];
    count: number;
  };
  error?: string;
}

/**
 * Fetches the credit usage history for the currently authenticated user with pagination.
 * @returns An ActionResult containing an array of credit logs, the total count, or an error.
 */
export async function getCreditLogs({
  pageIndex = 0,
  pageSize = 20,
}: ListCreditLogsParams = {}): Promise<ListCreditLogsResult> {
  const session = await getSession()
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    const whereClause = eq(creditLogsSchema.userId, user.id);

    const logsQuery = db
      .select()
      .from(creditLogsSchema)
      .where(whereClause)
      .orderBy(desc(creditLogsSchema.createdAt))
      .offset(pageIndex * pageSize)
      .limit(pageSize);

    const totalCountQuery = db
      .select({ value: count() })
      .from(creditLogsSchema)
      .where(whereClause);

    const [data, totalCountResult] = await Promise.all([
      logsQuery,
      totalCountQuery,
    ]);
    const totalCount = totalCountResult[0].value;

    return actionResponse.success({ logs: data || [], count: totalCount ?? 0 });
  } catch (err: any) {
    console.error('Unexpected error fetching credit logs:', err);
    return actionResponse.error(
      getErrorMessage(err) || 'An unexpected server error occurred.'
    );
  }
} 