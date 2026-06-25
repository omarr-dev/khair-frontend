import { api } from './api-client';
import { AuthResponse } from '@/types/auth';
import {
  HalaqaSupervisor,
  CreateSupervisorDto,
  UpdateSupervisorDto,
} from '@/types/supervisor';

/**
 * Management of HalaqaSupervisor users (Supervisor-only).
 * Creation reuses the auth/register endpoint with a fixed HalaqaSupervisor role.
 */
export const supervisorsApi = {
  // List all HalaqaSupervisors with their assigned halaqa IDs
  getAll: () =>
    api.get<HalaqaSupervisor[]>('/halaqat/supervisors'),

  // Create a new HalaqaSupervisor user
  create: (data: CreateSupervisorDto) =>
    api.post<AuthResponse>('/auth/register', { ...data, role: 'HalaqaSupervisor' }),

  // Update a HalaqaSupervisor's name / phone
  update: (userId: number, data: UpdateSupervisorDto) =>
    api.put<HalaqaSupervisor>(`/halaqat/supervisors/${userId}`, data),

  // Deactivate (soft-delete) a HalaqaSupervisor
  deactivate: (userId: number) =>
    api.delete(`/halaqat/supervisors/${userId}`),

  // Assign a HalaqaSupervisor to a halaqa
  assignToHalaqa: (halaqaId: number, userId: number) =>
    api.post(`/halaqat/${halaqaId}/supervisors/${userId}`),

  // Remove a HalaqaSupervisor from a halaqa
  removeFromHalaqa: (halaqaId: number, userId: number) =>
    api.delete(`/halaqat/${halaqaId}/supervisors/${userId}`),
};
