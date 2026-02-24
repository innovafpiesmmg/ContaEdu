import { useAuth } from "@/lib/auth";
import { useLocation, Link } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  BookOpen,
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  Settings,
  BookOpenCheck,
  FileText,
  BarChart3,
  LogOut,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const roleLabel = user.role === "admin" ? "Administrador" : user.role === "teacher" ? "Profesor" : "Alumno";
  const roleColor = user.role === "admin" ? "destructive" : user.role === "teacher" ? "default" : "secondary";

  const adminItems = [
    { title: "Panel Principal", url: "/", icon: LayoutDashboard },
    { title: "Años Escolares", url: "/school-years", icon: Calendar },
    { title: "Profesores", url: "/teachers", icon: Users },
    { title: "Configuración", url: "/settings", icon: Settings },
  ];

  const teacherItems = [
    { title: "Panel Principal", url: "/", icon: LayoutDashboard },
    { title: "Mis Cursos", url: "/courses", icon: GraduationCap },
    { title: "Alumnos", url: "/students", icon: Users },
    { title: "Ejercicios", url: "/exercises", icon: ClipboardList },
  ];

  const studentItems = [
    { title: "Mi Escritorio", url: "/", icon: LayoutDashboard },
    { title: "Libro Diario", url: "/journal", icon: BookOpenCheck },
    { title: "Libro Mayor", url: "/ledger", icon: FileText },
    { title: "Balances", url: "/balances", icon: BarChart3 },
    { title: "Plan de Cuentas", url: "/accounts", icon: BookOpen },
    { title: "Ejercicios", url: "/exercises", icon: ClipboardList },
  ];

  const items = user.role === "admin" ? adminItems : user.role === "teacher" ? teacherItems : studentItems;
  const initials = user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">ContaEdu</span>
            <span className="text-xs text-muted-foreground truncate">Simulador Contable</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.url.replace("/", "") || "home"}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium truncate" data-testid="text-user-name">{user.fullName}</span>
            <Badge variant={roleColor} className="w-fit text-[10px]">{roleLabel}</Badge>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
