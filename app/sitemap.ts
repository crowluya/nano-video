import { listPublishedPostsAction } from '@/actions/posts/posts'
import { siteConfig } from '@/config/site'
import { DEFAULT_LOCALE, LOCALES } from '@/i18n/routing'
import { getPosts } from '@/lib/getBlogs'
import { isBuildTime } from '@/lib/is-build-time'
import { MetadataRoute } from 'next'

const siteUrl = siteConfig.url

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' | undefined

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    '',
    '/about',
    '/blog',
    '/nanabananvideo',
    '/prompt-generator',
    '/video-generation',
    '/nano-banana-video-generator',
    '/nano-banana-image-to-video',
    '/nano-banana-text-to-video',
    '/nano-banana-video-free',
    '/nano-banana-video-prompts',
    '/nano-banana-video-pricing-limits',
    '/guides/how-to-make-videos-with-nano-banana',
    '/guides/best-nano-banana-video-prompts',
    '/guides/nano-banana-video-settings-and-limits',
  ]

  const pages = LOCALES.flatMap(locale => {
    return staticPages.map(page => ({
      url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}${page}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as ChangeFrequency,
      priority: page === '' ? 1.0 : 0.8,
    }))
  })

  const allBlogSitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    const { posts: localPosts } = await getPosts(locale);
    localPosts
      .filter((post) => post.slug && post.status !== "draft")
      .forEach((post) => {
        const slugPart = post.slug.replace(/^\//, "").replace(/^blogs\//, "");
        if (slugPart) {
          allBlogSitemapEntries.push({
            url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/blog/${slugPart}`,
            lastModified: post.metadata?.updatedAt || post.publishedAt || new Date(),
            changeFrequency: 'daily' as ChangeFrequency,
            priority: 0.7,
          });
        }
      });
  }

  if (!isBuildTime()) {
    for (const locale of LOCALES) {
      const serverResult = await listPublishedPostsAction({
        locale: locale,
        pageSize: 1000,
        visibility: "public",
        postType: "blog",
      });
      if (serverResult.success && serverResult.data?.posts) {
        serverResult.data.posts.forEach((post) => {
          const slugPart = post.slug?.replace(/^\//, "").replace(/^blogs\//, "");
          if (slugPart) {
            allBlogSitemapEntries.push({
              url: `${siteUrl}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/blog/${slugPart}`,
              lastModified: post.publishedAt || new Date(),
              changeFrequency: 'daily' as ChangeFrequency,
              priority: 0.7,
            });
          }
        });
      }
    }
  }

  const uniqueBlogPostEntries = Array.from(
    new Map(allBlogSitemapEntries.map((entry) => [entry.url, entry])).values()
  );

  return [
    ...pages,
    ...uniqueBlogPostEntries
  ]
}
