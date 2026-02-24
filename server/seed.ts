import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { accounts, users } from "@shared/schema";

const PGC_ACCOUNTS = [
  { code: "100", name: "Capital social", accountType: "equity" as const },
  { code: "112", name: "Reserva legal", accountType: "equity" as const },
  { code: "129", name: "Resultado del ejercicio", accountType: "equity" as const },
  { code: "170", name: "Deudas a largo plazo con entidades de crédito", accountType: "liability" as const },
  { code: "173", name: "Proveedores de inmovilizado a largo plazo", accountType: "liability" as const },
  { code: "200", name: "Investigación", accountType: "asset" as const },
  { code: "206", name: "Aplicaciones informáticas", accountType: "asset" as const },
  { code: "210", name: "Terrenos y bienes naturales", accountType: "asset" as const },
  { code: "211", name: "Construcciones", accountType: "asset" as const },
  { code: "213", name: "Maquinaria", accountType: "asset" as const },
  { code: "216", name: "Mobiliario", accountType: "asset" as const },
  { code: "217", name: "Equipos para procesos de información", accountType: "asset" as const },
  { code: "218", name: "Elementos de transporte", accountType: "asset" as const },
  { code: "281", name: "Amortización acumulada del inmovilizado material", accountType: "asset" as const },
  { code: "300", name: "Mercaderías", accountType: "asset" as const },
  { code: "310", name: "Materias primas", accountType: "asset" as const },
  { code: "400", name: "Proveedores", accountType: "liability" as const },
  { code: "410", name: "Acreedores por prestaciones de servicios", accountType: "liability" as const },
  { code: "430", name: "Clientes", accountType: "asset" as const },
  { code: "431", name: "Clientes, efectos comerciales a cobrar", accountType: "asset" as const },
  { code: "440", name: "Deudores", accountType: "asset" as const },
  { code: "465", name: "Remuneraciones pendientes de pago", accountType: "liability" as const },
  { code: "470", name: "Hacienda Pública, deudora por diversos conceptos", accountType: "asset" as const },
  { code: "472", name: "Hacienda Pública, IVA soportado", accountType: "asset" as const },
  { code: "475", name: "Hacienda Pública, acreedora por conceptos fiscales", accountType: "liability" as const },
  { code: "477", name: "Hacienda Pública, IVA repercutido", accountType: "liability" as const },
  { code: "476", name: "Organismos de la Seguridad Social, acreedores", accountType: "liability" as const },
  { code: "520", name: "Deudas a corto plazo con entidades de crédito", accountType: "liability" as const },
  { code: "523", name: "Proveedores de inmovilizado a corto plazo", accountType: "liability" as const },
  { code: "570", name: "Caja, euros", accountType: "asset" as const },
  { code: "572", name: "Bancos e instituciones de crédito c/c vista, euros", accountType: "asset" as const },
  { code: "600", name: "Compras de mercaderías", accountType: "expense" as const },
  { code: "601", name: "Compras de materias primas", accountType: "expense" as const },
  { code: "602", name: "Compras de otros aprovisionamientos", accountType: "expense" as const },
  { code: "606", name: "Descuentos sobre compras por pronto pago", accountType: "expense" as const },
  { code: "608", name: "Devoluciones de compras y operaciones similares", accountType: "expense" as const },
  { code: "610", name: "Variación de existencias de mercaderías", accountType: "expense" as const },
  { code: "621", name: "Arrendamientos y cánones", accountType: "expense" as const },
  { code: "622", name: "Reparaciones y conservación", accountType: "expense" as const },
  { code: "623", name: "Servicios de profesionales independientes", accountType: "expense" as const },
  { code: "625", name: "Primas de seguros", accountType: "expense" as const },
  { code: "626", name: "Servicios bancarios y similares", accountType: "expense" as const },
  { code: "627", name: "Publicidad, propaganda y relaciones públicas", accountType: "expense" as const },
  { code: "628", name: "Suministros", accountType: "expense" as const },
  { code: "629", name: "Otros servicios", accountType: "expense" as const },
  { code: "630", name: "Impuesto sobre beneficios", accountType: "expense" as const },
  { code: "640", name: "Sueldos y salarios", accountType: "expense" as const },
  { code: "642", name: "Seguridad Social a cargo de la empresa", accountType: "expense" as const },
  { code: "662", name: "Intereses de deudas", accountType: "expense" as const },
  { code: "680", name: "Amortización del inmovilizado intangible", accountType: "expense" as const },
  { code: "681", name: "Amortización del inmovilizado material", accountType: "expense" as const },
  { code: "700", name: "Ventas de mercaderías", accountType: "income" as const },
  { code: "701", name: "Ventas de productos terminados", accountType: "income" as const },
  { code: "705", name: "Prestaciones de servicios", accountType: "income" as const },
  { code: "706", name: "Descuentos sobre ventas por pronto pago", accountType: "income" as const },
  { code: "708", name: "Devoluciones de ventas y operaciones similares", accountType: "income" as const },
  { code: "762", name: "Ingresos de créditos", accountType: "income" as const },
  { code: "769", name: "Otros ingresos financieros", accountType: "income" as const },
  { code: "771", name: "Beneficios procedentes del inmovilizado material", accountType: "income" as const },
];

export async function seedDatabase() {
  try {
    const existingAdmin = await storage.getUserByUsername("admin");
    if (existingAdmin) {
      console.log("Database already seeded");
      return;
    }

    console.log("Seeding database...");

    const hashedAdmin = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      username: "admin",
      password: hashedAdmin,
      fullName: "Administrador General",
      role: "admin",
    });

    const year = await storage.createSchoolYear({ name: "2024-2025", active: true });
    await storage.createSchoolYear({ name: "2025-2026", active: false });

    await storage.getConfig();

    const hashedTeacher = await bcrypt.hash("prof123", 10);
    const teacher = await storage.createUser({
      username: "mgarcia",
      password: hashedTeacher,
      fullName: "María García López",
      role: "teacher",
    });

    const course1 = await storage.createCourse({
      name: "1º CFGM Gestión Administrativa",
      description: "Ciclo formativo de grado medio en gestión administrativa",
      teacherId: teacher.id,
      schoolYearId: year.id,
    });

    const course2 = await storage.createCourse({
      name: "2º CFGS Administración y Finanzas",
      description: "Ciclo formativo de grado superior en administración y finanzas",
      teacherId: teacher.id,
      schoolYearId: year.id,
    });

    const hashedStudent = await bcrypt.hash("alumno123", 10);
    await storage.createUser({
      username: "jperez",
      password: hashedStudent,
      fullName: "Juan Pérez Martínez",
      role: "student",
      courseId: course1.id,
      createdBy: teacher.id,
    });
    await storage.createUser({
      username: "alopez",
      password: hashedStudent,
      fullName: "Ana López Fernández",
      role: "student",
      courseId: course1.id,
      createdBy: teacher.id,
    });
    await storage.createUser({
      username: "cmartin",
      password: hashedStudent,
      fullName: "Carlos Martín Ruiz",
      role: "student",
      courseId: course2.id,
      createdBy: teacher.id,
    });

    for (const acc of PGC_ACCOUNTS) {
      await storage.createAccount({
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType,
        isSystem: true,
      });
    }

    const ex1 = await storage.createExercise({
      title: "Asiento de apertura",
      description: "Registra el asiento de apertura de una empresa con los siguientes datos: Capital social 50.000€, Bancos 30.000€, Mobiliario 15.000€, Equipos informáticos 5.000€.",
      exerciseType: "guided",
      teacherId: teacher.id,
    });
    const ex2 = await storage.createExercise({
      title: "Compra de mercaderías con IVA",
      description: "La empresa ALFA, S.L. compra mercaderías por valor de 10.000€ + 21% IVA. El pago se realiza a 30 días. Registra el asiento correspondiente.",
      exerciseType: "practice",
      teacherId: teacher.id,
    });
    const ex3 = await storage.createExercise({
      title: "Venta de mercaderías",
      description: "Registra una venta de mercaderías por 8.000€ + 21% IVA. El cliente paga el 50% al contado por transferencia y el resto queda pendiente.",
      exerciseType: "practice",
      teacherId: teacher.id,
    });

    await storage.assignExerciseToCourse(course1.id, ex1.id);
    await storage.assignExerciseToCourse(course1.id, ex2.id);
    await storage.assignExerciseToCourse(course1.id, ex3.id);

    console.log("Database seeded successfully");
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}
