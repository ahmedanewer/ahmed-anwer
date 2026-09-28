import React, { useEffect, useState } from 'react';
import { Exam, Subject } from '../../types';
import { api } from '../../services/api';
import {
  Radio,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Flame,
  HelpCircle,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  X,
  ExternalLink
} from 'lucide-react';

interface AdminExamsProps {
  onManageQuestions: (examId: string) => void;
  onOpenLiveControl: (examId: string) => void;
}

export const AdminExams: React.FC<AdminExamsProps> = ({
  onManageQuestions,
  onOpenLiveControl,
}) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  // Form states
  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = () => {
    Promise.all([api.getExams(true), api.getSubjects(true)])
      .then(([examRes, subjRes]) => {
        setExams(examRes.exams || []);
        setSubjects(subjRes.subjects || []);
        if (subjRes.subjects && subjRes.subjects.length > 0 && !subjectId) {
          setSubjectId(subjRes.subjects[0].id);
        }
      })
      .catch((err) => console.error('Failed to load exams data:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingExam(null);
    setTitle('');
    setDescription('');
    setDurationMinutes(10);
    setError(null);
    if (subjects.length > 0) {
      setSubjectId(subjects[0].id);
    }
    setModalOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setSubjectId(exam.subjectId);
    setTitle(exam.title);
    setDescription(exam.description || '');
    setDurationMinutes(exam.durationMinutes || 10);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) {
      setError('يرجى اختيار مادة دراسية أولاً');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      if (editingExam) {
        await api.updateExam(editingExam.id, {
          subjectId,
          title,
          description,
          durationMinutes: Number(durationMinutes),
        });
      } else {
        await api.createExam({
          subjectId,
          title,
          description,
          durationMinutes: Number(durationMinutes),
        });
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الامتحان');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, examTitle: string) => {
    if (!confirm(`هل أنت متأكد من حذف اختبار "${examTitle}"؟ سيتم حذف جميع الأسئلة والنتائج المرتبطة به.`)) {
      return;
    }

    try {
      await api.deleteExam(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'تعذر حذف الامتحان');
    }
  };

  const handleToggleActive = async (exam: Exam) => {
    try {
      await api.updateExam(exam.id, { isActive: !exam.isActive });
      fetchData();
    } catch (err: any) {
      alert(err.message || 'تعذر تغيير حالة الامتحان');
    }
  };

  const handleOpenWaitingRoom = async (examId: string) => {
    try {
      await api.openWaitingRoom(examId);
      fetchData();
      onOpenLiveControl(examId);
    } catch (err: any) {
      alert(err.message || 'تعذر فتح غرفة الانتظار');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white">إدارة الاختبارات والامتحانات</h2>
          <p className="text-xs text-[#94A3B8]">
            إنشاء الاختبارات، وتحديد المدة الزمنية، وفتح غرف الانتظار
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2DD4BF] text-[#0B1020] hover:bg-[#14b8a6] font-bold text-xs shadow-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء امتحان جديد</span>
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#2DD4BF] border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-[#94A3B8]">جاري تحميل الامتحانات...</p>
        </div>
      ) : exams.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-[#111827] border border-white/10 rounded-3xl max-w-md mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-[#2DD4BF]/20 border border-[#2DD4BF]/30 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-7 h-7 text-[#2DD4BF]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">لا توجد امتحانات حتى الآن</h3>
          <p className="text-xs text-[#94A3B8] mb-6">
            قم بإنشاء أول اختبار تنافسي وحدد مدته بالدقائق ثم أضف الأسئلة إليه.
          </p>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2DD4BF] text-[#0B1020] hover:bg-[#14b8a6] font-bold text-xs shadow-lg mx-auto transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء امتحان</span>
          </button>
        </div>
      ) : (
        /* Exams Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const isLive = exam.status === 'live';
            const isWaiting = exam.status === 'waiting';

            return (
              <div
                key={exam.id}
                className="bg-[#111827] border border-white/10 rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#7C3AED]/20 text-[#E9D5FF] border border-[#7C3AED]/30">
                      {exam.subjectName}
                    </span>

                    <button
                      onClick={() => handleToggleActive(exam)}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                        exam.isActive
                          ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30'
                          : 'bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30'
                      }`}
                    >
                      {exam.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{exam.isActive ? 'مفعل' : 'معطل'}</span>
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{exam.title}</h3>
                  {exam.description && (
                    <p className="text-xs text-[#94A3B8] line-clamp-2 mb-4">
                      {exam.description}
                    </p>
                  )}

                  {/* Exam metadata */}
                  <div className="grid grid-cols-2 gap-2 bg-[#0B1020] p-2.5 rounded-xl border border-white/5 mb-4 text-xs">
                    <div className="flex items-center gap-1 text-[#CBD5E1]">
                      <Clock className="w-3.5 h-3.5 text-[#2DD4BF]" />
                      <span>{exam.durationMinutes} دقيقة</span>
                    </div>

                    <div className="flex items-center gap-1 text-[#CBD5E1]">
                      <Flame className="w-3.5 h-3.5 text-[#E9D5FF]" />
                      <span>{exam.totalQuestions} أسئلة</span>
                    </div>
                  </div>

                  {/* Live Status indicator */}
                  <div className="mb-4">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FB7185]">
                        <span className="w-2 h-2 rounded-full bg-[#FB7185] animate-ping" />
                        الامتحان جاري الآن لجميع الطلاب
                      </span>
                    ) : isWaiting ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2DD4BF]">
                        <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse" />
                        غرفة الانتظار مفتوحة ({exam.waitingCount || 0} طالب ينتظر)
                      </span>
                    ) : (
                      <span className="text-xs text-[#64748B]">الامتحان في وضع الاستعداد (مغلق)</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2">
                  {/* Action 1: Manage Questions */}
                  <button
                    onClick={() => onManageQuestions(exam.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#E9D5FF]" />
                    <span>إدارة الأسئلة ({exam.totalQuestions})</span>
                  </button>

                  {/* Action 2: Open Waiting Room / Live Control */}
                  <div className="grid grid-cols-2 gap-2">
                    {isWaiting || isLive ? (
                      <button
                        onClick={() => onOpenLiveControl(exam.id)}
                        className="col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#FB7185] hover:bg-[#E11D48] text-white text-xs font-black transition-colors cursor-pointer"
                      >
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        <span>لوحة التحكم المباشر</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenWaitingRoom(exam.id)}
                        disabled={exam.totalQuestions === 0}
                        className="col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
                        title={exam.totalQuestions === 0 ? 'أضف أسئلة أولاً لفتح غرفة الانتظار' : ''}
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>فتح غرفة الانتظار للطلاب</span>
                      </button>
                    )}
                  </div>

                  {/* Action 3: Edit & Delete buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => openEditModal(exam)}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 text-xs transition-colors"
                      title="تعديل الامتحان"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id, exam.title)}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#FB7185] hover:bg-[#FB7185]/10 text-xs transition-colors"
                      title="حذف الامتحان"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-[#94A3B8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4">
              {editingExam ? 'تعديل بيانات الامتحان' : 'إنشاء امتحان تنافسي جديد'}
            </h3>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  المادة الدراسية
                </label>
                {subjects.length === 0 ? (
                  <p className="text-xs text-[#FB7185]">
                    لا توجد مواد مسجلة. يرجى إضافة مادة أولاً من تبويب "المواد الدراسية".
                  </p>
                ) : (
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#2DD4BF]"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  عنوان الامتحان
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: الاختبار الأسبوعي المباشر - الجبر الخطي"
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#2DD4BF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  مدة الاختبار (بالدقائق)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#2DD4BF]"
                />
                <span className="text-[10px] text-[#64748B] mt-1 block">
                  يبدأ التوقيت لجميع الطلاب متزامناً فور ضغط المشرف على "بدء الامتحان".
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  تعليمات / وصف الامتحان (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="تعليمات خاصة بالاختبار..."
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#2DD4BF]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-white text-xs font-semibold hover:bg-white/10"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || subjects.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-[#2DD4BF] text-[#0B1020] hover:bg-[#14b8a6] text-xs font-black shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingExam ? 'حفظ التعديلات' : 'إنشاء الامتحان'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
