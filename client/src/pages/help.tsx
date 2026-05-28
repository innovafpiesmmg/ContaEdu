import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Users,
  GraduationCap,
  Mail,
  CalendarRange,
  BookOpen,
  ClipboardList,
  FileText,
  PenSquare,
  BookMarked,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Info,
  Search,
  HelpCircle,
  Shield,
  UserPlus,
  Library,
  ScrollText,
  Calculator,
  Eye,
  Award,
  PieChart,
  Download,
  Upload,
  KeyRound,
  Hash,
  Folder,
  Link as LinkIcon,
  ChevronRight,
} from "lucide-react";

type Role = "admin" | "teacher" | "student";

type Section = {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  audience: Role[];
  block: "admin" | "teacher" | "student";
  content: React.ReactNode;
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
        {n}
      </div>
      <div className="flex-1 pt-1">
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <div className="text-sm text-muted-foreground space-y-1">{children}</div>
      </div>
    </div>
  );
}

function Tip({
  type = "info",
  children,
}: {
  type?: "info" | "warn" | "ok";
  children: React.ReactNode;
}) {
  const cfg = {
    info: { Icon: Info, cls: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-100" },
    warn: { Icon: AlertCircle, cls: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-100" },
    ok: { Icon: CheckCircle2, cls: "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-100" },
  }[type];
  const { Icon, cls } = cfg;
  return (
    <div className={`flex gap-2 items-start p-3 rounded-md border text-sm ${cls}`}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
}

function Path({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-xs font-mono">
      {children}
    </code>
  );
}

const SECTIONS: Section[] = [
  // ===================== ADMIN =====================
  {
    id: "admin-intro",
    title: "Visión general del Administrador",
    icon: Shield,
    audience: ["admin"],
    block: "admin",
    content: (
      <div className="space-y-3 text-sm">
        <p>
          El administrador es responsable de la <strong>configuración global</strong> de
          ContaEdu: cursos académicos, régimen fiscal (IVA/IGIC), cuentas de profesorado y
          servidor de correo para recuperación de contraseñas.
        </p>
        <Tip type="info">
          La contraseña del administrador solo puede cambiarse desde la consola con{" "}
          <Path>npx tsx scripts/change-admin-password.ts &lt;nueva&gt;</Path>.
        </Tip>
      </div>
    ),
  },
  {
    id: "admin-school-years",
    title: "Cursos académicos",
    icon: CalendarRange,
    audience: ["admin"],
    block: "admin",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Crea los cursos escolares (p. ej. <em>2025/2026</em>) que utilizarán profesores y
          alumnos. Solo puede haber un curso marcado como activo a la vez.
        </p>
        <div className="space-y-3">
          <Step n={1} title="Ir a Cursos académicos">
            En el menú lateral, abre <Path>Cursos académicos</Path>.
          </Step>
          <Step n={2} title="Crear nuevo curso">
            Pulsa <strong>Nuevo curso</strong> e introduce el nombre (p. ej.{" "}
            <em>2025/2026</em>).
          </Step>
          <Step n={3} title="Activar el curso vigente">
            Marca el curso actual como activo; los demás permanecen como histórico.
          </Step>
        </div>
      </div>
    ),
  },
  {
    id: "admin-tax",
    title: "Régimen fiscal (IVA / IGIC)",
    icon: Calculator,
    audience: ["admin"],
    block: "admin",
    content: (
      <div className="space-y-3 text-sm">
        <p>
          Configura el régimen impositivo de tu centro: <strong>IVA</strong> (Península y
          Baleares) o <strong>IGIC</strong> (Canarias). Esto afecta a las cuentas y
          porcentajes utilizados en los ejercicios.
        </p>
        <p className="text-muted-foreground">
          Disponible en <Path>Configuración → Régimen fiscal</Path>.
        </p>
      </div>
    ),
  },
  {
    id: "admin-teachers",
    title: "Crear cuentas de profesores",
    icon: UserPlus,
    audience: ["admin"],
    block: "admin",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Los profesores son creados por el administrador. Cada uno gestionará sus propios
          cursos, alumnos, ejercicios y exámenes.
        </p>
        <div className="space-y-3">
          <Step n={1} title="Abrir Profesores">
            Menú lateral → <Path>Profesores</Path>.
          </Step>
          <Step n={2} title="Nuevo profesor">
            Pulsa <strong>Añadir profesor</strong>. Introduce nombre, usuario y contraseña
            inicial. El email es opcional pero recomendado para recuperación.
          </Step>
          <Step n={3} title="Comparte las credenciales">
            El profesor podrá iniciar sesión y cambiar su contraseña desde{" "}
            <Path>Mi perfil</Path>.
          </Step>
        </div>
      </div>
    ),
  },
  {
    id: "admin-mail",
    title: "Servidor de correo (SMTP)",
    icon: Mail,
    audience: ["admin"],
    block: "admin",
    content: (
      <div className="space-y-3 text-sm">
        <p>
          Configura el servidor SMTP para enviar correos de recuperación de contraseña a
          profesores y alumnos.
        </p>
        <p className="text-muted-foreground">
          Disponible en <Path>Configuración → Servidor de correo</Path>. Necesitarás host,
          puerto, usuario, contraseña, remitente y modo seguro (TLS/SSL).
        </p>
        <Tip type="warn">
          Sin SMTP configurado, los usuarios no podrán restablecer la contraseña por email.
        </Tip>
      </div>
    ),
  },

  // ===================== TEACHER =====================
  {
    id: "teacher-intro",
    title: "Visión general del Profesor",
    icon: GraduationCap,
    audience: ["admin", "teacher"],
    block: "teacher",
    content: (
      <div className="space-y-3 text-sm">
        <p>
          Como profesor gestionas tus <strong>cursos</strong>, das de alta a los{" "}
          <strong>alumnos</strong>, creas y asignas <strong>ejercicios</strong> y{" "}
          <strong>exámenes</strong>, corriges entregas y consultas calificaciones y
          analíticas.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          {[
            ["Cursos", BookOpen],
            ["Alumnos", Users],
            ["Ejercicios", FileText],
            ["Exámenes", ClipboardList],
            ["Calificaciones", Award],
            ["Analíticas", BarChart3],
          ].map(([label, Icon]) => {
            const I = Icon as React.ComponentType<{ className?: string }>;
            return (
              <div key={label as string} className="flex items-center gap-2 p-2 rounded-md border bg-card">
                <I className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">{label as string}</span>
              </div>
            );
          })}
        </div>
      </div>
    ),
  },
  {
    id: "teacher-courses",
    title: "Crear cursos",
    icon: BookOpen,
    audience: ["admin", "teacher"],
    block: "teacher",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Un curso agrupa a un conjunto de alumnos y los ejercicios/exámenes que les
          asignes. Se vincula a un curso académico (creado por el administrador).
        </p>
        <div className="space-y-3">
          <Step n={1} title="Abrir Cursos">
            Menú lateral → <Path>Cursos</Path>.
          </Step>
          <Step n={2} title="Nuevo curso">
            Pulsa <strong>Añadir curso</strong>: nombre, descripción y curso académico.
          </Step>
          <Step n={3} title="Código de matrícula">
            Cada curso genera un código que tus alumnos usarán para auto-registrarse.
          </Step>
        </div>
      </div>
    ),
  },
  {
    id: "teacher-students",
    title: "Dar de alta alumnos",
    icon: Users,
    audience: ["admin", "teacher"],
    block: "teacher",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Dispones de tres vías para incorporar alumnos a un curso:
        </p>
        <div className="grid sm:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" /> Individual
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Crea cada alumno desde <Path>Alumnos → Añadir alumno</Path>.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" /> Importación CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Sube un CSV (nombre, usuario, contraseña) para crear varios a la vez.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" /> Auto-registro
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Comparte el código del curso; los alumnos se registran solos desde el login.
            </CardContent>
          </Card>
        </div>
        <Tip type="info">
          Puedes exportar la lista de alumnos a CSV desde la propia página de alumnos.
        </Tip>
      </div>
    ),
  },
  {
    id: "teacher-exercises",
    title: "Repositorio de ejercicios",
    icon: Library,
    audience: ["admin", "teacher"],
    block: "teacher",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Los ejercicios forman una <strong>biblioteca compartida</strong> entre todos los
          profesores. Cada ejercicio puede asignarse a uno o varios de tus cursos.
        </p>
        <div className="space-y-3">
          <Step n={1} title="Crear ejercicio">
            Desde <Path>Ejercicios → Nuevo</Path>. Define título, tipo (guiado/práctica),
            nivel recomendado (CFGM/CFGS) y descripción.
          </Step>
          <Step n={2} title="Añadir solución (opcional)">
            Puedes registrar la solución como asientos con cuentas y fechas. Se usará para
            corrección automática y como referencia.
          </Step>
          <Step n={3} title="Asignar a tus cursos">
            Pulsa el icono <LinkIcon className="inline w-3 h-3" /> en la tarjeta del
            ejercicio para asignarlo a uno o varios cursos.
          </Step>
          <Step n={4} title="Organizar en colecciones">
            Agrupa ejercicios por temática o unidad mediante colecciones (relación
            muchos-a-muchos).
          </Step>
        </div>
        <Tip type="ok">
          También puedes <strong>importar varios ejercicios desde un fichero Markdown</strong>{" "}
          siguiendo la plantilla descrita en el README.
        </Tip>
      </div>
    ),
  },
  {
    id: "teacher-exams",
    title: "Exámenes",
    icon: ClipboardList,
    audience: ["admin", "teacher"],
    block: "teacher",
    content: (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Los exámenes son pruebas cronometradas con una sola entrega por alumno.
        </p>
        <div className="space-y-3">
          <Step n={1} title="Crear examen">
            <Path>Exámenes → Nuevo</Path>. Define duración, descripción, instrucciones y
            asígnalo a un curso.
          </Step>
          <Step n={2} title="Activar / desactivar">
            Solo cuando el examen está activo los alumnos pueden comenzarlo.
          </Step>
          <Step n={3} title="Corregir">
            Tras la entrega, revisa los asientos, añade calificación (0–10) y comentario.
          </Step>
        </div>
        <Tip type="info">
          También puedes importar exámenes desde Markdown con sus asientos y puntuaciones por
          asiento.
        </Tip>
      </div>
    ),
  },
  {
    id: "teacher-review",
    title: "Corrección de entregas",
    icon: PenSquare,
    audience: ["admin", "teacher"],
    block: "teacher",
    content: (
      <div className="space-y-3">
        <Step n={1} title="Ver entregas">
          Desde la tarjeta de un ejercicio, pulsa el icono <Eye className="inline w-3 h-3" />
          para ver las entregas pendientes.
        </Step>
        <Step n={2} title="Auditar al alumno">
          Puedes revisar su libro diario, mayor y balance desde la ficha del alumno.
        </Step>
        <Step n={3} title="Calificar">
          Introduce nota (0–10) y feedback. El alumno verá ambos en su panel.
        </Step>
      </div>
    ),
  },
  {
    id: "teacher-grades",
    title: "Calificaciones y analíticas",
    icon: BarChart3,
    audience: ["admin", "teacher"],
    block: "teacher",
    content: (
      <div className="space-y-3 text-sm">
        <p>
          La página <Path>Calificaciones</Path> muestra un libro de notas por curso con
          ejercicios y exámenes. Puedes exportarlo a CSV.
        </p>
        <p>
          <Path>Analíticas</Path> ofrece métricas por curso: progreso, distribución de notas,
          mejores/peores alumnos y estadísticas por ejercicio o examen.
        </p>
      </div>
    ),
  },

  // ===================== STUDENT =====================
  {
    id: "student-intro",
    title: "Visión general del Alumno",
    icon: GraduationCap,
    audience: ["admin", "teacher", "student"],
    block: "student",
    content: (
      <div className="space-y-3 text-sm">
        <p>
          Como alumno usas ContaEdu para <strong>registrar asientos contables</strong>,
          consultar libros (Diario, Mayor, Balance), <strong>entregar ejercicios</strong> y{" "}
          <strong>realizar exámenes</strong>. Dispones también de un manual y la analítica
          incorporados.
        </p>
      </div>
    ),
  },
  {
    id: "student-register",
    title: "Cómo registrarse",
    icon: KeyRound,
    audience: ["admin", "teacher", "student"],
    block: "student",
    content: (
      <div className="space-y-3">
        <Step n={1} title="Pide el código de matrícula a tu profesor">
          Es un código corto asociado a tu curso.
        </Step>
        <Step n={2} title="Regístrate desde la pantalla de login">
          Introduce tus datos y el código del curso para crear tu cuenta.
        </Step>
        <Step n={3} title="Inicia sesión">
          Accede con tu usuario y contraseña.
        </Step>
        <Tip type="info">
          Desde <Path>Mi perfil</Path> puedes cambiar tu contraseña y registrar tu email para
          recuperación.
        </Tip>
      </div>
    ),
  },
  {
    id: "student-journal",
    title: "Libro diario: registrar asientos",
    icon: ScrollText,
    audience: ["admin", "teacher", "student"],
    block: "student",
    content: (
      <div className="space-y-3">
        <Step n={1} title="Abrir el Libro diario">
          Menú lateral → <Path>Libro diario</Path>.
        </Step>
        <Step n={2} title="Seleccionar ejercicio">
          Elige el ejercicio activo para trabajar dentro de su contexto.
        </Step>
        <Step n={3} title="Crear un asiento">
          Indica fecha y descripción, y añade líneas de cuenta con importes al Debe o al
          Haber. El asiento debe estar cuadrado (Debe = Haber).
        </Step>
        <Step n={4} title="Consulta el PGC">
          Usa la página <Path>Cuentas</Path> para buscar el código y nombre de cualquier
          cuenta del Plan General Contable.
        </Step>
        <Tip type="info">
          Si el ejercicio tiene un <strong>plan de cuentas personalizado</strong>, podrás
          descargarlo en PDF desde la cabecera del libro diario.
        </Tip>
      </div>
    ),
  },
  {
    id: "student-books",
    title: "Mayor y Balance",
    icon: BookMarked,
    audience: ["admin", "teacher", "student"],
    block: "student",
    content: (
      <div className="space-y-3 text-sm">
        <p>
          A medida que registras asientos, el <Path>Libro Mayor</Path> y el{" "}
          <Path>Balance de comprobación</Path> se actualizan automáticamente para que veas el
          impacto contable de tus operaciones.
        </p>
      </div>
    ),
  },
  {
    id: "student-submit",
    title: "Entregar ejercicios",
    icon: CheckCircle2,
    audience: ["admin", "teacher", "student"],
    block: "student",
    content: (
      <div className="space-y-3">
        <Step n={1} title="Trabaja el ejercicio">
          Registra todos los asientos requeridos.
        </Step>
        <Step n={2} title="Entregar">
          Pulsa <strong>Entregar ejercicio</strong> y confirma. Tras la entrega no podrás
          modificar los asientos hasta que el profesor te devuelva la corrección.
        </Step>
        <Step n={3} title="Ver feedback y nota">
          En <Path>Mis ejercicios</Path> verás la calificación y comentarios cuando el
          profesor corrija.
        </Step>
      </div>
    ),
  },
  {
    id: "student-exams",
    title: "Realizar exámenes",
    icon: ClipboardList,
    audience: ["admin", "teacher", "student"],
    block: "student",
    content: (
      <div className="space-y-3">
        <Step n={1} title="Comprueba los exámenes disponibles">
          En <Path>Mis exámenes</Path> verás solo los exámenes activos.
        </Step>
        <Step n={2} title="Empezar el examen">
          Al pulsar <strong>Empezar</strong> se inicia el cronómetro de la duración
          establecida.
        </Step>
        <Step n={3} title="Entregar antes de terminar el tiempo">
          Recuerda entregar antes de que expire el tiempo. La nota la pondrá tu profesor
          tras revisarlo.
        </Step>
        <Tip type="warn">
          Solo dispones de <strong>un intento</strong> por examen.
        </Tip>
      </div>
    ),
  },
  {
    id: "student-extras",
    title: "Manual y analítica",
    icon: PieChart,
    audience: ["admin", "teacher", "student"],
    block: "student",
    content: (
      <div className="space-y-3 text-sm">
        <p>
          Consulta el <Path>Manual</Path> teórico para repasar conceptos y la página de{" "}
          <Path>Analítica</Path> para profundizar en contabilidad analítica.
        </p>
        <p>
          En <Path>Mis calificaciones</Path> verás tu evolución y notas de ejercicios y
          exámenes.
        </p>
      </div>
    ),
  },
];

const BLOCK_META: Record<"admin" | "teacher" | "student", { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  admin: { label: "Administración", color: "bg-purple-100 text-purple-900 dark:bg-purple-950/50 dark:text-purple-100", Icon: Shield },
  teacher: { label: "Profesor", color: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100", Icon: GraduationCap },
  student: { label: "Alumno", color: "bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100", Icon: BookOpen },
};

export default function HelpPage() {
  const { user } = useAuth();
  const role = (user?.role ?? "student") as Role;
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => SECTIONS.filter((s) => s.audience.includes(role)),
    [role]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter((s) => s.title.toLowerCase().includes(q));
  }, [visible, query]);

  const grouped = useMemo(() => {
    const g: Record<string, Section[]> = { admin: [], teacher: [], student: [] };
    for (const s of filtered) g[s.block].push(s);
    return g;
  }, [filtered]);

  const blocksOrder: ("admin" | "teacher" | "student")[] = ["admin", "teacher", "student"];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full" data-testid="page-help">
      {/* Sidebar TOC */}
      <aside className="lg:w-72 lg:sticky lg:top-4 lg:self-start space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Ayuda</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Guía visual de uso de ContaEdu adaptada a tu rol.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en la ayuda..."
            className="pl-8"
            data-testid="input-help-search"
          />
        </div>
        <nav className="space-y-4">
          {blocksOrder.map((blk) => {
            const items = grouped[blk];
            if (!items.length) return null;
            const meta = BLOCK_META[blk];
            const I = meta.Icon;
            return (
              <div key={blk}>
                <div className="flex items-center gap-2 px-2 mb-1">
                  <I className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {meta.label}
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {items.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover-elevate text-foreground/80 hover:text-foreground"
                        data-testid={`link-help-${s.id}`}
                      >
                        <ChevronRight className="w-3 h-3 opacity-50" />
                        <span className="truncate">{s.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 space-y-8">
        {blocksOrder.map((blk) => {
          const items = grouped[blk];
          if (!items.length) return null;
          const meta = BLOCK_META[blk];
          const BIcon = meta.Icon;
          return (
            <section key={blk} className="space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded-lg ${meta.color}`}>
                <BIcon className="w-6 h-6" />
                <div>
                  <h2 className="text-xl font-bold leading-tight">{meta.label}</h2>
                  <p className="text-xs opacity-80">
                    {blk === "admin" && "Configuración global del sistema"}
                    {blk === "teacher" && "Gestión de cursos, alumnos, ejercicios y exámenes"}
                    {blk === "student" && "Trabajo diario: asientos, libros, ejercicios y exámenes"}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {items.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.id} id={s.id} className="scroll-mt-20" data-testid={`section-help-${s.id}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </span>
                          <span>{s.title}</span>
                          <Badge variant="outline" className="ml-auto text-[10px] uppercase">
                            {BLOCK_META[s.block].label}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>{s.content}</CardContent>
                    </Card>
                  );
                })}
              </div>
              <Separator />
            </section>
          );
        })}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No se han encontrado resultados para "{query}".
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
