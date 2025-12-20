CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "idx_activity_logs_user_id" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_action" ON "activity_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_activity_logs_created_at" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE "task_credit_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" text NOT NULL,
	"credit_log_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"refunded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_task_credit_mappings_task_id_unique" ON "task_credit_mappings" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_credit_mappings_task_id" ON "task_credit_mappings" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_credit_mappings_credit_log_id" ON "task_credit_mappings" USING btree ("credit_log_id");--> statement-breakpoint
CREATE INDEX "idx_task_credit_mappings_user_id" ON "task_credit_mappings" USING btree ("user_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_credit_mappings" ADD CONSTRAINT "task_credit_mappings_credit_log_id_credit_logs_id_fk" FOREIGN KEY ("credit_log_id") REFERENCES "credit_logs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_credit_mappings" ADD CONSTRAINT "task_credit_mappings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

