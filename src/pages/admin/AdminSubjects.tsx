import React, { useEffect, useState } from 'react';
import { Subject } from '../../types';
import { api } from '../../services/api';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  X,
  AlertTriangle
} from 'lucide-react';

export const AdminSubjects: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = () => {
    api
      .getSubjects(true)
      .then((res) => setSubjects(res.subjects || []))
      .catch((err) => console.error('Failed to load subjects:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openAddModal = () => {
    setEditingSubject(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setName(subject.name);
    setDescription(subject.description || '');
    setImageUrl(subject.imageUrl || '');
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (editingSubject) {
        await api.updateSubject(editingSubject.id, {
          name,
          description,
          imageUrl,
        });
      } else {
        await api.createSubject({
          name,
          description,
          imageUrl,
        });
      }
      setModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ المادة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, subjectName: string) => {
    if (!confirm(`هل أنت متأكد من حذف مادة "${subjectName}"؟ سيتم حذف جميع الاختبارات والأسئلة المرتبطة بها.`)) {
      return;
    }

    try {
      await api.deleteSubject(id);
      fetchSubjects();
    } catch (err: any) {
      alert(err.message || 'تعذر حذف المادة');
    }
  };

  const handleToggleActive = async (subject: Subject) => {
    try {
      await api.updateSubject(subject.id, { isActive: !subject.isActive });
      fetchSubjects();
    } catch (err: any) {
      alert(err.message || 'تعذر تغيير حالة المادة');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white">إدارة المواد الدراسية</h2>
          <p className="text-xs text-[#94A3B8]">إضافة وتعديل وحذف المواد التعليمية</p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مادة جديدة</span>
        </button>
      </div>

      {isLoading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-[#94A3B8]">جاري تحميل المواد...</p>
        </div>
      ) : subjects.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-[#111827] border border-white/10 rounded-3xl max-w-md mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-[#2DD4BF]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">لا توجد مواد حتى الآن</h3>
          <p className="text-xs text-[#94A3B8] mb-6">
            ابدأ بإضافة المواد الدراسية التنافسية لربط الامتحانات والأسئلة بها.
          </p>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-xs shadow-lg mx-auto transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مادة</span>
          </button>
        </div>
      ) : (
        /* Subjects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-[#111827] border border-white/10 rounded-2xl p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-[#2DD4BF]" />
                  </div>

                  <button
                    onClick={() => handleToggleActive(subject)}
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                      subject.isActive
                        ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border border-[#2DD4BF]/30'
                        : 'bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30'
                    }`}
                  >
                    {subject.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    <span>{subject.isActive ? 'مفعلة' : 'معطلة'}</span>
                  </button>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{subject.name}</h3>
                <p className="text-xs text-[#94A3B8] line-clamp-2 mb-4">
                  {subject.description || 'بدون وصف'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(subject)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="تعديل المادة"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>

                <button
                  onClick={() => handleDelete(subject.id, subject.name)}
                  className="p-2 rounded-xl bg-[#FB7185]/10 hover:bg-[#FB7185]/20 text-[#FB7185] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="حذف المادة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            </div>
          ))}
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
              {editingSubject ? 'تعديل المادة الدراسية' : 'إضافة مادة دراسية جديدة'}
            </h3>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  اسم المادة
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: الرياضيات المتقدمة أو الكيمياء العامة"
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  وصف مختصر للمادة
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="نبذة عن المادة والموضوعات التي تشملها..."
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C3AED]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  رابط صورة المادة (اختياري)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#7C3AED] text-left"
                  dir="ltr"
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
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-black shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingSubject ? 'حفظ التعديلات' : 'إضافة المادة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
