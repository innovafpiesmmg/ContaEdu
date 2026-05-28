interface SolutionLine {
  accountCode: string;
  accountName?: string;
  debit: string | number;
  credit: string | number;
}

interface SolutionEntry {
  entryNumber: number;
  description?: string;
  date?: string;
  points?: number;
  lines: SolutionLine[];
}

interface StudentLine {
  accountCode: string;
  debit: string | number;
  credit: string | number;
}

interface StudentEntry {
  entryNumber: number;
  description: string;
  lines: StudentLine[];
}

interface MatchReport {
  solutionEntryNumber: number;
  solutionDescription: string;
  points: number;
  matched: boolean;
  matchedStudentEntryNumber?: number;
  diff?: string;
}

export interface AutoGradeResult {
  grade: number;
  totalPoints: number;
  earnedPoints: number;
  matchedCount: number;
  totalSolutionEntries: number;
  extraEntries: number;
  report: MatchReport[];
  feedback: string;
}

function norm(v: string | number): number {
  if (typeof v === "number") return Math.round(v * 100) / 100;
  const cleaned = String(v).replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

function lineKey(l: { accountCode: string; debit: string | number; credit: string | number }): string {
  return `${String(l.accountCode).trim()}|${norm(l.debit).toFixed(2)}|${norm(l.credit).toFixed(2)}`;
}

function entrySignature(lines: { accountCode: string; debit: string | number; credit: string | number }[]): string {
  return lines.map(lineKey).sort().join("##");
}

function entriesMatch(
  solLines: SolutionLine[],
  stuLines: StudentLine[],
): boolean {
  if (solLines.length !== stuLines.length) return false;
  return entrySignature(solLines) === entrySignature(stuLines);
}

export function autoGrade(
  solution: SolutionEntry[],
  studentEntries: StudentEntry[],
): AutoGradeResult {
  if (!Array.isArray(solution) || solution.length === 0) {
    return {
      grade: 0,
      totalPoints: 0,
      earnedPoints: 0,
      matchedCount: 0,
      totalSolutionEntries: 0,
      extraEntries: studentEntries.length,
      report: [],
      feedback: "No hay solución definida para este ejercicio. No se puede calcular la nota automáticamente.",
    };
  }

  const hasExplicitPoints = solution.some(e => typeof e.points === "number" && e.points > 0);
  const equalWeight = hasExplicitPoints ? 0 : 10 / solution.length;
  const totalPoints = hasExplicitPoints
    ? solution.reduce((s, e) => s + (e.points || 0), 0)
    : 10;

  const usedStudentIdx = new Set<number>();
  const report: MatchReport[] = [];
  let earnedPoints = 0;
  let matchedCount = 0;

  for (const solEntry of solution) {
    const pts = hasExplicitPoints ? (solEntry.points || 0) : equalWeight;
    let matchedIdx = -1;
    for (let i = 0; i < studentEntries.length; i++) {
      if (usedStudentIdx.has(i)) continue;
      if (entriesMatch(solEntry.lines, studentEntries[i].lines)) {
        matchedIdx = i;
        break;
      }
    }

    if (matchedIdx >= 0) {
      usedStudentIdx.add(matchedIdx);
      earnedPoints += pts;
      matchedCount++;
      report.push({
        solutionEntryNumber: solEntry.entryNumber,
        solutionDescription: solEntry.description || `Asiento ${solEntry.entryNumber}`,
        points: pts,
        matched: true,
        matchedStudentEntryNumber: studentEntries[matchedIdx].entryNumber,
      });
    } else {
      const expected = solEntry.lines
        .map(l => `${l.accountCode} (Debe ${norm(l.debit).toFixed(2)} / Haber ${norm(l.credit).toFixed(2)})`)
        .join(", ");
      report.push({
        solutionEntryNumber: solEntry.entryNumber,
        solutionDescription: solEntry.description || `Asiento ${solEntry.entryNumber}`,
        points: pts,
        matched: false,
        diff: `Esperado: ${expected}`,
      });
    }
  }

  const extraEntries = studentEntries.length - usedStudentIdx.size;
  const grade = totalPoints > 0
    ? Math.max(0, Math.min(10, (earnedPoints / totalPoints) * 10))
    : 0;
  const gradeRounded = Math.round(grade * 100) / 100;

  const lines: string[] = [];
  lines.push(`📊 Corrección automática`);
  lines.push(`Nota propuesta: ${gradeRounded.toFixed(2)} / 10`);
  lines.push(`Asientos correctos: ${matchedCount} de ${solution.length}`);
  if (hasExplicitPoints) {
    lines.push(`Puntos: ${earnedPoints.toFixed(2)} / ${totalPoints.toFixed(2)}`);
  }
  if (extraEntries > 0) {
    lines.push(`⚠️ Asientos adicionales sin correspondencia: ${extraEntries}`);
  }
  lines.push("");
  lines.push("Detalle por asiento:");
  for (const r of report) {
    if (r.matched) {
      lines.push(`✅ Asiento ${r.solutionEntryNumber} — ${r.solutionDescription} (${r.points.toFixed(2)} pts)`);
    } else {
      lines.push(`❌ Asiento ${r.solutionEntryNumber} — ${r.solutionDescription} (0 / ${r.points.toFixed(2)} pts)`);
      if (r.diff) lines.push(`   ${r.diff}`);
    }
  }

  return {
    grade: gradeRounded,
    totalPoints,
    earnedPoints: Math.round(earnedPoints * 100) / 100,
    matchedCount,
    totalSolutionEntries: solution.length,
    extraEntries,
    report,
    feedback: lines.join("\n"),
  };
}
