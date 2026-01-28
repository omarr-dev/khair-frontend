export interface StudentAssignment {
  studentId: number;
  halaqaId: number;
  halaqaName: string;
  teacherId: number;
  teacherName: string;
  enrollmentDate: string;
  isActive: boolean;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  phone?: string; // رقم هاتف الطالب
  idNumber?: string; // رقم الهوية
  // Memorization tracking
  memorizationDirection: 'Forward' | 'Backward';
  currentSurahNumber: number;
  currentSurahName?: string;
  currentVerse: number;
  juzMemorized: number;
  currentHalaqa?: string;
  teacherName?: string;
  createdAt: string;
  assignments: StudentAssignment[];
  // Streak tracking
  currentStreak: number;
  longestStreak: number;
  // Today's achievement (optional - only if target is set)
  todayAchievement?: TodayAchievement;
}

export interface TodayAchievement {
  hasTarget: boolean;
  // Targets
  memorizationLinesTarget?: number | null;
  revisionPagesTarget?: number | null;
  consolidationPagesTarget?: number | null;
  // Achieved today
  memorizationLinesAchieved: number;
  revisionPagesAchieved: number;
  consolidationPagesAchieved: number;
  // Percentages
  memorizationPercentage: number;
  revisionPercentage: number;
  consolidationPercentage: number;
}

export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  phone?: string; // رقم هاتف الطالب
  idNumber?: string; // رقم الهوية
  memorizationDirection?: 'Forward' | 'Backward';
  currentSurahNumber?: number;
  currentVerse?: number;
  halaqaId?: number;
  teacherId?: number;
}

export interface UpdateStudentDto {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  phone?: string; // رقم هاتف الطالب
  idNumber?: string; // رقم الهوية
}

export interface UpdateMemorizationDto {
  memorizationDirection: 'Forward' | 'Backward';
  currentSurahNumber: number;
  currentVerse: number;
}

export interface AssignStudentDto {
  studentId: number;
  halaqaId: number;
  teacherId: number;
}

export interface UpdateAssignmentDto {
  halaqaId: number;
  teacherId: number;
  isActive: boolean;
}

// Student statistics for profile page
export interface StudentStats {
  totalVersesMemorized: number;
  totalVersesRevised: number;
  attendanceRate: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  totalClassDays: number;
  averageQuality: number;
  averageQualityText: string;
  totalProgressRecords: number;
}

// Progress record for student profile
export interface StudentProgressRecord {
  id: number;
  studentId: number;
  studentName: string;
  teacherId?: number;
  teacherName?: string;
  halaqaId: number;
  halaqaName: string;
  date: string;
  type: string;
  surahName: string;
  fromVerse: number;
  toVerse: number;
  numberLines: number;  // عدد الأسطر
  quality: string;
  notes?: string;
  createdAt: string;
}

// Attendance record for student profile
export interface StudentAttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  halaqaId: number;
  halaqaName: string;
  date: string;
  status: string;
  notes?: string;
  createdAt: string;
}

// Comprehensive student detail for profile page
export interface StudentDetail {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  phone?: string; // رقم هاتف الطالب
  idNumber?: string; // رقم الهوية
  // Memorization tracking
  memorizationDirection: 'Forward' | 'Backward';
  currentSurahNumber: number;
  currentSurahName?: string;
  currentVerse: number;
  juzMemorized: number;
  // Halaqa info
  halaqaId?: number;
  currentHalaqa?: string;
  halaqaActiveDays?: string; // "0,1,3,4" = Sun,Mon,Wed,Thu
  teacherName?: string;
  createdAt: string;
  // Statistics
  stats: StudentStats;
  // Recent records
  recentProgress: StudentProgressRecord[];
  recentAttendance: StudentAttendanceRecord[];
}

// ================== STUDENT TARGETS ==================

/** Student's daily target configuration */
export interface StudentTarget {
  studentId: number;
  memorizationLinesTarget: number | null;   // أسطر الحفظ
  revisionPagesTarget: number | null;        // صفحات المراجعة
  consolidationPagesTarget: number | null;   // صفحات التثبيت
  updatedAt: string;
}

/** Request body for setting a student's target */
export interface SetStudentTargetDto {
  memorizationLinesTarget?: number | null;
  revisionPagesTarget?: number | null;
  consolidationPagesTarget?: number | null;
}

/** Request body for bulk setting targets */
export interface BulkSetTargetDto {
  studentIds?: number[];         // Specific students
  teacherId?: number;            // OR all students of a teacher
  halaqaId?: number;             // OR all students in a halaqa
  memorizationLinesTarget: number;
  revisionPagesTarget: number;
  consolidationPagesTarget: number;
}

/** Daily achievement compared to target */
export interface TargetAchievement {
  studentId: number;
  date: string;
  // Targets
  memorizationLinesTarget: number;
  revisionPagesTarget: number;
  consolidationPagesTarget: number;
  // Achieved
  memorizationLinesAchieved: number;
  revisionPagesAchieved: number;
  consolidationPagesAchieved: number;
  // Percentages
  memorizationPercentage: number;
  revisionPercentage: number;
  consolidationPercentage: number;
  // Whether all targets were met
  isTargetMet: boolean;
}

/** Achievement history for a date range with streak information */
export interface AchievementHistory {
  studentId: number;
  startDate: string;
  endDate: string;
  /** Daily achievements within the date range */
  dailyAchievements: TargetAchievement[];
  /** Current streak - consecutive days meeting all targets */
  currentStreak: number;
  /** Best streak achieved within the queried range */
  bestStreak: number;
  /** Last date when all targets were met */
  lastAchievedDate: string | null;
  /** Total days where all targets were met */
  totalDaysTargetMet: number;
  /** Total days with any activity */
  totalDaysActive: number;
  /** Whether student has a target set */
  hasTarget: boolean;
}
