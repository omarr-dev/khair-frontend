// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface StudentFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  halaqaId?: number;
  teacherId?: number;
  sortBy?: 'name' | 'juz' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface TeacherFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  halaqaId?: number;
  sortBy?: 'name' | 'studentsCount' | 'halaqatCount' | 'joinDate';
  sortOrder?: 'asc' | 'desc';
}


