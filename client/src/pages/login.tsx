import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Lock, User, ArrowRight, ArrowLeft, UserPlus, KeyRound } from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

interface LoginPageProps {
  onBack?: () => void;
}

export default function LoginPage({ onBack }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, refetch } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsLoading(true);
    try {
      await login(username, password);
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "Error de acceso",
        description: err.message || "Credenciales incorrectas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !fullName || !enrollmentCode) return;
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/register", {
        username,
        password,
        fullName,
        enrollmentCode: enrollmentCode.toUpperCase(),
      });
      await refetch();
      setLocation("/");
      toast({ title: "Cuenta creada correctamente" });
    } catch (err: any) {
      toast({
        title: "Error al registrarse",
        description: err.message || "No se pudo crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setFullName("");
    setEnrollmentCode("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-chart-2/5 rounded-full blur-3xl" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">ContaEdu</h1>
          </div>
          <p className="text-sm text-muted-foreground">Simulador Contable Educativo</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex gap-2">
              <Button
                variant={mode === "login" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setMode("login"); resetForm(); }}
                className="flex-1"
                data-testid="tab-login"
              >
                <Lock className="w-4 h-4 mr-1" />
                Iniciar Sesión
              </Button>
              <Button
                variant={mode === "register" ? "default" : "ghost"}
                size="sm"
                onClick={() => { setMode("register"); resetForm(); }}
                className="flex-1"
                data-testid="tab-register"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Matricularse
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      data-testid="input-username"
                      className="pl-10"
                      placeholder="Tu nombre de usuario"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      data-testid="input-password"
                      type="password"
                      className="pl-10"
                      placeholder="Tu contraseña"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !username || !password}
                  data-testid="button-login"
                >
                  {isLoading ? "Accediendo..." : "Acceder"}
                  {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-code">Código de Matriculación</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-code"
                      data-testid="input-enrollment-code"
                      className="pl-10 uppercase font-mono tracking-widest"
                      placeholder="ABC123"
                      value={enrollmentCode}
                      onChange={e => setEnrollmentCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Tu profesor te proporcionará este código</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-name">Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      data-testid="input-reg-fullname"
                      className="pl-10"
                      placeholder="Juan Pérez Martínez"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Usuario</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-username"
                      data-testid="input-reg-username"
                      className="pl-10"
                      placeholder="jperez"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      data-testid="input-reg-password"
                      type="password"
                      className="pl-10"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !username || !password || !fullName || !enrollmentCode}
                  data-testid="button-register"
                >
                  {isLoading ? "Creando cuenta..." : "Crear Cuenta y Entrar"}
                  {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {onBack && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
