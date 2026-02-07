import { api } from './api-client';
import {
  DashboardStats,
  ReportStats,
  SupervisorDashboard,
  HalaqaRanking,
  TeacherRanking,
  AtRiskStudent,
  SystemWideStats,
  DailyAchievementStats,
  StreakLeaderboard,
  TargetAdoptionOverview,
} from '@/types/statistics';

export interface ReportStatsParams {
  dateRange: string;
  halaqaId?: number;
  fromDate?: string; // ISO date string (YYYY-MM-DD)
  toDate?: string;   // ISO date string (YYYY-MM-DD)
}

export interface DailyAchievementParams {
  halaqaId?: number;
  teacherId?: number;
  fromDate?: string; // ISO date string (YYYY-MM-DD)
  toDate?: string;   // ISO date string (YYYY-MM-DD)
}

export interface StreakLeaderboardParams {
  halaqaId?: number;
  teacherId?: number;
  limit?: number;
}

export interface TargetAdoptionParams {
  halaqaId?: number;
  teacherId?: number;
  includeBreakdown?: boolean;
}

export const statisticsApi = {
  getDashboardStats: () =>
    api.get<DashboardStats>('/statistics/dashboard'),

  getReportStats: (params: ReportStatsParams) =>
    api.get<ReportStats>('/statistics/reports', {
      params: {
        dateRange: params.dateRange,
        halaqaId: params.halaqaId || undefined,
        fromDate: params.fromDate || undefined,
        toDate: params.toDate || undefined,
      }
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

  // Daily Achievement Statistics (إنجاز اليوم)
  getDailyAchievement: (params?: DailyAchievementParams) =>
    api.get<DailyAchievementStats>('/statistics/daily-achievement', {
      params: {
        halaqaId: params?.halaqaId || undefined,
        teacherId: params?.teacherId || undefined,
        fromDate: params?.fromDate || undefined,
        toDate: params?.toDate || undefined,
      }
    }),

  // Streak Leaderboard (أطول سلاسل الإنجاز)
  getStreakLeaderboard: (params?: StreakLeaderboardParams) =>
    api.get<StreakLeaderboard>('/statistics/streak-leaderboard', {
      params: {
        halaqaId: params?.halaqaId || undefined,
        teacherId: params?.teacherId || undefined,
        limit: params?.limit || undefined,
      }
    }),

  // Target Adoption Overview (تغطية نظام الأهداف)
  getTargetAdoptionOverview: (params?: TargetAdoptionParams) =>
    api.get<TargetAdoptionOverview>('/statistics/target-adoption-overview', {
      params: {
        halaqaId: params?.halaqaId || undefined,
        teacherId: params?.teacherId || undefined,
        includeBreakdown: params?.includeBreakdown || undefined,
      }
    }),
};




