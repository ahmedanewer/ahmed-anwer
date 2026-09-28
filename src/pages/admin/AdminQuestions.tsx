import React, { useEffect, useState } from 'react';
import { Exam, Question } from '../../types';
import { api } from '../../services/api';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';

interface AdminQuestionsProps {
  initialExamId?: string | null;
}

export const AdminQuestions: React.FC<AdminQuestionsProps> = ({ initialExamId }) => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form fields
  const [text, setText] = useState('');
  const [option0, setOption0] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [option3, setOption3] = useState('');
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number>(0);
  const [orderIndex, setOrderIndex] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getExams(true)
      .then((res) => {
        const examList = res.exams || [];
        setExams(examList);
        if (!selectedExamId && examList.length > 0) {
          setSelectedExamId(examList[0].id);
        }
      })
      .catch((err) => console.error('Failed to load exams list:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const fetchQuestions = (examId: string) => {
    if (!examId) return;
    setIsLoading(true);
    api
      .getExamQuestions(examId)
      .then((res) => setQuestions(res.questions || []))
      .catch((err) => console.error('Failed to fetch questions:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (selectedExamId) {
      fetchQuestions(selectedExamId);
    }
  }, [selectedExamId]);

  const openAddModal = () => {
    setEditingQuestion(null);
    setText('');
    setOption0('');
    setOption1('');
    setOption2('');
    setOption3('');
    setCorrectOptionIndex(0);
    setOrderIndex(questions.length + 1);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (q: Question) => {
    setEditingQuestion(q);
    setText(q.text);
    setOption0(q.options[0] || '');
    setOption1(q.options[1] || '');
    setOption2(q.options[2] || '');
    setOption3(q.options[3] || '');
    setCorrectOptionIndex(q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0);
    setOrderIndex(q.orderIndex || 1);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) {
      setError('يرجى اختيار امتحان أولاً');
      return;
    }

    if (!option0.trim() || !option1.trim() || !option2.trim() || !option3.trim()) {
      setError('يرجى ملء جميع الخيارات الأربعة كاملة');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const options: [string, string, string, string] = [
      option0.trim(),
      option1.trim(),
      option2.trim(),
      option3.trim()
    ];

    try {
      if (editingQuestion) {
        await api.updateQuestion(editingQuestion.id, {
          text,
          options,
          correctOptionIndex,
          orderIndex
        });
      } else {
        await api.createQuestion(selectedExamId, {
          text,
          options,
          correctOptionIndex,
          orderIndex
        });
      }
      setModalOpen(false);
      fetchQuestions(selectedExamId);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ السؤال');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال نهائياً؟')) return;

    try {
      await api.deleteQuestion(id);
      fetchQuestions(selectedExamId);
    } catch (err: any) {
      alert(err.message || 'تعذر حذف السؤال');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Exam Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white">بنك وإدارة الأسئلة</h2>
          <p className="text-xs text-[#94A3B8]">
            إدخال وتعديل الأسئلة ذات الاختيار من متعدد (4 خيارات وتحديد الإجابة الصحيحة)
          </p>
        </div>

        <button
          onClick={openAddModal}
          disabled={!selectedExamId}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-lg transition-colors disabled:opacity-40 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة سؤال جديد</span>
        </button>
      </div>

      {/* Select Exam Dropdown */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-[#E9D5FF] shrink-0">اختر الامتحان:</span>
          {exams.length === 0 ? (
            <span className="text-xs text-[#FB7185]">لا توجد امتحانات مسجلة. أنشئ امتحاناً أولاً.</span>
          ) : (
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED] w-full sm:w-80"
            >
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} ({e.subjectName})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedExamId && (
          <span className="text-xs text-[#2DD4BF] font-mono-numbers font-bold">
            عدد الأسئلة المدخلة: {questions.length} سؤال
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-[#94A3B8]">جاري تحميل الأسئلة...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="p-12 text-center bg-[#111827] border border-white/10 rounded-3xl max-w-md mx-auto my-8">
          <HelpCircle className="w-14 h-14 text-[#64748B] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">لا توجد امتحانات</h3>
          <p className="text-xs text-[#94A3B8]">
            يرجى إنشاء امتحان أولاً من تبويب "الامتحانات" لتتمكن من إضافة أسئلة إليه.
          </p>
        </div>
      ) : questions.length === 0 ? (
        /* Empty Questions State */
        <div className="p-12 text-center bg-[#111827] border border-white/10 rounded-3xl max-w-md mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-7 h-7 text-[#2DD4BF]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">لا توجد أسئلة حتى الآن</h3>
          <p className="text-xs text-[#94A3B8] mb-6">
            هذا الامتحان لا يحتوي على أي أسئلة بعد. أضف أسئلة MCQ مع 4 خيارات وتحديد الإجابة الصحيحة.
          </p>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-lg mx-auto transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سؤال</span>
          </button>
        </div>
      ) : (
        /* Questions List */
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const letters = ['أ', 'ب', 'ج', 'د'];
            const latin = ['A', 'B', 'C', 'D'];

            return (
              <div
                key={q.id}
                className="bg-[#111827] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center font-bold text-xs font-mono-numbers shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-white leading-relaxed">
                      {q.text}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(q)}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
                      title="تعديل السؤال"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#FB7185] hover:bg-[#FB7185]/10 transition-colors"
                      title="حذف السؤال"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4 Choices grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, optIdx) => {
                    const isCorrect = q.correctOptionIndex === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center justify-between p-3 rounded-xl border ${
                          isCorrect
                            ? 'bg-[#2DD4BF]/15 border-[#2DD4BF]/50 text-[#2DD4BF] font-bold'
                            : 'bg-[#0B1020] border-white/5 text-[#CBD5E1]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono-numbers">[{letters[optIdx]}]</span>
                          <span>{opt}</span>
                        </div>
                        {isCorrect && (
                          <span className="text-[10px] bg-[#2DD4BF] text-[#0B1020] px-2 py-0.5 rounded font-black flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>الإجابة الصحيحة</span>
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
      )}

      {/* Question Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative my-8">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 left-4 p-2 text-[#94A3B8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4">
              {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال اختيار من متعدد (MCQ)'}
            </h3>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  نص السؤال
                </label>
                <textarea
                  rows={3}
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="اكتب صيغة السؤال هنا بدقة..."
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
                  الخيارات الأربعة (حدد الإجابة الصحيحة بالضغط على الدائرة الخضراء)
                </label>

                <div className="space-y-2.5">
                  {[
                    { label: 'الخيار (أ) / (A)', val: option0, setVal: setOption0, idx: 0 },
                    { label: 'الخيار (ب) / (B)', val: option1, setVal: setOption1, idx: 1 },
                    { label: 'الخيار (ج) / (C)', val: option2, setVal: setOption2, idx: 2 },
                    { label: 'الخيار (د) / (D)', val: option3, setVal: setOption3, idx: 3 },
                  ].map((field) => (
                    <div
                      key={field.idx}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                        correctOptionIndex === field.idx
                          ? 'border-[#2DD4BF] bg-[#2DD4BF]/10'
                          : 'border-white/10 bg-[#0B1020]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setCorrectOptionIndex(field.idx)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 cursor-pointer ${
                          correctOptionIndex === field.idx
                            ? 'border-[#2DD4BF] bg-[#2DD4BF] text-[#0B1020]'
                            : 'border-white/30 bg-transparent text-transparent hover:border-[#2DD4BF]'
                        }`}
                        title="انقر لتعيين هذا الخيار كإجابة صحيحة"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <input
                        type="text"
                        required
                        value={field.val}
                        onChange={(e) => field.setVal(e.target.value)}
                        placeholder={`نص ${field.label}...`}
                        className="w-full bg-transparent text-sm text-white placeholder-[#64748B] focus:outline-none"
                      />

                      {correctOptionIndex === field.idx && (
                        <span className="text-[10px] font-bold text-[#2DD4BF] shrink-0">
                          صحيح
                        </span>
                      )}
                    </div>
                  ))}
                </div>
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
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingQuestion ? 'تعديل السؤال' : 'إضافة السؤال'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
