// Teacher Attendance Types
export interface TeacherWithAttendance {
  teacherId: number;
  teacherName: string;
  phoneNumber?: string;
  attendanceId?: number;
  status?: 0 | 1 | 2; // 0: Present, 1: Absent, 2: Late
  notes?: string;
}

export interface HalaqaTeachersAttendance {
  halaqaId: number;
  halaqaName: string;
  location?: string;
  timeSlot?: string;
  isActiveToday: boolean;
  teachers: TeacherWithAttendance[];
}

export interface TodayTeacherAttendanceResponse {
  date: string;
  dayName: string;
  totalTeachers: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
  halaqat: HalaqaTeachersAttendance[];
}

export interface TeacherAttendanceEntry {
  teacherId: number;
  halaqaId: number;
  status: 0 | 1 | 2;
  notes?: string;
}

export interface BulkTeacherAttendance {
  attendance: TeacherAttendanceEntry[];
}

export interface TeacherAttendanceRecord {
  id: number;
  teacherId: number;
  teacherName: string;
  halaqaId: number;
  halaqaName: string;
  date: string;
  status: string;
  notes?: string;
  createdAt: string;
}

// Monthly Teacher Attendance Types (for salary calculation)
export interface TeacherMonthlySummary {
  teacherId: number;
  teacherName: string;
  phoneNumber?: string;
  expectedDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
}

export interface MonthlyAttendanceReport {
  year: number;
  month: number;
  monthName: string;
  totalTeachers: number;
  totalExpectedDays: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  teachers: TeacherMonthlySummary[];
}



