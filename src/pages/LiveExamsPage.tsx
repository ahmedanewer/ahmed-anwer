import React, { useEffect, useState } from 'react';
import { Exam } from '../types';
import { api } from '../services/api';
import { socketClient, SocketMessage } from '../services/websocket';
import {
  Radio,
  Clock,
  Flame,
  Users,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Search,
  Filter
} from 'lucide-react';

interface LiveExamsPageProps {
  onJoinExam: (examId: string) => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
}

export const LiveExamsPage: React.FC<LiveExamsPageProps> = ({
  onJoinExam,
  onOpenAuth,
  isAuthenticated,
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'waiting' | 'idle'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchExams = () => {
    api
      .getExams()
      .then((res) => {
        setExams(res.exams || []);
      })
      .catch((err) => console.error('Failed to load exams:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchExams();

    // Listen to real-time socket events
    const unsubscribe = socketClient.subscribe((msg: SocketMessage) => {
      if (
        msg.type === 'WAITING_ROOM_UPDATE' ||
        msg.type === 'EXAM_STARTED' ||
        msg.type === 'EXAM_ENDED'
      ) {
        fetchExams();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredExams = exams.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.subjectName && e.subjectName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    return e.status === filterStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] text-xs font-bold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>ساحة التنافس الحي المباشر</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">
            الاختبارات التنافسية المباشرة
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            ادخل غرفة الانتظار وتنافس في الوقت الفعلي مع باقي الطلاب فور إطلاق المشرف للامتحان.
          </p>
        </div>

        {/* Live counter badge */}
        <div className="flex items-center gap-3 bg-[#111827] px-4 py-2.5 rounded-2xl border border-white/10 self-start md:self-auto">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4BF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2DD4BF]"></span>
          </span>
          <div className="text-xs">
            <span className="text-[#94A3B8] block">غرف الانتظار النشطة:</span>
            <span className="text-white font-mono-numbers font-black">
              {exams.filter((e) => e.status === 'waiting' || e.status === 'live').length} غرف تنافس
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن اختبار أو مادة دراسية..."
            className="w-full bg-[#111827] border border-white/10 rounded-2xl px-4 py-3 pr-10 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
          />
          <Search className="absolute top-3.5 right-3.5 w-4 h-4 text-[#64748B]" />
        </div>

        <div className="flex items-center gap-1.5 bg-[#111827] p-1 rounded-2xl border border-white/5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              filterStatus === 'all'
                ? 'bg-[#7C3AED] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            الكل ({exams.length})
          </button>
          <button
            onClick={() => setFilterStatus('live')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              filterStatus === 'live'
                ? 'bg-[#FB7185] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-[#FB7185]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185]" />
            مباشر الآن
          </button>
          <button
            onClick={() => setFilterStatus('waiting')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              filterStatus === 'waiting'
                ? 'bg-[#2DD4BF] text-[#0B1020] shadow-md'
                : 'text-[#94A3B8] hover:text-[#2DD4BF]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" />
            غرفة الانتظار
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#FB7185] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-[#94A3B8]">جاري مزامنة بيانات الاختبارات المباشرة...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="p-12 text-center bg-[#111827] border border-white/10 rounded-3xl max-w-lg mx-auto">
          <Radio className="w-16 h-16 text-[#64748B] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">لا توجد اختبارات مطابقة</h3>
          <p className="text-xs text-[#94A3B8]">
            جرب تغيير معايير البحث أو انتظر حتى يفتح المشرف غرفة انتظار جديدة.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const isLive = exam.status === 'live';
            const isWaiting = exam.status === 'waiting';

            return (
              <div
                key={exam.id}
                className={`bg-[#111827] rounded-3xl p-6 border transition-all flex flex-col justify-between relative overflow-hidden group ${
                  isLive
                    ? 'border-[#FB7185]/40 hover:border-[#FB7185] shadow-[0_0_25px_rgba(251,113,133,0.15)]'
                    : isWaiting
                    ? 'border-[#2DD4BF]/40 hover:border-[#2DD4BF] shadow-[0_0_25px_rgba(45,212,191,0.15)]'
                    : 'border-white/5 hover:border-white/15'
                }`}
              >
                <div>
                  {/* Status header */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#7C3AED]/20 text-[#E9D5FF] border border-[#7C3AED]/30">
                      {exam.subjectName || 'مادة عامة'}
                    </span>

                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/40">
                        <span className="w-2 h-2 rounded-full bg-[#FB7185] animate-ping" />
                        ● LIVE EXAM
                      </span>
                    ) : isWaiting ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/40">
                        <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse" />
                        ● {exam.waitingCount || 0} STUDENTS READY
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-[#64748B]">
                        في وضع الاستعداد
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-white mb-2 leading-tight">
                    {exam.title}
                  </h3>

                  {exam.description && (
                    <p className="text-xs text-[#94A3B8] mb-6 line-clamp-2">
                      {exam.description}
                    </p>
                  )}

                  {/* Metrics bar */}
                  <div className="grid grid-cols-2 gap-2 bg-[#0B1020] p-3 rounded-2xl border border-white/5 mb-6">
                    <div className="flex items-center gap-2 text-xs text-[#CBD5E1]">
                      <Clock className="w-4 h-4 text-[#2DD4BF]" />
                      <span>{exam.durationMinutes} دقيقة</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-[#CBD5E1]">
                      <Flame className="w-4 h-4 text-[#E9D5FF]" />
                      <span>{exam.totalQuestions} أسئلة</span>
                    </div>
                  </div>
                </div>

                {/* Join action */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        onOpenAuth();
                      } else {
                        onJoinExam(exam.id);
                      }
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                      isLive
                        ? 'bg-gradient-to-r from-[#FB7185] to-[#E11D48] text-white shadow-lg shadow-[#FB7185]/30 hover:opacity-95'
                        : isWaiting
                        ? 'bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#2DD4BF] text-white shadow-lg shadow-[#7C3AED]/30 hover:opacity-95'
                        : 'bg-white/10 hover:bg-white/15 text-white'
                    }`}
                  >
                    <span>
                      {isLive
                        ? 'دخول الامتحان المباشر الجاري'
                        : isWaiting
                        ? 'دخول غرفة الانتظار الآن'
                        : 'عرض تفاصيل الامتحان'}
                    </span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
