import { getActivityLogs } from "@/actions/usage/activity-logs";
import { Loader2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ActivityLogsDataTable } from "./ActivityLogsDataTable";

const PAGE_SIZE = 20;

export default async function ActivityLogsPage() {
  const t = await getTranslations("ActivityLogs");
  const initialResult = await getActivityLogs({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title") || "Activity Logs"}</h1>
        <p className="text-muted-foreground">
          {t("description") || "View your account activity and operation history"}
        </p>
      </div>
      {initialResult.success && initialResult.data ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center rounded-md border">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          }
        >
          <ActivityLogsDataTable
            initialData={initialResult.data.logs}
            initialTotalCount={initialResult.data.count}
            pageSize={PAGE_SIZE}
          />
        </Suspense>
      ) : (
        <p className="text-destructive">
          {initialResult.error || t("load_error") || "Failed to load activity logs"}
        </p>
      )}
    </div>
  );
}

