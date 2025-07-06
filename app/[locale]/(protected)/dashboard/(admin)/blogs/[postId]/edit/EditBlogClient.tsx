"use client";

import {
  getPostByIdAction,
  updatePostAction,
  type PostWithTags,
} from "@/actions/blogs/posts";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { PostForm, type PostFormValues } from "../../PostForm";

export default function EditBlogClient() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("DashboardBlogs.Edit");
  const tCommon = useTranslations("Dashboard.Common");

  const params = useParams();
  const { postId } = params;

  const [post, setPost] = useState<PostWithTags | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    const fetchPost = async () => {
      if (typeof postId !== "string") {
        toast.error(t("errorInvalidId"));
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const result = await getPostByIdAction({ postId });
        if (result.success && result.data?.post) {
          setPost(result.data.post);
        } else {
          toast.error(t("errorFetchFailed"), { description: result.error });
          setPost(null);
        }
      } catch (error) {
        toast.error(t("errorFetchUnexpected"));
        console.error("Failed to fetch post:", error);
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId, t, locale, router]);

  const handleUpdatePost = async (data: PostFormValues) => {
    if (!post?.id) return;

    const updateData = {
      ...data,
      id: post.id,
    };

    const result = await updatePostAction({
      data: updateData,
    });

    if (result.success) {
      toast.success(t("submitSuccess"));
      router.push(`/dashboard/blogs`);
      router.refresh();
    } else {
      toast.error(t("submitErrorTitle"), {
        description: result.error || t("submitErrorDesc"),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-6 p-4 md:p-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {t("postNotFoundTitle")}
        </h2>
        <p className="text-muted-foreground">{t("postNotFoundDesc")}</p>
        <Button onClick={() => router.push(`/dashboard/blogs`)}>
          {tCommon("backToList")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground">{t("pageDescription")}</p>
      </div>
      <PostForm
        initialData={post}
        onSubmit={async (data) =>
          startTransition(() => {
            handleUpdatePost(data);
          })
        }
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
