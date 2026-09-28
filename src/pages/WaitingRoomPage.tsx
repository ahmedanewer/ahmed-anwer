import React, { useEffect, useState } from 'react';
import { Exam, WaitingParticipant } from '../types';
import { api } from '../services/api';
import { socketClient, SocketMessage } from '../services/websocket';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Radio,
  Clock,
  ArrowRight,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Hourglass
} from 'lucide-react';

interface WaitingRoomPageProps {
  examId: string;
  onStartExam: (exam: Exam, serverStartTime: number, serverEndTime: number) => void;
  onBack: () => void;
}

export const WaitingRoomPage: React.FC<WaitingRoomPageProps> = ({
  examId,
  onStartExam,
  onBack,
}) => {
  const { user } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [participants, setParticipants] = useState<WaitingParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Fetch initial exam data
  useEffect(() => {
    let mounted = true;
    api
      .getExamById(examId)
      .then((res) => {
        if (!mounted) return;
        setExam(res.exam);
        // If already live, auto redirect
        if (res.exam.status === 'live' && res.exam.liveEndsAt && res.exam.liveEndsAt > Date.now()) {
          onStartExam(res.exam, res.exam.liveStartedAt || Date.now(), res.exam.liveEndsAt);
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'فشل في تحميل بيانات الامتحان');
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [examId, onStartExam]);

  // Join WebSocket waiting room
  useEffect(() => {
    if (!user) return;

    socketClient.joinRoom(examId, {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    });

    const unsubscribe = socketClient.subscribe((msg: SocketMessage) => {
      if (msg.examId !== examId) return;

      if (msg.type === 'WAITING_ROOM_UPDATE') {
        if (msg.participants) {
          setParticipants(msg.participants);
        }
      } else if (msg.type === 'EXAM_STARTED' || msg.type === 'EXAM_ALREADY_LIVE') {
        // Synchronized start event from server!
        const serverStart = msg.serverStartTime || Date.now();
        const serverEnd = msg.serverEndTime || Date.now() + (exam?.durationMinutes || 10) * 60 * 1000;

        // Trigger synchronized countdown effect (3..2..1)
        setCountdown(3);
        const timer1 = setTimeout(() => setCountdown(2), 700);
        const timer2 = setTimeout(() => setCountdown(1), 1400);
        const timer3 = setTimeout(() => {
          if (exam) {
            onStartExam(exam, serverStart, serverEnd);
          } else {
            api.getExamById(examId).then((res) => {
              onStartExam(res.exam, serverStart, serverEnd);
            });
          }
        }, 2100);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
        };
      } else if (msg.type === 'EXAM_ENDED') {
        setError('تم إنهاء هذا الاختبار من قِبل المشرف');
      }
    });

    return () => {
      unsubscribe();
      socketClient.leaveRoom();
    };
  }, [examId, user, exam, onStartExam]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#94A3B8]">جاري الاتصال بغرفة الانتظار المباشرة...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-[#111827] border border-white/10 rounded-2xl text-center">
        <ShieldAlert className="w-12 h-12 text-[#FB7185] mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">تعذر دخول غرفة الانتظار</h3>
        <p className="text-sm text-[#94A3B8] mb-6">{error || 'الامتحان غير متاح حالياً'}</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
        >
          العودة للاختبارات
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      {/* Starting Launch Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B1020]/95 backdrop-blur-xl animate-fade-in">
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/40 mb-4 inline-block">
              EXAM STARTING NOW
            </span>
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-6">
              الامتحان ينطلق الآن!
            </h2>
            <div className="relative inline-flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#2DD4BF] p-1 shadow-[0_0_60px_rgba(124,58,237,0.6)]">
              <div className="w-full h-full bg-[#0B1020] rounded-full flex items-center justify-center">
                <span className="text-7xl font-black text-white font-mono-numbers animate-pulse">
                  {countdown}
                </span>
              </div>
            </div>
            <p className="text-sm text-[#2DD4BF] mt-6 font-semibold">
              جاري مزامنة الأسئلة لجميع المتنافسين...
            </p>
          </div>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            onBack();
          }
        }}
        className="flex items-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة لقائمة الاختبارات</span>
      </button>

      {/* Main Room Container */}
      <div className="bg-[#111827]/90 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#2DD4BF]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FB7185] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FB7185]"></span>
            </span>
            <span className="text-xs font-black tracking-wider text-[#FB7185] uppercase">
              غرفة الانتظار التنافسية المباشرة
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-[#94A3B8]">
            <div className="flex items-center gap-1.5 bg-[#0B1020] px-3 py-1.5 rounded-xl border border-white/5">
              <Clock className="w-4 h-4 text-[#2DD4BF]" />
              <span>مدة الاختبار: {exam.durationMinutes} دقيقة</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0B1020] px-3 py-1.5 rounded-xl border border-white/5">
              <Flame className="w-4 h-4 text-[#E9D5FF]" />
              <span>{exam.totalQuestions} سؤال</span>
            </div>
          </div>
        </div>

        {/* Exam Title & Subject */}
        <div className="text-center my-8">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#7C3AED]/20 text-[#E9D5FF] border border-[#7C3AED]/30">
            {exam.subjectName || 'مادة دراسية'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white mt-3 mb-2">
            {exam.title}
          </h1>
          {exam.description && (
            <p className="text-sm text-[#94A3B8] max-w-lg mx-auto">
              {exam.description}
            </p>
          )}
        </div>

        {/* Live Status Counter Banner */}
        <div className="bg-gradient-to-r from-[#7C3AED]/20 via-[#111827] to-[#2DD4BF]/20 border border-[#7C3AED]/30 rounded-2xl p-6 text-center mb-8 relative">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Radio className="w-6 h-6 text-[#2DD4BF] animate-pulse" />
            <h2 className="text-lg sm:text-xl font-black text-white">
              عدد المتنافسين الجاهزين في الغرفة
            </h2>
          </div>

          <div className="flex items-baseline justify-center gap-2">
            <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#E9D5FF] to-[#2DD4BF] font-mono-numbers">
              {participants.length}
            </span>
            <span className="text-sm text-[#94A3B8] font-bold">طالب جاهز</span>
          </div>

          {/* Pulse Status message */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B1020]/90 border border-white/10 text-xs font-semibold text-[#E9D5FF]">
            <Hourglass className="w-4 h-4 text-[#2DD4BF] animate-spin" />
            <span>في انتظار إشارة المشرف لإطلاق الامتحان لجميع الطلاب معاً...</span>
          </div>
        </div>

        {/* Waiting Participants List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Users className="w-4 h-4 text-[#2DD4BF]" />
              <span>قائمة المتنافسين المتصلين حالياً</span>
            </div>
            <span className="text-xs text-[#94A3B8]">
              يتم التحديث المباشر فور انضمام أي طالب
            </span>
          </div>

          {participants.length === 0 ? (
            <div className="p-8 text-center bg-[#0B1020] rounded-2xl border border-white/5">
              <p className="text-xs text-[#94A3B8]">أنت أول الواصلين إلى هذه الغرفة!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
              {participants.map((p, index) => {
                const isMe = p.userId === user?.id;
                return (
                  <div
                    key={p.userId}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isMe
                        ? 'bg-[#7C3AED]/20 border-[#7C3AED]/50 text-white'
                        : 'bg-[#0B1020]/70 border-white/5 text-[#CBD5E1]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          isMe
                            ? 'bg-[#7C3AED] text-white'
                            : 'bg-white/10 text-[#94A3B8]'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <span className="text-xs font-bold truncate">
                        {p.fullName}
                      </span>
                    </div>

                    {isMe ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2DD4BF] text-[#0B1020] shrink-0">
                        أنت
                      </span>
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Rules Notice */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2DD4BF]" />
            <span>نظام البدء المتزامن: سيبدأ العداد للجميع في أجزاء من الثانية فور ضغط المشرف.</span>
          </div>
          <span className="font-mono-numbers text-[#64748B]">SYNCHRONIZED ENGINE ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
