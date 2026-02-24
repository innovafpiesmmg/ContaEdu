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
import { Plus, ClipboardList, Trash2, BookOpen, PenLine, Upload, Download, FileText, Send, Star, MessageSquare, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Exercise, Course, ExerciseSubmission } from "@shared/schema";
import { motion } from "framer-motion";

interface SubmissionWithStudent extends ExerciseSubmission {
  studentName: string;
  studentUsername: string;
}

function generateExerciseTemplate(): string {
  return `# Ejercicio: Operaciones de compraventa con IVA

**Tipo:** practice

## Descripción
La empresa TextilSur S.L. realiza las siguientes operaciones durante el mes de marzo:

1. Compra mercaderías al proveedor Hilaturas del Norte por 5.000 EUR + IVA 21%. Pago a 30 días.
2. Vende productos al cliente Modas López por 8.000 EUR + IVA 21%. Cobro a 60 días.
3. Devuelve mercaderías defectuosas al proveedor por valor de 500 EUR + IVA 21%.
4. El cliente Modas López paga la factura mediante transferencia bancaria.
5. Se paga al proveedor Hilaturas del Norte la factura pendiente.

Registrar todos los asientos contables correspondientes.

---

# Ejercicio: Ciclo contable de nóminas

**Tipo:** guided

## Descripción
La empresa ServiPlus S.L. debe contabilizar las nóminas del mes de enero con los siguientes datos:

Trabajador A:
- Sueldo bruto: 2.000 EUR
- Seguridad Social trabajador: 127 EUR
- Retención IRPF: 300 EUR
- Seguridad Social empresa: 600 EUR

Trabajador B:
- Sueldo bruto: 1.500 EUR
- Seguridad Social trabajador: 95 EUR
- Retención IRPF: 180 EUR
- Seguridad Social empresa: 450 EUR

Registrar:
1. El devengo de las nóminas
2. El pago de los salarios netos por banco
3. La liquidación a la Seguridad Social
4. El ingreso de las retenciones de IRPF
`;
}

function parseExercisesMD(md: string): Array<{ title: string; description: string; exerciseType: string }> {
  const exercises: Array<{ title: string; description: string; exerciseType: string }> = [];
  const blocks = md.split(/\n\s*---\s*\n/).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const titleMatch = block.match(/^#\s+Ejercicio:\s*(.+)$/m);
    const typeMatch = block.match(/\*\*Tipo:\*\*\s*(practice|guided)/i);
    const descMatch = block.match(/##\s+Descripci[oó]n\s*\n([\s\S]*?)$/i);

    if (titleMatch) {
      exercises.push({
        title: titleMatch[1].trim(),
        exerciseType: typeMatch ? typeMatch[1].trim().toLowerCase() : "practice",
        description: descMatch ? descMatch[1].trim() : "",
      });
    }
  }
  return exercises;
}

export default function ExercisesPage() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importCourseId, setImportCourseId] = useState("");
  const [viewSubmissionsId, setViewSubmissionsId] = useState<string | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<SubmissionWithStudent | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [gradeText, setGradeText] = useState("");
  const [form, setForm] = useState({ title: "", description: "", exerciseType: "practice" as string, courseId: "" });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: exercises, isLoading } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });

  const { data: submissions } = useQuery<SubmissionWithStudent[]>({
    queryKey: [`/api/submissions/exercise/${viewSubmissionsId}`],
    enabled: !!viewSubmissionsId,
  });

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

  const importMutation = useMutation({
    mutationFn: async (parsed: Array<{ title: string; description: string; exerciseType: string }>) => {
      for (const ex of parsed) {
        await apiRequest("POST", "/api/exercises", { ...ex, courseId: importCourseId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setImportOpen(false);
      setImportText("");
      setImportCourseId("");
      toast({ title: "Ejercicios importados correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error al importar", description: err.message, variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (subId: string) =>
      apiRequest("POST", `/api/submissions/${subId}/review`, {
        feedback: feedbackText,
        grade: gradeText || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/submissions/exercise/${viewSubmissionsId}`] });
      setReviewingSubmission(null);
      setFeedbackText("");
      setGradeText("");
      toast({ title: "Retroalimentacion enviada" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleImport = () => {
    const parsed = parseExercisesMD(importText);
    if (parsed.length === 0) {
      toast({ title: "Error", description: "No se encontraron ejercicios validos en el texto", variant: "destructive" });
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
    const content = generateExerciseTemplate();
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_ejercicios.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewParsed = importText ? parseExercisesMD(importText) : [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ejercicios</h1>
          <p className="text-muted-foreground text-sm mt-1">Biblioteca de casos practicos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} data-testid="button-import-exercises">
            <Upload className="w-4 h-4 mr-2" />
            Importar MD
          </Button>
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
                    placeholder="Registrar la compra de mercaderias..."
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
                      <SelectItem value="practice">Practica Libre</SelectItem>
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
                            {ex.exerciseType === "guided" ? "Guiado" : "Practica"}
                          </Badge>
                          {course && <Badge variant="secondary">{course.name}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setViewSubmissionsId(viewSubmissionsId === ex.id ? null : ex.id)}
                        data-testid={`button-view-submissions-${ex.id}`}
                        title="Ver entregas"
                      >
                        <Eye className="w-4 h-4 text-primary" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(ex.id)}
                        data-testid={`button-delete-exercise-${ex.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {viewSubmissionsId === ex.id && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                        <Send className="w-4 h-4" /> Entregas de alumnos
                      </h4>
                      {submissions && submissions.length > 0 ? (
                        <div className="space-y-2">
                          {submissions.map((s) => (
                            <div key={s.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2" data-testid={`submission-row-${s.id}`}>
                              <div>
                                <span className="font-medium">{s.studentName}</span>
                                <span className="text-xs text-muted-foreground ml-2">@{s.studentUsername}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={s.status === "reviewed" ? "default" : s.status === "submitted" ? "secondary" : "outline"}>
                                  {s.status === "reviewed" ? "Corregido" : s.status === "submitted" ? "Entregado" : "En curso"}
                                </Badge>
                                {s.grade && (
                                  <Badge variant="outline" className="gap-1">
                                    <Star className="w-3 h-3" /> {s.grade}
                                  </Badge>
                                )}
                                {s.status === "submitted" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setReviewingSubmission(s);
                                      setFeedbackText("");
                                      setGradeText("");
                                    }}
                                    data-testid={`button-review-${s.id}`}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                    Corregir
                                  </Button>
                                )}
                                {s.status === "reviewed" && s.feedback && (
                                  <span className="text-xs text-muted-foreground max-w-[200px] truncate" title={s.feedback}>
                                    {s.feedback}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Ningun alumno ha entregado este ejercicio</p>
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
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No hay ejercicios creados</p>
            <p className="text-xs text-muted-foreground mt-1">Crea tu primer ejercicio o importa desde un archivo MD</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Ejercicios desde Markdown</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate} data-testid="button-download-exercise-template">
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
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-upload-exercise-file">
                <FileText className="w-4 h-4 mr-1.5" />
                Subir archivo .md
              </Button>
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
              <Label>Contenido Markdown</Label>
              <Textarea
                data-testid="textarea-import-exercises"
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={`# Ejercicio: Título del ejercicio\n\n**Tipo:** practice\n\n## Descripción\nDescripción con las operaciones a contabilizar:\n1. Primera operación...\n2. Segunda operación...\n\n---\n\n# Ejercicio: Otro ejercicio\n...`}
                className="font-mono text-xs"
                rows={12}
              />
            </div>

            {previewParsed.length > 0 && (
              <div className="space-y-2">
                <Label>Vista previa ({previewParsed.length} ejercicio{previewParsed.length !== 1 ? "s" : ""} detectado{previewParsed.length !== 1 ? "s" : ""})</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {previewParsed.map((ex, i) => (
                    <div key={i} className="bg-muted/50 rounded-md px-3 py-2 text-sm" data-testid={`preview-exercise-${i}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{ex.title}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {ex.exerciseType === "guided" ? "Guiado" : "Practica"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ex.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              data-testid="button-confirm-import-exercises"
              className="w-full"
              onClick={handleImport}
              disabled={previewParsed.length === 0 || !importCourseId || importMutation.isPending}
            >
              {importMutation.isPending ? "Importando..." : `Importar ${previewParsed.length} ejercicio${previewParsed.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewingSubmission} onOpenChange={(open) => !open && setReviewingSubmission(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corregir ejercicio - {reviewingSubmission?.studentName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Nota (opcional, 0-10)</Label>
              <Input
                data-testid="input-review-grade"
                type="number"
                min="0"
                max="10"
                step="0.25"
                value={gradeText}
                onChange={e => setGradeText(e.target.value)}
                placeholder="Ej: 7.50"
              />
            </div>
            <div className="space-y-2">
              <Label>Retroalimentacion</Label>
              <Textarea
                data-testid="input-review-feedback"
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Escribe aqui tu retroalimentacion para el alumno..."
                rows={5}
              />
            </div>
            <Button
              data-testid="button-send-review"
              className="w-full"
              onClick={() => reviewingSubmission && reviewMutation.mutate(reviewingSubmission.id)}
              disabled={!feedbackText || reviewMutation.isPending}
            >
              {reviewMutation.isPending ? "Enviando..." : "Enviar retroalimentacion"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
