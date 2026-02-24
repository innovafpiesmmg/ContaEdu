import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpenCheck, Trash2, X, AlertCircle, ChevronDown, ChevronUp, FileText, File as FileIcon, Eye, Paperclip, AlertTriangle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useExercise } from "@/lib/exercise-context";
import { useLocation } from "wouter";
import type { JournalEntry, JournalLine, Account, Exercise, Exam, ExerciseDocument } from "@shared/schema";
import { motion } from "framer-motion";

interface JournalEntryWithLines extends JournalEntry {
  lines: JournalLine[];
}

interface LineDraft {
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
}

function JournalDocumentsViewer({ exerciseId }: { exerciseId: string }) {
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
        <span className="text-sm font-medium">Documentos adjuntos</span>
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
                data-testid={`journal-doc-link-${doc.id}`}
              >
                {doc.mimeType === "application/pdf" ? (
                  <FileText className="w-4 h-4 shrink-0" />
                ) : (
                  <FileIcon className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">{doc.originalName}</span>
              </a>
              {(doc.mimeType === "application/pdf" || doc.mimeType.startsWith("image/")) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => setViewingDoc(viewingDoc === doc.id ? null : doc.id)}
                  data-testid={`journal-preview-doc-${doc.id}`}
                >
                  {viewingDoc === doc.id ? <ChevronUp className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                  {viewingDoc === doc.id ? "Ocultar" : "Vista previa"}
                </Button>
              )}
            </div>
            {viewingDoc === doc.id && doc.mimeType === "application/pdf" && (
              <div className="mt-2 border rounded-lg overflow-hidden">
                <iframe src={`/uploads/documents/${doc.fileName}`} className="w-full h-[500px]" title={doc.originalName} />
              </div>
            )}
            {viewingDoc === doc.id && doc.mimeType.startsWith("image/") && (
              <div className="mt-2 border rounded-lg overflow-hidden p-2">
                <img src={`/uploads/documents/${doc.fileName}`} alt={doc.originalName} className="max-w-full rounded" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TaskItem {
  entryNumber: number;
  description: string;
  enunciado?: string;
  points?: number;
}

function EnunciadoPanel({ exercise, exerciseId }: { exercise?: Exercise; exerciseId: string }) {
  const { data: exams } = useQuery<Exam[]>({
    queryKey: ["/api/exams"],
  });

  const { data: tasksData } = useQuery<{ tasks: TaskItem[] }>({
    queryKey: ["/api/exercises", exerciseId, "tasks"],
    queryFn: () => fetch(`/api/exercises/${exerciseId}/tasks`, { credentials: "include" }).then(r => r.json()),
    enabled: !!exerciseId,
  });

  const linkedExam = exams?.find(exam => exam.exerciseId === exerciseId && exam.isActive);
  const tasks = tasksData?.tasks || [];
  const hasEnunciados = tasks.some(t => t.enunciado);

  if (!exercise) return null;

  return (
    <div className="space-y-3" data-testid="enunciado-panel">
      {linkedExam && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            {linkedExam.title}
          </h3>
          {!hasEnunciados && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{linkedExam.description}</p>
          )}
          {linkedExam.instructions && (
            <div className={hasEnunciados ? "" : "mt-2 pt-2 border-t border-amber-200 dark:border-amber-700"}>
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">Instrucciones:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{linkedExam.instructions}</p>
            </div>
          )}
        </div>
      )}

      {!linkedExam && !hasEnunciados && (
        <div>
          <h4 className="text-sm font-semibold mb-1">{exercise.title}</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{exercise.description}</p>
        </div>
      )}

      {!linkedExam && hasEnunciados && (
        <h4 className="text-sm font-semibold">{exercise.title}</h4>
      )}

      {tasks.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Operaciones a contabilizar:</p>
          <ol className="space-y-2">
            {tasks.map((task, i) => (
              <li key={i} className="text-sm" data-testid={`task-item-${i}`}>
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="font-mono text-[10px] shrink-0 w-6 h-5 flex items-center justify-center p-0 mt-0.5">
                    {task.entryNumber}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{task.description}</span>
                      {task.points !== undefined && task.points > 0 && (
                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300 shrink-0">
                          {task.points} pts
                        </Badge>
                      )}
                    </div>
                    {task.enunciado && (
                      <p className="text-muted-foreground text-sm mt-0.5 whitespace-pre-wrap">{task.enunciado}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <JournalDocumentsViewer exerciseId={exerciseId} />
    </div>
  );
}

export default function JournalPage() {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([
    { accountCode: "", accountName: "", debit: "", credit: "" },
    { accountCode: "", accountName: "", debit: "", credit: "" },
  ]);
  const { toast } = useToast();
  const { currentExerciseId } = useExercise();
  const [, setLocation] = useLocation();

  const { data: entries, isLoading } = useQuery<JournalEntryWithLines[]>({
    queryKey: ["/api/journal-entries", { exerciseId: currentExerciseId }],
    queryFn: async () => {
      const res = await fetch(`/api/journal-entries?exerciseId=${currentExerciseId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar asientos");
      return res.json();
    },
    enabled: !!currentExerciseId,
  });
  const { data: accounts } = useQuery<Account[]>({ queryKey: ["/api/accounts"] });
  const { data: exercises } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });

  const currentExercise = exercises?.find(e => e.id === currentExerciseId);

  const createMutation = useMutation({
    mutationFn: () => {
      if (!currentExerciseId) throw new Error("Debes seleccionar un ejercicio");
      const validLines = lines.filter(l => {
        if (!l.accountCode) return false;
        const d = parseFloat(l.debit) || 0;
        const c = parseFloat(l.credit) || 0;
        return d > 0 || c > 0;
      });
      if (validLines.length < 2) {
        throw new Error("El asiento debe tener al menos 2 líneas con importes");
      }
      return apiRequest("POST", "/api/journal-entries", {
        date,
        description,
        exerciseId: currentExerciseId,
        lines: validLines.map(l => ({
          accountCode: l.accountCode,
          accountName: l.accountName || l.accountCode,
          debit: String(parseFloat(l.debit) || 0),
          credit: String(parseFloat(l.credit) || 0),
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      resetForm();
      toast({ title: "Asiento registrado" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/journal-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
      toast({ title: "Asiento eliminado" });
    },
  });

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setLines([
      { accountCode: "", accountName: "", debit: "", credit: "" },
      { accountCode: "", accountName: "", debit: "", credit: "" },
    ]);
  };

  const updateLine = (index: number, field: keyof LineDraft, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    if (field === "accountCode") {
      const acc = accounts?.find(a => a.code === value);
      if (acc) newLines[index].accountName = acc.name;
    }
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, { accountCode: "", accountName: "", debit: "", credit: "" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const totalDebit = lines.reduce((sum, l) => sum + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  if (!currentExerciseId) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-lg font-medium mb-1">Selecciona un ejercicio</p>
            <p className="text-muted-foreground text-sm mb-4">
              Debes seleccionar un ejercicio antes de registrar asientos contables
            </p>
            <Button onClick={() => setLocation("/exercises")} data-testid="button-go-exercises">
              Ir a Ejercicios
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Libro Diario</h1>
          {currentExercise && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs" data-testid="badge-current-exercise">
                {currentExercise.title}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => setLocation("/exercises")}
                data-testid="button-change-exercise"
              >
                Cambiar ejercicio
              </Button>
            </div>
          )}
        </div>
        <Button
          data-testid="button-new-entry"
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? "secondary" : "default"}
        >
          {showForm ? (
            <><ChevronUp className="w-4 h-4 mr-2" />Ocultar formulario</>
          ) : (
            <><Plus className="w-4 h-4 mr-2" />Nuevo Asiento</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,1fr)_minmax(400px,2fr)] gap-4 items-start">
        <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Enunciado</span>
              </div>
              <EnunciadoPanel exercise={currentExercise} exerciseId={currentExerciseId} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-primary/30 shadow-md" data-testid="entry-form">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3">Nuevo Asiento Contable</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Fecha</Label>
                        <Input
                          data-testid="input-entry-date"
                          type="date"
                          value={date}
                          onChange={e => setDate(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Concepto</Label>
                        <Input
                          data-testid="input-entry-description"
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          placeholder="Descripción del asiento"
                          className="h-9"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1.5">
                      <div className="grid grid-cols-[1fr_2fr_1fr_1fr_auto] gap-1.5 text-xs font-medium text-muted-foreground px-1">
                        <span>Cuenta</span>
                        <span>Nombre</span>
                        <span className="text-right">Debe</span>
                        <span className="text-right">Haber</span>
                        <span className="w-7" />
                      </div>
                      {lines.map((line, i) => (
                        <div key={i} className="grid grid-cols-[1fr_2fr_1fr_1fr_auto] gap-1.5 items-center">
                          <Input
                            data-testid={`input-line-code-${i}`}
                            value={line.accountCode}
                            onChange={e => updateLine(i, "accountCode", e.target.value)}
                            placeholder="Código"
                            className="font-mono text-sm h-8"
                            list="account-codes"
                          />
                          <Input
                            data-testid={`input-line-name-${i}`}
                            value={line.accountName}
                            onChange={e => updateLine(i, "accountName", e.target.value)}
                            placeholder="Selecciona cuenta"
                            className="text-sm h-8"
                          />
                          <Input
                            data-testid={`input-line-debit-${i}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.debit}
                            onChange={e => updateLine(i, "debit", e.target.value)}
                            placeholder="0.00"
                            className="text-right text-sm h-8"
                          />
                          <Input
                            data-testid={`input-line-credit-${i}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.credit}
                            onChange={e => updateLine(i, "credit", e.target.value)}
                            placeholder="0.00"
                            className="text-right text-sm h-8"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeLine(i)}
                            disabled={lines.length <= 2}
                            className="shrink-0 h-7 w-7"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <datalist id="account-codes">
                        {accounts?.map(a => (
                          <option key={a.id} value={a.code}>{a.name}</option>
                        ))}
                      </datalist>
                    </div>

                    <Button variant="secondary" size="sm" onClick={addLine} data-testid="button-add-line" className="h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      Añadir línea
                    </Button>

                    <Separator />

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span>Debe: <strong className="font-mono">{totalDebit.toFixed(2)}</strong></span>
                        <span>Haber: <strong className="font-mono">{totalCredit.toFixed(2)}</strong></span>
                      </div>
                      <Badge variant={isBalanced ? "default" : "destructive"}>
                        {isBalanced ? "Cuadrado" : "Descuadrado"}
                      </Badge>
                    </div>

                    <Button
                      data-testid="button-save-entry"
                      className="w-full"
                      onClick={() => createMutation.mutate()}
                      disabled={!description || !isBalanced || createMutation.isPending}
                    >
                      {createMutation.isPending ? "Registrando..." : "Registrar Asiento"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
            </div>
          ) : entries && entries.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {entries.map(entry => (
                <Card key={entry.id} className="hover-elevate" data-testid={`entry-card-${entry.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-mono">#{entry.entryNumber}</Badge>
                        <div>
                          <p className="font-medium text-sm">{entry.description}</p>
                          <p className="text-xs text-muted-foreground">{entry.date}</p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(entry.id)}
                        data-testid={`button-delete-entry-${entry.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    {entry.lines && entry.lines.length > 0 && (
                      <div className="bg-muted/30 rounded-md p-3">
                        <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-2 text-xs font-medium text-muted-foreground mb-2 px-1">
                          <span>Cuenta</span>
                          <span>Nombre</span>
                          <span className="text-right">Debe</span>
                          <span className="text-right">Haber</span>
                        </div>
                        {entry.lines.map((line: JournalLine) => (
                          <div key={line.id} className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-2 text-sm py-1 px-1">
                            <span className="font-mono text-muted-foreground">{line.accountCode}</span>
                            <span>{line.accountName}</span>
                            <span className="text-right font-mono">
                              {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toFixed(2) : ""}
                            </span>
                            <span className="text-right font-mono">
                              {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toFixed(2) : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpenCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No hay asientos registrados para este ejercicio</p>
                <p className="text-xs text-muted-foreground mt-1">Registra tu primer asiento contable</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
