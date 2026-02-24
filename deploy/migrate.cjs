const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = [
  {
    name: "add_email_to_users",
    check: "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='email'",
    sql: "ALTER TABLE users ADD COLUMN IF NOT EXISTS email text"
  },
  {
    name: "create_mail_config",
    check: "SELECT to_regclass('public.mail_config')",
    sql: `CREATE TABLE IF NOT EXISTS mail_config (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      smtp_host text DEFAULT '',
      smtp_port integer DEFAULT 587,
      smtp_user text DEFAULT '',
      smtp_password text DEFAULT '',
      smtp_from text DEFAULT '',
      smtp_secure boolean DEFAULT false
    )`
  },
  {
    name: "create_password_reset_tokens",
    check: "SELECT to_regclass('public.password_reset_tokens')",
    sql: `CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL,
      token_hash text NOT NULL,
      expires_at timestamp NOT NULL,
      used boolean DEFAULT false
    )`
  }
];

async function run() {
  const client = await pool.connect();
  try {
    for (const m of migrations) {
      const result = await client.query(m.check);
      const exists = result.rows.length > 0 && result.rows[0][Object.keys(result.rows[0])[0]] !== null;
      if (exists) {
        console.log(`  [OK] ${m.name} (ya existe)`);
      } else {
        await client.query(m.sql);
        console.log(`  [+] ${m.name} (aplicada)`);
      }
    }
    console.log("Migraciones completadas.");
  } catch (err) {
    console.error("Error en migración:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
