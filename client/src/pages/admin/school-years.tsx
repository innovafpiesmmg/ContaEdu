import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, Power, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SchoolYear } from "@shared/schema";
import { motion } from "framer-motion";

export default function SchoolYearsPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { toast } = useToast();

  const { data: years, isLoading } = useQuery<SchoolYear[]>({ queryKey: ["/api/school-years"] });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/school-years", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-years"] });
      setOpen(false);
      setName("");
      toast({ title: "Año escolar creado" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/school-years/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-years"] });
      toast({ title: "Estado actualizado" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/school-years/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/school-years"] });
      toast({ title: "Año escolar eliminado" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Años Escolares</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona los ciclos lectivos del centro</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-year">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Año
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Año Escolar</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  data-testid="input-year-name"
                  placeholder="Ej: 2024-2025"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <Button
                data-testid="button-save-year"
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!name || createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear Año Escolar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : years && years.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {years.map(year => (
            <Card key={year.id} className="hover-elevate" data-testid={`year-card-${year.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${year.active ? "bg-primary/10" : "bg-muted"}`}>
                      <Calendar className={`w-5 h-5 ${year.active ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium">{year.name}</p>
                      <Badge variant={year.active ? "default" : "secondary"} className="mt-1">
                        {year.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={year.active ? "secondary" : "default"}
                      onClick={() => toggleMutation.mutate(year.id)}
                      disabled={toggleMutation.isPending}
                      data-testid={`button-toggle-${year.id}`}
                    >
                      <Power className="w-4 h-4 mr-1" />
                      {year.active ? "Desactivar" : "Activar"}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(year.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${year.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No hay años escolares</p>
            <p className="text-xs text-muted-foreground mt-1">Crea el primer año escolar para empezar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
