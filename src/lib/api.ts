import axios from 'axios';
import { Student, CreateStudentDto, UpdateStudentDto, AssignStudentDto } from '@/types/student';
import { ProgressRecord, CreateProgressRecord, DailyProgressSummary, StudentProgressSummary, Halaqa } from '@/types/progress';
import { AttendanceRecord, CreateAttendance, BulkAttendance, AttendanceSummary, StudentAttendanceSummary } from '@/types/attendance';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    
    // Only redirect to login if it's NOT a login request and we get a 401
    if (error.response?.status === 401 && !error.config._retry && !isLoginRequest) {
      error.config._retry = true;
      
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
    
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    role: 'Teacher' | 'Supervisor';
    qualification?: string;
  }) => api.post('/auth/register', data),
  
  getCurrentUser: () => api.get('/auth/me'),
  
  logout: () => api.post('/auth/logout'),
};

// Type definitions
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  teacherId?: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

// Student APIs
export const studentApi = {
  getAll: (search?: string) => 
    api.get<Student[]>('/students', { params: { search } }),
    
  getById: (id: number) => 
    api.get<Student>(`/students/${id}`),
    
  getByHalaqa: (halaqaId: number) => 
    api.get<Student[]>(`/students/halaqa/${halaqaId}`),
    
  create: (data: CreateStudentDto) => 
    api.post<Student>('/students', data),
    
  update: (id: number, data: UpdateStudentDto) => 
    api.put<Student>(`/students/${id}`, data),
    
  delete: (id: number) => 
    api.delete(`/students/${id}`),
    
  assign: (data: AssignStudentDto) => 
    api.post('/students/assign', data),
};

// Progress APIs
export const progressApi = {
  create: (data: CreateProgressRecord) => 
    api.post<ProgressRecord>('/progress', data),
    
  getDailyProgress: (date: string) => 
    api.get<DailyProgressSummary>(`/progress/daily/${date}`),
    
  getTodayProgress: () => 
    api.get<DailyProgressSummary>('/progress/today'),
    
  getStudentProgress: (studentId: number, fromDate?: string) => 
    api.get<ProgressRecord[]>(`/progress/student/${studentId}`, { params: { fromDate } }),
    
  getStudentSummary: (studentId: number) => 
    api.get<StudentProgressSummary>(`/progress/student/${studentId}/summary`),
    
  delete: (id: number) => 
    api.delete(`/progress/${id}`),
};

// Halaqat APIs
export const halaqatApi = {
  getAll: () => 
    api.get<Halaqa[]>('/halaqat'),
    
  getById: (id: number) => 
    api.get<Halaqa>(`/halaqat/${id}`),
};

// Attendance APIs
export const attendanceApi = {
  create: (data: CreateAttendance) => 
    api.post<AttendanceRecord>('/attendance', data),
    
  createBulk: (data: BulkAttendance) => 
    api.post('/attendance/bulk', data),
    
  getByDate: (halaqaId: number, date: string) => 
    api.get<AttendanceSummary>(`/attendance/halaqa/${halaqaId}/date/${date}`),
    
  getStudentAttendance: (studentId: number, fromDate?: string, toDate?: string) => 
    api.get<AttendanceRecord[]>(`/attendance/student/${studentId}`, { 
      params: { fromDate, toDate } 
    }),
    
  getStudentSummary: (studentId: number, fromDate: string, toDate: string) => 
    api.get<StudentAttendanceSummary>(`/attendance/student/${studentId}/summary`, { 
      params: { fromDate, toDate } 
    }),
    
  update: (id: number, status: 0 | 1 | 2, notes?: string) => 
    api.put(`/attendance/${id}`, { status, notes }),
    
  delete: (id: number) => 
    api.delete(`/attendance/${id}`),
};

// Teachers APIs
export const teachersApi = {
  getAll: () => 
    api.get('/teachers'),
    
  getById: (id: number) => 
    api.get(`/teachers/${id}`),
    
  create: (data: { email: string; password: string; fullName: string; phoneNumber?: string; qualification?: string }) => 
    api.post('/teachers', data),
    
  update: (id: number, data: { fullName: string; phoneNumber?: string; qualification?: string }) => 
    api.put(`/teachers/${id}`, data),
    
  delete: (id: number) => 
    api.delete(`/teachers/${id}`),
};
