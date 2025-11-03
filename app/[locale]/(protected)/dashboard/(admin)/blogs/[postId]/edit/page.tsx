import { PostEditorClient } from "@/components/cms/PostEditorClient";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

type Params = Promise<{ locale: string; postId: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale, postId } = await params;
  const t = await getTranslations({
    locale,
    namespace: "DashboardBlogs.Edit",
  });

  return constructMetadata({
    page: "EditBlog",
    title: t("pageTitle"),
    description: t("pageDescription"),
    locale: locale as Locale,
    path: `/dashboard/blogs/${postId}/edit`,
  });
}

export default async function EditBlogPage({ params }: MetadataProps) {
  const r2PublicUrl = process.env.R2_PUBLIC_URL || "";
  const { postId } = await params;
  return (
    <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin" />}>
      <PostEditorClient
        postType="blog"
        mode="edit"
        r2PublicUrl={r2PublicUrl}
        postId={postId as string}
      />
    </Suspense>
  );
}
