import { api } from './api-client';
import { AuthResponse, User } from '@/types/auth';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
    
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    role: 'Teacher' | 'Supervisor';
    qualification?: string;
  }) => api.post<AuthResponse>('/auth/register', data),
  
  getCurrentUser: () => api.get<User>('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
};

