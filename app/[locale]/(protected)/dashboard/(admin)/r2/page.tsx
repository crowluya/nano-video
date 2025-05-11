import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BLOGS_IMAGE_PATH } from "@/config/common";
import { constructMetadata } from "@/lib/metadata";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { listR2Files } from "./actions";
import { ImagesDataTable } from "./ImagesDataTable";

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
    namespace: "Dashboard.Admin.Images",
  });

  return constructMetadata({
    page: "Images",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/r2`,
  });
}

const CATEGORIES = [
  { name: "Text to Image", prefix: "text-to-images/" },
  { name: "Image to Image", prefix: "image-to-images/" },
  { name: "Image to Video", prefix: "image-to-videos/" },
  { name: "Blogs Images", prefix: BLOGS_IMAGE_PATH },
];
const PAGE_SIZE = 20;

async function CategoryTable({ categoryPrefix }: { categoryPrefix: string }) {
  const initialResult = await listR2Files({
    categoryPrefix: categoryPrefix,
    pageSize: PAGE_SIZE,
  });

  const initialTokenMap: Record<number, string | null> = {};
  if (initialResult.nextContinuationToken) {
    initialTokenMap[0] = initialResult.nextContinuationToken;
  }

  const initialHasMore = initialResult.nextContinuationToken !== undefined;

  return (
    <ImagesDataTable
      initialData={initialResult.files}
      initialHasMore={initialHasMore}
      initialTokenMap={initialTokenMap}
      categoryPrefix={categoryPrefix}
      r2PublicUrl={process.env.R2_PUBLIC_URL}
      pageSize={PAGE_SIZE}
    />
  );
}

export default function AdminImagesPage() {
  const t = useTranslations("Dashboard.Admin.Images");
  const defaultCategory = CATEGORIES[0].prefix;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <Tabs defaultValue={defaultCategory}>
        <TabsList>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.prefix} value={cat.prefix}>
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.prefix} value={cat.prefix} className="mt-0">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64 rounded-md border">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              }
            >
              <CategoryTable categoryPrefix={cat.prefix} />
            </Suspense>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
