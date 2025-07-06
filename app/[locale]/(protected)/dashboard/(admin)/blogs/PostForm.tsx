"use client";

import { type PostWithTags } from "@/actions/blogs/posts";
import { generateAdminPresignedUploadUrl } from "@/actions/r2-resources";
import { basePostSchema } from "@/app/[locale]/(protected)/dashboard/(admin)/blogs/schema";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BLOGS_IMAGE_PATH } from "@/config/common";
import {
  DEFAULT_LOCALE,
  Locale,
  LOCALE_NAMES,
  LOCALES,
  useRouter,
} from "@/i18n/routing";
import { getErrorMessage } from "@/lib/error-utils";
import { useCompletion } from "@ai-sdk/react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  InsertImage,
  InsertTable,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  MDXEditorMethods,
  quotePlugin,
  Separator,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { Info, LanguagesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ImageUpload } from "./ImageUpload";
import { TagInput } from "./TagInput";

interface ContentToolbarProps {
  onTranslate: (targetLanguage: Locale) => Promise<void>;
  isTranslating: boolean;
  currentFormLanguage: Locale;
}

function ContentToolbar({
  onTranslate,
  isTranslating,
  currentFormLanguage,
}: ContentToolbarProps) {
  const t = useTranslations("DashboardBlogs.Form.toolbar");

  const showTooltip =
    !process.env.NEXT_PUBLIC_AI_MODEL_ID ||
    !process.env.NEXT_PUBLIC_AI_PROVIDER;

  return (
    <>
      <DiffSourceToggleWrapper>
        <BoldItalicUnderlineToggles />
        <Separator />
        <ListsToggle />
        <Separator />
        <BlockTypeSelect />
        <Separator />
        <CreateLink />
        <InsertImage />
        <Separator />
        <InsertTable />
        <Separator />
      </DiffSourceToggleWrapper>
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              title={t("translateActionTitle")}
              disabled={
                isTranslating ||
                !process.env.NEXT_PUBLIC_AI_MODEL_ID ||
                !process.env.NEXT_PUBLIC_AI_PROVIDER
              }
              className="w-8 h-8 p-0"
            >
              <LanguagesIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {LOCALES.length > 0 ? (
              LOCALES.map((locale) => (
                <DropdownMenuItem
                  key={locale}
                  disabled={isTranslating}
                  onSelect={() => onTranslate(locale)}
                >
                  {t("translateTo", {
                    languageName: LOCALE_NAMES[locale] || locale,
                  })}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                {t("noTranslationOptions")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {(!process.env.NEXT_PUBLIC_AI_MODEL_ID ||
          !process.env.NEXT_PUBLIC_AI_PROVIDER) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("translateByAIDescription")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </>
  );
}

export type FormTag = {
  id: string;
  name: string;
};
export type PostFormValues = z.infer<typeof postFormSchema>;

const postFormSchema = basePostSchema;

interface PostFormProps {
  initialData?: PostWithTags | null;
  isDuplicate?: boolean;
  onSubmit: (data: PostFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function PostForm({
  initialData,
  isDuplicate,
  onSubmit,
  isSubmitting,
}: PostFormProps) {
  const t = useTranslations("DashboardBlogs.Form");
  const router = useRouter();

  const defaultValues: Partial<PostFormValues> = {
    language: initialData?.language || DEFAULT_LOCALE,
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    featured_image_url: initialData?.featured_image_url || "",
    content: initialData?.content || "",
    tags:
      initialData?.tags?.map((t) => ({
        id: t.id,
        name: t.name,
      })) || [],
    is_pinned: initialData?.is_pinned ?? false,
    status: initialData?.status || "draft",
    visibility: initialData?.visibility || "public",
  };

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues,
    mode: "onChange",
  });
  const mdxEditorRef = useRef<MDXEditorMethods>(null);

  const currentFormLanguage = form.watch("language") as Locale;

  const {
    completion,
    isLoading: isTranslating,
    complete,
    error: translationError,
  } = useCompletion({
    api: "/api/admin/translate",
    experimental_throttle: 300,
    body: {
      modelId: process.env.NEXT_PUBLIC_AI_MODEL_ID || "",
      provider: process.env.NEXT_PUBLIC_AI_PROVIDER || "",
    },
    onResponse: (response) => {
      form.setValue("content", completion, { shouldValidate: true });
    },
    onFinish: (prompt: string, completion: string) => {
      form.setValue("content", completion, { shouldValidate: true });
    },
    onError: (error: any) => {
      let errorMessage: string;
      try {
        const parsedError = JSON.parse(error.message);
        errorMessage = parsedError.error || t("translate.error");
      } catch {
        errorMessage = error.message || t("translate.error");
      }
      toast.error(errorMessage);
    },
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

  const handleTranslate = async (targetLang: Locale) => {
    const currentContent = form.getValues("content");

    if (!currentContent || currentContent.trim() === "") {
      toast.info(t("translate.infoEmpty"));
      return;
    }

    form.setValue("content", "", { shouldValidate: true });

    const targetLangName = LOCALE_NAMES[targetLang] || targetLang;
    const prompt = `Translate the following blog post content to ${targetLangName}. Ensure the translation is natural, maintains the original meaning and tone, SEO friendly, and is suitable for a blog post. Only return the translated text itself, without any additional commentary or explanations before or after the translated content. Preserve markdown formatting if present.\n\nOriginal content:\n${currentContent}`;

    await complete(prompt);
  };

  const handleImageUpload = async (imageFile: File): Promise<string> => {
    if (!imageFile.type.startsWith("image/")) {
      toast.error(t("upload.uploadError"), {
        description: t("upload.uploadErrorDesc"),
      });
      return "";
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      toast.error(t("upload.uploadError"), {
        description: t("upload.fileSizeExceeded", {
          maxSizeInMB: maxSize / 1024 / 1024,
        }),
      });
      return "";
    }

    try {
      const filenamePrefix = "post-image";

      const presignedUrlActionResponse = await generateAdminPresignedUploadUrl({
        fileName: imageFile.name,
        contentType: imageFile.type,
        prefix: filenamePrefix,
        path: BLOGS_IMAGE_PATH,
      });

      if (
        !presignedUrlActionResponse.success ||
        !presignedUrlActionResponse.data
      ) {
        toast.error(t("upload.uploadError"), {
          description:
            presignedUrlActionResponse.error || t("upload.presignedUrlError"),
        });
        return "";
      }

      const { presignedUrl, publicObjectUrl } = presignedUrlActionResponse.data;

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: imageFile,
        headers: {
          "Content-Type": imageFile.type,
        },
      });

      if (!uploadResponse.ok) {
        let r2Error = "";
        try {
          r2Error = await uploadResponse.text();
        } catch {}
        console.error("R2 Upload Error (MDX):", r2Error, uploadResponse);
        throw new Error(r2Error);
      }
      return publicObjectUrl;
    } catch (error) {
      console.error("MDX Image Upload failed:", error);
      toast.error(getErrorMessage(error) || t("upload.uploadErrorUnexpected"));
      throw error;
    }
  };

  useEffect(() => {
    if (completion) {
      form.setValue("content", completion, {
        shouldValidate: false,
        shouldDirty: true,
      });
      mdxEditorRef.current?.setMarkdown(completion);
    }
  }, [completion]);

  const customToolbarInstance = useMemo(
    () => (
      <ContentToolbar
        onTranslate={handleTranslate}
        isTranslating={isTranslating}
        currentFormLanguage={currentFormLanguage || defaultValues.language!}
      />
    ),
    [
      handleTranslate,
      isTranslating,
      currentFormLanguage,
      defaultValues.language,
    ]
  );
  const toolbarContentFunc = useMemo(
    () => () => customToolbarInstance,
    [customToolbarInstance]
  );

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="md:col-span-2 space-y-8">
            {/* Language Selector */}
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.language.label")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("fields.language.placeholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LOCALES.map((cur: Locale) => (
                        <SelectItem key={cur} value={cur}>
                          {LOCALE_NAMES[cur]}
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
                  <FormLabel>{t("fields.title.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("fields.title.placeholder")}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("fields.title.description")} (
                    {`${field.value?.length || 0} / ${t(
                      "fields.title.recommendedLength"
                    )}`}
                    )
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
                  <FormLabel>{t("fields.slug.label")}</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder={t("fields.slug.placeholder")}
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
                      {t("fields.slug.generateButton")}
                    </Button>
                  </div>
                  <FormDescription>
                    {t("fields.slug.description")}
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
                  <FormLabel>{t("fields.description.label")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("fields.description.placeholder")}
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("fields.description.description")} (
                    {`${field.value?.length || 0} / ${t(
                      "fields.description.recommendedLength"
                    )}`}
                    )
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Tags Input */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.tags.label")}</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("fields.tags.description")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Featured Image Upload */}
            <FormField
              control={form.control}
              name="featured_image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.featuredImageUrl.label")}</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("fields.featuredImageUrl.description")}
                  </FormDescription>
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
                  <FormLabel>{t("fields.content.label")}</FormLabel>
                  <FormControl>
                    <MDXEditor
                      ref={mdxEditorRef}
                      className="border rounded-md"
                      markdown={field.value || ""}
                      onChange={(md) => field.onChange(md)}
                      contentEditableClassName="max-w-full min-h-[400px] max-h-[600px] overflow-y-auto prose"
                      plugins={[
                        listsPlugin(),
                        quotePlugin(),
                        headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
                        linkPlugin(),
                        linkDialogPlugin(),
                        thematicBreakPlugin(),
                        frontmatterPlugin(),
                        codeBlockPlugin(),
                        imagePlugin({ imageUploadHandler: handleImageUpload }),
                        tablePlugin(),
                        markdownShortcutPlugin(),
                        diffSourcePlugin({
                          viewMode: "source",
                        }),
                        toolbarPlugin({
                          toolbarContents: toolbarContentFunc,
                        }),
                      ]}
                      placeholder={t("fields.content.placeholder")}
                      readOnly={isSubmitting || isTranslating}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("fields.content.description")}
                    {isTranslating && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({t("translate.loading")})
                      </span>
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Status Selector */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.status.label")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("fields.status.placeholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">
                        {t("fields.status.options.draft")}
                      </SelectItem>
                      <SelectItem value="published">
                        {t("fields.status.options.published")}
                      </SelectItem>
                      <SelectItem value="archived">
                        {t("fields.status.options.archived")}
                      </SelectItem>
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
                <FormItem>
                  <FormLabel>{t("fields.visibility.label")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("fields.visibility.placeholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">
                        {t("fields.visibility.options.public")}
                      </SelectItem>
                      <SelectItem value="logged_in">
                        {t("fields.visibility.options.loggedIn")}
                      </SelectItem>
                      <SelectItem value="subscribers">
                        {t("fields.visibility.options.subscribers")}
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
              name="is_pinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {t("fields.isPinned.label")}
                    </FormLabel>
                    <FormDescription>
                      {t("fields.isPinned.description")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                {t("cancelButton")}
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("submittingButton")
                  : initialData && !isDuplicate
                  ? t("updateButton")
                  : t("createButton")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
