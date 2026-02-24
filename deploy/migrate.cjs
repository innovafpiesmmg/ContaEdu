const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email text");
    console.log("  [OK] users.email");

    await client.query(`CREATE TABLE IF NOT EXISTS mail_config (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      smtp_host text NOT NULL DEFAULT '',
      smtp_port integer NOT NULL DEFAULT 587,
      smtp_user text NOT NULL DEFAULT '',
      smtp_password text NOT NULL DEFAULT '',
      smtp_from text NOT NULL DEFAULT '',
      smtp_secure boolean NOT NULL DEFAULT false
    )`);
    console.log("  [OK] mail_config");

    await client.query(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL,
      token_hash text NOT NULL,
      expires_at text NOT NULL,
      used_at text
    )`);
    console.log("  [OK] password_reset_tokens");

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
