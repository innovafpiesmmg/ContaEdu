import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Receipt, Mail, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SystemConfig, MailConfig } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<SystemConfig>({ queryKey: ["/api/config"] });
  const { data: mailData, isLoading: mailLoading } = useQuery<MailConfig>({ queryKey: ["/api/config/mail"] });

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpPasswordChanged, setSmtpPasswordChanged] = useState(false);
  const [smtpFrom, setSmtpFrom] = useState("");
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (mailData) {
      setSmtpHost(mailData.smtpHost || "");
      setSmtpPort(String(mailData.smtpPort || 587));
      setSmtpUser(mailData.smtpUser || "");
      setSmtpPassword("");
      setSmtpPasswordChanged(false);
      setSmtpFrom(mailData.smtpFrom || "");
      setSmtpSecure(mailData.smtpSecure || false);
    }
  }, [mailData]);

  const updateMutation = useMutation({
    mutationFn: (taxRegime: string) => apiRequest("PATCH", "/api/config", { taxRegime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Configuración actualizada" });
    },
  });

  const mailMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/api/config/mail", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config/mail"] });
      toast({ title: "Configuración de correo actualizada" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleMailSave = () => {
    const data: any = {
      smtpHost,
      smtpPort: parseInt(smtpPort) || 587,
      smtpUser,
      smtpFrom,
      smtpSecure,
    };
    if (smtpPasswordChanged && smtpPassword) {
      data.smtpPassword = smtpPassword;
    }
    mailMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Ajustes globales del sistema</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold">Régimen Fiscal</h3>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Define el impuesto indirecto que se utilizará en todo el sistema. Esto afecta a las etiquetas y cuentas contables disponibles.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => updateMutation.mutate("iva")}
                  disabled={updateMutation.isPending}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    config?.taxRegime === "iva"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  data-testid="button-tax-iva"
                >
                  <p className="font-semibold text-sm">IVA</p>
                  <p className="text-xs text-muted-foreground mt-1">Península y Baleares</p>
                  <p className="text-xs text-muted-foreground">Tipos: 21%, 10%, 4%</p>
                </button>
                <button
                  onClick={() => updateMutation.mutate("igic")}
                  disabled={updateMutation.isPending}
                  className={`p-4 rounded-lg border-2 text-left transition-colors ${
                    config?.taxRegime === "igic"
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  data-testid="button-tax-igic"
                >
                  <p className="font-semibold text-sm">IGIC</p>
                  <p className="text-xs text-muted-foreground mt-1">Canarias</p>
                  <p className="text-xs text-muted-foreground">Tipos: 7%, 3%, 0%</p>
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold">Servidor de Correo (SMTP)</h3>
          </div>
        </CardHeader>
        <CardContent>
          {mailLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configura el servidor de correo para habilitar la recuperación de contraseñas. Los usuarios podrán solicitar un enlace de restablecimiento por correo electrónico.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">Servidor SMTP</Label>
                  <Input
                    id="smtp-host"
                    data-testid="input-smtp-host"
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={e => setSmtpHost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Puerto</Label>
                  <Input
                    id="smtp-port"
                    data-testid="input-smtp-port"
                    type="number"
                    placeholder="587"
                    value={smtpPort}
                    onChange={e => setSmtpPort(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Usuario SMTP</Label>
                  <Input
                    id="smtp-user"
                    data-testid="input-smtp-user"
                    placeholder="usuario@ejemplo.com"
                    value={smtpUser}
                    onChange={e => setSmtpUser(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Contraseña SMTP</Label>
                  <div className="relative">
                    <Input
                      id="smtp-password"
                      data-testid="input-smtp-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={mailData?.smtpPassword ? "••••••••  (sin cambios)" : "Contraseña o app password"}
                      value={smtpPassword}
                      onChange={e => { setSmtpPassword(e.target.value); setSmtpPasswordChanged(true); }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="smtp-from">Dirección de remitente</Label>
                  <Input
                    id="smtp-from"
                    data-testid="input-smtp-from"
                    placeholder="contaedu@micentro.edu"
                    value={smtpFrom}
                    onChange={e => setSmtpFrom(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="smtp-secure"
                  data-testid="switch-smtp-secure"
                  checked={smtpSecure}
                  onCheckedChange={setSmtpSecure}
                />
                <Label htmlFor="smtp-secure" className="text-sm">Conexión segura (SSL/TLS, puerto 465)</Label>
              </div>
              <Button
                onClick={handleMailSave}
                disabled={mailMutation.isPending}
                data-testid="button-save-mail"
              >
                {mailMutation.isPending ? "Guardando..." : "Guardar configuración de correo"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
