import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { useExercise } from "@/lib/exercise-context";
import { useLocation } from "wouter";
import type { Exercise } from "@shared/schema";
import { motion } from "framer-motion";

interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  debitSum: number;
  creditSum: number;
  debitBalance: number;
  creditBalance: number;
}

interface TrialBalance {
  rows: TrialBalanceRow[];
  totals: {
    debitSum: number;
    creditSum: number;
    debitBalance: number;
    creditBalance: number;
  };
}

export default function BalancesPage() {
  const { currentExerciseId } = useExercise();
  const [, setLocation] = useLocation();

  const { data: balance, isLoading } = useQuery<TrialBalance>({
    queryKey: ["/api/trial-balance", { exerciseId: currentExerciseId }],
    queryFn: async () => {
      const res = await fetch(`/api/trial-balance?exerciseId=${currentExerciseId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Error al cargar balance");
      return res.json();
    },
    enabled: !!currentExerciseId,
  });
  const { data: exercises } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const currentExercise = exercises?.find(e => e.id === currentExerciseId);

  if (!currentExerciseId) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-lg font-medium mb-1">Selecciona un ejercicio</p>
            <p className="text-muted-foreground text-sm mb-4">
              Debes seleccionar un ejercicio para ver el Balance de Comprobación
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
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Balance de Comprobación</h1>
        <div className="flex items-center gap-2 mt-1">
          {currentExercise && (
            <Badge variant="secondary" className="text-xs">{currentExercise.title}</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground"
            onClick={() => setLocation("/exercises")}
          >
            Cambiar ejercicio
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : balance && balance.rows.length > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Cuenta</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead colSpan={2} className="text-center border-l">Sumas</TableHead>
                      <TableHead colSpan={2} className="text-center border-l">Saldos</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead />
                      <TableHead />
                      <TableHead className="text-right border-l text-xs">Debe</TableHead>
                      <TableHead className="text-right text-xs">Haber</TableHead>
                      <TableHead className="text-right border-l text-xs">Deudor</TableHead>
                      <TableHead className="text-right text-xs">Acreedor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balance.rows.map(row => (
                      <TableRow key={row.accountCode} data-testid={`balance-row-${row.accountCode}`}>
                        <TableCell className="font-mono text-sm">{row.accountCode}</TableCell>
                        <TableCell className="text-sm">{row.accountName}</TableCell>
                        <TableCell className="text-right font-mono text-sm border-l">
                          {row.debitSum.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.creditSum.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm border-l">
                          {row.debitBalance > 0 ? row.debitBalance.toFixed(2) : ""}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {row.creditBalance > 0 ? row.creditBalance.toFixed(2) : ""}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2} className="text-sm">TOTALES</TableCell>
                      <TableCell className="text-right font-mono text-sm border-l">
                        {balance.totals.debitSum.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {balance.totals.creditSum.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm border-l">
                        {balance.totals.debitBalance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {balance.totals.creditBalance.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No hay datos para el balance</p>
            <p className="text-xs text-muted-foreground mt-1">Registra asientos en el Libro Diario para ver el balance</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
