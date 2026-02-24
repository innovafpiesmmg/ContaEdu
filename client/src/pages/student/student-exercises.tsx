import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, BookOpen, PenLine, CheckCircle2, Send, Star, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useExercise } from "@/lib/exercise-context";
import { useLocation } from "wouter";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Exercise, ExerciseSubmission } from "@shared/schema";
import { motion } from "framer-motion";

export default function StudentExercisesPage() {
  const { data: exercises, isLoading } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const { data: submissions } = useQuery<ExerciseSubmission[]>({ queryKey: ["/api/submissions"] });
  const { currentExerciseId, setCurrentExerciseId } = useExercise();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [confirmSubmitId, setConfirmSubmitId] = useState<string | null>(null);

  const selectExercise = (ex: Exercise) => {
    setCurrentExerciseId(ex.id);
    toast({ title: `Ejercicio seleccionado: ${ex.title}` });
    setLocation("/journal");
  };

  const submitMutation = useMutation({
    mutationFn: (exerciseId: string) => apiRequest("POST", `/api/submissions/${exerciseId}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      setConfirmSubmitId(null);
      toast({ title: "Ejercicio entregado correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const getSubmission = (exerciseId: string) => submissions?.find(s => s.exerciseId === exerciseId);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ejercicios</h1>
        <p className="text-muted-foreground text-sm mt-1">Selecciona un ejercicio para trabajar o entrega los completados</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : exercises && exercises.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {exercises.map(ex => {
            const isActive = currentExerciseId === ex.id;
            const sub = getSubmission(ex.id);
            const isSubmitted = sub?.status === "submitted";
            const isReviewed = sub?.status === "reviewed";

            return (
              <Card
                key={ex.id}
                className={`hover-elevate transition-all ${isActive ? "ring-2 ring-primary" : ""} ${isReviewed ? "ring-2 ring-green-500/50" : ""}`}
                data-testid={`student-exercise-${ex.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg mt-0.5 ${ex.exerciseType === "guided" ? "bg-chart-4/10" : "bg-chart-3/10"}`}>
                      {ex.exerciseType === "guided" ? (
                        <BookOpen className="w-5 h-5 text-chart-4" />
                      ) : (
                        <PenLine className="w-5 h-5 text-chart-3" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{ex.title}</p>
                        <Badge variant={ex.exerciseType === "guided" ? "default" : "secondary"}>
                          {ex.exerciseType === "guided" ? "Guiado" : "Practica"}
                        </Badge>
                        {isActive && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        )}
                        {isSubmitted && (
                          <Badge variant="default" className="bg-amber-600" data-testid={`badge-submitted-${ex.id}`}>
                            <Send className="w-3 h-3 mr-1" />
                            Entregado
                          </Badge>
                        )}
                        {isReviewed && (
                          <Badge variant="default" className="bg-green-600" data-testid={`badge-reviewed-${ex.id}`}>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Corregido
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{ex.description}</p>

                      {isReviewed && sub && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-4 h-4 text-green-700 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                              Retroalimentacion del profesor
                            </span>
                            {sub.grade && (
                              <Badge variant="secondary" className="ml-auto" data-testid={`text-grade-${ex.id}`}>
                                <Star className="w-3 h-3 mr-1" />
                                Nota: {sub.grade}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-green-800 dark:text-green-300" data-testid={`text-feedback-${ex.id}`}>
                            {sub.feedback}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {!isSubmitted && !isReviewed && (
                          <Button
                            size="sm"
                            variant={isActive ? "secondary" : "default"}
                            onClick={() => selectExercise(ex)}
                            data-testid={`button-select-exercise-${ex.id}`}
                          >
                            {isActive ? "Ya estas en este ejercicio" : "Trabajar en este ejercicio"}
                          </Button>
                        )}
                        {!isSubmitted && !isReviewed && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 border-amber-300 hover:bg-amber-50"
                            onClick={() => setConfirmSubmitId(ex.id)}
                            data-testid={`button-submit-exercise-${ex.id}`}
                          >
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            Entregar ejercicio
                          </Button>
                        )}
                        {isSubmitted && (
                          <p className="text-xs text-muted-foreground">
                            Entregado el {sub?.submittedAt ? new Date(sub.submittedAt).toLocaleDateString("es-ES") : ""}. Pendiente de corrección.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No hay ejercicios asignados</p>
            <p className="text-xs text-muted-foreground mt-1">Tu profesor aun no ha creado ejercicios para tu curso</p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!confirmSubmitId} onOpenChange={(open) => !open && setConfirmSubmitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Entregar ejercicio</AlertDialogTitle>
            <AlertDialogDescription>
              Una vez entregado, el profesor podra revisar tu trabajo y darte retroalimentacion.
              No podras modificar los asientos de este ejercicio despues de entregarlo.
              ¿Estas seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submit">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-submit"
              onClick={() => confirmSubmitId && submitMutation.mutate(confirmSubmitId)}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? "Entregando..." : "Confirmar entrega"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
