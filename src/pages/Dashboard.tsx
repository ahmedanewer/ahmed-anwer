import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Subject, Exam, LeaderboardEntry, ExamHistoryItem } from '../types';
import { api } from '../services/api';
import { socketClient, SocketMessage } from '../services/websocket';
import {
  Trophy,
  Flame,
  Radio,
  BookOpen,
  ArrowRight,
  ChevronLeft,
  Crown,
  Sparkles,
  Clock,
  Award,
  Zap
} from 'lucide-react';

interface DashboardProps {
  onSelectTab: (tab: string) => void;
  onJoinExam: (examId: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectTab,
  onJoinExam,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    Promise.all([
      api.getSubjects(),
      api.getExams(),
      api.getLeaderboard(),
      isAuthenticated ? api.getStudentStats().catch(() => ({ history: [] })) : Promise.resolve({ history: [] })
    ])
      .then(([subjRes, examRes, leadRes, statsRes]: any) => {
        setSubjects(subjRes.subjects || []);
        setExams(examRes.exams || []);
        setLeaderboard((leadRes.leaderboard || []).slice(0, 5));
        setHistory(statsRes.history || []);
      })
      .catch((err) => console.error('Failed to load dashboard data:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();

    const unsubscribe = socketClient.subscribe((msg: SocketMessage) => {
      if (
        msg.type === 'WAITING_ROOM_UPDATE' ||
        msg.type === 'EXAM_STARTED' ||
        msg.type === 'EXAM_ENDED' ||
        msg.type === 'LEADERBOARD_UPDATE'
      ) {
        loadData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  const activeLiveExams = exams.filter((e) => e.status === 'live' || e.status === 'waiting');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* 1. Hero Esports Welcome Banner */}
      <div className="relative bg-gradient-to-r from-[#111827] via-[#161F36] to-[#111827] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden">
        {/* Neon Glow accents */}
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-[#2DD4BF]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="text-center lg:text-right max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#E9D5FF] text-xs font-bold mb-4">
              <Zap className="w-3.5 h-3.5 text-[#2DD4BF]" />
              <span>الموسم التنافسي المباشر الأول</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {isAuthenticated && user ? (
                <>
                  أهلاً بك في ساحة التحدي،{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#2DD4BF] via-white to-[#E9D5FF]">
                    {user.fullName}
                  </span>
                </>
              ) : (
                <>
                  أكبر منصة تنافسية للاختبارات{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] via-[#2DD4BF] to-white">
                    في الوقت الفعلي
                  </span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-[#94A3B8] mt-3 leading-relaxed">
              انضم إلى غرف الانتظار المتزامنة، تنافس مع زملائك في نفس اللحظة فور إشارة البداية من المشرف، واكسب النقاط للوصول إلى قمة لوحة الشرف العالمية!
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-6">
              <button
                onClick={() => onSelectTab('live-exams')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#2DD4BF] text-white font-black text-sm shadow-xl shadow-[#7C3AED]/30 hover:opacity-95 transition-opacity cursor-pointer"
              >
                <Radio className="w-4 h-4 text-[#FB7185] animate-pulse" />
                <span>دخول الاختبارات المباشرة</span>
              </button>

              <button
                onClick={() => onSelectTab('leaderboard')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/10 transition-colors cursor-pointer"
              >
                <Trophy className="w-4 h-4 text-[#2DD4BF]" />
                <span>مشاهدة لوحة الصدارة</span>
              </button>
            </div>
          </div>

          {/* User Score & Rank Highlight (or CTA if guest) */}
          {isAuthenticated && user ? (
            <div className="w-full lg:w-80 bg-[#0B1020]/90 border border-white/10 rounded-2xl p-6 shadow-xl text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#E9D5FF] mb-4">
                <Crown className="w-4 h-4 text-[#2DD4BF]" />
                <span>بطاقة إحصائياتك الحالية</span>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 mb-4">
                <span className="text-xs text-[#94A3B8] block mb-1">النقاط التراكمية</span>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-4xl font-black text-[#2DD4BF] font-mono-numbers">
                    {user.totalPoints}
                  </span>
                  <span className="text-xs text-white font-bold">نقطة</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs px-2">
                <span className="text-[#94A3B8]">ترتيبك العالمي:</span>
                <span className="font-mono-numbers font-black text-white bg-[#7C3AED]/30 px-2.5 py-1 rounded-lg border border-[#7C3AED]/40">
                  {user.rank ? `#${user.rank}` : 'غير مصنف'}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full lg:w-80 bg-[#0B1020]/90 border border-[#7C3AED]/40 rounded-2xl p-6 shadow-xl text-center">
              <Sparkles className="w-8 h-8 text-[#2DD4BF] mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-2">ابدأ رحلتك التنافسية</h3>
              <p className="text-xs text-[#94A3B8] mb-5">
                سجل حسابك في ثوانٍ لتحفظ نقاطك وتنافس على المراكز الأولى
              </p>
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-3 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
              >
                إنشاء حساب طالب الآن
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Active Live Room Alert Bar (If any exam is waiting or live) */}
      {activeLiveExams.length > 0 && (
        <div className="bg-gradient-to-r from-[#FB7185]/20 via-[#111827] to-[#2DD4BF]/20 border border-[#FB7185]/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FB7185] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FB7185]"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-[#FB7185]">
                  ● LIVE BROADCAST ACTIVE
                </span>
                <span className="text-xs text-white font-bold">
                  يوجد اختبار مفتوح الآن في غرفة الانتظار!
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                {activeLiveExams[0].title} ({activeLiveExams[0].waitingCount || 0} طالب جاهز)
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (!isAuthenticated) onOpenAuth('login');
              else onJoinExam(activeLiveExams[0].id);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#FB7185] hover:bg-[#E11D48] text-white font-bold text-xs shadow-md transition-colors cursor-pointer shrink-0"
          >
            انضم لغرفة الانتظار الآن
          </button>
        </div>
      )}

      {/* 3. Main Grid: Available Live Exams & Leaderboard Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Live Exams & Subjects (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Live Exams Section */}
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#2DD4BF]" />
                <h2 className="text-xl font-bold text-white">الاختبارات التنافسية المتاحة</h2>
              </div>
              <button
                onClick={() => onSelectTab('live-exams')}
                className="text-xs font-bold text-[#2DD4BF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>عرض الكل</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {exams.length === 0 ? (
              <div className="p-8 text-center bg-[#0B1020] rounded-2xl border border-white/5">
                <Radio className="w-10 h-10 text-[#64748B] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[#94A3B8]">لا توجد امتحانات منشورة حالياً في المنصة.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {exams.slice(0, 4).map((exam) => {
                  const isLive = exam.status === 'live';
                  const isWaiting = exam.status === 'waiting';

                  return (
                    <div
                      key={exam.id}
                      className="p-4 sm:p-5 rounded-2xl bg-[#0B1020] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#E9D5FF] border border-[#7C3AED]/30">
                            {exam.subjectName}
                          </span>

                          {isLive ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] animate-ping" />
                              مباشر الآن
                            </span>
                          ) : isWaiting ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
                              غرفة الانتظار مفتوحة ({exam.waitingCount || 0})
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#64748B]">في وضع الاستعداد</span>
                          )}
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                          {exam.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#2DD4BF]" />
                            <span>{exam.durationMinutes} دقيقة</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-[#E9D5FF]" />
                            <span>{exam.totalQuestions} سؤال</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!isAuthenticated) onOpenAuth('login');
                          else onJoinExam(exam.id);
                        }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          isWaiting || isLive
                            ? 'bg-gradient-to-r from-[#7C3AED] to-[#2DD4BF] text-white shadow-md shadow-[#7C3AED]/30 hover:opacity-95'
                            : 'bg-white/10 hover:bg-white/15 text-white'
                        }`}
                      >
                        {isWaiting || isLive ? 'دخول الغرفة' : 'تفاصيل الامتحان'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subjects Preview */}
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#7C3AED]" />
                <h2 className="text-xl font-bold text-white">المواد الدراسية</h2>
              </div>
              <button
                onClick={() => onSelectTab('subjects')}
                className="text-xs font-bold text-[#2DD4BF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>عرض الكل</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {subjects.length === 0 ? (
              <div className="p-8 text-center bg-[#0B1020] rounded-2xl border border-white/5">
                <BookOpen className="w-10 h-10 text-[#64748B] mx-auto mb-2 opacity-50" />
                <p className="text-xs text-[#94A3B8]">لا توجد مواد دراسية مسجلة حالياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subjects.slice(0, 4).map((subj) => (
                  <div
                    key={subj.id}
                    onClick={() => onSelectTab('subjects')}
                    className="p-4 rounded-2xl bg-[#0B1020] border border-white/5 hover:border-white/15 transition-all cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-[#2DD4BF]" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-white truncate">{subj.name}</h4>
                      <p className="text-xs text-[#94A3B8] truncate">{subj.description || 'مادة تفاعلية'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leaderboard Top 5 Preview & Quick History (1 col) */}
        <div className="space-y-8">
          {/* Top 5 Leaderboard Preview */}
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#2DD4BF]" />
                <h3 className="text-base font-bold text-white">قمة المتصدرين (Top 5)</h3>
              </div>
              <button
                onClick={() => onSelectTab('leaderboard')}
                className="text-xs text-[#2DD4BF] font-bold hover:underline cursor-pointer"
              >
                اللوحة الكاملة &larr;
              </button>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-6 text-center bg-[#0B1020] rounded-2xl border border-white/5">
                <p className="text-xs text-[#94A3B8]">بانتظار تسجيل النتائج الأولى...</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {leaderboard.map((entry) => {
                  const isFirst = entry.rank === 1;
                  const isMe = entry.userId === user?.id;

                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isFirst
                          ? 'bg-[#1E1B4B]/70 border-amber-400/40 text-amber-300'
                          : isMe
                          ? 'bg-[#7C3AED]/20 border-[#7C3AED]/50 text-white'
                          : 'bg-[#0B1020] border-white/5 text-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs font-mono-numbers shrink-0 ${
                            isFirst ? 'bg-amber-400 text-[#0B1020]' : 'bg-white/5 text-[#94A3B8]'
                          }`}
                        >
                          {entry.rank}
                        </span>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">{entry.fullName}</p>
                          <span className="text-[10px] text-[#64748B]">
                            {entry.examsCompleted} اختبارات
                          </span>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1 shrink-0 font-mono-numbers font-black text-[#2DD4BF] text-sm">
                        <span>{entry.totalPoints}</span>
                        <span className="text-[10px] text-[#94A3B8] font-normal">نقطة</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Student Exam Results Preview */}
          {isAuthenticated && history.length > 0 && (
            <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#E9D5FF]" />
                  <h4 className="text-sm font-bold text-white">آخر نتائجك</h4>
                </div>
                <button
                  onClick={() => onSelectTab('profile')}
                  className="text-xs text-[#2DD4BF] font-semibold hover:underline cursor-pointer"
                >
                  السجل &larr;
                </button>
              </div>

              <div className="space-y-2">
                {history.slice(0, 3).map((item) => (
                  <div
                    key={item.submissionId}
                    className="p-3 rounded-xl bg-[#0B1020] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="truncate">
                      <p className="font-bold text-white truncate">{item.examTitle}</p>
                      <span className="text-[10px] text-[#64748B]">{item.subjectName}</span>
                    </div>
                    <div className="text-left font-mono-numbers">
                      <span className="font-black text-[#2DD4BF]">+{item.score}</span>
                      <span className="text-[#64748B]"> / {item.totalQuestions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
