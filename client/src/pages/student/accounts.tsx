import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import type { Account } from "@shared/schema";
import { motion } from "framer-motion";

const typeLabels: Record<string, string> = {
  asset: "Activo",
  liability: "Pasivo",
  equity: "Patrimonio Neto",
  income: "Ingreso",
  expense: "Gasto",
};

const typeColors: Record<string, string> = {
  asset: "bg-chart-1/10 text-chart-1",
  liability: "bg-chart-2/10 text-chart-2",
  equity: "bg-chart-3/10 text-chart-3",
  income: "bg-chart-4/10 text-chart-4",
  expense: "bg-chart-5/10 text-chart-5",
};

export default function AccountsPage() {
  const [search, setSearch] = useState("");
  const { data: accounts, isLoading } = useQuery<Account[]>({ queryKey: ["/api/accounts"] });

  const filtered = accounts?.filter(a =>
    a.code.includes(search) || a.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered?.reduce((acc, account) => {
    const group = account.code.charAt(0);
    if (!acc[group]) acc[group] = [];
    acc[group].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  const groupNames: Record<string, string> = {
    "1": "Financiación Básica",
    "2": "Activo No Corriente",
    "3": "Existencias",
    "4": "Acreedores y Deudores",
    "5": "Cuentas Financieras",
    "6": "Compras y Gastos",
    "7": "Ventas e Ingresos",
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plan de Cuentas</h1>
        <p className="text-muted-foreground text-sm mt-1">Plan General de Contabilidad (PGC)</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          data-testid="input-search-accounts"
          placeholder="Buscar por código o nombre..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : grouped && Object.keys(grouped).length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {Object.keys(grouped).sort().map(group => (
            <div key={group}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                Grupo {group} - {groupNames[group] || "Otros"}
              </h3>
              <Card>
                <CardContent className="p-0">
                  {grouped[group].map((account, i) => (
                    <div
                      key={account.id}
                      className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? "border-t" : ""}`}
                      data-testid={`account-${account.code}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-muted-foreground w-12">{account.code}</span>
                        <span className="text-sm">{account.name}</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-md ${typeColors[account.accountType] || ""}`}>
                        {typeLabels[account.accountType] || account.accountType}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {search ? "No se encontraron cuentas" : "No hay cuentas cargadas"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
