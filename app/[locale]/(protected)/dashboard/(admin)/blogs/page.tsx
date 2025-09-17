import { listPostsAction } from "@/actions/blogs/posts";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { PostsDataTable } from "./PostsDataTable";

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
      <PostsDataTable
        initialData={posts}
        initialPageCount={pageCount}
        pageSize={PAGE_SIZE}
        totalPosts={totalPosts}
      />
    </div>
  );
}
