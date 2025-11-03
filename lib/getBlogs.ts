import { getPublishedPostBySlugAction } from '@/actions/blogs/posts';
import { DEFAULT_LOCALE } from '@/i18n/routing';
import { PostBase, PublicPostWithContent } from '@/types/cms';
import dayjs from 'dayjs';
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

const POSTS_BATCH_SIZE = 10;

export async function getPosts(locale: string = DEFAULT_LOCALE): Promise<{ posts: PostBase[] }> {
  const postsDirectory = path.join(process.cwd(), 'blogs', locale);

  // is directory exist
  if (!fs.existsSync(postsDirectory)) {
    return { posts: [] };
  }

  let filenames = await fs.promises.readdir(postsDirectory);
  filenames = filenames.reverse();

  let allPosts: PostBase[] = [];

  // read file by batch
  for (let i = 0; i < filenames.length; i += POSTS_BATCH_SIZE) {
    const batchFilenames = filenames.slice(i, i + POSTS_BATCH_SIZE);

    const batchPosts: PostBase[] = await Promise.all(
      batchFilenames.map(async (filename) => {
        const fullPath = path.join(postsDirectory, filename);
        const fileContents = await fs.promises.readFile(fullPath, 'utf8');

        const { data, content } = matter(fileContents);

        return {
          locale, // use locale parameter
          title: data.title,
          description: data.description,
          featuredImageUrl: data.featuredImageUrl || '',
          slug: data.slug,
          tags: data.tags,
          publishedAt: data.publishedAt,
          status: data.status || 'published',
          isPinned: data.isPinned || false,
          content,
          metadata: data,
        };
      })
    );

    allPosts.push(...batchPosts);
  }

  // filter out non-published articles
  allPosts = allPosts.filter(post => post.status === 'published');

  // sort posts by isPinned and publishedAt
  allPosts = allPosts.sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0);
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return {
    posts: allPosts,
  };
}

function mapServerPostToBlogPost(serverPost: PublicPostWithContent, locale: string): PostBase {
  return {
    locale: locale,
    id: serverPost.id || undefined,
    title: serverPost.title,
    description: serverPost.description ?? "",
    featuredImageUrl: serverPost.featuredImageUrl ?? "",
    slug: serverPost.slug,
    tags: serverPost.tags ?? "",
    publishedAt:
      (serverPost.publishedAt && dayjs(serverPost.publishedAt).toDate()) || new Date(serverPost.createdAt),
    status: serverPost.status ?? "published",
    isPinned: serverPost.isPinned ?? false,
    content: serverPost.content ?? '',
    visibility: serverPost.visibility,
  };
}

export async function getPostBySlug(
  slug: string,
  locale: string = DEFAULT_LOCALE
): Promise<{ post: PostBase | null; error?: string; errorCode?: string }> {
  const postsDirectory = path.join(process.cwd(), 'blogs', locale);
  if (fs.existsSync(postsDirectory)) {
    const filenames = await fs.promises.readdir(postsDirectory);
    for (const filename of filenames) {
      const fullPath = path.join(postsDirectory, filename);
      try {
        const fileContents = await fs.promises.readFile(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        const localSlug = (data.slug || '').replace(/^\//, '').replace(/\/$/, '');
        const targetSlug = slug.replace(/^\//, '').replace(/\/$/, '');

        if (localSlug === targetSlug && data.status !== 'draft') {
          return {
            post: {
              locale,
              id: data.id || undefined,
              title: data.title,
              description: data.description || '',
              featuredImageUrl: data.featuredImageUrl || '',
              slug: data.slug,
              tags: data.tags || '',
              publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
              status: data.status || 'published',
              visibility: data.visibility || 'public',
              isPinned: data.isPinned || false,
              content,
              metadata: data,
            },
            error: undefined,
            errorCode: undefined,
          };
        }
      } catch (error) {
        console.error(`Error processing local file ${filename}:`, error);
      }
    }
  }

  const serverResult = await getPublishedPostBySlugAction({ slug, locale, postType: 'blog' });

  if (serverResult.success && serverResult.data?.post) {
    return {
      post: mapServerPostToBlogPost(serverResult.data.post, locale),
      error: undefined,
      errorCode: serverResult.customCode,
    };
  } else if (!serverResult.success) {
    return { post: null, error: serverResult.error, errorCode: serverResult.customCode };
  } else {
    return { post: null, error: "Post not found (unexpected server response).", errorCode: undefined };
  }
}