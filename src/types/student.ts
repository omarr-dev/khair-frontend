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
