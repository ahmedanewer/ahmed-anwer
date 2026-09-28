import {
  User,
  Subject,
  Exam,
  Question,
  ExamSubmission,
  LeaderboardEntry,
  StudentStats,
  ExamHistoryItem
} from '../types';

const TOKEN_KEY = 'arena_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
  }

  return data as T;
}

export const api = {
  // Student Auth
  register: (payload: { fullName: string; email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    request<{ user: User }>('/auth/me'),

  // Admin Dedicated Auth & Setup
  checkAdminSetup: () =>
    request<{ hasAdmin: boolean }>('/admin/check-setup'),

  setupFirstAdmin: (payload: { fullName: string; email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/admin/setup-first', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  adminLogin: (payload: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Subjects
  getSubjects: (all = false) =>
    request<{ subjects: Subject[] }>(`/subjects${all ? '?all=true' : ''}`),

  createSubject: (payload: { name: string; description?: string; icon?: string; imageUrl?: string }) =>
    request<{ message: string; subject: Subject }>('/subjects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateSubject: (id: string, payload: Partial<Subject>) =>
    request<{ message: string; subject: Subject }>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteSubject: (id: string) =>
    request<{ message: string }>(`/subjects/${id}`, {
      method: 'DELETE',
    }),

  // Exams
  getExams: (all = false) =>
    request<{ exams: Exam[] }>(`/exams${all ? '?all=true' : ''}`),

  getExamById: (id: string) =>
    request<{ exam: Exam & { questions: Question[] } }>(`/exams/${id}`),

  createExam: (payload: { subjectId: string; title: string; description?: string; durationMinutes: number; isActive?: boolean }) =>
    request<{ message: string; exam: Exam }>('/exams', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateExam: (id: string, payload: Partial<Exam>) =>
    request<{ message: string; exam: Exam }>(`/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteExam: (id: string) =>
    request<{ message: string }>(`/exams/${id}`, {
      method: 'DELETE',
    }),

  // Live Exam Controls (Admin)
  openWaitingRoom: (id: string) =>
    request<{ message: string; exam: Exam }>(`/exams/${id}/open-waiting`, {
      method: 'POST',
    }),

  startLiveExam: (id: string) =>
    request<{ message: string; exam: Exam; serverStartTime: number; serverEndTime: number }>(`/exams/${id}/start-live`, {
      method: 'POST',
    }),

  endLiveExam: (id: string) =>
    request<{ message: string; exam: Exam }>(`/exams/${id}/end-live`, {
      method: 'POST',
    }),

  resetExam: (id: string) =>
    request<{ message: string; exam: Exam }>(`/exams/${id}/reset`, {
      method: 'POST',
    }),

  // Questions (Admin)
  getExamQuestions: (examId: string) =>
    request<{ questions: Question[] }>(`/exams/${examId}/questions`),

  createQuestion: (examId: string, payload: { text: string; options: [string, string, string, string]; correctOptionIndex: number; orderIndex?: number }) =>
    request<{ message: string; question: Question }>(`/exams/${examId}/questions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateQuestion: (id: string, payload: Partial<Question>) =>
    request<{ message: string; question: Question }>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteQuestion: (id: string) =>
    request<{ message: string }>(`/questions/${id}`, {
      method: 'DELETE',
    }),

  // Submissions
  submitExam: (examId: string, answers: Record<string, number>) =>
    request<{
      message: string;
      submission: ExamSubmission;
      score: number;
      totalQuestions: number;
      currentRank: number | null;
      totalPoints: number;
    }>(`/exams/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  getMySubmission: (examId: string) =>
    request<{ hasSubmitted: boolean; submission?: ExamSubmission }>(`/exams/${examId}/my-submission`),

  // Leaderboard & Student Stats
  getLeaderboard: () =>
    request<{ leaderboard: LeaderboardEntry[]; totalCompetitors: number }>('/leaderboard'),

  getStudentStats: () =>
    request<{ student: StudentStats; history: ExamHistoryItem[] }>('/stats/student'),

  // Admin Stats & Directory
  getAdminStats: () =>
    request<{ stats: {
      totalStudents: number;
      totalSubjects: number;
      totalExams: number;
      totalQuestions: number;
      totalSubmissions: number;
      liveExamsCount: number;
      waitingExamsCount: number;
    } }>('/admin/stats'),

  getAdminStudents: () =>
    request<{ students: any[] }>('/admin/students'),

  getAdminExamResults: (examId: string) =>
    request<{ submissions: ExamSubmission[] }>(`/admin/exam-results/${examId}`),

  resetUserPoints: (userId: string) =>
    request<{ message: string }>(`/admin/leaderboard/reset-user/${userId}`, {
      method: 'POST',
    }),

  resetAllPoints: () =>
    request<{ message: string }>('/admin/leaderboard/reset-all', {
      method: 'POST',
    }),
};
