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
- `GET/POST /api/exercises` - Exercise management
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
- `GET /api/audit/students/:id/journal|ledger|trial-balance` - Teacher audit

## Password Management
- Teachers and students can change their password from "Mi Perfil" in the sidebar
- Admin password can only be changed via console: `npx tsx scripts/change-admin-password.ts <nueva_contraseña>`
- Password recovery via email requires SMTP configuration in admin panel (Configuración > Servidor de Correo)
- Password reset tokens expire after 2 hours and are single-use
- Users need an email address registered to use password recovery

## Exercise Submission Flow
1. Student works on exercise (journal entries)
2. Student clicks "Entregar ejercicio" with confirmation dialog
3. Teacher sees submissions in exercises page (eye icon)
4. Teacher clicks "Corregir" to add grade (0-10) and feedback
5. Student sees feedback and grade on their exercises page

## MD Import Templates
### Exercise Template Format
Each exercise can describe multiple accounting entries (asientos) within a single exercise.
```md
# Ejercicio: Title

**Tipo:** practice|guided

## Descripción
Description with multiple operations to record:
1. First operation...
2. Second operation...
3. Third operation...

---
(separator between exercises)
```

### Exam Template Format
```md
# Examen: Title

**Duración:** 60
**Ejercicio:** Exercise title to link

## Descripción
Exam description...

## Instrucciones
Instructions for students...

---
```

## Running
- `npm run dev` starts both frontend and backend on port 5000
- `npm run db:push` syncs database schema (development)
- `npx drizzle-kit generate` generates migration files from schema changes
- `npx drizzle-kit migrate` applies migrations (production/CI, non-interactive)
- `npx tsx scripts/change-admin-password.ts <password>` changes admin password

## Language
- UI is in Spanish (target audience: Spanish vocational training students)
