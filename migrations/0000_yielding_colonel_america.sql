CREATE TYPE "public"."account_type" AS ENUM('asset', 'liability', 'equity', 'income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."exam_status" AS ENUM('not_started', 'in_progress', 'submitted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."exercise_type" AS ENUM('guided', 'practice');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('in_progress', 'submitted', 'reviewed');--> statement-breakpoint
CREATE TYPE "public"."tax_regime" AS ENUM('iva', 'igic');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'teacher', 'student');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"account_type" "account_type" NOT NULL,
	"parent_code" text,
	"is_system" boolean DEFAULT false NOT NULL,
	"user_id" varchar
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"teacher_id" varchar NOT NULL,
	"school_year_id" varchar NOT NULL,
	"enrollment_code" text,
	CONSTRAINT "courses_enrollment_code_unique" UNIQUE("enrollment_code")
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"started_at" text NOT NULL,
	"submitted_at" text,
	"status" "exam_status" DEFAULT 'not_started' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"instructions" text,
	"exercise_id" varchar NOT NULL,
	"course_id" varchar NOT NULL,
	"teacher_id" varchar NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"available_from" text,
	"available_to" text,
	"is_active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" varchar NOT NULL,
	"student_id" varchar NOT NULL,
	"status" "submission_status" DEFAULT 'in_progress' NOT NULL,
	"submitted_at" text,
	"grade" numeric(5, 2),
	"feedback" text,
	"reviewed_at" text,
	"reviewed_by" varchar
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"exercise_type" "exercise_type" DEFAULT 'practice' NOT NULL,
	"course_id" varchar NOT NULL,
	"teacher_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entry_number" integer NOT NULL,
	"date" text NOT NULL,
	"description" text NOT NULL,
	"user_id" varchar NOT NULL,
	"exercise_id" varchar
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journal_entry_id" varchar NOT NULL,
	"account_code" text NOT NULL,
	"account_name" text NOT NULL,
	"debit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"credit" numeric(12, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mail_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"smtp_host" text DEFAULT '' NOT NULL,
	"smtp_port" integer DEFAULT 587 NOT NULL,
	"smtp_user" text DEFAULT '' NOT NULL,
	"smtp_password" text DEFAULT '' NOT NULL,
	"smtp_from" text DEFAULT '' NOT NULL,
	"smtp_secure" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" text NOT NULL,
	"used_at" text
);
--> statement-breakpoint
CREATE TABLE "school_years" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_regime" "tax_regime" DEFAULT 'iva' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"course_id" varchar,
	"created_by" varchar,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
