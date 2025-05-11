import { z } from "zod";

export const tagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const basePostSchema = z.object({
  language: z.string().min(1, { message: "Language is required" }),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  slug: z.string().min(3, { message: "Slug must be at least 3 characters." }),
  content: z.string().optional(),
  description: z.string().optional(),
  featured_image_url: z.string().url({ message: "Featured image must be a valid URL if provided." }).optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  visibility: z.enum(["public", "logged_in", "subscribers"]),
  tags: z.array(tagSchema).optional(),
  is_pinned: z.boolean().optional(),
});

export const postActionSchema = basePostSchema.extend({
  id: z.string().uuid().optional(),
});