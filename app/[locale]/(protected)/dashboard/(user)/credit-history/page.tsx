import { getCreditLogs } from "@/actions/usage/logs";
import { Loader2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CreditHistoryDataTable } from "./CreditHistoryDataTable";

const PAGE_SIZE = 20;

export default async function CreditHistoryPage() {
  const t = await getTranslations("CreditHistory");
  const initialResult = await getCreditLogs({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      {initialResult.success && initialResult.data ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center rounded-md border">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          }
        >
          <CreditHistoryDataTable
            initialData={initialResult.data.logs}
            initialTotalCount={initialResult.data.count}
            pageSize={PAGE_SIZE}
          />
        </Suspense>
      ) : (
        <p className="text-destructive">
          {initialResult.error || t("load_error")}
        </p>
      )}
    </div>
  );
}
