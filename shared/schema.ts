import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "teacher", "student"]);
export const taxRegimeEnum = pgEnum("tax_regime", ["iva", "igic"]);
export const exerciseTypeEnum = pgEnum("exercise_type", ["guided", "practice"]);
export const accountTypeEnum = pgEnum("account_type", ["asset", "liability", "equity", "income", "expense"]);
export const examStatusEnum = pgEnum("exam_status", ["not_started", "in_progress", "submitted", "expired"]);
export const submissionStatusEnum = pgEnum("submission_status", ["in_progress", "submitted", "reviewed"]);

export const schoolYears = pgTable("school_years", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(false),
});

export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taxRegime: taxRegimeEnum("tax_regime").notNull().default("iva"),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  role: userRoleEnum("role").notNull().default("student"),
  courseId: varchar("course_id"),
  createdBy: varchar("created_by"),
});

export const courses = pgTable("courses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  teacherId: varchar("teacher_id").notNull(),
  schoolYearId: varchar("school_year_id").notNull(),
  enrollmentCode: text("enrollment_code").unique(),
});

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull(),
  name: text("name").notNull(),
  accountType: accountTypeEnum("account_type").notNull(),
  parentCode: text("parent_code"),
  isSystem: boolean("is_system").notNull().default(false),
  userId: varchar("user_id"),
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  exerciseType: exerciseTypeEnum("exercise_type").notNull().default("practice"),
  courseId: varchar("course_id").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  solution: text("solution"),
});

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryNumber: integer("entry_number").notNull(),
  date: text("date").notNull(),
  description: text("description").notNull(),
  userId: varchar("user_id").notNull(),
  exerciseId: varchar("exercise_id"),
});

export const journalLines = pgTable("journal_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journalEntryId: varchar("journal_entry_id").notNull(),
  accountCode: text("account_code").notNull(),
  accountName: text("account_name").notNull(),
  debit: decimal("debit", { precision: 12, scale: 2 }).notNull().default("0"),
  credit: decimal("credit", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const exams = pgTable("exams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"),
  exerciseId: varchar("exercise_id").notNull(),
  courseId: varchar("course_id").notNull(),
  teacherId: varchar("teacher_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  availableFrom: text("available_from"),
  availableTo: text("available_to"),
  isActive: boolean("is_active").notNull().default(false),
});

export const examAttempts = pgTable("exam_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  examId: varchar("exam_id").notNull(),
  studentId: varchar("student_id").notNull(),
  startedAt: text("started_at").notNull(),
  submittedAt: text("submitted_at"),
  status: examStatusEnum("status").notNull().default("not_started"),
});

export const exerciseSubmissions = pgTable("exercise_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exerciseId: varchar("exercise_id").notNull(),
  studentId: varchar("student_id").notNull(),
  status: submissionStatusEnum("status").notNull().default("in_progress"),
  submittedAt: text("submitted_at"),
  grade: decimal("grade", { precision: 5, scale: 2 }),
  feedback: text("feedback"),
  reviewedAt: text("reviewed_at"),
  reviewedBy: varchar("reviewed_by"),
});

export const mailConfig = pgTable("mail_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  smtpHost: text("smtp_host").notNull().default(""),
  smtpPort: integer("smtp_port").notNull().default(587),
  smtpUser: text("smtp_user").notNull().default(""),
  smtpPassword: text("smtp_password").notNull().default(""),
  smtpFrom: text("smtp_from").notNull().default(""),
  smtpSecure: boolean("smtp_secure").notNull().default(false),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
});

// Insert schemas
export const insertSchoolYearSchema = createInsertSchema(schoolYears).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true });
export const insertJournalLineSchema = createInsertSchema(journalLines).omit({ id: true });
export const insertExamSchema = createInsertSchema(exams).omit({ id: true });
export const insertExamAttemptSchema = createInsertSchema(examAttempts).omit({ id: true });
export const insertExerciseSubmissionSchema = createInsertSchema(exerciseSubmissions).omit({ id: true });
export const insertMailConfigSchema = createInsertSchema(mailConfig).omit({ id: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true });

// Types
export type SchoolYear = typeof schoolYears.$inferSelect;
export type InsertSchoolYear = z.infer<typeof insertSchoolYearSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalLine = typeof journalLines.$inferSelect;
export type InsertJournalLine = z.infer<typeof insertJournalLineSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type ExamAttempt = typeof examAttempts.$inferSelect;
export type InsertExamAttempt = z.infer<typeof insertExamAttemptSchema>;
export type ExerciseSubmission = typeof exerciseSubmissions.$inferSelect;
export type InsertExerciseSubmission = z.infer<typeof insertExerciseSubmissionSchema>;
export type MailConfig = typeof mailConfig.$inferSelect;
export type InsertMailConfig = z.infer<typeof insertMailConfigSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});
export type LoginData = z.infer<typeof loginSchema>;

// Student registration schema
export const registerSchema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  fullName: z.string().min(1, "El nombre es obligatorio"),
  enrollmentCode: z.string().min(1, "El código de matriculación es obligatorio"),
});
export type RegisterData = z.infer<typeof registerSchema>;
