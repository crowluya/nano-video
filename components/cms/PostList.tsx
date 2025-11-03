"use client";

import { listPublishedPostsAction } from "@/actions/blogs/posts";
import { PostType } from "@/lib/db/schema";
import { PostBase, PublicPost, Tag } from "@/types/cms";
import dayjs from "dayjs";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { PostCard } from "./PostCard";
import { TagSelector } from "./TagSelector";

function mapServerPostToCard(post: PublicPost, locale: string): PostBase {
  return {
    locale: locale,
    title: post.title,
    description: post.description ?? "",
    featuredImageUrl: post.featuredImageUrl ?? "/placeholder.svg",
    slug: post.slug,
    tags: post.tags ?? "",
    publishedAt:
      (post.publishedAt && dayjs(post.publishedAt).toDate()) || new Date(),
    status: post.status ?? "published",
    visibility: post.visibility ?? "public",
    isPinned: post.isPinned ?? false,
    content: "", // content is not used in the card
  };
}

interface PostListProps {
  postType: PostType;
  locale: string;
  baseUrl: string;
  localPosts: PostBase[];
  initialPosts: PublicPost[];
  initialTotal: number;
  serverTags?: Tag[];
  pageSize: number;
  showTagSelector?: boolean;
  gridClassName?: string;
  emptyMessage?: string;
}

export function PostList({
  postType,
  baseUrl,
  localPosts,
  initialPosts,
  initialTotal,
  serverTags = [],
  locale,
  pageSize,
  showTagSelector = false,
  gridClassName = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8",
  emptyMessage = "No posts found.",
}: PostListProps) {
  const [posts, setPosts] = useState<PublicPost[]>(initialPosts);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(
    initialPosts.length < initialTotal
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const result = await listPublishedPostsAction({
      pageIndex: pageIndex,
      pageSize: pageSize,
      tagId: showTagSelector ? selectedTagId : undefined,
      postType: postType,
      locale: locale,
    });

    if (result.success && result.data?.posts) {
      const newPosts = result.data.posts;
      const newTotal = result.data.count ?? initialTotal;
      setPosts((prevPosts) => [...prevPosts, ...newPosts]);
      setPageIndex((prevIndex) => prevIndex + 1);
      setHasMore(posts.length + newPosts.length < newTotal);
    } else {
      console.error("Failed to load more posts:", result.error);
      toast.error("Failed to load more posts", {
        description: result.error,
      });
    }
    setIsLoading(false);
  }, [
    pageIndex,
    isLoading,
    hasMore,
    initialTotal,
    posts.length,
    selectedTagId,
    pageSize,
    postType,
    showTagSelector,
    locale,
  ]);

  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMorePosts();
    }
  }, [inView, hasMore, isLoading, loadMorePosts]);

  useEffect(() => {
    setPosts(initialPosts);
    setPageIndex(1);
    setHasMore(initialPosts.length < initialTotal);
  }, [initialPosts, initialTotal]);

  const handleTagSelect = async (tagId: string | null) => {
    if (tagId === selectedTagId) return;

    setSelectedTagId(tagId);
    setIsLoading(true);

    const result = await listPublishedPostsAction({
      pageIndex: 0,
      pageSize: pageSize,
      tagId: tagId,
      postType: postType,
      locale: locale,
    });

    if (result.success && result.data?.posts) {
      setPosts(result.data.posts);
      setPageIndex(1);
      setHasMore(result.data.posts.length < (result.data.count ?? 0));
    } else {
      console.error("Failed to filter posts by tag:", result.error);
      toast.error("Failed to filter posts by tag", {
        description: result.error,
      });
    }

    setIsLoading(false);
  };

  return (
    <>
      {showTagSelector && serverTags.length > 0 && (
        <TagSelector
          tags={serverTags}
          selectedTagId={selectedTagId}
          onSelectTag={handleTagSelect}
        />
      )}

      {isLoading && pageIndex === 1 ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className={gridClassName}>
            {(!showTagSelector || selectedTagId === null) &&
              localPosts.map((post) => (
                <PostCard
                  key={`local-${post.slug}`}
                  post={post}
                  baseUrl={baseUrl}
                />
              ))}

            {posts.map((post) => (
              <PostCard
                key={`server-${post.id}`}
                post={mapServerPostToCard(post, locale)}
                baseUrl={baseUrl}
              />
            ))}
          </div>

          {hasMore && (
            <div ref={ref} className="flex justify-center items-center py-8">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <span className="text-gray-500">Loading more posts...</span>
              )}
            </div>
          )}

          {!hasMore && posts.length >= 0 && (
            <p className="text-center text-gray-500 py-8 text-sm">
              {posts.length === 0 ? emptyMessage : "You've reached the end."}
            </p>
          )}
        </>
      )}
    </>
  );
}
