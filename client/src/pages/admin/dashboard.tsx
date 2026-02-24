import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Users, GraduationCap, Settings2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { SchoolYear, User, Course, SystemConfig } from "@shared/schema";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { data: years, isLoading: loadingYears } = useQuery<SchoolYear[]>({ queryKey: ["/api/school-years"] });
  const { data: teachers, isLoading: loadingTeachers } = useQuery<User[]>({ queryKey: ["/api/users/teachers"] });
  const { data: courses, isLoading: loadingCourses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: config, isLoading: loadingConfig } = useQuery<SystemConfig>({ queryKey: ["/api/config"] });

  const activeYear = years?.find(y => y.active);
  const stats = [
    {
      label: "Año Activo",
      value: activeYear?.name || "Ninguno",
      icon: Calendar,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      label: "Profesores",
      value: loadingTeachers ? "-" : String(teachers?.length || 0),
      icon: Users,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      label: "Cursos",
      value: loadingCourses ? "-" : String(courses?.length || 0),
      icon: GraduationCap,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      label: "Régimen Fiscal",
      value: loadingConfig ? "-" : (config?.taxRegime === "igic" ? "IGIC" : "IVA"),
      icon: Settings2,
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
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-admin-title">
          Panel de Administración
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestión general del simulador contable
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((s, i) => (
          <motion.div key={i} variants={item}>
            <Card className="hover-elevate">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                    {loadingYears || loadingTeachers || loadingCourses || loadingConfig ? (
                      <Skeleton className="h-7 w-20" />
                    ) : (
                      <p className="text-xl font-semibold" data-testid={`stat-${s.label.toLowerCase().replace(/ /g, "-")}`}>
                        {s.value}
                      </p>
                    )}
                  </div>
                  <div className={`p-2.5 rounded-lg ${s.bg}`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">Años Escolares</h3>
          </CardHeader>
          <CardContent>
            {loadingYears ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : years && years.length > 0 ? (
              <div className="space-y-2">
                {years.map(y => (
                  <div key={y.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`year-${y.id}`}>
                    <span className="text-sm font-medium">{y.name}</span>
                    <Badge variant={y.active ? "default" : "secondary"}>
                      {y.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay años escolares configurados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold">Profesores Registrados</h3>
          </CardHeader>
          <CardContent>
            {loadingTeachers ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : teachers && teachers.length > 0 ? (
              <div className="space-y-2">
                {teachers.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50" data-testid={`teacher-${t.id}`}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {t.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.fullName}</p>
                      <p className="text-xs text-muted-foreground">@{t.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay profesores registrados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
