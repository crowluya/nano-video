CREATE TYPE "public"."post_type" AS ENUM('blog', 'guide');--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_language_slug_unique";--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "post_type" "post_type" DEFAULT 'blog';--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN "post_type" "post_type" DEFAULT 'blog';--> statement-breakpoint
CREATE INDEX "idx_posts_post_type" ON "posts" USING btree ("post_type");--> statement-breakpoint
CREATE INDEX "idx_posts_language_post_type_status" ON "posts" USING btree ("language","post_type","status");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_language_slug_post_type_unique" UNIQUE("language","slug","post_type");