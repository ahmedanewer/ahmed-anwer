import { Router, Response } from 'express';
import { db } from './db.js';
import {
  authenticate,
  requireAdmin,
  hashPassword,
  comparePassword,
  generateToken,
  AuthenticatedRequest
} from './auth.js';
import {
  broadcastExamStart,
  broadcastExamEnd,
  broadcastWaitingRoom,
  broadcastLeaderboardUpdate,
  getWaitingParticipants
} from './websocket.js';
import { User, Subject, Exam, Question, ExamSubmission, QuestionResult } from './types.js';

const router = Router();

// ==========================================
// 1. AUTHENTICATION & USER MANAGEMENT
// ==========================================

// Student Registration (strictly assigns 'student' role, ignoring any attempts to inject admin role)
router.post('/auth/register', (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'يرجى إدخال جميع الحقول المطلوبة (الاسم الكامل، البريد الإلكتروني، كلمة المرور)' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور عن 6 أحرف' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(cleanEmail);
    if (existing) {
      res.status(400).json({ error: 'البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول' });
      return;
    }

    // Public registration is strictly for students
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: fullName.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      role: 'student',
      totalPoints: 0,
      lastPointEarnedAt: 0,
      createdAt: Date.now()
    };

    db.addUser(newUser);
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'تم إنشاء حساب الطالب بنجاح',
      token,
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        totalPoints: newUser.totalPoints,
        createdAt: newUser.createdAt
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة لاحقاً' });
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(cleanEmail);

    if (!user || !comparePassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        totalPoints: user.totalPoints,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تسجيل الدخول' });
  }
});

// Check if any admin exists in the system (for /admin route setup state)
router.get('/admin/check-setup', (_req, res) => {
  const users = db.getUsers();
  const hasAdmin = users.some(u => u.role === 'admin');
  res.json({ hasAdmin });
});

// Setup First Master Admin (only allowed if NO admin currently exists)
router.post('/admin/setup-first', (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const users = db.getUsers();
    const existingAdmin = users.find(u => u.role === 'admin');

    if (existingAdmin) {
      res.status(403).json({ error: 'تم إعداد حساب المشرف مسبقاً. يرجى تسجيل الدخول بحساب المشرف المعتمد.' });
      return;
    }

    if (!fullName || !email || !password) {
      res.status(400).json({ error: 'يرجى إدخال الاسم الكامل، والبريد الإلكتروني، وكلمة المرور' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور عن 6 أحرف' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    let existingUser = db.getUserByEmail(cleanEmail);
    let adminUser: User;

    if (existingUser) {
      db.updateUser(existingUser.id, { role: 'admin', fullName: fullName.trim() });
      adminUser = db.getUserById(existingUser.id)!;
    } else {
      adminUser = {
        id: `adm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fullName: fullName.trim(),
        email: cleanEmail,
        passwordHash: hashPassword(password),
        role: 'admin',
        totalPoints: 0,
        lastPointEarnedAt: 0,
        createdAt: Date.now()
      };
      db.addUser(adminUser);
    }

    const token = generateToken(adminUser);

    res.status(201).json({
      message: 'تم إعداد وتفعيل حساب المشرف الرئيسي بنجاح',
      token,
      user: {
        id: adminUser.id,
        fullName: adminUser.fullName,
        email: adminUser.email,
        role: adminUser.role,
        totalPoints: adminUser.totalPoints,
        createdAt: adminUser.createdAt
      }
    });
  } catch (err) {
    console.error('Admin setup error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء إعداد حساب المشرف' });
  }
});

// Dedicated Admin Login (Strictly verifies role === 'admin')
router.post('/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.getUserByEmail(cleanEmail);

    if (!user || !comparePassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({ error: 'غير مصرح: هذا الحساب ليس لديه صلاحيات الإدارة' });
      return;
    }

    const token = generateToken(user);

    res.json({
      message: 'تم تسجيل دخول المشرف بنجاح',
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        totalPoints: user.totalPoints,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

router.get('/auth/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  
  // Calculate rank if student
  let rank: number | null = null;
  if (user.role === 'student') {
    const leaderboard = db.getLeaderboard();
    const entry = leaderboard.find(l => l.userId === user.id);
    rank = entry ? entry.rank : null;
  }

  res.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      totalPoints: user.totalPoints,
      rank,
      createdAt: user.createdAt
    }
  });
});

// ==========================================
// 2. SUBJECTS MANAGEMENT
// ==========================================

router.get('/subjects', (req, res) => {
  const activeOnly = req.query.all !== 'true';
  const subjects = db.getSubjects(activeOnly);
  res.json({ subjects });
});

router.post('/subjects', authenticate, requireAdmin, (req, res) => {
  const { name, description, icon, imageUrl } = req.body;
  if (!name) {
    res.status(400).json({ error: 'اسم المادة مطلوب' });
    return;
  }

  const newSubject: Subject = {
    id: `subj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    description: (description || '').trim(),
    icon: icon || 'BookOpen',
    imageUrl: imageUrl || '',
    isActive: true,
    createdAt: Date.now()
  };

  db.addSubject(newSubject);
  res.status(201).json({ message: 'تم إضافة المادة بنجاح', subject: newSubject });
});

router.put('/subjects/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, description, icon, imageUrl, isActive } = req.body;

  const existing = db.getSubjectById(id);
  if (!existing) {
    res.status(404).json({ error: 'المادة غير موجودة' });
    return;
  }

  const updated = db.updateSubject(id, {
    ...(name !== undefined && { name: name.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(icon !== undefined && { icon }),
    ...(imageUrl !== undefined && { imageUrl }),
    ...(isActive !== undefined && { isActive: Boolean(isActive) })
  });

  res.json({ message: 'تم تحديث المادة بنجاح', subject: updated });
});

router.delete('/subjects/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const success = db.deleteSubject(id);
  if (!success) {
    res.status(404).json({ error: 'المادة غير موجودة' });
    return;
  }
  res.json({ message: 'تم حذف المادة وجميع امتحاناتها بنجاح' });
});

// ==========================================
// 3. EXAMS MANAGEMENT
// ==========================================

router.get('/exams', (req, res) => {
  const activeOnly = req.query.all !== 'true';
  const exams = db.getExams(activeOnly);

  // Augment with subject name and active waiting count
  const augmentedExams = exams.map(exam => {
    const subject = db.getSubjectById(exam.subjectId);
    const waitingParticipants = getWaitingParticipants(exam.id);
    const questionsCount = db.getQuestionsByExamId(exam.id).length;

    return {
      ...exam,
      totalQuestions: questionsCount,
      subjectName: subject?.name || 'مادة عامة',
      waitingCount: waitingParticipants.length
    };
  });

  res.json({ exams: augmentedExams });
});

router.get('/exams/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const exam = db.getExamById(id);

  if (!exam) {
    res.status(404).json({ error: 'الامتحان غير موجود' });
    return;
  }

  const subject = db.getSubjectById(exam.subjectId);
  const questions = db.getQuestionsByExamId(id);
  const waitingParticipants = getWaitingParticipants(id);

  // If student: hide correct answers!
  const isStudent = req.user?.role !== 'admin';
  const processedQuestions = isStudent
    ? questions.map(q => ({
        id: q.id,
        examId: q.examId,
        text: q.text,
        options: q.options,
        orderIndex: q.orderIndex
      }))
    : questions;

  res.json({
    exam: {
      ...exam,
      totalQuestions: questions.length,
      subjectName: subject?.name || 'مادة عامة',
      waitingCount: waitingParticipants.length,
      questions: processedQuestions
    }
  });
});

router.post('/exams', authenticate, requireAdmin, (req, res) => {
  const { subjectId, title, description, durationMinutes, isActive } = req.body;

  if (!subjectId || !title || !durationMinutes) {
    res.status(400).json({ error: 'يرجى توفير المادة، عنوان الامتحان، والمدة بالدقائق' });
    return;
  }

  const subject = db.getSubjectById(subjectId);
  if (!subject) {
    res.status(400).json({ error: 'المادة المحددة غير موجودة' });
    return;
  }

  const newExam: Exam = {
    id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    subjectId,
    title: title.trim(),
    description: (description || '').trim(),
    durationMinutes: Number(durationMinutes) || 10,
    totalQuestions: 0,
    isActive: isActive !== undefined ? Boolean(isActive) : true,
    status: 'idle',
    createdAt: Date.now()
  };

  db.addExam(newExam);
  res.status(201).json({ message: 'تم إنشاء الامتحان بنجاح', exam: newExam });
});

router.put('/exams/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { subjectId, title, description, durationMinutes, isActive, status } = req.body;

  const existing = db.getExamById(id);
  if (!existing) {
    res.status(404).json({ error: 'الامتحان غير موجود' });
    return;
  }

  const updated = db.updateExam(id, {
    ...(subjectId && { subjectId }),
    ...(title && { title: title.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(durationMinutes && { durationMinutes: Number(durationMinutes) }),
    ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    ...(status && { status })
  });

  res.json({ message: 'تم تحديث الامتحان بنجاح', exam: updated });
});

router.delete('/exams/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const success = db.deleteExam(id);
  if (!success) {
    res.status(404).json({ error: 'الامتحان غير موجود' });
    return;
  }
  res.json({ message: 'تم حذف الامتحان بنجاح' });
});

// ==========================================
// 4. LIVE SYNCHRONIZATION CONTROLS (ADMIN)
// ==========================================

// Open waiting room for students
router.post('/exams/:id/open-waiting', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const exam = db.getExamById(id);
  if (!exam) {
    res.status(404).json({ error: 'الامتحان غير موجود' });
    return;
  }

  const questions = db.getQuestionsByExamId(id);
  if (questions.length === 0) {
    res.status(400).json({ error: 'لا يمكن فتح غرفة الانتظار لامتحان لا يحتوي على أي أسئلة. يرجى إضافة أسئلة أولاً.' });
    return;
  }

  const updated = db.updateExam(id, {
    status: 'waiting',
    liveStartedAt: undefined,
    liveEndsAt: undefined
  });

  broadcastWaitingRoom(id);
  res.json({ message: 'تم فتح غرفة الانتظار بنجاح، يمكن للطلاب الانضمام الآن', exam: updated });
});

// START EXAM (Simultaneous start for everyone in waiting room)
router.post('/exams/:id/start-live', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const exam = db.getExamById(id);
  if (!exam) {
    res.status(404).json({ error: 'الامتحان غير موجود' });
    return;
  }

  const questions = db.getQuestionsByExamId(id);
  if (questions.length === 0) {
    res.status(400).json({ error: 'لا يمكن بدء امتحان بدون أسئلة' });
    return;
  }

  const now = Date.now();
  const durationMs = (exam.durationMinutes || 10) * 60 * 1000;
  const liveEndsAt = now + durationMs;

  const updated = db.updateExam(id, {
    status: 'live',
    liveStartedAt: now,
    liveEndsAt
  });

  // Broadcast to all waiting students!
  broadcastExamStart(id, now, liveEndsAt, exam.durationMinutes);

  res.json({
    message: 'تم إطلاق الامتحان المباشر لجميع الطلاب في غرفة الانتظار بنجاح!',
    exam: updated,
    serverStartTime: now,
    serverEndTime: liveEndsAt
  });
});

// END EXAM
router.post('/exams/:id/end-live', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const exam = db.getExamById(id);
  if (!exam) {
    res.status(404).json({ error: 'الامتحان غير موجود' });
    return;
  }

  const updated = db.updateExam(id, {
    status: 'finished'
  });

  broadcastExamEnd(id);
  res.json({ message: 'تم إنهاء الامتحان المباشر', exam: updated });
});

// RESET EXAM TO IDLE
router.post('/exams/:id/reset', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const updated = db.updateExam(id, {
    status: 'idle',
    liveStartedAt: undefined,
    liveEndsAt: undefined
  });
  broadcastWaitingRoom(id);
  res.json({ message: 'تمت إعادة ضبط حالة الامتحان إلى وضع الاستعداد', exam: updated });
});

// ==========================================
// 5. QUESTIONS MANAGEMENT (ADMIN)
// ==========================================

router.get('/exams/:id/questions', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const questions = db.getQuestionsByExamId(id);
  res.json({ questions });
});

router.post('/exams/:id/questions', authenticate, requireAdmin, (req, res) => {
  const { id: examId } = req.params;
  const { text, options, correctOptionIndex, orderIndex } = req.body;

  const exam = db.getExamById(examId);
  if (!exam) {
    res.status(404).json({ error: 'الامتحان غير موجود' });
    return;
  }

  if (!text || !Array.isArray(options) || options.length !== 4) {
    res.status(400).json({ error: 'يجب كتابة نص السؤال وتحديد 4 خيارات للإجابة' });
    return;
  }

  const cleanOptions = options.map((opt: any) => String(opt || '').trim());
  if (cleanOptions.some(opt => !opt)) {
    res.status(400).json({ error: 'لا يمكن ترك أي خيار من الخيارات الأربعة فارغاً' });
    return;
  }

  const correctIdx = Number(correctOptionIndex);
  if (isNaN(correctIdx) || correctIdx < 0 || correctIdx > 3) {
    res.status(400).json({ error: 'يجب اختيار الإجابة الصحيحة من بين الخيارات (0، 1، 2، 3)' });
    return;
  }

  const existingQuestions = db.getQuestionsByExamId(examId);
  const newQuestion: Question = {
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    examId,
    text: text.trim(),
    options: cleanOptions as [string, string, string, string],
    correctOptionIndex: correctIdx,
    orderIndex: orderIndex !== undefined ? Number(orderIndex) : existingQuestions.length + 1,
    createdAt: Date.now()
  };

  db.addQuestion(newQuestion);
  res.status(201).json({ message: 'تمت إضافة السؤال بنجاح', question: newQuestion });
});

router.put('/questions/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { text, options, correctOptionIndex, orderIndex } = req.body;

  const existing = db.getQuestionById(id);
  if (!existing) {
    res.status(404).json({ error: 'السؤال غير موجود' });
    return;
  }

  let cleanOptions = existing.options;
  if (options) {
    if (!Array.isArray(options) || options.length !== 4) {
      res.status(400).json({ error: 'يجب توفير 4 خيارات' });
      return;
    }
    cleanOptions = options.map((opt: any) => String(opt || '').trim()) as [string, string, string, string];
  }

  let cleanCorrect = existing.correctOptionIndex;
  if (correctOptionIndex !== undefined) {
    const c = Number(correctOptionIndex);
    if (c >= 0 && c <= 3) {
      cleanCorrect = c;
    }
  }

  const updated = db.updateQuestion(id, {
    ...(text && { text: text.trim() }),
    options: cleanOptions,
    correctOptionIndex: cleanCorrect,
    ...(orderIndex !== undefined && { orderIndex: Number(orderIndex) })
  });

  res.json({ message: 'تم تعديل السؤال بنجاح', question: updated });
});

router.delete('/questions/:id', authenticate, requireAdmin, (req, res) => {
  const { id } = req.params;
  const success = db.deleteQuestion(id);
  if (!success) {
    res.status(404).json({ error: 'السؤال غير موجود' });
    return;
  }
  res.json({ message: 'تم حذف السؤال بنجاح' });
});

// ==========================================
// 6. EXAM SUBMISSIONS & AUTOMATIC SCORING
// ==========================================

router.post('/exams/:id/submit', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: examId } = req.params;
    const { answers } = req.body; // Map of questionId -> selectedOptionIndex (0..3)
    const user = req.user!;

    const exam = db.getExamById(examId);
    if (!exam) {
      res.status(404).json({ error: 'الامتحان غير موجود' });
      return;
    }

    // Check if already submitted
    const existingSubmission = db.getSubmission(examId, user.id);
    if (existingSubmission) {
      res.status(400).json({
        error: 'لقد قمت بتسليم هذا الاختبار بالفعل',
        submission: existingSubmission
      });
      return;
    }

    const questions = db.getQuestionsByExamId(examId);
    if (questions.length === 0) {
      res.status(400).json({ error: 'هذا الامتحان لا يحتوي على أسئلة' });
      return;
    }

    // Server-side authoritative grading
    let score = 0;
    const details: QuestionResult[] = [];
    const submittedAnswers = answers || {};

    for (const q of questions) {
      const selectedIndex = submittedAnswers[q.id] !== undefined ? Number(submittedAnswers[q.id]) : null;
      const isCorrect = selectedIndex !== null && selectedIndex === q.correctOptionIndex;

      if (isCorrect) {
        score += 1; // Exactly 1 point per correct answer
      }

      details.push({
        questionId: q.id,
        questionText: q.text,
        options: q.options,
        selectedOptionIndex: selectedIndex,
        correctOptionIndex: q.correctOptionIndex,
        isCorrect
      });
    }

    const submission: ExamSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      examId,
      userId: user.id,
      studentName: user.fullName,
      studentEmail: user.email,
      answers: submittedAnswers,
      score,
      totalQuestions: questions.length,
      details,
      submittedAt: Date.now()
    };

    db.addSubmission(submission);
    broadcastLeaderboardUpdate();

    // Calculate updated student rank
    const leaderboard = db.getLeaderboard();
    const rankEntry = leaderboard.find(l => l.userId === user.id);

    res.json({
      message: 'تم تسليم الاختبار وتصحيحه تلقائياً بنجاح!',
      submission,
      score,
      totalQuestions: questions.length,
      currentRank: rankEntry ? rankEntry.rank : null,
      totalPoints: user.totalPoints + score
    });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء تصحيح وتسليم الاختبار' });
  }
});

router.get('/exams/:id/my-submission', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id: examId } = req.params;
  const user = req.user!;
  const submission = db.getSubmission(examId, user.id);
  if (!submission) {
    res.json({ hasSubmitted: false });
    return;
  }
  res.json({ hasSubmitted: true, submission });
});

// ==========================================
// 7. LEADERBOARD & STATS
// ==========================================

router.get('/leaderboard', (req, res) => {
  const fullLeaderboard = db.getLeaderboard();
  const top10 = fullLeaderboard.slice(0, 10);
  res.json({
    leaderboard: top10,
    totalCompetitors: fullLeaderboard.length
  });
});

router.get('/stats/student', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const userSubmissions = db.getSubmissionsByUserId(user.id);
  const leaderboard = db.getLeaderboard();
  const rankEntry = leaderboard.find(l => l.userId === user.id);

  let totalCorrect = 0;
  let totalIncorrect = 0;

  userSubmissions.forEach(s => {
    totalCorrect += s.score;
    totalIncorrect += Math.max(0, s.totalQuestions - s.score);
  });

  const augmentedHistory = userSubmissions.map(s => {
    const exam = db.getExamById(s.examId);
    const subject = exam ? db.getSubjectById(exam.subjectId) : null;
    return {
      submissionId: s.id,
      examId: s.examId,
      examTitle: exam?.title || 'اختبار تنافسي',
      subjectName: subject?.name || 'مادة عامة',
      score: s.score,
      totalQuestions: s.totalQuestions,
      submittedAt: s.submittedAt
    };
  });

  res.json({
    student: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      totalPoints: user.totalPoints,
      currentRank: rankEntry ? rankEntry.rank : '-',
      totalExamsCompleted: userSubmissions.length,
      totalCorrectAnswers: totalCorrect,
      totalIncorrectAnswers: totalIncorrect,
      accuracyRate: (totalCorrect + totalIncorrect) > 0
        ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100)
        : 0
    },
    history: augmentedHistory
  });
});

// ==========================================
// 8. ADMIN DASHBOARD METRICS & STUDENTS
// ==========================================

router.get('/admin/stats', authenticate, requireAdmin, (req, res) => {
  const users = db.getUsers();
  const students = users.filter(u => u.role === 'student');
  const subjects = db.getSubjects();
  const exams = db.getExams();
  const questions = db.getUsers(); // db has all questions
  const submissions = db.getSubmissions();

  let totalQuestionsCount = 0;
  exams.forEach(e => {
    totalQuestionsCount += db.getQuestionsByExamId(e.id).length;
  });

  res.json({
    stats: {
      totalStudents: students.length,
      totalSubjects: subjects.length,
      totalExams: exams.length,
      totalQuestions: totalQuestionsCount,
      totalSubmissions: submissions.length,
      liveExamsCount: exams.filter(e => e.status === 'live').length,
      waitingExamsCount: exams.filter(e => e.status === 'waiting').length
    }
  });
});

router.get('/admin/students', authenticate, requireAdmin, (req, res) => {
  const users = db.getUsers().filter(u => u.role === 'student');
  const submissions = db.getSubmissions();

  const studentList = users.map(u => {
    const userSubs = submissions.filter(s => s.userId === u.id);
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      totalPoints: u.totalPoints,
      lastPointEarnedAt: u.lastPointEarnedAt,
      examsCompleted: userSubs.length,
      joinedAt: u.createdAt
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints || a.lastPointEarnedAt - b.lastPointEarnedAt);

  res.json({ students: studentList });
});

router.get('/admin/exam-results/:examId', authenticate, requireAdmin, (req, res) => {
  const { examId } = req.params;
  const submissions = db.getSubmissionsByExamId(examId);
  res.json({ submissions });
});

router.post('/admin/leaderboard/reset-user/:userId', authenticate, requireAdmin, (req, res) => {
  const { userId } = req.params;
  const user = db.getUserById(userId);
  if (!user) {
    res.status(404).json({ error: 'المستخدم غير موجود' });
    return;
  }
  db.updateUser(userId, { totalPoints: 0, lastPointEarnedAt: 0 });
  broadcastLeaderboardUpdate();
  res.json({ message: 'تم تصفير نقاط الطالب بنجاح' });
});

router.post('/admin/leaderboard/reset-all', authenticate, requireAdmin, (_req, res) => {
  const students = db.getUsers().filter(u => u.role === 'student');
  students.forEach(s => {
    db.updateUser(s.id, { totalPoints: 0, lastPointEarnedAt: 0 });
  });
  broadcastLeaderboardUpdate();
  res.json({ message: 'تمت إعادة ضبط جميع نقاط المتصدرين للموسم الجديد' });
});

export default router;
