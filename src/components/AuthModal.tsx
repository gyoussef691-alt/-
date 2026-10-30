import React, { useState } from 'react';
import { mobilityStore } from '../store/mobilityStore';
import { auth, googleAuthProvider } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Smartphone, Mail, X, CheckCircle, AlertCircle, Info, Shield, UserCheck, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [authMethod, setAuthMethod] = useState<'GOOGLE' | 'PHONE_OTP' | 'SWITCH_DEMO'>('GOOGLE');
  const [role, setRole] = useState<'PASSENGER' | 'DRIVER'>('PASSENGER');
  const [phone, setPhone] = useState('01012345678');
  const [fullName, setFullName] = useState('أحمد محمود الغريبي');
  const [step, setStep] = useState<'ENTER_PHONE' | 'ENTER_OTP'>('ENTER_PHONE');
  const [simulatedOtp, setSimulatedOtp] = useState<string>('4892');
  const [userOtp, setUserOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use clean standard provider for normal Google sign-in
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      const isAdminEmail = fbUser.email === 'gyoussef691@gmail.com';
      const assignedRole: 'PASSENGER' | 'DRIVER' | 'ADMIN' = isAdminEmail ? 'ADMIN' : role;

      const updatedUser = {
        id: fbUser.uid,
        phone: fbUser.phoneNumber || '01012345678',
        fullName: fbUser.displayName || 'مستخدم Google',
        email: fbUser.email || undefined,
        role: assignedRole,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString(),
      };

      mobilityStore.setCurrentUser(updatedUser);
      setSuccess(`تم تسجيل الدخول بنجاح بحساب Google: ${fbUser.displayName || fbUser.email}`);
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setError(err?.message || 'تعذر تسجيل الدخول بحساب Google. تأكد من تفعيل النوافذ المنبثقة.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const egyptRegex = /^01[0125][0-9]{8}$/;

    if (!egyptRegex.test(cleanPhone)) {
      setError('يرجى إدخال رقم هاتف محمول مصري صحيح (11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015).');
      return;
    }

    setError(null);
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setSimulatedOtp(code);
    setStep('ENTER_OTP');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (userOtp !== simulatedOtp) {
      setError('رمز التحقق غير صحيح. يرجى إدخال الرمز المعروض في نافذة المحاكاة.');
      return;
    }

    const res = mobilityStore.authenticateWithPhone(phone, fullName, role);
    if (res.success) {
      setSuccess(res.message);
      setTimeout(() => {
        onClose();
        setSuccess(null);
        setStep('ENTER_PHONE');
      }, 1200);
    } else {
      setError(res.message);
    }
  };

  const handleSwitchPersona = (roleTarget: 'PASSENGER' | 'DRIVER' | 'ADMIN') => {
    mobilityStore.switchRole(roleTarget);
    setSuccess(`تم التبديل إلى دور: ${roleTarget === 'ADMIN' ? 'مدير المنصة' : roleTarget === 'DRIVER' ? 'السائق' : 'الراكب'}`);
    setTimeout(() => {
      onClose();
      setSuccess(null);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative text-right">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-xs text-[#146EF5] font-bold block mb-1">
            رأس غارب موبيليتي — توثيق الدخول
          </span>
          <h3 className="text-xl font-extrabold text-[#0B1F3A]">
            تسجيل الدخول / إنشاء حساب
          </h3>
          <p className="text-xs text-[#6B7280] mt-1">
            سجل دخولك الحقيقي عبر Google أو برقم الهاتف للوصول للطلبات والرحلات المحفوظة على السيرفر.
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#F7F9FC] rounded-lg mb-4 border border-slate-200">
          <button
            type="button"
            onClick={() => setRole('PASSENGER')}
            className={`py-1.5 text-xs font-bold rounded-md transition-colors ${
              role === 'PASSENGER' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-[#6B7280]'
            }`}
          >
            حساب راكب
          </button>
          <button
            type="button"
            onClick={() => setRole('DRIVER')}
            className={`py-1.5 text-xs font-bold rounded-md transition-colors ${
              role === 'DRIVER' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-[#6B7280]'
            }`}
          >
            حساب كابتن (سائق)
          </button>
        </div>

        {/* Method Toggle */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-4 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setAuthMethod('GOOGLE')}
            className={`pb-1 flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              authMethod === 'GOOGLE' ? 'border-[#146EF5] text-[#146EF5]' : 'border-transparent text-[#6B7280]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            حساب Google (فعلي)
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('PHONE_OTP');
              setStep('ENTER_PHONE');
            }}
            className={`pb-1 flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              authMethod === 'PHONE_OTP' ? 'border-[#146EF5] text-[#146EF5]' : 'border-transparent text-[#6B7280]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            رقم الهاتف (OTP)
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('SWITCH_DEMO')}
            className={`pb-1 flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              authMethod === 'SWITCH_DEMO' ? 'border-[#146EF5] text-[#146EF5]' : 'border-transparent text-[#6B7280]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            تبديل الحساب للاختبار
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {authMethod === 'GOOGLE' && (
          <div className="space-y-4 text-xs py-2">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-right leading-relaxed">
              <span className="font-bold block mb-1">المصادقة السحابية الحقيقية (Firebase Auth):</span>
              يتيح تسجيل الدخول بحساب Google الفعلي مشاركة ومزامنة الطلبات والعروض بين الأجهزة والمتصفحات المختلفة مباشرة عبر Firestore.
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#146EF5]" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>تسجيل الدخول الفوري بحساب Google</span>
            </button>
          </div>
        )}

        {authMethod === 'PHONE_OTP' && (
          step === 'ENTER_PHONE' ? (
            <form onSubmit={handleSendOtp} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="الاسم ثلاثي"
                  required
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  رقم الهاتف المصري (010 / 011 / 012 / 015)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  required
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#146EF5]" />
                <span>
                  <strong>تنبيه الشفافية:</strong> في بيئة الإنتاج يتم إرسال الرمز عبر بوابة SMS حقيقية. في هذه البيئة التجريبية، سيظهر الرمز لك على الشاشة مباشرة.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-bold rounded-lg transition-colors mt-2 text-xs shadow-sm"
              >
                إرسال رمز التحقق
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <span className="text-[11px] text-amber-900 block mb-1">
                  رمز التحقق التجريبي (محاكاة بيئة الاختبار):
                </span>
                <span className="text-2xl font-mono font-extrabold text-[#0B1F3A] tracking-widest">
                  {simulatedOtp}
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1">أدخل الرمز المكون من 4 أرقام</label>
                <input
                  type="text"
                  maxLength={4}
                  value={userOtp}
                  onChange={(e) => setUserOtp(e.target.value)}
                  placeholder={simulatedOtp}
                  required
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-base font-mono text-center tracking-widest"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#18B981] hover:bg-[#18B981]/90 text-white font-bold rounded-lg transition-colors text-xs"
                >
                  تأكيد الدخول
                </button>
                <button
                  type="button"
                  onClick={() => setStep('ENTER_PHONE')}
                  className="px-3 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  رجوع
                </button>
              </div>
            </form>
          )
        )}

        {authMethod === 'SWITCH_DEMO' && (
          <div className="space-y-2 text-xs py-2">
            <p className="text-[#6B7280] mb-2">
              اختر أحد الحسابات الجاهزة لاختبار تفاعل الراكب والسائق والإدارة على نفس البيانات:
            </p>
            <button
              type="button"
              onClick={() => handleSwitchPersona('PASSENGER')}
              className="w-full p-2.5 bg-[#F7F9FC] hover:bg-slate-100 border border-slate-200 rounded-lg text-right flex items-center justify-between font-semibold"
            >
              <span>أحمد محمود الغريبي (راكب)</span>
              <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">إنشاء طلبات</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchPersona('DRIVER')}
              className="w-full p-2.5 bg-[#F7F9FC] hover:bg-slate-100 border border-slate-200 rounded-lg text-right flex items-center justify-between font-semibold"
            >
              <span>الكابتن محمد عبد الرحيم (سائق معتمد)</span>
              <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">إرسال عروض</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchPersona('ADMIN')}
              className="w-full p-2.5 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white rounded-lg text-right flex items-center justify-between font-semibold"
            >
              <span>مدير المنصة (gyoussef691@gmail.com)</span>
              <span className="text-[11px] text-emerald-400 bg-white/10 px-2 py-0.5 rounded">لوحة الإدارة</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
