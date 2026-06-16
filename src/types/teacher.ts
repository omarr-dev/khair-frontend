export interface Teacher {
  id: number;
  userId: number;
  fullName: string;
  email?: string;
  idNumber?: string;
  phoneNumber?: string;
  qualification?: string;
  nationality?: string; // الجنسية
  jobTitle?: string; // المسمى الوظيفي
  contractType?: string; // نوع العقد
  payrollGroup?: string; // المسير
  joinDate: string;
  halaqatCount: number;
  studentsCount: number;
}

export interface CreateTeacherDto {
  phoneNumber: string;
  fullName: string;
  email?: string;
  idNumber?: string;
  qualification?: string;
  nationality?: string;
  jobTitle?: string;
  contractType?: string;
  payrollGroup?: string;
}

export interface UpdateTeacherDto {
  fullName: string;
  phoneNumber?: string;
  email?: string;
  idNumber?: string;
  qualification?: string;
  nationality?: string;
  jobTitle?: string;
  contractType?: string;
  payrollGroup?: string;
}

export interface TeacherHalaqa {
  halaqaId: number;
  halaqaName: string;
  assignedDate: string;
  isPrimary: boolean;
}
