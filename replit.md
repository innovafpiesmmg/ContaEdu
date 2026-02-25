# ContaEdu - Simulador Contable Educativo

## Overview
Educational accounting simulator for Spanish vocational training (CFGM/CFGS). Built with Node.js, Express, PostgreSQL, React, and TypeScript.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + Shadcn UI components
- **Backend**: Express.js with session-based authentication (bcryptjs)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based with bcrypt password hashing, 3 roles (admin, teacher, student)
- **Email**: Nodemailer for password recovery emails (SMTP configurable from admin panel)

## User Roles
- **Admin**: Manages school years, tax regime (IVA/IGIC), creates teacher accounts, configures mail server
- **Teacher**: Creates courses, students, exercises, exams; reviews student submissions with feedback/grades; imports exercises/exams from MD files; manages own password/email
- **Student**: Registers journal entries, views ledger/trial balance/PGC, submits exercises for review, takes timed exams, accesses manual and analytical accounting; manages own password/email

## Default Credentials
- Admin: `admin` / `admin123` (change via console script)
- Teacher: `mgarcia` / `prof123`  
- Students: `jperez`, `alopez`, `cmartin` / `alumno123`

## Key Files
- `shared/schema.ts` - All data models and types
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database operations
- `server/seed.ts` - Initial data seeding
- `server/db.ts` - Database connection
- `server/mail.ts` - Email sending utility (nodemailer)
- `client/src/App.tsx` - Main app with role-based routing
- `client/src/lib/auth.tsx` - Auth context provider
- `client/src/lib/exercise-context.tsx` - Exercise selection context
- `client/src/pages/teacher/course-exercises.tsx` - Course-specific exercise management (per course view)
- `client/src/pages/profile.tsx` - User profile (password change, email)
- `client/src/pages/reset-password.tsx` - Password reset page
- `scripts/change-admin-password.ts` - Console script for admin password

## API Routes
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register` - Student self-registration with enrollment code
- `POST /api/auth/change-password` - Change password (teachers/students only)
- `POST /api/auth/update-email` - Update user email
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `GET/POST /api/school-years` - School year CRUD
- `GET/PATCH /api/config` - Tax regime config
- `GET/PATCH /api/config/mail` - Mail server SMTP config (admin only)
- `GET/POST /api/users/teachers` - Teacher management
- `GET/POST /api/users/students` - Student management
- `GET/POST /api/courses` - Course management
- `GET/POST /api/accounts` - Chart of accounts (PGC)
- `GET/POST /api/exercises` - Exercise management (shared repository, all teachers see all)
- `GET /api/courses/:courseId/exercises` - Get exercises assigned to a specific course
- `GET /api/exercises/:id/courses` - Get assigned course IDs for exercise
- `POST /api/exercises/:id/assign` - Assign exercise to course
- `POST /api/exercises/:id/unassign` - Unassign exercise from course
- `GET/POST /api/journal-entries` - Journal entries
- `GET /api/ledger` - Ledger (Libro Mayor)
- `GET /api/trial-balance` - Trial balance
- `GET/POST /api/exams` - Exam management
- `PATCH /api/exams/:id` - Toggle exam active
- `POST /api/exams/:examId/start` - Student starts exam
- `POST /api/exams/:examId/submit` - Student submits exam
- `GET /api/submissions` - Student's submissions list
- `GET /api/submissions/exercise/:exerciseId` - Submissions for an exercise
- `POST /api/submissions/:exerciseId/submit` - Student submits exercise
- `POST /api/submissions/:id/review` - Teacher reviews with feedback/grade
- `GET/POST/DELETE /api/exercises/:id/solution` - Teacher manages exercise solutions (MD-based)
- `GET /api/exercises/:id/student-solution` - Student views solution (only if reviewed)
- `GET /api/audit/students/:id/journal|ledger|trial-balance` - Teacher audit

## Password Management
- Teachers and students can change their password from "Mi Perfil" in the sidebar
- Admin password can only be changed via console: `npx tsx scripts/change-admin-password.ts <nueva_contraseña>`
- Password recovery via email requires SMTP configuration in admin panel (Configuración > Servidor de Correo)
- Password reset tokens expire after 2 hours and are single-use
- Users need an email address registered to use password recovery

## Shared Exercise Repository
- Exercises are a shared library accessible by all teachers
- Exercises are NOT tied to a specific course; they use a junction table (`course_exercises`) for course assignment
- Teachers can assign any exercise to any of their courses using the link icon in the exercise card
- Students see only exercises assigned to their course via `course_exercises`
- Each exercise tracks its creator via `teacherId` for attribution

## Exercise Submission Flow
1. Student works on exercise (journal entries)
2. Student clicks "Entregar ejercicio" with confirmation dialog
3. Teacher sees submissions in exercises page (eye icon)
4. Teacher clicks "Corregir" to add grade (0-10) and feedback
5. Student sees feedback and grade on their exercises page

## Exercise Classification & Collections
- Exercises can have a `recommendedLevel` (cfgm/cfgs) shown as blue badge on cards
- Exercises can have a `customAccountPlan` (PDF file) downloadable by students from journal page
- Teachers can create collections to organize exercises (many-to-many relationship)
- Collection badges (amber) shown on exercise cards; collection management via dialog
- Teacher exercises page has search bar (title/description), filter dropdowns (type/level/collection/pending)
- API: `GET/POST/PATCH/DELETE /api/collections`, `POST/DELETE /api/collections/:id/exercises/:exerciseId`
- API: `GET /api/exercises/:id/collections`, `PATCH /api/exercises/:id` (update level etc.)
- API: `POST/GET/DELETE /api/exercises/:id/account-plan` (PDF upload/serve/delete)
- Schema tables: `exerciseCollections`, `collectionExercises` (junction)

## MD Import Templates
### Exercise Template Format
Each exercise can describe multiple accounting entries (asientos) within a single exercise. Solutions can optionally be included inline using `## Solución` with `### Asiento N` sub-headers containing Markdown tables.
```md
# Ejercicio: Title

**Tipo:** practice|guided
**Nivel:** cfgm|cfgs

## Descripción
Description with multiple operations to record:
1. First operation...
2. Second operation...

## Solución

### Asiento 1: Description
Fecha: 2024-01-15
**Puntos:** 5

La empresa compra mercaderías por 5.000€. Pago pendiente al proveedor.

| Cuenta | Debe | Haber |
|--------|------|-------|
| 600 Compras de mercaderías | 5.000,00 | |
| 400 Proveedores | | 5.000,00 |

### Asiento 2: Description
Fecha: 2024-01-20
**Puntos:** 5

Venta de mercaderías a un cliente por 8.000€. Cobro pendiente.

| Cuenta | Debe | Haber |
|--------|------|-------|
| 430 Clientes | 8.000,00 | |
| 700 Ventas de mercaderías | | 8.000,00 |

---
(separator between exercises)
```

### Exam Template Format
Exams can optionally include `**Ejercicio:**` to link to an existing exercise, or include an inline `## Solución` with `### Asiento N:` blocks (with optional `**Puntos:** N` per entry). When a solution is included but no matching exercise is found, the importer auto-creates an exercise with the solution and assigns it to the selected course.
```md
# Examen: Title

**Duración:** 60

## Descripción
Exam description with operations to record...

## Instrucciones
Instructions for students...

## Solución

### Asiento 1: Description
**Puntos:** 2,5

La empresa compra mercaderías por 3.000€ + IVA 21%. Pago pendiente.

| Cuenta | Debe | Haber |
|--------|------|-------|
| 600 Compras de mercaderías | 3.000,00 | |
| 472 H.P. IVA soportado | 630,00 | |
| 400 Proveedores | | 3.630,00 |

### Asiento 2: Description
**Puntos:** 2,5

Venta de mercaderías por 2.000€ + IVA 21%. Cobro pendiente a 60 días.

| Cuenta | Debe | Haber |
|--------|------|-------|
| 430 Clientes | 2.420,00 | |
| 700 Ventas de mercaderías | | 2.000,00 |
| 477 H.P. IVA repercutido | | 420,00 |
```

## Running
- `npm run dev` starts both frontend and backend on port 5000
- `npm run db:push` syncs database schema (development)
- `npx drizzle-kit generate` generates migration files from schema changes
- `npx drizzle-kit migrate` applies migrations (production/CI, non-interactive)
- `npx tsx scripts/change-admin-password.ts <password>` changes admin password

## Language
- UI is in Spanish (target audience: Spanish vocational training students)
