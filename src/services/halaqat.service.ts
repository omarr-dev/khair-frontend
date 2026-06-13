import { api } from './api-client';
import { Halaqa, HalaqaHierarchy, CreateHalaqaDto, UpdateHalaqaDto, StudentInHalaqaWithTeacher } from '@/types/halaqa';
import { Lookup } from '@/types/api';

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
    
  // Get hierarchical view with nested teachers and students (supervisor only)
  getHierarchy: () => 
    api.get<HalaqaHierarchy[]>('/halaqat/hierarchy'),
    
  create: (data: CreateHalaqaDto) => 
    api.post<Halaqa>('/halaqat', data),
    
  update: (id: number, data: UpdateHalaqaDto) => 
    api.put(`/halaqat/${id}`, data),
    
  delete: (id: number) => 
    api.delete(`/halaqat/${id}`),
};




