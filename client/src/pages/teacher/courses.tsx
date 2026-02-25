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
import { Plus, GraduationCap, Trash2, Copy, KeyRound, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Course, SchoolYear } from "@shared/schema";
import { motion } from "framer-motion";

export default function CoursesPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", schoolYearId: "" });
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", schoolYearId: "" });
  const { toast } = useToast();

  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: years } = useQuery<SchoolYear[]>({ queryKey: ["/api/school-years"] });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/courses", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setOpen(false);
      setForm({ name: "", description: "", schoolYearId: "" });
      toast({ title: "Curso creado correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/courses/${editCourse!.id}`, editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      setEditCourse(null);
      toast({ title: "Curso actualizado correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Curso eliminado" });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado al portapapeles" });
  };

  const openEditDialog = (course: Course) => {
    setEditCourse(course);
    setEditForm({
      name: course.name,
      description: course.description || "",
      schoolYearId: course.schoolYearId,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis Cursos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona tus grupos de clase</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-course">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Curso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nombre del Curso</Label>
                <Input
                  data-testid="input-course-name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="1º CFGM Gestión Administrativa"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  data-testid="input-course-description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción del curso..."
                />
              </div>
              <div className="space-y-2">
                <Label>Año Escolar</Label>
                <Select value={form.schoolYearId} onValueChange={v => setForm({ ...form, schoolYearId: v })}>
                  <SelectTrigger data-testid="select-year">
                    <SelectValue placeholder="Seleccionar año..." />
                  </SelectTrigger>
                  <SelectContent>
                    {years?.map(y => (
                      <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                data-testid="button-save-course"
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!form.name || !form.schoolYearId || createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear Curso"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      ) : courses && courses.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {courses.map(c => {
            const year = years?.find(y => y.id === c.schoolYearId);
            return (
              <Card key={c.id} className="hover-elevate" data-testid={`course-card-${c.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-lg bg-chart-1/10 mt-0.5">
                        <GraduationCap className="w-5 h-5 text-chart-1" />
                      </div>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                        {year && <Badge variant="secondary" className="mt-2">{year.name}</Badge>}
                        {c.enrollmentCode && (
                          <div className="flex items-center gap-2 mt-2">
                            <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="font-mono text-sm font-semibold tracking-widest" data-testid={`enrollment-code-${c.id}`}>
                              {c.enrollmentCode}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => copyCode(c.enrollmentCode!)}
                              data-testid={`button-copy-code-${c.id}`}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(c)}
                        data-testid={`button-edit-course-${c.id}`}
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(c.id)}
                        data-testid={`button-delete-course-${c.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
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
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No tienes cursos creados</p>
            <p className="text-xs text-muted-foreground mt-1">Crea tu primer curso para empezar</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editCourse} onOpenChange={open => { if (!open) setEditCourse(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre del Curso</Label>
              <Input
                data-testid="input-edit-course-name"
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                data-testid="input-edit-course-description"
                value={editForm.description}
                onChange={e => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Año Escolar</Label>
              <Select value={editForm.schoolYearId} onValueChange={v => setEditForm({ ...editForm, schoolYearId: v })}>
                <SelectTrigger data-testid="select-edit-year">
                  <SelectValue placeholder="Seleccionar año..." />
                </SelectTrigger>
                <SelectContent>
                  {years?.map(y => (
                    <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              data-testid="button-save-edit-course"
              className="w-full"
              onClick={() => updateMutation.mutate()}
              disabled={!editForm.name || !editForm.schoolYearId || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}