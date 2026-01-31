import { listR2Files } from "@/actions/r2-resources";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ADMIN_UPLOAD_IMAGE_PATH, BLOGS_IMAGE_PATH } from "@/config/common";
import { constructMetadata } from "@/lib/metadata";
import type { Locale } from "@/i18n/routing";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
    namespace: "R2Files",
  });

  return constructMetadata({
    page: "R2 Resources",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/r2-resources`,
  });
}

const CATEGORIES = [
  { name: "All", prefix: "" },
  {
    name: "Admin Uploads",
    prefix: `${ADMIN_UPLOAD_IMAGE_PATH}/`,
  },
  { name: "Blogs Images", prefix: `${BLOGS_IMAGE_PATH}/` },
  { name: "Text to Image", prefix: "text-to-images/" },
  { name: "Image to Image", prefix: "image-to-images/" },
  { name: "Image to Video", prefix: "image-to-videos/" },
];

const PAGE_SIZE = 40;

async function CategoryTable({ categoryPrefix }: { categoryPrefix: string }) {
  const initialResult = await listR2Files({
    categoryPrefix: categoryPrefix,
    pageSize: PAGE_SIZE,
  });

  if (!initialResult.success || !initialResult.data) {
    console.error(
      "Failed to load initial files for category:",
      categoryPrefix,
      initialResult.error
    );
    return (
      <div className="text-red-500">
        Error loading images: {initialResult.error}
      </div>
    );
  }

  const { files: initialFiles, nextContinuationToken } = initialResult.data;

  const initialTokenMap: Record<number, string | null> = {};
  if (nextContinuationToken) {
    initialTokenMap[0] = nextContinuationToken;
  }

  const initialHasMore = nextContinuationToken !== undefined;

  return (
    <ImagesDataTable
      initialData={initialFiles}
      initialHasMore={initialHasMore}
      initialTokenMap={initialTokenMap}
      categoryPrefix={categoryPrefix}
      r2PublicUrl={process.env.R2_PUBLIC_URL}
      pageSize={PAGE_SIZE}
    />
  );
}

export default function Page() {
  const defaultCategory = CATEGORIES[0].prefix;

  return (
    <div className="mt-6">
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
            <CategoryTable categoryPrefix={cat.prefix} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
