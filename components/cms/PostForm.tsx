"use client";

import { ImageUpload } from "@/components/cms/ImageUpload";
import { TagInput } from "@/components/cms/TagInput";
import { TiptapEditor } from "@/components/tiptap/TiptapEditor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_LOCALE, Locale, LOCALE_NAMES, LOCALES } from "@/i18n/routing";
import { PostType } from "@/lib/db/schema";
import type { PostWithTags } from "@/types/cms";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

export type FormTag = {
  id: string;
  name: string;
};

interface PostFormConfig {
  postType: PostType;
  schema: z.ZodType<any, any, any>;
  imagePath: string;
  enableTags?: boolean;
  labels?: {
    title?: string;
    slug?: string;
    description?: string;
    content?: string;
    pin?: string;
  };
}

interface PostFormProps {
  config: PostFormConfig;
  initialData?: PostWithTags | null;
  isDuplicate?: boolean;
  r2PublicUrl?: string;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

export function PostForm({
  config,
  initialData,
  isDuplicate,
  r2PublicUrl,
  onSubmit,
  isSubmitting,
}: PostFormProps) {
  const router = useRouter();
  const {
    postType,
    schema,
    imagePath,
    enableTags = false,
    labels = {},
  } = config;

  const defaultValues: any = {
    language: initialData?.language || DEFAULT_LOCALE,
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    featuredImageUrl: initialData?.featuredImageUrl || "",
    content: initialData?.content || "",
    isPinned: initialData?.isPinned ?? false,
    status: initialData?.status || "draft",
    visibility: initialData?.visibility || "public",
  };

  if (enableTags) {
    defaultValues.tags =
      initialData?.tags?.map((t) => ({
        id: t.id,
        name: t.name,
      })) || [];
  }

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange" as const,
  });

  const handleFormSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const generateSlug = () => {
    const title = form.getValues("title");
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    form.setValue("slug", slug, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="space-y-4">
          {/* Language Selector */}
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LOCALES.map((locale: Locale) => (
                      <SelectItem key={locale} value={locale}>
                        {LOCALE_NAMES[locale]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter title"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  The title of your {postType} post. (
                  {`${field.value?.length || 0} / 70`})
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Slug */}
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labels.slug || "Slug"}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      placeholder="Enter slug"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateSlug}
                    size="sm"
                    disabled={isSubmitting}
                  >
                    Generate
                  </Button>
                </div>
                <FormDescription>
                  The URL-friendly version of the title.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labels.description || "Description"}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter description"
                    rows={3}
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  A short summary of the {postType} post. (
                  {`${field.value?.length || 0} / 160`})
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tags Input (only if enabled) */}
          {enableTags && (
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      postType={postType}
                    />
                  </FormControl>
                  <FormDescription>
                    Add up to 5 tags to your {postType} post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Featured Image Upload */}
          <FormField
            control={form.control}
            name="featuredImageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Featured Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled={isSubmitting}
                    imagePath={imagePath}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Content */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labels.content || "Content"}</FormLabel>
                <FormControl>
                  <TiptapEditor
                    content={field.value || ""}
                    onChange={field.onChange}
                    placeholder={`Write your post here...`}
                    disabled={isSubmitting}
                    enableR2Selector={true}
                    r2PublicUrl={r2PublicUrl}
                    enableTranslation={true}
                    postType={postType}
                    imageUploadConfig={{
                      maxSize: 10 * 1024 * 1024,
                      filenamePrefix: "content-image",
                      path: imagePath,
                    }}
                  />
                </FormControl>
                <FormDescription>
                  The main content of your post.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Status Selector */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="rounded-lg border p-4">
                  <FormLabel className="text-base">Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visibility Selector */}
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem className="rounded-lg border p-4">
                  <FormLabel className="text-base">Visibility</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="logged_in">Logged In Users</SelectItem>
                      <SelectItem value="subscribers">
                        Subscribers Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Pinned */}
            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-col justify-between rounded-lg border p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-base">Pin Post</FormLabel>
                      <FormControl>
                        <Checkbox
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                    </div>
                    <FormDescription className="text-sm">
                      Pin this post to the top of the list.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 py-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Submitting..."
                : initialData && !isDuplicate
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
