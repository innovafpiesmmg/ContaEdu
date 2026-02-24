import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { ArrowLeft, BookOpenCheck, FileText, BarChart3, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { User, JournalEntry, JournalLine } from "@shared/schema";
import { motion } from "framer-motion";

interface JournalEntryWithLines extends JournalEntry {
  lines: JournalLine[];
}

interface LedgerAccount {
  accountCode: string;
  accountName: string;
  entries: { date: string; description: string; debit: string; credit: string }[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

interface TrialBalance {
  rows: { accountCode: string; accountName: string; debitSum: number; creditSum: number; debitBalance: number; creditBalance: number }[];
  totals: { debitSum: number; creditSum: number; debitBalance: number; creditBalance: number };
}

export default function StudentAuditPage() {
  const params = useParams<{ id: string }>();
  const studentId = params.id;

  const { data: students } = useQuery<User[]>({ queryKey: ["/api/users/students"] });
  const student = students?.find(s => s.id === studentId);

  const { data: journal, isLoading: loadingJournal } = useQuery<JournalEntryWithLines[]>({
    queryKey: ["/api/audit/students", studentId, "journal"],
    enabled: !!studentId,
  });

  const { data: ledger, isLoading: loadingLedger } = useQuery<LedgerAccount[]>({
    queryKey: ["/api/audit/students", studentId, "ledger"],
    enabled: !!studentId,
  });

  const { data: balance, isLoading: loadingBalance } = useQuery<TrialBalance>({
    queryKey: ["/api/audit/students", studentId, "trial-balance"],
    enabled: !!studentId,
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/students">
          <Button variant="ghost" size="icon" data-testid="button-back-students">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Auditoría: {student?.fullName || "Alumno"}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">Vista de solo lectura del trabajo del alumno</p>
        </div>
      </div>

      <Tabs defaultValue="journal">
        <TabsList>
          <TabsTrigger value="journal" data-testid="tab-audit-journal">
            <BookOpenCheck className="w-4 h-4 mr-1" /> Diario
          </TabsTrigger>
          <TabsTrigger value="ledger" data-testid="tab-audit-ledger">
            <FileText className="w-4 h-4 mr-1" /> Mayor
          </TabsTrigger>
          <TabsTrigger value="balance" data-testid="tab-audit-balance">
            <BarChart3 className="w-4 h-4 mr-1" /> Balance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="mt-4 space-y-3">
          {loadingJournal ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
            </div>
          ) : journal && journal.length > 0 ? (
            journal.map(entry => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary" className="font-mono">#{entry.entryNumber}</Badge>
                    <div>
                      <p className="font-medium text-sm">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">{entry.date}</p>
                    </div>
                  </div>
                  {entry.lines && (
                    <div className="bg-muted/30 rounded-md p-3">
                      <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-2 text-xs font-medium text-muted-foreground mb-2 px-1">
                        <span>Cuenta</span><span>Nombre</span>
                        <span className="text-right">Debe</span><span className="text-right">Haber</span>
                      </div>
                      {entry.lines.map((line: JournalLine) => (
                        <div key={line.id} className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-2 text-sm py-1 px-1">
                          <span className="font-mono text-muted-foreground">{line.accountCode}</span>
                          <span>{line.accountName}</span>
                          <span className="text-right font-mono">{parseFloat(line.debit) > 0 ? parseFloat(line.debit).toFixed(2) : ""}</span>
                          <span className="text-right font-mono">{parseFloat(line.credit) > 0 ? parseFloat(line.credit).toFixed(2) : ""}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Este alumno no tiene asientos registrados
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ledger" className="mt-4 space-y-4">
          {loadingLedger ? (
            <div className="space-y-3">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
            </div>
          ) : ledger && ledger.length > 0 ? (
            ledger.map(account => (
              <Card key={account.accountCode}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">{account.accountCode}</Badge>
                      <h3 className="font-medium text-sm">{account.accountName}</h3>
                    </div>
                    <Badge variant={account.balance >= 0 ? "default" : "destructive"}>
                      Saldo: {Math.abs(account.balance).toFixed(2)} {account.balance >= 0 ? "D" : "H"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-0 border rounded-md overflow-hidden">
                    <div className="border-r">
                      <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-center border-b">DEBE</div>
                      {account.entries.filter(e => parseFloat(e.debit) > 0).map((e, i) => (
                        <div key={i} className="px-3 py-2 border-b last:border-b-0 text-sm flex justify-between gap-2">
                          <span className="text-muted-foreground text-xs truncate">{e.description}</span>
                          <span className="font-mono shrink-0">{parseFloat(e.debit).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="px-3 py-2 bg-muted/30 text-sm font-semibold text-right font-mono">{account.totalDebit.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-center border-b">HABER</div>
                      {account.entries.filter(e => parseFloat(e.credit) > 0).map((e, i) => (
                        <div key={i} className="px-3 py-2 border-b last:border-b-0 text-sm flex justify-between gap-2">
                          <span className="text-muted-foreground text-xs truncate">{e.description}</span>
                          <span className="font-mono shrink-0">{parseFloat(e.credit).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="px-3 py-2 bg-muted/30 text-sm font-semibold text-right font-mono">{account.totalCredit.toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No hay movimientos para este alumno
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="balance" className="mt-4">
          {loadingBalance ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : balance && balance.rows.length > 0 ? (
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
                        <TableHead /><TableHead />
                        <TableHead className="text-right border-l text-xs">Debe</TableHead>
                        <TableHead className="text-right text-xs">Haber</TableHead>
                        <TableHead className="text-right border-l text-xs">Deudor</TableHead>
                        <TableHead className="text-right text-xs">Acreedor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balance.rows.map(row => (
                        <TableRow key={row.accountCode}>
                          <TableCell className="font-mono text-sm">{row.accountCode}</TableCell>
                          <TableCell className="text-sm">{row.accountName}</TableCell>
                          <TableCell className="text-right font-mono text-sm border-l">{row.debitSum.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{row.creditSum.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-mono text-sm border-l">{row.debitBalance > 0 ? row.debitBalance.toFixed(2) : ""}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{row.creditBalance > 0 ? row.creditBalance.toFixed(2) : ""}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={2} className="text-sm">TOTALES</TableCell>
                        <TableCell className="text-right font-mono text-sm border-l">{balance.totals.debitSum.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{balance.totals.creditSum.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-sm border-l">{balance.totals.debitBalance.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{balance.totals.creditBalance.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No hay datos de balance para este alumno
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
