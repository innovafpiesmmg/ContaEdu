import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ClipboardList, BookOpen, PenLine, Eye, Send, Star, MessageSquare, Unlink2, GraduationCap, FileSpreadsheet, CheckCircle, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Exercise, Course, ExerciseSubmission, Exam, JournalEntry, JournalLine } from "@shared/schema";
import { useLocation } from "wouter";

interface SubmissionWithStudent extends ExerciseSubmission {
  studentName: string;
  studentUsername: string;
}

interface JournalEntryWithLines extends JournalEntry {
  lines: JournalLine[];
}

interface SolutionLine {
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
}

interface SolutionEntry {
  entryNumber: number;
  date: string;
  description: string;
  enunciado?: string;
  points?: number;
  lines: SolutionLine[];
}

export default function CourseExercisesPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewSubmissionsId, setViewSubmissionsId] = useState<string | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<SubmissionWithStudent | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [gradeText, setGradeText] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: exams } = useQuery<Exam[]>({ queryKey: ["/api/exams"] });
  const { data: pendingCounts } = useQuery<Record<string, number>>({ queryKey: ["/api/submissions/pending-counts"] });

  const { data: assignedExercises, isLoading: loadingAssigned } = useQuery<Exercise[]>({
    queryKey: ["/api/courses", selectedCourseId, "exercises"],
    queryFn: () => fetch(`/api/courses/${selectedCourseId}/exercises`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedCourseId,
  });

  const filteredExercises = (assignedExercises || []).filter(ex => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!ex.title.toLowerCase().includes(q) && !ex.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const unassignMutation = useMutation({
    mutationFn: ({ exerciseId, courseId }: { exerciseId: string; courseId: string }) =>
      apiRequest("POST", `/api/exercises/${exerciseId}/unassign`, { courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", selectedCourseId, "exercises"] });
      toast({ title: "Ejercicio desvinculado del curso" });
    },
  });

  const { data: submissions } = useQuery<SubmissionWithStudent[]>({
    queryKey: [`/api/submissions/exercise/${viewSubmissionsId}`],
    enabled: !!viewSubmissionsId,
  });

  const reviewMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/submissions/${id}/review`, { feedback: feedbackText, grade: gradeText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/submissions/exercise/${viewSubmissionsId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions/pending-counts"] });
      setReviewingSubmission(null);
      toast({ title: "Corrección enviada" });
    },
  });

  const selectedCourse = courses?.find(c => c.id === selectedCourseId);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ejercicios del Curso</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los ejercicios asignados a cada uno de tus cursos
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setLocation("/exercises")} data-testid="button-go-repository">
          <ClipboardList className="w-4 h-4 mr-1.5" />
          Ir al Repositorio
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium whitespace-nowrap">Curso:</Label>
        <Select value={selectedCourseId} onValueChange={v => { setSelectedCourseId(v); setViewSubmissionsId(null); }}>
          <SelectTrigger className="w-[300px]" data-testid="select-course">
            <SelectValue placeholder="Selecciona un curso..." />
          </SelectTrigger>
          <SelectContent>
            {courses?.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCourse && (
          <Badge variant="secondary" className="text-xs">
            Código: {selectedCourse.enrollmentCode}
          </Badge>
        )}
      </div>

      {!selectedCourseId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-lg font-medium mb-1">Selecciona un curso</p>
            <p className="text-muted-foreground text-sm">
              Elige uno de tus cursos para ver y gestionar los ejercicios asignados
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {(assignedExercises || []).length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-search-course-exercises"
                className="pl-10"
                placeholder="Buscar en ejercicios del curso..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {loadingAssigned ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : filteredExercises.length > 0 ? (
            <div className="space-y-3">
              {filteredExercises.map(ex => {
                const linkedExam = exams?.find(e => e.exerciseId === ex.id);
                const pending = pendingCounts?.[ex.id] || 0;
                const isExpanded = viewSubmissionsId === ex.id;

                return (
                  <Card key={ex.id} className="hover-elevate" data-testid={`course-exercise-card-${ex.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-lg mt-0.5 ${ex.exerciseType === "guided" ? "bg-chart-4/10" : "bg-chart-3/10"}`}>
                            {ex.exerciseType === "guided" ? (
                              <BookOpen className="w-5 h-5 text-chart-4" />
                            ) : (
                              <PenLine className="w-5 h-5 text-chart-3" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{ex.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ex.description}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant={ex.exerciseType === "guided" ? "default" : "secondary"}>
                                {ex.exerciseType === "guided" ? "Guiado" : "Práctica"}
                              </Badge>
                              {ex.recommendedLevel && (
                                <Badge variant="outline" className="text-xs gap-1 border-blue-300 text-blue-600 dark:text-blue-400">
                                  <GraduationCap className="w-3 h-3" />
                                  {ex.recommendedLevel.toUpperCase()}
                                </Badge>
                              )}
                              {linkedExam && (
                                <Badge variant="destructive" className="text-xs gap-1">
                                  <ClipboardList className="w-3 h-3" />
                                  Examen: {linkedExam.title}
                                </Badge>
                              )}
                              {ex.customAccountPlan && (
                                <Badge variant="outline" className="text-xs gap-1 border-purple-300 text-purple-600 dark:text-purple-400">
                                  <FileSpreadsheet className="w-3 h-3" />
                                  PGC personalizado
                                </Badge>
                              )}
                              {ex.solution && (
                                <Badge variant="outline" className="text-xs gap-1 border-green-300 text-green-600">
                                  <CheckCircle className="w-3 h-3" />
                                  Con solución
                                </Badge>
                              )}
                              {pending > 0 && (
                                <Badge variant="destructive" className="text-xs gap-1 animate-pulse">
                                  <Send className="w-3 h-3" />
                                  {pending} pendiente{pending !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setViewSubmissionsId(isExpanded ? null : ex.id)}
                            title="Ver entregas"
                            data-testid={`button-view-submissions-${ex.id}`}
                          >
                            <Eye className="w-4 h-4 text-primary" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => unassignMutation.mutate({ exerciseId: ex.id, courseId: selectedCourseId })}
                            title="Desvincular del curso"
                            data-testid={`button-unassign-${ex.id}`}
                          >
                            <Unlink2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                            <Send className="w-4 h-4" /> Entregas de alumnos
                          </h4>
                          {submissions && submissions.length > 0 ? (
                            <div className="space-y-2">
                              {submissions.map((s) => (
                                <div key={s.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2" data-testid={`submission-row-${s.id}`}>
                                  <div>
                                    <span className="font-medium">{s.studentName}</span>
                                    <span className="text-xs text-muted-foreground ml-2">@{s.studentUsername}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={s.status === "reviewed" ? "default" : s.status === "submitted" ? "secondary" : "outline"}>
                                      {s.status === "reviewed" ? "Corregido" : s.status === "submitted" ? "Entregado" : "En curso"}
                                    </Badge>
                                    {s.grade && (
                                      <Badge variant="outline" className="gap-1"><Star className="w-3 h-3" /> {s.grade}</Badge>
                                    )}
                                    {(s.status === "submitted" || s.status === "reviewed") && (
                                      <Button size="sm" variant="outline" onClick={() => { setReviewingSubmission(s); setFeedbackText(s.feedback || ""); setGradeText(s.grade || ""); }} data-testid={`button-review-${s.id}`}>
                                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> {s.status === "reviewed" ? "Reeditar" : "Corregir"}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Ningún alumno ha entregado este ejercicio</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (assignedExercises || []).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-lg font-medium mb-1">Sin ejercicios asignados</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Este curso no tiene ejercicios asignados. Asígnalos desde el Repositorio.
                </p>
                <Button onClick={() => setLocation("/exercises")} data-testid="button-go-repository-empty">
                  Ir al Repositorio
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground text-sm">No se encontraron ejercicios con ese criterio de búsqueda</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={!!reviewingSubmission} onOpenChange={(open) => !open && setReviewingSubmission(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Corregir ejercicio - {reviewingSubmission?.studentName}</DialogTitle>
          </DialogHeader>
          <ReviewContent
            submission={reviewingSubmission}
            gradeText={gradeText}
            setGradeText={setGradeText}
            feedbackText={feedbackText}
            setFeedbackText={setFeedbackText}
            onSubmit={() => reviewingSubmission && reviewMutation.mutate(reviewingSubmission.id)}
            isPending={reviewMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewContent({
  submission,
  gradeText,
  setGradeText,
  feedbackText,
  setFeedbackText,
  onSubmit,
  isPending,
}: {
  submission: SubmissionWithStudent | null;
  gradeText: string;
  setGradeText: (v: string) => void;
  feedbackText: string;
  setFeedbackText: (v: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const { data: studentEntries } = useQuery<JournalEntryWithLines[]>({
    queryKey: ["/api/audit/students", submission?.studentId, "journal", submission?.exerciseId],
    queryFn: () => fetch(`/api/audit/students/${submission!.studentId}/journal?exerciseId=${submission!.exerciseId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!submission,
  });

  const { data: solutionData } = useQuery<{ solution: SolutionEntry[] | null }>({
    queryKey: ["/api/exercises", submission?.exerciseId, "solution"],
    queryFn: () => fetch(`/api/exercises/${submission!.exerciseId}/solution`, { credentials: "include" }).then(r => r.json()),
    enabled: !!submission,
  });

  const solution = solutionData?.solution || [];
  const totalPoints = solution.reduce((s, e) => s + (e.points || 0), 0);

  return (
    <div className="space-y-4 pt-2">
      <Tabs defaultValue="student" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="student" data-testid="tab-student-entries">
            Asientos del alumno ({studentEntries?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="solution" data-testid="tab-solution">
            Solución ({solution.length}{totalPoints > 0 ? ` · ${totalPoints} pts` : ""})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student" className="mt-3 max-h-[40vh] overflow-y-auto">
          {studentEntries && studentEntries.length > 0 ? (
            <div className="space-y-2">
              {studentEntries.map(entry => (
                <div key={entry.id} className="bg-muted/50 rounded-md px-3 py-2 text-sm" data-testid={`student-entry-${entry.id}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="font-mono text-[10px]">#{entry.entryNumber}</Badge>
                    <span className="font-medium">{entry.description}</span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  {entry.lines && entry.lines.length > 0 && (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="text-left py-0.5">Cuenta</th>
                          <th className="text-right py-0.5">Debe</th>
                          <th className="text-right py-0.5">Haber</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.lines.map((line: JournalLine) => (
                          <tr key={line.id} className="border-t border-muted">
                            <td className="py-0.5">{line.accountCode} {line.accountName}</td>
                            <td className="text-right py-0.5 font-mono">{parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString("es-ES", { minimumFractionDigits: 2 }) : ""}</td>
                            <td className="text-right py-0.5 font-mono">{parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString("es-ES", { minimumFractionDigits: 2 }) : ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">El alumno no ha registrado asientos para este ejercicio</p>
          )}
        </TabsContent>

        <TabsContent value="solution" className="mt-3 max-h-[40vh] overflow-y-auto">
          {solution.length > 0 ? (
            <div className="space-y-2">
              {solution.map((entry: SolutionEntry, i: number) => (
                <div key={i} className="bg-green-50 dark:bg-green-950/20 rounded-md px-3 py-2 text-sm border border-green-200 dark:border-green-800" data-testid={`solution-entry-${i}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="font-mono text-[10px]">#{entry.entryNumber}</Badge>
                    <span className="font-medium">{entry.description}</span>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                    {entry.points !== undefined && (
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">{entry.points} pts</Badge>
                    )}
                  </div>
                  {entry.enunciado && (
                    <p className="text-xs text-muted-foreground italic mb-1">{entry.enunciado}</p>
                  )}
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left py-0.5">Cuenta</th>
                        <th className="text-right py-0.5">Debe</th>
                        <th className="text-right py-0.5">Haber</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entry.lines.map((line: SolutionLine, j: number) => (
                        <tr key={j} className="border-t border-green-200 dark:border-green-800">
                          <td className="py-0.5">{line.accountCode} {line.accountName}</td>
                          <td className="text-right py-0.5 font-mono">{parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString("es-ES", { minimumFractionDigits: 2 }) : ""}</td>
                          <td className="text-right py-0.5 font-mono">{parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString("es-ES", { minimumFractionDigits: 2 }) : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No hay solución cargada para este ejercicio</p>
          )}
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Nota (0-10)</Label>
          <Input
            data-testid="input-review-grade"
            type="number"
            min="0"
            max="10"
            step="0.25"
            value={gradeText}
            onChange={e => setGradeText(e.target.value)}
            placeholder="Ej: 7.50"
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Retroalimentación</Label>
          <Textarea
            data-testid="input-review-feedback"
            value={feedbackText}
            onChange={e => setFeedbackText(e.target.value)}
            placeholder="Escribe aquí tu retroalimentación para el alumno..."
            rows={3}
          />
        </div>
      </div>
      <Button
        data-testid="button-send-review"
        className="w-full"
        onClick={onSubmit}
        disabled={!feedbackText || isPending}
      >
        {isPending ? "Enviando..." : "Enviar corrección"}
      </Button>
    </div>
  );
}
