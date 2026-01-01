import { api } from './api-client';
import { 
  ProgressRecord, 
  CreateProgressRecord, 
  DailyProgressSummary, 
  StudentProgressSummary 
} from '@/types/progress';

export const progressApi = {
  create: (data: CreateProgressRecord) => 
    api.post<ProgressRecord>('/progress', data),
    
  getDailyProgress: (date: string) => 
    api.get<DailyProgressSummary>(`/progress/daily/${date}`),
    
  getTodayProgress: () => 
    api.get<DailyProgressSummary>('/progress/today'),
    
  getStudentProgress: (studentId: number, fromDate?: string) => 
    api.get<ProgressRecord[]>(`/progress/student/${studentId}`, { params: { fromDate } }),
    
  getStudentSummary: (studentId: number) => 
    api.get<StudentProgressSummary>(`/progress/student/${studentId}/summary`),
    
  delete: (id: number) => 
    api.delete(`/progress/${id}`),
};



