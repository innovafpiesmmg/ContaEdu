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
import { useToast } from "@/hooks/use-toast";
import { Plus, ClipboardList, Trash2, BookOpen, PenLine } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Exercise, Course } from "@shared/schema";
import { motion } from "framer-motion";

export default function ExercisesPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", exerciseType: "practice" as string, courseId: "" });
  const { toast } = useToast();

  const { data: exercises, isLoading } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/exercises", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setOpen(false);
      setForm({ title: "", description: "", exerciseType: "practice", courseId: "" });
      toast({ title: "Ejercicio creado correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/exercises/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({ title: "Ejercicio eliminado" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ejercicios</h1>
          <p className="text-muted-foreground text-sm mt-1">Biblioteca de casos prácticos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-exercise">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Ejercicio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Ejercicio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  data-testid="input-exercise-title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Asiento de compra con IVA"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  data-testid="input-exercise-description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Registrar la compra de mercaderías..."
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.exerciseType} onValueChange={v => setForm({ ...form, exerciseType: v })}>
                  <SelectTrigger data-testid="select-exercise-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guided">Guiado</SelectItem>
                    <SelectItem value="practice">Práctica Libre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Curso</Label>
                <Select value={form.courseId} onValueChange={v => setForm({ ...form, courseId: v })}>
                  <SelectTrigger data-testid="select-exercise-course">
                    <SelectValue placeholder="Seleccionar curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-testid="button-save-exercise"
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!form.title || !form.description || !form.courseId || createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear Ejercicio"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
            const course = courses?.find(c => c.id === ex.courseId);
            return (
              <Card key={ex.id} className="hover-elevate" data-testid={`exercise-card-${ex.id}`}>
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
                          {course && <Badge variant="secondary">{course.name}</Badge>}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(ex.id)}
                      data-testid={`button-delete-exercise-${ex.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
            <p className="text-muted-foreground">No hay ejercicios creados</p>
            <p className="text-xs text-muted-foreground mt-1">Crea tu primer ejercicio para empezar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
