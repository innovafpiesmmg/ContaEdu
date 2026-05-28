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
  BookOpenText,
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
  FileQuestion,
  PieChart,
  UserCog,
  Library,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import contaeduMark from "@assets/ContaEdu_Favicon_transparent.png";
import contaeduHorizontal from "@assets/contaedu_horizontal_transparent.png";

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
    { title: "Ejercicios del Curso", url: "/course-exercises", icon: ClipboardList },
    { title: "Repositorio", url: "/exercises", icon: Library },
    { title: "Exámenes", url: "/exams", icon: FileQuestion },
    { title: "Calificaciones", url: "/grades", icon: Award },
    { title: "Analíticas", url: "/analytics", icon: BarChart3 },
    { title: "Mi Perfil", url: "/profile", icon: UserCog },
  ];

  const studentItems = [
    { title: "Mi Escritorio", url: "/", icon: LayoutDashboard },
    { title: "Ejercicios", url: "/exercises", icon: ClipboardList },
    { title: "Exámenes", url: "/exams", icon: FileQuestion },
    { title: "Mis Calificaciones", url: "/grades", icon: Award },
    { title: "Libro Diario", url: "/journal", icon: BookOpenCheck },
    { title: "Libro Mayor", url: "/ledger", icon: FileText },
    { title: "Balances", url: "/balances", icon: BarChart3 },
    { title: "Plan de Cuentas", url: "/accounts", icon: BookOpen },
    { title: "Manual Contable", url: "/manual", icon: BookOpenText },
    { title: "C. Analitica", url: "/analitica", icon: PieChart },
    { title: "Mi Perfil", url: "/profile", icon: UserCog },
  ];

  const items = user.role === "admin" ? adminItems : user.role === "teacher" ? teacherItems : studentItems;
  const initials = user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <img
            src={contaeduMark}
            alt="ContaEdu"
            className="w-10 h-10 shrink-0 object-contain brightness-0 invert"
            data-testid="img-sidebar-logo-mark"
          />
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <img
              src={contaeduHorizontal}
              alt="ContaEdu"
              className="h-7 w-auto object-contain object-left brightness-0 invert"
              data-testid="img-sidebar-logo-text"
            />
            <span className="text-[11px] text-sidebar-foreground/80 truncate mt-0.5">Simulador Contable</span>
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

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/60">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="text-xs bg-white text-sidebar">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium truncate text-sidebar-foreground" data-testid="text-sidebar-user-name">{user.fullName}</span>
            <span className="text-[10px] text-sidebar-foreground/80">{roleLabel}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
