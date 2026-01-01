export interface User {
  id: number;
  phoneNumber: string;
  fullName: string;
  role: string;
  teacherId?: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}



