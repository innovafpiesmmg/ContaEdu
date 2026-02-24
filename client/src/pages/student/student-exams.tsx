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
import type { Exam, ExamAttempt } from "@shared/schema";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

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
        <h1 className="text-2xl font-semibold tracking-tight">Examenes</h1>
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
            <p className="text-muted-foreground">No hay examenes disponibles</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExamCard({ exam, onStart, onResume }: { exam: Exam; onStart: (id: string) => void; onResume: (id: string) => void }) {
  const { data: attempt } = useQuery<ExamAttempt | null>({
    queryKey: [`/api/exams/${exam.id}/attempt`],
  });

  const isSubmitted = attempt?.status === "submitted" || attempt?.status === "expired";
  const isInProgress = attempt?.status === "in_progress";

  return (
    <Card className="hover-elevate" data-testid={`student-exam-card-${exam.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg mt-0.5 ${isSubmitted ? "bg-green-100 dark:bg-green-900/20" : "bg-primary/10"}`}>
              {isSubmitted ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <FileQuestion className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <p className="font-medium">{exam.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{exam.description}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {exam.durationMinutes} min
                </Badge>
                {isSubmitted && <Badge variant="default" className="bg-green-600">Entregado</Badge>}
                {isInProgress && <Badge variant="secondary">En curso</Badge>}
              </div>
            </div>
          </div>
          <div className="shrink-0">
            {isSubmitted ? (
              <Badge variant="outline" className="text-green-600">Completado</Badge>
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
      </CardContent>
    </Card>
  );
}
