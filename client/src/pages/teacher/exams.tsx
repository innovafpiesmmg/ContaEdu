import { useState, useRef } from "react";
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
import { Plus, FileQuestion, Trash2, Clock, Users, Eye, ToggleLeft, ToggleRight, Upload, Download, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Exam, Exercise, Course } from "@shared/schema";
import { motion } from "framer-motion";

function generateExamTemplate(): string {
  return `# Examen: Examen Tema 3 - Compras y Ventas

**Duracion:** 60
**Ejercicio:** (titulo del ejercicio base)

## Descripcion
Examen practico sobre los asientos de compras y ventas con IVA.
El alumno debera registrar correctamente los asientos contables.

## Instrucciones
- Tipo de IVA aplicable: 21%
- Todas las operaciones se realizan a credito
- Utilizar las cuentas del PGC

---

# Examen: Control Tema 5 - Nominas

**Duracion:** 45
**Ejercicio:** (titulo del ejercicio base)

## Descripcion
Control practico sobre la contabilizacion de nominas y seguros sociales.

## Instrucciones
- Revisar los porcentajes de retencion indicados en cada enunciado
- Contabilizar tanto el devengo como el pago de la nomina
`;
}

interface ParsedExam {
  title: string;
  description: string;
  instructions: string;
  durationMinutes: number;
  exerciseTitle: string;
}

function parseExamsMD(md: string): ParsedExam[] {
  const exams: ParsedExam[] = [];
  const blocks = md.split(/\n\s*---\s*\n/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const titleMatch = block.match(/^#\s+Examen:\s*(.+)$/m);
    const durationMatch = block.match(/\*\*Duracion:\*\*\s*(\d+)/i);
    const exerciseMatch = block.match(/\*\*Ejercicio:\*\*\s*(.+)$/mi);
    const descMatch = block.match(/##\s+Descripcion\s*\n([\s\S]*?)(?=##|\z)/i);
    const instrMatch = block.match(/##\s+Instrucciones\s*\n([\s\S]*?)$/i);

    if (titleMatch) {
      let descText = descMatch ? descMatch[1].trim() : "";
      if (instrMatch) {
        descText = descText.replace(instrMatch[0], "").trim();
      }

      exams.push({
        title: titleMatch[1].trim(),
        durationMinutes: durationMatch ? parseInt(durationMatch[1]) : 60,
        exerciseTitle: exerciseMatch ? exerciseMatch[1].trim() : "",
        description: descText,
        instructions: instrMatch ? instrMatch[1].trim() : "",
      });
    }
  }
  return exams;
}

export default function TeacherExamsPage() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importCourseId, setImportCourseId] = useState("");
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const importMutation = useMutation({
    mutationFn: async (parsed: ParsedExam[]) => {
      const courseExercises = exercises?.filter(e => e.courseId === importCourseId) || [];
      for (const ex of parsed) {
        let exerciseId = "";
        if (ex.exerciseTitle) {
          const found = courseExercises.find(
            e => e.title.toLowerCase().includes(ex.exerciseTitle.toLowerCase()) ||
                 ex.exerciseTitle.toLowerCase().includes(e.title.toLowerCase())
          );
          if (found) exerciseId = found.id;
        }
        if (!exerciseId) {
          throw new Error(`No se encontro un ejercicio base para el examen "${ex.title}". Asegurate de que el nombre del ejercicio en la plantilla coincida con uno existente en el curso.`);
        }
        await apiRequest("POST", "/api/exams", {
          title: ex.title,
          description: ex.description,
          instructions: ex.instructions || null,
          exerciseId,
          courseId: importCourseId,
          durationMinutes: ex.durationMinutes,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      setImportOpen(false);
      setImportText("");
      setImportCourseId("");
      toast({ title: "Examenes importados correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error al importar", description: err.message, variant: "destructive" });
    },
  });

  const filteredExercises = form.courseId
    ? exercises?.filter(e => e.courseId === form.courseId)
    : exercises;

  const handleImport = () => {
    const parsed = parseExamsMD(importText);
    if (parsed.length === 0) {
      toast({ title: "Error", description: "No se encontraron examenes validos en el texto", variant: "destructive" });
      return;
    }
    if (!importCourseId) {
      toast({ title: "Error", description: "Selecciona un curso", variant: "destructive" });
      return;
    }
    importMutation.mutate(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImportText(ev.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const content = generateExamTemplate();
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_examenes.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewParsed = importText ? parseExamsMD(importText) : [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Examenes</h1>
          <p className="text-muted-foreground text-sm mt-1">Evaluaciones con limite de tiempo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} data-testid="button-import-exams">
            <Upload className="w-4 h-4 mr-2" />
            Importar MD
          </Button>
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
            <p className="text-xs text-muted-foreground mt-1">Crea un examen o importa desde un archivo MD</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Examenes desde Markdown</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="button-download-exam-template">
                <Download className="w-4 h-4 mr-1.5" />
                Descargar plantilla
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.markdown"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-upload-exam-file">
                <FileText className="w-4 h-4 mr-1.5" />
                Subir archivo .md
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Curso destino</Label>
              <Select value={importCourseId} onValueChange={setImportCourseId}>
                <SelectTrigger data-testid="select-import-exam-course">
                  <SelectValue placeholder="Seleccionar curso..." />
                </SelectTrigger>
                <SelectContent>
                  {courses?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {importCourseId && (
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                Ejercicios disponibles en este curso:{" "}
                {exercises?.filter(e => e.courseId === importCourseId).map(e => e.title).join(", ") || "Ninguno"}
              </div>
            )}

            <div className="space-y-2">
              <Label>Contenido Markdown</Label>
              <Textarea
                data-testid="textarea-import-exams"
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={`# Examen: Titulo del examen\n\n**Duracion:** 60\n**Ejercicio:** Titulo del ejercicio base\n\n## Descripcion\nDescripcion del examen...\n\n## Instrucciones\nInstrucciones para el alumno...\n\n---\n\n# Examen: Otro examen\n...`}
                className="font-mono text-xs"
                rows={12}
              />
            </div>

            {previewParsed.length > 0 && (
              <div className="space-y-2">
                <Label>Vista previa ({previewParsed.length} examen{previewParsed.length !== 1 ? "es" : ""} detectado{previewParsed.length !== 1 ? "s" : ""})</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {previewParsed.map((ex, i) => {
                    const courseExercises = exercises?.filter(e => e.courseId === importCourseId) || [];
                    const matched = ex.exerciseTitle ? courseExercises.find(
                      e => e.title.toLowerCase().includes(ex.exerciseTitle.toLowerCase()) ||
                           ex.exerciseTitle.toLowerCase().includes(e.title.toLowerCase())
                    ) : null;
                    return (
                      <div key={i} className="bg-muted/50 rounded-md px-3 py-2 text-sm" data-testid={`preview-exam-${i}`}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ex.title}</span>
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <Clock className="w-3 h-3" />
                            {ex.durationMinutes} min
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ex.description}</p>
                        {ex.exerciseTitle && (
                          <p className={`text-xs mt-0.5 ${matched ? "text-green-600" : "text-red-500 font-medium"}`}>
                            Ejercicio: {ex.exerciseTitle} {matched ? "(encontrado)" : "(no encontrado - corrige el nombre)"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              data-testid="button-confirm-import-exams"
              className="w-full"
              onClick={handleImport}
              disabled={previewParsed.length === 0 || !importCourseId || importMutation.isPending}
            >
              {importMutation.isPending ? "Importando..." : `Importar ${previewParsed.length} examen${previewParsed.length !== 1 ? "es" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
