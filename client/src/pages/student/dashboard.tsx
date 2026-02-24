import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpenCheck, FileText, BarChart3, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { JournalEntry, Exercise } from "@shared/schema";
import { motion } from "framer-motion";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: entries, isLoading: loadingEntries } = useQuery<JournalEntry[]>({ queryKey: ["/api/journal-entries"] });
  const { data: exercises, isLoading: loadingExercises } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });

  const quickLinks = [
    {
      title: "Libro Diario",
      description: "Registra asientos contables",
      icon: BookOpenCheck,
      href: "/journal",
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      title: "Libro Mayor",
      description: "Consulta las cuentas T",
      icon: FileText,
      href: "/ledger",
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      title: "Balances",
      description: "Balance de comprobación",
      icon: BarChart3,
      href: "/balances",
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      title: "Ejercicios",
      description: "Casos prácticos asignados",
      icon: ClipboardList,
      href: "/exercises",
      color: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-student-title">
          Hola, {user?.fullName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Tu escritorio contable</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {quickLinks.map((link, i) => (
          <motion.div key={i} variants={item}>
            <Link href={link.href}>
              <Card className="hover-elevate cursor-pointer h-full" data-testid={`link-${link.href.replace("/", "")}`}>
                <CardContent className="p-5">
                  <div className={`p-2.5 rounded-lg ${link.bg} w-fit mb-3`}>
                    <link.icon className={`w-5 h-5 ${link.color}`} />
                  </div>
                  <p className="font-medium text-sm">{link.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{link.description}</p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Últimos Asientos</h3>
            {loadingEntries ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : entries && entries.length > 0 ? (
              <div className="space-y-2">
                {entries.slice(0, 5).map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-6">#{e.entryNumber}</span>
                      <div>
                        <p className="text-sm font-medium">{e.description}</p>
                        <p className="text-xs text-muted-foreground">{e.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <BookOpenCheck className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Aún no hay asientos registrados</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Ejercicios Disponibles</h3>
            {loadingExercises ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : exercises && exercises.length > 0 ? (
              <div className="space-y-2">
                {exercises.slice(0, 5).map(ex => (
                  <div key={ex.id} className="p-3 rounded-md bg-muted/50">
                    <p className="text-sm font-medium">{ex.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ex.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No hay ejercicios asignados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
