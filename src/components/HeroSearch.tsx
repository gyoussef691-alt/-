import React, { useState } from 'react';
import { MapPin, Calendar, Users, Search, ArrowRight, ShieldCheck, Car, Package, Sparkles, History } from 'lucide-react';

interface HeroSearchProps {
  onSearch: (filters: {
    origin: string;
    destination: string;
    date: string;
    passengers: number;
    mode: 'ALL' | 'CITY' | 'INTERCITY' | 'PARCEL';
  }) => void;
  onNavigateTab: (tab: string) => void;
}

export interface RecentSearch {
  id: string;
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  serviceType: 'INTERCITY' | 'CITY';
  timestamp: number;
}

const DEFAULT_RECENT_SEARCHES: RecentSearch[] = [
  {
    id: 'default-1',
    origin: 'رأس غارب',
    destination: 'الغردقة',
    date: '2026-10-22',
    passengers: 1,
    serviceType: 'INTERCITY',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'default-2',
    origin: 'رأس غارب',
    destination: 'القاهرة',
    date: '2026-10-23',
    passengers: 1,
    serviceType: 'INTERCITY',
    timestamp: Date.now() - 7200000,
  },
];

const CITIES_INTERCITY = [
  'الكل (جميع الوجهات)',
  'الغردقة',
  'قنا',
  'القاهرة',
  'السويس',
  'الجونة',
  'الزعفرانة',
  'رأس شقير',
];

const LOCAL_AREAS = [
  'شارع الميناء',
  'مساكن الـ 128',
  'مساكن الـ 608',
  'منطقة الكهف',
  'حي الروضة',
  'حي الزهور',
  'شاطئ الغريب',
  'طريق الإذاعة',
];

export const HeroSearch: React.FC<HeroSearchProps> = ({ onSearch, onNavigateTab }) => {
  const [serviceType, setServiceType] = useState<'INTERCITY' | 'CITY' | 'PARCEL'>('INTERCITY');
  const [origin, setOrigin] = useState('رأس غارب');
  const [destination, setDestination] = useState('الغردقة');
  const [date, setDate] = useState('2026-10-22');
  const [passengers, setPassengers] = useState(1);

  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
    try {
      const saved = localStorage.getItem('rgb_recent_searches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_RECENT_SEARCHES;
  });

  const saveRecentSearch = (searchItem: Omit<RecentSearch, 'id' | 'timestamp'>) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) =>
          !(
            item.origin === searchItem.origin &&
            item.destination === searchItem.destination &&
            item.serviceType === searchItem.serviceType
          )
      );
      const updated: RecentSearch[] = [
        {
          id: `search-${Date.now()}`,
          ...searchItem,
          timestamp: Date.now(),
        },
        ...filtered,
      ].slice(0, 4);

      try {
        localStorage.setItem('rgb_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem('rgb_recent_searches');
    } catch {
      // ignore
    }
  };

  const handleSelectRecentSearch = (item: RecentSearch) => {
    setServiceType(item.serviceType);
    setOrigin(item.origin);
    setDestination(item.destination);
    setDate(item.date);
    setPassengers(item.passengers);

    onSearch({
      origin: item.origin,
      destination: item.destination === 'الكل (جميع الوجهات)' ? '' : item.destination,
      date: item.date,
      passengers: item.passengers,
      mode: item.serviceType,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (serviceType === 'PARCEL') {
      onNavigateTab('parcels');
      return;
    }

    saveRecentSearch({
      origin,
      destination,
      date,
      passengers,
      serviceType,
    });

    onSearch({
      origin,
      destination: destination === 'الكل (جميع الوجهات)' ? '' : destination,
      date,
      passengers,
      mode: serviceType,
    });
  };

  return (
    <section className="relative bg-[#0B1F3A] text-white overflow-hidden py-10 sm:py-16">
      {/* Subtle geometric background grid for coastal transport feel */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#146EF5_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Value Proposition Column */}
          <div className="lg:col-span-7 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 text-[#18B981] text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              المنصة المعتمدة الأولى لخدمات النقل في رأس غارب
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.25] text-balance">
              تنقل بأمان وراحة بين <span className="text-[#146EF5]">رأس غارب</span> ومحافظات مصر
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              سواء كنت تبحث عن حجز مقعد في رحلة منتظمة للغردقة وقنا والقاهرة، أو مشوار خاص داخل المدينة، أو إرسال أمانة وطرد عاجل؛ نربطك مباشرة بسائقين محليين موثوقين ومعتمدين.
            </p>

            {/* Quick Proof Metrics adjacent to claim */}
            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-slate-300">
              <div>
                <span className="block text-xl sm:text-2xl font-extrabold text-white font-mono tabular-nums">
                  100%
                </span>
                <span className="text-xs text-slate-400">سائقين معتمدين بالهوية</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-extrabold text-[#18B981] font-mono tabular-nums">
                  10%
                </span>
                <span className="text-xs text-slate-400">أقل عمولة تشغيلية عادلة</span>
              </div>
              <div>
                <span className="block text-xl sm:text-2xl font-extrabold text-[#146EF5] font-mono tabular-nums">
                  نقدي
                </span>
                <span className="text-xs text-slate-400">دفع مباشر عند الوصول</span>
              </div>
            </div>
          </div>

          {/* Interactive Search / Booking Engine Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6 text-[#111827] border border-slate-200">
              {/* Service Type Segmented Selector */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#F7F9FC] rounded-lg mb-5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setServiceType('INTERCITY');
                    setDestination('الغردقة');
                  }}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${
                    serviceType === 'INTERCITY'
                      ? 'bg-[#0B1F3A] text-white shadow-sm'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  سفر بين المدن
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setServiceType('CITY');
                    setDestination('شارع الميناء');
                  }}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${
                    serviceType === 'CITY'
                      ? 'bg-[#0B1F3A] text-white shadow-sm'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  مشوار بالمدينة
                </button>
                <button
                  type="button"
                  onClick={() => setServiceType('PARCEL')}
                  className={`py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${
                    serviceType === 'PARCEL'
                      ? 'bg-[#0B1F3A] text-white shadow-sm'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  شحن طرد
                </button>
              </div>

              {serviceType === 'PARCEL' ? (
                <div className="text-center py-4 space-y-4">
                  <div className="w-12 h-12 mx-auto bg-[#146EF5]/10 rounded-full flex items-center justify-center text-[#146EF5]">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0B1F3A]">خدمة توصيل الأمانات والطرود</h3>
                    <p className="text-xs text-[#6B7280] mt-1">
                      أرسل أمانتك مع سائق متوجه إلى وجهتك في نفس اليوم مع رقم تتبع فوري.
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('parcels')}
                    className="w-full py-2.5 px-4 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span>فتح نموذج شحن طرد جديد</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Origin */}
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1 text-right">
                      نقطة الانطلاق (من)
                    </label>
                    <div className="relative">
                      <select
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full pl-3 pr-9 py-2.5 bg-[#F7F9FC] border border-slate-300 rounded-lg text-sm text-[#111827] focus:ring-2 focus:ring-[#146EF5] focus:outline-none"
                      >
                        <option value="رأس غارب">رأس غارب (الموقف / كافة الأحياء)</option>
                        {serviceType === 'CITY'
                          ? LOCAL_AREAS.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))
                          : CITIES_INTERCITY.filter((c) => !c.includes('الكل')).map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                      </select>
                      <MapPin className="absolute right-3 top-3 w-4 h-4 text-[#146EF5] pointer-events-none" />
                    </div>
                  </div>

                  {/* Destination */}
                  <div>
                    <label className="block text-xs font-semibold text-[#111827] mb-1 text-right">
                      الوجهة المقصودة (إلى)
                    </label>
                    <div className="relative">
                      <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full pl-3 pr-9 py-2.5 bg-[#F7F9FC] border border-slate-300 rounded-lg text-sm text-[#111827] focus:ring-2 focus:ring-[#146EF5] focus:outline-none"
                      >
                        {serviceType === 'CITY'
                          ? LOCAL_AREAS.map((a) => (
                              <option key={a} value={a}>
                                {a}
                              </option>
                            ))
                          : CITIES_INTERCITY.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                      </select>
                      <MapPin className="absolute right-3 top-3 w-4 h-4 text-[#18B981] pointer-events-none" />
                    </div>
                  </div>

                  {/* Date & Passenger Count in 2 columns */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#111827] mb-1 text-right">
                        تاريخ السفر
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full pl-2 pr-8 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs font-medium text-[#111827] focus:ring-2 focus:ring-[#146EF5] focus:outline-none"
                        />
                        <Calendar className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111827] mb-1 text-right">
                        عدد الركاب
                      </label>
                      <div className="relative">
                        <select
                          value={passengers}
                          onChange={(e) => setPassengers(Number(e.target.value))}
                          className="w-full pl-2 pr-8 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs font-medium text-[#111827] focus:ring-2 focus:ring-[#146EF5] focus:outline-none"
                        >
                          {[1, 2, 3, 4, 5, 6, 8, 14].map((num) => (
                            <option key={num} value={num}>
                              {num} {num === 1 ? 'راكب' : num === 2 ? 'راكبان' : 'ركاب'}
                            </option>
                          ))}
                        </select>
                        <Users className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-[#6B7280] pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Search className="w-4 h-4" />
                    <span>البحث عن الرحلات المتاحة</span>
                  </button>
                </form>
              )}

              {/* Recently Searched Routes / مسارات البحث الأخيرة */}
              {recentSearches.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A]">
                      <History className="w-3.5 h-3.5 text-[#146EF5]" />
                      <span>عمليات البحث الأخيرة:</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearRecentSearches}
                      className="text-[11px] text-[#6B7280] hover:text-[#DC2626] transition-colors"
                      title="مسح سجل البحث الأخير"
                    >
                      مسح
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectRecentSearch(item)}
                        className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F7F9FC] hover:bg-[#146EF5]/10 border border-slate-200 hover:border-[#146EF5]/30 rounded-lg text-xs transition-all text-right"
                        title={`بحث فوري: من ${item.origin} إلى ${item.destination}`}
                      >
                        <span className="font-semibold text-[#111827] group-hover:text-[#146EF5]">
                          {item.origin} ← {item.destination}
                        </span>
                        <span className="text-[10px] text-[#6B7280] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                          {item.serviceType === 'CITY' ? 'مشوار' : 'سفر'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Quick Entry for Requests */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#6B7280]">
                <span>لم تجد رحلة تناسب موعدك؟</span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('passenger')}
                  className="text-[#146EF5] font-bold hover:underline"
                >
                  اطلب رحلة واستقبل عروض الأسعار ←
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
