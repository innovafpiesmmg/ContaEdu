import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Users, ClipboardList, FileQuestion, TrendingUp, TrendingDown, CheckCircle2, AlertCircle, Trophy } from "lucide-react";
import type { Course } from "@shared/schema";
import { motion } from "framer-motion";

interface Analytics {
  course: { id: string; name: string };
  totals: { students: number; exercises: number; exams: number };
  submissions: { total: number; reviewed: number; pending: number; completionRate: number };
  examAttempts: { total: number; reviewed: number; pending: number; completionRate: number };
  grades: { average: number | null; passing: number; failing: number; notGraded: number };
  topStudents: { id: string; name: string; username: string; average: number; count: number }[];
  bottomStudents: { id: string; name: string; username: string; average: number; count: number }[];
  perExercise: { id: string; title: string; submitted: number; reviewed: number; average: number | null; count: number }[];
  perExam: { id: string; title: string; attempts: number; reviewed: number; average: number | null; count: number }[];
}

function fmt(g: number | null) {
  return g === null ? "—" : g.toFixed(2);
}

function gradeColor(g: number | null) {
  if (g === null) return "text-muted-foreground";
  if (g >= 7) return "text-green-700";
  if (g >= 5) return "text-blue-700";
  return "text-red-700";
}

export default function AnalyticsPage() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics/course", selectedCourse],
    enabled: !!selectedCourse,
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-analytics-title">Analíticas</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen del rendimiento del curso</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[260px]" data-testid="select-analytics-course">
            <SelectValue placeholder="Seleccionar curso..." />
          </SelectTrigger>
          <SelectContent>
            {courses?.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedCourse ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Selecciona un curso para ver sus analíticas</p>
          </CardContent>
        </Card>
      ) : isLoading || !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card data-testid="card-stat-students"><CardContent className="p-4">
              <div className="flex items-center justify-between"><Users className="w-5 h-5 text-chart-1" /><span className="text-2xl font-bold">{data.totals.students}</span></div>
              <p className="text-xs text-muted-foreground mt-1">Alumnos</p>
            </CardContent></Card>
            <Card data-testid="card-stat-exercises"><CardContent className="p-4">
              <div className="flex items-center justify-between"><ClipboardList className="w-5 h-5 text-chart-2" /><span className="text-2xl font-bold">{data.totals.exercises}</span></div>
              <p className="text-xs text-muted-foreground mt-1">Ejercicios</p>
            </CardContent></Card>
            <Card data-testid="card-stat-exams"><CardContent className="p-4">
              <div className="flex items-center justify-between"><FileQuestion className="w-5 h-5 text-chart-3" /><span className="text-2xl font-bold">{data.totals.exams}</span></div>
              <p className="text-xs text-muted-foreground mt-1">Exámenes</p>
            </CardContent></Card>
            <Card data-testid="card-stat-average"><CardContent className="p-4">
              <div className="flex items-center justify-between"><TrendingUp className="w-5 h-5 text-chart-4" /><span className={`text-2xl font-bold ${gradeColor(data.grades.average)}`}>{fmt(data.grades.average)}</span></div>
              <p className="text-xs text-muted-foreground mt-1">Nota media</p>
            </CardContent></Card>
          </div>

          {/* Pending corrections + completion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card data-testid="card-submissions">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Ejercicios</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Entregas realizadas</span>
                  <span className="font-medium">{data.submissions.total} de {data.totals.students * data.totals.exercises}</span>
                </div>
                <Progress value={data.submissions.completionRate} />
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />{data.submissions.reviewed} corregidos</Badge>
                  {data.submissions.pending > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700"><AlertCircle className="w-3 h-3 mr-1" />{data.submissions.pending} pendientes</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card data-testid="card-exam-attempts">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><FileQuestion className="w-4 h-4" /> Exámenes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Intentos entregados</span>
                  <span className="font-medium">{data.examAttempts.total} de {data.totals.students * data.totals.exams}</span>
                </div>
                <Progress value={data.examAttempts.completionRate} />
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle2 className="w-3 h-3 mr-1" />{data.examAttempts.reviewed} corregidos</Badge>
                  {data.examAttempts.pending > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700"><AlertCircle className="w-3 h-3 mr-1" />{data.examAttempts.pending} pendientes</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pass/fail distribution */}
          <Card data-testid="card-pass-fail">
            <CardHeader className="pb-3"><CardTitle className="text-base">Distribución de calificaciones</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-green-50">
                  <div className="text-2xl font-bold text-green-700">{data.grades.passing}</div>
                  <div className="text-xs text-green-700/80 mt-1">Aprobados (≥5)</div>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <div className="text-2xl font-bold text-red-700">{data.grades.failing}</div>
                  <div className="text-xs text-red-700/80 mt-1">Suspensos (&lt;5)</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-muted-foreground">{data.grades.notGraded}</div>
                  <div className="text-xs text-muted-foreground mt-1">Sin nota</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top and bottom students */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card data-testid="card-top-students">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Mejores resultados</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.topStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos suficientes</p>
                ) : data.topStudents.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between text-sm" data-testid={`top-student-${s.id}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                      <span className="truncate">{s.name}</span>
                    </div>
                    <span className={`font-mono font-semibold ${gradeColor(s.average)}`}>{fmt(s.average)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card data-testid="card-bottom-students">
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="w-4 h-4 text-red-500" /> Necesitan apoyo</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {data.bottomStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin datos suficientes</p>
                ) : data.bottomStudents.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between text-sm" data-testid={`bottom-student-${s.id}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                      <span className="truncate">{s.name}</span>
                    </div>
                    <span className={`font-mono font-semibold ${gradeColor(s.average)}`}>{fmt(s.average)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Per-exercise/exam tables */}
          {data.perExercise.length > 0 && (
            <Card data-testid="card-per-exercise">
              <CardHeader className="pb-3"><CardTitle className="text-base">Por ejercicio</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.perExercise.map(e => (
                    <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="truncate flex-1">{e.title}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span>{e.submitted} entregas</span>
                        <span>{e.reviewed} corregidas</span>
                        <span className={`font-mono font-semibold ${gradeColor(e.average)}`}>Media: {fmt(e.average)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.perExam.length > 0 && (
            <Card data-testid="card-per-exam">
              <CardHeader className="pb-3"><CardTitle className="text-base">Por examen</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {data.perExam.map(e => (
                    <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="truncate flex-1">{e.title}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span>{e.attempts} intentos</span>
                        <span>{e.reviewed} corregidos</span>
                        <span className={`font-mono font-semibold ${gradeColor(e.average)}`}>Media: {fmt(e.average)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
