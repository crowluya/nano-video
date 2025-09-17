CREATE TYPE "public"."post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."post_visibility" AS ENUM('public', 'logged_in', 'subscribers');--> statement-breakpoint
CREATE TYPE "public"."pricing_plan_environment" AS ENUM('test', 'live');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"one_time_balance_after" integer NOT NULL,
	"subscription_balance_after" integer NOT NULL,
	"type" text NOT NULL,
	"notes" text,
	"related_order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"provider_order_id" text NOT NULL,
	"status" text NOT NULL,
	"order_type" text NOT NULL,
	"product_id" text,
	"plan_id" uuid,
	"price_id" varchar(255),
	"amount_subtotal" numeric,
	"amount_discount" numeric DEFAULT '0',
	"amount_tax" numeric DEFAULT '0',
	"amount_total" numeric NOT NULL,
	"currency" varchar(10) NOT NULL,
	"subscription_provider_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idx_orders_provider_provider_order_id_unique" UNIQUE("provider","provider_order_id")
);
--> statement-breakpoint
CREATE TABLE "post_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"language" varchar(10) NOT NULL,
	"author_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text,
	"description" text,
	"featured_image_url" text,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"status" "post_status" DEFAULT 'draft' NOT NULL,
	"visibility" "post_visibility" DEFAULT 'public' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_language_slug_unique" UNIQUE("language","slug")
);
--> statement-breakpoint
CREATE TABLE "pricing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"environment" "pricing_plan_environment" NOT NULL,
	"card_title" text NOT NULL,
	"card_description" text,
	"stripe_price_id" varchar(255),
	"stripe_product_id" varchar(255),
	"stripe_coupon_id" varchar(255),
	"enable_manual_input_coupon" boolean DEFAULT false NOT NULL,
	"payment_type" varchar(50),
	"recurring_interval" varchar(50),
	"trial_period_days" integer,
	"price" numeric,
	"currency" varchar(10),
	"display_price" varchar(50),
	"original_price" varchar(50),
	"price_suffix" varchar(100),
	"features" jsonb DEFAULT '[]' NOT NULL,
	"is_highlighted" boolean DEFAULT false NOT NULL,
	"highlight_text" text,
	"button_text" text,
	"button_link" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"lang_jsonb" jsonb DEFAULT '{}' NOT NULL,
	"benefits_jsonb" jsonb DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"price_id" varchar(255) NOT NULL,
	"status" text NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_credits_balance" integer DEFAULT 0 NOT NULL,
	"one_time_credits_balance" integer DEFAULT 0 NOT NULL,
	"balance_jsonb" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text,
	"image" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"referral" text,
	"stripe_customer_id" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_stripe_customer_id_unique" UNIQUE("stripe_customer_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_logs" ADD CONSTRAINT "credit_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_logs" ADD CONSTRAINT "credit_logs_related_order_id_orders_id_fk" FOREIGN KEY ("related_order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_plan_id_pricing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_pricing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage" ADD CONSTRAINT "usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_credit_logs_user_id" ON "credit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_credit_logs_type" ON "credit_logs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_credit_logs_related_order_id" ON "credit_logs" USING btree ("related_order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_provider" ON "orders" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "idx_orders_plan_id" ON "orders" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_post_tags_post_id" ON "post_tags" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_tags_tag_id" ON "post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "idx_posts_author_id" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_posts_status" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_posts_visibility" ON "posts" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_posts_language_status" ON "posts" USING btree ("language","status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_status" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_plan_id" ON "subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "idx_tags_name" ON "tags" USING btree ("name");