"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/services';
import { User, AuthResponse } from '@/types/auth';
import { extractErrorMessage } from '@/lib/error-handler';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneNumber: string) => Promise<void>;
  studentLogin: (nationalId: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          console.error('Failed to get current user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const applySession = (data: AuthResponse) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUser(data.user);
    router.push('/');
  };

  const login = async (phoneNumber: string) => {
    try {
      const response = await authApi.login(phoneNumber);
      applySession(response.data);
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'فشل تسجيل الدخول'));
    }
  };

  const studentLogin = async (nationalId: string) => {
    try {
      const response = await authApi.studentLogin(nationalId);
      applySession(response.data);
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'فشل تسجيل الدخول'));
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        studentLogin,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}




