import { getUsers } from "@/actions/users/admin";
import { constructMetadata } from "@/lib/metadata";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
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

export default function AdminUsersPage() {
  const t = useTranslations("Users");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

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
