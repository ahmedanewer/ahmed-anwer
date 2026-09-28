import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  KeyRound,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface AdminAuthPortalProps {
  onSuccess: () => void;
  onGoHome: () => void;
}

export const AdminAuthPortal: React.FC<AdminAuthPortalProps> = ({ onSuccess, onGoHome }) => {
  const { user, isAdmin, adminLogin, setupFirstAdmin, logout } = useAuth();
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [isLoadingSetup, setIsLoadingSetup] = useState(true);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Browser back handler with fallback
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      onGoHome();
    }
  };

  useEffect(() => {
    api
      .checkAdminSetup()
      .then((res) => {
        setHasAdmin(res.hasAdmin);
      })
      .catch((err) => {
        console.error('Failed to check admin setup:', err);
        setHasAdmin(true); // default to login on error
      })
      .finally(() => {
        setIsLoadingSetup(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (hasAdmin === false) {
        // Initial Admin Setup
        await setupFirstAdmin({ fullName, email, password });
      } else {
        // Admin Login
        await adminLogin(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'فشل في تسجيل دخول المشرف');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSetup) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-[#94A3B8]">جاري التحقق من أمان بوابة الإدارة...</p>
      </div>
    );
  }

  // Case 1: Student is currently logged in and tries to access /admin
  if (user && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#111827] border border-[#FB7185]/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-[#FB7185]/20 border border-[#FB7185]/40 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-[#FB7185]" />
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/30 mb-2 inline-block">
            403 UNAUTHORIZED
          </span>

          <h2 className="text-2xl font-black text-white mt-1 mb-2">
            غير مصرح بالدخول
          </h2>

          <p className="text-xs sm:text-sm text-[#94A3B8] mb-6 leading-relaxed">
            أنت مسجل حالياً بحساب طالب (<span className="text-white font-bold">{user.fullName}</span>). هذه البوابة محمية ومخصصة حصرياً لإدارة المنصة ولا يمكن للطلاب الدخول إليها.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleBack}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة إلى لوحة تحكم الطالب</span>
            </button>

            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FB7185]/10 hover:bg-[#FB7185]/20 text-[#FB7185] font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج والتبديل لحساب المشرف</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Unauthenticated - Show Admin Login or First Admin Setup
  return (
    <div className="min-h-screen bg-[#0B1020] flex flex-col justify-center items-center p-4 relative">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#2DD4BF]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top back button */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-xs font-bold text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>الرجوع إلى المنصة الرئيسية</span>
        </button>

        <span className="text-[10px] font-mono-numbers text-[#64748B] uppercase">
          SECURE ADMIN PORTAL
        </span>
      </div>

      <div className="w-full max-w-md bg-[#111827] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#2DD4BF] p-[2px] mb-3 shadow-[0_0_25px_rgba(124,58,237,0.4)]">
            <div className="w-full h-full bg-[#111827] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-[#2DD4BF]" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white">
            {hasAdmin === false ? 'تهيئة حساب المشرف الرئيسي' : 'بوابة تسجيل دخول الإدارة'}
          </h2>

          <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
            {hasAdmin === false
              ? 'مرحباً بك يا صاحب المنصة! هذه هي المرة الأولى لفتح لوحة الإدارة. قم بتهيئة حسابك الرئيسي الآن لحماية المنصة.'
              : 'أدخل بيانات الاعتماد المعتمدة للوصول إلى لوحة التحكم والتحكم المباشر بالامتحانات.'}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] text-xs font-semibold mb-4">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {hasAdmin === false && (
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 text-right">
                الاسم الكامل للمشرف
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: أحمد محمد (صاحب المنصة)"
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
                <User className="absolute top-3 right-3 w-4 h-4 text-[#64748B]" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 text-right">
              البريد الإلكتروني للإدارة
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourdomain.com"
                className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] transition-colors text-left"
                dir="ltr"
              />
              <Mail className="absolute top-3 right-3 w-4 h-4 text-[#64748B]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 text-right">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] transition-colors text-left"
                dir="ltr"
              />
              <Lock className="absolute top-3 right-3 w-4 h-4 text-[#64748B]" />
            </div>
            {hasAdmin === false && (
              <span className="text-[10px] text-[#64748B] mt-1 block">
                اختر كلمة مرور قوية مكونة من 6 أحرف على الأقل.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#2DD4BF] text-white font-black text-sm hover:opacity-95 transition-opacity shadow-lg shadow-[#7C3AED]/30 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري التحقق...</span>
              </span>
            ) : hasAdmin === false ? (
              'تفعيل وحفظ حساب المشرف الأول'
            ) : (
              'دخول إلى لوحة التحكم'
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/5 text-center text-[11px] text-[#64748B]">
          منصة الاختبارات التنافسية &bull; بوابة الإدارة الآمنة
        </div>
      </div>
    </div>
  );
};
