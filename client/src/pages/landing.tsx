import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  GraduationCap,
  BarChart3,
  FileText,
  Users,
  ShieldCheck,
  ArrowRight,
  BookOpenCheck,
  Calculator,
  Layers,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
} from "lucide-react";

import heroClassroom from "@/assets/images/hero-classroom.jpg";
import teacherStudent from "@/assets/images/teacher-student.jpg";
import studentAccounting from "@/assets/images/student-accounting.jpg";
import studentsCollaboration from "@/assets/images/students-collaboration.jpg";
import asdLogo from "@assets/ASD_transparent.png";
import contaeduMark from "@assets/ContaEdu_Favicon_transparent.png";
import contaeduHorizontal from "@assets/contaedu_horizontal_transparent.png";
import iesLogo from "@assets/logo-ies_transparent.png";

interface LandingPageProps {
  onGoToLogin: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function LandingPage({ onGoToLogin }: LandingPageProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const features = [
    { icon: BookOpenCheck, title: "Libro Diario", description: "Registra asientos contables con validación automática de partida doble y cuentas del PGC.", color: "text-blue-500", bg: "bg-blue-500/10", ring: "from-blue-500/40" },
    { icon: FileText, title: "Libro Mayor", description: "Visualiza los movimientos por cuenta con formato T clásico: Debe y Haber diferenciados.", color: "text-emerald-500", bg: "bg-emerald-500/10", ring: "from-emerald-500/40" },
    { icon: BarChart3, title: "Balance de Comprobación", description: "Genera automáticamente el balance de sumas y saldos a partir de tus asientos.", color: "text-violet-500", bg: "bg-violet-500/10", ring: "from-violet-500/40" },
    { icon: Layers, title: "Plan General Contable", description: "Más de 60 cuentas del PGC organizadas por grupos, con buscador integrado.", color: "text-amber-500", bg: "bg-amber-500/10", ring: "from-amber-500/40" },
    { icon: Users, title: "Gestión de Aula", description: "Los profesores crean cursos, alumnos y ejercicios. Auditan el trabajo en tiempo real.", color: "text-rose-500", bg: "bg-rose-500/10", ring: "from-rose-500/40" },
    { icon: Calculator, title: "IVA / IGIC", description: "Soporte para ambos regímenes fiscales: Península y Baleares (IVA) o Canarias (IGIC).", color: "text-cyan-500", bg: "bg-cyan-500/10", ring: "from-cyan-500/40" },
  ];

  const roles = [
    { icon: ShieldCheck, title: "Administrador", items: ["Gestión de años escolares", "Creación de profesores", "Configuración fiscal (IVA/IGIC)"], gradient: "from-blue-500 to-cyan-400", glow: "shadow-blue-500/20" },
    { icon: GraduationCap, title: "Profesor", items: ["Creación de cursos y alumnos", "Diseño de ejercicios", "Auditoría del trabajo del alumno"], gradient: "from-emerald-500 to-teal-400", glow: "shadow-emerald-500/20" },
    { icon: BookOpen, title: "Alumno", items: ["Registro de asientos contables", "Consulta del Libro Mayor", "Balance de Comprobación y PGC"], gradient: "from-violet-500 to-fuchsia-400", glow: "shadow-violet-500/20" },
  ];

  const faqs = [
    { q: "¿Qué es ContaEdu?", a: "ContaEdu es un simulador contable educativo diseñado específicamente para la Formación Profesional en España (CFGM y CFGS). Permite practicar contabilidad real siguiendo el Plan General de Contabilidad." },
    { q: "¿Necesito instalar algo?", a: "No. ContaEdu es una aplicación web que funciona directamente en el navegador. Solo necesitas conexión a internet y tus credenciales de acceso." },
    { q: "¿Qué cuentas contables incluye?", a: "Incluye más de 60 cuentas del Plan General de Contabilidad (PGC), organizadas en los grupos principales: financiación, activo no corriente, existencias, acreedores/deudores, cuentas financieras, gastos e ingresos." },
    { q: "¿El profesor puede ver mi trabajo?", a: "Sí. Los profesores tienen acceso de solo lectura al Libro Diario, Libro Mayor y Balance de Comprobación de cada alumno para realizar el seguimiento de su progreso." },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-chart-2/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-1/4 w-[700px] h-[500px] bg-violet-500/5 rounded-full blur-3xl"
        />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <header className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-primary shadow-lg shadow-primary/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-24 sm:h-28 flex items-center justify-between">
          <div className="flex items-center" data-testid="landing-brand">
            <img
              src={contaeduHorizontal}
              alt="ContaEdu"
              className="h-14 sm:h-16 w-auto object-contain brightness-0 invert"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="hidden sm:inline-flex text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
              <a href="#features" data-testid="link-nav-features">Funcionalidades</a>
            </Button>
            <Button variant="ghost" asChild className="hidden sm:inline-flex text-primary-foreground hover:bg-white/15 hover:text-primary-foreground">
              <a href="#roles" data-testid="link-nav-roles">Roles</a>
            </Button>
            <Button onClick={onGoToLogin} variant="secondary" data-testid="button-header-login" className="shadow-xl">
              Acceder
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>
      <div className="h-24 sm:h-28" aria-hidden="true" />

      {/* ============== HERO ============== */}
      <section className="relative z-10 pt-16 pb-24 sm:pt-24 sm:pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-chart-2/15 border border-primary/20 text-primary text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                CFGM / CFGS — Formación Profesional
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
                Aprende{" "}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-primary via-blue-500 to-chart-2 bg-clip-text text-transparent">
                    contabilidad
                  </span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                    className="absolute -bottom-1 left-0 right-0 h-2 bg-primary/20 -z-10 origin-left"
                  />
                </span>{" "}
                <br className="hidden sm:block" />
                <span className="text-primary">practicando</span>
              </h1>

              <p className="mt-7 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Simulador contable real con el <strong className="text-foreground">Plan General de Contabilidad</strong>.
                Libro Diario, Mayor, Balances y corrección automática — todo en un entorno guiado.
              </p>

              <div className="mt-9 flex flex-col sm:flex-row items-start gap-3">
                <Button
                  size="lg"
                  onClick={onGoToLogin}
                  className="text-base px-8 h-12 shadow-xl shadow-primary/30 hover:shadow-primary/40 transition-shadow"
                  data-testid="button-hero-login"
                >
                  Empezar ahora
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                  <a href="#features" data-testid="link-hero-features">
                    Ver funcionalidades
                  </a>
                </Button>
              </div>

              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Sin instalación</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>100% en español</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>IVA / IGIC</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              {/* Glow */}
              <div className="absolute -inset-8 bg-gradient-to-tr from-primary/20 via-chart-2/15 to-violet-500/10 rounded-[2.5rem] blur-3xl" />

              {/* Main image card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border border-white/10">
                <img
                  src={heroClassroom}
                  alt="Estudiantes en aula moderna"
                  className="w-full h-[440px] object-cover"
                  data-testid="img-hero"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-background/80 backdrop-blur-md border border-white/20 shadow-xl">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/30">
                      <BookOpenCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Entorno real de práctica</p>
                      <p className="text-xs text-muted-foreground">Plan General de Contabilidad</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stat cards */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -left-8 p-4 rounded-2xl bg-card border shadow-2xl shadow-primary/10 flex items-center gap-3 z-10"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Asientos validados</p>
                  <p className="text-lg font-bold">100%</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-6 -right-6 p-4 rounded-2xl bg-card border shadow-2xl shadow-violet-500/10 flex items-center gap-3 z-10"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                  <Award className="w-5 h-5 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Corrección</p>
                  <p className="text-lg font-bold">Automática</p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats strip */}
          <motion.div {...fadeUp} className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { value: "60+", label: "Cuentas PGC", icon: Layers },
              { value: "3", label: "Roles de usuario", icon: Users },
              { value: "IVA + IGIC", label: "Regímenes fiscales", icon: Calculator },
              { value: "100%", label: "En español", icon: GraduationCap },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4 }}
                className="group relative text-center p-5 rounded-2xl bg-card/60 backdrop-blur-sm border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all"
              >
                <stat.icon className="w-5 h-5 mx-auto text-primary/60 mb-2 group-hover:text-primary transition-colors" />
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-primary to-chart-2 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============== FEATURES ============== */}
      <section id="features" className="relative z-10 py-24 sm:py-28 bg-gradient-to-b from-muted/30 via-muted/20 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-14 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
              FUNCIONALIDADES
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Todo lo que necesitas <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">en un solo lugar</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Herramientas contables reales adaptadas al aula de Formación Profesional
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ y: -6 }}
              >
                <Card className="group relative h-full border bg-card/80 backdrop-blur-sm hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 overflow-hidden">
                  <div className={`absolute -top-px -left-px -right-px h-px bg-gradient-to-r ${f.ring} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <CardContent className="p-7">
                    <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                      <f.icon className={`w-6 h-6 ${f.color}`} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-14 grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl overflow-hidden shadow-xl border relative group">
              <img src={studentAccounting} alt="Alumna trabajando" className="w-full h-[280px] object-cover group-hover:scale-105 transition-transform duration-700" data-testid="img-features-1" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-semibold text-lg">Práctica autónoma</p>
                <p className="text-sm text-muted-foreground">Los alumnos avanzan a su ritmo</p>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden shadow-xl border relative group">
              <img src={teacherStudent} alt="Profesor ayudando" className="w-full h-[280px] object-cover group-hover:scale-105 transition-transform duration-700" data-testid="img-features-2" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-semibold text-lg">Seguimiento docente</p>
                <p className="text-sm text-muted-foreground">Auditoría completa del trabajo</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============== ROLES ============== */}
      <section id="roles" className="relative z-10 py-24 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-14 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-chart-2/10 text-chart-2 text-xs font-medium mb-4">
              <Users className="w-3.5 h-3.5" />
              ROLES
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Tres perfiles, <span className="bg-gradient-to-r from-chart-2 to-primary bg-clip-text text-transparent">un objetivo</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Cada rol con sus herramientas específicas para facilitar la enseñanza y el aprendizaje
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6">
            {roles.map((role, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card className={`group relative h-full border overflow-hidden hover:shadow-2xl ${role.glow} transition-all duration-300`}>
                  <div className={`h-1.5 bg-gradient-to-r ${role.gradient}`} />
                  <CardContent className="p-7">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-6 shadow-lg ${role.glow} group-hover:scale-110 transition-transform`}>
                      <role.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">{role.title}</h3>
                    <ul className="space-y-3">
                      {role.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== FAQ ============== */}
      <section className="relative z-10 py-24 sm:py-28 bg-gradient-to-b from-transparent via-muted/30 to-transparent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Preguntas frecuentes</h2>
            <p className="mt-3 text-muted-foreground text-lg">Resolvemos las dudas más comunes</p>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card
                  className="border bg-card/80 backdrop-blur-sm cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  data-testid={`faq-item-${i}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium">{faq.q}</h3>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                          expandedFaq === i ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </div>
                    {expandedFaq === i && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.25 }}
                        className="mt-3 text-sm text-muted-foreground leading-relaxed"
                      >
                        {faq.a}
                      </motion.p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== CTA ============== */}
      <section className="relative z-10 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20">
            <img
              src={studentsCollaboration}
              alt="Estudiantes colaborando"
              className="w-full h-[360px] sm:h-[420px] object-cover"
              data-testid="img-cta"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/40" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-8 sm:px-14 max-w-2xl text-primary-foreground">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium mb-5">
                  <Sparkles className="w-3.5 h-3.5" />
                  LISTO PARA EMPEZAR
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
                  Empieza a registrar asientos como un profesional
                </h2>
                <p className="mt-5 text-lg text-primary-foreground/90">
                  Accede con tus credenciales y descubre un nuevo modo de aprender contabilidad.
                </p>
                <Button
                  size="lg"
                  onClick={onGoToLogin}
                  variant="secondary"
                  className="mt-7 text-base px-10 h-12 shadow-2xl hover:scale-105 transition-transform"
                  data-testid="button-cta-login"
                >
                  Acceder a ContaEdu
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="relative z-10 py-10 mt-20 bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <img src={contaeduMark} alt="ContaEdu" className="w-10 h-10 shrink-0 object-contain brightness-0 invert" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">ContaEdu</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/20 text-primary-foreground" data-testid="text-version">v2.0</span>
              </div>
              <p className="text-xs text-primary-foreground/80">Un proyecto del Dpto. de Administración de Empresas</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-center sm:text-left" data-testid="footer-ies">
            <img src={iesLogo} alt="IES Manuel Martín González" className="h-12 w-auto shrink-0 object-contain" />
            <div>
              <span className="text-sm font-semibold">IES Manuel Martín González</span>
              <p className="text-xs text-primary-foreground/80">Guía de Isora, Tenerife</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 text-center sm:text-left">
            <img src={asdLogo} alt="Atreyu Servicios Digitales" className="h-12 w-auto shrink-0 object-contain brightness-0 invert" data-testid="img-asd-logo" />
            <div>
              <span className="text-sm font-semibold">Atreyu Servicios Digitales</span>
              <p className="text-xs text-primary-foreground/80">Desarrollo del software</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
