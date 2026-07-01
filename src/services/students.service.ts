import { api } from './api-client';
import { 
  Student, 
  CreateStudentDto, 
  UpdateStudentDto, 
  AssignStudentDto, 
  StudentAssignment,
  UpdateAssignmentDto,
  UpdateMemorizationDto,
  StudentDetail,
  StudentTarget,
  SetStudentTargetDto,
  BulkSetTargetDto,
  AchievementHistory,
  StudentProgressRecord,
  StudentAttendanceRecord,
  MyRank
} from '@/types/student';
import { PaginatedResponse, StudentFilterParams } from '@/types/api';

export const studentApi = {
  getAll: (search?: string) => 
    api.get<Student[]>('/students', { params: { search } }),
  
  // Paginated endpoint for supervisor
  getPaginated: (params: StudentFilterParams) => 
    api.get<PaginatedResponse<Student>>('/students/paginated', { params }),
    
  getById: (id: number) =>
    api.get<Student>(`/students/${id}`),

  /** Look up an existing student by national ID number (returns 404 if none) */
  lookupByIdNumber: (idNumber: string) =>
    api.get<Student>('/students/lookup', { params: { idNumber } }),

  getByHalaqa: (halaqaId: number) => 
    api.get<Student[]>(`/students/halaqa/${halaqaId}`),
    
  // Get students assigned to the logged-in teacher
  getMyStudents: () => 
    api.get<Student[]>('/students/my-students'),
    
  create: (data: CreateStudentDto) => 
    api.post<Student>('/students', data),
    
  update: (id: number, data: UpdateStudentDto) => 
    api.put<Student>(`/students/${id}`, data),
    
  // Update student's memorization position
  updateMemorization: (id: number, data: UpdateMemorizationDto) => 
    api.put<Student>(`/students/${id}/memorization`, data),
    
  delete: (id: number) => 
    api.delete(`/students/${id}`),
    
  assign: (data: AssignStudentDto) => 
    api.post('/students/assign', data),
    
  getAssignments: (studentId: number) => 
    api.get<StudentAssignment[]>(`/students/${studentId}/assignments`),
    
  updateAssignment: (studentId: number, halaqaId: number, teacherId: number, data: UpdateAssignmentDto) => 
    api.put<StudentAssignment>(`/students/assign/${studentId}/${halaqaId}/${teacherId}`, data),
    
  deleteAssignment: (studentId: number, halaqaId: number, teacherId: number) => 
    api.delete(`/students/assign/${studentId}/${halaqaId}/${teacherId}`),
    
  // Get comprehensive student details for profile page
  getDetails: (id: number) => 
    api.get<StudentDetail>(`/students/${id}/details`),

  // ================== TARGETS ==================
  
  /** Get student's target */
  getTarget: (studentId: number) => 
    api.get<StudentTarget | null>(`/students/${studentId}/target`),
  
  /** Set or update student's target */
  setTarget: (studentId: number, data: SetStudentTargetDto) => 
    api.put<StudentTarget>(`/students/${studentId}/target`, data),
  
  /** Bulk set targets for multiple students (Supervisor only) */
  bulkSetTargets: (data: BulkSetTargetDto) => 
    api.post<{ count: number }>('/students/targets/bulk', data),
  
  /** Bulk set targets for teacher's own students */
  bulkSetMyStudentsTargets: (data: SetStudentTargetDto) =>
    api.post<{ count: number }>('/students/targets/bulk/my-students', data),
  
  // ================== ACHIEVEMENTS ==================
  
  /**
   * Get student's achievement history for a date range.
   * For single-day queries, use the same date for startDate and endDate.
   * Returns daily achievements, streak info, and summary statistics.
   */
  getAchievementHistory: (studentId: number, startDate: string, endDate: string) =>
    api.get<AchievementHistory>(`/students/${studentId}/achievement-history`, {
      params: { startDate, endDate }
    }),
};

// ================== STUDENT SELF-SERVICE (PORTAL) ==================
// All endpoints resolve the student from the JWT server-side — no id is ever passed.
export const studentPortalApi = {
  /** Own full profile: info, halaqa/teacher, memorization position, stats, recent records, target */
  getMyProfile: () =>
    api.get<StudentDetail>('/students/me'),

  /** Own progress (recitation) records, optionally from a date */
  getMyProgress: (fromDate?: string) =>
    api.get<StudentProgressRecord[]>('/students/me/progress', { params: { fromDate } }),

  /** Own attendance records for a date range */
  getMyAttendance: (fromDate?: string, toDate?: string) =>
    api.get<StudentAttendanceRecord[]>('/students/me/attendance', { params: { fromDate, toDate } }),

  /** Own daily target */
  getMyTarget: () =>
    api.get<StudentTarget>('/students/me/target'),

  /** Own achievement history + streak info for a date range (calendar heatmap) */
  getMyAchievementHistory: (startDate: string, endDate: string) =>
    api.get<AchievementHistory>('/students/me/achievement-history', { params: { startDate, endDate } }),

  /** Own rank within the halaqa streak leaderboard (own entry only) */
  getMyRank: () =>
    api.get<MyRank>('/students/me/rank'),
};
