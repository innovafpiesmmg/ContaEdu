import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, ClipboardList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Course, User, Exercise } from "@shared/schema";
import { motion } from "framer-motion";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data: courses, isLoading: loadingCourses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: students, isLoading: loadingStudents } = useQuery<User[]>({ queryKey: ["/api/users/students"] });
  const { data: exercises, isLoading: loadingExercises } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });

  const stats = [
    {
      label: "Mis Cursos",
      value: loadingCourses ? "-" : String(courses?.length || 0),
      icon: GraduationCap,
      color: "text-chart-1",
      bg: "bg-chart-1/10",
    },
    {
      label: "Alumnos",
      value: loadingStudents ? "-" : String(students?.length || 0),
      icon: Users,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      label: "Ejercicios",
      value: loadingExercises ? "-" : String(exercises?.length || 0),
      icon: ClipboardList,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
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
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-teacher-title">
          Hola, {user?.fullName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Panel del profesor</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {stats.map((s, i) => (
          <motion.div key={i} variants={item}>
            <Card className="hover-elevate">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-semibold">{s.value}</p>
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
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Cursos Activos</h3>
            {loadingCourses ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : courses && courses.length > 0 ? (
              <div className="space-y-2">
                {courses.map(c => (
                  <div key={c.id} className="p-3 rounded-md bg-muted/50">
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.description && <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin cursos asignados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Alumnos Recientes</h3>
            {loadingStudents ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : students && students.length > 0 ? (
              <div className="space-y-2">
                {students.slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-chart-2/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-chart-2">
                        {s.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground">@{s.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin alumnos matriculados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
