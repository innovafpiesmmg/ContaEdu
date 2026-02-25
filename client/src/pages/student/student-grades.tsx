import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Star, ClipboardList, FileQuestion, TrendingUp, Clock, CheckCircle, Send, Circle } from "lucide-react";
import { motion } from "framer-motion";

interface GradeItem {
  exerciseId?: string;
  examId?: string;
  title: string;
  type?: string;
  durationMinutes?: number;
  status: string;
  grade: string | null;
  feedback: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

interface StudentGradesResponse {
  exercises: GradeItem[];
  exams: GradeItem[];
}

function gradeColor(grade: number): string {
  if (grade >= 9) return "text-green-700 border-green-300 bg-green-50";
  if (grade >= 7) return "text-blue-700 border-blue-300 bg-blue-50";
  if (grade >= 5) return "text-yellow-700 border-yellow-300 bg-yellow-50";
  return "text-red-700 border-red-300 bg-red-50";
}

function StatusIcon({ status, hasGrade }: { status: string; hasGrade: boolean }) {
  if (hasGrade) return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (status === "submitted") return <Send className="w-4 h-4 text-amber-600" />;
  if (status === "in_progress") return <Clock className="w-4 h-4 text-blue-600" />;
  if (status === "expired") return <Clock className="w-4 h-4 text-red-600" />;
  return <Circle className="w-4 h-4 text-muted-foreground" />;
}

function statusLabel(status: string, hasGrade: boolean): string {
  if (hasGrade) return "Corregido";
  if (status === "submitted") return "Pendiente de corrección";
  if (status === "in_progress") return "En curso";
  if (status === "expired") return "Expirado";
  if (status === "reviewed") return "Corregido";
  return "Sin empezar";
}

function GradeRow({ item, icon }: { item: GradeItem; icon: React.ReactNode }) {
  const hasGrade = item.grade !== null;
  const gradeNum = hasGrade ? parseFloat(item.grade!) : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0" data-testid={`grade-row-${item.exerciseId || item.examId}`}>
      <StatusIcon status={item.status} hasGrade={hasGrade} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-medium truncate">{item.title}</p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {statusLabel(item.status, hasGrade)}
          </span>
          {item.reviewedAt && (
            <span className="text-[10px] text-muted-foreground">
              · {new Date(item.reviewedAt).toLocaleDateString("es-ES")}
            </span>
          )}
        </div>
        {hasGrade && item.feedback && (
          <p className="text-xs text-muted-foreground mt-1 italic line-clamp-2">"{item.feedback}"</p>
        )}
      </div>
      <div className="shrink-0">
        {gradeNum !== null ? (
          <Badge variant="outline" className={`text-sm font-bold gap-1 ${gradeColor(gradeNum)}`}>
            <Star className="w-3 h-3" />
            {gradeNum.toFixed(1)}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}

export default function StudentGradesPage() {
  const { data, isLoading } = useQuery<StudentGradesResponse>({
    queryKey: ["/api/student/grades"],
    staleTime: 0,
  });

  const allGrades: number[] = [];
  data?.exercises.forEach(e => { if (e.grade) allGrades.push(parseFloat(e.grade)); });
  data?.exams.forEach(e => { if (e.grade) allGrades.push(parseFloat(e.grade)); });
  const average = allGrades.length > 0 ? allGrades.reduce((a, b) => a + b, 0) / allGrades.length : null;

  const exerciseGrades = data?.exercises.filter(e => e.grade) || [];
  const examGrades = data?.exams.filter(e => e.grade) || [];
  const totalItems = (data?.exercises.length || 0) + (data?.exams.length || 0);
  const gradedItems = exerciseGrades.length + examGrades.length;
  const pendingItems = (data?.exercises.filter(e => e.status === "submitted").length || 0) +
    (data?.exams.filter(e => e.status === "submitted").length || 0);

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-student-grades-title">Mis Calificaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen de tus notas en ejercicios y exámenes</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                {average !== null ? (
                  <>
                    <p className={`text-2xl font-bold ${average >= 5 ? "text-green-600" : "text-red-600"}`} data-testid="text-student-average">
                      {average.toFixed(1)}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Media
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-muted-foreground">—</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Media</p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary" data-testid="text-graded-count">{gradedItems}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Corregidos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-amber-600" data-testid="text-pending-count">{pendingItems}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
                  <Send className="w-3 h-3" /> Pendientes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-muted-foreground" data-testid="text-total-count">{totalItems}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Total</p>
              </CardContent>
            </Card>
          </div>

          {data && data.exercises.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b bg-muted/30">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4" />
                    Ejercicios
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      {data.exercises.length}
                    </Badge>
                  </h3>
                </div>
                {data.exercises.map((item, idx) => (
                  <GradeRow
                    key={idx}
                    item={item}
                    icon={<ClipboardList className="w-3 h-3 text-muted-foreground shrink-0" />}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {data && data.exams.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b bg-muted/30">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <FileQuestion className="w-4 h-4" />
                    Exámenes
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      {data.exams.length}
                    </Badge>
                  </h3>
                </div>
                {data.exams.map((item, idx) => (
                  <GradeRow
                    key={idx}
                    item={item}
                    icon={<FileQuestion className="w-3 h-3 text-muted-foreground shrink-0" />}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {data && data.exercises.length === 0 && data.exams.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Aún no tienes actividades asignadas</p>
                <p className="text-xs text-muted-foreground mt-1">Las calificaciones aparecerán aquí cuando tu profesor las registre</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}