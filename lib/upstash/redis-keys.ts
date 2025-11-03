import { siteConfig } from '@/config/site';
import { PostType } from '@/lib/db/schema';

/**
 * Redis key generator - centralized key management for consistency
 */
export const RedisKeys = {
  /**
   * Post view count keys
   */
  post: {
    /**
     * Get post view count key
     * @example post:views:my-postType-post:en
     */
    viewCount: (postType: PostType, slug: string, locale: string) => `${siteConfig.name.trim()}:blog:views:${postType}:${slug}:${locale}`,

    /**
     * Get post IP tracking key (for deduplication)
     * @example post:views:ip:my-postType-post:en:192.168.1.1
     */
    viewIpTracking: (postType: PostType, slug: string, locale: string, ip: string) =>
      `${siteConfig.name.trim()}:post:views:ip:${postType}:${slug}:${locale}:${ip}`,
  },
  /**
   * Blog view count keys
   */
  blog: {
    /**
     * Get blog view count key
     * @example blog:views:my-post:en
     */
    viewCount: (slug: string, locale: string) => `${siteConfig.name.trim()}:blog:views:${slug}:${locale}`,

    /**
     * Get blog IP tracking key (for deduplication)
     * @example blog:views:ip:my-post:en:192.168.1.1
     */
    viewIpTracking: (slug: string, locale: string, ip: string) =>
      `${siteConfig.name.trim()}:blog:views:ip:${slug}:${locale}:${ip}`,
  },

  // Add other modules here as needed
  // user: { ... },
  // cache: { ... },
};