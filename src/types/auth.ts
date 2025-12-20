export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string;
  teacherId?: number;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

