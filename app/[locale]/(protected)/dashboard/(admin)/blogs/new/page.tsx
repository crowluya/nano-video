import { PostEditorClient } from "@/components/cms/PostEditorClient";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

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
    namespace: "DashboardBlogs.Create",
  });

  return constructMetadata({
    page: "CreateBlog",
    title: t("pageTitle"),
    description: t("pageDescription"),
    locale: locale as Locale,
    path: `/dashboard/blogs/new`,
  });
}

export default function CreateBlogPage() {
  const r2PublicUrl = process.env.R2_PUBLIC_URL || "";

  return (
    <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin" />}>
      <PostEditorClient
        postType="blog"
        mode="create"
        r2PublicUrl={r2PublicUrl}
      />
    </Suspense>
  );
}
