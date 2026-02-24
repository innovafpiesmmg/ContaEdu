import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Plus, Trash2, Search, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", accountType: "" });
  const { data: accounts, isLoading } = useQuery<Account[]>({ queryKey: ["/api/accounts"] });
  const { user } = useAuth();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/accounts", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setOpen(false);
      setForm({ code: "", name: "", accountType: "" });
      toast({ title: "Cuenta creada correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      toast({ title: "Cuenta eliminada" });
    },
  });

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
    "1": "Financiacion Basica",
    "2": "Activo No Corriente",
    "3": "Existencias",
    "4": "Acreedores y Deudores",
    "5": "Cuentas Financieras",
    "6": "Compras y Gastos",
    "7": "Ventas e Ingresos",
  };

  const isStudent = user?.role === "student";

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Plan de Cuentas</h1>
          <p className="text-muted-foreground text-sm mt-1">Plan General de Contabilidad (PGC)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            data-testid="button-download-accounts"
            onClick={() => {
              window.open("/api/accounts/download", "_blank");
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar CSV
          </Button>
        {isStudent && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-account">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Añadir Cuenta al PGC</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Código de Cuenta</Label>
                  <Input
                    data-testid="input-account-code"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value })}
                    placeholder="Ej: 431, 5200..."
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Introduce un código numérico siguiendo la estructura del PGC
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Nombre de la Cuenta</Label>
                  <Input
                    data-testid="input-account-name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Clientes, efectos comerciales a cobrar"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Cuenta</Label>
                  <Select value={form.accountType} onValueChange={v => setForm({ ...form, accountType: v })}>
                    <SelectTrigger data-testid="select-account-type">
                      <SelectValue placeholder="Seleccionar tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">Activo</SelectItem>
                      <SelectItem value="liability">Pasivo</SelectItem>
                      <SelectItem value="equity">Patrimonio Neto</SelectItem>
                      <SelectItem value="income">Ingreso</SelectItem>
                      <SelectItem value="expense">Gasto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  data-testid="button-save-account"
                  className="w-full"
                  onClick={() => createMutation.mutate()}
                  disabled={!form.code || !form.name || !form.accountType || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creando..." : "Añadir Cuenta"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
        </div>
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
                        {!account.isSystem && (
                          <Badge variant="outline" className="text-[10px]">Personal</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-md ${typeColors[account.accountType] || ""}`}>
                          {typeLabels[account.accountType] || account.accountType}
                        </span>
                        {isStudent && !account.isSystem && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => deleteMutation.mutate(account.id)}
                            data-testid={`button-delete-account-${account.code}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
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
