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
  TargetAchievement,
  AchievementHistoryFilter
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

  // ===== Daily Target APIs =====
  
  // Get student's daily target
  getTarget: (studentId: number) =>
    api.get<StudentTarget>(`/students/${studentId}/target`),
  
  // Set/update a student's daily target
  setTarget: (studentId: number, data: SetStudentTargetDto) =>
    api.put<StudentTarget>(`/students/${studentId}/target`, data),
  
  // Bulk set targets for multiple students (supervisor only)
  bulkSetTargets: (data: BulkSetTargetDto) =>
    api.post<{ message: string; count: number }>('/students/targets/bulk', data),
  
  // Bulk set targets for teacher's own students
  bulkSetMyStudentsTargets: (data: SetStudentTargetDto) =>
    api.post<{ message: string; count: number }>('/students/targets/bulk/my-students', data),
  
  // Get achievement history for a student
  getAchievements: (studentId: number, filter?: AchievementHistoryFilter) =>
    api.get<TargetAchievement[]>(`/students/${studentId}/achievements`, { params: filter }),
};
