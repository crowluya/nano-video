'use server'

import { postActionSchema } from '@/app/[locale]/(protected)/dashboard/(admin)/blogs/schema'
import { DEFAULT_LOCALE } from '@/i18n/routing'
import { actionResponse } from '@/lib/action-response'
import { getSession, isAdmin } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { posts as postsSchema, postTags as postTagsSchema, subscriptions as subscriptionsSchema, tags as tagsSchema } from '@/lib/db/schema'
import { getErrorMessage } from '@/lib/error-utils'
import { Tag } from '@/types/blog'
import { and, count, desc, eq, getTableColumns, ilike, inArray, or, sql } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type PostListItem = Omit<typeof postsSchema.$inferSelect, 'content'>

export type PostWithTags = typeof postsSchema.$inferSelect & {
  tags: Pick<Tag, 'id' | 'name' | 'createdAt'>[]
}

interface ListPostsParams {
  pageIndex?: number
  pageSize?: number
  status?: 'draft' | 'published' | 'archived'
  filter?: string
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
  locale = 'en',
}: ListPostsParams = {}): Promise<ListPostsResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.')
  }

  try {
    const conditions = []
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
  locale?: string
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
  locale?: string
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
      revalidatePath(`${postData.language === DEFAULT_LOCALE ? '' : '/' + postData.language}/blogs`)
      revalidatePath(`${postData.language === DEFAULT_LOCALE ? '' : '/' + postData.language}/blogs/${postData.slug}`)
    }

    return actionResponse.success({ postId: postId })
  } catch (error) {
    console.error('Create Post Action Failed:', error)
    const errorMessage = getErrorMessage(error)
    if ((error as any)?.cause?.code === '23505') {
      return actionResponse.conflict(
        `Slug '${validatedFields.data.slug}' already exists for language '${validatedFields.data.language}'.`
      )
    }
    return actionResponse.error(errorMessage)
  }
}

interface UpdatePostParams {
  data: PostActionInput
  locale?: string
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
      })
      .from(postsSchema)
      .where(eq(postsSchema.id, postId))
      .limit(1)

    if (!currentPostData || currentPostData.length === 0) {
      return actionResponse.notFound(`Post with ID ${postId} not found.`)
    }
    const currentPost = currentPostData[0]

    await db
      .update(postsSchema)
      .set({
        ...postUpdateData,
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

    revalidatePath(`${currentPost.language === DEFAULT_LOCALE ? '' : '/' + currentPost.language}/blogs`)
    revalidatePath(`${currentPost.language === DEFAULT_LOCALE ? '' : '/' + currentPost.language}/blogs/${currentPost.slug}`)

    if (postUpdateData.status === 'published') {
      revalidatePath(
        `${postUpdateData.language === DEFAULT_LOCALE ? '' : '/' + postUpdateData.language}/blogs/${postUpdateData.slug}`
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
  locale: string
}

export async function deletePostAction({
  postId,
  locale,
}: DeletePostParams): Promise<ActionResult> {
  const t = await getTranslations({ locale, namespace: 'DashboardBlogs.Delete' })

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
      })
      .from(postsSchema)
      .where(eq(postsSchema.id, postId))
      .limit(1)

    if (!postDetailsData || postDetailsData.length === 0) {
      return actionResponse.notFound(t('errorFetching'))
    }
    const postDetails = postDetailsData[0]

    await db.delete(postsSchema).where(eq(postsSchema.id, postId))

    if (postDetails?.slug && postDetails?.language) {
      revalidatePath(`${postDetails?.language === DEFAULT_LOCALE ? '' : '/' + postDetails?.language}/blogs`)
      revalidatePath(`${postDetails?.language === DEFAULT_LOCALE ? '' : '/' + postDetails?.language}/blogs/${postDetails.slug}`)
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
export type PublicPost = Pick<
  typeof postsSchema.$inferSelect,
  | 'id'
  | 'language'
  | 'title'
  | 'slug'
  | 'description'
  | 'featuredImageUrl'
  | 'status'
  | 'visibility'
  | 'isPinned'
  | 'publishedAt'
  | 'createdAt'
> & {
  tags: string | null
}

interface ListPublishedPostsParams {
  pageIndex?: number
  pageSize?: number
  tagId?: string | null
  locale?: string
  visibility?: 'public' // only public posts, for generateStaticParams
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
  locale = 'en',
  visibility,
}: ListPublishedPostsParams = {}): Promise<ListPublishedPostsResult> {
  try {
    const conditions = [eq(postsSchema.status, 'published')]
    if (locale) {
      conditions.push(eq(postsSchema.language, locale))
    }
    if (visibility && visibility === 'public') {
      conditions.push(eq(postsSchema.visibility, 'public'))
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

export type PublicPostWithContent = Pick<
  typeof postsSchema.$inferSelect,
  | 'id'
  | 'language'
  | 'title'
  | 'slug'
  | 'description'
  | 'content'
  | 'featuredImageUrl'
  | 'status'
  | 'visibility'
  | 'isPinned'
  | 'publishedAt'
  | 'createdAt'
> & {
  tags: string | null
}

interface GetPublishedPostBySlugParams {
  slug: string
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
  locale = 'en',
}: GetPublishedPostBySlugParams): Promise<GetPublishedPostBySlugResult> {
  if (!slug) {
    return actionResponse.badRequest('Slug is required.')
  }

  const t = await getTranslations({ locale, namespace: 'Blogs' })

  try {
    const postData = await db
      .select()
      .from(postsSchema)
      .where(
        and(
          eq(postsSchema.slug, slug),
          eq(postsSchema.language, locale),
          eq(postsSchema.status, 'published')
        )
      )
      .limit(1)

    if (!postData || postData.length === 0) {
      return actionResponse.notFound(t('BlogDetail.notFound'))
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
