import { api } from './api-client';
import { AuthResponse, User } from '@/types/auth';

export const authApi = {
  login: (phoneNumber: string) =>
    api.post<AuthResponse>('/auth/login', { phoneNumber }),

  /** Student self-service login by National ID (tenant resolved from X-Tenant-Id) */
  studentLogin: (nationalId: string) =>
    api.post<AuthResponse>('/auth/student-login', { nationalId }),

  register: (data: {
    phoneNumber: string;
    fullName: string;
    role: 'Teacher' | 'Supervisor';
    qualification?: string;
  }) => api.post<AuthResponse>('/auth/register', data),

  getCurrentUser: () => api.get<User>('/auth/me'),

  logout: () => api.post('/auth/logout'),
};




