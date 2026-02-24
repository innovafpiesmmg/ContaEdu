import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@shared/schema";
import { motion } from "framer-motion";

export default function TeachersPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", username: "", password: "" });
  const { toast } = useToast();

  const { data: teachers, isLoading } = useQuery<User[]>({ queryKey: ["/api/users/teachers"] });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/users/teachers", { ...form, role: "teacher" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/teachers"] });
      setOpen(false);
      setForm({ fullName: "", username: "", password: "" });
      toast({ title: "Profesor creado correctamente" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/teachers"] });
      toast({ title: "Profesor eliminado" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profesores</h1>
          <p className="text-muted-foreground text-sm mt-1">Administra las cuentas de profesores</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-teacher">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Profesor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Profesor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input
                  data-testid="input-teacher-name"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  placeholder="María García López"
                />
              </div>
              <div className="space-y-2">
                <Label>Usuario</Label>
                <Input
                  data-testid="input-teacher-username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="mgarcia"
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input
                  data-testid="input-teacher-password"
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <Button
                data-testid="button-save-teacher"
                className="w-full"
                onClick={() => createMutation.mutate()}
                disabled={!form.fullName || !form.username || !form.password || createMutation.isPending}
              >
                {createMutation.isPending ? "Creando..." : "Crear Profesor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
      ) : teachers && teachers.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {teachers.map(t => (
            <Card key={t.id} className="hover-elevate" data-testid={`teacher-card-${t.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {t.fullName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.fullName}</p>
                    <p className="text-xs text-muted-foreground">@{t.username}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(t.id)}
                    data-testid={`button-delete-teacher-${t.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No hay profesores registrados</p>
            <p className="text-xs text-muted-foreground mt-1">Crea el primer profesor para empezar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
