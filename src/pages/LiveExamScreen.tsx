import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Exam, Question, ExamSubmission } from '../types';
import { api } from '../services/api';
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Send,
  Zap,
  Radio
} from 'lucide-react';

interface LiveExamScreenProps {
  exam: Exam;
  serverStartTime: number;
  serverEndTime: number;
  onFinished: (submission: ExamSubmission, score: number, total: number) => void;
  onExit: () => void;
}

export const LiveExamScreen: React.FC<LiveExamScreenProps> = ({
  exam,
  serverStartTime,
  serverEndTime,
  onFinished,
  onExit
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number>>(() => {
    try {
      const saved = sessionStorage.getItem(`arena_exam_answers_${exam.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronized timer calculated from serverEndTime
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const remaining = Math.max(0, Math.floor((serverEndTime - Date.now()) / 1000));
    return remaining;
  });

  // Load questions
  useEffect(() => {
    let mounted = true;
    api
      .getExamById(exam.id)
      .then((res) => {
        if (!mounted) return;
        setQuestions(res.exam.questions || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'فشل في تحميل الأسئلة');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [exam.id]);

  // Persist answers locally to prevent loss on refresh
  useEffect(() => {
    try {
      sessionStorage.setItem(`arena_exam_answers_${exam.id}`, JSON.stringify(answers));
    } catch (e) {
      console.warn('Failed to save answers to sessionStorage', e);
    }
  }, [answers, exam.id]);

  // Handle submit logic
  const handleSubmit = useCallback(
    async (isAuto = false) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setShowConfirmModal(false);

      try {
        const res = await api.submitExam(exam.id, answers);
        // Clear local storage
        sessionStorage.removeItem(`arena_exam_answers_${exam.id}`);
        onFinished(res.submission, res.score, res.totalQuestions);
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء تسليم الاختبار');
        setIsSubmitting(false);
      }
    },
    [exam.id, answers, isSubmitting, onFinished]
  );

  // Synchronized countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((serverEndTime - Date.now()) / 1000));
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        // Automatic submit when time expires!
        handleSubmit(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [serverEndTime, handleSubmit]);

  const selectOption = (questionId: string, optionIndex: number) => {
    if (isSubmitting) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 0;

  // Format time remaining MM:SS
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingSeconds]);

  const isTimeCritical = remainingSeconds <= 120; // 2 minutes or less

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-[#2DD4BF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#94A3B8]">جاري تجهيز بيئة الاختبار التنافسي المباشر...</p>
      </div>
    );
  }

  if (error && questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#111827] border border-white/10 rounded-2xl text-center">
        <AlertTriangle className="w-12 h-12 text-[#FB7185] mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">خطأ في الاختبار</h3>
        <p className="text-sm text-[#94A3B8] mb-6">{error}</p>
        <button
          onClick={onExit}
          className="px-6 py-2.5 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20"
        >
          الخروج
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Top Synchronized Bar */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-[#2DD4BF] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30">
                مباشر
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                {exam.title}
              </h2>
            </div>
            <p className="text-xs text-[#94A3B8]">
              {exam.subjectName || 'مادة دراسية'} &bull; إجمالي {totalQuestions} سؤال
            </p>
          </div>
        </div>

        {/* Synchronized Timer Display */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
            isTimeCritical
              ? 'bg-[#FB7185]/20 border-[#FB7185] text-[#FB7185] animate-pulse'
              : 'bg-[#0B1020] border-white/10 text-[#2DD4BF]'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span className="font-mono-numbers text-lg sm:text-xl font-black tracking-wider">
            {formattedTime}
          </span>
          <span className="text-[10px] font-semibold text-[#94A3B8]">متبقي</span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-[#111827] h-2 rounded-full mb-6 overflow-hidden border border-white/5">
        <div
          className="h-full bg-gradient-to-r from-[#7C3AED] to-[#2DD4BF] transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Main Question Card */}
      {currentQuestion ? (
        <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden mb-6">
          {/* Question Header */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center font-bold text-sm font-mono-numbers">
                {currentIndex + 1}
              </span>
              <span className="text-xs font-semibold text-[#94A3B8]">
                من أصل {totalQuestions} أسئلة
              </span>
            </div>

            <div className="text-xs font-bold text-[#E9D5FF] bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
              1 نقطة للإجابة الصحيحة
            </div>
          </div>

          {/* Question Text */}
          <div className="my-6">
            <h3 className="text-lg sm:text-2xl font-bold text-white leading-relaxed text-right">
              {currentQuestion.text}
            </h3>
          </div>

          {/* 4 MCQ Choices */}
          <div className="space-y-3.5 my-8">
            {currentQuestion.options.map((optionText, optIndex) => {
              const isSelected = answers[currentQuestion.id] === optIndex;
              const optionLetters = ['أ', 'ب', 'ج', 'د'];
              const latinLetters = ['A', 'B', 'C', 'D'];

              return (
                <button
                  key={optIndex}
                  type="button"
                  onClick={() => selectOption(currentQuestion.id, optIndex)}
                  className={`w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl border text-right transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#7C3AED]/25 to-[#2DD4BF]/15 border-[#2DD4BF] shadow-[0_0_20px_rgba(45,212,191,0.2)]'
                      : 'bg-[#0B1020]/80 border-white/10 hover:border-white/20 hover:bg-[#0B1020]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm font-mono-numbers transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-[#2DD4BF] text-[#0B1020]'
                          : 'bg-white/5 text-[#94A3B8] group-hover:text-white group-hover:bg-white/10'
                      }`}
                    >
                      {optionLetters[optIndex]} ({latinLetters[optIndex]})
                    </span>
                    <span
                      className={`text-sm sm:text-base font-semibold leading-normal ${
                        isSelected ? 'text-white' : 'text-[#CBD5E1]'
                      }`}
                    >
                      {optionText}
                    </span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-[#2DD4BF] bg-[#2DD4BF]'
                        : 'border-white/20 bg-transparent'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-[#0B1020]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-white/5">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs sm:text-sm disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>السؤال السابق</span>
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#7C3AED]/30 transition-all cursor-pointer"
              >
                <span>السؤال التالي</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#2DD4BF] to-[#059669] text-[#0B1020] font-black text-xs sm:text-sm shadow-lg shadow-[#2DD4BF]/30 hover:opacity-95 transition-opacity cursor-pointer"
              >
                <span>تسليم الامتحان النهائي</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-[#111827] rounded-3xl text-[#94A3B8]">
          لا توجد أسئلة متوفرة حالياً في هذا الامتحان.
        </div>
      )}

      {/* Quick Questions Grid Strip */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-white">خريطة الأسئلة المباشرة:</span>
          <span className="text-[#94A3B8]">
            تمت الإجابة على <b className="text-[#2DD4BF] font-mono-numbers">{answeredCount}</b> من {totalQuestions}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl font-bold text-xs font-mono-numbers transition-all cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-[#2DD4BF] bg-[#7C3AED] text-white scale-105'
                    : isAnswered
                    ? 'bg-[#2DD4BF]/20 border border-[#2DD4BF]/40 text-[#2DD4BF]'
                    : 'bg-[#0B1020] border border-white/10 text-[#94A3B8] hover:text-white'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Instant submit button if student is ready */}
        <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="text-xs font-bold text-[#2DD4BF] hover:underline cursor-pointer"
          >
            جاهز للتسليم الآن؟ انقر لتأكيد النتيجة النهائية &larr;
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-white mb-2">تأكيد تسليم الامتحان</h3>
            <p className="text-sm text-[#94A3B8] mb-6">
              لقد أجبت على <b className="text-white font-mono-numbers">{answeredCount}</b> من أصل{' '}
              <b className="text-white font-mono-numbers">{totalQuestions}</b> أسئلة.
              {answeredCount < totalQuestions && (
                <span className="block text-[#FB7185] font-semibold mt-2">
                  تنبيه: هناك {totalQuestions - answeredCount} أسئلة لم تقم بالإجابة عليها بعد!
                </span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs cursor-pointer"
              >
                متابعة الحل
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="py-2.5 rounded-xl bg-gradient-to-r from-[#2DD4BF] to-[#059669] text-[#0B1020] font-black text-xs hover:opacity-95 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'جاري التصحيح...' : 'نعم، تسليم الاختبار'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
