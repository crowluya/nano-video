"use server";

import { actionResponse } from '@/lib/action-response';
import { isAdmin } from '@/lib/supabase/isAdmin';
import { Database } from '@/lib/supabase/types';
import { UserType } from "@/types/admin/users";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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
    return actionResponse.forbidden("Admin privileges required.");
  }

  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("users")
    .select("*", { count: 'exact' });

  if (filter) {
    const filterValue = `%${filter}%`;
    query = query.or(
      `email.ilike.${filterValue},full_name.ilike.${filterValue}`
    );
  }

  query = query.range(from, to).order("created_at", { ascending: false });

  const { data: users, error, count } = await query;

  if (error) {
    console.error("Error fetching users:", error);
    return actionResponse.notFound("Failed to fetch users");
  }

  return actionResponse.success({
    users: users || [],
    totalCount: count || 0,
  });
} 