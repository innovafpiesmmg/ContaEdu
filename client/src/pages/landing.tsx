import { useState } from "react";
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
} from "lucide-react";

interface LandingPageProps {
  onGoToLogin: () => void;
}

export default function LandingPage({ onGoToLogin }: LandingPageProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const features = [
    {
      icon: BookOpenCheck,
      title: "Libro Diario",
      description: "Registra asientos contables con validación automática de partida doble y cuentas del PGC.",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: FileText,
      title: "Libro Mayor",
      description: "Visualiza los movimientos por cuenta con formato T clásico: Debe y Haber diferenciados.",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: BarChart3,
      title: "Balance de Comprobación",
      description: "Genera automáticamente el balance de sumas y saldos a partir de tus asientos.",
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      icon: Layers,
      title: "Plan General Contable",
      description: "Más de 60 cuentas del PGC organizadas por grupos, con buscador integrado.",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      icon: Users,
      title: "Gestión de Aula",
      description: "Los profesores crean cursos, alumnos y ejercicios. Auditan el trabajo en tiempo real.",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      icon: Calculator,
      title: "IVA / IGIC",
      description: "Soporte para ambos regímenes fiscales: Península y Baleares (IVA) o Canarias (IGIC).",
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
  ];

  const roles = [
    {
      icon: ShieldCheck,
      title: "Administrador",
      items: ["Gestión de años escolares", "Creación de profesores", "Configuración fiscal (IVA/IGIC)"],
      gradient: "from-blue-500/20 to-blue-600/5",
    },
    {
      icon: GraduationCap,
      title: "Profesor",
      items: ["Creación de cursos y alumnos", "Diseño de ejercicios", "Auditoría del trabajo del alumno"],
      gradient: "from-emerald-500/20 to-emerald-600/5",
    },
    {
      icon: BookOpen,
      title: "Alumno",
      items: ["Registro de asientos contables", "Consulta del Libro Mayor", "Balance de Comprobación y PGC"],
      gradient: "from-violet-500/20 to-violet-600/5",
    },
  ];

  const faqs = [
    {
      q: "¿Qué es ContaEdu?",
      a: "ContaEdu es un simulador contable educativo diseñado específicamente para la Formación Profesional en España (CFGM y CFGS). Permite practicar contabilidad real siguiendo el Plan General de Contabilidad.",
    },
    {
      q: "¿Necesito instalar algo?",
      a: "No. ContaEdu es una aplicación web que funciona directamente en el navegador. Solo necesitas conexión a internet y tus credenciales de acceso.",
    },
    {
      q: "¿Qué cuentas contables incluye?",
      a: "Incluye más de 60 cuentas del Plan General de Contabilidad (PGC), organizadas en los grupos principales: financiación, activo no corriente, existencias, acreedores/deudores, cuentas financieras, gastos e ingresos.",
    },
    {
      q: "¿El profesor puede ver mi trabajo?",
      a: "Sí. Los profesores tienen acceso de solo lectura al Libro Diario, Libro Mayor y Balance de Comprobación de cada alumno para realizar el seguimiento de su progreso.",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-chart-2/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-primary/3 rounded-full blur-3xl" />
      </div>

      <header className="relative z-10 border-b bg-background/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">ContaEdu</span>
          </div>
          <Button onClick={onGoToLogin} data-testid="button-header-login">
            Acceder
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </header>

      <section className="relative z-10 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <GraduationCap className="w-4 h-4" />
            CFGM / CFGS — Formación Profesional
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">
            Aprende contabilidad{" "}
            <span className="text-primary">practicando</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Simulador contable educativo con el Plan General de Contabilidad.
            Libro Diario, Libro Mayor y Balance de Comprobación en un entorno real y guiado.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={onGoToLogin} className="text-base px-8" data-testid="button-hero-login">
              Empezar ahora
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <a href="#features" data-testid="link-hero-features">
                Ver funcionalidades
              </a>
            </Button>
          </div>

          <div className="mt-16 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { value: "60+", label: "Cuentas PGC" },
              { value: "3", label: "Roles de usuario" },
              { value: "IVA", label: "e IGIC" },
              { value: "100%", label: "En español" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 py-20 sm:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Todo lo que necesitas</h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
              Herramientas contables reales adaptadas al aula de Formación Profesional
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Card key={i} className="border bg-card/80 backdrop-blur-sm hover:border-primary/20 transition-colors">
                <CardContent className="p-6">
                  <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Tres perfiles, un objetivo</h2>
            <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
              Cada rol tiene sus herramientas específicas para facilitar la enseñanza y el aprendizaje
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {roles.map((role, i) => (
              <Card key={i} className="border overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${role.gradient}`} />
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <role.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{role.title}</h3>
                  </div>
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
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 sm:py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Preguntas frecuentes</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card
                key={i}
                className="border cursor-pointer"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                data-testid={`faq-item-${i}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-medium">{faq.q}</h3>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                        expandedFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                  {expandedFaq === i && (
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              ¿Listo para practicar?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Accede con tus credenciales y empieza a registrar asientos contables como un profesional.
            </p>
            <Button size="lg" onClick={onGoToLogin} className="mt-8 text-base px-10" data-testid="button-cta-login">
              Acceder a ContaEdu
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">ContaEdu</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Simulador Contable Educativo — CFGM / CFGS Formación Profesional
          </p>
        </div>
      </footer>
    </div>
  );
}
