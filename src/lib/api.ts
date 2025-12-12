import axios from 'axios';
import { Student, CreateStudentDto, UpdateStudentDto, AssignStudentDto, StudentAssignment, UpdateAssignmentDto, UpdateMemorizationDto, StudentDetail } from '@/types/student';
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

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface StudentFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  halaqaId?: number;
  teacherId?: number;
  sortBy?: 'name' | 'juz' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TeacherFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  halaqaId?: number;
  sortBy?: 'name' | 'studentsCount' | 'halaqatCount' | 'joinDate';
  sortOrder?: 'asc' | 'desc';
}

// Student APIs
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
export interface CreateHalaqaDto {
  name: string;
  description?: string;
  location?: string;
  timeSlot?: string;
  activeDays?: string; // "0,1,3,4" = Sun,Mon,Wed,Thu
}

export interface UpdateHalaqaDto {
  name: string;
  description?: string;
  location?: string;
  timeSlot?: string;
  activeDays?: string; // "0,1,3,4" = Sun,Mon,Wed,Thu
  isActive: boolean;
}

// Hierarchy types for supervisor view
export interface StudentInHalaqa {
  id: number;
  fullName: string;
  memorizationDirection: string;
  currentSurahNumber: number;
  currentSurahName?: string;
  currentVerse: number;
  juzMemorized: number;
}

export interface TeacherInHalaqa {
  id: number;
  fullName: string;
  phoneNumber?: string;
  studentCount: number;
  students: StudentInHalaqa[];
}

export interface HalaqaHierarchy {
  id: number;
  name: string;
  description?: string;
  location?: string;
  timeSlot?: string;
  activeDays?: string;
  isActive: boolean;
  studentCount: number;
  teacherCount: number;
  teachers: TeacherInHalaqa[];
}

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

// Teacher Attendance Types
export interface TeacherWithAttendance {
  teacherId: number;
  teacherName: string;
  phoneNumber?: string;
  attendanceId?: number;
  status?: 0 | 1 | 2; // 0: Present, 1: Absent, 2: Late
  notes?: string;
}

export interface HalaqaTeachersAttendance {
  halaqaId: number;
  halaqaName: string;
  location?: string;
  timeSlot?: string;
  isActiveToday: boolean;
  teachers: TeacherWithAttendance[];
}

export interface TodayTeacherAttendanceResponse {
  date: string;
  dayName: string;
  totalTeachers: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
  halaqat: HalaqaTeachersAttendance[];
}

export interface TeacherAttendanceEntry {
  teacherId: number;
  halaqaId: number;
  status: 0 | 1 | 2;
  notes?: string;
}

export interface BulkTeacherAttendance {
  attendance: TeacherAttendanceEntry[];
}

export interface TeacherAttendanceRecord {
  id: number;
  teacherId: number;
  teacherName: string;
  halaqaId: number;
  halaqaName: string;
  date: string;
  status: string;
  notes?: string;
  createdAt: string;
}

// Monthly Teacher Attendance Types (for salary calculation)
export interface TeacherMonthlySummary {
  teacherId: number;
  teacherName: string;
  phoneNumber?: string;
  expectedDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
}

export interface MonthlyAttendanceReport {
  year: number;
  month: number;
  monthName: string;
  totalTeachers: number;
  totalExpectedDays: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  teachers: TeacherMonthlySummary[];
}

// Teacher Attendance APIs
export const teacherAttendanceApi = {
  getToday: () => 
    api.get<TodayTeacherAttendanceResponse>('/teacherattendance/today'),
    
  saveBulk: (data: BulkTeacherAttendance) => 
    api.post('/teacherattendance/bulk', data),
    
  update: (id: number, status: 0 | 1 | 2, notes?: string) => 
    api.put(`/teacherattendance/${id}`, { status, notes }),
    
  delete: (id: number) => 
    api.delete(`/teacherattendance/${id}`),
    
  getTeacherHistory: (teacherId: number, fromDate?: string, toDate?: string) => 
    api.get<TeacherAttendanceRecord[]>(`/teacherattendance/teacher/${teacherId}`, { 
      params: { fromDate, toDate } 
    }),
    
  getMonthlyReport: (year: number, month: number) => 
    api.get<MonthlyAttendanceReport>('/teacherattendance/monthly-report', { 
      params: { year, month } 
    }),
};

// Teachers APIs
import { Teacher } from '@/types/teacher';

export const teachersApi = {
  getAll: () => 
    api.get('/teachers'),
  
  // Paginated endpoint for supervisor
  getPaginated: (params: TeacherFilterParams) => 
    api.get<PaginatedResponse<Teacher>>('/teachers/paginated', { params }),
    
  getById: (id: number) => 
    api.get(`/teachers/${id}`),
    
  getByHalaqa: (halaqaId: number) => 
    api.get(`/teachers/halaqa/${halaqaId}`),
    
  create: (data: { email: string; password: string; fullName: string; phoneNumber?: string; qualification?: string }) => 
    api.post('/teachers', data),
    
  update: (id: number, data: { fullName: string; phoneNumber?: string; qualification?: string }) => 
    api.put(`/teachers/${id}`, data),
    
  delete: (id: number) => 
    api.delete(`/teachers/${id}`),
    
  assignToHalaqa: (teacherId: number, halaqaId: number, isPrimary?: boolean) => 
    api.post(`/teachers/${teacherId}/assign-halaqa/${halaqaId}`, null, { params: { isPrimary } }),
    
  getHalaqat: (teacherId: number) => 
    api.get(`/teachers/${teacherId}/halaqat`),
    
  removeFromHalaqa: (teacherId: number, halaqaId: number) => 
    api.delete(`/teachers/${teacherId}/halaqat/${halaqaId}`),
};

// Statistics APIs
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalHalaqat: number;
  activeHalaqat: number;
  averageAttendanceRate: number;
  todayMemorization: number;
  todayRevision: number;
  todayAttendance: number;
}

export interface ReportStats {
  totalStudents: number;
  averageAttendance: number;
  weeklyMemorization: number;
  averageQuality: number;
  progressData: { date: string; memorization: number; revision: number; rate: number }[];
  attendanceData: { date: string; memorization: number; revision: number; rate: number }[];
  topStudents: { name: string; progress: number; quality: number }[];
  qualityDistribution: { name: string; value: number; color: string }[];
}

// Supervisor Dashboard Types
export interface HalaqaRanking {
  id: number;
  name: string;
  studentCount: number;
  teacherCount: number;
  attendanceRate: number;
  weeklyProgress: number;
  score: number;
}

export interface TeacherRanking {
  id: number;
  fullName: string;
  studentCount: number;
  studentAttendanceRate: number;
  weeklyProgress: number;
  averageQuality: number;
  score: number;
}

export interface AtRiskStudent {
  id: number;
  fullName: string;
  halaqaName: string;
  teacherName: string;
  attendanceRate: number;
  daysSinceLastProgress: number;
  consecutiveAbsences: number;
}

export interface SupervisorDashboard {
  totalStudents: number;
  totalTeachers: number;
  totalHalaqat: number;
  todayAttendanceRate: number;
  todayMemorization: number;
  todayRevision: number;
  studentsAtRisk: number;
  topHalaqat: HalaqaRanking[];
  topTeachers: TeacherRanking[];
  atRiskStudents: AtRiskStudent[];
}

export interface AttendanceTrend {
  date: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

export interface ProgressTrend {
  date: string;
  memorization: number;
  revision: number;
  totalVerses: number;
}

// Export APIs
export const exportApi = {
  exportStudents: (halaqaId?: number, teacherId?: number) => {
    const params = new URLSearchParams();
    if (halaqaId) params.append('halaqaId', halaqaId.toString());
    if (teacherId) params.append('teacherId', teacherId.toString());
    return api.get('/export/students', { 
      params,
      responseType: 'blob' 
    });
  },
  
  exportTeachers: (halaqaId?: number) => {
    const params = new URLSearchParams();
    if (halaqaId) params.append('halaqaId', halaqaId.toString());
    return api.get('/export/teachers', { 
      params,
      responseType: 'blob' 
    });
  },
  
  exportAttendance: (fromDate: string, toDate: string, halaqaId?: number) => {
    const params = new URLSearchParams();
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
    if (halaqaId) params.append('halaqaId', halaqaId.toString());
    return api.get('/export/attendance', { 
      params,
      responseType: 'blob' 
    });
  },
  
  exportHalaqaPerformance: (fromDate: string, toDate: string) => {
    const params = new URLSearchParams();
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
    return api.get('/export/halaqa-performance', { 
      params,
      responseType: 'blob' 
    });
  },
  
  exportTeacherPerformance: (fromDate: string, toDate: string) => {
    const params = new URLSearchParams();
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);
    return api.get('/export/teacher-performance', { 
      params,
      responseType: 'blob' 
    });
  },
  
  exportTeacherAttendance: (year: number, month: number) => {
    return api.get('/export/teacher-attendance', { 
      params: { year, month },
      responseType: 'blob' 
    });
  },
};

export const statisticsApi = {
  getDashboardStats: () => 
    api.get<DashboardStats>('/statistics/dashboard'),
    
  getReportStats: (dateRange: string, halaqaId?: number) => 
    api.get<ReportStats>('/statistics/reports', { 
      params: { dateRange, halaqaId: halaqaId || undefined } 
    }),
  
  // Supervisor endpoints
  getSupervisorDashboard: () => 
    api.get<SupervisorDashboard>('/statistics/supervisor-dashboard'),
    
  getHalaqaRanking: (days?: number, limit?: number) => 
    api.get<HalaqaRanking[]>('/statistics/halaqa-ranking', { 
      params: { days, limit } 
    }),
    
  getTeacherRanking: (days?: number, limit?: number) => 
    api.get<TeacherRanking[]>('/statistics/teacher-ranking', { 
      params: { days, limit } 
    }),
    
  getAtRiskStudents: (limit?: number) => 
    api.get<AtRiskStudent[]>('/statistics/at-risk-students', { 
      params: { limit } 
    }),
    
  getAttendanceTrends: (days?: number) => 
    api.get<AttendanceTrend[]>('/statistics/attendance-trends', { 
      params: { days } 
    }),
    
  getProgressTrends: (days?: number) => 
    api.get<ProgressTrend[]>('/statistics/progress-trends', { 
      params: { days } 
    }),
};
