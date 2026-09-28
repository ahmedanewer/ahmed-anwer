import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../../types';
import { api } from '../../services/api';
import {
  Trophy,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2
} from 'lucide-react';

export const AdminLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const fetchLeaderboard = () => {
    setIsLoading(true);
    api
      .getLeaderboard()
      .then((res) => setLeaderboard(res.leaderboard || []))
      .catch((err) => console.error('Failed to load leaderboard:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleResetUser = async (userId: string, studentName: string) => {
    if (!confirm(`هل أنت متأكد من تصفير نقاط الطالب "${studentName}"؟`)) return;
    try {
      await api.resetUserPoints(userId);
      setMessage(`تم تصفير نقاط الطالب ${studentName} بنجاح.`);
      fetchLeaderboard();
    } catch (err: any) {
      alert(err.message || 'تعذر تصفير نقاط الطالب');
    }
  };

  const handleResetAll = async () => {
    if (!confirm('تحذير: هل أنت متأكد من إعادة ضبط وتصفير نقاط جميع الطلاب لبدء موسم جديد؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return;
    }
    try {
      await api.resetAllPoints();
      setMessage('تمت إعادة ضبط جميع نقاط المتصدرين للموسم الجديد بنجاح.');
      fetchLeaderboard();
    } catch (err: any) {
      alert(err.message || 'تعذر تصفير النقاط');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-xl font-black text-white">إدارة ومراقبة لوحة المتصدرين</h2>
          <p className="text-xs text-[#94A3B8]">
            متابعة ترتيب الطلاب وقاعدة كسر التعادل مع صلاحية تصفير النقاط وبدء المواسم الجديدة
          </p>
        </div>

        {leaderboard.length > 0 && (
          <button
            onClick={handleResetAll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FB7185]/15 hover:bg-[#FB7185]/25 text-[#FB7185] border border-[#FB7185]/30 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تصفير لوحة الصدارة لبدء موسم جديد</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-[#2DD4BF]/15 border border-[#2DD4BF]/30 text-[#2DD4BF] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-xs text-[#94A3B8]">جاري تحميل لوحة المتصدرين...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="p-12 text-center bg-[#111827] border border-white/10 rounded-3xl max-w-md mx-auto my-8">
          <Trophy className="w-14 h-14 text-[#64748B] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">لوحة المتصدرين فارغة حالياً</h3>
          <p className="text-xs text-[#94A3B8]">
            ستظهر المراكز هنا فور إنجاز الطلاب للاختبارات وحصولهم على نقاط الإجابات الصحيحة (+1 pt).
          </p>
        </div>
      ) : (
        <div className="bg-[#111827] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#0B1020] text-[#94A3B8] font-bold border-b border-white/5 uppercase">
                <tr>
                  <th className="px-5 py-4">المركز</th>
                  <th className="px-5 py-4">اسم الطالب</th>
                  <th className="px-5 py-4">البريد الإلكتروني</th>
                  <th className="px-5 py-4">النقاط</th>
                  <th className="px-5 py-4">الاختبارات</th>
                  <th className="px-5 py-4">توقيت تحقيق النقاط (كسر التعادل)</th>
                  <th className="px-5 py-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[#CBD5E1]">
                {leaderboard.map((entry) => (
                  <tr key={entry.userId} className="hover:bg-white/5 transition-colors">
                    <td className="px-5 py-4 font-mono-numbers font-black text-white">
                      #{entry.rank}
                    </td>
                    <td className="px-5 py-4 font-bold text-white">
                      {entry.fullName}
                    </td>
                    <td className="px-5 py-4 text-[#94A3B8] font-mono-numbers" dir="ltr">
                      {entry.email}
                    </td>
                    <td className="px-5 py-4 font-mono-numbers font-black text-[#2DD4BF] text-sm">
                      {entry.totalPoints} نقطة
                    </td>
                    <td className="px-5 py-4 font-mono-numbers">
                      {entry.examsCompleted} اختبار
                    </td>
                    <td className="px-5 py-4 text-[#64748B] font-mono-numbers">
                      {entry.lastPointEarnedAt
                        ? new Date(entry.lastPointEarnedAt).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })
                        : '-'}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleResetUser(entry.userId, entry.fullName)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#FB7185]/20 text-[#94A3B8] hover:text-[#FB7185] text-xs font-semibold transition-colors cursor-pointer"
                        title="تصفير نقاط هذا الطالب"
                      >
                        تصفير
                      </button>
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
