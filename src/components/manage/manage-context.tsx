"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { halaqatApi, statisticsApi } from "@/services";
import { HalaqaHierarchy, StudentInHalaqaWithTeacher } from "@/types/halaqa";
import { Lookup } from "@/types/api";
import { useDebounce } from "@/hooks";
import { toast } from "sonner";

interface ManageContextType {
  // Hierarchy data for structure view (paginated)
  halaqatHierarchy: HalaqaHierarchy[];
  halaqat: Lookup[];
  loading: boolean;

  // Pagination for the hierarchy list
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  totalCount: number;
  totalPages: number;

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
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");
  const debouncedSearch = useDebounce(globalSearch, 300);

  // Pagination
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Aggregate stats (sourced from dashboard stats, not the paginated array)
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [assignedTeachers, setAssignedTeachers] = useState(0);
  const [totalHalaqat, setTotalHalaqat] = useState(0);
  const [activeHalaqat, setActiveHalaqat] = useState(0);

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

  const refreshHalaqat = useCallback(async () => {
    try {
      const response = await halaqatApi.getLookup();
      setHalaqat(response.data);
    } catch (error) {
      console.error("Error fetching halaqat:", error);
    }
  }, []);

  // Aggregate stats for the header cards (kept accurate across all halaqat)
  const refreshStats = useCallback(async () => {
    try {
      const { data } = await statisticsApi.getDashboardStats();
      setTotalStudents(data.totalStudents);
      setTotalTeachers(data.totalTeachers);
      setAssignedTeachers(data.assignedTeachers);
      setTotalHalaqat(data.totalHalaqat);
      setActiveHalaqat(data.activeHalaqat);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, []);

  // Refreshes the current hierarchy page plus the header stats. Called both by
  // the page/search effect and by the mutation handlers in structure-view.
  const refreshHierarchy = useCallback(async () => {
    try {
      const [response] = await Promise.all([
        halaqatApi.getHierarchy({
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch || undefined,
        }),
        refreshStats(),
      ]);
      setHalaqatHierarchy(response.data.items);
      setTotalCount(response.data.totalCount);
      setTotalPages(response.data.totalPages);
      // Drop cached students; expanded sections re-fetch on demand
      setHalaqaStudents(new Map());
    } catch (error) {
      console.error("Error fetching halaqat hierarchy:", error);
      toast.error("حدث خطأ أثناء تحميل الحلقات");
    }
  }, [page, debouncedSearch, refreshStats]);

  // Reset to the first page whenever the search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Re-fetch the hierarchy page on page/search change
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      await refreshHierarchy();
      if (!cancelled) setLoading(false);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [refreshHierarchy]);

  // One-time load of the lookup list (for dropdowns)
  useEffect(() => {
    refreshHalaqat();
  }, [refreshHalaqat]);

  return (
    <ManageContext.Provider
      value={{
        halaqatHierarchy,
        halaqat,
        loading,
        page,
        setPage,
        pageSize: PAGE_SIZE,
        totalCount,
        totalPages,
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
