import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ExamSubmission } from '../types';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  Flame,
  BarChart3
} from 'lucide-react';

interface ExamResultPageProps {
  submission: ExamSubmission;
  score: number;
  totalQuestions: number;
  currentRank?: number | null;
  onGoToLeaderboard: () => void;
  onGoToDashboard: () => void;
}

export const ExamResultPage: React.FC<ExamResultPageProps> = ({
  submission,
  score,
  totalQuestions,
  currentRank,
  onGoToLeaderboard,
  onGoToDashboard
}) => {
  const incorrectCount = Math.max(0, totalQuestions - score);
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  // Trigger celebration confetti
  useEffect(() => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7C3AED', '#2DD4BF', '#FB7185', '#E9D5FF', '#F8FAFC']
      });
    } catch (e) {
      console.warn('Confetti could not run:', e);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Banner / Celebration Card */}
      <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center mb-8">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#2DD4BF]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#2DD4BF] p-[2px] mb-4 shadow-[0_0_30px_rgba(124,58,237,0.4)]">
          <div className="w-full h-full bg-[#0B1020] rounded-[14px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-[#2DD4BF]" />
          </div>
        </div>

        <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30 mb-2 inline-block">
          تم إنهاء الاختبار وتصحيحه تلقائياً
        </span>

        <h1 className="text-3xl sm:text-5xl font-black text-white mt-2 mb-3">
          النتيجة النهائية
        </h1>

        <p className="text-sm text-[#94A3B8] max-w-md mx-auto mb-8">
          أحسنت! تمت إضافة نقاطك إلى سجلك الأكاديمي وتحديث ترتيبك في لوحة الشرف العالمية فورياً.
        </p>

        {/* Score & Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto mb-8">
          {/* Points/Score */}
          <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-4 text-center">
            <span className="text-xs text-[#94A3B8] block mb-1">الدرجة النهائية</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl sm:text-4xl font-black text-[#2DD4BF] font-mono-numbers">
                {score}
              </span>
              <span className="text-xs text-[#94A3B8] font-bold">/ {totalQuestions}</span>
            </div>
            <span className="text-[10px] text-[#2DD4BF] font-semibold mt-1 block">+{score} نقطة</span>
          </div>

          {/* Percentage */}
          <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-4 text-center">
            <span className="text-xs text-[#94A3B8] block mb-1">نسبة الإتقان</span>
            <span className="text-3xl sm:text-4xl font-black text-white font-mono-numbers">
              {percentage}%
            </span>
            <span className="text-[10px] text-[#E9D5FF] font-semibold mt-1 block">معدل الدقة</span>
          </div>

          {/* Correct Count */}
          <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-4 text-center">
            <span className="text-xs text-[#94A3B8] block mb-1">إجابات صحيحة</span>
            <span className="text-3xl sm:text-4xl font-black text-[#2DD4BF] font-mono-numbers">
              {score}
            </span>
            <span className="text-[10px] text-[#2DD4BF] font-semibold mt-1 block">صحيح</span>
          </div>

          {/* Incorrect Count */}
          <div className="bg-[#0B1020]/90 border border-white/10 rounded-2xl p-4 text-center">
            <span className="text-xs text-[#94A3B8] block mb-1">إجابات خاطئة</span>
            <span className="text-3xl sm:text-4xl font-black text-[#FB7185] font-mono-numbers">
              {incorrectCount}
            </span>
            <span className="text-[10px] text-[#FB7185] font-semibold mt-1 block">خطأ</span>
          </div>
        </div>

        {/* Global Rank highlight */}
        {currentRank && (
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-white mb-8">
            <Award className="w-5 h-5 text-[#2DD4BF]" />
            <span className="text-xs sm:text-sm font-bold">
              ترتيبك الحالي في لوحة المتصدرين العالمية: <b className="text-[#2DD4BF] font-mono-numbers font-black text-base">#{currentRank}</b>
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onGoToLeaderboard}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#2DD4BF] text-white font-bold text-sm shadow-lg shadow-[#7C3AED]/30 hover:opacity-95 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>مشاهدة لوحة الشرف (Top 10)</span>
          </button>

          <button
            onClick={onGoToDashboard}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 cursor-pointer"
          >
            <span>العودة للوحة التحكم</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-[#2DD4BF]" />
            <h2 className="text-lg font-black text-white">مراجعة الإجابات التفصيلية</h2>
          </div>
          <span className="text-xs text-[#94A3B8]">
            تم التحقق والتصحيح الخادمي
          </span>
        </div>

        <div className="space-y-4">
          {submission.details?.map((item, index) => {
            const isCorrect = item.isCorrect;
            const letters = ['أ', 'ب', 'ج', 'د'];

            return (
              <div
                key={item.questionId || index}
                className={`p-5 rounded-2xl border transition-all ${
                  isCorrect
                    ? 'bg-[#2DD4BF]/5 border-[#2DD4BF]/20'
                    : 'bg-[#FB7185]/5 border-[#FB7185]/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 font-mono-numbers ${
                        isCorrect ? 'bg-[#2DD4BF] text-[#0B1020]' : 'bg-[#FB7185] text-white'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white text-right leading-relaxed">
                      {item.questionText}
                    </h4>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shrink-0 ${
                      isCorrect
                        ? 'bg-[#2DD4BF]/15 text-[#2DD4BF] border border-[#2DD4BF]/30'
                        : 'bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>+1 نقطة</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>0 نقطة</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                  {item.options.map((optText, optIdx) => {
                    const isSelected = item.selectedOptionIndex === optIdx;
                    const isTheCorrectOne = item.correctOptionIndex === optIdx;

                    let bgStyle = 'bg-[#0B1020] text-[#94A3B8] border-white/5';
                    if (isTheCorrectOne) {
                      bgStyle = 'bg-[#2DD4BF]/20 text-[#2DD4BF] border-[#2DD4BF]/40 font-bold';
                    } else if (isSelected && !isCorrect) {
                      bgStyle = 'bg-[#FB7185]/20 text-[#FB7185] border-[#FB7185]/40 font-bold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border ${bgStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono-numbers font-bold">[{letters[optIdx]}]</span>
                          <span>{optText}</span>
                        </div>
                        {isTheCorrectOne && (
                          <span className="text-[10px] bg-[#2DD4BF] text-[#0B1020] px-1.5 py-0.5 rounded font-bold">
                            الإجابة الصحيحة
                          </span>
                        )}
                        {isSelected && !isTheCorrectOne && (
                          <span className="text-[10px] bg-[#FB7185] text-white px-1.5 py-0.5 rounded font-bold">
                            إجابتك
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
