import React from 'react';
import { User, InAppNotification } from '../types';
import { UserCheck, Shield, Car, Navigation, Package } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { NavbarNotificationBell } from './InAppNotificationCenter';

interface NavbarProps {
  currentUser: User;
  activeTab: string;
  notifications?: InAppNotification[];
  onTabChange: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  notifications = [],
  onTabChange,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#0B1F3A]/10 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single clean brand wordmark in display face */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onTabChange('home')}
              className="text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146EF5]"
            >
              <span className="text-xl sm:text-2xl font-extrabold text-[#0B1F3A] tracking-tight block">
                رأس غارب موبيليتي
              </span>
              <span className="text-[11px] text-[#6B7280] block font-medium -mt-1">
                Ras Gharib Mobility
              </span>
            </button>
          </div>

          {/* Zone 2: Clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#111827]">
            <button
              onClick={() => onTabChange('trips')}
              className={`hover:text-[#146EF5] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'trips' ? 'border-[#146EF5] text-[#146EF5]' : 'border-transparent text-[#111827]'
              }`}
            >
              الرحلات المتاحة
            </button>
            <button
              onClick={() => onTabChange('passenger')}
              className={`hover:text-[#146EF5] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'passenger' ? 'border-[#146EF5] text-[#146EF5]' : 'border-transparent text-[#111827]'
              }`}
            >
              حساب الراكب
            </button>
            <button
              onClick={() => onTabChange('driver')}
              className={`hover:text-[#146EF5] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'driver' ? 'border-[#146EF5] text-[#146EF5]' : 'border-transparent text-[#111827]'
              }`}
            >
              بوابة السائقين
            </button>
            <button
              onClick={() => onTabChange('parcels')}
              className={`hover:text-[#146EF5] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'parcels' ? 'border-[#146EF5] text-[#146EF5]' : 'border-transparent text-[#111827]'
              }`}
            >
              شحن الطرود
            </button>
            <button
              onClick={() => onTabChange('admin')}
              className={`hover:text-[#146EF5] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'admin' ? 'border-[#146EF5] text-[#146EF5]' : 'border-transparent text-[#111827]'
              }`}
            >
              لوحة الإدارة
            </button>
            <button
              onClick={() => onTabChange('workspace')}
              className={`hover:text-[#146EF5] transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 flex items-center gap-1.5 ${
                activeTab === 'workspace' ? 'border-[#146EF5] text-[#146EF5] font-bold' : 'border-transparent text-[#111827]'
              }`}
            >
              <span>خدمات Google</span>
            </button>
          </nav>

          {/* Zone 3: In-App Notification Center + Profile selector & PWA Install */}
          <div className="flex items-center gap-2.5 shrink-0">
            <NavbarNotificationBell
              notifications={notifications}
              onNavigateTab={onTabChange}
            />
            <PWAInstallButton />
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
              title="تغيير الحساب أو تسجيل الدخول"
            >
              <UserCheck className="w-4 h-4 text-[#18B981]" />
              <span className="truncate max-w-[130px] sm:max-w-[180px]">
                {currentUser.fullName}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Secondary Navigation Row */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-[#F7F9FC] py-2 px-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => onTabChange('trips')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'trips' ? 'bg-[#146EF5] text-white' : 'text-[#111827]'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          الرحلات
        </button>
        <button
          onClick={() => onTabChange('passenger')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'passenger' ? 'bg-[#146EF5] text-white' : 'text-[#111827]'
          }`}
        >
          الركاب
        </button>
        <button
          onClick={() => onTabChange('driver')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'driver' ? 'bg-[#146EF5] text-white' : 'text-[#111827]'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          السائقين
        </button>
        <button
          onClick={() => onTabChange('parcels')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'parcels' ? 'bg-[#146EF5] text-white' : 'text-[#111827]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          الطرود
        </button>
        <button
          onClick={() => onTabChange('admin')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'admin' ? 'bg-[#0B1F3A] text-white' : 'text-[#111827]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          الإدارة
        </button>
        <button
          onClick={() => onTabChange('workspace')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md whitespace-nowrap ${
            activeTab === 'workspace' ? 'bg-[#146EF5] text-white' : 'text-[#111827]'
          }`}
        >
          جوجل
        </button>
      </div>
    </header>
  );
};
