import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone PWA mode, hide
  if (isInstalled) {
    return null;
  }

  // Android / Chrome / Edge installation flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18B981] hover:bg-[#18B981]/90 text-[#0B1F3A] font-bold text-xs transition-all shadow-sm cursor-pointer"
        title="تثبيت التطبيق على هاتفك"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>تثبيت التطبيق على الموبايل</span>
      </button>
    );
  }

  // iOS Safari installation guide flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/20 cursor-pointer"
          title="تثبيت التطبيق على آيفون"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>إضافة للشاشة الرئيسية</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 text-right">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-[#111827] relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#146EF5] flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-[#0B1F3A]">
                  تثبيت رأس غارب موبيليتي على iPhone
                </h3>
              </div>

              <p className="text-xs text-[#6B7280] mb-4">
                يمكنك تشغيل المنصة كتطبيق كامل على جهازك بضغطة زر دون الحاجة لمتجر App Store:
              </p>

              <div className="space-y-3 bg-[#F7F9FC] p-3.5 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    1
                  </span>
                  <span>
                    اضغط على زر المشاركة <Share2 className="w-3.5 h-3.5 inline mx-1 text-[#146EF5]" /> في شريط متصفح Safari السفلي.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    2
                  </span>
                  <span>
                    مرر لأسفل واختر <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-[#18B981]" /> <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    3
                  </span>
                  <span>
                    اضغط <strong>إضافة (Add)</strong> بالأعلى لتظهر أيقونة التطبيق على شاشتك.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2.5 rounded-xl bg-[#0B1F3A] text-white text-xs font-bold hover:bg-[#0B1F3A]/90 transition"
              >
                فهمت، إغلاق
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
