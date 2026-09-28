import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, Trophy, BookOpen, Calendar, Clock } from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getAdminStudents()
      .then((res) => setStudents(res.students || []))
      .catch((err) => console.error('Failed to load students:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[30vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2DD4BF] border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-[#94A3B8]">جاري تحميل قائمة الطلاب...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white">دليل الطلاب المتنافسين</h2>
          <p className="text-xs text-[#94A3B8]">
            سجل الطلاب الحقيقيين المسجلين في المنصة ونقاطهم الفعلية
          </p>
        </div>

        <span className="text-xs font-bold text-[#2DD4BF] bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
          إجمالي الطلاب: {students.length}
        </span>
      </div>

      {students.length === 0 ? (
        <div className="p-12 text-center bg-[#111827] border border-white/10 rounded-3xl max-w-md mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-[#64748B]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">لا يوجد طلاب حتى الآن</h3>
          <p className="text-xs text-[#94A3B8]">
            ستظهر بيانات الطلاب المسجلين هنا فور قيام أول طالب بإنشاء حساب في المنصة.
          </p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0B1020] text-[#94A3B8] font-bold border-b border-white/5 uppercase">
                <tr>
                  <th className="px-5 py-4">الترتيب</th>
                  <th className="px-5 py-4">اسم الطالب</th>
                  <th className="px-5 py-4">البريد الإلكتروني</th>
                  <th className="px-5 py-4">النقاط الإجمالية</th>
                  <th className="px-5 py-4">الاختبارات المنجزة</th>
                  <th className="px-5 py-4">تاريخ الانضمام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#CBD5E1]">
                {students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-mono-numbers font-bold text-white">
                      #{idx + 1}
                    </td>
                    <td className="px-5 py-4 font-bold text-white">
                      {student.fullName}
                    </td>
                    <td className="px-5 py-4 text-[#94A3B8] font-mono-numbers" dir="ltr">
                      {student.email}
                    </td>
                    <td className="px-5 py-4 font-mono-numbers font-black text-[#2DD4BF] text-sm">
                      {student.totalPoints} نقطة
                    </td>
                    <td className="px-5 py-4 font-mono-numbers">
                      {student.examsCompleted} اختبار
                    </td>
                    <td className="px-5 py-4 text-[#64748B]">
                      {new Date(student.joinedAt).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
