import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import EditBlogClient from "./EditBlogClient";

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

export default function EditBlogPage() {
  return <EditBlogClient />;
}
