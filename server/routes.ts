import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const isProduction = process.env.NODE_ENV === "production";
  app.set("trust proxy", true);

  const PgSession = connectPg(session);
  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "contaedu-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );

  function requireAuth(req: any, res: any, next: any) {
    if (!req.session.userId) {
      return res.status(401).json({ message: "No autenticado" });
    }
    next();
  }

  function requireRole(...roles: string[]) {
    return async (req: any, res: any, next: any) => {
      if (!req.session.userId) return res.status(401).json({ message: "No autenticado" });
      const user = await storage.getUser(req.session.userId);
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({ message: "Sin permisos" });
      }
      req.user = user;
      next();
    };
  }

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ message: "Usuario o contraseña incorrectos" });
      req.session.userId = user.id;
      req.session.save((err: any) => {
        if (err) return res.status(500).json({ message: "Error al guardar sesión" });
        const { password: _, ...safe } = user;
        res.json(safe);
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ message: "No autenticado" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "No autenticado" });
    const { password: _, ...safe } = user;
    res.json(safe);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  // School years
  app.get("/api/school-years", requireAuth, async (_req, res) => {
    const years = await storage.getSchoolYears();
    res.json(years);
  });

  app.post("/api/school-years", requireRole("admin"), async (req, res) => {
    try {
      const year = await storage.createSchoolYear({ name: req.body.name, active: false });
      res.json(year);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/school-years/:id/toggle", requireRole("admin"), async (req, res) => {
    await storage.toggleSchoolYear(req.params.id);
    res.json({ ok: true });
  });

  app.delete("/api/school-years/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteSchoolYear(req.params.id);
    res.json({ ok: true });
  });

  // Config
  app.get("/api/config", requireAuth, async (_req, res) => {
    const config = await storage.getConfig();
    res.json(config);
  });

  app.patch("/api/config", requireRole("admin"), async (req, res) => {
    await storage.updateConfig(req.body.taxRegime);
    res.json({ ok: true });
  });

  // Users
  app.get("/api/users/teachers", requireAuth, async (_req, res) => {
    const teachers = await storage.getUsersByRole("teacher");
    res.json(teachers.map(({ password: _, ...t }) => t));
  });

  app.post("/api/users/teachers", requireRole("admin"), async (req: any, res) => {
    try {
      const { fullName, username, password } = req.body;
      if (!fullName || !username || !password) return res.status(400).json({ message: "Faltan campos obligatorios" });
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(400).json({ message: "El usuario ya existe" });
      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        fullName, username, password: hashed, role: "teacher", createdBy: req.user.id,
      });
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/users/students", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "No autenticado" });

    let students;
    if (user.role === "admin") {
      students = await storage.getUsersByRole("student");
    } else if (user.role === "teacher") {
      students = await storage.getUsersByTeacher(user.id, "student");
    } else {
      students = [];
    }
    res.json(students.map(({ password: _, ...s }) => s));
  });

  app.post("/api/users/students", requireRole("teacher"), async (req: any, res) => {
    try {
      const { fullName, username, password, courseId } = req.body;
      if (!fullName || !username || !password || !courseId) return res.status(400).json({ message: "Faltan campos obligatorios" });
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(400).json({ message: "El usuario ya existe" });
      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        fullName, username, password: hashed, role: "student", courseId, createdBy: req.user.id,
      });
      const { password: _, ...safe } = user;
      res.json(safe);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/users/:id", requireRole("admin", "teacher"), async (req, res) => {
    await storage.deleteUser(req.params.id);
    res.json({ ok: true });
  });

  // Courses
  app.get("/api/courses", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "No autenticado" });

    if (user.role === "admin") {
      res.json(await storage.getCourses());
    } else if (user.role === "teacher") {
      res.json(await storage.getCoursesByTeacher(user.id));
    } else if (user.role === "student" && user.courseId) {
      const course = await storage.getCourseById(user.courseId);
      res.json(course ? [course] : []);
    } else {
      res.json([]);
    }
  });

  app.post("/api/courses", requireRole("teacher"), async (req: any, res) => {
    try {
      const course = await storage.createCourse({
        name: req.body.name,
        description: req.body.description || null,
        teacherId: req.user.id,
        schoolYearId: req.body.schoolYearId,
      });
      res.json(course);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/courses/:id", requireRole("teacher", "admin"), async (req, res) => {
    await storage.deleteCourse(req.params.id);
    res.json({ ok: true });
  });

  // Accounts
  app.get("/api/accounts", requireAuth, async (_req, res) => {
    const accs = await storage.getAccounts();
    res.json(accs);
  });

  // Exercises
  app.get("/api/exercises", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "No autenticado" });

    if (user.role === "teacher") {
      res.json(await storage.getExercisesByTeacher(user.id));
    } else if (user.role === "student" && user.courseId) {
      res.json(await storage.getExercisesByCourse(user.courseId));
    } else if (user.role === "admin") {
      res.json(await storage.getExercises());
    } else {
      res.json([]);
    }
  });

  app.post("/api/exercises", requireRole("teacher"), async (req: any, res) => {
    try {
      const exercise = await storage.createExercise({
        title: req.body.title,
        description: req.body.description,
        exerciseType: req.body.exerciseType || "practice",
        courseId: req.body.courseId,
        teacherId: req.user.id,
      });
      res.json(exercise);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/exercises/:id", requireRole("teacher", "admin"), async (req, res) => {
    await storage.deleteExercise(req.params.id);
    res.json({ ok: true });
  });

  // Journal entries
  app.get("/api/journal-entries", requireAuth, async (req: any, res) => {
    const entries = await storage.getJournalEntries(req.session.userId);
    res.json(entries);
  });

  app.post("/api/journal-entries", requireRole("student"), async (req: any, res) => {
    try {
      const { date, description, lines } = req.body;
      if (!date || !description || !lines || lines.length < 2) {
        return res.status(400).json({ message: "El asiento debe tener al menos 2 líneas" });
      }

      const totalDebit = lines.reduce((s: number, l: any) => s + parseFloat(l.debit || 0), 0);
      const totalCredit = lines.reduce((s: number, l: any) => s + parseFloat(l.credit || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({ message: "El asiento no está cuadrado" });
      }

      const entryNumber = await storage.getNextEntryNumber(req.user.id);
      const entry = await storage.createJournalEntry(
        { entryNumber, date, description, userId: req.user.id },
        lines.map((l: any) => ({
          journalEntryId: "",
          accountCode: l.accountCode,
          accountName: l.accountName,
          debit: l.debit || "0",
          credit: l.credit || "0",
        }))
      );
      res.json(entry);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/journal-entries/:id", requireRole("student"), async (req, res) => {
    await storage.deleteJournalEntry(req.params.id);
    res.json({ ok: true });
  });

  // Ledger
  app.get("/api/ledger", requireAuth, async (req: any, res) => {
    const ledger = await storage.getLedger(req.session.userId);
    res.json(ledger);
  });

  // Trial balance
  app.get("/api/trial-balance", requireAuth, async (req: any, res) => {
    const balance = await storage.getTrialBalance(req.session.userId);
    res.json(balance);
  });

  // Teacher audit: view student's work (read-only)
  app.get("/api/audit/students/:studentId/journal", requireRole("teacher", "admin"), async (req: any, res) => {
    const student = await storage.getUser(req.params.studentId);
    if (!student || student.role !== "student") return res.status(404).json({ message: "Alumno no encontrado" });
    if (req.user.role === "teacher" && student.createdBy !== req.user.id) {
      return res.status(403).json({ message: "Sin acceso a este alumno" });
    }
    const entries = await storage.getJournalEntries(req.params.studentId);
    res.json(entries);
  });

  app.get("/api/audit/students/:studentId/ledger", requireRole("teacher", "admin"), async (req: any, res) => {
    const student = await storage.getUser(req.params.studentId);
    if (!student || student.role !== "student") return res.status(404).json({ message: "Alumno no encontrado" });
    if (req.user.role === "teacher" && student.createdBy !== req.user.id) {
      return res.status(403).json({ message: "Sin acceso a este alumno" });
    }
    const ledger = await storage.getLedger(req.params.studentId);
    res.json(ledger);
  });

  app.get("/api/audit/students/:studentId/trial-balance", requireRole("teacher", "admin"), async (req: any, res) => {
    const student = await storage.getUser(req.params.studentId);
    if (!student || student.role !== "student") return res.status(404).json({ message: "Alumno no encontrado" });
    if (req.user.role === "teacher" && student.createdBy !== req.user.id) {
      return res.status(403).json({ message: "Sin acceso a este alumno" });
    }
    const balance = await storage.getTrialBalance(req.params.studentId);
    res.json(balance);
  });

  return httpServer;
}
