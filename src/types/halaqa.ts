export interface Halaqa {
  id: number;
  name: string;
  location?: string;
  timeSlot?: string;
  activeDays?: string; // "0,1,3,4" = Sun,Mon,Wed,Thu
  isActive: boolean;
  studentCount: number;
  teacherCount: number;
  createdAt: string;
}

export interface CreateHalaqaDto {
  name: string;
  location?: string;
  timeSlot?: string;
  activeDays?: string; // "0,1,3,4" = Sun,Mon,Wed,Thu
}

export interface UpdateHalaqaDto {
  name: string;
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
  location?: string;
  timeSlot?: string;
  activeDays?: string;
  isActive: boolean;
  studentCount: number;
  teacherCount: number;
  teachers: TeacherInHalaqa[];
}




