import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminOverview } from './AdminOverview';
import { AdminSubjects } from './AdminSubjects';
import { AdminExams } from './AdminExams';
import { AdminQuestions } from './AdminQuestions';
import { AdminLiveControl } from './AdminLiveControl';
import { AdminStudents } from './AdminStudents';
import { AdminLeaderboard } from './AdminLeaderboard';
import {
  LayoutDashboard,
  BookOpen,
  Radio,
  HelpCircle,
  Users,
  Trophy,
  ShieldCheck,
  LogOut,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface AdminDashboardProps {
  onGoHome?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onGoHome }) => {
  const { user, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'exams' | 'questions' | 'live-control' | 'students' | 'leaderboard'>('overview');
  const [targetExamId, setTargetExamId] = useState<string | null>(null);

  // Browser back with fallback
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'subjects', label: 'المواد الدراسية', icon: BookOpen },
    { id: 'exams', label: 'الامتحانات', icon: Radio },
    { id: 'questions', label: 'بنك الأسئلة', icon: HelpCircle },
    { id: 'live-control', label: 'غرف الانتظار والمباشر', icon: Radio, highlight: true },
    { id: 'students', label: 'سجل الطلاب', icon: Users },
    { id: 'leaderboard', label: 'لوحة الصدارة', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-[#0B1020] text-[#F8FAFC]">
      {/* Admin Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#0B1020]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="الرجوع"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">الرجوع</span>
            </button>

            <div className="h-5 w-[1px] bg-white/10" />

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#2DD4BF] p-[2px]">
                <div className="w-full h-full bg-[#0B1020] rounded-[6px] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#2DD4BF]" />
                </div>
              </div>
              <div>
                <span className="text-sm font-black text-white">ARENA ADMIN</span>
                <span className="text-[10px] text-[#2DD4BF] block font-mono-numbers leading-none">
                  PORTAL 2026
                </span>
              </div>
            </div>
          </div>

          {/* Admin User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-left text-xs">
              <span className="font-bold text-white block">{user?.fullName}</span>
              <span className="text-[10px] text-[#94A3B8] block">{user?.email}</span>
            </div>

            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FB7185]/10 hover:bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/20 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Admin Body Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin Tab navigation */}
        <div className="flex bg-[#111827] p-1.5 rounded-2xl border border-white/5 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/25'
                    : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    tab.highlight && isActive
                      ? 'text-[#FB7185] animate-pulse'
                      : isActive
                      ? 'text-[#2DD4BF]'
                      : 'text-[#94A3B8]'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.highlight && (
                  <span className="w-2 h-2 rounded-full bg-[#FB7185] animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        <div>
          {activeTab === 'overview' && (
            <AdminOverview onNavigate={(t) => setActiveTab(t as any)} />
          )}
          {activeTab === 'subjects' && <AdminSubjects />}
          {activeTab === 'exams' && (
            <AdminExams
              onManageQuestions={(examId) => {
                setTargetExamId(examId);
                setActiveTab('questions');
              }}
              onOpenLiveControl={(examId) => {
                setTargetExamId(examId);
                setActiveTab('live-control');
              }}
            />
          )}
          {activeTab === 'questions' && (
            <AdminQuestions initialExamId={targetExamId} />
          )}
          {activeTab === 'live-control' && (
            <AdminLiveControl initialExamId={targetExamId} />
          )}
          {activeTab === 'students' && <AdminStudents />}
          {activeTab === 'leaderboard' && <AdminLeaderboard />}
        </div>
      </div>
    </div>
  );
};
