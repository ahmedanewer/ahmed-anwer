import React, { useEffect, useState } from 'react';
import { StudentStats, ExamHistoryItem } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Calendar,
  Percent,
  Flame
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getStudentStats()
      .then((res) => {
        setStats(res.student);
        setHistory(res.history || []);
      })
      .catch((err) => console.error('Failed to load student stats:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#94A3B8]">جاري تحميل سجلك الأكاديمي...</p>
      </div>
    );
  }

  const student = stats || {
    id: user?.id || '',
    fullName: user?.fullName || 'متنافس',
    email: user?.email || '',
    totalPoints: user?.totalPoints || 0,
    currentRank: user?.rank || '-',
    totalExamsCompleted: 0,
    totalCorrectAnswers: 0,
    totalIncorrectAnswers: 0,
    accuracyRate: 0
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Student Profile Hero Header */}
      <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-[#2DD4BF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-right">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#2DD4BF] p-[3px] shadow-[0_0_30px_rgba(124,58,237,0.4)] shrink-0">
            <div className="w-full h-full bg-[#0B1020] rounded-[21px] flex items-center justify-center font-black text-white text-3xl">
              {student.fullName.substring(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {student.fullName}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#7C3AED]/30 text-[#E9D5FF] border border-[#7C3AED]/40">
                حساب طالب متنافس
              </span>
            </div>

            <p className="text-xs text-[#94A3B8] font-mono-numbers mb-4" dir="ltr">
              {student.email}
            </p>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1020] border border-white/10 text-xs font-semibold text-[#2DD4BF]">
                <Trophy className="w-4 h-4 text-[#2DD4BF]" />
                <span className="font-mono-numbers font-black">{student.totalPoints}</span>
                <span>نقطة مكتسبة</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1020] border border-white/10 text-xs font-semibold text-[#E9D5FF]">
                <Award className="w-4 h-4 text-[#E9D5FF]" />
                <span>الترتيب العالمي:</span>
                <span className="font-mono-numbers font-black text-[#2DD4BF]">
                  {student.currentRank !== '-' ? `#${student.currentRank}` : 'غير مصنف'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stats Grid Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#94A3B8] font-bold">الاختبارات المنجزة</span>
            <BookOpen className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
            {student.totalExamsCompleted}
          </div>
          <span className="text-[10px] text-[#64748B] block mt-1">اختبار مباشر مكتمل</span>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#94A3B8] font-bold">إجابات صحيحة (+1 pt)</span>
            <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#2DD4BF] font-mono-numbers">
            {student.totalCorrectAnswers}
          </div>
          <span className="text-[10px] text-[#2DD4BF] block mt-1">إجمالي النقاط المكتسبة</span>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#94A3B8] font-bold">إجابات خاطئة</span>
            <XCircle className="w-4 h-4 text-[#FB7185]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#FB7185] font-mono-numbers">
            {student.totalIncorrectAnswers}
          </div>
          <span className="text-[10px] text-[#64748B] block mt-1">بدون خصم نقاط</span>
        </div>

        <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#94A3B8] font-bold">معدل الإتقان</span>
            <Percent className="w-4 h-4 text-[#E9D5FF]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#E9D5FF] font-mono-numbers">
            {student.accuracyRate}%
          </div>
          <span className="text-[10px] text-[#64748B] block mt-1">نسبة الإجابات الصحيحة</span>
        </div>
      </div>

      {/* Exam History Table */}
      <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#2DD4BF]" />
            <h2 className="text-lg font-black text-white">سجل الاختبارات المباشرة السابقة</h2>
          </div>
          <span className="text-xs text-[#94A3B8]">
            {history.length} اختبارات مسجلة
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center bg-[#0B1020] rounded-2xl border border-white/5">
            <BookOpen className="w-10 h-10 text-[#64748B] mx-auto mb-2 opacity-50" />
            <p className="text-xs text-[#94A3B8]">لم تخض أي اختبارات بعد. انضم لغرف الانتظار الآن!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => {
              const dateStr = new Date(item.submittedAt).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={item.submissionId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0B1020]/70 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#E9D5FF] border border-[#7C3AED]/30">
                        {item.subjectName}
                      </span>
                      <h4 className="text-sm font-bold text-white">{item.examTitle}</h4>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                    <div className="text-right sm:text-left">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-[#2DD4BF] font-mono-numbers">
                          {item.score}
                        </span>
                        <span className="text-xs text-[#94A3B8]">/ {item.totalQuestions}</span>
                      </div>
                      <span className="text-[10px] text-[#2DD4BF] font-semibold">+{item.score} نقطة</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
