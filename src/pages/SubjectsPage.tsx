import React, { useEffect, useState } from 'react';
import { Subject, Exam } from '../types';
import { api } from '../services/api';
import {
  BookOpen,
  ArrowRight,
  Flame,
  Clock,
  Radio,
  Sparkles,
  ChevronLeft
} from 'lucide-react';

interface SubjectsPageProps {
  onSelectExam: (examId: string) => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  onSelectExam,
  onOpenAuth,
  isAuthenticated
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getSubjects(), api.getExams()])
      .then(([subjRes, examRes]) => {
        setSubjects(subjRes.subjects || []);
        setExams(examRes.exams || []);
      })
      .catch((err) => console.error('Failed to load subjects:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const filteredExams = selectedSubjectId
    ? exams.filter((e) => e.subjectId === selectedSubjectId)
    : exams;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#E9D5FF] text-xs font-bold mb-3">
          <BookOpen className="w-3.5 h-3.5 text-[#2DD4BF]" />
          <span>المناهج والمجالات الأكاديمية</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white">
          المواد الدراسية وميادين التحدي
        </h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          اختر مادتك المفضلة للدخول في الاختبارات التنافسية المباشرة مع زملائك.
        </p>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-[#94A3B8]">جاري تحميل المواد الدراسية...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="p-12 text-center bg-[#111827] border border-white/10 rounded-3xl max-w-lg mx-auto">
          <BookOpen className="w-16 h-16 text-[#64748B] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">لا توجد مواد دراسية مسجلة حالياً</h3>
          <p className="text-xs text-[#94A3B8]">
            يقوم مشرف المنصة بإضافة المواد والاختبارات التنافسية قريباً.
          </p>
        </div>
      ) : (
        <div>
          {/* Subjects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {/* "All" Filter Card */}
            <div
              onClick={() => setSelectedSubjectId(null)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                selectedSubjectId === null
                  ? 'bg-gradient-to-r from-[#7C3AED]/20 to-[#2DD4BF]/10 border-[#7C3AED] shadow-lg shadow-[#7C3AED]/20'
                  : 'bg-[#111827] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 text-[#2DD4BF]" />
                </div>
                <span className="text-xs text-[#94A3B8] font-bold">
                  {exams.length} اختبارات
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">جميع المواد</h3>
              <p className="text-xs text-[#94A3B8]">عرض كافة الامتحانات المتاحة في المنصة</p>
            </div>

            {subjects.map((subj) => {
              const subjExams = exams.filter((e) => e.subjectId === subj.id);
              const isSelected = selectedSubjectId === subj.id;

              return (
                <div
                  key={subj.id}
                  onClick={() => setSelectedSubjectId(subj.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#7C3AED]/20 to-[#2DD4BF]/10 border-[#2DD4BF] shadow-lg shadow-[#2DD4BF]/20'
                      : 'bg-[#111827] border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center text-white">
                      <BookOpen className="w-5 h-5 text-[#2DD4BF]" />
                    </div>
                    <span className="text-xs font-bold text-[#E9D5FF] bg-white/5 px-2 py-0.5 rounded-md">
                      {subjExams.length} اختبار
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{subj.name}</h3>
                  <p className="text-xs text-[#94A3B8] line-clamp-2">
                    {subj.description || 'مادة دراسية تفاعلية'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Filtered Exams Section */}
          <div className="bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {selectedSubject ? `اختبارات مادة: ${selectedSubject.name}` : 'كافة الاختبارات المتاحة'}
                </h2>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  اختر امتحاناً للانضمام فوراً إلى غرفة الانتظار المباشرة
                </p>
              </div>

              <span className="text-xs font-bold text-[#2DD4BF]">
                {filteredExams.length} اختبار متوفر
              </span>
            </div>

            {filteredExams.length === 0 ? (
              <div className="p-8 text-center bg-[#0B1020] rounded-2xl border border-white/5">
                <p className="text-xs text-[#94A3B8]">
                  لا توجد اختبارات مسجلة لهذه المادة حالياً.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExams.map((exam) => {
                  const isLive = exam.status === 'live';
                  const isWaiting = exam.status === 'waiting';

                  return (
                    <div
                      key={exam.id}
                      className="bg-[#0B1020] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#E9D5FF] border border-[#7C3AED]/30">
                            {exam.subjectName || 'مادة عامة'}
                          </span>

                          {isLive ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FB7185] animate-ping" />
                              مباشر الآن
                            </span>
                          ) : isWaiting ? (
                            <span className="flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
                              غرفة الانتظار مفتوحة
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-[#64748B]">
                              قيد الإعداد
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-white mb-2">{exam.title}</h3>
                        {exam.description && (
                          <p className="text-xs text-[#94A3B8] mb-4 line-clamp-2">
                            {exam.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
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

                        <button
                          onClick={() => {
                            if (!isAuthenticated) {
                              onOpenAuth();
                            } else {
                              onSelectExam(exam.id);
                            }
                          }}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isWaiting || isLive
                              ? 'bg-gradient-to-r from-[#7C3AED] to-[#2DD4BF] text-white shadow-md shadow-[#7C3AED]/30 hover:opacity-95'
                              : 'bg-white/10 hover:bg-white/15 text-white'
                          }`}
                        >
                          <span>دخول الغرفة</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
