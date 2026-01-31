import { getUsers } from "@/actions/users/admin";
import { constructMetadata } from "@/lib/metadata";
import type { Locale } from "@/i18n/routing";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { columns } from "./Columns";
import { DataTable } from "./DataTable";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Users",
  });

  return constructMetadata({
    page: "Users",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/users`,
  });
}

const PAGE_SIZE = 20;

async function UsersTable() {
  const initialData = await getUsers({ pageIndex: 0, pageSize: PAGE_SIZE });

  return (
    <DataTable
      columns={columns}
      initialData={initialData.data?.users || []}
      initialPageCount={Math.ceil(
        initialData.data?.totalCount || 0 / PAGE_SIZE
      )}
      pageSize={PAGE_SIZE}
    />
  );
}

export default async function AdminUsersPage() {
  const t = await getTranslations("Users");

  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        }
      >
        <UsersTable />
      </Suspense>
    </div>
  );
}
