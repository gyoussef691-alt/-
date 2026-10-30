import React from 'react';
import { AlertTriangle, KeyRound, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface GoogleMapsConfigNoticeProps {
  compact?: boolean;
}

export const GoogleMapsConfigNotice: React.FC<GoogleMapsConfigNoticeProps> = ({ compact = false }) => {
  return (
    <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 text-amber-900 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
          <KeyRound className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-bold text-sm text-[#0B1F3A] flex items-center gap-1.5">
              <span>تكامل خرائط Google الرسمية (Google Maps Platform)</span>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                VITE_GOOGLE_MAPS_API_KEY
              </span>
            </h4>
          </div>

          <p className="mt-1.5 text-slate-700 leading-relaxed">
            المنصة تدعم وتنفذ مكتبة <strong>@vis.gl/react-google-maps</strong> والـ JavaScript API الرسمية مع حساب المسارات الفعلي ومحدد المواقع (Geolocation). لتفعيل عرض خريطة Google المباشرة بدلاً من الوضع التجريبي:
          </p>

          {!compact && (
            <div className="mt-3 bg-white/80 p-3 rounded-lg border border-amber-200 space-y-2">
              <span className="font-bold text-xs text-[#0B1F3A] block">
                الخطوات المطلوبة لتشغيل المفتاح في بيئة الإنتاج:
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                <li>
                  قم بإنشاء مشروع في <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" className="text-[#146EF5] font-bold underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="w-2.5 h-2.5 inline" /></a>
                </li>
                <li>
                  فعّل واجهات البرمجة الثلاث: <strong>Maps JavaScript API</strong>، و <strong>Places API (New)</strong>، و <strong>Routes API</strong>.
                </li>
                <li>
                  اضبط قيود المفتاح (Key Restrictions) على <strong>HTTP referrers</strong> لدومين موقعك لمنع الاستخدام غير المصرح به وضبط التكاليف.
                </li>
                <li>
                  أضف المفتاح في ملف البيئة: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">VITE_GOOGLE_MAPS_API_KEY=AIzaSy...</code>
                </li>
              </ul>
            </div>
          )}

          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-amber-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#18B981] shrink-0" />
            <span>
              تم تفعيل وضع المعاينة المباشر وحساب الإحداثيات والمسافات الجغرافية، مع روابط التوجيه المباشرة في خرائط Google.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
