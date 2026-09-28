import React from 'react';
import { Zap, ShieldCheck } from 'lucide-react';

export const Footer: React.FC<{ onSelectTab: (tab: string) => void }> = ({ onSelectTab }) => {
  return (
    <footer className="border-t border-white/10 bg-[#0B1020] text-[#94A3B8] py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#2DD4BF] p-[2px]">
              <div className="w-full h-full bg-[#0B1020] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#2DD4BF]" />
              </div>
            </div>
            <div>
              <p className="text-white font-black text-sm tracking-wider">ARENA LIVE EXAMS</p>
              <p className="text-xs text-[#64748B]">منصة الاختبارات التنافسية الأكاديمية في الوقت الفعلي</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold">
            <button onClick={() => onSelectTab('dashboard')} className="hover:text-white transition-colors cursor-pointer">
              الرئيسية
            </button>
            <button onClick={() => onSelectTab('subjects')} className="hover:text-white transition-colors cursor-pointer">
              المواد
            </button>
            <button onClick={() => onSelectTab('live-exams')} className="hover:text-white transition-colors cursor-pointer">
              الاختبارات المباشرة
            </button>
            <button onClick={() => onSelectTab('leaderboard')} className="hover:text-white transition-colors cursor-pointer">
              لوحة المتصدرين
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <ShieldCheck className="w-4 h-4 text-[#2DD4BF]" />
            <span>نظام تصحيح خادمي متزامن وآمن</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-[#64748B]">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} — منصة التنافس الأكاديمي المباشر
        </div>
      </div>
    </footer>
  );
};
