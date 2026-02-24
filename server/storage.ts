import { db } from "./db";
import { eq, and } from "drizzle-orm";
import {
  users, schoolYears, systemConfig, courses, accounts, exercises,
  journalEntries, journalLines,
  type User, type InsertUser,
  type SchoolYear, type InsertSchoolYear,
  type SystemConfig,
  type Course, type InsertCourse,
  type Account, type InsertAccount,
  type Exercise, type InsertExercise,
  type JournalEntry, type InsertJournalEntry,
  type JournalLine, type InsertJournalLine,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersByTeacher(teacherId: string, role: string): Promise<User[]>;
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
  createCourse(course: InsertCourse): Promise<Course>;
  deleteCourse(id: string): Promise<void>;

  getAccounts(): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;

  getExercises(): Promise<Exercise[]>;
  getExercisesByTeacher(teacherId: string): Promise<Exercise[]>;
  getExercisesByCourse(courseId: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  deleteExercise(id: string): Promise<void>;

  getJournalEntries(userId: string): Promise<(JournalEntry & { lines: JournalLine[] })[]>;
  createJournalEntry(entry: InsertJournalEntry, lines: InsertJournalLine[]): Promise<JournalEntry>;
  deleteJournalEntry(id: string): Promise<void>;
  getNextEntryNumber(userId: string): Promise<number>;

  getLedger(userId: string): Promise<any[]>;
  getTrialBalance(userId: string): Promise<any>;
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

  async createCourse(course: InsertCourse): Promise<Course> {
    const [created] = await db.insert(courses).values(course).returning();
    return created;
  }

  async deleteCourse(id: string): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  async getAccounts(): Promise<Account[]> {
    return db.select().from(accounts);
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [created] = await db.insert(accounts).values(account).returning();
    return created;
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

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [created] = await db.insert(exercises).values(exercise).returning();
    return created;
  }

  async deleteExercise(id: string): Promise<void> {
    await db.delete(exercises).where(eq(exercises.id, id));
  }

  async getJournalEntries(userId: string): Promise<(JournalEntry & { lines: JournalLine[] })[]> {
    const entries = await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId));

    const result = [];
    for (const entry of entries) {
      const entryLines = await db.select().from(journalLines)
        .where(eq(journalLines.journalEntryId, entry.id));
      result.push({ ...entry, lines: entryLines });
    }
    return result.sort((a, b) => a.entryNumber - b.entryNumber);
  }

  async getNextEntryNumber(userId: string): Promise<number> {
    const entries = await db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId));
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

  async getLedger(userId: string): Promise<any[]> {
    const entries = await this.getJournalEntries(userId);
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

  async getTrialBalance(userId: string): Promise<any> {
    const ledger = await this.getLedger(userId);
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
}

export const storage = new DatabaseStorage();
