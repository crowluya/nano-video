'use server'

import { postActionSchema } from '@/components/cms/post-config'
import { DEFAULT_LOCALE } from '@/i18n/routing'
import { actionResponse } from '@/lib/action-response'
import { getSession, isAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { posts as postsSchema, PostStatus, postTags as postTagsSchema, PostType, subscriptions as subscriptionsSchema, tags as tagsSchema } from '@/lib/db/schema'
import { getErrorMessage } from '@/lib/error-utils'
import { PostWithTags, PublicPost, PublicPostWithContent } from '@/types/cms'
import { and, count, desc, eq, getTableColumns, ilike, inArray, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type PostListItem = Omit<typeof postsSchema.$inferSelect, 'content'>

interface ListPostsParams {
  pageIndex?: number
  pageSize?: number
  status?: PostStatus
  filter?: string
  postType: PostType
  language?: string
  locale?: string
}

interface ListPostsResult {
  success: boolean
  data?: {
    posts?: PostWithTags[]
    count?: number
  }
  error?: string
}

export async function listPostsAction({
  pageIndex = 0,
  pageSize = 20,
  status,
  language,
  filter = '',
  postType = 'blog',
}: ListPostsParams): Promise<ListPostsResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.')
  }

  try {
    const conditions = []
    if (postType) {
      conditions.push(eq(postsSchema.postType, postType))
    }
    if (status) {
      conditions.push(eq(postsSchema.status, status))
    }
    if (language) {
      conditions.push(eq(postsSchema.language, language))
    }
    if (filter) {
      const filterValue = `%${filter}%`
      conditions.push(
        or(
          ilike(postsSchema.title, filterValue),
          ilike(postsSchema.slug, filterValue),
          ilike(postsSchema.description, filterValue)
        )
      )
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined

    const postsQuery = db
      .select({
        id: postsSchema.id,
        language: postsSchema.language,
        title: postsSchema.title,
        slug: postsSchema.slug,
        description: postsSchema.description,
        featuredImageUrl: postsSchema.featuredImageUrl,
        isPinned: postsSchema.isPinned,
        status: postsSchema.status,
        visibility: postsSchema.visibility,
        publishedAt: postsSchema.publishedAt,
        createdAt: postsSchema.createdAt,
        updatedAt: postsSchema.updatedAt,
      })
      .from(postsSchema)
      .where(whereCondition)
      .orderBy(desc(postsSchema.isPinned), desc(postsSchema.createdAt))
      .limit(pageSize)
      .offset(pageIndex * pageSize)

    const countQuery = db
      .select({ value: count() })
      .from(postsSchema)
      .where(whereCondition)

    const [postsData, countData] = await Promise.all([postsQuery, countQuery])

    const postIds = postsData.map((p) => p.id)
    let tagsData: any[] = []
    if (postIds.length > 0) {
      tagsData = await db
        .select({
          postId: postTagsSchema.postId,
          tagId: tagsSchema.id,
          tagName: tagsSchema.name,
          tagCreatedAt: tagsSchema.createdAt,
        })
        .from(postTagsSchema)
        .innerJoin(tagsSchema, eq(postTagsSchema.tagId, tagsSchema.id))
        .where(inArray(postTagsSchema.postId, postIds))
    }

    const tagsByPostId = tagsData.reduce((acc, row) => {
      if (!acc[row.postId]) {
        acc[row.postId] = []
      }
      acc[row.postId].push({
        id: row.tagId,
        name: row.tagName,
        createdAt: row.tagCreatedAt,
      })
      return acc
    }, {} as Record<string, any[]>)

    const postsWithTags: PostWithTags[] = postsData.map((post) => ({
      ...(post as any),
      tags: tagsByPostId[post.id] || [],
    }))

    return actionResponse.success({
      posts: postsWithTags,
      count: countData[0].value,
    })
  } catch (error) {
    console.error('List Posts Action Failed:', error)
    const errorMessage = getErrorMessage(error)
    if (errorMessage.includes('permission denied')) {
      return actionResponse.forbidden('Permission denied to list posts.')
    }
    return actionResponse.error(errorMessage)
  }
}

interface GetPostByIdParams {
  postId: string
}

interface GetPostResult {
  success: boolean
  data?: {
    post?: PostWithTags
  }
  error?: string
}

export async function getPostByIdAction({
  postId,
}: GetPostByIdParams): Promise<GetPostResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.')
  }

  if (!postId || !z.string().uuid().safeParse(postId).success) {
    return actionResponse.badRequest('Invalid Post ID provided.')
  }

  try {
    const postData = await db
      .select()
      .from(postsSchema)
      .where(eq(postsSchema.id, postId))
      .limit(1)

    if (!postData || postData.length === 0) {
      return actionResponse.notFound('Post not found.')
    }
    const post = postData[0]

    const tagsData = await db
      .select({
        id: tagsSchema.id,
        name: tagsSchema.name,
        createdAt: tagsSchema.createdAt,
      })
      .from(postTagsSchema)
      .innerJoin(tagsSchema, eq(postTagsSchema.tagId, tagsSchema.id))
      .where(eq(postTagsSchema.postId, postId))

    const postWithTags: PostWithTags = {
      ...post,
      tags: tagsData || [],
    }

    return actionResponse.success({ post: postWithTags })
  } catch (error) {
    console.error(`Get Post By ID Action Failed for ${postId}:`, error)
    const errorMessage = getErrorMessage(error)
    if (errorMessage.includes('permission denied')) {
      return actionResponse.forbidden('Permission denied to view this post.')
    }
    return actionResponse.error(errorMessage)
  }
}

type PostActionInput = z.infer<typeof postActionSchema>

interface CreatePostParams {
  data: PostActionInput
  postType: PostType
}
interface ActionResult {
  success: boolean
  data?: {
    postId?: string
  }
  error?: string
}

export async function createPostAction({
  data,
  postType = 'blog',
}: CreatePostParams): Promise<ActionResult> {
  const validatedFields = postActionSchema.safeParse(data)
  if (!validatedFields.success) {
    console.error(
      'Validation Error:',
      validatedFields.error.flatten().fieldErrors
    )
    return actionResponse.badRequest('Invalid input data.')
  }

  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.')
  }

  const session = await getSession()
  const user = session?.user
  if (!user) return actionResponse.unauthorized()
  const authorId = user.id

  const { tags: inputTags, ...postData } = validatedFields.data
  const finalFeaturedImageUrl =
    postData.featuredImageUrl === '' ? null : postData.featuredImageUrl

  try {
    const newPost = await db
      .insert(postsSchema)
      .values({
        ...postData,
        postType: postType,
        authorId: authorId,
        featuredImageUrl: finalFeaturedImageUrl,
        content: postData.content || null,
        description: postData.description || null,
        isPinned: postData.isPinned || false,
      })
      .returning({ id: postsSchema.id })

    if (!newPost || newPost.length === 0 || !newPost[0].id) {
      throw new Error('Failed to create post: No ID returned.')
    }
    const postId = newPost[0].id

    if (inputTags && inputTags.length > 0) {
      const tagAssociations = inputTags.map((tag) => ({
        postId: postId,
        tagId: tag.id,
      }))
      await db.insert(postTagsSchema).values(tagAssociations)
    }

    if (postData.status === 'published') {
      revalidatePath(`${postData.language === DEFAULT_LOCALE ? '' : '/' + postData.language}/${postType}`)
      revalidatePath(`${postData.language === DEFAULT_LOCALE ? '' : '/' + postData.language}/${postType}/${postData.slug}`)
    }

    return actionResponse.success({ postId: postId })
  } catch (error) {
    console.error('Create Post Action Failed:', error)
    const errorMessage = getErrorMessage(error)
    if ((error as any)?.cause?.code === '23505') {
      return actionResponse.conflict(
        `Slug '${validatedFields.data.slug}' already exists.`
      )
    }
    return actionResponse.error(errorMessage)
  }
}

interface UpdatePostParams {
  data: PostActionInput
}

export async function updatePostAction({
  data,
}: UpdatePostParams): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.')
  }

  const validatedFields = postActionSchema
    .extend({
      id: z.string().uuid({ message: 'Valid Post ID is required for update.' }),
    })
    .safeParse(data)

  if (!validatedFields.success) {
    console.error(
      'Validation Error:',
      validatedFields.error.flatten().fieldErrors
    )
    return actionResponse.badRequest('Invalid input data for update.')
  }

  const { id: postId, tags: inputTags, ...postUpdateData } =
    validatedFields.data

  const finalFeaturedImageUrl =
    postUpdateData.featuredImageUrl === ''
      ? null
      : postUpdateData.featuredImageUrl

  try {
    const currentPostData = await db
      .select({
        slug: postsSchema.slug,
        language: postsSchema.language,
        status: postsSchema.status,
        postType: postsSchema.postType,
      })
      .from(postsSchema)
      .where(eq(postsSchema.id, postId))
      .limit(1)

    if (!currentPostData || currentPostData.length === 0) {
      return actionResponse.notFound(`Post with ID ${postId} not found.`)
    }
    const currentPost = currentPostData[0]

    // Use provided postType or keep existing one
    const finalPostType = currentPost.postType

    await db
      .update(postsSchema)
      .set({
        ...postUpdateData,
        postType: finalPostType,
        featuredImageUrl: finalFeaturedImageUrl,
        content: postUpdateData.content || null,
        description: postUpdateData.description || null,
        isPinned: postUpdateData.isPinned || false,
      })
      .where(eq(postsSchema.id, postId))

    await db.delete(postTagsSchema).where(eq(postTagsSchema.postId, postId))

    if (inputTags && inputTags.length > 0) {
      const newTagAssociations = inputTags.map((tag) => ({
        postId: postId,
        tagId: tag.id,
      }))
      await db.insert(postTagsSchema).values(newTagAssociations)
    }

    revalidatePath(`${currentPost.language === DEFAULT_LOCALE ? '' : '/' + currentPost.language}/${finalPostType}`)
    revalidatePath(`${currentPost.language === DEFAULT_LOCALE ? '' : '/' + currentPost.language}/${finalPostType}/${currentPost.slug}`)

    if (postUpdateData.status === 'published') {
      revalidatePath(
        `${postUpdateData.language === DEFAULT_LOCALE ? '' : '/' + postUpdateData.language}/${finalPostType}/${postUpdateData.slug}`
      )
    }

    return actionResponse.success({ postId: postId })
  } catch (error) {
    console.error('Update Post Action Failed:', error)
    const errorMessage = getErrorMessage(error)
    if ((error as any)?.cause?.code === '23505') {
      return actionResponse.conflict(
        `Slug '${validatedFields.data.slug}' already exists for language '${validatedFields.data.language}'.`
      )
    }
    return actionResponse.error(errorMessage)
  }
}

interface DeletePostParams {
  postId: string
}

export async function deletePostAction({
  postId,
}: DeletePostParams): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.')
  }

  if (!postId || !z.string().uuid().safeParse(postId).success) {
    return actionResponse.badRequest('Invalid Post ID provided.')
  }

  try {
    const postDetailsData = await db
      .select({
        slug: postsSchema.slug,
        language: postsSchema.language,
        postType: postsSchema.postType,
      })
      .from(postsSchema)
      .where(eq(postsSchema.id, postId))
      .limit(1)

    if (!postDetailsData || postDetailsData.length === 0) {
      return actionResponse.notFound('Failed to fetch post information.')
    }
    const postDetails = postDetailsData[0]

    await db.delete(postsSchema).where(eq(postsSchema.id, postId))

    if (postDetails?.slug && postDetails?.language) {
      revalidatePath(`${postDetails?.language === DEFAULT_LOCALE ? '' : '/' + postDetails?.language}/${postDetails.postType}`)
      revalidatePath(`${postDetails?.language === DEFAULT_LOCALE ? '' : '/' + postDetails?.language}/${postDetails.postType}/${postDetails.slug}`)
    }

    return actionResponse.success({ postId: postId })
  } catch (error) {
    console.error(`Delete Post Action Failed for ${postId}:`, error)
    const errorMessage = getErrorMessage(error)
    if (errorMessage.includes('permission denied')) {
      return actionResponse.forbidden('Permission denied to delete this post.')
    }
    return actionResponse.error(errorMessage)
  }
}

/**
 * User-side functionality
 */
interface ListPublishedPostsParams {
  pageIndex?: number
  pageSize?: number
  tagId?: string | null
  visibility?: 'public' // only public posts, for generateStaticParams
  postType: PostType
  locale: string
}

interface ListPublishedPostsResult {
  success: boolean
  data?: {
    posts?: PublicPost[]
    count?: number
  }
  error?: string
}

export async function listPublishedPostsAction({
  pageIndex = 0,
  pageSize = 60,
  tagId = null,
  postType = 'blog',
  visibility = 'public',
  locale = DEFAULT_LOCALE,
}: ListPublishedPostsParams): Promise<ListPublishedPostsResult> {
  try {
    const conditions = [eq(postsSchema.status, 'published')]
    conditions.push(eq(postsSchema.visibility, visibility))
    conditions.push(eq(postsSchema.postType, postType))
    if (locale) {
      conditions.push(eq(postsSchema.language, locale))
    }

    const postsSubquery = db
      .$with('posts_with_tags')
      .as(
        db
          .select({
            ...getTableColumns(postsSchema),
            tag_ids: sql<string[]>`array_agg(${postTagsSchema.tagId})`.as('tag_ids'),
            tag_names: sql<string[]>`array_agg(${tagsSchema.name})`.as('tag_names'),
          })
          .from(postsSchema)
          .leftJoin(
            postTagsSchema,
            eq(postsSchema.id, postTagsSchema.postId)
          )
          .leftJoin(tagsSchema, eq(postTagsSchema.tagId, tagsSchema.id))
          .where(and(...conditions))
          .groupBy(postsSchema.id)
      )

    let query = db.with(postsSubquery).select().from(postsSubquery)
    let countQuery = db.with(postsSubquery).select({ value: count() }).from(postsSubquery)

    if (tagId) {
      query.where(sql`${tagId} = ANY(tag_ids)`)
      countQuery.where(sql`${tagId} = ANY(tag_ids)`)
    }

    const paginatedQuery = query
      .orderBy(
        desc(postsSubquery.isPinned),
        desc(postsSubquery.publishedAt),
        desc(postsSubquery.createdAt)
      )
      .limit(pageSize)
      .offset(pageIndex * pageSize)

    const [data, countResult] = await Promise.all([paginatedQuery, countQuery])

    const postsWithProcessedTags = (data || []).map((post) => {
      const tagNames = post.tag_names?.filter(Boolean).join(', ') || null
      const { tag_ids, tag_names, ...restOfPost } = post
      return {
        ...restOfPost,
        tags: tagNames,
      }
    })

    return actionResponse.success({
      posts: postsWithProcessedTags as unknown as PublicPost[],
      count: countResult[0].value,
    })
  } catch (error) {
    console.error('List Published Posts Action Failed:', error)
    const errorMessage = getErrorMessage(error)
    return actionResponse.error(errorMessage)
  }
}

interface GetPublishedPostBySlugParams {
  slug: string
  postType: PostType
  locale?: string
}

interface GetPublishedPostBySlugResult {
  success: boolean
  data?: {
    post?: PublicPostWithContent
  }
  error?: string
  customCode?: string
}

export async function getPublishedPostBySlugAction({
  slug,
  postType = 'blog',
  locale = 'en',
}: GetPublishedPostBySlugParams): Promise<GetPublishedPostBySlugResult> {
  if (!slug) {
    return actionResponse.badRequest('Slug is required.')
  }

  try {
    const conditions = [
      eq(postsSchema.slug, slug),
      eq(postsSchema.language, locale),
      eq(postsSchema.status, 'published'),
      eq(postsSchema.postType, postType)
    ]

    const postData = await db
      .select()
      .from(postsSchema)
      .where(and(...conditions))
      .limit(1)

    if (!postData || postData.length === 0) {
      return actionResponse.notFound('Post not found.')
    }
    const post = postData[0]

    const tagsData = await db
      .select({ name: tagsSchema.name })
      .from(postTagsSchema)
      .innerJoin(tagsSchema, eq(postTagsSchema.tagId, tagsSchema.id))
      .where(eq(postTagsSchema.postId, post.id))

    const tagNames = tagsData.map((t) => t.name).join(', ') || null

    let finalContent = post.content ?? ''
    let restrictionCustomCode: string | undefined = undefined

    if (post.visibility === 'logged_in' || post.visibility === 'subscribers') {
      const session = await getSession()
      const user = session?.user
      if (!user) {
        finalContent = ''
        restrictionCustomCode = 'unauthorized'
      } else {
        const userIsAdmin = await isAdmin()
        if (!userIsAdmin && post.visibility === 'subscribers') {
          // --- TODO: [custom] check user subscription or custom logic --- 
          const isSubscriber = await checkUserSubscription(user.id)
          if (!isSubscriber) {
            finalContent = ''
            restrictionCustomCode = 'notSubscriber'
          }
          // --- End: [custom] check user subscription or custom logic
        }
      }
    }

    const postResultData: PublicPostWithContent = {
      ...post,
      content: finalContent,
      tags: tagNames,
    }

    if (restrictionCustomCode) {
      return actionResponse.success({ post: postResultData }, restrictionCustomCode)
    }

    return actionResponse.success({ post: postResultData })
  } catch (error) {
    console.error(
      `Get Published Post By Slug Action Failed for slug ${slug}, locale ${locale}:`,
      error
    )
    const errorMessage = getErrorMessage(error)
    return actionResponse.error(errorMessage)
  }
}

// --- TODO: [custom] check user subscription or custom logic ---
async function checkUserSubscription(userId: string): Promise<boolean> {
  if (!userId) {
    console.warn('checkUserSubscription called with no userId')
    return false
  }

  try {
    const data = await db
      .select({
        status: subscriptionsSchema.status,
        currentPeriodEnd: subscriptionsSchema.currentPeriodEnd,
      })
      .from(subscriptionsSchema)
      .where(eq(subscriptionsSchema.userId, userId))
      .orderBy(desc(subscriptionsSchema.createdAt))
      .limit(1)

    if (!data || data.length === 0) {
      return false
    }
    const latestSubscription = data[0]

    const isActive =
      latestSubscription.status === 'active' ||
      latestSubscription.status === 'trialing'
    const isWithinPeriod =
      latestSubscription.currentPeriodEnd &&
      new Date(latestSubscription.currentPeriodEnd) > new Date()

    return !!(isActive && isWithinPeriod)

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Exception in checkUserSubscription for user ${userId}:`, errorMessage);
    return false;
  }
}
// --- End: [custom] check user subscription or custom logic

interface GetRelatedPostsParams {
  postId: string
  postType: PostType
  locale: string
  limit?: number
}

interface GetRelatedPostsResult {
  success: boolean
  data?: {
    posts?: PublicPost[]
  }
  error?: string
}

export async function getRelatedPostsAction({
  postId,
  postType,
  locale = DEFAULT_LOCALE,
  limit = 10,
}: GetRelatedPostsParams): Promise<GetRelatedPostsResult> {
  try {
    // Get tags for the current post
    const postTagsData = await db
      .select({ tagId: postTagsSchema.tagId })
      .from(postTagsSchema)
      .where(eq(postTagsSchema.postId, postId))
      .limit(1)

    if (!postTagsData || postTagsData.length === 0) {
      // No tags, return empty array
      return actionResponse.success({ posts: [] })
    }

    const tagId = postTagsData[0].tagId

    // Find other posts with the same tag
    const relatedPostIds = await db
      .select({ postId: postTagsSchema.postId })
      .from(postTagsSchema)
      .where(eq(postTagsSchema.tagId, tagId))

    const postIdsArray = relatedPostIds
      .map((r) => r.postId)
      .filter((id) => id !== postId) // Exclude current post

    if (postIdsArray.length === 0) {
      return actionResponse.success({ posts: [] })
    }

    // Get the related posts with tag names
    const postsSubquery = db
      .$with('posts_with_tags')
      .as(
        db
          .select({
            ...getTableColumns(postsSchema),
            tag_ids: sql<string[]>`array_agg(${postTagsSchema.tagId})`.as('tag_ids'),
            tag_names: sql<string[]>`array_agg(${tagsSchema.name})`.as('tag_names'),
          })
          .from(postsSchema)
          .leftJoin(
            postTagsSchema,
            eq(postsSchema.id, postTagsSchema.postId)
          )
          .leftJoin(tagsSchema, eq(postTagsSchema.tagId, tagsSchema.id))
          .where(
            and(
              inArray(postsSchema.id, postIdsArray),
              eq(postsSchema.status, 'published'),
              eq(postsSchema.postType, postType),
              eq(postsSchema.language, locale),
            )
          )
          .groupBy(postsSchema.id)
      )

    const data = await db
      .with(postsSubquery)
      .select()
      .from(postsSubquery)
      .orderBy(
        desc(postsSubquery.isPinned),
        desc(postsSubquery.publishedAt),
        desc(postsSubquery.createdAt)
      )
      .limit(limit)

    const postsWithProcessedTags = (data || []).map((post) => {
      const tagNames = post.tag_names?.filter(Boolean).join(', ') || null
      const { tag_ids, tag_names, content, ...restOfPost } = post
      return {
        ...restOfPost,
        tags: tagNames,
      }
    })

    return actionResponse.success({
      posts: postsWithProcessedTags as unknown as PublicPost[],
    })
  } catch (error) {
    console.error('Get Related Posts Action Failed:', error)
    const errorMessage = getErrorMessage(error)
    return actionResponse.error(errorMessage)
  }
}