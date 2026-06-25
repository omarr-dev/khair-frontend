// Teacher Attendance Types
export interface TeacherWithAttendance {
  teacherId: number;
  teacherName: string;
  phoneNumber?: string;
  attendanceId?: number;
  status?: 0 | 1 | 2; // 0: Present, 1: Absent, 2: Late
  checkInTime?: string | null;  // "HH:mm:ss" وقت الحضور
  checkOutTime?: string | null; // "HH:mm:ss" وقت الانصراف
  workedHours?: number | null;  // ساعات العمل
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
  checkInTime?: string | null;  // "HH:mm" وقت الحضور
  checkOutTime?: string | null; // "HH:mm" وقت الانصراف
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
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workedHours?: number | null;
  notes?: string;
  createdAt: string;
}

// Teacher self check-in — one entry per halaqa active today
export interface TeacherSelfHalaqaAttendance {
  halaqaId: number;
  halaqaName: string;
  timeSlot?: string | null;
  status?: 0 | 1 | 2 | null; // 0: Present, 1: Absent, 2: Late; null = not recorded
  checkedIn: boolean;
  checkedOut: boolean;
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

export interface TeacherSelfAttendanceStatus {
  date: string;
  dayName: string;
  checkedIn: boolean;  // true when every halaqa active today is checked in
  checkedOut: boolean; // true when every halaqa active today is checked out
  hasActiveHalaqaToday: boolean;
  halaqatCount: number;
  halaqat: TeacherSelfHalaqaAttendance[];
}

export interface TeacherSelfCheckInResult {
  checkedIn: boolean;
  recordsCreated: number;
  message: string;
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
  totalHours: number;
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
  totalHours: number;
  teachers: TeacherMonthlySummary[];
}




