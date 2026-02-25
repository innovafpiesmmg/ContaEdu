import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { GraduationCap, Star, Search, TrendingUp, FileQuestion, ClipboardList } from "lucide-react";
import type { Course } from "@shared/schema";
import { motion } from "framer-motion";

interface GradeItem {
  exerciseId?: string;
  examId?: string;
  exerciseTitle?: string;
  examTitle?: string;
  status: string;
  grade: string | null;
  feedback: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

interface StudentGrades {
  studentId: string;
  studentName: string;
  username: string;
  exerciseGrades: GradeItem[];
  examGrades: GradeItem[];
}

interface GradesResponse {
  exercises: { id: string; title: string }[];
  exams: { id: string; title: string }[];
  students: StudentGrades[];
}

function gradeColor(grade: number): string {
  if (grade >= 9) return "text-green-700 bg-green-50 border-green-300";
  if (grade >= 7) return "text-blue-700 bg-blue-50 border-blue-300";
  if (grade >= 5) return "text-yellow-700 bg-yellow-50 border-yellow-300";
  return "text-red-700 bg-red-50 border-red-300";
}

function statusLabel(status: string): string {
  switch (status) {
    case "reviewed": return "Corregido";
    case "submitted": return "Entregado";
    case "in_progress": return "En curso";
    case "expired": return "Expirado";
    default: return "—";
  }
}

function statusVariant(status: string, hasGrade: boolean): "default" | "secondary" | "outline" | "destructive" {
  if (hasGrade) return "outline";
  if (status === "submitted") return "default";
  if (status === "in_progress") return "secondary";
  return "outline";
}

export default function GradesPage() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [searchStudent, setSearchStudent] = useState("");

  const { data: courses } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: gradesData, isLoading } = useQuery<GradesResponse>({
    queryKey: ["/api/grades", selectedCourse],
    enabled: !!selectedCourse,
  });

  const filteredStudents = gradesData?.students.filter(s => {
    if (!searchStudent) return true;
    const q = searchStudent.toLowerCase();
    return s.studentName.toLowerCase().includes(q) || s.username.toLowerCase().includes(q);
  });

  const calculateAverage = (student: StudentGrades): number | null => {
    const allGrades: number[] = [];
    student.exerciseGrades.forEach(g => { if (g.grade) allGrades.push(parseFloat(g.grade)); });
    student.examGrades.forEach(g => { if (g.grade) allGrades.push(parseFloat(g.grade)); });
    if (allGrades.length === 0) return null;
    return allGrades.reduce((sum, g) => sum + g, 0) / allGrades.length;
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-grades-title">Calificaciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión de notas por curso</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[250px]" data-testid="select-grades-course">
            <SelectValue placeholder="Seleccionar curso..." />
          </SelectTrigger>
          <SelectContent>
            {courses?.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCourse && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              data-testid="input-search-student-grades"
              className="pl-8 h-9"
              placeholder="Buscar alumno..."
              value={searchStudent}
              onChange={e => setSearchStudent(e.target.value)}
            />
          </div>
        )}
      </div>

      {!selectedCourse ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Selecciona un curso para ver las calificaciones</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
        </div>
      ) : filteredStudents && filteredStudents.length > 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {gradesData && (gradesData.exercises.length > 0 || gradesData.exams.length > 0) && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="font-medium">Resumen:</span>
                  <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> {gradesData.exercises.length} ejercicios</span>
                  <span className="flex items-center gap-1"><FileQuestion className="w-3 h-3" /> {gradesData.exams.length} exámenes</span>
                  <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {filteredStudents.length} alumnos</span>
                </div>
              </CardContent>
            </Card>
          )}

          {filteredStudents.map(student => {
            const avg = calculateAverage(student);
            return (
              <Card key={student.studentId} data-testid={`grades-card-${student.studentId}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {student.studentName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm" data-testid={`text-student-name-${student.studentId}`}>{student.studentName}</p>
                        <p className="text-xs text-muted-foreground">@{student.username}</p>
                      </div>
                    </div>
                    {avg !== null && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <Badge variant="outline" className={`text-sm font-bold ${gradeColor(avg)}`} data-testid={`text-average-${student.studentId}`}>
                          Media: {avg.toFixed(1)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {student.exerciseGrades.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" /> Ejercicios
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {student.exerciseGrades.map((g, idx) => (
                          <div
                            key={idx}
                            className="group relative"
                            title={`${g.exerciseTitle}\n${g.feedback || ""}`}
                          >
                            {g.grade ? (
                              <Badge variant="outline" className={`text-xs ${gradeColor(parseFloat(g.grade))}`} data-testid={`grade-exercise-${student.studentId}-${idx}`}>
                                <Star className="w-2.5 h-2.5 mr-0.5" />
                                {parseFloat(g.grade).toFixed(1)}
                              </Badge>
                            ) : (
                              <Badge variant={statusVariant(g.status, false)} className="text-[10px]">
                                {statusLabel(g.status)}
                              </Badge>
                            )}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border rounded shadow-md text-[10px] text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 max-w-48 truncate">
                              {g.exerciseTitle}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {student.examGrades.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                        <FileQuestion className="w-3 h-3" /> Exámenes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {student.examGrades.map((g, idx) => (
                          <div
                            key={idx}
                            className="group relative"
                            title={`${g.examTitle}\n${g.feedback || ""}`}
                          >
                            {g.grade ? (
                              <Badge variant="outline" className={`text-xs ${gradeColor(parseFloat(g.grade))}`} data-testid={`grade-exam-${student.studentId}-${idx}`}>
                                <Star className="w-2.5 h-2.5 mr-0.5" />
                                {parseFloat(g.grade).toFixed(1)}
                              </Badge>
                            ) : (
                              <Badge variant={statusVariant(g.status, false)} className="text-[10px]">
                                {statusLabel(g.status)}
                              </Badge>
                            )}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border rounded shadow-md text-[10px] text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 max-w-48 truncate">
                              {g.examTitle}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {student.exerciseGrades.length === 0 && student.examGrades.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sin actividad registrada</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {searchStudent ? "No se encontraron alumnos" : "No hay alumnos en este curso"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}