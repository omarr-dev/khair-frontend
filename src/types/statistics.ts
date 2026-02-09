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
  daysSinceLastAttendance: number;
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

// Daily Achievement Statistics (إنجاز اليوم)
export interface AchievementMetric {
  achieved: number;
  target: number;
  percentage: number;
  unit: string; // "سطر" for memorization, "وجه" for revision/consolidation
}

export interface DayAchievement {
  date: string;
  targetMet: boolean;
  percentage: number;
}

export interface WeekSummary {
  days: DayAchievement[];
  daysTargetMet: number;
  totalDays: number;
}

export interface DailyAchievementStats {
  fromDate: string;
  toDate: string;
  totalStudents: number;
  studentsWithTargets: number;
  memorization: AchievementMetric;
  revision: AchievementMetric;
  consolidation: AchievementMetric;
  weekSummary: WeekSummary;
}

// Streak Leaderboard (أطول سلاسل الإنجاز)
export interface StreakStudent {
  studentId: number;
  studentName: string;
  halaqaName: string;
  halaqaId: number;
  currentStreak: number;
  longestStreak: number;
  isStreakActive: boolean;
  lastProgressDate: string;
  rank: number;
}

export interface StreakLeaderboard {
  students: StreakStudent[];
  totalStudentsInScope: number;
  studentsWithActiveStreaks: number;
  filteredByHalaqa: string | null;
}

// Target Adoption Overview (تغطية نظام الأهداف)
export interface HalaqaCoverage {
  halaqatWithTargets: number;
  totalHalaqat: number;
}

export interface TeacherCoverage {
  teachersWithTargets: number;
  totalTeachers: number;
}

export interface HalaqaBreakdownItem {
  halaqaId: number;
  halaqaName: string;
  studentsWithTargets: number;
  totalStudents: number;
  coveragePercentage: number;
}

export interface TargetAdoptionOverview {
  coveragePercentage: number;
  studentsWithTargets: number;
  totalStudents: number;
  weeklyChangePercentage: number;
  halaqaCoverage: HalaqaCoverage;
  teacherCoverage: TeacherCoverage;
  activationRate: number;
  halaqaBreakdown?: HalaqaBreakdownItem[];
}




