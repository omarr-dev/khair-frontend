export type UserRole = 'Teacher' | 'Supervisor' | 'HalaqaSupervisor';

export interface User {
  id: number;
  phoneNumber: string;
  fullName: string;
  role: UserRole;
  teacherId?: number;
  /** Only populated for HalaqaSupervisor role - list of halaqa IDs they can manage */
  supervisedHalaqaIds?: number[];
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

// Role utility functions
export const roleUtils = {
  /** Check if user is a full Supervisor (association-wide access) */
  isSupervisor: (role?: string) => role === 'Supervisor',
  
  /** Check if user is a HalaqaSupervisor (limited to assigned halaqas) */
  isHalaqaSupervisor: (role?: string) => role === 'HalaqaSupervisor',
  
  /** Check if user is a Teacher */
  isTeacher: (role?: string) => role === 'Teacher',
  
  /** Check if user has any supervisor role (Supervisor or HalaqaSupervisor) */
  hasAnySupervisorRole: (role?: string) => role === 'Supervisor' || role === 'HalaqaSupervisor',
  
  /** Check if user can manage students/teachers (Supervisors and HalaqaSupervisors) */
  canManage: (role?: string) => role === 'Supervisor' || role === 'HalaqaSupervisor',
  
  /** Check if user can create new halaqas (only full Supervisors) */
  canCreateHalaqa: (role?: string) => role === 'Supervisor',
  
  /** Check if user can access a specific halaqa */
  canAccessHalaqa: (user?: User, halaqaId?: number) => {
    if (!user || !halaqaId) return false;
    if (user.role === 'Supervisor') return true;
    if (user.role === 'HalaqaSupervisor') {
      return user.supervisedHalaqaIds?.includes(halaqaId) ?? false;
    }
    return false; // Teachers don't have halaqa supervisor access
  },
  
  /** Get role display name in Arabic */
  getRoleDisplayName: (role?: string) => {
    switch (role) {
      case 'Supervisor': return 'مشرف';
      case 'HalaqaSupervisor': return 'مشرف حلقة';
      case 'Teacher': return 'معلم';
      default: return role ?? '';
    }
  }
};





