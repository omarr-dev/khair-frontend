export interface AttendanceRecord {
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

export interface CreateAttendance {
  studentId: number;
  halaqaId: number;
  date: string;
  status: 0 | 1 | 2; // 0: Present, 1: Absent, 2: Late
  notes?: string;
}

export interface BulkAttendance {
  halaqaId: number;
  date: string;
  attendance: StudentAttendance[];
}

export interface StudentAttendance {
  studentId: number;
  status: 0 | 1 | 2; // 0: Present, 1: Absent, 2: Late
  notes?: string;
}

export interface AttendanceSummary {
  date: string;
  halaqaId: number;
  halaqaName: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
  records: AttendanceRecord[];
}

export interface StudentAttendanceSummary {
  studentId: number;
  studentName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
}
