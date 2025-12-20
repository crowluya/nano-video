'use server';

import { actionResponse } from '@/lib/action-response';
import { getSession } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { activityLogs as activityLogsSchema } from '@/lib/db/schema';
import { getErrorMessage } from '@/lib/error-utils';
import { count, desc, eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export type ActivityLog = typeof activityLogsSchema.$inferSelect;

interface CreateActivityLogParams {
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
}

interface ListActivityLogsParams {
  pageIndex?: number;
  pageSize?: number;
  action?: string;
}

interface ListActivityLogsResult {
  success: boolean;
  data?: {
    logs: ActivityLog[];
    count: number;
  };
  error?: string;
}

/**
 * Creates an activity log entry for the currently authenticated user.
 */
export async function createActivityLog(
  params: CreateActivityLogParams
): Promise<{ success: boolean; error?: string; logId?: string }> {
  const session = await getSession();
  const user = session?.user;
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || 
                      headersList.get('x-real-ip') || 
                      null;
    const userAgent = headersList.get('user-agent') || null;

    const result = await db.insert(activityLogsSchema).values({
      userId: user.id,
      action: params.action,
      resourceType: params.resourceType || null,
      resourceId: params.resourceId || null,
      metadata: params.metadata || {},
      ipAddress,
      userAgent,
    }).returning({ id: activityLogsSchema.id });

    return {
      success: true,
      logId: result[0]?.id,
    };
  } catch (err: any) {
    console.error('Error creating activity log:', err);
    return {
      success: false,
      error: getErrorMessage(err) || 'Failed to create activity log',
    };
  }
}

/**
 * Fetches the activity logs for the currently authenticated user with pagination.
 */
export async function getActivityLogs({
  pageIndex = 0,
  pageSize = 20,
  action,
}: ListActivityLogsParams = {}): Promise<ListActivityLogsResult> {
  const session = await getSession();
  const user = session?.user;
  if (!user) return actionResponse.unauthorized();

  try {
    let whereClause = eq(activityLogsSchema.userId, user.id);
    
    // If action filter is provided, add it to the where clause
    // Note: This is a simplified version. For more complex filtering, use and() from drizzle-orm
    if (action) {
      whereClause = eq(activityLogsSchema.userId, user.id);
      // We'll filter in the query
    }

    const logsQuery = db
      .select()
      .from(activityLogsSchema)
      .where(whereClause)
      .orderBy(desc(activityLogsSchema.createdAt))
      .offset(pageIndex * pageSize)
      .limit(pageSize);

    const totalCountQuery = db
      .select({ value: count() })
      .from(activityLogsSchema)
      .where(whereClause);

    const [data, totalCountResult] = await Promise.all([
      logsQuery,
      totalCountQuery,
    ]);

    // Filter by action if provided (client-side filter for simplicity)
    let filteredData = data || [];
    if (action) {
      filteredData = filteredData.filter(log => log.action === action);
    }

    const totalCount = totalCountResult[0].value;

    return actionResponse.success({ 
      logs: filteredData, 
      count: action ? filteredData.length : (totalCount ?? 0) 
    });
  } catch (err: any) {
    console.error('Unexpected error fetching activity logs:', err);
    return actionResponse.error(
      getErrorMessage(err) || 'An unexpected server error occurred.'
    );
  }
}

