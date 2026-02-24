import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileQuestion, Trash2, Clock, Users, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Exam, Exercise, Course } from "@shared/schema";
import { motion } from "framer-motion";

export default function TeacherExamsPage() {
  const [open, setOpen] = useState(false);
  const [viewAttempts, setViewAttempts] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    exerciseId: "",
    courseId: "",
    durationMinutes: "60",
  });
  const { toast } = useToast();

  const { data: examList, isLoading } = useQuery<Exam[]>({ queryKey: ["/api/exams"] });
  const { data: exercises } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  const { data: attempts } = useQuery<any[]>({
    queryKey: [`/api/exams/${viewAttempts}/attempts`],
    enabled: !!viewAttempts,
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/exams", {
      ...form,
      durationMinutes: parseInt(form.durationMinutes) || 60,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      setOpen(false);
      setForm({ title: "", description: "", instructions: "", exerciseId: "", courseId: "", durationMinutes: "60" });
      toast({ title: "Examen creado correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (exam: Exam) => apiRequest("PATCH", `/api/exams/${exam.id}`, { isActive: !exam.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({ title: "Estado del examen actualizado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/exams/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      toast({ title: "Examen eliminado" });
    },
  });

  const filteredExercises = form.courseId
    ? exercises?.filter(e => e.courseId === form.courseId)
    : exercises;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Examenes</h1>
          <p className="text-muted-foreground text-sm mt-1">Evaluaciones con limite de tiempo</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-exam">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Examen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Crear Examen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input
                  data-testid="input-exam-title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Examen Tema 3: Compras y Ventas"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripcion</Label>
                <Textarea
                  data-testid="input-exam-description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Registrar los asientos de..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Instrucciones (opcional)</Label>
                <Textarea
                  data-testid="input-exam-instructions"
                  value={form.instructions}
                  onChange={e => setForm({ ...form, instructions: e.target.value })}
                  placeholder="Tipo IVA aplicable: 21%..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Curso</Label>
                  <Select value={form.courseId} onValueChange={v => setForm({ ...form, courseId: v, exerciseId: "" })}>
                    <SelectTrigger data-testid="select-exam-course">
                      <SelectValue placeholder="Curso..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duracion (min)</Label>
                  <Input
                    data-testid="input-exam-duration"
                    type="number"
                    min="5"
                    max="240"
                    value={form.durationMinutes}
                    onChange={e => setForm({ ...form, durationMinutes: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ejercicio Base</Label>
                <Select value={form.exerciseId} onValueChange={v => setForm({ ...form, exerciseId: v })}>
                  <SelectTrigger data-testid="select-exam-exercise">
                    <SelectValue placeholder="Seleccionar ejercicio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredExercises?.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-testid="button-save-exam"
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!form.title || !form.description || !form.exerciseId || !form.courseId || createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear Examen"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : examList && examList.length > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {examList.map(exam => {
            const course = courses?.find(c => c.id === exam.courseId);
            const exercise = exercises?.find(e => e.id === exam.exerciseId);
            return (
              <Card key={exam.id} className="hover-elevate" data-testid={`exam-card-${exam.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg mt-0.5 ${exam.isActive ? "bg-green-100 dark:bg-green-900/20" : "bg-muted"}`}>
                        <FileQuestion className={`w-5 h-5 ${exam.isActive ? "text-green-600" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-medium">{exam.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{exam.description}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant={exam.isActive ? "default" : "secondary"}>
                            {exam.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="w-3 h-3" />
                            {exam.durationMinutes} min
                          </Badge>
                          {course && <Badge variant="secondary">{course.name}</Badge>}
                          {exercise && <Badge variant="outline" className="text-[10px]">{exercise.title}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setViewAttempts(viewAttempts === exam.id ? null : exam.id)}
                        data-testid={`button-view-attempts-${exam.id}`}
                        title="Ver intentos"
                      >
                        <Users className="w-4 h-4 text-primary" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleMutation.mutate(exam)}
                        data-testid={`button-toggle-exam-${exam.id}`}
                        title={exam.isActive ? "Desactivar" : "Activar"}
                      >
                        {exam.isActive ? (
                          <ToggleRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(exam.id)}
                        data-testid={`button-delete-exam-${exam.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {viewAttempts === exam.id && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                        <Eye className="w-4 h-4" /> Intentos de alumnos
                      </h4>
                      {attempts && attempts.length > 0 ? (
                        <div className="space-y-2">
                          {attempts.map((a: any) => (
                            <div key={a.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2">
                              <span>{a.studentName}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={a.status === "submitted" ? "default" : a.status === "in_progress" ? "secondary" : "outline"}>
                                  {a.status === "submitted" ? "Entregado" : a.status === "in_progress" ? "En curso" : a.status === "expired" ? "Expirado" : "Sin empezar"}
                                </Badge>
                                {a.submittedAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(a.submittedAt).toLocaleString("es-ES")}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Ningun alumno ha iniciado este examen</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileQuestion className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No hay examenes creados</p>
            <p className="text-xs text-muted-foreground mt-1">Crea un examen basado en un ejercicio existente</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
