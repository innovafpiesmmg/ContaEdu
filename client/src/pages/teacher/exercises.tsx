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
import { Plus, ClipboardList, Trash2, BookOpen, PenLine, Upload, Download, FileText, Send, Star, MessageSquare, Eye, CheckCircle, FileUp, Link2, Unlink2, Paperclip, X, File } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Exercise, Course, ExerciseSubmission, ExerciseDocument } from "@shared/schema";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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

function generateSolutionTemplate(): string {
  return `## Asiento 1: Compra de mercaderías
Fecha: 2024-01-15

| Cuenta | Debe | Haber |
|--------|------|-------|
| 600 Compras de mercaderías | 5.000,00 | |
| 472 H.P. IVA soportado | 1.050,00 | |
| 400 Proveedores | | 6.050,00 |

## Asiento 2: Venta de productos
Fecha: 2024-01-20

| Cuenta | Debe | Haber |
|--------|------|-------|
| 430 Clientes | 9.680,00 | |
| 700 Ventas de mercaderías | | 8.000,00 |
| 477 H.P. IVA repercutido | | 1.680,00 |

## Asiento 3: Cobro del cliente
Fecha: 2024-02-15

| Cuenta | Debe | Haber |
|--------|------|-------|
| 572 Bancos | 9.680,00 | |
| 430 Clientes | | 9.680,00 |
`;
}

function parseSolutionMD(md: string): SolutionEntry[] {
  const entries: SolutionEntry[] = [];
  const blocks = md.split(/(?=##\s+Asiento\s+\d+)/i).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const headerMatch = block.match(/^##\s+Asiento\s+(\d+)\s*[:\-]?\s*(.*)$/im);
    if (!headerMatch) continue;

    const entryNumber = parseInt(headerMatch[1]);
    const description = headerMatch[2].trim();
    const dateMatch = block.match(/Fecha:\s*(\S+)/i);
    const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split("T")[0];

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
        const debit = parseFloat(rawDebit) || 0;
        const credit = parseFloat(rawCredit) || 0;

        lines.push({
          accountCode: codeMatch[1],
          accountName: codeMatch[2].trim(),
          debit: debit.toFixed(2),
          credit: credit.toFixed(2),
        });
      }
    }

    if (lines.length >= 2) {
      entries.push({ entryNumber, date, description, lines });
    }
  }

  return entries;
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

function ExerciseCard({
  ex,
  courses,
  onViewSolution,
  onUploadSolution,
  onViewSubmissions,
  onDelete,
  onAssign,
  onUnassign,
  showSubmissions,
  submissions,
  onReview,
}: {
  ex: Exercise;
  courses: Course[];
  onViewSolution: () => void;
  onUploadSolution: () => void;
  onViewSubmissions: () => void;
  onDelete: () => void;
  onAssign: (courseId: string) => void;
  onUnassign: (courseId: string) => void;
  showSubmissions: boolean;
  submissions?: SubmissionWithStudent[];
  onReview: (s: SubmissionWithStudent) => void;
}) {
  const { toast } = useToast();
  const docInputRef = useRef<HTMLInputElement>(null);
  const [showDocs, setShowDocs] = useState(false);

  const { data: assignedCourseIds } = useQuery<string[]>({
    queryKey: ["/api/exercises", ex.id, "courses"],
    queryFn: () => fetch(`/api/exercises/${ex.id}/courses`, { credentials: "include" }).then(r => r.json()),
  });

  const { data: documents } = useQuery<ExerciseDocument[]>({
    queryKey: ["/api/exercises", ex.id, "documents"],
    queryFn: () => fetch(`/api/exercises/${ex.id}/documents`, { credentials: "include" }).then(r => r.json()),
  });

  const uploadDocsMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append("files", f));
      const res = await fetch(`/api/exercises/${ex.id}/documents`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", ex.id, "documents"] });
      toast({ title: "Documentos subidos correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) =>
      fetch(`/api/exercises/${ex.id}/documents/${docId}`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", ex.id, "documents"] });
      toast({ title: "Documento eliminado" });
    },
  });

  const assignedCourses = courses.filter(c => assignedCourseIds?.includes(c.id));
  const docCount = documents?.length || 0;

  return (
    <Card className="hover-elevate" data-testid={`exercise-card-${ex.id}`}>
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
                {docCount > 0 && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Paperclip className="w-3 h-3" />
                    {docCount} doc{docCount !== 1 ? "s" : ""}
                  </Badge>
                )}
                {assignedCourses.length > 0 ? (
                  assignedCourses.map(c => (
                    <Badge key={c.id} variant="outline" className="text-xs">{c.name}</Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">Sin asignar</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Asignar a cursos"
                  data-testid={`button-assign-courses-${ex.id}`}
                >
                  <Link2 className="w-4 h-4 text-primary" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <p className="text-sm font-medium mb-2">Asignar a cursos</p>
                {courses.length > 0 ? (
                  <div className="space-y-2">
                    {courses.map(c => {
                      const isAssigned = assignedCourseIds?.includes(c.id) || false;
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer" data-testid={`checkbox-course-${c.id}-${ex.id}`}>
                          <Checkbox
                            checked={isAssigned}
                            onCheckedChange={(checked) => {
                              if (checked) onAssign(c.id);
                              else onUnassign(c.id);
                            }}
                          />
                          {c.name}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No hay cursos disponibles</p>
                )}
              </PopoverContent>
            </Popover>
            <Button
              size="icon"
              variant="ghost"
              title="Documentos adjuntos"
              onClick={() => setShowDocs(!showDocs)}
              data-testid={`button-toggle-docs-${ex.id}`}
            >
              <Paperclip className={`w-4 h-4 ${docCount > 0 ? "text-blue-600" : "text-muted-foreground"}`} />
            </Button>
            {ex.solution ? (
              <Button size="icon" variant="ghost" onClick={onViewSolution} data-testid={`button-view-solution-${ex.id}`} title="Ver solución">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </Button>
            ) : (
              <Button size="icon" variant="ghost" onClick={onUploadSolution} data-testid={`button-upload-solution-${ex.id}`} title="Subir solución">
                <FileUp className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={onViewSubmissions} data-testid={`button-view-submissions-${ex.id}`} title="Ver entregas">
              <Eye className="w-4 h-4 text-primary" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete} data-testid={`button-delete-exercise-${ex.id}`}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>

        {showDocs && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <Paperclip className="w-4 h-4" /> Documentos adjuntos
              </h4>
              <div>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      uploadDocsMutation.mutate(e.target.files);
                    }
                    e.target.value = "";
                  }}
                  data-testid={`input-upload-docs-${ex.id}`}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => docInputRef.current?.click()}
                  disabled={uploadDocsMutation.isPending}
                  data-testid={`button-upload-docs-${ex.id}`}
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {uploadDocsMutation.isPending ? "Subiendo..." : "Subir PDF / Imagen"}
                </Button>
              </div>
            </div>
            {documents && documents.length > 0 ? (
              <div className="space-y-1.5">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2" data-testid={`doc-row-${doc.id}`}>
                    <a
                      href={`/uploads/documents/${doc.fileName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline truncate"
                      data-testid={`link-doc-${doc.id}`}
                    >
                      {doc.mimeType === "application/pdf" ? (
                        <FileText className="w-4 h-4 shrink-0" />
                      ) : (
                        <File className="w-4 h-4 shrink-0" />
                      )}
                      <span className="truncate">{doc.originalName}</span>
                    </a>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{(doc.fileSize / 1024).toFixed(0)} KB</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => deleteDocMutation.mutate(doc.id)}
                        data-testid={`button-delete-doc-${doc.id}`}
                      >
                        <X className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No hay documentos adjuntos. Sube PDFs o imágenes de documentos contables.</p>
            )}
          </div>
        )}

        {showSubmissions && (
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
                        <Badge variant="outline" className="gap-1"><Star className="w-3 h-3" /> {s.grade}</Badge>
                      )}
                      {s.status === "submitted" && (
                        <Button size="sm" variant="outline" onClick={() => onReview(s)} data-testid={`button-review-${s.id}`}>
                          <MessageSquare className="w-3.5 h-3.5 mr-1" /> Corregir
                        </Button>
                      )}
                      {s.status === "reviewed" && s.feedback && (
                        <span className="text-xs text-muted-foreground max-w-[200px] truncate" title={s.feedback}>{s.feedback}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Ningún alumno ha entregado este ejercicio</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ExercisesPage() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [viewSubmissionsId, setViewSubmissionsId] = useState<string | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<SubmissionWithStudent | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [gradeText, setGradeText] = useState("");
  const [form, setForm] = useState({ title: "", description: "", exerciseType: "practice" as string });
  const [solutionExerciseId, setSolutionExerciseId] = useState<string | null>(null);
  const [solutionText, setSolutionText] = useState("");
  const [viewSolutionId, setViewSolutionId] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const solutionFileInputRef = useRef<HTMLInputElement>(null);

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
      setForm({ title: "", description: "", exerciseType: "practice" });
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
        await apiRequest("POST", "/api/exercises", ex);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setImportOpen(false);
      setImportText("");
      toast({ title: "Ejercicios importados correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error al importar", description: err.message, variant: "destructive" });
    },
  });

  const { data: solutionData } = useQuery<{ solution: SolutionEntry[] | null }>({
    queryKey: ["/api/exercises", viewSolutionId, "solution"],
    queryFn: () => fetch(`/api/exercises/${viewSolutionId}/solution`, { credentials: "include" }).then(r => r.json()),
    enabled: !!viewSolutionId,
  });

  const saveSolutionMutation = useMutation({
    mutationFn: (data: { exerciseId: string; entries: SolutionEntry[] }) =>
      apiRequest("POST", `/api/exercises/${data.exerciseId}/solution`, { entries: data.entries }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      if (solutionExerciseId) {
        queryClient.invalidateQueries({ queryKey: ["/api/exercises", solutionExerciseId, "solution"] });
      }
      setSolutionExerciseId(null);
      setSolutionText("");
      toast({ title: "Solución guardada correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteSolutionMutation = useMutation({
    mutationFn: (exerciseId: string) => apiRequest("DELETE", `/api/exercises/${exerciseId}/solution`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      if (viewSolutionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/exercises", viewSolutionId, "solution"] });
      }
      setViewSolutionId(null);
      toast({ title: "Solución eliminada" });
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

  const assignMutation = useMutation({
    mutationFn: ({ exerciseId, courseId }: { exerciseId: string; courseId: string }) =>
      apiRequest("POST", `/api/exercises/${exerciseId}/assign`, { courseId }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", vars.exerciseId, "courses"] });
      toast({ title: "Ejercicio asignado al curso" });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: ({ exerciseId, courseId }: { exerciseId: string; courseId: string }) =>
      apiRequest("POST", `/api/exercises/${exerciseId}/unassign`, { courseId }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", vars.exerciseId, "courses"] });
      toast({ title: "Ejercicio desvinculado del curso" });
    },
  });

  const handleImport = () => {
    const parsed = parseExercisesMD(importText);
    if (parsed.length === 0) {
      toast({ title: "Error", description: "No se encontraron ejercicios válidos en el texto", variant: "destructive" });
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

  const handleSolutionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSolutionText(ev.target?.result as string);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadSolutionTemplate = () => {
    const content = generateSolutionTemplate();
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_solución.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSolution = () => {
    const parsed = parseSolutionMD(solutionText);
    if (parsed.length === 0) {
      toast({ title: "Error", description: "No se encontraron asientos válidos. Revisa el formato de la plantilla.", variant: "destructive" });
      return;
    }
    if (!solutionExerciseId) return;
    saveSolutionMutation.mutate({ exerciseId: solutionExerciseId, entries: parsed });
  };

  const solutionPreview = solutionText ? parseSolutionMD(solutionText) : [];
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
                <Button
                  data-testid="button-save-exercise"
                  className="w-full"
                  onClick={() => createMutation.mutate()}
                  disabled={!form.title || !form.description || createMutation.isPending}
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
          {exercises.map(ex => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                courses={courses || []}
                onViewSolution={() => setViewSolutionId(viewSolutionId === ex.id ? null : ex.id)}
                onUploadSolution={() => { setSolutionExerciseId(ex.id); setSolutionText(""); }}
                onViewSubmissions={() => setViewSubmissionsId(viewSubmissionsId === ex.id ? null : ex.id)}
                onDelete={() => deleteMutation.mutate(ex.id)}
                onAssign={(courseId) => assignMutation.mutate({ exerciseId: ex.id, courseId })}
                onUnassign={(courseId) => unassignMutation.mutate({ exerciseId: ex.id, courseId })}
                showSubmissions={viewSubmissionsId === ex.id}
                submissions={viewSubmissionsId === ex.id ? submissions : undefined}
                onReview={(s) => { setReviewingSubmission(s); setFeedbackText(""); setGradeText(""); }}
              />
          ))}
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
              disabled={previewParsed.length === 0 || importMutation.isPending}
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
      <Dialog open={!!solutionExerciseId} onOpenChange={(open) => { if (!open) { setSolutionExerciseId(null); setSolutionText(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subir solución del ejercicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Define los asientos correctos de este ejercicio usando el formato Markdown. Los alumnos verán esta solución cuando reciban tu retroalimentación.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadSolutionTemplate} data-testid="button-download-solution-template">
                <Download className="w-4 h-4 mr-1.5" />
                Descargar plantilla
              </Button>
              <input
                ref={solutionFileInputRef}
                type="file"
                accept=".md,.txt,.markdown"
                className="hidden"
                onChange={handleSolutionFileUpload}
              />
              <Button variant="outline" size="sm" onClick={() => solutionFileInputRef.current?.click()} data-testid="button-upload-solution-file">
                <FileText className="w-4 h-4 mr-1.5" />
                Subir archivo .md
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Contenido Markdown</Label>
              <Textarea
                data-testid="textarea-solution-content"
                value={solutionText}
                onChange={e => setSolutionText(e.target.value)}
                placeholder={`## Asiento 1: Descripción\nFecha: 2024-01-15\n\n| Cuenta | Debe | Haber |\n|--------|------|-------|\n| 600 Compras de mercaderías | 5.000,00 | |\n| 472 H.P. IVA soportado | 1.050,00 | |\n| 400 Proveedores | | 6.050,00 |`}
                className="font-mono text-xs"
                rows={12}
              />
            </div>

            {solutionPreview.length > 0 && (
              <div className="space-y-2">
                <Label>Vista previa ({solutionPreview.length} asiento{solutionPreview.length !== 1 ? "s" : ""} detectado{solutionPreview.length !== 1 ? "s" : ""})</Label>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {solutionPreview.map((entry, i) => (
                    <div key={i} className="bg-muted/50 rounded-md px-3 py-2 text-sm" data-testid={`preview-solution-entry-${i}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Asiento {entry.entryNumber}: {entry.description}</span>
                        <span className="text-xs text-muted-foreground">{entry.date}</span>
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
                          {entry.lines.map((line, j) => (
                            <tr key={j} className="border-t border-muted">
                              <td className="py-0.5">{line.accountCode} {line.accountName}</td>
                              <td className="text-right py-0.5">{parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString("es-ES", { minimumFractionDigits: 2 }) : ""}</td>
                              <td className="text-right py-0.5">{parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString("es-ES", { minimumFractionDigits: 2 }) : ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              data-testid="button-save-solution"
              className="w-full"
              onClick={handleSaveSolution}
              disabled={solutionPreview.length === 0 || saveSolutionMutation.isPending}
            >
              {saveSolutionMutation.isPending ? "Guardando..." : `Guardar solución (${solutionPreview.length} asiento${solutionPreview.length !== 1 ? "s" : ""})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewSolutionId} onOpenChange={(open) => { if (!open) setViewSolutionId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solución del ejercicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {solutionData?.solution && solutionData.solution.length > 0 ? (
              <div className="space-y-3">
                {solutionData.solution.map((entry: SolutionEntry, i: number) => (
                  <div key={i} className="bg-muted/50 rounded-md px-3 py-2 text-sm" data-testid={`view-solution-entry-${i}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Asiento {entry.entryNumber}: {entry.description}</span>
                      <span className="text-xs text-muted-foreground">{entry.date}</span>
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
                          <tr key={j} className="border-t border-muted">
                            <td className="py-0.5">{line.accountCode} {line.accountName}</td>
                            <td className="text-right py-0.5">{parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString("es-ES", { minimumFractionDigits: 2 }) : ""}</td>
                            <td className="text-right py-0.5">{parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString("es-ES", { minimumFractionDigits: 2 }) : ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No hay solución cargada para este ejercicio.</p>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSolutionExerciseId(viewSolutionId); setSolutionText(""); setViewSolutionId(null); }}
                data-testid="button-replace-solution"
              >
                <FileUp className="w-4 h-4 mr-1.5" />
                Reemplazar solución
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => viewSolutionId && deleteSolutionMutation.mutate(viewSolutionId)}
                disabled={deleteSolutionMutation.isPending}
                data-testid="button-delete-solution"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Eliminar solución
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
