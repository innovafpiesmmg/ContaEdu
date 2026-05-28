import { useState, useEffect, useRef } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ExerciseProvider } from "@/lib/exercise-context";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

import AdminDashboard from "@/pages/admin/dashboard";
import SchoolYearsPage from "@/pages/admin/school-years";
import TeachersPage from "@/pages/admin/teachers";
import SettingsPage from "@/pages/admin/settings";

import TeacherDashboard from "@/pages/teacher/dashboard";
import CoursesPage from "@/pages/teacher/courses";
import StudentsPage from "@/pages/teacher/students";
import TeacherExercisesPage from "@/pages/teacher/exercises";
import StudentAuditPage from "@/pages/teacher/student-audit";
import TeacherExamsPage from "@/pages/teacher/exams";
import CourseExercisesPage from "@/pages/teacher/course-exercises";
import GradesPage from "@/pages/teacher/grades";
import AnalyticsPage from "@/pages/teacher/analytics";

import StudentDashboard from "@/pages/student/dashboard";
import JournalPage from "@/pages/student/journal";
import LedgerPage from "@/pages/student/ledger";
import BalancesPage from "@/pages/student/balances";
import AccountsPage from "@/pages/student/accounts";
import StudentExercisesPage from "@/pages/student/student-exercises";
import ManualPage from "@/pages/student/manual";
import StudentExamsPage from "@/pages/student/student-exams";
import StudentGradesPage from "@/pages/student/student-grades";
import AnaliticaPage from "@/pages/student/analitica";
import ProfilePage from "@/pages/profile";
import ResetPasswordPage from "@/pages/reset-password";
import { Skeleton } from "@/components/ui/skeleton";

function AdminRouter() {
  return (
    <Switch>
      <Route path="/" component={AdminDashboard} />
      <Route path="/school-years" component={SchoolYearsPage} />
      <Route path="/teachers" component={TeachersPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function TeacherRouter() {
  return (
    <Switch>
      <Route path="/" component={TeacherDashboard} />
      <Route path="/courses" component={CoursesPage} />
      <Route path="/students" component={StudentsPage} />
      <Route path="/students/:id/audit" component={StudentAuditPage} />
      <Route path="/exercises" component={TeacherExercisesPage} />
      <Route path="/course-exercises" component={CourseExercisesPage} />
      <Route path="/exams" component={TeacherExamsPage} />
      <Route path="/grades" component={GradesPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function StudentRouter() {
  return (
    <Switch>
      <Route path="/" component={StudentDashboard} />
      <Route path="/journal" component={JournalPage} />
      <Route path="/ledger" component={LedgerPage} />
      <Route path="/balances" component={BalancesPage} />
      <Route path="/accounts" component={AccountsPage} />
      <Route path="/exercises" component={StudentExercisesPage} />
      <Route path="/exams" component={StudentExamsPage} />
      <Route path="/grades" component={StudentGradesPage} />
      <Route path="/manual" component={ManualPage} />
      <Route path="/analitica" component={AnaliticaPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, loading, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    if (user) {
      wasLoggedIn.current = true;
    } else if (wasLoggedIn.current) {
      setShowLogin(false);
      wasLoggedIn.current = false;
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-3 w-64">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (window.location.pathname === "/reset-password") {
    return <ResetPasswordPage />;
  }

  if (!user) {
    if (showLogin) {
      return <LoginPage onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onGoToLogin={() => setShowLogin(true)} />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  const roleLabel = user.role === "admin" ? "Administrador" : user.role === "teacher" ? "Profesor" : "Alumno";
  const initials = user.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-2 px-4 h-14 bg-primary text-primary-foreground shrink-0 shadow-md">
            <div className="flex items-center gap-2">
              <SidebarTrigger
                data-testid="button-sidebar-toggle"
                className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
              />
              <span className="text-sm font-semibold tracking-wide hidden sm:inline">
                ContaEdu <span className="opacity-70 font-normal">— Panel de {roleLabel}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-[11px] bg-white text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-medium" data-testid="text-navbar-user-name">{user.fullName}</span>
                  <span className="text-[10px] text-primary-foreground/80">{roleLabel}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={logout}
                data-testid="button-navbar-logout"
                className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
              >
                <LogOut className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {user.role === "admin" && <AdminRouter />}
            {user.role === "teacher" && <TeacherRouter />}
            {user.role === "student" && <StudentRouter />}
          </main>
          <footer className="bg-primary text-primary-foreground px-4 py-2 text-xs flex items-center justify-between shrink-0 border-t border-white/10">
            <span className="opacity-80">© 2026 Atreyu Servicios Digitales</span>
            <span className="opacity-80 hidden sm:inline">ContaEdu v2.0 — IES Manuel Martín González</span>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ExerciseProvider>
            <AuthenticatedApp />
          </ExerciseProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
