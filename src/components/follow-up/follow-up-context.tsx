"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AttendanceStatus } from "@/components/shared/attendance-badge";
import { followUpApi } from "@/services/follow-up.service";
import { extractErrorMessage } from "@/lib/error-handler";
import { showError } from "@/lib/toast-helpers";

// Types
interface AchievementData {
  achieved: number;
  target: number;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  notRecorded: number;
}

interface Achievement {
  memorization: AchievementData;
  revision: AchievementData;
  consolidation: AchievementData;
}

export interface FollowUpStudent {
  id: number;
  fullName: string;
  attendanceStatus: AttendanceStatus;
  achievement: Achievement;
}

export interface FollowUpTeacher {
  id: number;
  fullName: string;
  attendanceStatus: AttendanceStatus;
  students: FollowUpStudent[];
  studentStats: AttendanceStats;
  achievement: Achievement;
}

export interface FollowUpHalaqa {
  id: number;
  name: string;
  teachers: FollowUpTeacher[];
  studentStats: AttendanceStats;
  teacherStats: AttendanceStats;
  achievement: Achievement;
}

interface FollowUpContextType {
  halaqat: FollowUpHalaqa[];
  totalStudentStats: AttendanceStats;
  totalTeacherStats: AttendanceStats;
  totalAchievement: Achievement;
  loading: boolean;
  error: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  // Pagination (halaqat list is one page; the Total* stats cover all halaqat)
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

const FollowUpContext = createContext<FollowUpContextType | null>(null);

export function useFollowUp() {
  const context = useContext(FollowUpContext);
  if (!context) {
    throw new Error("useFollowUp must be used within FollowUpProvider");
  }
  return context;
}

const emptyStats: AttendanceStats = { total: 0, present: 0, absent: 0, notRecorded: 0 };
const emptyAchievement: Achievement = {
  memorization: { achieved: 0, target: 0 },
  revision: { achieved: 0, target: 0 },
  consolidation: { achieved: 0, target: 0 },
};

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function FollowUpProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [halaqat, setHalaqat] = useState<FollowUpHalaqa[]>([]);
  const [totalStudentStats, setTotalStudentStats] = useState<AttendanceStats>(emptyStats);
  const [totalTeacherStats, setTotalTeacherStats] = useState<AttendanceStats>(emptyStats);
  const [totalAchievement, setTotalAchievement] = useState<Achievement>(emptyAchievement);
  const [selectedDate, setSelectedDateState] = useState<string>(getTodayString());

  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Changing the date resets back to the first page
  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
    setPage(1);
  }, []);

  const fetchFollowUpData = useCallback(async (date: string, pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await followUpApi.getFollowUpData(date, pageNum, PAGE_SIZE);
      const data = response.data;

      setHalaqat(data.halaqat as FollowUpHalaqa[]);
      setTotalStudentStats(data.totalStudentStats);
      setTotalTeacherStats(data.totalTeacherStats);
      setTotalAchievement(data.totalAchievement);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowUpData(selectedDate, page);
  }, [selectedDate, page, fetchFollowUpData]);

  return (
    <FollowUpContext.Provider
      value={{
        halaqat,
        totalStudentStats,
        totalTeacherStats,
        totalAchievement,
        loading,
        error,
        selectedDate,
        setSelectedDate,
        page,
        setPage,
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages,
      }}
    >
      {children}
    </FollowUpContext.Provider>
  );
}
