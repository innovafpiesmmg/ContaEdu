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

**Duración:** 60

## Descripción
Examen práctico sobre los asientos de compras y ventas con IVA.
Contabiliza las siguientes operaciones:

1. Compra mercaderías por 3.000 EUR + IVA 21%. Pago a crédito.
2. Venta por 2.000 EUR + IVA 21%. Cobro a 60 días.

## Instrucciones
- Tipo de IVA aplicable: 21%
- Utilizar las cuentas del PGC

## Solución

### Asiento 1: Compra de mercaderías
**Puntos:** 2,5

| Cuenta | Debe | Haber |
|--------|------|-------|
| 600 Compras de mercaderías | 3.000,00 | |
| 472 H.P. IVA soportado | 630,00 | |
| 400 Proveedores | | 3.630,00 |

### Asiento 2: Venta de productos
**Puntos:** 2,5

| Cuenta | Debe | Haber |
|--------|------|-------|
| 430 Clientes | 2.420,00 | |
| 700 Ventas de mercaderías | | 2.000,00 |
| 477 H.P. IVA repercutido | | 420,00 |
`;
}

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
  points?: number;
}

interface ParsedExam {
  title: string;
  description: string;
  instructions: string;
  durationMinutes: number;
  exerciseTitle: string;
  solution?: SolutionEntry[];
}

function parseExamSolution(solutionBlock: string): SolutionEntry[] {
  const entries: SolutionEntry[] = [];
  const asientoBlocks = solutionBlock.split(/(?=###\s+Asiento\s+\d+)/i).map(b => b.trim()).filter(Boolean);

  for (const block of asientoBlocks) {
    const headerMatch = block.match(/^###\s+Asiento\s+(\d+)\s*[:\-]?\s*(.*)$/im);
    if (!headerMatch) continue;

    const entryNumber = parseInt(headerMatch[1]);
    const description = headerMatch[2].trim();
    const dateMatch = block.match(/Fecha:\s*(\S+)/i);
    const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split("T")[0];
    const pointsMatch = block.match(/\*\*Puntos:\*\*\s*([\d.,]+)/i);
    const points = pointsMatch ? parseFloat(pointsMatch[1].replace(",", ".")) : undefined;

    const lines: SolutionLine[] = [];
    const tableRows = block.match(/\|[^|\n]*\|[^|\n]*\|[^|\n]*\|/g);
    if (tableRows) {
      for (const row of tableRows) {
        if (row.includes("Cuenta") || row.includes("---")) continue;
        const cells = row.split("|").map(c => c.trim());
        const nonEmpty = cells.filter(Boolean);
        if (nonEmpty.length < 1) continue;
        const startIdx = cells[0] === "" ? 1 : 0;
        const accountFull = (cells[startIdx] || "").trim();
        const codeMatch = accountFull.match(/^(\d+)\s+(.+)$/);
        if (!codeMatch) continue;
        const rawDebit = (cells[startIdx + 1] || "").trim().replace(/\./g, "").replace(",", ".");
        const rawCredit = (cells[startIdx + 2] || "").trim().replace(/\./g, "").replace(",", ".");
        lines.push({
          accountCode: codeMatch[1],
          accountName: codeMatch[2].trim(),
          debit: (parseFloat(rawDebit) || 0).toFixed(2),
          credit: (parseFloat(rawCredit) || 0).toFixed(2),
        });
      }
    }
    if (lines.length >= 2) {
      entries.push({ entryNumber, date, description, lines, ...(points !== undefined ? { points } : {}) });
    }
  }
  return entries;
}

function parseExamsMD(md: string): ParsedExam[] {
  const exams: ParsedExam[] = [];
  const cleaned = md.replace(/^\uFEFF/, "");
  const blocks = cleaned.split(/(?=^\s*#\s+Examen(?:\s+\d+)?:\s*)/m).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const titleMatch = block.match(/^\s*#\s+Examen(?:\s+\d+)?:\s*(.+)$/m);
    const durationMatch = block.match(/\*\*Duraci[oó]n:\*\*\s*(\d+)/i);
    const exerciseMatch = block.match(/\*\*Ejercicio:\*\*\s*(.+)$/mi);

    const solutionSplit = block.split(/^\s*##\s+Soluci[oó]n\s*$/im);
    const mainBlock = solutionSplit[0];
    const solutionBlock = solutionSplit.length > 1 ? solutionSplit[1] : null;

    const instrSplit = mainBlock.split(/^\s*##\s+Instrucciones\s*$/im);
    const preInstrBlock = instrSplit[0];
    const instrBlock = instrSplit.length > 1 ? instrSplit[1] : null;

    const descMatch = preInstrBlock.match(/##\s+Descripci[oó]n\s*\n([\s\S]*?)$/i);

    if (titleMatch) {
      const entry: ParsedExam = {
        title: titleMatch[1].trim(),
        durationMinutes: durationMatch ? parseInt(durationMatch[1]) : 60,
        exerciseTitle: exerciseMatch ? exerciseMatch[1].trim() : "",
        description: descMatch ? descMatch[1].trim() : "",
        instructions: instrBlock ? instrBlock.trim() : "",
      };

      if (solutionBlock) {
        const parsed = parseExamSolution(solutionBlock);
        if (parsed.length > 0) {
          entry.solution = parsed;
        }
      }

      exams.push(entry);
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
      for (const ex of parsed) {
        let exerciseId = "";

        if (ex.exerciseTitle) {
          const allExercises = exercises || [];
          const found = allExercises.find(
            e => e.title.toLowerCase().includes(ex.exerciseTitle.toLowerCase()) ||
                 ex.exerciseTitle.toLowerCase().includes(e.title.toLowerCase())
          );
          if (found) exerciseId = found.id;
        }

        if (!exerciseId && ex.solution && ex.solution.length > 0) {
          const exRes = await apiRequest("POST", "/api/exercises", {
            title: ex.title,
            description: ex.description,
            exerciseType: "practice",
          });
          const created = await exRes.json();
          exerciseId = created.id;
          await apiRequest("POST", `/api/exercises/${exerciseId}/solution`, { entries: ex.solution });
          await apiRequest("POST", `/api/exercises/${exerciseId}/assign`, { courseId: importCourseId });
        } else if (!exerciseId) {
          throw new Error(`No se encontró ejercicio base para "${ex.title}". Incluye la solución en el MD o crea el ejercicio previamente.`);
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
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setImportOpen(false);
      setImportText("");
      setImportCourseId("");
      toast({ title: "Exámenes importados correctamente" });
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
      toast({ title: "Error", description: "No se encontraron exámenes válidos en el texto", variant: "destructive" });
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
    a.download = "plantilla_exámenes.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewParsed = importText ? parseExamsMD(importText) : [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Exámenes</h1>
          <p className="text-muted-foreground text-sm mt-1">Evaluaciones con límite de tiempo</p>
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
                  <Label>Título</Label>
                  <Input
                    data-testid="input-exam-title"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="Examen Tema 3: Compras y Ventas"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
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
                    <Label>Duración (min)</Label>
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
            <p className="text-muted-foreground">No hay exámenes creados</p>
            <p className="text-xs text-muted-foreground mt-1">Crea un examen o importa desde un archivo MD</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Exámenes desde Markdown</DialogTitle>
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
                Ejercicios disponibles:{" "}
                {exercises?.map(e => e.title).join(", ") || "Ninguno"}
              </div>
            )}

            <div className="space-y-2">
              <Label>Contenido Markdown</Label>
              <Textarea
                data-testid="textarea-import-exams"
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={`# Examen: Título del examen\n\n**Duración:** 60\n\n## Descripción\nDescripción del examen...\n\n## Instrucciones\nInstrucciones...\n\n## Solución\n\n### Asiento 1: Descripción\n**Puntos:** 2,5\n\n| Cuenta | Debe | Haber |\n|--------|------|-------|\n| 600 Compras | 1.000,00 | |\n| 400 Proveedores | | 1.000,00 |`}
                className="font-mono text-xs"
                rows={12}
              />
            </div>

            {previewParsed.length > 0 && (
              <div className="space-y-2">
                <Label>Vista previa ({previewParsed.length} examen{previewParsed.length !== 1 ? "es" : ""} detectado{previewParsed.length !== 1 ? "s" : ""})</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {previewParsed.map((ex, i) => {
                    const allExercises = exercises || [];
                    const matched = ex.exerciseTitle ? allExercises.find(
                      e => e.title.toLowerCase().includes(ex.exerciseTitle.toLowerCase()) ||
                           ex.exerciseTitle.toLowerCase().includes(e.title.toLowerCase())
                    ) : null;
                    const totalPoints = ex.solution?.reduce((sum, e) => sum + (e.points || 0), 0) || 0;
                    return (
                      <div key={i} className="bg-muted/50 rounded-md px-3 py-2 text-sm" data-testid={`preview-exam-${i}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{ex.title}</span>
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <Clock className="w-3 h-3" />
                            {ex.durationMinutes} min
                          </Badge>
                          {ex.solution && ex.solution.length > 0 && (
                            <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">
                              {ex.solution.length} asiento{ex.solution.length !== 1 ? "s" : ""}
                              {totalPoints > 0 ? ` · ${totalPoints} pts` : ""}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ex.description}</p>
                        {ex.exerciseTitle && (
                          <p className={`text-xs mt-0.5 ${matched ? "text-green-600" : "text-amber-600"}`}>
                            Ejercicio: {ex.exerciseTitle} {matched ? "(encontrado)" : "(no encontrado - se creará automáticamente)"}
                          </p>
                        )}
                        {!ex.exerciseTitle && ex.solution && ex.solution.length > 0 && (
                          <p className="text-xs mt-0.5 text-blue-600">
                            Se creará ejercicio automáticamente con solución
                          </p>
                        )}
                        {!ex.exerciseTitle && (!ex.solution || ex.solution.length === 0) && (
                          <p className="text-xs mt-0.5 text-red-500 font-medium">
                            Sin ejercicio ni solución - añade **Ejercicio:** o ## Solución
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
