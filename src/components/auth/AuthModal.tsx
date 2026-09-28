import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, ShieldAlert, Sparkles, User, Mail, Lock, KeyRound, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: 'login' | 'register';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode, onClose, onSuccess }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          fullName,
          email,
          password,
        });
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء المعالجة');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#111827] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#7C3AED]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#2DD4BF]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#2DD4BF] p-[2px] mb-3">
            <div className="w-full h-full bg-[#111827] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#2DD4BF]" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white">
            {mode === 'login' ? 'مرحباً بعودتك للميدان' : 'انضم لساحة المنافسة'}
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            {mode === 'login'
              ? 'سجل دخولك لمتابعة امتحاناتك المباشرة ونقاطك'
              : 'أنشئ حسابك وتنافس في الوقت الفعلي مع زملائك'}
          </p>
        </div>

        {/* Mode Switch Tabs */}
        <div className="flex bg-[#0B1020] p-1 rounded-xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            حساب جديد
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-[#FB7185] text-xs font-medium mb-4">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 text-right">
                الاسم الكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: أحمد محمد"
                  className="w-full bg-[#0B1020] border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED] transition-colors"
                />
                <User className="absolute top-3 right-3 w-4 h-4 text-[#64748B]" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 text-right">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#9333EA] to-[#2DD4BF] text-white font-black text-sm hover:opacity-95 transition-opacity shadow-lg shadow-[#7C3AED]/30 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري المعالجة...</span>
              </span>
            ) : mode === 'login' ? (
              'دخول إلى الساحة'
            ) : (
              'تأكيد وإنشاء الحساب'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
