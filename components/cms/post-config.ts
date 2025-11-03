import {
  BLOGS_IMAGE_PATH,
} from "@/config/common";
import { PostType } from "@/lib/db/schema";
import { z } from "zod";

export const tagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const basePostSchema = z.object({
  language: z.string().min(1, { message: "Language is required" }),
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters." }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters." }),
  content: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(tagSchema).optional(),
  featuredImageUrl: z
    .string()
    .url({ message: "Featured image must be a valid URL if provided." })
    .optional()
    .or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  visibility: z.enum(["public", "logged_in", "subscribers"]),
  isPinned: z.boolean().optional(),
});

export const postActionSchema = basePostSchema.extend({
  id: z.string().uuid().optional(),
});

export interface PostConfig {
  postType: PostType;
  schema: z.ZodSchema;
  actionSchema: z.ZodSchema;
  imagePath: string;
  enableTags: boolean;
  labels: {
    singular: string;
    plural: string;
  };
  routes: {
    list: string;
    create: string;
    edit: (id: string) => string;
  };
}

export const POST_CONFIGS: Record<PostType, PostConfig> = {
  blog: {
    postType: "blog",
    schema: basePostSchema,
    actionSchema: postActionSchema,
    imagePath: BLOGS_IMAGE_PATH,
    enableTags: true,
    labels: {
      singular: "Blog",
      plural: "Blogs",
    },
    routes: {
      list: "/dashboard/blogs",
      create: "/dashboard/blogs/new",
      edit: (id: string) => `/dashboard/blogs/${id}`,
    },
  },
  guide: {
    postType: "blog",
    schema: basePostSchema,
    actionSchema: postActionSchema,
    imagePath: BLOGS_IMAGE_PATH,
    enableTags: true,
    labels: {
      singular: "Blog",
      plural: "Blogs",
    },
    routes: {
      list: "/dashboard/blogs",
      create: "/dashboard/blogs/new",
      edit: (id: string) => `/dashboard/blogs/${id}`,
    },
  },
};

// Helper function to get config by content type
export function getPostConfig(postType: PostType): PostConfig {
  return POST_CONFIGS[postType];
}

