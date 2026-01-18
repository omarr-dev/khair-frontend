export interface ProgressRecord {
  id: number;
  studentId: number;
  studentName: string;
  teacherId?: number | null;
  teacherName?: string | null;
  halaqaId: number;
  halaqaName: string;
  date: string;
  type: string;
  surahName: string;
  fromVerse: number;
  toVerse: number;
  quality: string;
  notes?: string;
  createdAt: string;
}

export interface CreateProgressRecord {
  studentId: number;
  teacherId: number;
  halaqaId: number;
  date: string;
  type: 0 | 1 | 2; // 0: Memorization (حفظ), 1: Revision (مراجعة), 2: Consolidation (التثبيت)
  surahName: string;
  fromVerse: number;
  toVerse: number;
  quality: 0 | 1 | 2 | 3; // 0: Excellent, 1: VeryGood, 2: Good, 3: Acceptable
  notes?: string;
}

export interface DailyProgressSummary {
  date: string;
  totalMemorization: number;
  totalRevision: number;
  uniqueStudents: number;
  records: ProgressRecord[];
}

export interface StudentProgressSummary {
  studentId: number;
  studentName: string;
  totalMemorized: number;
  totalRevised: number;
  lastProgressDate: string;
  averageQuality: number;
  recentProgress: ProgressRecord[];
}
