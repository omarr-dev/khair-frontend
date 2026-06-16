"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { halaqatApi, statisticsApi } from "@/services";
import { HalaqaHierarchy, StudentInHalaqaWithTeacher } from "@/types/halaqa";
import { Lookup } from "@/types/api";
import { toast } from "sonner";

interface ManageContextType {
  // Hierarchy data for structure view
  halaqatHierarchy: HalaqaHierarchy[];
  halaqat: Lookup[];
  loading: boolean;

  // Students per halaqa, fetched on demand when a halaqa is expanded
  halaqaStudents: Map<number, StudentInHalaqaWithTeacher[]>;
  loadHalaqaStudents: (halaqaId: number) => Promise<void>;

  // Global search
  globalSearch: string;
  setGlobalSearch: (search: string) => void;

  // Stats
  totalStudents: number;
  assignedTeachers: number; // distinct teachers that have at least one halaqa
  totalTeachers: number; // all teachers in the association
  totalHalaqat: number;
  activeHalaqat: number;

  // Refresh functions
  refreshHierarchy: () => Promise<void>;
  refreshHalaqat: () => Promise<void>;
}

const ManageContext = createContext<ManageContextType | null>(null);

export function ManageProvider({ children }: { children: ReactNode }) {
  const [halaqatHierarchy, setHalaqatHierarchy] = useState<HalaqaHierarchy[]>([]);
  const [halaqat, setHalaqat] = useState<Lookup[]>([]);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");

  const [halaqaStudents, setHalaqaStudents] = useState<Map<number, StudentInHalaqaWithTeacher[]>>(
    new Map()
  );
  const inFlightStudents = useRef<Set<number>>(new Set());

  const loadHalaqaStudents = useCallback(async (halaqaId: number) => {
    if (inFlightStudents.current.has(halaqaId)) return;
    inFlightStudents.current.add(halaqaId);
    try {
      const response = await halaqatApi.getStudents(halaqaId);
      setHalaqaStudents((prev) => {
        const next = new Map(prev);
        next.set(halaqaId, response.data);
        return next;
      });
    } catch (error) {
      console.error("Error fetching halaqa students:", error);
      toast.error("حدث خطأ أثناء تحميل الطلاب");
    } finally {
      inFlightStudents.current.delete(halaqaId);
    }
  }, []);

  const refreshHierarchy = useCallback(async () => {
    try {
      const response = await halaqatApi.getHierarchy();
      setHalaqatHierarchy(response.data);
      // Drop cached students; expanded sections re-fetch on demand
      setHalaqaStudents(new Map());
    } catch (error) {
      console.error("Error fetching halaqat hierarchy:", error);
      toast.error("حدث خطأ أثناء تحميل الحلقات");
    }
  }, []);

  const refreshHalaqat = useCallback(async () => {
    try {
      const response = await halaqatApi.getLookup();
      setHalaqat(response.data);
    } catch (error) {
      console.error("Error fetching halaqat:", error);
    }
  }, []);

  // Total teachers in the association (includes teachers with no halaqa yet)
  const refreshTotalTeachers = useCallback(async () => {
    try {
      const response = await statisticsApi.getDashboardStats();
      setTotalTeachers(response.data.totalTeachers);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([refreshHierarchy(), refreshHalaqat(), refreshTotalTeachers()]);
      setLoading(false);
    };
    fetchData();
  }, [refreshHierarchy, refreshHalaqat, refreshTotalTeachers]);

  // Calculate stats from hierarchy
  const totalStudents = halaqatHierarchy.reduce((sum, h) => sum + h.studentCount, 0);
  // Distinct teachers that have a halaqa (a teacher in 2 halaqat is counted once)
  const assignedTeachers = new Set(
    halaqatHierarchy.flatMap((h) => h.teachers.map((t) => t.id))
  ).size;
  const totalHalaqat = halaqatHierarchy.length;
  const activeHalaqat = halaqatHierarchy.filter((h) => h.isActive).length;

  return (
    <ManageContext.Provider
      value={{
        halaqatHierarchy,
        halaqat,
        loading,
        halaqaStudents,
        loadHalaqaStudents,
        globalSearch,
        setGlobalSearch,
        totalStudents,
        assignedTeachers,
        totalTeachers,
        totalHalaqat,
        activeHalaqat,
        refreshHierarchy,
        refreshHalaqat,
      }}
    >
      {children}
    </ManageContext.Provider>
  );
}

export function useManage() {
  const context = useContext(ManageContext);
  if (!context) {
    throw new Error("useManage must be used within ManageProvider");
  }
  return context;
}
