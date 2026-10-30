import React, { useState } from 'react';
import { ShieldCheck, Database, Server, Smartphone, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { mobilityStore } from '../store/mobilityStore';
import { User } from '../types';

interface TransparencyBannerProps {
  currentUser: User;
}

export const TransparencyBanner: React.FC<TransparencyBannerProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleSwitch = (role: 'PASSENGER' | 'DRIVER' | 'ADMIN') => {
    mobilityStore.switchRole(role);
  };

  const handleResetData = () => {
    if (window.confirm('هل تود إعادة تعيين بيانات التجربة إلى الحالة الأولية؟')) {
      mobilityStore.resetToDefault();
    }
  };

  return (
    <div className="bg-[#0B1F3A] text-white border-b border-white/10 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#18B981]/20 text-[#18B981] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              سحابة Firestore متصلة مباشرة (Real-time Live Sync)
            </span>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <span className="text-slate-200">
              الحساب النشط: <strong className="text-white">{currentUser.fullName}</strong> ({currentUser.role === 'ADMIN' ? 'مدير المنصة' : currentUser.role === 'DRIVER' ? 'سائق' : 'راكب'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Role Switcher for Cross-User Testing */}
            <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded">
              <button
                onClick={() => handleRoleSwitch('PASSENGER')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  currentUser.role === 'PASSENGER' ? 'bg-[#146EF5] text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                راكب
              </button>
              <button
                onClick={() => handleRoleSwitch('DRIVER')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  currentUser.role === 'DRIVER' ? 'bg-[#146EF5] text-white font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                سائق
              </button>
              <button
                onClick={() => handleRoleSwitch('ADMIN')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  currentUser.role === 'ADMIN' ? 'bg-[#18B981] text-[#0B1F3A] font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                مدير
              </button>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 text-slate-300 hover:text-white px-2 py-0.5 rounded transition-colors underline underline-offset-2"
            >
              <span>ميثاق الشفافية التقنية</span>
              {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="mt-3 pt-3 border-t border-white/15 grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 pb-1">
            <div className="bg-white/5 p-2.5 rounded border border-white/10">
              <div className="flex items-center gap-2 font-bold text-white mb-1">
                <Database className="w-4 h-4 text-[#146EF5]" />
                قاعدة البيانات السحابية (Cloud Firestore)
              </div>
              <p className="text-[11px] leading-relaxed">
                قاعدة البيانات متصلة فعلياً وتستقبل طلبات المشاوير، عروض السائقين، والرحلات اللحظية عبر <code>onSnapshot</code> ومعاملات ذرية (<code>runTransaction</code>) تمنع قبول عرضين متعارضين لنفس المشوار.
              </p>
            </div>

            <div className="bg-white/5 p-2.5 rounded border border-white/10">
              <div className="flex items-center gap-2 font-bold text-white mb-1">
                <Smartphone className="w-4 h-4 text-[#F59E0B]" />
                المصادقة ورمز التحقق SMS OTP
              </div>
              <p className="text-[11px] leading-relaxed">
                يدعم التطبيق تسجيل الدخول الحقيقي بحساب Google، بالإضافة للمحاكاة المباشرة لأرقام الهواتف المصرية (010, 011, 012, 015) مع عرض الرمز للاختبار دون الحاجة لدفع تكلفة بوابة الرسائل أثناء التجربة.
              </p>
            </div>

            <div className="bg-white/5 p-2.5 rounded border border-white/10">
              <div className="flex items-center gap-2 font-bold text-white mb-1">
                <Server className="w-4 h-4 text-[#18B981]" />
                الدفع النقدي والعمولات
              </div>
              <p className="text-[11px] leading-relaxed">
                تطبق المنصة قاعدة الدفع النقدي عند الركوب دون الادعاء الزائف بوجود دفع إلكتروني. تُسجل العمولات المستحقة وتُجمد نسبتها محاسبياً لكل عملية بشكل مستقل مع إمكانية تسويتها من لوحة الإدارة.
              </p>
              <button
                onClick={handleResetData}
                className="mt-2 inline-flex items-center gap-1 text-[11px] text-red-300 hover:text-red-200"
              >
                <RotateCcw className="w-3 h-3" />
                استعادة البيانات الافتراضية الأولية
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
