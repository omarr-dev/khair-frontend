import { api } from './api-client';
import {
  TodayTeacherAttendanceResponse,
  BulkTeacherAttendance,
  TeacherAttendanceRecord,
  MonthlyAttendanceReport,
  TeacherSelfAttendanceStatus,
  TeacherSelfCheckInResult,
} from '@/types/teacher-attendance';

export const teacherAttendanceApi = {
  getToday: () =>
    api.get<TodayTeacherAttendanceResponse>('/teacherattendance/today'),

  // Teacher self check-in
  getMyStatus: () =>
    api.get<TeacherSelfAttendanceStatus>('/my-attendance/today'),

  checkIn: (halaqaId: number) =>
    api.post<TeacherSelfCheckInResult>(`/my-attendance/check-in/${halaqaId}`),

  // Teacher self check-out (departure) for a single halaqa
  checkOut: (halaqaId: number) =>
    api.post<TeacherSelfCheckInResult>(`/my-attendance/check-out/${halaqaId}`),

  saveBulk: (data: BulkTeacherAttendance) =>
    api.post('/teacherattendance/bulk', data),

  update: (
    id: number,
    status: 0 | 1 | 2,
    notes?: string,
    checkInTime?: string | null,
    checkOutTime?: string | null,
  ) =>
    api.put(`/teacherattendance/${id}`, { status, notes, checkInTime, checkOutTime }),
    
  delete: (id: number) => 
    api.delete(`/teacherattendance/${id}`),
    
  getTeacherHistory: (teacherId: number, fromDate?: string, toDate?: string) => 
    api.get<TeacherAttendanceRecord[]>(`/teacherattendance/teacher/${teacherId}`, { 
      params: { fromDate, toDate } 
    }),
    
  getMonthlyReport: (year: number, month: number) => 
    api.get<MonthlyAttendanceReport>('/teacherattendance/monthly-report', { 
      params: { year, month } 
    }),
};




