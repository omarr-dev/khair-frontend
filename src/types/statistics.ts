export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalHalaqat: number;
  activeHalaqat: number;
  averageAttendanceRate: number;
  todayMemorization: number;
  todayRevision: number;
  todayAttendance: number;
}

export interface ReportStats {
  totalStudents: number;
  averageAttendance: number;
  weeklyMemorization: number;
  averageQuality: number;
  progressData: { date: string; memorization: number; revision: number; rate: number }[];
  attendanceData: { date: string; memorization: number; revision: number; rate: number }[];
  topStudents: { name: string; progress: number; quality: number }[];
  qualityDistribution: { name: string; value: number; color: string }[];
}

// Supervisor Dashboard Types
export interface HalaqaRanking {
  id: number;
  name: string;
  studentCount: number;
  teacherCount: number;
  attendanceRate: number;
  weeklyProgress: number;
  score: number;
}

export interface TeacherRanking {
  id: number;
  fullName: string;
  studentCount: number;
  studentAttendanceRate: number;
  weeklyProgress: number;
  averageQuality: number;
  score: number;
}

export interface AtRiskStudent {
  id: number;
  fullName: string;
  halaqaName: string;
  teacherName: string;
  attendanceRate: number;
  daysSinceLastProgress: number;
  consecutiveAbsences: number;
}

export interface SupervisorDashboard {
  totalStudents: number;
  totalTeachers: number;
  totalHalaqat: number;
  todayAttendanceRate: number;
  todayMemorization: number;
  todayRevision: number;
  studentsAtRisk: number;
  topHalaqat: HalaqaRanking[];
  topTeachers: TeacherRanking[];
  atRiskStudents: AtRiskStudent[];
}

// System-wide statistics for motivation section
export interface SystemWideStats {
  todayVersesMemorized: number;
  todayVersesReviewed: number;
  todayStudentsActive: number;
  totalStudents: number;
  versesMemorizedChange: number; // +/- vs yesterday
  versesReviewedChange: number;
  studentsActiveChange: number;
  weekVersesMemorized: number;
  weekVersesReviewed: number;
  weekStudentsActive: number;
}




