import bcrypt from "bcryptjs";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error("Uso: npx tsx scripts/change-admin-password.ts <nueva_contraseña>");
    console.error("Ejemplo: npx tsx scripts/change-admin-password.ts MiNuevaContraseña123");
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error("Error: La contraseña debe tener al menos 6 caracteres");
    process.exit(1);
  }

  try {
    const [admin] = await db.select().from(users).where(eq(users.role, "admin" as any));

    if (!admin) {
      console.error("Error: No se encontró ningún usuario administrador");
      process.exit(1);
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ password: hashed }).where(eq(users.id, admin.id));

    console.log(`Contraseña del administrador "${admin.username}" actualizada correctamente.`);
    process.exit(0);
  } catch (err: any) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

main();
