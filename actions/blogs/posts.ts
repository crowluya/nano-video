"use server";

import { postActionSchema } from "@/app/[locale]/(protected)/dashboard/(admin)/blogs/schema";
import { actionResponse } from "@/lib/action-response";
import { getErrorMessage } from "@/lib/error-utils";
import { isAdmin } from "@/lib/supabase/isAdmin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Tag } from "./tags";

export type PostWithTags = Database['public']['Tables']['posts']['Row'] & {
  tags: Pick<Tag, 'id' | 'name' | 'created_at'>[];
};

interface ListPostsParams {
  pageIndex?: number;
  pageSize?: number;
  status?: Database["public"]["Enums"]["post_status"];
  filter?: string;
  language?: string;
  locale?: string;
}

interface ListPostsResult {
  success: boolean;
  data?: {
    posts?: PostWithTags[];
    count?: number;
  };
  error?: string;
}

export async function listPostsAction({
  pageIndex = 0,
  pageSize = 20,
  status,
  language,
  filter = "",
  locale = 'en'
}: ListPostsParams = {}): Promise<ListPostsResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden('Admin privileges required.');
  }

  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    let query = supabaseAdmin
      .from("posts")
      .select(`
        id, language, title, slug, description, featured_image_url, is_pinned, status, visibility, published_at, created_at, updated_at,
        tags (*)
      `, { count: 'exact' });

    if (filter) {
      const filterValue = `%${filter}%`;
      query = query.or(
        `title.ilike.${filterValue},slug.ilike.${filterValue},description.ilike.${filterValue}`
      );
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (language) {
      query = query.eq('language', language);
    }

    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;

    query = query
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const postsWithTags = (data || []).map(post => ({
      ...post,
      tags: post.tags || []
    })) as PostWithTags[];

    return actionResponse.success({ posts: postsWithTags, count: count ?? 0 });

  } catch (error) {
    console.error("List Posts Action Failed:", error);
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes('permission denied')) {
      return actionResponse.forbidden("Permission denied to list posts.");
    }
    return actionResponse.error(errorMessage);
  }
}

interface GetPostByIdParams {
  postId: string;
  locale?: string;
}

interface GetPostResult {
  success: boolean;
  data?: {
    post?: PostWithTags;
  }
  error?: string;
}

export async function getPostByIdAction({ postId }: GetPostByIdParams): Promise<GetPostResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  if (!postId || !z.string().uuid().safeParse(postId).success) {
    return actionResponse.badRequest("Invalid Post ID provided.");
  }

  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select(`
          *,
          tags (*)
      `)
      .eq('id', postId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return actionResponse.notFound("Post not found.");

    const postWithTags = data as PostWithTags;

    postWithTags.tags = postWithTags.tags || [];

    return actionResponse.success({ post: postWithTags });

  } catch (error) {
    console.error(`Get Post By ID Action Failed for ${postId}:`, error);
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes('permission denied')) {
      return actionResponse.forbidden("Permission denied to view this post.");
    }
    return actionResponse.error(errorMessage);
  }
}

type PostActionInput = z.infer<typeof postActionSchema>;

interface CreatePostParams {
  data: PostActionInput;
  locale?: string;
}
interface ActionResult {
  success: boolean;
  data?: {
    postId?: string;
  };
  error?: string;
}

export async function createPostAction({ data }: CreatePostParams): Promise<ActionResult> {
  const validatedFields = postActionSchema.safeParse(data);
  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
    return actionResponse.badRequest("Invalid input data.");
  }

  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return actionResponse.unauthorized();
  }
  const authorId = user.id;

  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { tags: inputTags, ...postData } = validatedFields.data;
  const finalFeaturedImageUrl = postData.featured_image_url === "" ? null : postData.featured_image_url;

  try {
    const { data: newPost, error: postInsertError } = await supabaseAdmin
      .from("posts")
      .insert({
        ...postData,
        author_id: authorId,
        featured_image_url: finalFeaturedImageUrl,
        content: postData.content || null,
        description: postData.description || null,
        is_pinned: postData.is_pinned || false,
      })
      .select("id")
      .single();

    if (postInsertError) throw postInsertError;
    if (!newPost || !newPost.id) throw new Error("Failed to create post: No ID returned.");

    const postId = newPost.id;

    if (inputTags && inputTags.length > 0) {
      const tagAssociations = inputTags.map((tag) => ({
        post_id: postId,
        tag_id: tag.id,
      }));

      const { error: tagInsertError } = await supabaseAdmin
        .from("post_tags")
        .insert(tagAssociations);

      if (tagInsertError) {
        console.error(`Failed to associate tags for post ${postId}:`, tagInsertError);
      }
    }

    revalidatePath(`/${postData.language}/blogs`, "page");
    revalidatePath(`/${postData.language}/dashboard/blogs`, "page");
    if (postData.status === 'published') {
      revalidatePath(`/${postData.language}/blogs/${postData.slug}`, "page");
    }

    return actionResponse.success({ postId: postId });

  } catch (error) {
    console.error("Create Post Action Failed:", error);
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes('duplicate key value violates unique constraint "posts_language_slug_unique"')) {
      return actionResponse.conflict(`Slug '${validatedFields.data.slug}' already exists for language '${validatedFields.data.language}'.`);
    }
    return actionResponse.error(errorMessage);
  }
}

interface UpdatePostParams {
  data: PostActionInput;
  locale?: string;
}

export async function updatePostAction({ data }: UpdatePostParams): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  const validatedFields = postActionSchema.extend({
    id: z.string().uuid({ message: "Valid Post ID is required for update." }),
  }).safeParse(data);

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten().fieldErrors);
    return actionResponse.badRequest("Invalid input data for update.");
  }

  const { id: postId, tags: inputTags, ...postUpdateData } = validatedFields.data;

  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const finalFeaturedImageUrl = postUpdateData.featured_image_url === "" ? null : postUpdateData.featured_image_url;

  try {
    const { data: currentPost, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('slug, language, status')
      .eq('id', postId)
      .single();

    if (fetchError) {
      console.error(`Error fetching post details for update ${postId}:`, fetchError);
      return actionResponse.notFound("Failed to fetch existing post details for update.");
    }
    if (!currentPost) {
      return actionResponse.notFound(`Post with ID ${postId} not found.`);
    }

    const { error: postUpdateError } = await supabaseAdmin
      .from("posts")
      .update({
        ...postUpdateData,
        featured_image_url: finalFeaturedImageUrl,
        content: postUpdateData.content || null,
        description: postUpdateData.description || null,
        is_pinned: postUpdateData.is_pinned || false,
      })
      .eq("id", postId);

    if (postUpdateError) throw postUpdateError;

    const { error: deleteTagsError } = await supabaseAdmin
      .from('post_tags')
      .delete()
      .eq('post_id', postId);

    if (deleteTagsError) {
      console.error(`Failed to clear old tags for post ${postId}:`, deleteTagsError);
    }

    if (inputTags && inputTags.length > 0) {
      const newTagAssociations = inputTags.map((tag) => ({
        post_id: postId,
        tag_id: tag.id,
      }));

      const { error: insertTagsError } = await supabaseAdmin
        .from("post_tags")
        .insert(newTagAssociations);

      if (insertTagsError) {
        console.error(`Failed to insert new tags for post ${postId}:`, insertTagsError);
      }
    }


    revalidatePath(`/${currentPost.language}/blogs`, "page");
    revalidatePath(`/${currentPost.language}/dashboard/blogs`, "page");

    if (currentPost.slug && currentPost.language &&
      (currentPost.slug !== postUpdateData.slug || currentPost.language !== postUpdateData.language || currentPost.status !== postUpdateData.status)) {
      revalidatePath(`/${currentPost.language}/blogs/${currentPost.slug}`, "page");
    }

    if (postUpdateData.status === 'published') {
      revalidatePath(`/${postUpdateData.language}/blogs/${postUpdateData.slug}`, "page");
    }

    return actionResponse.success({ postId: postId });

  } catch (error) {
    console.error("Update Post Action Failed:", error);
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes('duplicate key value violates unique constraint "posts_language_slug_unique"')) {
      return actionResponse.conflict(`Slug '${validatedFields.data.slug}' already exists for language '${validatedFields.data.language}'.`);
    }
    return actionResponse.error(errorMessage);
  }
}

interface DeletePostParams {
  postId: string;
  locale: string;
}

export async function deletePostAction({ postId, locale }: DeletePostParams): Promise<ActionResult> {

  const t = await getTranslations({ locale, namespace: 'DashboardBlogs.Delete' });

  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }

  if (!postId || !z.string().uuid().safeParse(postId).success) {
    return actionResponse.badRequest("Invalid Post ID provided.");
  }

  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: postDetails, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('slug, language')
      .eq('id', postId)
      .maybeSingle();

    if (fetchError) {
      console.error(`Error fetching post details before delete ${postId}:`, fetchError);
      return actionResponse.notFound(t("errorFetching"));
    }

    const { error: deleteError } = await supabaseAdmin
      .from("posts")
      .delete()
      .eq("id", postId);

    if (deleteError) throw deleteError;

    if (postDetails?.slug && postDetails?.language) {
      revalidatePath(`/${postDetails?.language}/blogs`, "page");
      revalidatePath(`/${postDetails?.language}/dashboard/blogs`, "page");
      revalidatePath(`/${postDetails.language}/blogs/${postDetails.slug}`, "page");
    }

    return actionResponse.success({ postId: postId });

  } catch (error) {
    console.error(`Delete Post Action Failed for ${postId}:`, error);
    const errorMessage = getErrorMessage(error);
    if (errorMessage.includes('permission denied')) {
      return actionResponse.forbidden("Permission denied to delete this post.");
    }
    return actionResponse.error(errorMessage);
  }
}

/**
 * User-side functionality
 */
export type PublicPost = Pick<
  Database['public']['Tables']['posts']['Row'],
  | 'id'
  | 'language'
  | 'title'
  | 'slug'
  | 'description'
  | 'featured_image_url'
  | 'status'
  | 'visibility'
  | 'is_pinned'
  | 'published_at'
  | 'created_at'
> & {
  tags: string | null;
};

interface ListPublishedPostsParams {
  pageIndex?: number;
  pageSize?: number;
  tagId?: string | null;
  locale?: string;
  visibility?: 'public'; // only public posts, for generateStaticParams
}

interface ListPublishedPostsResult {
  success: boolean;
  data?: {
    posts?: PublicPost[];
    count?: number;
  };
  error?: string;
}

export async function listPublishedPostsAction({
  pageIndex = 0,
  pageSize = 60,
  tagId = null,
  locale = 'en',
  visibility,
}: ListPublishedPostsParams = {}): Promise<ListPublishedPostsResult> {
  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const tagsSelectPart = tagId ? "tags!inner (id, name)" : "tags (id, name)";
    const selectQuery = `
        id, language, title, slug, description, featured_image_url, is_pinned, status, visibility, published_at, created_at,
        ${tagsSelectPart}
    `;

    let query = supabaseAdmin
      .from("posts")
      .select(selectQuery, { count: 'exact' })
      .eq('status', 'published');

    if (locale) {
      query = query.eq('language', locale);
    }

    if (tagId) {
      query = query.eq('tags.id', tagId);
    }

    if (visibility && visibility === 'public') {
      query = query.eq('visibility', 'public');
    }

    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;

    query = query
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    const postsWithProcessedTags = (data || []).map((post) => {
      const { tags, ...restOfPost } = post as unknown as PostWithTags;
      const tagNames = (tags && Array.isArray(tags) && tags.length > 0)
        ? tags.map(t => t.name).join(', ')
        : null;
      return {
        ...restOfPost,
        tags: tagNames
      };
    }) as PublicPost[];

    return actionResponse.success({ posts: postsWithProcessedTags, count: count ?? 0 });

  } catch (error) {
    console.error("List Published Posts Action Failed:", error);
    const errorMessage = getErrorMessage(error);
    return actionResponse.error(errorMessage);
  }
}

export type PublicPostWithContent = Pick<
  Database['public']['Tables']['posts']['Row'],
  | 'id'
  | 'language'
  | 'title'
  | 'slug'
  | 'description'
  | 'content'
  | 'featured_image_url'
  | 'status'
  | 'visibility'
  | 'is_pinned'
  | 'published_at'
  | 'created_at'
> & {
  tags: string | null;
};


interface GetPublishedPostBySlugParams {
  slug: string;
  locale?: string;
}

interface GetPublishedPostBySlugResult {
  success: boolean;
  data?: {
    post?: PublicPostWithContent;
  }
  error?: string;
  customCode?: string
}


export async function getPublishedPostBySlugAction({
  slug,
  locale = 'en'
}: GetPublishedPostBySlugParams): Promise<GetPublishedPostBySlugResult> {
  if (!slug) {
    return actionResponse.badRequest("Slug is required.");
  }

  const t = await getTranslations({ locale, namespace: 'Blogs' });

  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select(`
        id, language, title, slug, description, content, featured_image_url, is_pinned, status, visibility, published_at, created_at,
        tags (id, name)
      `)
      .eq('slug', slug)
      .eq('language', locale)
      .eq('status', 'published')
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!post) return actionResponse.notFound(t("BlogDetail.notFound"));

    const { tags, ...restOfPostBase } = post;
    const tagNames = (tags && Array.isArray(tags) && tags.length > 0)
      ? tags.map(tag => tag.name).join(', ')
      : null;

    let finalContent = restOfPostBase.content ?? '';
    let restrictionCustomCode: string | undefined = undefined;

    if (post.visibility === 'logged_in' || post.visibility === 'subscribers') {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        finalContent = "";
        restrictionCustomCode = 'unauthorized';
      } else {
        const userIsAdmin = await isAdmin();
        if (!userIsAdmin && post.visibility === 'subscribers') {
          // --- TODO: [custom] check user subscription or custom logic --- 
          const isSubscriber = await checkUserSubscription(user.id);
          if (!isSubscriber) {
            finalContent = "";
            restrictionCustomCode = 'notSubscriber';
          }
          // --- End: [custom] check user subscription or custom logic
        }
      }
    }

    const postResultData: PublicPostWithContent = {
      ...restOfPostBase,
      content: finalContent,
      tags: tagNames
    };

    if (restrictionCustomCode) {
      return actionResponse.success({ post: postResultData }, restrictionCustomCode);
    }

    return actionResponse.success({ post: postResultData });

  } catch (error) {
    console.error(`Get Published Post By Slug Action Failed for slug ${slug}, locale ${locale}:`, error);
    const errorMessage = getErrorMessage(error);
    return actionResponse.error(errorMessage);
  }
}

// --- TODO: [custom] check user subscription or custom logic ---
async function checkUserSubscription(userId: string): Promise<boolean> {
  if (!userId) {
    console.warn("checkUserSubscription called with no userId");
    return false;
  }

  const supabaseAdmin = createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: latestSubscription, error: queryError } = await supabaseAdmin
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      console.error(`Error fetching user subscription status for ${userId}:`, queryError.message);
      return false;
    }

    if (!latestSubscription) {
      return false;
    }

    const isActive = latestSubscription.status === 'active' || latestSubscription.status === 'trialing';
    const isWithinPeriod = latestSubscription.current_period_end && new Date(latestSubscription.current_period_end) > new Date();

    return !!(isActive && isWithinPeriod);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Exception in checkUserSubscription for user ${userId}:`, errorMessage);
    return false;
  }
}
// --- End: [custom] check user subscription or custom logic
