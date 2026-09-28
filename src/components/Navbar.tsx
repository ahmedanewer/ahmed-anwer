import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Zap,
  BookOpen,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  Flame,
  Radio,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenAuth }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'الرئيسية', icon: Flame },
    { id: 'subjects', label: 'المواد الدراسية', icon: BookOpen },
    { id: 'live-exams', label: 'الاختبارات المباشرة', icon: Radio, isLive: true },
    { id: 'leaderboard', label: 'لوحة المتصدرين', icon: Trophy },
    ...(isAuthenticated ? [{ id: 'profile', label: 'نتائجي وملفي', icon: UserIcon }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B1020]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#2DD4BF] p-[2px] transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full bg-[#0B1020] rounded-[10px] flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#2DD4BF] group-hover:text-[#E9D5FF] transition-colors" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2DD4BF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2DD4BF]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E9D5FF] to-[#2DD4BF]">
                  ARENA
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#7C3AED]/30 text-[#E9D5FF] border border-[#7C3AED]/40">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] font-medium hidden sm:block">
                منصة الاختبارات التنافسية المباشرة
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#7C3AED]/20 to-[#2DD4BF]/10 text-white border border-[#7C3AED]/40 shadow-[0_0_15px_rgba(124,58,237,0.25)]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      item.isLive
                        ? 'text-[#FB7185] animate-pulse'
                        : isActive
                        ? 'text-[#2DD4BF]'
                        : 'text-[#94A3B8]'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.isLive && (
                    <span className="w-2 h-2 rounded-full bg-[#FB7185] animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Status / Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* Points & Rank Badge */}
                {user.role === 'student' && (
                  <div className="flex items-center gap-2 bg-[#111827]/80 border border-white/10 px-3 py-1.5 rounded-xl">
                    <div className="flex items-center gap-1 text-[#2DD4BF] font-mono-numbers font-bold text-sm">
                      <Trophy className="w-4 h-4 text-[#2DD4BF]" />
                      <span>{user.totalPoints}</span>
                      <span className="text-xs text-[#94A3B8] font-normal mr-1">نقطة</span>
                    </div>
                    {user.rank && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#7C3AED]/30 text-[#E9D5FF] border border-[#7C3AED]/40">
                        المركز #{user.rank}
                      </span>
                    )}
                  </div>
                )}

                {/* Profile Pill */}
                <div
                  onClick={() => onSelectTab('profile')}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#FB7185] flex items-center justify-center font-bold text-white text-xs">
                    {user.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white leading-tight">{user.fullName}</p>
                    <p className="text-[10px] text-[#94A3B8]">طالب متنافس</p>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="تسجيل الخروج"
                  className="p-2 rounded-xl bg-white/5 hover:bg-[#FB7185]/20 text-[#94A3B8] hover:text-[#FB7185] transition-colors border border-white/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#F8FAFC] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  تسجيل الدخول
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-[#7C3AED] to-[#2DD4BF] text-white hover:opacity-95 transition-opacity shadow-[0_0_20px_rgba(124,58,237,0.35)] cursor-pointer"
                >
                  انضم للتحدي
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/5 text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B1020] border-b border-white/10 px-4 pt-2 pb-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold ${
                  isActive
                    ? 'bg-[#7C3AED]/20 text-white border border-[#7C3AED]/40'
                    : 'text-[#94A3B8] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${item.isLive ? 'text-[#FB7185]' : 'text-[#2DD4BF]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.isLive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FB7185] text-white">
                    مباشر
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 border-t border-white/10">
            {isAuthenticated && user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#FB7185] flex items-center justify-center font-bold text-white text-xs">
                    {user.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{user.fullName}</p>
                    <p className="text-xs text-[#2DD4BF] font-mono-numbers">{user.totalPoints} نقطة</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#FB7185]/20 text-[#FB7185] text-xs font-bold"
                >
                  خروج
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold bg-white/5 text-white text-center"
                >
                  تسجيل الدخول
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#7C3AED] to-[#2DD4BF] text-white text-center"
                >
                  انضم الآن
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
