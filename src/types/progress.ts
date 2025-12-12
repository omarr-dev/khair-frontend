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
  type: 0 | 1; // 0: Memorization, 1: Revision
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

export interface Halaqa {
  id: number;
  name: string;
  description?: string;
  location?: string;
  timeSlot?: string;
  activeDays?: string; // "0,1,3,4" = Sun,Mon,Wed,Thu
  isActive: boolean;
  studentCount: number;
  teacherCount: number;
  createdAt: string;
}
