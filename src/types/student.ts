export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  juzMemorized: number;
  currentHalaqa?: string;
  teacherName?: string;
  createdAt: string;
}

export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  juzMemorized: number;
  halaqaId?: number;
  teacherId?: number;
}

export interface UpdateStudentDto {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  guardianName?: string;
  guardianPhone?: string;
  juzMemorized: number;
}

export interface AssignStudentDto {
  studentId: number;
  halaqaId: number;
  teacherId: number;
}
