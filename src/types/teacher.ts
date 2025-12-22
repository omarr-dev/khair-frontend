export interface Teacher {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  qualification?: string;
  joinDate: string;
  halaqatCount: number;
  studentsCount: number;
}

export interface CreateTeacherDto {
  phoneNumber: string;
  fullName: string;
  qualification?: string;
}

export interface UpdateTeacherDto {
  fullName: string;
  phoneNumber?: string;
  qualification?: string;
}

export interface TeacherHalaqa {
  halaqaId: number;
  halaqaName: string;
  assignedDate: string;
  isPrimary: boolean;
}
