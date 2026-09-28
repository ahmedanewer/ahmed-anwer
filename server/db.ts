import fs from 'fs';
import path from 'path';
import { DatabaseSchema, User, Subject, Exam, Question, ExamSubmission, LeaderboardEntry } from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

const INITIAL_DB: DatabaseSchema = {
  users: [],
  subjects: [],
  exams: [],
  questions: [],
  submissions: []
};

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let memoryDb: DatabaseSchema = INITIAL_DB;

// Load or initialize DB file
export function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(content);
      // Ensure all fields exist
      if (!memoryDb.users) memoryDb.users = [];
      if (!memoryDb.subjects) memoryDb.subjects = [];
      if (!memoryDb.exams) memoryDb.exams = [];
      if (!memoryDb.questions) memoryDb.questions = [];
      if (!memoryDb.submissions) memoryDb.submissions = [];
    } else {
      memoryDb = { ...INITIAL_DB };
      saveDatabase();
    }
  } catch (err) {
    console.error('Error loading database file, initializing clean DB:', err);
    memoryDb = { ...INITIAL_DB };
    saveDatabase();
  }
  return memoryDb;
}

export function saveDatabase(): void {
  try {
    // Write atomic temp file then rename
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(memoryDb, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

// Initialize on module load
loadDatabase();

export const db = {
  getUsers: () => memoryDb.users,
  getUserById: (id: string) => memoryDb.users.find(u => u.id === id),
  getUserByEmail: (email: string) => memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  addUser: (user: User) => {
    memoryDb.users.push(user);
    saveDatabase();
    return user;
  },
  updateUser: (id: string, updates: Partial<User>) => {
    const idx = memoryDb.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      memoryDb.users[idx] = { ...memoryDb.users[idx], ...updates };
      saveDatabase();
      return memoryDb.users[idx];
    }
    return null;
  },

  // Subjects
  getSubjects: (activeOnly = false) => {
    return activeOnly ? memoryDb.subjects.filter(s => s.isActive) : memoryDb.subjects;
  },
  getSubjectById: (id: string) => memoryDb.subjects.find(s => s.id === id),
  addSubject: (subject: Subject) => {
    memoryDb.subjects.push(subject);
    saveDatabase();
    return subject;
  },
  updateSubject: (id: string, updates: Partial<Subject>) => {
    const idx = memoryDb.subjects.findIndex(s => s.id === id);
    if (idx !== -1) {
      memoryDb.subjects[idx] = { ...memoryDb.subjects[idx], ...updates };
      saveDatabase();
      return memoryDb.subjects[idx];
    }
    return null;
  },
  deleteSubject: (id: string) => {
    const idx = memoryDb.subjects.findIndex(s => s.id === id);
    if (idx !== -1) {
      // Also delete exams & questions under this subject
      const examIds = memoryDb.exams.filter(e => e.subjectId === id).map(e => e.id);
      memoryDb.questions = memoryDb.questions.filter(q => !examIds.includes(q.examId));
      memoryDb.exams = memoryDb.exams.filter(e => e.subjectId !== id);
      memoryDb.subjects.splice(idx, 1);
      saveDatabase();
      return true;
    }
    return false;
  },

  // Exams
  getExams: (activeOnly = false) => {
    return activeOnly ? memoryDb.exams.filter(e => e.isActive) : memoryDb.exams;
  },
  getExamById: (id: string) => memoryDb.exams.find(e => e.id === id),
  getExamsBySubjectId: (subjectId: string, activeOnly = false) => {
    return memoryDb.exams.filter(e => e.subjectId === subjectId && (!activeOnly || e.isActive));
  },
  addExam: (exam: Exam) => {
    memoryDb.exams.push(exam);
    saveDatabase();
    return exam;
  },
  updateExam: (id: string, updates: Partial<Exam>) => {
    const idx = memoryDb.exams.findIndex(e => e.id === id);
    if (idx !== -1) {
      memoryDb.exams[idx] = { ...memoryDb.exams[idx], ...updates };
      saveDatabase();
      return memoryDb.exams[idx];
    }
    return null;
  },
  deleteExam: (id: string) => {
    const idx = memoryDb.exams.findIndex(e => e.id === id);
    if (idx !== -1) {
      memoryDb.questions = memoryDb.questions.filter(q => q.examId !== id);
      memoryDb.submissions = memoryDb.submissions.filter(s => s.examId !== id);
      memoryDb.exams.splice(idx, 1);
      saveDatabase();
      return true;
    }
    return false;
  },

  // Questions
  getQuestionsByExamId: (examId: string) => {
    return memoryDb.questions
      .filter(q => q.examId === examId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  },
  getQuestionById: (id: string) => memoryDb.questions.find(q => q.id === id),
  addQuestion: (question: Question) => {
    memoryDb.questions.push(question);
    // Update exam totalQuestions count automatically
    const exam = memoryDb.exams.find(e => e.id === question.examId);
    if (exam) {
      exam.totalQuestions = memoryDb.questions.filter(q => q.examId === question.examId).length;
    }
    saveDatabase();
    return question;
  },
  updateQuestion: (id: string, updates: Partial<Question>) => {
    const idx = memoryDb.questions.findIndex(q => q.id === id);
    if (idx !== -1) {
      memoryDb.questions[idx] = { ...memoryDb.questions[idx], ...updates };
      saveDatabase();
      return memoryDb.questions[idx];
    }
    return null;
  },
  deleteQuestion: (id: string) => {
    const idx = memoryDb.questions.findIndex(q => q.id === id);
    if (idx !== -1) {
      const examId = memoryDb.questions[idx].examId;
      memoryDb.questions.splice(idx, 1);
      const exam = memoryDb.exams.find(e => e.id === examId);
      if (exam) {
        exam.totalQuestions = memoryDb.questions.filter(q => q.examId === examId).length;
      }
      saveDatabase();
      return true;
    }
    return false;
  },

  // Submissions
  getSubmissions: () => memoryDb.submissions,
  getSubmission: (examId: string, userId: string) => {
    return memoryDb.submissions.find(s => s.examId === examId && s.userId === userId);
  },
  getSubmissionsByUserId: (userId: string) => {
    return memoryDb.submissions.filter(s => s.userId === userId).sort((a, b) => b.submittedAt - a.submittedAt);
  },
  getSubmissionsByExamId: (examId: string) => {
    return memoryDb.submissions.filter(s => s.examId === examId).sort((a, b) => b.score - a.score || a.submittedAt - b.submittedAt);
  },
  addSubmission: (submission: ExamSubmission) => {
    memoryDb.submissions.push(submission);
    // Update user points and lastPointEarnedAt
    const user = memoryDb.users.find(u => u.id === submission.userId);
    if (user) {
      user.totalPoints = (user.totalPoints || 0) + submission.score;
      if (submission.score > 0) {
        // Tie-breaker timestamp: the moment points were achieved
        user.lastPointEarnedAt = submission.submittedAt;
      }
    }
    saveDatabase();
    return submission;
  },

  // Leaderboard Calculation
  getLeaderboard: (): LeaderboardEntry[] => {
    const students = memoryDb.users.filter(u => u.role === 'student');
    
    // Sort rule:
    // 1. Total points descending (highest score first)
    // 2. Tie-breaker: student who achieved points earlier gets higher rank (lastPointEarnedAt ascending)
    // 3. If never earned points, createdAt ascending
    const sorted = [...students].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      const timeA = a.lastPointEarnedAt || a.createdAt || Infinity;
      const timeB = b.lastPointEarnedAt || b.createdAt || Infinity;
      return timeA - timeB;
    });

    return sorted.map((student, index) => {
      const examsCompleted = memoryDb.submissions.filter(s => s.userId === student.id).length;
      return {
        rank: index + 1,
        userId: student.id,
        fullName: student.fullName,
        email: student.email,
        totalPoints: student.totalPoints || 0,
        lastPointEarnedAt: student.lastPointEarnedAt || student.createdAt,
        examsCompleted
      };
    });
  }
};
