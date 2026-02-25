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
import { Plus, ClipboardList, Trash2, BookOpen, PenLine, Upload, Download, FileText, CheckCircle, FileUp, Link2, Paperclip, X, File, Search, FolderOpen, GraduationCap, FileSpreadsheet } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Exercise, Course, ExerciseDocument, ExerciseCollection } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

function generateExerciseTemplate(): string {
  return `# Ejercicio: Operaciones básicas de compraventa

**Tipo:** practice

## Descripción
Contabiliza las siguientes operaciones de la empresa "TextilSur S.L.":

1. Compra mercaderías por 3.000 EUR + IVA 21%. Pago a crédito.
2. Un cliente entrega anticipo de 500 EUR (IVA incluido) por transferencia.
3. Venta por 2.000 EUR + IVA 21%, aplicando el anticipo anterior.

## Solución

### Asiento 1: Compra de mercaderías
| Cuenta | Debe | Haber |
|--------|------|-------|
| 600 Compras de mercaderías | 3.000,00 | |
| 472 H.P. IVA soportado | 630,00 | |
| 400 Proveedores | | 3.630,00 |

### Asiento 2: Cobro del anticipo
| Cuenta | Debe | Haber |
|--------|------|-------|
| 572 Bancos | 500,00 | |
| 438 Anticipos de clientes | | 413,22 |
| 477 H.P. IVA repercutido | | 86,78 |

### Asiento 3: Factura de venta con anticipo
| Cuenta | Debe | Haber |
|--------|------|-------|
| 430 Clientes | 1.920,00 | |
| 438 Anticipos de clientes | 413,22 | |
| 700 Ventas de mercaderías | | 2.000,00 |
| 477 H.P. IVA repercutido | | 333,22 |
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
  enunciado?: string;
  lines: SolutionLine[];
  points?: number;
}

function generateSolutionTemplate(): string {
  return `## Asiento 1: Compra de mercaderías
Fecha: 2024-01-15
**Puntos:** 3

La empresa ALFA, S.L. compra mercaderías a un proveedor por importe de 5.000€ + IVA 21%. El pago queda pendiente a 30 días.

| Cuenta | Debe | Haber |
|--------|------|-------|
| 600 Compras de mercaderías | 5.000,00 | |
| 472 H.P. IVA soportado | 1.050,00 | |
| 400 Proveedores | | 6.050,00 |

## Asiento 2: Venta de productos
Fecha: 2024-01-20
**Puntos:** 3

Vendemos mercaderías a un cliente por 8.000€ + IVA 21%. El cobro queda pendiente.

| Cuenta | Debe | Haber |
|--------|------|-------|
| 430 Clientes | 9.680,00 | |
| 700 Ventas de mercaderías | | 8.000,00 |
| 477 H.P. IVA repercutido | | 1.680,00 |

## Asiento 3: Cobro del cliente
Fecha: 2024-02-15
**Puntos:** 4

El cliente paga la totalidad de la deuda mediante transferencia bancaria.

| Cuenta | Debe | Haber |
|--------|------|-------|
| 572 Bancos | 9.680,00 | |
| 430 Clientes | | 9.680,00 |
`;
}

function extractEnunciado(block: string): string | undefined {
  const blockLines = block.split("\n");
  const enunciadoLines: string[] = [];
  let pastMeta = false;
  for (const line of blockLines) {
    if (/^#{2,3}\s+Asiento\s+\d+/i.test(line)) continue;
    if (/^Fecha:\s*/i.test(line)) continue;
    if (/^\*\*Puntos:\*\*/i.test(line)) continue;
    if (/^\|/.test(line)) break;
    if (line.trim() === "" && !pastMeta) continue;
    pastMeta = true;
    if (line.trim() === "" && enunciadoLines.length > 0) break;
    enunciadoLines.push(line.trim());
  }
  const text = enunciadoLines.join("\n").trim();
  return text || undefined;
}

function parseSolutionMD(md: string): SolutionEntry[] {
  const entries: SolutionEntry[] = [];
  const cleaned = md.replace(/^\uFEFF/, "");
  const blocks = cleaned.split(/(?=##\s+Asiento\s+\d+)/i).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const headerMatch = block.match(/^##\s+Asiento\s+(\d+)\s*[:\-]?\s*(.*)$/im);
    if (!headerMatch) continue;

    const entryNumber = parseInt(headerMatch[1]);
    const description = headerMatch[2].trim();
    const dateMatch = block.match(/Fecha:\s*(\S+)/i);
    const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString().split("T")[0];
    const pointsMatch = block.match(/\*\*Puntos:\*\*\s*([\d.,]+)/i);
    const points = pointsMatch ? parseFloat(pointsMatch[1].replace(",", ".")) : undefined;

    const enunciado = extractEnunciado(block);

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
      entries.push({ entryNumber, date, description, lines, ...(points !== undefined ? { points } : {}), ...(enunciado ? { enunciado } : {}) });
    }
  }

  return entries;
}

function parseSolutionFromBlock(solutionBlock: string): SolutionEntry[] {
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

    const enunciado = extractEnunciado(block);

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
      entries.push({ entryNumber, date, description, lines, ...(points !== undefined ? { points } : {}), ...(enunciado ? { enunciado } : {}) });
    }
  }

  return entries;
}

function extractDescriptionEnunciados(description: string): Record<number, string> {
  const enunciados: Record<number, string> = {};
  const lines = description.split("\n");
  let currentNum: number | null = null;
  let currentText: string[] = [];

  for (const line of lines) {
    const itemMatch = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (itemMatch) {
      if (currentNum !== null && currentText.length > 0) {
        enunciados[currentNum] = currentText.join("\n").trim();
      }
      currentNum = parseInt(itemMatch[1]);
      let text = itemMatch[2].trim();
      text = text.replace(/^\*\*[^*]+:\*\*\s*/, "");
      currentText = [text];
    } else if (currentNum !== null && line.trim()) {
      currentText.push(line.trim());
    } else if (currentNum !== null && !line.trim() && currentText.length > 0) {
      enunciados[currentNum] = currentText.join("\n").trim();
      currentNum = null;
      currentText = [];
    }
  }
  if (currentNum !== null && currentText.length > 0) {
    enunciados[currentNum] = currentText.join("\n").trim();
  }
  return enunciados;
}

function parseExercisesMD(md: string): Array<{ title: string; description: string; exerciseType: string; recommendedLevel?: string; solution?: SolutionEntry[] }> {
  const exercises: Array<{ title: string; description: string; exerciseType: string; recommendedLevel?: string; solution?: SolutionEntry[] }> = [];
  const cleaned = md.replace(/^\uFEFF/, "");
  const blocks = cleaned.split(/(?=^\s*#\s+Ejercicio(?:\s+\d+)?:\s*)/m).map(b => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const titleMatch = block.match(/^\s*#\s+Ejercicio(?:\s+\d+)?:\s*(.+)$/m);
    const typeMatch = block.match(/\*\*Tipo:\*\*\s*(practice|guided)/i);
    const levelMatch = block.match(/\*\*Nivel:\*\*\s*(cfgm|cfgs)/i);

    const solutionSplit = block.split(/^\s*##\s+Soluci[oó]n\s*$/im);
    const mainBlock = solutionSplit[0];
    const solutionBlock = solutionSplit.length > 1 ? solutionSplit[1] : null;

    const descMatch = mainBlock.match(/##\s+Descripci[oó]n\s*\n([\s\S]*?)$/i);

    if (titleMatch) {
      const entry: { title: string; description: string; exerciseType: string; recommendedLevel?: string; solution?: SolutionEntry[] } = {
        title: titleMatch[1].trim(),
        exerciseType: typeMatch ? typeMatch[1].trim().toLowerCase() : "practice",
        description: descMatch ? descMatch[1].trim() : "",
        recommendedLevel: levelMatch ? levelMatch[1].trim().toLowerCase() : undefined,
      };

      if (solutionBlock) {
        const parsed = parseSolutionFromBlock(solutionBlock);
        if (parsed.length > 0) {
          const descEnunciados = extractDescriptionEnunciados(entry.description);
          for (const sol of parsed) {
            if (!sol.enunciado && descEnunciados[sol.entryNumber]) {
              sol.enunciado = descEnunciados[sol.entryNumber];
            }
          }
          entry.solution = parsed;
        }
      }

      exercises.push(entry);
    }
  }
  return exercises;
}

function ExerciseCard({
  ex,
  courses,
  collections,
  onViewSolution,
  onUploadSolution,
  onDelete,
  onAssign,
  onUnassign,
  onAddToCollection,
  onRemoveFromCollection,
  onUpdateLevel,
}: {
  ex: Exercise;
  courses: Course[];
  collections: ExerciseCollection[];
  onViewSolution: () => void;
  onUploadSolution: () => void;
  onDelete: () => void;
  onAssign: (courseId: string) => void;
  onUnassign: (courseId: string) => void;
  onAddToCollection: (collectionId: string) => void;
  onRemoveFromCollection: (collectionId: string) => void;
  onUpdateLevel: (level: string) => void;
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

  const { data: exerciseCollectionIds } = useQuery<string[]>({
    queryKey: ["/api/exercises", ex.id, "collections"],
    queryFn: () => fetch(`/api/exercises/${ex.id}/collections`, { credentials: "include" }).then(r => r.json()),
  });

  const accountPlanInputRef = useRef<HTMLInputElement>(null);

  const uploadAccountPlanMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/exercises/${ex.id}/account-plan`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({ title: "Plan de cuentas subido" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteAccountPlanMutation = useMutation({
    mutationFn: () => fetch(`/api/exercises/${ex.id}/account-plan`, { method: "DELETE", credentials: "include" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({ title: "Plan de cuentas eliminado" });
    },
  });

  const assignedCourses = courses.filter(c => assignedCourseIds?.includes(c.id));
  const assignedCollections = collections.filter(c => exerciseCollectionIds?.includes(c.id));
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
                {ex.recommendedLevel && (
                  <Badge variant="outline" className="text-xs gap-1 border-blue-300 text-blue-600 dark:text-blue-400">
                    <GraduationCap className="w-3 h-3" />
                    {ex.recommendedLevel.toUpperCase()}
                  </Badge>
                )}
                {ex.customAccountPlan && (
                  <Badge variant="outline" className="text-xs gap-1 border-purple-300 text-purple-600 dark:text-purple-400">
                    <FileSpreadsheet className="w-3 h-3" />
                    PGC personalizado
                  </Badge>
                )}
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
                {assignedCollections.map(c => (
                  <Badge key={c.id} variant="outline" className="text-xs gap-1 border-amber-300 text-amber-600 dark:text-amber-400">
                    <FolderOpen className="w-3 h-3" />
                    {c.name}
                  </Badge>
                ))}
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Colecciones"
                  data-testid={`button-assign-collections-${ex.id}`}
                >
                  <FolderOpen className={`w-4 h-4 ${assignedCollections.length > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <p className="text-sm font-medium mb-2">Colecciones</p>
                {collections.length > 0 ? (
                  <div className="space-y-2">
                    {collections.map(c => {
                      const isIn = exerciseCollectionIds?.includes(c.id) || false;
                      return (
                        <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={isIn}
                            onCheckedChange={(checked) => {
                              if (checked) onAddToCollection(c.id);
                              else onRemoveFromCollection(c.id);
                            }}
                          />
                          {c.name}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No hay colecciones. Crea una desde el botón "Colecciones".</p>
                )}
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" title="Nivel y Plan de cuentas" data-testid={`button-level-plan-${ex.id}`}>
                  <GraduationCap className={`w-4 h-4 ${ex.recommendedLevel ? "text-blue-600" : "text-muted-foreground"}`} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <p className="text-sm font-medium mb-2">Nivel recomendado</p>
                <Select value={ex.recommendedLevel || "none"} onValueChange={v => onUpdateLevel(v === "none" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    <SelectItem value="cfgm">CFGM</SelectItem>
                    <SelectItem value="cfgs">CFGS</SelectItem>
                  </SelectContent>
                </Select>
                <Separator className="my-3" />
                <p className="text-sm font-medium mb-2">Plan de cuentas personalizado</p>
                <input
                  ref={accountPlanInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) uploadAccountPlanMutation.mutate(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
                {ex.customAccountPlan ? (
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-xs flex-1" asChild>
                      <a href={`/api/exercises/${ex.id}/account-plan`} target="_blank" rel="noopener noreferrer">
                        <FileSpreadsheet className="w-3 h-3 mr-1" /> Ver PGC
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={() => deleteAccountPlanMutation.mutate()}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => accountPlanInputRef.current?.click()}>
                    <Upload className="w-3 h-3 mr-1" /> Subir PGC
                  </Button>
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

      </CardContent>
    </Card>
  );
}

export default function ExercisesPage() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [form, setForm] = useState({ title: "", description: "", exerciseType: "practice" as string, recommendedLevel: "" as string });
  const [solutionExerciseId, setSolutionExerciseId] = useState<string | null>(null);
  const [solutionText, setSolutionText] = useState("");
  const [viewSolutionId, setViewSolutionId] = useState<string | null>(null);
  const [editingEnunciados, setEditingEnunciados] = useState(false);
  const [enunciadoEdits, setEnunciadoEdits] = useState<Record<number, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterCollection, setFilterCollection] = useState<string>("all");
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [editingCollection, setEditingCollection] = useState<ExerciseCollection | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const solutionFileInputRef = useRef<HTMLInputElement>(null);

  const { data: exercises, isLoading } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: collections } = useQuery<ExerciseCollection[]>({ queryKey: ["/api/collections"] });

  const { data: collectionExerciseIds } = useQuery<string[]>({
    queryKey: ["/api/collections", filterCollection, "exercises"],
    queryFn: () => fetch(`/api/collections/${filterCollection}/exercises`, { credentials: "include" }).then(r => r.json()).catch(() => []),
    enabled: filterCollection !== "all",
  });

  const filteredExercises = (exercises || []).filter(ex => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!ex.title.toLowerCase().includes(q) && !ex.description.toLowerCase().includes(q)) return false;
    }
    if (filterType !== "all" && ex.exerciseType !== filterType) return false;
    if (filterLevel !== "all") {
      if (filterLevel === "none" && ex.recommendedLevel) return false;
      else if (filterLevel !== "none" && ex.recommendedLevel !== filterLevel) return false;
    }
    if (filterCollection !== "all" && collectionExerciseIds && !collectionExerciseIds.includes(ex.id)) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/exercises", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setOpen(false);
      setForm({ title: "", description: "", exerciseType: "practice", recommendedLevel: "" });
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
    mutationFn: async (parsed: Array<{ title: string; description: string; exerciseType: string; recommendedLevel?: string; solution?: SolutionEntry[] }>) => {
      for (const ex of parsed) {
        const { solution, ...exerciseData } = ex;
        const res = await apiRequest("POST", "/api/exercises", exerciseData);
        const created = await res.json();
        if (solution && solution.length > 0 && created.id) {
          await apiRequest("POST", `/api/exercises/${created.id}/solution`, { entries: solution });
        }
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

  const saveEnunciadosMutation = useMutation({
    mutationFn: (data: { exerciseId: string; entries: SolutionEntry[] }) =>
      apiRequest("POST", `/api/exercises/${data.exerciseId}/solution`, { entries: data.entries }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      if (viewSolutionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/exercises", viewSolutionId, "solution"] });
      }
      setEditingEnunciados(false);
      setEnunciadoEdits({});
      toast({ title: "Enunciados actualizados" });
    },
    onError: (err: Error) => {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    },
  });

  const handleSaveEnunciados = () => {
    if (!viewSolutionId || !solutionData?.solution) return;
    const updatedEntries = solutionData.solution.map((entry: SolutionEntry, i: number) => ({
      ...entry,
      enunciado: enunciadoEdits[i] !== undefined ? enunciadoEdits[i] : (entry.enunciado || ""),
    }));
    saveEnunciadosMutation.mutate({ exerciseId: viewSolutionId, entries: updatedEntries });
  };

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

  const createCollectionMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/collections", { name: newCollectionName, description: newCollectionDesc || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      setNewCollectionName("");
      setNewCollectionDesc("");
      toast({ title: "Colección creada" });
    },
  });

  const updateCollectionMutation = useMutation({
    mutationFn: (col: ExerciseCollection) => apiRequest("PATCH", `/api/collections/${col.id}`, { name: col.name, description: col.description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      setEditingCollection(null);
      toast({ title: "Colección actualizada" });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/collections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collections"] });
      toast({ title: "Colección eliminada" });
    },
  });

  const addToCollectionMutation = useMutation({
    mutationFn: ({ collectionId, exerciseId }: { collectionId: string; exerciseId: string }) =>
      apiRequest("POST", `/api/collections/${collectionId}/exercises/${exerciseId}`),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", vars.exerciseId, "collections"] });
      toast({ title: "Ejercicio añadido a la colección" });
    },
  });

  const removeFromCollectionMutation = useMutation({
    mutationFn: ({ collectionId, exerciseId }: { collectionId: string; exerciseId: string }) =>
      apiRequest("DELETE", `/api/collections/${collectionId}/exercises/${exerciseId}`),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises", vars.exerciseId, "collections"] });
      toast({ title: "Ejercicio eliminado de la colección" });
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; recommendedLevel?: string }) =>
      apiRequest("PATCH", `/api/exercises/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
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
          <h1 className="text-2xl font-semibold tracking-tight">Repositorio de Ejercicios</h1>
          <p className="text-muted-foreground text-sm mt-1">Biblioteca compartida de casos prácticos — {filteredExercises.length} de {exercises?.length || 0}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCollectionsOpen(true)} data-testid="button-manage-collections">
            <FolderOpen className="w-4 h-4 mr-2" />
            Colecciones
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} data-testid="button-import-exercises">
            <Upload className="w-4 h-4 mr-2" />
            Importar MD
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-create-exercise">
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
                <div className="grid grid-cols-2 gap-3">
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
                    <Label>Nivel recomendado</Label>
                    <Select value={form.recommendedLevel || "none"} onValueChange={v => setForm({ ...form, recommendedLevel: v === "none" ? "" : v })}>
                      <SelectTrigger data-testid="select-exercise-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin especificar</SelectItem>
                        <SelectItem value="cfgm">CFGM</SelectItem>
                        <SelectItem value="cfgs">CFGS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-testid="input-search-exercises"
            className="pl-10"
            placeholder="Buscar por título o descripción..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="filter-type">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="guided">Guiado</SelectItem>
              <SelectItem value="practice">Práctica</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="filter-level">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              <SelectItem value="cfgm">CFGM</SelectItem>
              <SelectItem value="cfgs">CFGS</SelectItem>
              <SelectItem value="none">Sin nivel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCollection} onValueChange={setFilterCollection}>
            <SelectTrigger className="w-[160px] h-8 text-xs" data-testid="filter-collection">
              <SelectValue placeholder="Colección" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las colecciones</SelectItem>
              {collections?.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchQuery || filterType !== "all" || filterLevel !== "all" || filterCollection !== "all") && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => {
              setSearchQuery(""); setFilterType("all"); setFilterLevel("all"); setFilterCollection("all");
            }} data-testid="button-clear-filters">
              <X className="w-3 h-3 mr-1" /> Limpiar
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : filteredExercises.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {filteredExercises.map(ex => (
              <ExerciseCard
                key={ex.id}
                ex={ex}
                courses={courses || []}
                collections={collections || []}
                onViewSolution={() => setViewSolutionId(viewSolutionId === ex.id ? null : ex.id)}
                onUploadSolution={() => { setSolutionExerciseId(ex.id); setSolutionText(""); }}
                onDelete={() => deleteMutation.mutate(ex.id)}
                onAssign={(courseId) => assignMutation.mutate({ exerciseId: ex.id, courseId })}
                onUnassign={(courseId) => unassignMutation.mutate({ exerciseId: ex.id, courseId })}
                onAddToCollection={(collectionId) => addToCollectionMutation.mutate({ collectionId, exerciseId: ex.id })}
                onRemoveFromCollection={(collectionId) => removeFromCollectionMutation.mutate({ collectionId, exerciseId: ex.id })}
                onUpdateLevel={(level) => updateExerciseMutation.mutate({ id: ex.id, recommendedLevel: level })}
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
                placeholder={`# Ejercicio: Título del ejercicio\n\n**Tipo:** practice\n\n## Descripción\nContabiliza las siguientes operaciones:\n1. Primera operación...\n2. Segunda operación...\n\n## Solución\n\n### Asiento 1: Primera operación\n| Cuenta | Debe | Haber |\n|--------|------|-------|\n| 600 Compras | 1.000,00 | |\n| 400 Proveedores | | 1.000,00 |\n\n### Asiento 2: Segunda operación\n| Cuenta | Debe | Haber |\n|--------|------|-------|\n| 430 Clientes | 2.000,00 | |\n| 700 Ventas | | 2.000,00 |`}
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
                        {ex.solution && ex.solution.length > 0 && (
                          <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
                            Solución: {ex.solution.length} asiento{ex.solution.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
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
                <Label>Vista previa ({solutionPreview.length} asiento{solutionPreview.length !== 1 ? "s" : ""} detectado{solutionPreview.length !== 1 ? "s" : ""}{(() => { const tp = solutionPreview.reduce((s, e) => s + (e.points || 0), 0); return tp > 0 ? ` · ${tp} pts total` : ""; })()})</Label>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {solutionPreview.map((entry, i) => (
                    <div key={i} className="bg-muted/50 rounded-md px-3 py-2 text-sm" data-testid={`preview-solution-entry-${i}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Asiento {entry.entryNumber}: {entry.description}</span>
                        <span className="text-xs text-muted-foreground">{entry.date}</span>
                        {entry.points !== undefined && (
                          <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">{entry.points} pts</Badge>
                        )}
                      </div>
                      {entry.enunciado && (
                        <p className="text-xs text-muted-foreground mb-1 italic">{entry.enunciado}</p>
                      )}
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

      <Dialog open={!!viewSolutionId} onOpenChange={(open) => { if (!open) { setViewSolutionId(null); setEditingEnunciados(false); setEnunciadoEdits({}); } }}>
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
                      {entry.points !== undefined && (
                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">{entry.points} pts</Badge>
                      )}
                    </div>
                    {editingEnunciados ? (
                      <textarea
                        className="w-full text-xs border rounded-md p-2 mt-1 mb-1 min-h-[60px] resize-y bg-background"
                        placeholder="Escribe el enunciado que verá el alumno (ej: La empresa compra mercaderías por 5.000€ + IVA 21%...)"
                        value={enunciadoEdits[i] !== undefined ? enunciadoEdits[i] : (entry.enunciado || "")}
                        onChange={(e) => setEnunciadoEdits(prev => ({ ...prev, [i]: e.target.value }))}
                        data-testid={`input-enunciado-${i}`}
                      />
                    ) : entry.enunciado ? (
                      <p className="text-xs text-muted-foreground mb-1 italic">{entry.enunciado}</p>
                    ) : (
                      <p className="text-xs text-amber-500 mb-1 italic">Sin enunciado (el alumno no verá detalles de esta operación)</p>
                    )}
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
            <div className="flex items-center gap-2 flex-wrap">
              {editingEnunciados ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSaveEnunciados}
                    disabled={saveEnunciadosMutation.isPending}
                    data-testid="button-save-enunciados"
                  >
                    {saveEnunciadosMutation.isPending ? "Guardando..." : "Guardar enunciados"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setEditingEnunciados(false); setEnunciadoEdits({}); }}
                    data-testid="button-cancel-enunciados"
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  {solutionData?.solution && solutionData.solution.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingEnunciados(true)}
                      data-testid="button-edit-enunciados"
                    >
                      <FileText className="w-4 h-4 mr-1.5" />
                      Editar enunciados
                    </Button>
                  )}
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
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={collectionsOpen} onOpenChange={setCollectionsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gestionar colecciones</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <Input
                data-testid="input-new-collection-name"
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                placeholder="Nombre de la colección"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => createCollectionMutation.mutate()}
                disabled={!newCollectionName.trim() || createCollectionMutation.isPending}
                data-testid="button-create-collection"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {collections && collections.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {collections.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2" data-testid={`collection-row-${c.id}`}>
                    {editingCollection?.id === c.id ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={editingCollection.name}
                          onChange={e => setEditingCollection({ ...editingCollection, name: e.target.value })}
                          className="h-7 text-sm"
                        />
                        <Button size="sm" variant="outline" className="h-7" onClick={() => updateCollectionMutation.mutate(editingCollection)}>
                          <CheckCircle className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingCollection(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-sm font-medium">{c.name}</span>
                          {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingCollection(c)}>
                            <PenLine className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => deleteCollectionMutation.mutate(c.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No hay colecciones. Crea una para organizar tus ejercicios.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
