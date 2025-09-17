import { listPublishedPostsAction } from "@/actions/blogs/posts";
import MDXComponents from "@/components/mdx/MDXComponents";
import { Button } from "@/components/ui/button";
import { Link as I18nLink, Locale, LOCALES } from "@/i18n/routing";
import { getPostBySlug, getPosts } from "@/lib/getBlogs";
import { constructMetadata } from "@/lib/metadata";
import dayjs from "dayjs";
import { ArrowLeftIcon, CalendarIcon } from "lucide-react";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ContentRestrictionMessage } from "./ContentRestrictionMessage";

export const dynamicParams = true;

type Params = Promise<{
  locale: string;
  slug: string;
}>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const { post, error, errorCode } = await getPostBySlug(slug, locale);

  if (!post) {
    return constructMetadata({
      title: "404",
      description: "Page not found",
      noIndex: true,
      locale: locale as Locale,
      path: `/blogs/${slug}`,
    });
  }

  const isContentRestricted = !!errorCode;

  const metadataPath = post.slug.startsWith("/") ? post.slug : `/${post.slug}`;
  const fullPath = `/blogs${metadataPath}`;

  return constructMetadata({
    page: "blogs",
    title: post.title,
    description: post.description,
    images: post.featuredImageUrl ? [post.featuredImageUrl] : [],
    locale: locale as Locale,
    path: fullPath,
    noIndex: isContentRestricted,
  });
}

export default async function BlogPage({ params }: { params: Params }) {
  const { slug, locale } = await params;
  const t = await getTranslations("Blogs");

  const { post, errorCode } = await getPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  let showRestrictionMessageInsteadOfContent = false;
  let messageTitle = "";
  let messageContent = "";
  let actionText = "";
  let actionLink = "";

  if (errorCode) {
    showRestrictionMessageInsteadOfContent = true;
    const redirectUrl = `/blogs/${slug}`;

    if (errorCode === "unauthorized") {
      messageTitle = t("BlogDetail.accessRestricted");
      messageContent = t("BlogDetail.unauthorized");
      actionText = t("BlogDetail.signIn");
      actionLink = `/login?next=${encodeURIComponent(redirectUrl)}`;
    } else if (errorCode === "notSubscriber") {
      messageTitle = t("BlogDetail.premium");
      messageContent = t("BlogDetail.premiumContent");
      actionText = t("BlogDetail.upgrade");
      actionLink = process.env.NEXT_PUBLIC_PRICING_PATH!;
    }
  }

  const tagsArray = post.tags
    ? post.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
    : [];

  const getVisibilityInfo = () => {
    switch (post.visibility) {
      case "subscribers":
        return {
          label: "Subscribers Only",
          bgColor: "bg-purple-600",
        };
      case "logged_in":
        return {
          label: "Members Only",
          bgColor: "bg-blue-600",
        };
      default:
        return {
          label: "Public",
          bgColor: "bg-green-600",
        };
    }
  };

  const visibilityInfo = getVisibilityInfo();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm" className="group">
          <I18nLink
            href="/blogs"
            title={t("BlogDetail.backToBlogs")}
            prefetch={false}
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            {t("BlogDetail.backToBlogs")}
          </I18nLink>
        </Button>
      </div>

      <header className="mb-12">
        {post.visibility !== "public" && (
          <div
            className={`${visibilityInfo.bgColor} text-white text-xs px-3 py-1 rounded-full inline-flex mb-6`}
          >
            {visibilityInfo.label}
          </div>
        )}

        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dayjs(post.publishedAt).format("MMMM D, YYYY")}
          </div>

          {post.isPinned && (
            <div className="flex items-center bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded-md text-xs">
              {t("BlogDetail.featured")}
            </div>
          )}
        </div>

        {post.description && (
          <div className="bg-muted rounded-lg p-6 text-lg mb-8">
            {post.description}
          </div>
        )}
      </header>

      {post.featuredImageUrl && (
        <div className="my-10 rounded-xl overflow-hidden shadow-md aspect-video relative">
          <Image
            src={post.featuredImageUrl}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            className="object-cover"
          />
        </div>
      )}

      {tagsArray.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {tagsArray.map((tag) => (
            <div
              key={tag}
              className="rounded-full bg-secondary/80 hover:bg-secondary px-3 py-1 text-sm font-medium transition-colors"
            >
              {tag}
            </div>
          ))}
        </div>
      )}

      {showRestrictionMessageInsteadOfContent ? (
        <ContentRestrictionMessage
          title={messageTitle}
          message={messageContent}
          actionText={actionText}
          actionLink={actionLink}
          backText={t("BlogDetail.backToBlogs")}
          backLink={`/blogs`}
        />
      ) : (
        <article className="prose dark:prose-invert lg:prose-lg prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl prose-img:shadow-md max-w-none">
          <MDXRemote source={post?.content || ""} components={MDXComponents} />
        </article>
      )}

      <div className="mt-16 pt-8 border-t">
        <Button asChild variant="outline" size="sm">
          <I18nLink
            href="/blogs"
            title={t("BlogDetail.backToBlogs")}
            prefetch={false}
            className="inline-flex items-center"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {t("BlogDetail.backToBlogs")}
          </I18nLink>
        </Button>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  const allParams: { locale: string; slug: string }[] = [];

  for (const locale of LOCALES) {
    const { posts: localPosts } = await getPosts(locale);
    localPosts
      .filter((post) => post.slug && post.status !== "draft")
      .forEach((post) => {
        const slugPart = post.slug.replace(/^\//, "").replace(/^blogs\//, "");
        if (slugPart) {
          allParams.push({ locale, slug: slugPart });
        }
      });
  }

  for (const locale of LOCALES) {
    const serverResult = await listPublishedPostsAction({
      locale: locale,
      pageSize: 1000,
      visibility: "public",
    });
    if (serverResult.success && serverResult.data?.posts) {
      serverResult.data.posts.forEach((post) => {
        const slugPart = post.slug?.replace(/^\//, "").replace(/^blogs\//, "");
        if (slugPart) {
          allParams.push({ locale, slug: slugPart });
        }
      });
    }
  }

  const uniqueParams = Array.from(
    new Map(allParams.map((p) => [`${p.locale}-${p.slug}`, p])).values()
  );
  // console.log("Generated Static Params:", uniqueParams.slice(0, 10), "...");
  return uniqueParams;
}
