export interface FollowUpAchievementData {
  achieved: number;
  target: number;
}

export interface FollowUpAchievement {
  memorization: FollowUpAchievementData;
  revision: FollowUpAchievementData;
  consolidation: FollowUpAchievementData;
}

export interface FollowUpAttendanceStats {
  total: number;
  present: number;
  absent: number;
  notRecorded: number;
}

export interface FollowUpStudent {
  id: number;
  fullName: string;
  attendanceStatus: string;
  achievement: FollowUpAchievement;
}

export interface FollowUpTeacher {
  id: number;
  fullName: string;
  attendanceStatus: string;
  students: FollowUpStudent[];
  studentStats: FollowUpAttendanceStats;
  achievement: FollowUpAchievement;
}

export interface FollowUpHalaqa {
  id: number;
  name: string;
  teachers: FollowUpTeacher[];
  studentStats: FollowUpAttendanceStats;
  teacherStats: FollowUpAttendanceStats;
  achievement: FollowUpAchievement;
}

export interface FollowUpResponse {
  date: string;
  halaqat: FollowUpHalaqa[];
  totalStudentStats: FollowUpAttendanceStats;
  totalTeacherStats: FollowUpAttendanceStats;
  totalAchievement: FollowUpAchievement;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
