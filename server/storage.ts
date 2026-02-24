import { db } from "./db";
import { eq, and } from "drizzle-orm";
import {
  users, schoolYears, systemConfig, courses, accounts, exercises, exerciseDocuments, courseExercises,
  journalEntries, journalLines, exams, examAttempts, exerciseSubmissions,
  mailConfig, passwordResetTokens,
  type User, type InsertUser,
  type SchoolYear, type InsertSchoolYear,
  type SystemConfig,
  type Course, type InsertCourse,
  type Account, type InsertAccount,
  type Exercise, type InsertExercise,
  type ExerciseDocument, type InsertExerciseDocument,
  type JournalEntry, type InsertJournalEntry,
  type JournalLine, type InsertJournalLine,
  type Exam, type InsertExam,
  type ExamAttempt, type InsertExamAttempt,
  type CourseExercise, type InsertCourseExercise,
  type ExerciseSubmission, type InsertExerciseSubmission,
  type MailConfig, type InsertMailConfig,
  type PasswordResetToken, type InsertPasswordResetToken,
} from "@shared/schema";

function generateEnrollmentCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByTeacher(teacherId: string, role: string): Promise<User[]>;
  getUsersByCourse(courseId: string): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  getSchoolYears(): Promise<SchoolYear[]>;
  createSchoolYear(year: InsertSchoolYear): Promise<SchoolYear>;
  toggleSchoolYear(id: string): Promise<void>;
  deleteSchoolYear(id: string): Promise<void>;

  getConfig(): Promise<SystemConfig>;
  updateConfig(taxRegime: string): Promise<void>;

  getCourses(): Promise<Course[]>;
  getCourseById(id: string): Promise<Course | undefined>;
  getCoursesByTeacher(teacherId: string): Promise<Course[]>;
  getCourseByEnrollmentCode(code: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  deleteCourse(id: string): Promise<void>;

  getAccounts(): Promise<Account[]>;
  getAccountsForUser(userId: string): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  deleteAccount(id: string, userId: string): Promise<void>;

  getExercises(): Promise<Exercise[]>;
  getExercisesByTeacher(teacherId: string): Promise<Exercise[]>;
  getExercisesByCourse(courseId: string): Promise<Exercise[]>;
  getExercisesForCourse(courseId: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  deleteExercise(id: string): Promise<void>;
  updateExerciseSolution(id: string, solution: string | null): Promise<Exercise>;

  getExerciseDocuments(exerciseId: string): Promise<ExerciseDocument[]>;
  addExerciseDocument(doc: InsertExerciseDocument): Promise<ExerciseDocument>;
  deleteExerciseDocument(id: string): Promise<void>;

  getCourseExercises(courseId: string): Promise<CourseExercise[]>;
  assignExerciseToCourse(courseId: string, exerciseId: string): Promise<CourseExercise>;
  unassignExerciseFromCourse(courseId: string, exerciseId: string): Promise<void>;
  getAssignedCourseIds(exerciseId: string): Promise<string[]>;
  isExerciseAssignedToCourse(exerciseId: string, courseId: string): Promise<boolean>;

  getJournalEntries(userId: string, exerciseId?: string): Promise<(JournalEntry & { lines: JournalLine[] })[]>;
  createJournalEntry(entry: InsertJournalEntry, lines: InsertJournalLine[]): Promise<JournalEntry>;
  deleteJournalEntry(id: string): Promise<void>;
  getNextEntryNumber(userId: string, exerciseId?: string): Promise<number>;

  getLedger(userId: string, exerciseId?: string): Promise<any[]>;
  getTrialBalance(userId: string, exerciseId?: string): Promise<any>;

  getExamsByTeacher(teacherId: string): Promise<Exam[]>;
  getExamsByCourse(courseId: string): Promise<Exam[]>;
  getExam(id: string): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: string, data: Partial<Exam>): Promise<Exam>;
  deleteExam(id: string): Promise<void>;

  getExamAttempt(examId: string, studentId: string): Promise<ExamAttempt | undefined>;
  getExamAttemptsByExam(examId: string): Promise<ExamAttempt[]>;
  createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt>;
  submitExamAttempt(id: string): Promise<ExamAttempt>;

  getExerciseSubmission(exerciseId: string, studentId: string): Promise<ExerciseSubmission | undefined>;
  getExerciseSubmissionsByExercise(exerciseId: string): Promise<ExerciseSubmission[]>;
  getExerciseSubmissionsByStudent(studentId: string): Promise<ExerciseSubmission[]>;
  createOrUpdateSubmission(data: InsertExerciseSubmission): Promise<ExerciseSubmission>;
  submitExercise(exerciseId: string, studentId: string): Promise<ExerciseSubmission>;
  reviewExercise(id: string, feedback: string, grade: string | null, reviewedBy: string): Promise<ExerciseSubmission>;

  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  updateUserEmail(id: string, email: string): Promise<void>;
  getUserByEmail(email: string): Promise<User | undefined>;

  getMailConfig(): Promise<MailConfig>;
  updateMailConfig(data: Partial<InsertMailConfig>): Promise<MailConfig>;

  createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | undefined>;
  markTokenUsed(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role as any));
  }

  async getUsersByTeacher(teacherId: string, role: string): Promise<User[]> {
    return db.select().from(users).where(
      and(eq(users.role, role as any), eq(users.createdBy, teacherId))
    );
  }

  async getUsersByCourse(courseId: string): Promise<User[]> {
    return db.select().from(users).where(
      and(eq(users.role, "student" as any), eq(users.courseId, courseId))
    );
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getSchoolYears(): Promise<SchoolYear[]> {
    return db.select().from(schoolYears);
  }

  async createSchoolYear(year: InsertSchoolYear): Promise<SchoolYear> {
    const [created] = await db.insert(schoolYears).values(year).returning();
    return created;
  }

  async toggleSchoolYear(id: string): Promise<void> {
    const [year] = await db.select().from(schoolYears).where(eq(schoolYears.id, id));
    if (!year) return;

    if (!year.active) {
      await db.update(schoolYears).set({ active: false }).where(eq(schoolYears.active, true));
    }
    await db.update(schoolYears).set({ active: !year.active }).where(eq(schoolYears.id, id));
  }

  async deleteSchoolYear(id: string): Promise<void> {
    await db.delete(schoolYears).where(eq(schoolYears.id, id));
  }

  async getConfig(): Promise<SystemConfig> {
    const configs = await db.select().from(systemConfig);
    if (configs.length === 0) {
      const [created] = await db.insert(systemConfig).values({ taxRegime: "iva" }).returning();
      return created;
    }
    return configs[0];
  }

  async updateConfig(taxRegime: string): Promise<void> {
    const config = await this.getConfig();
    await db.update(systemConfig).set({ taxRegime: taxRegime as any }).where(eq(systemConfig.id, config.id));
  }

  async getCourses(): Promise<Course[]> {
    return db.select().from(courses);
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCoursesByTeacher(teacherId: string): Promise<Course[]> {
    return db.select().from(courses).where(eq(courses.teacherId, teacherId));
  }

  async getCourseByEnrollmentCode(code: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.enrollmentCode, code.toUpperCase()));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const codeToUse = course.enrollmentCode || generateEnrollmentCode();
    const [created] = await db.insert(courses).values({ ...course, enrollmentCode: codeToUse }).returning();
    return created;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getAccounts(): Promise<Account[]> {
    return db.select().from(accounts).where(eq(accounts.isSystem, true));
  }

  async getAccountsForUser(userId: string): Promise<Account[]> {
    const systemAccounts = await db.select().from(accounts).where(eq(accounts.isSystem, true));
    const userAccounts = await db.select().from(accounts).where(eq(accounts.userId, userId));
    return [...systemAccounts, ...userAccounts].sort((a, b) => a.code.localeCompare(b.code));
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [created] = await db.insert(accounts).values(account).returning();
    return created;
  }

  async deleteAccount(id: string, userId: string): Promise<void> {
    await db.delete(accounts).where(
      and(eq(accounts.id, id), eq(accounts.isSystem, false), eq(accounts.userId, userId))
    );
  }

  async getExercises(): Promise<Exercise[]> {
    return db.select().from(exercises);
  }

  async getExercisesByTeacher(teacherId: string): Promise<Exercise[]> {
    return db.select().from(exercises).where(eq(exercises.teacherId, teacherId));
  }

  async getExercisesByCourse(courseId: string): Promise<Exercise[]> {
    return db.select().from(exercises).where(eq(exercises.courseId, courseId));
  }

  async getExercisesForCourse(courseId: string): Promise<Exercise[]> {
    const assignments = await db.select().from(courseExercises).where(eq(courseExercises.courseId, courseId));
    if (assignments.length === 0) return [];
    const exerciseIds = assignments.map(a => a.exerciseId);
    const allExercises = await db.select().from(exercises);
    return allExercises.filter(e => exerciseIds.includes(e.id));
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [created] = await db.insert(exercises).values(exercise).returning();
    return created;
  }

  async deleteExercise(id: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  async updateExerciseSolution(id: string, solution: string | null): Promise<Exercise> {
    const [updated] = await db.update(exercises).set({ solution }).where(eq(exercises.id, id)).returning();
    return updated;
  }

  async getExerciseDocuments(exerciseId: string): Promise<ExerciseDocument[]> {
    return db.select().from(exerciseDocuments)
      .where(eq(exerciseDocuments.exerciseId, exerciseId))
      .orderBy(exerciseDocuments.sortOrder);
  }

  async addExerciseDocument(doc: InsertExerciseDocument): Promise<ExerciseDocument> {
    const [created] = await db.insert(exerciseDocuments).values(doc).returning();
    return created;
  }

  async deleteExerciseDocument(id: string): Promise<void> {
    await db.delete(exerciseDocuments).where(eq(exerciseDocuments.id, id));
  }

  async getCourseExercises(courseId: string): Promise<CourseExercise[]> {
    return db.select().from(courseExercises).where(eq(courseExercises.courseId, courseId));
  }

  async assignExerciseToCourse(courseId: string, exerciseId: string): Promise<CourseExercise> {
    const existing = await db.select().from(courseExercises)
      .where(and(eq(courseExercises.courseId, courseId), eq(courseExercises.exerciseId, exerciseId)));
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(courseExercises).values({ courseId, exerciseId }).returning();
    return created;
  }

  async unassignExerciseFromCourse(courseId: string, exerciseId: string): Promise<void> {
    await db.delete(courseExercises)
      .where(and(eq(courseExercises.courseId, courseId), eq(courseExercises.exerciseId, exerciseId)));
  }

  async getAssignedCourseIds(exerciseId: string): Promise<string[]> {
    const rows = await db.select().from(courseExercises).where(eq(courseExercises.exerciseId, exerciseId));
    return rows.map(r => r.courseId);
  }

  async isExerciseAssignedToCourse(exerciseId: string, courseId: string): Promise<boolean> {
    const rows = await db.select().from(courseExercises)
      .where(and(eq(courseExercises.courseId, courseId), eq(courseExercises.exerciseId, exerciseId)));
    return rows.length > 0;
  }

  async getJournalEntries(userId: string, exerciseId?: string): Promise<(JournalEntry & { lines: JournalLine[] })[]> {
    let entries;
    if (exerciseId) {
      entries = await db.select().from(journalEntries)
        .where(and(eq(journalEntries.userId, userId), eq(journalEntries.exerciseId, exerciseId)));
    } else {
      entries = await db.select().from(journalEntries)
        .where(eq(journalEntries.userId, userId));
    }

    const result = [];
    for (const entry of entries) {
      const entryLines = await db.select().from(journalLines)
        .where(eq(journalLines.journalEntryId, entry.id));
      result.push({ ...entry, lines: entryLines });
    }
    return result.sort((a, b) => a.entryNumber - b.entryNumber);
  }

  async getNextEntryNumber(userId: string, exerciseId?: string): Promise<number> {
    let entries;
    if (exerciseId) {
      entries = await db.select().from(journalEntries)
        .where(and(eq(journalEntries.userId, userId), eq(journalEntries.exerciseId, exerciseId)));
    } else {
      entries = await db.select().from(journalEntries)
        .where(eq(journalEntries.userId, userId));
    }
    return entries.length + 1;
  }

  async createJournalEntry(entry: InsertJournalEntry, lineData: InsertJournalLine[]): Promise<JournalEntry> {
    const [created] = await db.insert(journalEntries).values(entry).returning();

    for (const line of lineData) {
      await db.insert(journalLines).values({
        ...line,
        journalEntryId: created.id,
      });
    }

    return created;
  }

  async deleteJournalEntry(id: string): Promise<void> {
    await db.delete(journalLines).where(eq(journalLines.journalEntryId, id));
    await db.delete(journalEntries).where(eq(journalEntries.id, id));
  }

  async getLedger(userId: string, exerciseId?: string): Promise<any[]> {
    const entries = await this.getJournalEntries(userId, exerciseId);
    const accountMap = new Map<string, any>();

    for (const entry of entries) {
      for (const line of entry.lines) {
        const key = line.accountCode;
        if (!accountMap.has(key)) {
          accountMap.set(key, {
            accountCode: line.accountCode,
            accountName: line.accountName,
            entries: [],
            totalDebit: 0,
            totalCredit: 0,
            balance: 0,
          });
        }
        const acc = accountMap.get(key)!;
        const debit = parseFloat(line.debit);
        const credit = parseFloat(line.credit);
        acc.entries.push({
          date: entry.date,
          description: entry.description,
          debit: line.debit,
          credit: line.credit,
        });
        acc.totalDebit += debit;
        acc.totalCredit += credit;
        acc.balance = acc.totalDebit - acc.totalCredit;
      }
    }

    return Array.from(accountMap.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  async getTrialBalance(userId: string, exerciseId?: string): Promise<any> {
    const ledger = await this.getLedger(userId, exerciseId);
    const rows = ledger.map(acc => ({
      accountCode: acc.accountCode,
      accountName: acc.accountName,
      debitSum: acc.totalDebit,
      creditSum: acc.totalCredit,
      debitBalance: acc.balance > 0 ? acc.balance : 0,
      creditBalance: acc.balance < 0 ? Math.abs(acc.balance) : 0,
    }));

    const totals = rows.reduce((t, r) => ({
      debitSum: t.debitSum + r.debitSum,
      creditSum: t.creditSum + r.creditSum,
      debitBalance: t.debitBalance + r.debitBalance,
      creditBalance: t.creditBalance + r.creditBalance,
    }), { debitSum: 0, creditSum: 0, debitBalance: 0, creditBalance: 0 });

    return { rows, totals };
  }

  async getExamsByTeacher(teacherId: string): Promise<Exam[]> {
    return db.select().from(exams).where(eq(exams.teacherId, teacherId));
  }

  async getExamsByCourse(courseId: string): Promise<Exam[]> {
    return db.select().from(exams).where(eq(exams.courseId, courseId));
  }

  async getExam(id: string): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [created] = await db.insert(exams).values(exam).returning();
    return created;
  }

  async updateExam(id: string, data: Partial<Exam>): Promise<Exam> {
    const [updated] = await db.update(exams).set(data).where(eq(exams.id, id)).returning();
    return updated;
  }

  async deleteExam(id: string): Promise<void> {
    await db.delete(examAttempts).where(eq(examAttempts.examId, id));
    await db.delete(exams).where(eq(exams.id, id));
  }

  async getExamAttempt(examId: string, studentId: string): Promise<ExamAttempt | undefined> {
    const [attempt] = await db.select().from(examAttempts)
      .where(and(eq(examAttempts.examId, examId), eq(examAttempts.studentId, studentId)));
    return attempt;
  }

  async getExamAttemptsByExam(examId: string): Promise<ExamAttempt[]> {
    return db.select().from(examAttempts).where(eq(examAttempts.examId, examId));
  }

  async createExamAttempt(attempt: InsertExamAttempt): Promise<ExamAttempt> {
    const [created] = await db.insert(examAttempts).values(attempt).returning();
    return created;
  }

  async submitExamAttempt(id: string): Promise<ExamAttempt> {
    const [updated] = await db.update(examAttempts)
      .set({ submittedAt: new Date().toISOString(), status: "submitted" as any })
      .where(eq(examAttempts.id, id))
      .returning();
    return updated;
  }

  async getExerciseSubmission(exerciseId: string, studentId: string): Promise<ExerciseSubmission | undefined> {
    const [sub] = await db.select().from(exerciseSubmissions)
      .where(and(eq(exerciseSubmissions.exerciseId, exerciseId), eq(exerciseSubmissions.studentId, studentId)));
    return sub;
  }

  async getExerciseSubmissionsByExercise(exerciseId: string): Promise<ExerciseSubmission[]> {
    return db.select().from(exerciseSubmissions).where(eq(exerciseSubmissions.exerciseId, exerciseId));
  }

  async getExerciseSubmissionsByStudent(studentId: string): Promise<ExerciseSubmission[]> {
    return db.select().from(exerciseSubmissions).where(eq(exerciseSubmissions.studentId, studentId));
  }

  async createOrUpdateSubmission(data: InsertExerciseSubmission): Promise<ExerciseSubmission> {
    const existing = await this.getExerciseSubmission(data.exerciseId, data.studentId);
    if (existing) {
      return existing;
    }
    const [created] = await db.insert(exerciseSubmissions).values(data).returning();
    return created;
  }

  async submitExercise(exerciseId: string, studentId: string): Promise<ExerciseSubmission> {
    const existing = await this.getExerciseSubmission(exerciseId, studentId);
    if (existing) {
      const [updated] = await db.update(exerciseSubmissions)
        .set({ status: "submitted" as any, submittedAt: new Date().toISOString() })
        .where(eq(exerciseSubmissions.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(exerciseSubmissions).values({
      exerciseId,
      studentId,
      status: "submitted" as any,
      submittedAt: new Date().toISOString(),
    }).returning();
    return created;
  }

  async reviewExercise(id: string, feedback: string, grade: string | null, reviewedBy: string): Promise<ExerciseSubmission> {
    const [updated] = await db.update(exerciseSubmissions)
      .set({
        feedback,
        grade,
        status: "reviewed" as any,
        reviewedAt: new Date().toISOString(),
        reviewedBy,
      })
      .where(eq(exerciseSubmissions.id, id))
      .returning();
    return updated;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  async updateUserEmail(id: string, email: string): Promise<void> {
    await db.update(users).set({ email }).where(eq(users.id, id));
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getMailConfig(): Promise<MailConfig> {
    const configs = await db.select().from(mailConfig);
    if (configs.length === 0) {
      const [created] = await db.insert(mailConfig).values({}).returning();
      return created;
    }
    return configs[0];
  }

  async updateMailConfig(data: Partial<InsertMailConfig>): Promise<MailConfig> {
    const config = await this.getMailConfig();
    const [updated] = await db.update(mailConfig).set(data).where(eq(mailConfig.id, config.id)).returning();
    return updated;
  }

  async createPasswordResetToken(data: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [created] = await db.insert(passwordResetTokens).values(data).returning();
    return created;
  }

  async getPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | undefined> {
    const [token] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
    return token;
  }

  async markTokenUsed(id: string): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date().toISOString() }).where(eq(passwordResetTokens.id, id));
  }
}

export const storage = new DatabaseStorage();
