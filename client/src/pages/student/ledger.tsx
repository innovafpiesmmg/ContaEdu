import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface LedgerAccount {
  accountCode: string;
  accountName: string;
  entries: {
    date: string;
    description: string;
    debit: string;
    credit: string;
  }[];
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export default function LedgerPage() {
  const { data: ledger, isLoading } = useQuery<LedgerAccount[]>({ queryKey: ["/api/ledger"] });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Libro Mayor</h1>
        <p className="text-muted-foreground text-sm mt-1">Cuentas T - Detalle por cuenta contable</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      ) : ledger && ledger.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {ledger.map(account => (
            <Card key={account.accountCode} className="hover-elevate" data-testid={`ledger-${account.accountCode}`}>
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
                    <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-center border-b">
                      DEBE
                    </div>
                    {account.entries
                      .filter(e => parseFloat(e.debit) > 0)
                      .map((e, i) => (
                        <div key={i} className="px-3 py-2 border-b last:border-b-0 text-sm flex justify-between gap-2">
                          <span className="text-muted-foreground text-xs truncate">{e.description}</span>
                          <span className="font-mono shrink-0">{parseFloat(e.debit).toFixed(2)}</span>
                        </div>
                      ))}
                    <div className="px-3 py-2 bg-muted/30 text-sm font-semibold text-right font-mono">
                      {account.totalDebit.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="bg-muted/50 px-3 py-2 text-xs font-semibold text-center border-b">
                      HABER
                    </div>
                    {account.entries
                      .filter(e => parseFloat(e.credit) > 0)
                      .map((e, i) => (
                        <div key={i} className="px-3 py-2 border-b last:border-b-0 text-sm flex justify-between gap-2">
                          <span className="text-muted-foreground text-xs truncate">{e.description}</span>
                          <span className="font-mono shrink-0">{parseFloat(e.credit).toFixed(2)}</span>
                        </div>
                      ))}
                    <div className="px-3 py-2 bg-muted/30 text-sm font-semibold text-right font-mono">
                      {account.totalCredit.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No hay movimientos registrados</p>
            <p className="text-xs text-muted-foreground mt-1">Los movimientos aparecerán cuando registres asientos en el Libro Diario</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
