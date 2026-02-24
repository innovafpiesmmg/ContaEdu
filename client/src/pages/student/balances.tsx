import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
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
  const { data: balance, isLoading } = useQuery<TrialBalance>({ queryKey: ["/api/trial-balance"] });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Balance de Comprobación</h1>
        <p className="text-muted-foreground text-sm mt-1">Sumas y saldos de todas las cuentas</p>
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
