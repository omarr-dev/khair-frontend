import { api } from './api-client';
import { 
  AttendanceRecord, 
  CreateAttendance, 
  BulkAttendance, 
  AttendanceSummary, 
  StudentAttendanceSummary 
} from '@/types/attendance';

export const attendanceApi = {
  create: (data: CreateAttendance) => 
    api.post<AttendanceRecord>('/attendance', data),
    
  createBulk: (data: BulkAttendance) => 
    api.post('/attendance/bulk', data),
    
  getByDate: (halaqaId: number, date: string) => 
    api.get<AttendanceSummary>(`/attendance/halaqa/${halaqaId}/date/${date}`),
    
  getStudentAttendance: (studentId: number, fromDate?: string, toDate?: string) => 
    api.get<AttendanceRecord[]>(`/attendance/student/${studentId}`, { 
      params: { fromDate, toDate } 
    }),
    
  getStudentSummary: (studentId: number, fromDate: string, toDate: string) => 
    api.get<StudentAttendanceSummary>(`/attendance/student/${studentId}/summary`, { 
      params: { fromDate, toDate } 
    }),
    
  update: (id: number, status: 0 | 1 | 2, notes?: string) => 
    api.put(`/attendance/${id}`, { status, notes }),
    
  delete: (id: number) => 
    api.delete(`/attendance/${id}`),
};


