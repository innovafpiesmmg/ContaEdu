import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, BookOpen, PenLine, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useExercise } from "@/lib/exercise-context";
import { useLocation } from "wouter";
import type { Exercise } from "@shared/schema";
import { motion } from "framer-motion";

export default function StudentExercisesPage() {
  const { data: exercises, isLoading } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const { currentExerciseId, setCurrentExerciseId } = useExercise();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const selectExercise = (ex: Exercise) => {
    setCurrentExerciseId(ex.id);
    toast({ title: `Ejercicio seleccionado: ${ex.title}` });
    setLocation("/journal");
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ejercicios</h1>
        <p className="text-muted-foreground text-sm mt-1">Selecciona un ejercicio para trabajar en él</p>
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
            return (
              <Card
                key={ex.id}
                className={`hover-elevate transition-all ${isActive ? "ring-2 ring-primary" : ""}`}
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
                          {ex.exerciseType === "guided" ? "Guiado" : "Práctica"}
                        </Badge>
                        {isActive && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{ex.description}</p>
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant={isActive ? "secondary" : "default"}
                          onClick={() => selectExercise(ex)}
                          data-testid={`button-select-exercise-${ex.id}`}
                        >
                          {isActive ? "Ya estás en este ejercicio" : "Trabajar en este ejercicio"}
                        </Button>
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
            <p className="text-xs text-muted-foreground mt-1">Tu profesor aún no ha creado ejercicios para tu curso</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
