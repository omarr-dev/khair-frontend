import { api } from './api-client';
import { Halaqa, HalaqaHierarchy, CreateHalaqaDto, UpdateHalaqaDto } from '@/types/halaqa';

export const halaqatApi = {
  getAll: () => 
    api.get<Halaqa[]>('/halaqat'),
    
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


