import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import CreateBlogClient from "./CreateBlogClient";

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
  return <CreateBlogClient />;
}
