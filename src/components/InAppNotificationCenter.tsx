import React, { useState, useEffect, useRef } from 'react';
import { InAppNotification } from '../types';
import { mobilityStore } from '../store/mobilityStore';
import {
  Bell,
  BellRing,
  CheckCircle,
  Car,
  Clock,
  Star,
  Package,
  AlertCircle,
  CheckCheck,
  Trash2,
  Zap,
  ExternalLink,
  X,
} from 'lucide-react';

interface NotificationBellProps {
  notifications: InAppNotification[];
  onNavigateTab: (tab: string) => void;
}

export const getNotificationIcon = (type: InAppNotification['type']) => {
  switch (type) {
    case 'DRIVER_OFFER_RECEIVED':
      return <Car className="w-4 h-4 text-[#146EF5]" />;
    case 'OFFER_ACCEPTED':
      return <CheckCircle className="w-4 h-4 text-[#18B981]" />;
    case 'BOOKING_CONFIRMED':
      return <CheckCircle className="w-4 h-4 text-[#18B981]" />;
    case 'BOOKING_CANCELLED':
      return <AlertCircle className="w-4 h-4 text-[#DC2626]" />;
    case 'TRIP_STATUS_UPDATED':
      return <Clock className="w-4 h-4 text-[#146EF5]" />;
    case 'TRIP_RATED':
      return <Star className="w-4 h-4 text-amber-500 fill-amber-400" />;
    case 'PARCEL_STATUS_UPDATED':
      return <Package className="w-4 h-4 text-[#0B1F3A]" />;
    default:
      return <BellRing className="w-4 h-4 text-[#146EF5]" />;
  }
};

export const getNotificationTypeLabel = (type: InAppNotification['type']) => {
  switch (type) {
    case 'DRIVER_OFFER_RECEIVED':
      return 'عرض وقبول سائق';
    case 'OFFER_ACCEPTED':
      return 'تأكيد رحلة مع سائق';
    case 'BOOKING_CONFIRMED':
      return 'تأكيد حجز مقعد';
    case 'BOOKING_CANCELLED':
      return 'إلغاء حجز';
    case 'TRIP_STATUS_UPDATED':
      return 'تحديث حالة الطلب';
    case 'TRIP_RATED':
      return 'تقييم متبادل';
    case 'PARCEL_STATUS_UPDATED':
      return 'تحديث حالة طرد';
    case 'REQUEST_CREATED':
      return 'طلب رحلة جديد';
    default:
      return 'تنبيه النظام';
  }
};

export const NavbarNotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onNavigateTab,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'DRIVER_UPDATES'>('ALL');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'DRIVER_UPDATES') {
      return (
        n.type === 'DRIVER_OFFER_RECEIVED' ||
        n.type === 'OFFER_ACCEPTED' ||
        n.type === 'TRIP_STATUS_UPDATED'
      );
    }
    return true;
  });

  const handleSelectNotification = (notif: InAppNotification) => {
    mobilityStore.markNotificationAsRead(notif.id);
    if (notif.targetTab) {
      onNavigateTab(notif.targetTab);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
          unreadCount > 0
            ? 'bg-blue-50/80 border-blue-200 text-[#0B1F3A] hover:bg-blue-100/80'
            : 'bg-[#F7F9FC] border-slate-200 text-slate-700 hover:bg-slate-100'
        }`}
        aria-label="مركز الإشعارات الفورية"
        title="الإشعارات الفورية وتحديثات الرحلات"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-4 h-4 text-[#146EF5]" />
        ) : (
          <Bell className="w-4 h-4 text-slate-600" />
        )}
        <span className="hidden lg:inline text-xs font-bold text-[#0B1F3A]">
          الإشعارات
        </span>
        {unreadCount > 0 && (
          <span className="px-1.5 py-0.5 text-[10px] font-black font-mono tabular-nums bg-[#DC2626] text-white rounded-md leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute left-3 right-3 sm:right-auto sm:left-0 top-16 sm:top-full sm:mt-2 sm:w-[410px] bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-[#0B1F3A] text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-[#18B981]" />
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold">
                  مركز الإشعارات الفورية (In-App Notifications)
                </h3>
                <p className="text-[11px] text-slate-300">
                  تنبيهات لحظية عند تحديث حالة طلباتك أو قبول السائقين لرحلاتك
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter & Action Strip */}
          <div className="p-2.5 bg-[#F7F9FC] border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  filter === 'ALL'
                    ? 'bg-[#0B1F3A] text-white'
                    : 'text-slate-600 hover:text-[#0B1F3A]'
                }`}
              >
                الكل ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('UNREAD')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  filter === 'UNREAD'
                    ? 'bg-[#146EF5] text-white'
                    : 'text-slate-600 hover:text-[#146EF5]'
                }`}
              >
                غير مقروءة ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('DRIVER_UPDATES')}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  filter === 'DRIVER_UPDATES'
                    ? 'bg-[#18B981] text-white'
                    : 'text-slate-600 hover:text-[#18B981]'
                }`}
              >
                قبول السائقين
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => mobilityStore.markAllNotificationsAsRead()}
                  className="px-2 py-1 text-[11px] font-bold text-[#146EF5] hover:bg-blue-50 rounded-md flex items-center gap-1 cursor-pointer"
                  title="تحديد الكل كمقروء"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>قراءة الكل</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => mobilityStore.simulateInstantDriverNotification()}
                className="px-2.5 py-1 bg-[#18B981] hover:bg-[#18B981]/90 text-white rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="تجربة إشعار فوري لقبول سائق"
              >
                <Zap className="w-3 h-3" />
                <span>محاكاة إشعار سائق</span>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-500">
                  لا توجد إشعارات في هذا التصنيف حالياً.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleSelectNotification(notif)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    !notif.isRead
                      ? 'bg-blue-50/40 hover:bg-blue-50/80'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F7F9FC] border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#146EF5]">
                        {getNotificationTypeLabel(notif.type)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                        {new Date(notif.createdAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4
                      className={`text-xs mt-0.5 ${
                        !notif.isRead
                          ? 'font-extrabold text-[#0B1F3A]'
                          : 'font-bold text-slate-700'
                      }`}
                    >
                      {notif.title}
                    </h4>

                    <p className="text-[11px] text-[#6B7280] leading-relaxed mt-1">
                      {notif.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      mobilityStore.deleteNotification(notif.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    title="حذف الإشعار"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#F7F9FC] border-t border-slate-200 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onNavigateTab('passenger');
                setIsOpen(false);
              }}
              className="font-bold text-[#146EF5] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>فتح سجل إشعارات وطلبات الراكب</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => mobilityStore.clearAllNotifications()}
                className="text-[11px] text-slate-500 hover:text-red-600 font-semibold cursor-pointer"
              >
                مسح السجل
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts: InAppNotification[];
  onNavigateTab: (tab: string) => void;
}

export const InAppNotificationToasts: React.FC<ToastContainerProps> = ({
  toasts,
  onNavigateTab,
}) => {
  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[0];
    const timer = setTimeout(() => {
      mobilityStore.dismissToast(latest.id);
    }, 6500);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-20 left-4 z-50 w-full max-w-sm space-y-2.5 pointer-events-none px-2 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-4 transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              {getNotificationIcon(toast.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-[#146EF5]">
                  إشعار فوري · {getNotificationTypeLabel(toast.type)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">الآن</span>
              </div>

              <h4 className="text-xs sm:text-sm font-extrabold text-[#0B1F3A] mt-0.5">
                {toast.title}
              </h4>

              <p className="text-xs text-[#6B7280] leading-relaxed mt-1">
                {toast.message}
              </p>

              <div className="mt-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    mobilityStore.markNotificationAsRead(toast.id);
                    mobilityStore.dismissToast(toast.id);
                    if (toast.targetTab) {
                      onNavigateTab(toast.targetTab);
                    }
                  }}
                  className="text-xs font-extrabold text-[#146EF5] hover:text-[#0B1F3A] transition-colors cursor-pointer"
                >
                  عرض الطلب الآن ←
                </button>
                <button
                  type="button"
                  onClick={() => mobilityStore.dismissToast(toast.id)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => mobilityStore.dismissToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              aria-label="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
