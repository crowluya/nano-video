import { getOrders } from "@/actions/orders/admin";
import { constructMetadata } from "@/lib/metadata";
import type { Locale } from "@/i18n/routing";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { columns } from "./Columns";
import { OrdersDataTable } from "./DataTable";

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
    namespace: "Orders",
  });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/orders`,
  });
}

const PAGE_SIZE = 20;

async function OrdersTable() {
  const initialData = await getOrders({ pageIndex: 0, pageSize: PAGE_SIZE });

  if (!initialData.success) {
    return <p className="text-destructive">{initialData.error}</p>;
  }

  const { orders, totalCount } = initialData.data || {
    orders: [],
    totalCount: 0,
  };

  return (
    <OrdersDataTable
      columns={columns}
      initialData={orders}
      initialPageCount={Math.ceil((totalCount || 0) / PAGE_SIZE)}
      pageSize={PAGE_SIZE}
      totalCount={totalCount}
    />
  );
}

export default function AdminOrdersPage() {
  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <OrdersTable />
      </Suspense>
    </div>
  );
}
