"use client";

import {
  createPostAction,
  getPostByIdAction,
  updatePostAction,
} from "@/actions/posts/posts";
import { PostForm } from "@/components/cms/PostForm";
import { getPostConfig } from "@/components/cms/post-config";
import { Button } from "@/components/ui/button";
import { PostType } from "@/lib/db/schema";
import { type PostWithTags } from "@/types/cms";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface PostEditorClientProps {
  postType: PostType;
  mode: "create" | "edit";
  r2PublicUrl?: string;
  postId?: string;
}

export function PostEditorClient({
  postType,
  mode,
  r2PublicUrl,
  postId,
}: PostEditorClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const config = getPostConfig(postType);

  const [isPending, startTransition] = useTransition();
  const [initialData, setInitialData] = useState<PostWithTags | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageMode, setPageMode] = useState<"create" | "edit" | "duplicate">(
    mode
  );

  useEffect(() => {
    if (mode === "create") {
      // Check for duplication mode
      const duplicateId = searchParams.get("duplicatePostId");

      if (duplicateId) {
        setPageMode("duplicate");
        setIsLoading(true);
        const fetchPostToDuplicate = async () => {
          try {
            const result = await getPostByIdAction({
              postId: duplicateId,
            });
            if (result.success && result.data?.post) {
              const originalPost = result.data.post;
              const duplicatedPost: PostWithTags = {
                ...originalPost,
                id: "",
                title: `${originalPost.title} (Copy)`,
                slug: `${originalPost.slug}`,
                status: "draft",
                isPinned: false,
              };
              setInitialData(duplicatedPost);
            } else {
              toast.error(`Error fetching ${config.postType} to duplicate`, {
                description:
                  result.error ||
                  `Failed to fetch the ${config.postType} to duplicate`,
              });
              setInitialData(null);
              setPageMode("create");
            }
          } catch (error) {
            toast.error("Unexpected error occurred");
            console.error(
              `Failed to fetch ${config.postType} for duplication:`,
              error
            );
            setInitialData(null);
            setPageMode("create");
          } finally {
            setIsLoading(false);
          }
        };
        fetchPostToDuplicate();
      }
    } else if (mode === "edit") {
      // Fetch post for editing
      const fetchPost = async () => {
        if (!postId) {
          setIsLoading(false);
          toast.error("Post ID is required");
          return;
        }

        setIsLoading(true);
        try {
          const result = await getPostByIdAction({ postId });
          if (result.success && result.data?.post) {
            setInitialData(result.data.post);
          } else {
            toast.error(`Failed to fetch ${config.postType}`, {
              description: result.error,
            });
            setInitialData(null);
          }
        } catch (error) {
          toast.error("Unexpected error occurred");
          console.error(`Failed to fetch ${config.postType}:`, error);
          setInitialData(null);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPost();
    }
  }, [config, mode, postId, postType, searchParams]);

  const handleSubmit = async (data: any) => {
    if (mode === "edit" && initialData?.id) {
      const result = await updatePostAction({
        data: {
          ...data,
          id: postId,
        },
      });

      if (result.success) {
        toast.success(`${config.postType} updated successfully!`);
        router.push(config.routes.list);
        router.refresh();
      } else {
        toast.error(`Error updating ${config.postType}`, {
          description:
            result.error || `Failed to update the ${config.postType}`,
        });
      }
    } else {
      const result = await createPostAction({
        postType,
        data,
      });

      if (result.success && result.data?.postId) {
        toast.success(`${config.postType} created successfully!`);
        router.push(config.routes.list);
      } else {
        toast.error(`Error creating ${config.postType} post`, {
          description:
            result.error || `Failed to create the ${config.postType} post`,
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-2">
          {pageMode === "duplicate"
            ? `Loading post to duplicate...`
            : `Loading post...`}
        </p>
      </div>
    );
  }

  if (mode === "edit" && !initialData) {
    return (
      <div className="space-y-6 p-4 md:p-8 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {config.postType} Not Found
        </h2>
        <p className="text-muted-foreground">
          The requested {config.postType} post could not be found
        </p>
        <Button onClick={() => router.push(config.routes.list)}>
          Back to List
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {mode === "edit"
            ? `Edit ${config.postType} Post`
            : `Create ${config.postType} Post`}
        </h1>
      </div>
      <PostForm
        config={{
          postType,
          schema: config.schema,
          imagePath: config.imagePath,
          enableTags: config.enableTags,
        }}
        initialData={initialData}
        isDuplicate={pageMode === "duplicate"}
        r2PublicUrl={r2PublicUrl}
        onSubmit={async (data) => {
          startTransition(() => {
            handleSubmit(data);
          });
        }}
        isSubmitting={isPending}
      />
    </div>
  );
}
