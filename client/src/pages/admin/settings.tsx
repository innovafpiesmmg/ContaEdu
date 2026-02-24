import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Settings2, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { SystemConfig } from "@shared/schema";

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<SystemConfig>({ queryKey: ["/api/config"] });

  const updateMutation = useMutation({
    mutationFn: (taxRegime: string) => apiRequest("PATCH", "/api/config", { taxRegime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({ title: "Configuración actualizada" });
    },
  });

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
    </div>
  );
}
