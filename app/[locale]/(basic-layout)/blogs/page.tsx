import { listPublishedPostsAction } from "@/actions/blogs/posts";
import { listTagsAction } from "@/actions/blogs/tags";
import { PostList } from "@/components/cms/PostList";
import { Locale } from "@/i18n/routing";
import { getPosts } from "@/lib/getBlogs";
import { constructMetadata } from "@/lib/metadata";
import { Tag } from "@/types/cms";
import { TextSearch } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blogs" });

  return constructMetadata({
    page: "Blogs",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/blogs`,
  });
}

const SERVER_POST_PAGE_SIZE = 48;

export default async function Page({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations("Blogs");

  const { posts: localPosts } = await getPosts(locale);

  const initialServerPostsResult = await listPublishedPostsAction({
    pageIndex: 0,
    pageSize: SERVER_POST_PAGE_SIZE,
    postType: "blog",
    visibility: "public",
    locale: locale,
  });

  const initialServerPosts =
    initialServerPostsResult.success && initialServerPostsResult.data?.posts
      ? initialServerPostsResult.data.posts
      : [];
  const totalServerPosts =
    initialServerPostsResult.success && initialServerPostsResult.data?.count
      ? initialServerPostsResult.data.count
      : 0;

  if (!initialServerPostsResult.success) {
    console.error(
      "Failed to fetch initial server posts:",
      initialServerPostsResult.error
    );
  }

  const tagsResult = await listTagsAction({});
  let serverTags: Tag[] = [];
  if (tagsResult.success && tagsResult.data?.tags) {
    serverTags = tagsResult.data.tags;
  }

  const noPostsFound =
    localPosts.length === 0 && initialServerPosts.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">{t("title")}</h1>

      {noPostsFound ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <TextSearch className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            {t("emptyState.title") || "No blog posts"}
          </h2>
          <p className="text-gray-500 max-w-md">
            {t("emptyState.description") ||
              "We are creating exciting content, please stay tuned!"}
          </p>
        </div>
      ) : (
        <PostList
          postType="blog"
          baseUrl="/blogs"
          localPosts={localPosts}
          initialPosts={initialServerPosts}
          initialTotal={totalServerPosts}
          serverTags={serverTags}
          locale={locale}
          pageSize={SERVER_POST_PAGE_SIZE}
          showTagSelector={true}
          emptyMessage="No posts found for this tag."
        />
      )}
    </div>
  );
}
