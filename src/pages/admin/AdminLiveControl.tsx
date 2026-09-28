import React, { useEffect, useState } from 'react';
import { Exam, WaitingParticipant, ExamSubmission } from '../../types';
import { api } from '../../services/api';
import { socketClient, SocketMessage } from '../../services/websocket';
import {
  Radio,
  Users,
  Play,
  RotateCcw,
  StopCircle,
  Clock,
  Flame,
  Award,
  CheckCircle2,
  AlertTriangle,
  Send
} from 'lucide-react';

interface AdminLiveControlProps {
  initialExamId?: string | null;
}

export const AdminLiveControl: React.FC<AdminLiveControlProps> = ({ initialExamId }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [exam, setExam] = useState<Exam | null>(null);
  const [participants, setParticipants] = useState<WaitingParticipant[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch all exams
  const fetchExams = () => {
    api
      .getExams(true)
      .then((res) => {
        const list = res.exams || [];
        setExams(list);
        if (!selectedExamId && list.length > 0) {
          setSelectedExamId(list[0].id);
        }
      })
      .catch((err) => console.error('Failed to load exams:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // Fetch current exam details & submissions
  const loadExamDetails = (id: string) => {
    if (!id) return;
    api
      .getExamById(id)
      .then((res) => {
        setExam(res.exam);
      })
      .catch((err) => console.error('Failed to get exam:', err));

    api
      .getAdminExamResults(id)
      .then((res) => {
        setSubmissions(res.submissions || []);
      })
      .catch((err) => console.error('Failed to get submissions:', err));
  };

  useEffect(() => {
    if (selectedExamId) {
      loadExamDetails(selectedExamId);

      // Join socket room as admin
      socketClient.joinRoom(selectedExamId, undefined, true);

      const unsubscribe = socketClient.subscribe((msg: SocketMessage) => {
        if (msg.examId !== selectedExamId) return;

        if (msg.type === 'WAITING_ROOM_UPDATE') {
          if (msg.participants) {
            setParticipants(msg.participants);
          }
        } else if (msg.type === 'EXAM_STARTED' || msg.type === 'EXAM_ENDED') {
          loadExamDetails(selectedExamId);
        } else if (msg.type === 'LEADERBOARD_UPDATE') {
          // Re-fetch submissions
          api.getAdminExamResults(selectedExamId).then((r) => setSubmissions(r.submissions || []));
        }
      });

      return () => {
        unsubscribe();
        socketClient.leaveRoom();
      };
    }
  }, [selectedExamId]);

  // Open waiting room
  const handleOpenWaitingRoom = async () => {
    if (!selectedExamId) return;
    setMessage(null);
    try {
      await api.openWaitingRoom(selectedExamId);
      loadExamDetails(selectedExamId);
      setMessage('تم فتح غرفة الانتظار بنجاح، يمكن للطلاب الانضمام الآن!');
    } catch (err: any) {
      alert(err.message || 'تعذر فتح غرفة الانتظار');
    }
  };

  // START EXAM (Simultaneous broadcast!)
  const handleStartExam = async () => {
    if (!selectedExamId) return;
    if (!confirm('هل أنت متأكد من إطلاق الامتحان المباشر الآن لجميع الطلاب المتصلين في غرفة الانتظار؟')) {
      return;
    }

    setIsStarting(true);
    setMessage(null);

    try {
      const res = await api.startLiveExam(selectedExamId);
      loadExamDetails(selectedExamId);
      setMessage(res.message || 'تم إطلاق الامتحان المباشر لجميع الطلاب في نفس اللحظة!');
    } catch (err: any) {
      alert(err.message || 'تعذر بدء الامتحان المباشر');
    } finally {
      setIsStarting(false);
    }
  };

  // End Live Exam
  const handleEndExam = async () => {
    if (!selectedExamId) return;
    if (!confirm('هل تريد إنهاء هذا الاختبار المباشر؟ سيتم إيقاف العداد لدى جميع الطلاب.')) {
      return;
    }

    try {
      await api.endLiveExam(selectedExamId);
      loadExamDetails(selectedExamId);
      setMessage('تم إنهاء الامتحان المباشر بنجاح');
    } catch (err: any) {
      alert(err.message || 'تعذر إنهاء الامتحان');
    }
  };

  // Reset exam
  const handleReset = async () => {
    if (!selectedExamId) return;
    if (!confirm('إعادة ضبط الامتحان إلى وضع الاستعداد؟')) return;

    try {
      await api.resetExam(selectedExamId);
      loadExamDetails(selectedExamId);
      setMessage('تمت إعادة ضبط حالة الاختبار');
    } catch (err: any) {
      alert(err.message || 'تعذر إعادة الضبط');
    }
  };

  const isLive = exam?.status === 'live';
  const isWaiting = exam?.status === 'waiting';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 text-xs font-bold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>محرك البث والتزامن الفوري</span>
          </div>
          <h2 className="text-xl font-black text-white">التحكم المباشر بغرف الانتظار والامتحانات</h2>
          <p className="text-xs text-[#94A3B8]">
            إطلاق الامتحانات لجميع الطلاب في نفس اللحظة عبر خادم التزامن في الوقت الفعلي
          </p>
        </div>

        {/* Select Exam */}
        {exams.length > 0 && (
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
          >
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.status === 'live' ? 'مباشر الآن' : e.status === 'waiting' ? 'غرفة الانتظار' : 'مغلق'})
              </option>
            ))}
          </select>
        )}
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-[#2DD4BF]/15 border border-[#2DD4BF]/30 text-[#2DD4BF] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {exams.length === 0 ? (
        <div className="p-12 text-center bg-[#111827] border border-white/10 rounded-3xl max-w-md mx-auto">
          <Radio className="w-12 h-12 text-[#64748B] mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-white mb-2">لا توجد امتحانات مسجلة</h3>
          <p className="text-xs text-[#94A3B8]">أنشئ امتحاناً أولاً ثم افتح له غرفة انتظار.</p>
        </div>
      ) : !exam ? (
        <div className="p-8 text-center text-[#94A3B8] text-xs">جاري تحميل الامتحان المحدد...</div>
      ) : (
        <div className="space-y-6">
          {/* Main Control Station Card */}
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#7C3AED]/20 text-[#E9D5FF] border border-[#7C3AED]/30">
                    {exam.subjectName}
                  </span>

                  {isLive ? (
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/40 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-[#FB7185]" />
                      الامتحان جاري الآن (LIVE)
                    </span>
                  ) : isWaiting ? (
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/40 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse" />
                      غرفة الانتظار مفتوحة للطلاب
                    </span>
                  ) : (
                    <span className="text-xs text-[#94A3B8] px-3 py-1 rounded-full bg-white/5 border border-white/10">
                      الامتحان في وضع الاستعداد (مغلق)
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-black text-white mb-2">{exam.title}</h3>
                <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#2DD4BF]" />
                    المدة: {exam.durationMinutes} دقيقة
                  </span>
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-[#E9D5FF]" />
                    الأسئلة: {exam.totalQuestions} أسئلة
                  </span>
                </div>
              </div>

              {/* Action Buttons Hub */}
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                {!isWaiting && !isLive && (
                  <button
                    onClick={handleOpenWaitingRoom}
                    disabled={exam.totalQuestions === 0}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs sm:text-sm shadow-xl shadow-[#7C3AED]/30 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    <span>فتح غرفة الانتظار للطلاب</span>
                  </button>
                )}

                {isWaiting && (
                  <button
                    onClick={handleStartExam}
                    disabled={isStarting}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FB7185] via-[#E11D48] to-[#9333EA] text-white font-black text-sm shadow-2xl shadow-[#FB7185]/40 hover:opacity-95 transition-all cursor-pointer animate-pulse"
                  >
                    <Radio className="w-5 h-5" />
                    <span>{isStarting ? 'جاري الإطلاق...' : 'بدء الامتحان الآن (START EXAM)'}</span>
                  </button>
                )}

                {isLive && (
                  <button
                    onClick={handleEndExam}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#FB7185] hover:bg-[#E11D48] text-white font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>إنهاء الامتحان فوراً</span>
                  </button>
                )}

                {(isLive || isWaiting) && (
                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
                    title="إعادة ضبط إلى وضع الاستعداد"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>إعادة ضبط</span>
                  </button>
                )}
              </div>
            </div>

            {/* Waiting Count Live Counter */}
            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0B1020] p-4 rounded-2xl border border-white/5 text-center">
                <span className="text-xs text-[#94A3B8] block mb-1">الطلاب في غرفة الانتظار</span>
                <span className="text-3xl font-black text-[#2DD4BF] font-mono-numbers">
                  {participants.length}
                </span>
                <span className="text-[10px] text-[#2DD4BF] block mt-1">متصل ومستعد حالياً</span>
              </div>

              <div className="bg-[#0B1020] p-4 rounded-2xl border border-white/5 text-center">
                <span className="text-xs text-[#94A3B8] block mb-1">إجمالي الأسئلة في الاختبار</span>
                <span className="text-3xl font-black text-[#E9D5FF] font-mono-numbers">
                  {exam.totalQuestions}
                </span>
                <span className="text-[10px] text-[#94A3B8] block mt-1">سؤال متعدد الخيارات</span>
              </div>

              <div className="bg-[#0B1020] p-4 rounded-2xl border border-white/5 text-center">
                <span className="text-xs text-[#94A3B8] block mb-1">الامتحانات المسلّمة</span>
                <span className="text-3xl font-black text-white font-mono-numbers">
                  {submissions.length}
                </span>
                <span className="text-[10px] text-[#64748B] block mt-1">طالب أتم التسليم</span>
              </div>
            </div>
          </div>

          {/* Connected Students Roster in Waiting Room */}
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2DD4BF]" />
                <h3 className="text-base font-bold text-white">
                  المتنافسون الحاضرون في غرفة الانتظار حالياً ({participants.length})
                </h3>
              </div>
              <span className="text-xs text-[#94A3B8]">تحديث فوري بالوقت الحقيقي</span>
            </div>

            {participants.length === 0 ? (
              <div className="p-8 text-center bg-[#0B1020] rounded-2xl border border-white/5">
                <p className="text-xs text-[#94A3B8]">
                  لا يوجد طلاب متصلون في غرفة الانتظار حالياً. فور دخول أي طالب سيظهر اسمه هنا تلقائياً.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                {participants.map((p, idx) => (
                  <div
                    key={p.userId}
                    className="p-3 rounded-xl bg-[#0B1020] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-lg bg-[#7C3AED]/20 text-[#E9D5FF] flex items-center justify-center font-bold text-[11px] font-mono-numbers shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-bold text-white truncate">{p.fullName}</p>
                        <span className="text-[10px] text-[#64748B] truncate">{p.email}</span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submissions & Results Stream */}
          {submissions.length > 0 && (
            <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#E9D5FF]" />
                  <h3 className="text-base font-bold text-white">
                    نتائج الطلاب الذين سلّموا هذا الاختبار ({submissions.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                {submissions.map((sub, i) => (
                  <div
                    key={sub.id}
                    className="p-3.5 rounded-xl bg-[#0B1020] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono-numbers font-bold text-[#94A3B8]">#{i + 1}</span>
                      <div>
                        <p className="font-bold text-white">{sub.studentName}</p>
                        <span className="text-[10px] text-[#64748B]">{sub.studentEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-left font-mono-numbers">
                        <span className="font-black text-[#2DD4BF] text-sm">+{sub.score}</span>
                        <span className="text-[#64748B]"> / {sub.totalQuestions}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
