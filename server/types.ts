export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  totalPoints: number;
  lastPointEarnedAt: number; // For tie-breaking rule
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
  title: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  isActive: boolean;
  status: ExamStatus;
  liveStartedAt?: number;
  liveEndsAt?: number;
  createdAt: number;
}

export interface Question {
  id: string;
  examId: string;
  text: string;
  options: [string, string, string, string]; // exactly 4 choices
  correctOptionIndex: number; // 0, 1, 2, or 3 (server authoritative)
  orderIndex: number;
  createdAt: number;
}

// Question as sent to students during live exam (correctOptionIndex hidden)
export interface PublicQuestion {
  id: string;
  examId: string;
  text: string;
  options: [string, string, string, string];
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
  answers: Record<string, number>; // questionId -> selectedOptionIndex (0..3)
  score: number; // number of correct answers
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

export interface DatabaseSchema {
  users: User[];
  subjects: Subject[];
  exams: Exam[];
  questions: Question[];
  submissions: ExamSubmission[];
}
