"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { halaqatApi } from "@/services";
import { HalaqaHierarchy } from "@/types/halaqa";
import { Lookup } from "@/types/api";
import { toast } from "sonner";

interface ManageContextType {
  // Hierarchy data for structure view
  halaqatHierarchy: HalaqaHierarchy[];
  halaqat: Lookup[];
  loading: boolean;

  // Global search
  globalSearch: string;
  setGlobalSearch: (search: string) => void;

  // Stats
  totalStudents: number;
  totalTeachers: number;
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

  const refreshHierarchy = useCallback(async () => {
    try {
      const response = await halaqatApi.getHierarchy();
      setHalaqatHierarchy(response.data);
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([refreshHierarchy(), refreshHalaqat()]);
      setLoading(false);
    };
    fetchData();
  }, [refreshHierarchy, refreshHalaqat]);

  // Calculate stats from hierarchy
  const totalStudents = halaqatHierarchy.reduce((sum, h) => sum + h.studentCount, 0);
  const totalTeachers = halaqatHierarchy.reduce((sum, h) => sum + h.teacherCount, 0);
  const totalHalaqat = halaqatHierarchy.length;
  const activeHalaqat = halaqatHierarchy.filter((h) => h.isActive).length;

  return (
    <ManageContext.Provider
      value={{
        halaqatHierarchy,
        halaqat,
        loading,
        globalSearch,
        setGlobalSearch,
        totalStudents,
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
