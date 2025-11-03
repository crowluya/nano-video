import { posts as postsSchema, tags as tagsSchema } from '@/lib/db/schema'

export type Tag = typeof tagsSchema.$inferSelect

export type Post = typeof postsSchema.$inferSelect

export type PostBase = {
  id?: string
  locale: string
  title: string
  description?: string
  featuredImageUrl?: string
  slug: string
  tags?: string
  publishedAt: Date
  status?: 'draft' | 'published' | 'archived'
  visibility?: 'public' | 'logged_in' | 'subscribers'
  isPinned?: boolean
  content: string
  metadata?: {
    [key: string]: any
  }
}

export type PostWithTags = typeof postsSchema.$inferSelect & {
  tags: Pick<Tag, 'id' | 'name' | 'createdAt'>[]
}

export type PublicPost = Pick<
  typeof postsSchema.$inferSelect,
  | 'id'
  | 'language'
  | 'postType'
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

export type PublicPostWithContent = Pick<
  typeof postsSchema.$inferSelect,
  | 'id'
  | 'language'
  | 'postType'
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