import { listPostsAction } from "@/actions/blogs/posts";
import { Button } from "@/components/ui/button";
import { Link as I18nLink, Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { PlusCircle } from "lucide-react";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PostsDataTable } from "./PostsDataTable";
import { TagManagementDrawer } from "./TagManagementDrawer";

const PAGE_SIZE = 20;

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
    namespace: "DashboardBlogs",
  });

  return constructMetadata({
    page: "DashboardBlogs",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/blogs`,
  });
}

export default async function AdminBlogsPage() {
  const locale = await getLocale();
  const t = await getTranslations("DashboardBlogs");

  // Fetch posts - initial load
  const result = await listPostsAction({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
    locale: locale as Locale,
  });

  if (!result.success) {
    return (
      <div className="space-y-4 p-4 md:p-8">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-destructive">
          {t("fetchError", { error: result.error ?? "Unknown error" })}
        </p>
      </div>
    );
  }

  const posts = result.data?.posts || [];
  const totalPosts = result.data?.count || 0;
  const pageCount = Math.ceil(totalPosts / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="flex space-x-2">
          <TagManagementDrawer />
          <Button asChild className="highlight-bg text-white">
            <I18nLink
              href={`/dashboard/blogs/new`}
              title={t("createNewButton")}
              prefetch={false}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> {t("createNewButton")}
            </I18nLink>
          </Button>
        </div>
      </div>
      <p className="text-muted-foreground">{t("description")}</p>

      <PostsDataTable
        initialData={posts}
        initialPageCount={pageCount}
        pageSize={PAGE_SIZE}
        totalPosts={totalPosts}
      />
    </div>
  );
}
