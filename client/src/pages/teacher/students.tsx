import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Trash2, Eye, Filter, Pencil, Download, Upload } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User, Course } from "@shared/schema";
import { motion } from "framer-motion";

export default function StudentsPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", username: "", password: "", courseId: "" });
  const [filterCourseId, setFilterCourseId] = useState<string>("all");
  const [editStudent, setEditStudent] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ fullName: "", username: "", courseId: "" });
  const [importOpen, setImportOpen] = useState(false);
  const [importCourseId, setImportCourseId] = useState("");
  const [importCsv, setImportCsv] = useState("");
  const [importResult, setImportResult] = useState<{ created: number; total: number; results: any[] } | null>(null);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/users/students/import", { csv: importCsv, courseId: importCourseId });
      return await res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/students"] });
      setImportResult(data);
      toast({ title: `Importados ${data.created} de ${data.total}` });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportCsv(String(reader.result || ""));
    reader.readAsText(file, "utf-8");
  };

  const { data: students, isLoading } = useQuery<User[]>({ queryKey: ["/api/users/students"] });
  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  const filteredStudents = students?.filter(s => {
    if (filterCourseId === "all") return true;
    return s.courseId === filterCourseId;
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/users/students", { ...form, role: "student" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/students"] });
      setOpen(false);
      setForm({ fullName: "", username: "", password: "", courseId: "" });
      toast({ title: "Alumno creado correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/users/${editStudent!.id}`, editForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/students"] });
      setEditStudent(null);
      toast({ title: "Alumno actualizado correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/students"] });
      toast({ title: "Alumno eliminado" });
    },
  });

  const openEditDialog = (student: User) => {
    setEditStudent(student);
    setEditForm({
      fullName: student.fullName,
      username: student.username,
      courseId: student.courseId || "",
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alumnos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona a tus estudiantes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          data-testid="button-export-students-csv"
          onClick={() => {
            const qs = filterCourseId !== "all" ? `?courseId=${filterCourseId}` : "";
            window.location.href = `/api/users/students/export.csv${qs}`;
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
        <Button
          variant="outline"
          data-testid="button-import-students"
          onClick={() => { setImportOpen(true); setImportResult(null); setImportCsv(""); setImportCourseId(filterCourseId !== "all" ? filterCourseId : ""); }}
        >
          <Upload className="w-4 h-4 mr-2" />
          Importar CSV
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-student">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Alumno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Alumno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input
                  data-testid="input-student-name"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Juan Perez Martinez"
                />
              </div>
              <div className="space-y-2">
                <Label>Usuario</Label>
                <Input
                  data-testid="input-student-username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="jperez"
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input
                  data-testid="input-student-password"
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label>Curso</Label>
                <Select value={form.courseId} onValueChange={v => setForm({ ...form, courseId: v })}>
                  <SelectTrigger data-testid="select-course">
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
                data-testid="button-save-student"
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!form.fullName || !form.username || !form.password || !form.courseId || createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear Alumno"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={o => { setImportOpen(o); if (!o) setImportResult(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar alumnos desde CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Formato CSV (separador <code>;</code>):</p>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">Nombre completo;Usuario;Contraseña;Email{"\n"}Juan Pérez;jperez2;alumno123;jp@correo.com</pre>
              <p>Email es opcional. Excel y LibreOffice exportan en este formato.</p>
            </div>
            <div className="space-y-2">
              <Label>Curso destino</Label>
              <Select value={importCourseId} onValueChange={setImportCourseId}>
                <SelectTrigger data-testid="select-import-course">
                  <SelectValue placeholder="Seleccionar curso..." />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Archivo CSV</Label>
              <Input type="file" accept=".csv,text/csv" onChange={handleFileChange} data-testid="input-import-file" />
            </div>
            {importCsv && (
              <div className="space-y-2">
                <Label>Vista previa</Label>
                <pre className="bg-muted p-2 rounded text-xs max-h-32 overflow-auto">{importCsv.slice(0, 500)}{importCsv.length > 500 ? "..." : ""}</pre>
              </div>
            )}
            {importResult && (
              <div className="space-y-2 text-sm">
                <p className="font-medium">Resultado: {importResult.created} creados de {importResult.total}</p>
                {importResult.results.some((r: any) => !r.ok) && (
                  <div className="max-h-32 overflow-auto text-xs space-y-1">
                    {importResult.results.filter((r: any) => !r.ok).map((r: any, i: number) => (
                      <div key={i} className="text-destructive">Fila {r.row} ({r.username || "?"}): {r.error}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Button
              data-testid="button-confirm-import"
              className="w-full"
              onClick={() => importMutation.mutate()}
              disabled={!importCsv || !importCourseId || importMutation.isPending}
            >
              {importMutation.isPending ? "Importando..." : "Importar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {courses && courses.length > 1 && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterCourseId} onValueChange={setFilterCourseId}>
            <SelectTrigger className="w-64" data-testid="select-filter-course">
              <SelectValue placeholder="Filtrar por curso..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cursos</SelectItem>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : filteredStudents && filteredStudents.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {filteredStudents.map(s => {
            const course = courses?.find(c => c.id === s.courseId);
            return (
              <Card key={s.id} className="hover-elevate" data-testid={`student-card-${s.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-chart-2/10 text-chart-2 font-semibold">
                        {s.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground">@{s.username}</p>
                      {course && <Badge variant="secondary" className="mt-1">{course.name}</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/students/${s.id}/audit`}>
                        <Button
                          size="icon"
                          variant="ghost"
                          data-testid={`button-audit-student-${s.id}`}
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </Button>
                      </Link>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(s)}
                        data-testid={`button-edit-student-${s.id}`}
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(s.id)}
                        data-testid={`button-delete-student-${s.id}`}
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
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {filterCourseId !== "all" ? "No hay alumnos en este curso" : "No hay alumnos matriculados"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filterCourseId !== "all" ? "Los alumnos se pueden matricular usando el código de matriculación del curso" : "Crea tu primer alumno para empezar"}
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editStudent} onOpenChange={open => { if (!open) setEditStudent(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Alumno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input
                data-testid="input-edit-student-name"
                value={editForm.fullName}
                onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Usuario</Label>
              <Input
                data-testid="input-edit-student-username"
                value={editForm.username}
                onChange={e => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Curso</Label>
              <Select value={editForm.courseId} onValueChange={v => setEditForm({ ...editForm, courseId: v })}>
                <SelectTrigger data-testid="select-edit-student-course">
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
              data-testid="button-save-edit-student"
              className="w-full"
              onClick={() => updateMutation.mutate()}
              disabled={!editForm.fullName || !editForm.username || !editForm.courseId || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}