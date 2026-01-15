import { api } from './api-client';
import { AuthResponse, User } from '@/types/auth';

export const authApi = {
  login: (phoneNumber: string) =>
    api.post<AuthResponse>('/auth/login', { phoneNumber }),

  register: (data: {
    phoneNumber: string;
    fullName: string;
    role: 'Teacher' | 'Supervisor';
    qualification?: string;
  }) => api.post<AuthResponse>('/auth/register', data),

  getCurrentUser: () => api.get<User>('/auth/me'),

  logout: () => api.post('/auth/logout'),
};




