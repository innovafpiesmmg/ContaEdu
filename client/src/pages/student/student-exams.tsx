import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useExercise } from "@/lib/exercise-context";
import { Clock, FileQuestion, Play, Send, AlertTriangle, CheckCircle } from "lucide-react";
import type { Exam, ExamAttempt, ExerciseSubmission, JournalEntry, JournalLine } from "@shared/schema";
import { Star, Eye, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

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
  lines: SolutionLine[];
  points?: number;
}

function CountdownTimer({ startedAt, durationMinutes, onExpired }: {
  startedAt: string;
  durationMinutes: number;
  onExpired: () => void;
}) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    const tick = () => {
      const start = new Date(startedAt).getTime();
      const end = start + durationMinutes * 60 * 1000;
      const now = Date.now();
      const left = Math.max(0, Math.floor((end - now) / 1000));
      setRemaining(left);
      if (left <= 0) {
        onExpired();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt, durationMinutes, onExpired]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isUrgent = remaining < 300;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-lg ${isUrgent ? "bg-destructive/10 text-destructive animate-pulse" : "bg-primary/10 text-primary"}`}>
      <Clock className="w-5 h-5" />
      <span data-testid="text-exam-timer">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function StudentExamsPage() {
  const { data: examList, isLoading } = useQuery<Exam[]>({ queryKey: ["/api/exams"] });
  const { toast } = useToast();
  const { setCurrentExerciseId } = useExercise();
  const [, navigate] = useLocation();
  const [activeExamId, setActiveExamId] = useState<string | null>(null);

  const activeExam = examList?.find(e => e.id === activeExamId);

  const { data: attempt, refetch: refetchAttempt } = useQuery<ExamAttempt | null>({
    queryKey: [`/api/exams/${activeExamId}/attempt`],
    enabled: !!activeExamId,
  });

  const startMutation = useMutation({
    mutationFn: (examId: string) => apiRequest("POST", `/api/exams/${examId}/start`),
    onSuccess: (data: any, examId: string) => {
      refetchAttempt();
      const exam = examList?.find(e => e.id === examId);
      if (exam) {
        setCurrentExerciseId(exam.exerciseId);
      }
      toast({ title: "Examen iniciado. El temporizador esta en marcha." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const submitMutation = useMutation({
    mutationFn: (examId: string) => apiRequest("POST", `/api/exams/${examId}/submit`),
    onSuccess: () => {
      refetchAttempt();
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({ title: "Examen entregado correctamente" });
      setActiveExamId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleExpired = useCallback(() => {
    if (activeExamId && attempt?.status === "in_progress") {
      submitMutation.mutate(activeExamId);
      toast({ title: "Tiempo agotado", description: "El examen se ha entregado automaticamente", variant: "destructive" });
    }
  }, [activeExamId, attempt]);

  if (activeExam && attempt?.status === "in_progress") {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{activeExam.title}</h1>
            <p className="text-muted-foreground text-sm mt-1">{activeExam.description}</p>
          </div>
          <CountdownTimer
            startedAt={attempt.startedAt}
            durationMinutes={activeExam.durationMinutes}
            onExpired={handleExpired}
          />
        </div>

        {activeExam.instructions && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Instrucciones
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activeExam.instructions}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              El ejercicio del examen esta seleccionado automaticamente. Ve al Libro Diario para registrar tus asientos.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button onClick={() => navigate("/journal")} data-testid="button-go-journal">
                Ir al Libro Diario
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" data-testid="button-submit-exam">
                    <Send className="w-4 h-4 mr-2" />
                    Entregar Examen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Entregar examen</AlertDialogTitle>
                    <AlertDialogDescription>
                      Una vez entregado no podras modificar tus respuestas. Esta seguro/a?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => submitMutation.mutate(activeExam.id)}>
                      Si, entregar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exámenes</h1>
        <p className="text-muted-foreground text-sm mt-1">Evaluaciones disponibles</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : examList && examList.length > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {examList.map(exam => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onStart={(examId) => {
                setActiveExamId(examId);
                startMutation.mutate(examId);
              }}
              onResume={(examId) => setActiveExamId(examId)}
            />
          ))}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileQuestion className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No hay exámenes disponibles</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExamCard({ exam, onStart, onResume }: { exam: Exam; onStart: (id: string) => void; onResume: (id: string) => void }) {
  const [showEntries, setShowEntries] = useState(false);
  const { data: attempt } = useQuery<ExamAttempt | null>({
    queryKey: [`/api/exams/${exam.id}/attempt`],
  });
  const { data: submissions } = useQuery<ExerciseSubmission[]>({
    queryKey: ["/api/submissions"],
  });

  const { data: studentEntries } = useQuery<JournalEntryWithLines[]>({
    queryKey: ["/api/journal-entries", { exerciseId: exam.exerciseId }],
    queryFn: async () => {
      const res = await fetch(`/api/journal-entries?exerciseId=${exam.exerciseId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error");
      return res.json();
    },
    enabled: showEntries && !!exam.exerciseId,
  });

  const { data: solutionData } = useQuery<{ solution: SolutionEntry[] | null }>({
    queryKey: ["/api/exercises", exam.exerciseId, "student-solution"],
    queryFn: () => fetch(`/api/exercises/${exam.exerciseId}/student-solution`, { credentials: "include" }).then(r => r.json()),
    enabled: showEntries && !!exam.exerciseId,
  });

  const examSubmission = exam.exerciseId ? submissions?.find(s => s.exerciseId === exam.exerciseId) : null;
  const isReviewed = examSubmission?.status === "reviewed";
  const isSubmitted = attempt?.status === "submitted" || attempt?.status === "expired";
  const isInProgress = attempt?.status === "in_progress";
  const solution = solutionData?.solution || [];

  return (
    <Card className="hover-elevate" data-testid={`student-exam-card-${exam.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg mt-0.5 ${isReviewed ? "bg-green-100 dark:bg-green-900/20" : isSubmitted ? "bg-amber-100 dark:bg-amber-900/20" : "bg-primary/10"}`}>
              {isReviewed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : isSubmitted ? (
                <Clock className="w-5 h-5 text-amber-600" />
              ) : (
                <FileQuestion className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{exam.title}</p>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{exam.description}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {exam.durationMinutes} min
                </Badge>
                {isReviewed && (
                  <>
                    <Badge variant="default" className="bg-green-600">Corregido</Badge>
                    {examSubmission?.grade && (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                        <Star className="w-3 h-3" /> {examSubmission.grade} / 10
                      </Badge>
                    )}
                  </>
                )}
                {isSubmitted && !isReviewed && <Badge variant="secondary">Entregado — Pendiente de corrección</Badge>}
                {isInProgress && <Badge variant="secondary">En curso</Badge>}
              </div>

              {isReviewed && examSubmission?.feedback && (
                <div className="mt-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">Retroalimentación del profesor:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{examSubmission.feedback}</p>
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 flex flex-col gap-2">
            {isSubmitted || isReviewed ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEntries(!showEntries)}
                data-testid={`button-view-exam-entries-${exam.id}`}
              >
                {showEntries ? <ChevronUp className="w-3.5 h-3.5 mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
                {showEntries ? "Ocultar" : "Ver asientos"}
              </Button>
            ) : isInProgress ? (
              <Button size="sm" onClick={() => onResume(exam.id)} data-testid={`button-resume-exam-${exam.id}`}>
                <Play className="w-3.5 h-3.5 mr-1" />
                Continuar
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" data-testid={`button-start-exam-${exam.id}`}>
                    <Play className="w-3.5 h-3.5 mr-1" />
                    Comenzar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Iniciar examen</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tienes {exam.durationMinutes} minutos para completar este examen. El temporizador empezara inmediatamente. Esta seguro/a de que quieres comenzar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onStart(exam.id)}>
                      Comenzar examen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {showEntries && (isSubmitted || isReviewed) && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                <BookOpen className="w-4 h-4" /> Tus asientos
              </h4>
              {studentEntries && studentEntries.length > 0 ? (
                <div className="space-y-2">
                  {studentEntries.map(entry => (
                    <div key={entry.id} className="bg-muted/50 rounded-md px-3 py-2 text-sm" data-testid={`exam-student-entry-${entry.id}`}>
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
                <p className="text-xs text-muted-foreground">No registraste asientos en este examen</p>
              )}
            </div>

            {isReviewed && solution.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" /> Solución correcta
                </h4>
                <div className="space-y-2">
                  {solution.map((entry, i) => (
                    <div key={i} className="bg-green-50 dark:bg-green-950/20 rounded-md px-3 py-2 text-sm border border-green-200 dark:border-green-800" data-testid={`exam-solution-entry-${i}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="font-mono text-[10px]">#{entry.entryNumber}</Badge>
                        <span className="font-medium">{entry.description}</span>
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
                          {entry.lines.map((line, j) => (
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
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
