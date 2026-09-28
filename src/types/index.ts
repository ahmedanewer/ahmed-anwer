export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  totalPoints: number;
  rank?: number | null;
  createdAt: number;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: number;
}

export type ExamStatus = 'idle' | 'waiting' | 'live' | 'finished';

export interface Exam {
  id: string;
  subjectId: string;
  subjectName?: string;
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  isActive: boolean;
  status: ExamStatus;
  waitingCount?: number;
  liveStartedAt?: number;
  liveEndsAt?: number;
  createdAt: number;
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  options: [string, string, string, string];
  correctOptionIndex?: number; // Only present for admin or after exam submission
  orderIndex: number;
}

export interface WaitingParticipant {
  userId: string;
  fullName: string;
  email: string;
  joinedAt: number;
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  options: [string, string, string, string];
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  answers: Record<string, number>;
  score: number;
  totalQuestions: number;
  details: QuestionResult[];
  submittedAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  email: string;
  totalPoints: number;
  lastPointEarnedAt: number;
  examsCompleted: number;
}

export interface StudentStats {
  id: string;
  fullName: string;
  email: string;
  totalPoints: number;
  currentRank: number | string;
  totalExamsCompleted: number;
  totalCorrectAnswers: number;
  totalIncorrectAnswers: number;
  accuracyRate: number;
}

export interface ExamHistoryItem {
  submissionId: string;
  examId: string;
  examTitle: string;
  subjectName: string;
  score: number;
  totalQuestions: number;
  submittedAt: number;
}
