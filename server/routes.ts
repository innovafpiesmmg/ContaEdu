import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { examAttempts } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { sendPasswordResetEmail } from "./mail";
import multer from "multer";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "documents");
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const documentUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten archivos PDF e imágenes (JPG, PNG, WEBP)"));
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
    ) WITH (OIDS=FALSE);
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `);

  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: false }),
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
        if (err) {
          console.error("Session save error:", err);
        }
        const { password: _, ...safe } = user;
        res.json(safe);
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, fullName, enrollmentCode, email } = req.body;
      if (!username || !password || !fullName || !enrollmentCode) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      }
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "El nombre de usuario ya existe" });
      }
      const course = await storage.getCourseByEnrollmentCode(enrollmentCode);
      if (!course) {
        return res.status(400).json({ message: "Código de matriculación no válido" });
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashed,
        fullName,
        email: email || null,
        role: "student",
        courseId: course.id,
        createdBy: course.teacherId,
      });
      req.session.userId = user.id;
      req.session.save((err: any) => {
        if (err) console.error("Session save error:", err);
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

  app.post("/api/auth/change-password", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(401).json({ message: "No autenticado" });
      if (user.role === "admin") {
        return res.status(403).json({ message: "El administrador debe cambiar su contraseña desde la consola del servidor" });
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Todos los campos son obligatorios" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "La nueva contraseña debe tener al menos 6 caracteres" });
      }
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) {
        return res.status(400).json({ message: "La contraseña actual es incorrecta" });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashed);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/update-email", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) return res.status(401).json({ message: "No autenticado" });
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "El correo es obligatorio" });
      await storage.updateUserEmail(user.id, email);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "El correo electrónico es obligatorio" });

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ ok: true, message: "Si el correo existe, recibirás un enlace de recuperación" });
      }
      if (user.role === "admin") {
        return res.json({ ok: true, message: "Si el correo existe, recibirás un enlace de recuperación" });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      await storage.createPasswordResetToken({ userId: user.id, tokenHash, expiresAt });

      let baseUrl: string;
      if (process.env.APP_DOMAIN) {
        const domain = process.env.APP_DOMAIN.replace(/^https?:\/\//, "");
        const scheme = process.env.FORCE_HTTP === "true" ? "http" : "https";
        baseUrl = `${scheme}://${domain}`;
      } else {
        const protocol = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers["x-forwarded-host"] || req.headers.host;
        baseUrl = `${protocol}://${host}`;
      }

      const sent = await sendPasswordResetEmail(user.email!, token, baseUrl);
      if (!sent) {
        return res.status(500).json({ message: "No se pudo enviar el correo. Contacta al administrador para que configure el servidor de correo." });
      }

      res.json({ ok: true, message: "Si el correo existe, recibirás un enlace de recuperación" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Datos incompletos" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      }

      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const resetToken = await storage.getPasswordResetToken(tokenHash);

      if (!resetToken) {
        return res.status(400).json({ message: "Enlace de recuperación no válido" });
      }
      if (resetToken.usedAt) {
        return res.status(400).json({ message: "Este enlace ya ha sido utilizado" });
      }
      if (new Date(resetToken.expiresAt) < new Date()) {
        return res.status(400).json({ message: "Este enlace ha expirado. Solicita uno nuevo." });
      }

      const hashed = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(resetToken.userId, hashed);
      await storage.markTokenUsed(resetToken.id);

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Mail config (admin only)
  app.get("/api/config/mail", requireRole("admin"), async (_req, res) => {
    const config = await storage.getMailConfig();
    res.json({ ...config, smtpPassword: config.smtpPassword ? "••••••••" : "" });
  });

  app.patch("/api/config/mail", requireRole("admin"), async (req, res) => {
    try {
      const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom, smtpSecure } = req.body;
      const updateData: any = {};
      if (smtpHost !== undefined) updateData.smtpHost = smtpHost;
      if (smtpPort !== undefined) updateData.smtpPort = smtpPort;
      if (smtpUser !== undefined) updateData.smtpUser = smtpUser;
      if (smtpPassword !== undefined && smtpPassword !== "" && smtpPassword !== "••••••••") updateData.smtpPassword = smtpPassword;
      if (smtpFrom !== undefined) updateData.smtpFrom = smtpFrom;
      if (smtpSecure !== undefined) updateData.smtpSecure = smtpSecure;

      const updated = await storage.updateMailConfig(updateData);
      res.json({ ...updated, smtpPassword: updated.smtpPassword ? "••••••••" : "" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
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
      const { fullName, username, password, email } = req.body;
      if (!fullName || !username || !password) return res.status(400).json({ message: "Faltan campos obligatorios" });
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(400).json({ message: "El usuario ya existe" });
      const hashed = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        fullName, username, password: hashed, role: "teacher", createdBy: req.user.id, email: email || null,
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

    const courseIdFilter = req.query.courseId as string | undefined;

    let students: any[];
    if (user.role === "admin") {
      if (courseIdFilter) {
        students = await storage.getUsersByCourse(courseIdFilter);
      } else {
        students = await storage.getUsersByRole("student");
      }
    } else if (user.role === "teacher") {
      if (courseIdFilter) {
        const course = await storage.getCourseById(courseIdFilter);
        if (course && course.teacherId === user.id) {
          students = await storage.getUsersByCourse(courseIdFilter);
        } else {
          students = [];
        }
      } else {
        students = await storage.getUsersByTeacher(user.id, "student");
      }
    } else {
      students = [];
    }
    res.json(students.map(({ password: _, ...s }: any) => s));
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

  // Accounts - Download CSV
  app.get("/api/accounts/download", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "No autenticado" });
    let accs;
    if (user.role === "student") {
      accs = await storage.getAccountsForUser(user.id);
    } else {
      accs = await storage.getAccounts();
    }
    accs.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    const typeLabels: Record<string, string> = {
      asset: "Activo",
      liability: "Pasivo",
      equity: "Patrimonio Neto",
      income: "Ingreso",
      expense: "Gasto",
    };
    const groupNames: Record<string, string> = {
      "1": "Financiación Básica",
      "2": "Activo No Corriente",
      "3": "Existencias",
      "4": "Acreedores y Deudores",
      "5": "Cuentas Financieras",
      "6": "Compras y Gastos",
      "7": "Ventas e Ingresos",
    };
    const BOM = "\uFEFF";
    const header = "Código;Nombre;Tipo;Grupo";
    const rows = accs.map(a => {
      const g = a.code.charAt(0);
      const escapeCsv = (v: string) => `"${v.replace(/"/g, '""')}"`;
      return `${escapeCsv(a.code)};${escapeCsv(a.name)};${escapeCsv(typeLabels[a.accountType] || a.accountType)};${escapeCsv(groupNames[g] || "Otros")}`;
    });
    const csv = BOM + header + "\n" + rows.join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"plan_de_cuentas.csv\"");
    res.send(csv);
  });

  // Accounts
  app.get("/api/accounts", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "No autenticado" });
    if (user.role === "student") {
      const accs = await storage.getAccountsForUser(user.id);
      res.json(accs);
    } else {
      const accs = await storage.getAccounts();
      res.json(accs);
    }
  });

  app.post("/api/accounts", requireRole("student"), async (req: any, res) => {
    try {
      const { code, name, accountType } = req.body;
      if (!code || !name || !accountType) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
      }
      const existing = await storage.getAccountsForUser(req.user.id);
      if (existing.find(a => a.code === code)) {
        return res.status(400).json({ message: `Ya existe una cuenta con el código ${code}` });
      }
      const account = await storage.createAccount({
        code,
        name,
        accountType,
        isSystem: false,
        userId: req.user.id,
      });
      res.json(account);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/accounts/:id", requireRole("student"), async (req: any, res) => {
    await storage.deleteAccount(req.params.id, req.user.id);
    res.json({ ok: true });
  });

  // Exercises (shared repository - all teachers see all exercises)
  app.get("/api/exercises", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "No autenticado" });

    if (user.role === "teacher" || user.role === "admin") {
      res.json(await storage.getExercises());
    } else if (user.role === "student" && user.courseId) {
      const courseExercises = await storage.getExercisesForCourse(user.courseId);
      const courseExams = await storage.getExamsByCourse(user.courseId);
      const examExerciseIds = new Set(courseExams.map(e => e.exerciseId).filter(Boolean));
      res.json(courseExercises.filter(e => !examExerciseIds.has(e.id)));
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

  // Course-exercise assignment
  app.get("/api/exercises/:id/courses", requireRole("teacher"), async (req: any, res) => {
    const courseIds = await storage.getAssignedCourseIds(req.params.id);
    res.json(courseIds);
  });

  app.post("/api/exercises/:id/assign", requireRole("teacher"), async (req: any, res) => {
    try {
      const { courseId } = req.body;
      if (!courseId) return res.status(400).json({ message: "Falta el ID del curso" });
      const result = await storage.assignExerciseToCourse(courseId, req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/exercises/:id/unassign", requireRole("teacher"), async (req: any, res) => {
    try {
      const { courseId } = req.body;
      if (!courseId) return res.status(400).json({ message: "Falta el ID del curso" });
      await storage.unassignExerciseFromCourse(courseId, req.params.id);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Exercise documents (PDF uploads) - require authentication to access files
  app.use("/uploads/documents", requireAuth, express.static(UPLOADS_DIR));

  app.get("/api/exercises/:id/documents", requireAuth, async (req: any, res) => {
    const docs = await storage.getExerciseDocuments(req.params.id);
    res.json(docs);
  });

  app.post("/api/exercises/:id/documents", requireRole("teacher"), documentUpload.array("files", 10), async (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) return res.status(400).json({ message: "No se han subido archivos" });

      const existingDocs = await storage.getExerciseDocuments(req.params.id);
      let sortOrder = existingDocs.length;

      const results = [];
      for (const file of files) {
        const doc = await storage.addExerciseDocument({
          exerciseId: req.params.id,
          fileName: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          sortOrder: sortOrder++,
        });
        results.push(doc);
      }
      res.json(results);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/exercises/:exerciseId/documents/:docId", requireRole("teacher"), async (req: any, res) => {
    try {
      const docs = await storage.getExerciseDocuments(req.params.exerciseId);
      const doc = docs.find(d => d.id === req.params.docId);
      if (doc) {
        const filePath = path.join(UPLOADS_DIR, doc.fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await storage.deleteExerciseDocument(doc.id);
      }
      res.json({ ok: true });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Exercise solutions
  app.get("/api/exercises/:id/solution", requireRole("teacher"), async (req: any, res) => {
    const allExercises = await storage.getExercises();
    const exercise = allExercises.find(e => e.id === req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Ejercicio no encontrado" });
    }
    res.json({ solution: exercise.solution ? JSON.parse(exercise.solution) : null });
  });

  app.post("/api/exercises/:id/solution", requireRole("teacher"), async (req: any, res) => {
    try {
      const allExercises = await storage.getExercises();
      const exercise = allExercises.find(e => e.id === req.params.id);
      if (!exercise) {
        return res.status(404).json({ message: "Ejercicio no encontrado" });
      }
      const { entries } = req.body;
      if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ message: "La solución debe contener al menos un asiento" });
      }
      for (const entry of entries) {
        if (!entry.description || !entry.lines || !Array.isArray(entry.lines) || entry.lines.length < 2) {
          return res.status(400).json({ message: "Cada asiento debe tener descripción y al menos 2 líneas" });
        }
        for (const line of entry.lines) {
          if (!line.accountCode || !line.accountName) {
            return res.status(400).json({ message: "Cada línea debe tener código y nombre de cuenta" });
          }
        }
      }
      const updated = await storage.updateExerciseSolution(req.params.id, JSON.stringify(entries));
      res.json({ ok: true, solution: JSON.parse(updated.solution!) });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/exercises/:id/solution", requireRole("teacher"), async (req: any, res) => {
    const allExercises = await storage.getExercises();
    const exercise = allExercises.find(e => e.id === req.params.id);
    if (!exercise) {
      return res.status(404).json({ message: "Ejercicio no encontrado" });
    }
    await storage.updateExerciseSolution(req.params.id, null);
    res.json({ ok: true });
  });

  // Student solution access (only for reviewed exercises)
  app.get("/api/exercises/:id/student-solution", requireRole("student"), async (req: any, res) => {
    try {
      const exerciseId = req.params.id;
      const submission = await storage.getExerciseSubmission(exerciseId, req.session.userId);
      if (!submission || submission.status !== "reviewed") {
        return res.status(403).json({ message: "Solo puedes ver la solución cuando tu ejercicio haya sido corregido" });
      }
      const exercisesList = await storage.getExercises();
      const exercise = exercisesList.find(e => e.id === exerciseId);
      if (!exercise || !exercise.solution) {
        return res.json({ solution: null });
      }
      res.json({ solution: JSON.parse(exercise.solution) });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/exercises/:id/tasks", requireAuth, async (req: any, res) => {
    try {
      const exerciseId = req.params.id;
      const allExercises = await storage.getExercises();
      const exercise = allExercises.find(e => e.id === exerciseId);
      if (!exercise || !exercise.solution) {
        return res.json({ tasks: [] });
      }
      const solution = JSON.parse(exercise.solution);
      const tasks = Array.isArray(solution)
        ? solution.map((entry: any) => ({
            entryNumber: entry.entryNumber,
            description: entry.description || "",
            enunciado: entry.enunciado || "",
            points: entry.points,
          }))
        : [];
      res.json({ tasks });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Journal entries - now exercise-scoped
  app.get("/api/journal-entries", requireAuth, async (req: any, res) => {
    const exerciseId = req.query.exerciseId as string | undefined;
    const entries = await storage.getJournalEntries(req.session.userId, exerciseId);
    res.json(entries);
  });

  app.post("/api/journal-entries", requireRole("student"), async (req: any, res) => {
    try {
      const { date, description, lines, exerciseId } = req.body;
      if (!exerciseId) {
        return res.status(400).json({ message: "Debes seleccionar un ejercicio" });
      }
      if (!date || !description || !lines || !Array.isArray(lines) || lines.length < 2) {
        return res.status(400).json({ 
          message: `El asiento debe tener al menos 2 líneas (recibidas: ${Array.isArray(lines) ? lines.length : 0})` 
        });
      }

      const totalDebit = lines.reduce((s: number, l: any) => s + parseFloat(l.debit || 0), 0);
      const totalCredit = lines.reduce((s: number, l: any) => s + parseFloat(l.credit || 0), 0);
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({ message: "El asiento no está cuadrado" });
      }

      const entryNumber = await storage.getNextEntryNumber(req.user.id, exerciseId);
      const entry = await storage.createJournalEntry(
        { entryNumber, date, description, userId: req.user.id, exerciseId: exerciseId || null },
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

  // Ledger - now exercise-scoped
  app.get("/api/ledger", requireAuth, async (req: any, res) => {
    const exerciseId = req.query.exerciseId as string | undefined;
    const ledger = await storage.getLedger(req.session.userId, exerciseId);
    res.json(ledger);
  });

  // Trial balance - now exercise-scoped
  app.get("/api/trial-balance", requireAuth, async (req: any, res) => {
    const exerciseId = req.query.exerciseId as string | undefined;
    const balance = await storage.getTrialBalance(req.session.userId, exerciseId);
    res.json(balance);
  });

  // Teacher audit: view student's work (read-only)
  app.get("/api/audit/students/:studentId/journal", requireRole("teacher", "admin"), async (req: any, res) => {
    const student = await storage.getUser(req.params.studentId);
    if (!student || student.role !== "student") return res.status(404).json({ message: "Alumno no encontrado" });
    if (req.user.role === "teacher" && student.createdBy !== req.user.id) {
      return res.status(403).json({ message: "Sin acceso a este alumno" });
    }
    const exerciseId = req.query.exerciseId as string | undefined;
    const entries = await storage.getJournalEntries(req.params.studentId, exerciseId);
    res.json(entries);
  });

  app.get("/api/audit/students/:studentId/ledger", requireRole("teacher", "admin"), async (req: any, res) => {
    const student = await storage.getUser(req.params.studentId);
    if (!student || student.role !== "student") return res.status(404).json({ message: "Alumno no encontrado" });
    if (req.user.role === "teacher" && student.createdBy !== req.user.id) {
      return res.status(403).json({ message: "Sin acceso a este alumno" });
    }
    const exerciseId = req.query.exerciseId as string | undefined;
    const ledger = await storage.getLedger(req.params.studentId, exerciseId);
    res.json(ledger);
  });

  app.get("/api/audit/students/:studentId/trial-balance", requireRole("teacher", "admin"), async (req: any, res) => {
    const student = await storage.getUser(req.params.studentId);
    if (!student || student.role !== "student") return res.status(404).json({ message: "Alumno no encontrado" });
    if (req.user.role === "teacher" && student.createdBy !== req.user.id) {
      return res.status(403).json({ message: "Sin acceso a este alumno" });
    }
    const exerciseId = req.query.exerciseId as string | undefined;
    const balance = await storage.getTrialBalance(req.params.studentId, exerciseId);
    res.json(balance);
  });

  // Exercise submissions - Student marks exercise as finished
  app.get("/api/submissions", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "No autenticado" });
    if (user.role === "student") {
      const subs = await storage.getExerciseSubmissionsByStudent(user.id);
      res.json(subs);
    } else {
      res.json([]);
    }
  });

  app.get("/api/submissions/pending-counts", requireRole("teacher"), async (req: any, res) => {
    try {
      const counts = await storage.getPendingSubmissionCounts();
      res.json(counts);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/submissions/exercise/:exerciseId", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "No autenticado" });
    if (user.role === "teacher") {
      const subs = await storage.getExerciseSubmissionsByExercise(req.params.exerciseId);
      const enriched = [];
      for (const s of subs) {
        const student = await storage.getUser(s.studentId);
        enriched.push({ ...s, studentName: student?.fullName || "Desconocido", studentUsername: student?.username || "" });
      }
      res.json(enriched);
    } else if (user.role === "student") {
      const sub = await storage.getExerciseSubmission(req.params.exerciseId, user.id);
      res.json(sub ? [sub] : []);
    } else {
      res.json([]);
    }
  });

  app.post("/api/submissions/:exerciseId/submit", requireRole("student"), async (req: any, res) => {
    try {
      const exercise = await storage.getExercises();
      const ex = exercise.find(e => e.id === req.params.exerciseId);
      if (!ex) return res.status(404).json({ message: "Ejercicio no encontrado" });
      const hasAccess = req.user.courseId ? await storage.isExerciseAssignedToCourse(req.params.exerciseId, req.user.courseId) : false;
      if (!hasAccess) return res.status(403).json({ message: "Sin acceso a este ejercicio" });

      const existing = await storage.getExerciseSubmission(req.params.exerciseId, req.user.id);
      if (existing && (existing.status === "submitted" || existing.status === "reviewed")) {
        return res.status(400).json({ message: "Este ejercicio ya ha sido entregado" });
      }

      const sub = await storage.submitExercise(req.params.exerciseId, req.user.id);
      res.json(sub);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/submissions/:id/review", requireRole("teacher"), async (req: any, res) => {
    try {
      const { feedback, grade } = req.body;
      if (!feedback) return res.status(400).json({ message: "La retroalimentacion es obligatoria" });
      const updated = await storage.reviewExercise(req.params.id, feedback, grade || null, req.user.id);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Exams - Teacher management
  app.get("/api/exams", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "No autenticado" });

    if (user.role === "teacher") {
      const examList = await storage.getExamsByTeacher(user.id);
      res.json(examList);
    } else if (user.role === "student" && user.courseId) {
      const examList = await storage.getExamsByCourse(user.courseId);
      const activeExams = examList.filter(e => e.isActive);
      res.json(activeExams);
    } else {
      res.json([]);
    }
  });

  app.get("/api/exams/:id", requireAuth, async (req: any, res) => {
    const exam = await storage.getExam(req.params.id);
    if (!exam) return res.status(404).json({ message: "Examen no encontrado" });
    res.json(exam);
  });

  app.post("/api/exams", requireRole("teacher"), async (req: any, res) => {
    try {
      const { title, description, instructions, exerciseId, courseId, durationMinutes, availableFrom, availableTo } = req.body;
      if (!title || !description || !exerciseId || !courseId) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
      }
      const exam = await storage.createExam({
        title,
        description,
        instructions: instructions || null,
        exerciseId,
        courseId,
        teacherId: req.user.id,
        durationMinutes: durationMinutes || 60,
        availableFrom: availableFrom || null,
        availableTo: availableTo || null,
        isActive: false,
      });
      res.json(exam);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.patch("/api/exams/:id", requireRole("teacher"), async (req: any, res) => {
    try {
      const exam = await storage.getExam(req.params.id);
      if (!exam) return res.status(404).json({ message: "Examen no encontrado" });
      if (exam.teacherId !== req.user.id) return res.status(403).json({ message: "Sin permisos" });
      const updated = await storage.updateExam(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/exams/:id", requireRole("teacher"), async (req: any, res) => {
    const exam = await storage.getExam(req.params.id);
    if (!exam) return res.status(404).json({ message: "Examen no encontrado" });
    if (exam.teacherId !== req.user.id) return res.status(403).json({ message: "Sin permisos" });
    await storage.deleteExam(req.params.id);
    res.json({ ok: true });
  });

  // Exam attempts - Student
  app.get("/api/exams/:examId/attempt", requireRole("student"), async (req: any, res) => {
    const exam = await storage.getExam(req.params.examId);
    if (!exam) return res.status(404).json({ message: "Examen no encontrado" });
    if (exam.courseId !== req.user.courseId) return res.status(403).json({ message: "Sin acceso a este examen" });
    const attempt = await storage.getExamAttempt(req.params.examId, req.user.id);
    if (attempt) {
      const start = new Date(attempt.startedAt).getTime();
      const elapsed = (Date.now() - start) / 1000 / 60;
      if (attempt.status === "in_progress" && elapsed > exam.durationMinutes) {
        const expired = await storage.submitExamAttempt(attempt.id);
        await db.update(examAttempts).set({ status: "expired" as any }).where(eq(examAttempts.id, attempt.id));
        return res.json({ ...expired, status: "expired" });
      }
    }
    res.json(attempt || null);
  });

  app.get("/api/exams/:examId/attempts", requireRole("teacher"), async (req: any, res) => {
    const exam = await storage.getExam(req.params.examId);
    if (!exam) return res.status(404).json({ message: "Examen no encontrado" });
    if (exam.teacherId !== req.user.id) return res.status(403).json({ message: "Sin permisos" });
    const attempts = await storage.getExamAttemptsByExam(req.params.examId);
    const enriched = [];
    for (const a of attempts) {
      const student = await storage.getUser(a.studentId);
      enriched.push({ ...a, studentName: student?.fullName || "Desconocido" });
    }
    res.json(enriched);
  });

  app.post("/api/exams/:examId/start", requireRole("student"), async (req: any, res) => {
    try {
      const exam = await storage.getExam(req.params.examId);
      if (!exam) return res.status(404).json({ message: "Examen no encontrado" });
      if (exam.courseId !== req.user.courseId) return res.status(403).json({ message: "Sin acceso a este examen" });
      if (!exam.isActive) return res.status(400).json({ message: "El examen no esta activo" });

      const existing = await storage.getExamAttempt(req.params.examId, req.user.id);
      if (existing) {
        if (existing.status === "submitted" || existing.status === "expired") {
          return res.status(400).json({ message: "Ya has entregado este examen" });
        }
        const start = new Date(existing.startedAt).getTime();
        const elapsed = (Date.now() - start) / 1000 / 60;
        if (elapsed > exam.durationMinutes) {
          await db.update(examAttempts).set({ status: "expired" as any, submittedAt: new Date().toISOString() }).where(eq(examAttempts.id, existing.id));
          return res.status(400).json({ message: "El tiempo del examen ha expirado" });
        }
        return res.json(existing);
      }

      const attempt = await storage.createExamAttempt({
        examId: req.params.examId,
        studentId: req.user.id,
        startedAt: new Date().toISOString(),
        status: "in_progress",
      });
      res.json(attempt);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/exams/:examId/submit", requireRole("student"), async (req: any, res) => {
    try {
      const exam = await storage.getExam(req.params.examId);
      if (!exam) return res.status(404).json({ message: "Examen no encontrado" });
      if (exam.courseId !== req.user.courseId) return res.status(403).json({ message: "Sin acceso a este examen" });

      const attempt = await storage.getExamAttempt(req.params.examId, req.user.id);
      if (!attempt) return res.status(404).json({ message: "No hay intento activo" });
      if (attempt.status === "submitted" || attempt.status === "expired") {
        return res.status(400).json({ message: "Ya entregado" });
      }

      const start = new Date(attempt.startedAt).getTime();
      const elapsed = (Date.now() - start) / 1000 / 60;
      const isExpired = elapsed > exam.durationMinutes;

      if (isExpired) {
        await db.update(examAttempts).set({ status: "expired" as any, submittedAt: new Date().toISOString() }).where(eq(examAttempts.id, attempt.id));
        return res.json({ ...attempt, status: "expired", submittedAt: new Date().toISOString() });
      }

      const submitted = await storage.submitExamAttempt(attempt.id);
      res.json(submitted);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  return httpServer;
}
