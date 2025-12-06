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
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  qualification?: string;
}

export interface UpdateTeacherDto {
  fullName: string;
  phoneNumber?: string;
  qualification?: string;
}
