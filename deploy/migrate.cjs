const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function addColumnIfNotExists(client, table, column, definition) {
  const res = await client.query(
    "SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2",
    [table, column]
  );
  if (res.rows.length === 0) {
    await client.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`  [+] ${table}.${column}`);
  }
}

async function createEnumIfNotExists(client, name, values) {
  const res = await client.query(
    "SELECT 1 FROM pg_type WHERE typname=$1", [name]
  );
  if (res.rows.length === 0) {
    const vals = values.map(v => `'${v}'`).join(", ");
    await client.query(`CREATE TYPE ${name} AS ENUM(${vals})`);
    console.log(`  [+] enum ${name}`);
  }
}

async function run() {
  const client = await pool.connect();
  try {
    console.log("Verificando enums...");
    await createEnumIfNotExists(client, "user_role", ["admin", "teacher", "student"]);
    await createEnumIfNotExists(client, "tax_regime", ["iva", "igic"]);
    await createEnumIfNotExists(client, "exercise_type", ["guided", "practice"]);
    await createEnumIfNotExists(client, "account_type", ["asset", "liability", "equity", "income", "expense"]);
    await createEnumIfNotExists(client, "exam_status", ["not_started", "in_progress", "submitted", "expired"]);
    await createEnumIfNotExists(client, "submission_status", ["in_progress", "submitted", "reviewed"]);

    console.log("Verificando tablas...");

    await client.query(`CREATE TABLE IF NOT EXISTS school_years (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      active boolean NOT NULL DEFAULT false
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS system_config (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      tax_regime tax_regime NOT NULL DEFAULT 'iva'
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS users (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      username text NOT NULL UNIQUE,
      password text NOT NULL,
      full_name text NOT NULL,
      email text,
      role user_role NOT NULL DEFAULT 'student',
      course_id varchar,
      created_by varchar
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS courses (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      teacher_id varchar NOT NULL,
      school_year_id varchar NOT NULL,
      enrollment_code text UNIQUE
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS accounts (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      code text NOT NULL,
      name text NOT NULL,
      account_type account_type NOT NULL,
      parent_code text,
      is_system boolean NOT NULL DEFAULT false,
      user_id varchar
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS exercises (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text NOT NULL,
      exercise_type exercise_type NOT NULL DEFAULT 'practice',
      course_id varchar,
      teacher_id varchar NOT NULL,
      solution text
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS course_exercises (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id varchar NOT NULL,
      exercise_id varchar NOT NULL,
      UNIQUE(course_id, exercise_id)
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS journal_entries (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      entry_number integer NOT NULL,
      date text NOT NULL,
      description text NOT NULL,
      user_id varchar NOT NULL,
      exercise_id varchar
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS journal_lines (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      journal_entry_id varchar NOT NULL,
      account_code text NOT NULL,
      account_name text NOT NULL,
      debit numeric(12,2) NOT NULL DEFAULT '0',
      credit numeric(12,2) NOT NULL DEFAULT '0'
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS exams (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text NOT NULL,
      instructions text,
      exercise_id varchar NOT NULL,
      course_id varchar NOT NULL,
      teacher_id varchar NOT NULL,
      duration_minutes integer NOT NULL DEFAULT 60,
      available_from text,
      available_to text,
      is_active boolean NOT NULL DEFAULT false
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS exam_attempts (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      exam_id varchar NOT NULL,
      student_id varchar NOT NULL,
      started_at text NOT NULL,
      submitted_at text,
      status exam_status NOT NULL DEFAULT 'not_started'
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS exercise_submissions (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      exercise_id varchar NOT NULL,
      student_id varchar NOT NULL,
      status submission_status NOT NULL DEFAULT 'in_progress',
      submitted_at text,
      grade numeric(5,2),
      feedback text,
      reviewed_at text,
      reviewed_by varchar
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS mail_config (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      smtp_host text NOT NULL DEFAULT '',
      smtp_port integer NOT NULL DEFAULT 587,
      smtp_user text NOT NULL DEFAULT '',
      smtp_password text NOT NULL DEFAULT '',
      smtp_from text NOT NULL DEFAULT '',
      smtp_secure boolean NOT NULL DEFAULT false
    )`);

    await client.query(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL,
      token_hash text NOT NULL,
      expires_at text NOT NULL,
      used_at text
    )`);

    console.log("Verificando columnas nuevas...");
    await addColumnIfNotExists(client, "users", "email", "text");
    await addColumnIfNotExists(client, "users", "created_by", "varchar");
    await addColumnIfNotExists(client, "courses", "enrollment_code", "text UNIQUE");
    await addColumnIfNotExists(client, "journal_entries", "exercise_id", "varchar");
    await addColumnIfNotExists(client, "accounts", "user_id", "varchar");
    await addColumnIfNotExists(client, "exercises", "solution", "text");

    // Make exercises.course_id nullable (shared repository)
    await client.query(`ALTER TABLE exercises ALTER COLUMN course_id DROP NOT NULL`).catch(() => {});

    // Backfill course_exercises from existing exercises
    await client.query(`
      INSERT INTO course_exercises (id, course_id, exercise_id)
      SELECT gen_random_uuid(), e.course_id, e.id
      FROM exercises e
      WHERE e.course_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM course_exercises ce
        WHERE ce.course_id = e.course_id AND ce.exercise_id = e.id
      )
    `).catch(() => {});

    console.log("Migraciones completadas correctamente.");
  } catch (err) {
    console.error("Error en migración:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
