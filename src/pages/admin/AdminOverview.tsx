import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  Users,
  BookOpen,
  Radio,
  HelpCircle,
  Award,
  Sparkles,
  ArrowRight,
  Plus
} from 'lucide-react';

interface AdminOverviewProps {
  onNavigate: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    totalExams: 0,
    totalQuestions: 0,
    totalSubmissions: 0,
    liveExamsCount: 0,
    waitingExamsCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getAdminStats()
      .then((res) => {
        setStats(res.stats);
      })
      .catch((err) => console.error('Failed to load admin stats:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-[#94A3B8]">جاري تحميل مؤشرات المنصة الحقيقية...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'الطلاب المسجلون', value: stats.totalStudents, icon: Users, color: '#2DD4BF', tab: 'students' },
    { label: 'المواد الدراسية', value: stats.totalSubjects, icon: BookOpen, color: '#7C3AED', tab: 'subjects' },
    { label: 'الاختبارات المنشأة', value: stats.totalExams, icon: Radio, color: '#FB7185', tab: 'exams' },
    { label: 'الأسئلة المدخلة', value: stats.totalQuestions, icon: HelpCircle, color: '#E9D5FF', tab: 'questions' },
    { label: 'التسليمات المنجزة', value: stats.totalSubmissions, icon: Award, color: '#2DD4BF', tab: 'students' },
    { label: 'غرف الانتظار والمباشر', value: stats.liveExamsCount + stats.waitingExamsCount, icon: Sparkles, color: '#FB7185', tab: 'live-control' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-[#1E1B4B]/80 via-[#111827] to-[#0B1020] border border-[#7C3AED]/40 rounded-3xl p-6 sm:p-8">
        <h2 className="text-2xl font-black text-white mb-2">لوحة قيادة إدارة المنصة</h2>
        <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl leading-relaxed">
          جميع البيانات هنا حقيقية وفعلية من قاعدة البيانات مباشرة. يمكنك إدارة المواد، بناء بنك الأسئلة، والتحكم في غرف الانتظار وإطلاق الامتحانات المتزامنة لجميع الطلاب في نفس اللحظة.
        </p>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={() => onNavigate('subjects')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مادة</span>
          </button>
          <button
            onClick={() => onNavigate('exams')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2DD4BF] text-[#0B1020] hover:bg-[#14b8a6] text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء امتحان</span>
          </button>
          <button
            onClick={() => onNavigate('questions')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سؤال</span>
          </button>
          <button
            onClick={() => onNavigate('live-control')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#FB7185] hover:bg-[#e11d48] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>التحكم المباشر بالامتحانات</span>
          </button>
        </div>
      </div>

      {/* Real Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(card.tab)}
              className="bg-[#111827] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#94A3B8] font-bold">{card.label}</span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${card.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono-numbers">
                {card.value}
              </div>
              <span className="text-[10px] text-[#64748B] group-hover:text-white transition-colors block mt-2">
                إدارة القسم &larr;
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
