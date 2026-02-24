# ContaEdu - Simulador Contable Educativo

## Overview
Educational accounting simulator for Spanish vocational training (CFGM/CFGS). Built with Node.js, Express, PostgreSQL, React, and TypeScript.

## Architecture
- **Frontend**: React + Vite + TailwindCSS + Shadcn UI components
- **Backend**: Express.js with session-based authentication (bcryptjs)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based with bcrypt password hashing, 3 roles (admin, teacher, student)

## User Roles
- **Admin**: Manages school years, tax regime (IVA/IGIC), creates teacher accounts
- **Teacher**: Creates courses, students, exercises, exams; reviews student submissions with feedback/grades; imports exercises/exams from MD files
- **Student**: Registers journal entries, views ledger/trial balance/PGC, submits exercises for review, takes timed exams, accesses manual and analytical accounting

## Default Credentials
- Admin: `admin` / `admin123`
- Teacher: `mgarcia` / `prof123`  
- Students: `jperez`, `alopez`, `cmartin` / `alumno123`

## Key Files
- `shared/schema.ts` - All data models and types
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database operations
- `server/seed.ts` - Initial data seeding
- `server/db.ts` - Database connection
- `client/src/App.tsx` - Main app with role-based routing
- `client/src/lib/auth.tsx` - Auth context provider
- `client/src/lib/exercise-context.tsx` - Exercise selection context

## API Routes
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/register` - Student self-registration with enrollment code
- `GET/POST /api/school-years` - School year CRUD
- `GET/PATCH /api/config` - Tax regime config
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

## Exercise Submission Flow
1. Student works on exercise (journal entries)
2. Student clicks "Entregar ejercicio" with confirmation dialog
3. Teacher sees submissions in exercises page (eye icon)
4. Teacher clicks "Corregir" to add grade (0-10) and feedback
5. Student sees feedback and grade on their exercises page

## MD Import Templates
### Exercise Template Format
```md
# Ejercicio: Title

**Tipo:** practice|guided

## Descripcion
Exercise description text...

---
(separator between exercises)
```

### Exam Template Format
```md
# Examen: Title

**Duracion:** 60
**Ejercicio:** Exercise title to link

## Descripcion
Exam description...

## Instrucciones
Instructions for students...

---
```

## Running
- `npm run dev` starts both frontend and backend on port 5000
- `npm run db:push` syncs database schema

## Language
- UI is in Spanish (target audience: Spanish vocational training students)
