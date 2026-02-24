import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, BookOpen, PenLine, CheckCircle2, Send, Star, MessageSquare, Eye, ChevronDown, ChevronUp, Paperclip, FileText, File } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useExercise } from "@/lib/exercise-context";
import { useLocation } from "wouter";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Exercise, ExerciseSubmission, ExerciseDocument } from "@shared/schema";
import { motion } from "framer-motion";

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
  lines: SolutionLine[];
}

function ExerciseDocumentsViewer({ exerciseId }: { exerciseId: string }) {
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  const { data: documents } = useQuery<ExerciseDocument[]>({
    queryKey: ["/api/exercises", exerciseId, "documents"],
    queryFn: () => fetch(`/api/exercises/${exerciseId}/documents`, { credentials: "include" }).then(r => r.json()),
  });

  if (!documents || documents.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Paperclip className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium">Documentos del ejercicio</span>
        <Badge variant="outline" className="text-xs">{documents.length}</Badge>
      </div>
      <div className="space-y-1.5">
        {documents.map(doc => (
          <div key={doc.id}>
            <div className="flex items-center gap-2">
              <a
                href={`/uploads/documents/${doc.fileName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
                data-testid={`student-doc-link-${doc.id}`}
              >
                {doc.mimeType === "application/pdf" ? (
                  <FileText className="w-4 h-4 shrink-0" />
                ) : (
                  <File className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">{doc.originalName}</span>
              </a>
              {doc.mimeType === "application/pdf" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => setViewingDoc(viewingDoc === doc.id ? null : doc.id)}
                  data-testid={`button-preview-doc-${doc.id}`}
                >
                  {viewingDoc === doc.id ? <ChevronUp className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  {viewingDoc === doc.id ? "Ocultar" : "Vista previa"}
                </Button>
              )}
              {doc.mimeType.startsWith("image/") && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => setViewingDoc(viewingDoc === doc.id ? null : doc.id)}
                  data-testid={`button-preview-doc-${doc.id}`}
                >
                  {viewingDoc === doc.id ? <ChevronUp className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  {viewingDoc === doc.id ? "Ocultar" : "Ver imagen"}
                </Button>
              )}
            </div>
            {viewingDoc === doc.id && doc.mimeType === "application/pdf" && (
              <div className="mt-2 border rounded-lg overflow-hidden" data-testid={`pdf-viewer-${doc.id}`}>
                <iframe
                  src={`/uploads/documents/${doc.fileName}`}
                  className="w-full h-[600px]"
                  title={doc.originalName}
                />
              </div>
            )}
            {viewingDoc === doc.id && doc.mimeType.startsWith("image/") && (
              <div className="mt-2 border rounded-lg overflow-hidden p-2" data-testid={`image-viewer-${doc.id}`}>
                <img
                  src={`/uploads/documents/${doc.fileName}`}
                  alt={doc.originalName}
                  className="max-w-full rounded"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentExercisesPage() {
  const { data: exercises, isLoading } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const { data: submissions } = useQuery<ExerciseSubmission[]>({ queryKey: ["/api/submissions"] });
  const { currentExerciseId, setCurrentExerciseId } = useExercise();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [confirmSubmitId, setConfirmSubmitId] = useState<string | null>(null);
  const [viewSolutionId, setViewSolutionId] = useState<string | null>(null);

  const { data: solutionData } = useQuery<{ solution: SolutionEntry[] | null }>({
    queryKey: ["/api/exercises", viewSolutionId, "student-solution"],
    queryFn: async () => {
      const res = await fetch(`/api/exercises/${viewSolutionId}/student-solution`, { credentials: "include" });
      if (!res.ok) return { solution: null };
      return res.json();
    },
    enabled: !!viewSolutionId,
  });

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

                      <ExerciseDocumentsViewer exerciseId={ex.id} />

                      {isReviewed && sub && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="w-4 h-4 text-green-700 dark:text-green-400" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                              Retroalimentación del profesor
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 text-green-700 border-green-300 hover:bg-green-100 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-900/50"
                            onClick={() => setViewSolutionId(viewSolutionId === ex.id ? null : ex.id)}
                            data-testid={`button-view-solution-${ex.id}`}
                          >
                            {viewSolutionId === ex.id ? (
                              <><ChevronUp className="w-3.5 h-3.5 mr-1.5" /> Ocultar solución</>
                            ) : (
                              <><Eye className="w-3.5 h-3.5 mr-1.5" /> Ver solución del profesor</>
                            )}
                          </Button>
                          {viewSolutionId === ex.id && solutionData?.solution && (
                            <div className="mt-3 space-y-3" data-testid={`solution-view-${ex.id}`}>
                              <p className="text-xs font-medium text-green-700 dark:text-green-400">Solución correcta:</p>
                              {solutionData.solution.map((entry: SolutionEntry, i: number) => (
                                <div key={i} className="bg-white dark:bg-green-950/50 rounded-md px-3 py-2 border border-green-200 dark:border-green-800">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-green-800 dark:text-green-300">
                                      Asiento {entry.entryNumber}: {entry.description}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">{entry.date}</span>
                                  </div>
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
                                          <td className="py-0.5 text-green-800 dark:text-green-300">{line.accountCode} {line.accountName}</td>
                                          <td className="text-right py-0.5 text-green-800 dark:text-green-300">{parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString("es-ES", { minimumFractionDigits: 2 }) : ""}</td>
                                          <td className="text-right py-0.5 text-green-800 dark:text-green-300">{parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString("es-ES", { minimumFractionDigits: 2 }) : ""}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ))}
                            </div>
                          )}
                          {viewSolutionId === ex.id && solutionData && !solutionData.solution && (
                            <p className="mt-2 text-xs text-muted-foreground italic">Este ejercicio no tiene solución cargada por el profesor.</p>
                          )}
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
