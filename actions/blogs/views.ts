'use server'

import { DEFAULT_LOCALE } from '@/i18n/routing'
import { actionResponse } from '@/lib/action-response'
import { PostType } from '@/lib/db/schema'
import { getErrorMessage } from '@/lib/error-utils'
import { getClientIPFromHeaders, redis } from '@/lib/upstash'
import { RedisKeys } from '@/lib/upstash/redis-keys'

interface IncrementViewCountParams {
  slug: string
  postType: PostType
  locale: string
}

interface ViewCountResult {
  success: boolean
  data?: {
    count?: number
  }
  error?: string
}

/**
 * Increment view count for a blog post (counts every page load)
 */
export async function incrementViewCountAction({
  slug,
  postType = 'blog',
  locale = DEFAULT_LOCALE,
}: IncrementViewCountParams): Promise<ViewCountResult> {
  if (!slug) {
    return actionResponse.badRequest('Slug is required.')
  }

  try {
    // If Redis is not configured, return success with count 0
    if (!redis) {
      return actionResponse.success({ count: 0 })
    }

    const key = RedisKeys.post.viewCount(postType, slug, locale)
    const count = await redis.incr(key)

    return actionResponse.success({ count })
  } catch (error) {
    console.error(`Increment View Count Failed for ${slug}:`, error)
    const errorMessage = getErrorMessage(error)
    return actionResponse.error(errorMessage)
  }
}

/**
 * Increment unique view count for a blog post (same IP counts once per hour)
 */
export async function incrementUniqueViewCountAction({
  slug,
  postType = 'blog',
  locale = DEFAULT_LOCALE,
}: IncrementViewCountParams): Promise<ViewCountResult> {
  if (!slug) {
    return actionResponse.badRequest('Slug is required.')
  }

  try {
    // If Redis is not configured, return success with count 0
    if (!redis) {
      return actionResponse.success({ count: 0 })
    }

    // Get client IP address
    const clientIP = await getClientIPFromHeaders()

    // Check if this IP has already viewed this post in the last hour
    const ipKey = RedisKeys.post.viewIpTracking(postType, slug, locale, clientIP)
    const hasViewed = await redis.get(ipKey)

    let count: number

    if (!hasViewed) {
      // IP hasn't viewed this post in the last hour, increment counter
      const viewKey = RedisKeys.post.viewCount(postType, slug, locale)
      count = await redis.incr(viewKey)

      // Set IP tracking key with 1 hour expiration (3600 seconds)
      await redis.set(ipKey, '1', { ex: 3600 })
    } else {
      // IP has already viewed this post in the last hour, just return current count
      const viewKey = RedisKeys.post.viewCount(postType, slug, locale)
      const currentCount = await redis.get<number>(viewKey)
      count = currentCount || 0
    }

    return actionResponse.success({ count })
  } catch (error) {
    console.error(`Increment Unique View Count Failed for ${slug}:`, error)
    const errorMessage = getErrorMessage(error)
    return actionResponse.error(errorMessage)
  }
}

interface GetViewCountParams {
  slug: string
  postType: PostType
  locale?: string
}

/**
 * Get view count for a blog post
 */
export async function getViewCountAction({
  slug,
  postType = 'blog',
  locale = DEFAULT_LOCALE,
}: GetViewCountParams): Promise<ViewCountResult> {
  if (!slug || !locale) {
    return actionResponse.badRequest('Slug and locale are required.')
  }

  try {
    // If Redis is not configured, return success with count 0
    if (!redis) {
      return actionResponse.success({ count: 0 })
    }

    const key = RedisKeys.post.viewCount(postType, slug, locale)
    const count = await redis.get<number>(key)

    return actionResponse.success({ count: count || 0 })
  } catch (error) {
    console.error(`Get View Count Failed for ${slug}:`, error)
    const errorMessage = getErrorMessage(error)
    return actionResponse.error(errorMessage)
  }
}

