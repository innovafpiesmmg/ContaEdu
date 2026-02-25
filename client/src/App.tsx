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

import StudentDashboard from "@/pages/student/dashboard";
import JournalPage from "@/pages/student/journal";
import LedgerPage from "@/pages/student/ledger";
import BalancesPage from "@/pages/student/balances";
import AccountsPage from "@/pages/student/accounts";
import StudentExercisesPage from "@/pages/student/student-exercises";
import ManualPage from "@/pages/student/manual";
import StudentExamsPage from "@/pages/student/student-exams";
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
      <Route path="/manual" component={ManualPage} />
      <Route path="/analitica" component={AnaliticaPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { user, loading } = useAuth();
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

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-2 p-2 border-b shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto">
            {user.role === "admin" && <AdminRouter />}
            {user.role === "teacher" && <TeacherRouter />}
            {user.role === "student" && <StudentRouter />}
          </main>
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
