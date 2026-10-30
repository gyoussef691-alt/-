import React, { useState, useEffect } from 'react';
import { mobilityStore } from './store/mobilityStore';
import { Navbar } from './components/Navbar';
import { TransparencyBanner } from './components/TransparencyBanner';
import { HeroSearch } from './components/HeroSearch';
import { TripsList } from './components/TripsList';
import { PassengerArea } from './components/PassengerArea';
import { DriverArea } from './components/DriverArea';
import { AdminArea } from './components/AdminArea';
import { ParcelArea } from './components/ParcelArea';
import { AuthModal } from './components/AuthModal';
import { WorkspaceHub } from './components/workspace/WorkspaceHub';
import { OfflineIndicator } from './components/OfflineIndicator';
import { InAppNotificationToasts } from './components/InAppNotificationCenter';
import { MapPin, Phone, ShieldCheck, HeartHandshake, HelpCircle } from 'lucide-react';

export default function App() {
  const [storeState, setStoreState] = useState(mobilityStore.getState());
  const [activeTab, setActiveTab] = useState<'home' | 'trips' | 'passenger' | 'driver' | 'admin' | 'parcels' | 'workspace'>('home');
  const [searchFilter, setSearchFilter] = useState<{ destination?: string; passengers?: number } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintCategory, setComplaintCategory] = useState('استفسار عام');
  const [complaintFeedback, setComplaintFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = mobilityStore.subscribe(() => {
      setStoreState({ ...mobilityStore.getState() });
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = (filters: {
    origin: string;
    destination: string;
    date: string;
    passengers: number;
    mode: 'ALL' | 'CITY' | 'INTERCITY' | 'PARCEL';
  }) => {
    if (filters.destination) {
      setSearchFilter({
        destination: filters.destination,
        passengers: filters.passengers,
      });
    } else {
      setSearchFilter(null);
    }
    setActiveTab('trips');
  };

  const handleSendComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    const res = mobilityStore.submitComplaint(complaintCategory, complaintText);
    setComplaintFeedback(res.message);
    setComplaintText('');
    setTimeout(() => setComplaintFeedback(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#111827] flex flex-col font-sans selection:bg-[#146EF5]/20 selection:text-[#0B1F3A]">
      {/* 1. Technical Transparency Banner */}
      <TransparencyBanner currentUser={storeState.currentUser} />

      {/* 2. Top Navigation Bar (3-Zone Contract) */}
      <Navbar
        currentUser={storeState.currentUser}
        activeTab={activeTab}
        notifications={storeState.notifications || []}
        onTabChange={(tab) => {
          setActiveTab(tab as any);
          if (tab !== 'trips') setSearchFilter(null);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Real-Time Floating In-App Notification Toasts */}
      <InAppNotificationToasts
        toasts={storeState.activeToasts || []}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
      />

      {/* 3. Main Dynamic Content */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <>
            <HeroSearch
              onSearch={handleSearch}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />

            {/* Popular Routes Quick Selector */}
            <div className="bg-white border-b border-slate-200 py-4">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="font-bold text-[#0B1F3A] shrink-0">
                  الخطوط السريعة الأكثر طلباً من رأس غارب:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {[
                    { name: 'الغردقة', distance: '150 كم', price: '85 ج.م' },
                    { name: 'القاهرة', distance: '320 كم', price: '180 ج.م' },
                    { name: 'قنا', distance: '320 كم', price: '170 ج.م' },
                    { name: 'رأس شقير', distance: '35 كم', price: '40 ج.م' },
                  ].map((r) => (
                    <button
                      key={r.name}
                      onClick={() => {
                        setSearchFilter({ destination: r.name, passengers: 1 });
                        setActiveTab('trips');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#F7F9FC] hover:bg-[#146EF5]/10 border border-slate-200 hover:border-[#146EF5] text-[#111827] font-semibold transition-all whitespace-nowrap flex items-center gap-1.5"
                    >
                      <span className="font-bold text-[#146EF5]">{r.name}</span>
                      <span className="text-[11px] text-[#6B7280]">({r.distance} · {r.price})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Curated Trips Section below Hero */}
            <div className="border-t border-slate-200">
              <TripsList
                trips={storeState.trips}
                onOpenPassengerTab={() => setActiveTab('passenger')}
                activeFilter={searchFilter}
                onClearFilter={() => setSearchFilter(null)}
              />
            </div>

            {/* Red Sea & Ras Gharib Operational Highlights */}
            <section className="bg-white py-12 border-t border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <h3 className="text-2xl font-extrabold text-[#0B1F3A]">
                    لماذا يفضل أهالي رأس غارب منصتنا؟
                  </h3>
                  <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
                    حلول حقيقية صممت خصيصاً لاحتياجات أهالي المدينة، وقطاع البترول، وخطوط السفر الساحلية.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-xl bg-[#F7F9FC] border border-slate-200 text-right">
                    <div className="w-10 h-10 bg-[#146EF5]/10 rounded-lg flex items-center justify-center text-[#146EF5] mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-[#0B1F3A] mb-1">
                      أمان كامل وفحص للتراخيص
                    </h4>
                    <p className="text-xs text-[#6B7280] leading-relaxed">
                      يخضع كل سائق لمراجعة دقيقة لبطاقة الرقم القومي ورخصة القيادة وصلاحية المركبة قبل السماح له بنقل الركاب أو استلام الأمانات.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-[#F7F9FC] border border-slate-200 text-right">
                    <div className="w-10 h-10 bg-[#18B981]/10 rounded-lg flex items-center justify-center text-[#18B981] mb-3">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-[#0B1F3A] mb-1">
                      شفافية الأسعار بدون وسيط
                    </h4>
                    <p className="text-xs text-[#6B7280] leading-relaxed">
                      سواء في حجز المقاعد الثابتة أو طلبات المشاوير الخاصة، يتفق الراكب والسائق على السعر مسبقاً مع دفع نقدي مباشر عند الوصول.
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-[#F7F9FC] border border-slate-200 text-right">
                    <div className="w-10 h-10 bg-[#0B1F3A]/10 rounded-lg flex items-center justify-center text-[#0B1F3A] mb-3">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-[#0B1F3A] mb-1">
                      تغطية شاملة للبحر الأحمر والقاهرة
                    </h4>
                    <p className="text-xs text-[#6B7280] leading-relaxed">
                      خطوط يومية منتظمة بين رأس غارب والغردقة، وقنا، والقاهرة، والسويس، والجونة، والزعفرانة، وخدمة خاصة لمهندسي وعمال رأس شقير.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === 'trips' && (
          <TripsList
            trips={storeState.trips}
            onOpenPassengerTab={() => setActiveTab('passenger')}
            activeFilter={searchFilter}
            onClearFilter={() => setSearchFilter(null)}
          />
        )}

        {activeTab === 'passenger' && (
          <PassengerArea
            currentUser={storeState.currentUser}
            requests={storeState.requests}
            offers={storeState.offers}
            bookings={storeState.bookings}
            notifications={storeState.notifications || []}
          />
        )}

        {activeTab === 'driver' && (
          <DriverArea
            currentUser={storeState.currentUser}
            drivers={storeState.drivers}
            trips={storeState.trips}
            requests={storeState.requests}
            offers={storeState.offers}
            commissions={storeState.commissions}
          />
        )}

        {activeTab === 'admin' && (
          <AdminArea
            drivers={storeState.drivers}
            requests={storeState.requests}
            trips={storeState.trips}
            bookings={storeState.bookings}
            parcels={storeState.parcels}
            complaints={storeState.complaints}
            commissions={storeState.commissions}
            settings={storeState.settings}
          />
        )}

        {activeTab === 'parcels' && (
          <ParcelArea
            currentUser={storeState.currentUser}
            parcels={storeState.parcels}
          />
        )}

        {activeTab === 'workspace' && <WorkspaceHub />}
      </main>

      {/* 4. Support & Feedback Strip */}
      <section className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F7F9FC] rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 font-bold text-[#0B1F3A] text-sm">
                <HelpCircle className="w-4 h-4 text-[#146EF5]" />
                <span>خدمة العملاء والشكاوى السريعة</span>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                فريق تشغيل المنصة في رأس غارب متاح لمتابعة الرحلات وحل أي مشكلة فوراً.
              </p>
            </div>

            <form onSubmit={handleSendComplaint} className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder="اكتب ملاحظتك أو استفسارك هنا..."
                className="w-full sm:w-80 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-1.5 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-bold rounded-lg text-xs transition-colors whitespace-nowrap"
              >
                إرسال للإدارة
              </button>
            </form>
          </div>
          {complaintFeedback && (
            <p className="text-xs text-[#18B981] font-bold mt-2 text-right">
              {complaintFeedback}
            </p>
          )}
        </div>
      </section>

      {/* 5. Quiet Anti-Slop Footer */}
      <footer className="bg-[#0B1F3A] text-slate-400 py-8 text-xs border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
            <div>
              <span className="text-white font-extrabold text-sm block">
                رأس غارب موبيليتي — Ras Gharib Mobility
              </span>
              <span className="text-slate-400 text-[11px] block mt-0.5">
                خدمات النقل والرحلات وشحن الأمانات في رأس غارب والبحر الأحمر
              </span>
            </div>

            <div className="flex items-center gap-6 text-[11px] text-slate-300">
              <button onClick={() => setActiveTab('trips')} className="hover:text-white transition-colors">
                الرحلات المتاحة
              </button>
              <button onClick={() => setActiveTab('passenger')} className="hover:text-white transition-colors">
                طلب رحلة
              </button>
              <button onClick={() => setActiveTab('driver')} className="hover:text-white transition-colors">
                تسجيل سائق
              </button>
              <button onClick={() => setActiveTab('admin')} className="hover:text-white transition-colors">
                لوحة الإدارة
              </button>
              <button onClick={() => setActiveTab('workspace')} className="hover:text-white transition-colors font-bold text-slate-200">
                خدمات Google
              </button>
            </div>

            <div className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} جميع الحقوق محفوظة لمالك المشروع.
            </div>
          </div>
        </div>
      </footer>

      {/* 6. Phone Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* 7. Offline Network Indicator */}
      <OfflineIndicator />
    </div>
  );
}
