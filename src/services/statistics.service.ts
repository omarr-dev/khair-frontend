import { api } from './api-client';
import {
  DashboardStats,
  ReportStats,
  SupervisorDashboard,
  HalaqaRanking,
  TeacherRanking,
  AtRiskStudent,
  SystemWideStats,
} from '@/types/statistics';

export const statisticsApi = {
  getDashboardStats: () =>
    api.get<DashboardStats>('/statistics/dashboard'),

  getReportStats: (dateRange: string, halaqaId?: number) =>
    api.get<ReportStats>('/statistics/reports', {
      params: { dateRange, halaqaId: halaqaId || undefined }
    }),

  // System-wide stats for motivation section (accessible by all)
  getSystemWideStats: () =>
    api.get<SystemWideStats>('/statistics/system-wide-stats'),

  // Top 5 halaqat (accessible by all)
  getTopHalaqat: () =>
    api.get<HalaqaRanking[]>('/statistics/top-halaqat'),

  // At-risk students for logged-in teacher (or all for supervisor)
  getMyAtRiskStudents: (limit?: number) =>
    api.get<AtRiskStudent[]>('/statistics/my-at-risk-students', {
      params: { limit }
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
};




