CREATE TABLE "leads" (
	"id" text PRIMARY KEY,
	"text" text NOT NULL,
	"tweet_created_at" timestamp with time zone,
	"name" text DEFAULT '' NOT NULL,
	"handle" text DEFAULT '' NOT NULL,
	"avatar" text DEFAULT '' NOT NULL,
	"product" text DEFAULT '' NOT NULL,
	"keyword" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'sedot' NOT NULL,
	"status" text DEFAULT 'baru' NOT NULL,
	"bookmarked" boolean DEFAULT false NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reply_templates" (
	"id" serial PRIMARY KEY,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
