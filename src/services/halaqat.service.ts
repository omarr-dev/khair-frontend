import { api } from './api-client';
import { Halaqa, HalaqaHierarchy, CreateHalaqaDto, UpdateHalaqaDto, StudentInHalaqaWithTeacher } from '@/types/halaqa';
import { Lookup, PaginatedResponse } from '@/types/api';

export interface HierarchyParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const halaqatApi = {
  getAll: () =>
    api.get<Halaqa[]>('/halaqat'),

  // Minimal id/name list for dropdowns
  getLookup: () =>
    api.get<Lookup[]>('/halaqat/lookup'),

  // Active students of one halaqa, loaded on demand by the hierarchy view
  getStudents: (id: number) =>
    api.get<StudentInHalaqaWithTeacher[]>(`/halaqat/${id}/students`),

  getById: (id: number) =>
    api.get<Halaqa>(`/halaqat/${id}`),
    
  // Get paginated hierarchical view with nested teachers (supervisor only)
  getHierarchy: (params?: HierarchyParams) =>
    api.get<PaginatedResponse<HalaqaHierarchy>>('/halaqat/hierarchy', { params }),
    
  create: (data: CreateHalaqaDto) => 
    api.post<Halaqa>('/halaqat', data),
    
  update: (id: number, data: UpdateHalaqaDto) => 
    api.put(`/halaqat/${id}`, data),
    
  delete: (id: number) => 
    api.delete(`/halaqat/${id}`),
};




