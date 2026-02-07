import { api } from './api-client';

export const exportApi = {
  exportStudents: (halaqaId?: number, teacherId?: number) => {
    const params = new URLSearchParams();
    if (halaqaId) params.append('halaqaId', halaqaId.toString());
    if (teacherId) params.append('teacherId', teacherId.toString());
    return api.get('/export/students', { 
      params,
      responseType: 'blob' 
    });
  },
  
  exportTeachers: (halaqaId?: number) => {
    const params = new URLSearchParams();
    if (halaqaId) params.append('halaqaId', halaqaId.toString());
    return api.get('/export/teachers', { 
      params,
      responseType: 'blob' 
    });
  },
  
  exportAttendance: (fromDate: string, toDate: string, halaqaId?: number, teacherId?: number) => {
    const params = new URLSearchParams();
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
    if (halaqaId) params.append('halaqaId', halaqaId.toString());
    if (teacherId) params.append('teacherId', teacherId.toString());
    return api.get('/export/attendance', {
      params,
      responseType: 'blob'
    });
  },
  
  exportHalaqaPerformance: (fromDate: string, toDate: string, halaqaId?: number) => {
    const params = new URLSearchParams();
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
    if (halaqaId) params.append('halaqaId', halaqaId.toString());
    return api.get('/export/halaqa-performance', { 
      params,
      responseType: 'blob' 
    });
  },
  
  exportTeacherPerformance: (fromDate: string, toDate: string, halaqaId?: number, teacherId?: number) => {
    const params = new URLSearchParams();
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
    if (halaqaId) params.append('halaqaId', halaqaId.toString());
    if (teacherId) params.append('teacherId', teacherId.toString());
    return api.get('/export/teacher-performance', {
      params,
      responseType: 'blob'
    });
  },

  exportTeacherAttendance: (fromDate: string, toDate: string, halaqaId?: number, teacherId?: number) => {
    const params = new URLSearchParams();
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
    if (halaqaId) params.append('halaqaId', halaqaId.toString());
    if (teacherId) params.append('teacherId', teacherId.toString());
    return api.get('/export/teacher-attendance', {
      params,
      responseType: 'blob'
    });
  },
};




