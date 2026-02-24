import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface ExerciseContextType {
  currentExerciseId: string | null;
  setCurrentExerciseId: (id: string | null) => void;
}

const ExerciseContext = createContext<ExerciseContextType | null>(null);

export function ExerciseProvider({ children }: { children: ReactNode }) {
  const [currentExerciseId, setCurrentExerciseIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem("contaedu_exercise_id") || null;
    } catch {
      return null;
    }
  });

  const setCurrentExerciseId = (id: string | null) => {
    setCurrentExerciseIdState(id);
    try {
      if (id) {
        localStorage.setItem("contaedu_exercise_id", id);
      } else {
        localStorage.removeItem("contaedu_exercise_id");
      }
    } catch {}
  };

  return (
    <ExerciseContext.Provider value={{ currentExerciseId, setCurrentExerciseId }}>
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExercise() {
  const context = useContext(ExerciseContext);
  if (!context) throw new Error("useExercise must be used within ExerciseProvider");
  return context;
}
