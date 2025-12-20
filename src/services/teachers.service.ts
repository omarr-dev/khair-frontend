import { api } from './api-client';
import { Teacher } from '@/types/teacher';
import { PaginatedResponse, TeacherFilterParams } from '@/types/api';

export const teachersApi = {
  getAll: () => 
    api.get<Teacher[]>('/teachers'),
  
  // Paginated endpoint for supervisor
  getPaginated: (params: TeacherFilterParams) => 
    api.get<PaginatedResponse<Teacher>>('/teachers/paginated', { params }),
    
  getById: (id: number) => 
    api.get<Teacher>(`/teachers/${id}`),
    
  getByHalaqa: (halaqaId: number) => 
    api.get<Teacher[]>(`/teachers/halaqa/${halaqaId}`),
    
  create: (data: { email: string; password: string; fullName: string; phoneNumber?: string; qualification?: string }) => 
    api.post<Teacher>('/teachers', data),
    
  update: (id: number, data: { fullName: string; phoneNumber?: string; qualification?: string }) => 
    api.put<Teacher>(`/teachers/${id}`, data),
    
  delete: (id: number) => 
    api.delete(`/teachers/${id}`),
    
  assignToHalaqa: (teacherId: number, halaqaId: number, isPrimary?: boolean) => 
    api.post(`/teachers/${teacherId}/assign-halaqa/${halaqaId}`, null, { params: { isPrimary } }),
    
  getHalaqat: (teacherId: number) => 
    api.get(`/teachers/${teacherId}/halaqat`),
    
  removeFromHalaqa: (teacherId: number, halaqaId: number) => 
    api.delete(`/teachers/${teacherId}/halaqat/${halaqaId}`),
};


