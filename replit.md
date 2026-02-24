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
- **Teacher**: Creates courses, students, exercises
- **Student**: Registers journal entries, views ledger (Libro Mayor), trial balance (Balance de Comprobación), chart of accounts (PGC)

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

## API Routes
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `POST /api/auth/logout` - Logout
- `GET/POST /api/school-years` - School year CRUD
- `GET/PATCH /api/config` - Tax regime config
- `GET/POST /api/users/teachers` - Teacher management
- `GET/POST /api/users/students` - Student management
- `GET/POST /api/courses` - Course management
- `GET /api/accounts` - Chart of accounts (PGC)
- `GET/POST /api/exercises` - Exercise management
- `GET/POST /api/journal-entries` - Journal entries
- `GET /api/ledger` - Ledger (Libro Mayor)
- `GET /api/trial-balance` - Trial balance

## Running
- `npm run dev` starts both frontend and backend on port 5000
- `npm run db:push` syncs database schema

## Language
- UI is in Spanish (target audience: Spanish vocational training students)
