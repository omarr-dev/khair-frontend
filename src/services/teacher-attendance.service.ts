import { api } from './api-client';
import {
  TodayTeacherAttendanceResponse,
  BulkTeacherAttendance,
  TeacherAttendanceRecord,
  MonthlyAttendanceReport,
} from '@/types/teacher-attendance';

export const teacherAttendanceApi = {
  getToday: () => 
    api.get<TodayTeacherAttendanceResponse>('/teacherattendance/today'),
    
  saveBulk: (data: BulkTeacherAttendance) => 
    api.post('/teacherattendance/bulk', data),
    
  update: (id: number, status: 0 | 1 | 2, notes?: string) => 
    api.put(`/teacherattendance/${id}`, { status, notes }),
    
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



