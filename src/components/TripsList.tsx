import React, { useState } from 'react';
import { PublishedTrip } from '../types';
import { mobilityStore } from '../store/mobilityStore';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Filter,
  Check,
} from 'lucide-react';

interface TripsListProps {
  trips: PublishedTrip[];
  onOpenPassengerTab: () => void;
  activeFilter?: {
    destination?: string;
    passengers?: number;
  } | null;
  onClearFilter?: () => void;
}

export const TripsList: React.FC<TripsListProps> = ({
  trips,
  onOpenPassengerTab,
  activeFilter,
  onClearFilter,
}) => {
  const [selectedDestination, setSelectedDestination] = useState<string>(
    activeFilter?.destination || 'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'PENDING' | 'COMPLETED'>('ALL');
  const [bookingTripId, setBookingTripId] = useState<string | null>(null);
  const [seatsToBook, setSeatsToBook] = useState<number>(activeFilter?.passengers || 1);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const effectiveDestination = activeFilter?.destination || selectedDestination;

  // Render visual status badge based on trip.status
  const renderTripStatusBadge = (status: PublishedTrip['status'] | undefined) => {
    const currentStatus = status || 'SCHEDULED';

    switch (currentStatus) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>مكتملة (Completed)</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>قيد الانتظار (Pending)</span>
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#146EF5] border border-blue-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#146EF5] animate-ping" />
            <span>جارية الآن (Active)</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-xs">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>ملغاة (Cancelled)</span>
          </span>
        );
      case 'SCHEDULED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-[#0B1F3A] border border-slate-300 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#146EF5]" />
            <span>مجدولة (Scheduled)</span>
          </span>
        );
    }
  };

  const filteredTrips = trips.filter((t) => {
    // Filter by status if selected
    if (statusFilter !== 'ALL' && (t.status || 'SCHEDULED') !== statusFilter) {
      return false;
    }
    // In ALL view, hide CANCELLED trips by default
    if (statusFilter === 'ALL' && t.status === 'CANCELLED') {
      return false;
    }
    if (effectiveDestination !== 'ALL' && effectiveDestination && t.destinationCity !== effectiveDestination) {
      return false;
    }
    if (activeFilter?.passengers && t.availableSeats < activeFilter.passengers) {
      return false;
    }
    return true;
  });

  // Calculate status counts for quick tabs
  const scheduledCount = trips.filter((t) => (t.status || 'SCHEDULED') === 'SCHEDULED').length;
  const pendingCount = trips.filter((t) => t.status === 'PENDING').length;
  const completedCount = trips.filter((t) => t.status === 'COMPLETED').length;

  const handleStartBooking = (trip: PublishedTrip) => {
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') return;
    setBookingTripId(trip.id);
    setSeatsToBook(1);
    setAlertMessage(null);
  };

  const handleConfirmBooking = (trip: PublishedTrip) => {
    try {
      const booking = mobilityStore.bookTrip(trip.id, seatsToBook);
      setAlertMessage({
        type: 'success',
        text: `تم تأكيد حجز ${seatsToBook} مقعد بنجاح! القيمة الإجمالية: ${booking.totalFare} ج.م (تدفع نقداً للسائق عند الركوب). الحجز مسجل برقم #${booking.id.slice(-6)}.`,
      });
      setBookingTripId(null);
    } catch (err: any) {
      setAlertMessage({
        type: 'error',
        text: err.message || 'فشل في تأكيد الحجز بسبب تجاوز السعة المتاحة.',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0B1F3A]">
            دليل الرحلات والمسارات
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            رحلات معلنة مسبقاً من سائقين معتمدين مع شارات الحالة الفورية (مكتملة، قيد الانتظار، مجدولة).
          </p>
        </div>

        {/* Filter controls: Status & Destination */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Status Tabs */}
          <div className="inline-flex items-center p-1 bg-[#F7F9FC] rounded-lg border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-[#0B1F3A] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              الكل ({trips.length})
            </button>
            <button
              onClick={() => setStatusFilter('SCHEDULED')}
              className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                statusFilter === 'SCHEDULED'
                  ? 'bg-[#0B1F3A] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              <span>مجدولة</span>
              <span className="text-[10px] bg-slate-200 text-[#0B1F3A] px-1.5 rounded-full font-mono">
                {scheduledCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              <span>قيد الانتظار</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 rounded-full font-mono">
                {pendingCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <span>مكتملة</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 rounded-full font-mono">
                {completedCount}
              </span>
            </button>
          </div>

          {/* Destination tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            {activeFilter?.destination && (
              <div className="flex items-center gap-1 bg-[#146EF5]/15 text-[#146EF5] px-2.5 py-1.5 rounded-lg">
                <span>تصفية: {activeFilter.destination}</span>
                {onClearFilter && (
                  <button
                    onClick={onClearFilter}
                    className="font-bold hover:text-[#0B1F3A] mr-1"
                    title="إلغاء التصفية"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {['ALL', 'الغردقة', 'القاهرة', 'قنا', 'السويس'].map((city) => (
              <button
                key={city}
                onClick={() => {
                  setSelectedDestination(city);
                  if (onClearFilter) onClearFilter();
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  effectiveDestination === city
                    ? 'bg-[#146EF5] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-[#111827] hover:bg-slate-50'
                }`}
              >
                {city === 'ALL' ? 'كافة الوجهات' : city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {alertMessage && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
            alertMessage.type === 'success'
              ? 'bg-[#18B981]/10 text-[#0B1F3A] border border-[#18B981]/30'
              : 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30'
          }`}
        >
          {alertMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#18B981] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-bold block">
              {alertMessage.type === 'success' ? 'تمت العملية بنجاح' : 'تنبيه'}
            </span>
            <p className="text-xs mt-0.5 leading-relaxed">{alertMessage.text}</p>
          </div>
          {alertMessage.type === 'success' && (
            <button
              onClick={onOpenPassengerTab}
              className="text-xs font-bold text-[#146EF5] underline underline-offset-2 shrink-0 self-center"
            >
              عرض حجوزاتي
            </button>
          )}
        </div>
      )}

      {/* Trips Grid */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
          <p className="text-[#6B7280] text-sm">
            لا توجد رحلات تطابق خيارات التصفية الحالية.
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setSelectedDestination('ALL');
                if (onClearFilter) onClearFilter();
              }}
              className="px-4 py-2 bg-slate-100 text-[#0B1F3A] rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              إعادة ضبط التصفية
            </button>
            <button
              onClick={onOpenPassengerTab}
              className="px-4 py-2 bg-[#146EF5] text-white rounded-lg text-xs font-bold hover:bg-[#146EF5]/90 transition-colors"
            >
              طلب رحلة خاصة
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrips.map((trip) => {
            const dateObj = new Date(trip.departureTime);
            const timeStr = isNaN(dateObj.getTime())
              ? trip.departureTime
              : dateObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            const dateStr = isNaN(dateObj.getTime())
              ? trip.departureTime
              : dateObj.toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' });

            // Dynamic calculation of booked seats and remaining seats (totalSeats - bookedSeats)
            const capacity = mobilityStore.getTripCapacity(trip.id);
            const bookedSeats = capacity.bookedSeats;
            const remainingSeats = Math.max(0, trip.totalSeats - bookedSeats);
            const isSoldOut = remainingSeats === 0;
            const isCompleted = trip.status === 'COMPLETED';
            const isPending = trip.status === 'PENDING';
            const isCancelled = trip.status === 'CANCELLED';

            const occupancyPercent = trip.totalSeats > 0
              ? Math.min(100, Math.round((bookedSeats / trip.totalSeats) * 100))
              : 100;
            const isAlmostFull = !isSoldOut && !isCompleted && remainingSeats <= 3;

            const isBookingThis = bookingTripId === trip.id;

            return (
              <div
                key={trip.id}
                className={`bg-white rounded-xl border shadow-xs transition-all p-5 flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-200/70 bg-slate-50/60'
                    : isPending
                    ? 'border-amber-200 bg-amber-50/10 hover:shadow-md'
                    : isSoldOut
                    ? 'border-red-200/80 bg-slate-50/50'
                    : 'border-slate-200 hover:shadow-md hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Status & Route Header */}
                  <div className="pb-3 border-b border-slate-100">
                    {/* Visual Trip Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        {renderTripStatusBadge(trip.status)}
                      </div>
                      <span className="text-[11px] text-[#6B7280] font-mono">
                        #{trip.id}
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 text-base font-extrabold text-[#0B1F3A]">
                          <span>{trip.originCity}</span>
                          <span className="text-[#146EF5] font-normal">←</span>
                          <span>{trip.destinationCity}</span>
                        </div>
                        <span className="text-[11px] text-[#6B7280] block mt-0.5">
                          {trip.originDetails}
                        </span>
                      </div>

                      <div className="text-left shrink-0">
                        {isCompleted ? (
                          <div className="text-left">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                              انتهت الرحلة
                            </span>
                            <span className="text-[10px] text-[#6B7280] block mt-0.5 font-mono">
                              {trip.pricePerSeat} ج.م
                            </span>
                          </div>
                        ) : isSoldOut ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-100 text-red-700 text-xs font-extrabold border border-red-200">
                            Sold Out (ممتلئة)
                          </span>
                        ) : (
                          <div>
                            <div className="text-lg font-extrabold text-[#146EF5] font-mono tabular-nums">
                              {trip.pricePerSeat} <span className="text-xs font-sans">ج.م</span>
                            </div>
                            <span className="text-[10px] text-[#6B7280] block -mt-1">
                              للمقعد الواحد
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clean unboxed metadata with dynamic remaining seats display */}
                  <div className="mt-3 text-xs text-[#6B7280] space-y-2">
                    <div className="flex items-center gap-2 text-[#111827]">
                      <Calendar className="w-3.5 h-3.5 text-[#146EF5]" />
                      <span>{dateStr}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <Clock className="w-3.5 h-3.5 text-[#146EF5]" />
                      <span>{timeStr}</span>
                    </div>

                    {/* Real-Time Seat Capacity Meter & Dynamic Calculation (totalSeats - bookedSeats) */}
                    <div className="pt-1.5 pb-0.5 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Users
                            className={`w-3.5 h-3.5 ${
                              isCompleted
                                ? 'text-emerald-600'
                                : isSoldOut
                                ? 'text-red-500'
                                : isAlmostFull
                                ? 'text-[#F59E0B]'
                                : 'text-[#18B981]'
                            }`}
                          />
                          <span
                            className={
                              isCompleted
                                ? 'text-emerald-700 font-bold'
                                : isSoldOut
                                ? 'text-red-600 font-extrabold'
                                : isAlmostFull
                                ? 'text-[#F59E0B]'
                                : 'text-[#18B981]'
                            }
                          >
                            {isCompleted
                              ? 'حالة السعة: اكتملت الرحلة'
                              : isSoldOut
                              ? 'حالة الرحلة: ممتلئة (Sold Out)'
                              : `المقاعد المتبقية: ${remainingSeats} مقاعد`}
                          </span>
                        </div>

                        {/* Explicit breakdown: totalSeats - bookedSeats */}
                        <span className="text-[#6B7280] font-mono tabular-nums text-[10px]">
                          {trip.totalSeats} - {bookedSeats} = {remainingSeats} متاح ({occupancyPercent}%)
                        </span>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCompleted
                              ? 'bg-emerald-500'
                              : isSoldOut
                              ? 'bg-red-500'
                              : isAlmostFull
                              ? 'bg-[#F59E0B]'
                              : 'bg-[#18B981]'
                          }`}
                          style={{ width: `${occupancyPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                        <span>المحجوز: {bookedSeats} مقعد</span>
                        <span>السعة القصوى: {trip.totalSeats} مقعد</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                      <span className="text-[#111827] font-semibold">{trip.driverName}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-amber-500 font-mono font-bold">★ {trip.driverRating}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>{trip.vehicleModel}</span>
                    </div>

                    {isPending && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>الرحلة قيد الانتظار: سيتم تأكيد الانطلاق عند بلوغ الحد الأدنى من الركاب.</span>
                      </div>
                    )}

                    {trip.notes && (
                      <p className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-100">
                        {trip.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Booking Action Area */}
                <div className="mt-5 pt-3 border-t border-slate-100">
                  {isCompleted ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-3 text-xs font-bold rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>الرحلة مكتملة بالفعل (Completed)</span>
                    </button>
                  ) : isCancelled ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 px-3 text-xs font-bold rounded-lg bg-rose-50 text-rose-500 cursor-not-allowed border border-rose-200 flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span>تم إلغاء الرحلة</span>
                    </button>
                  ) : isBookingThis && !isSoldOut ? (
                    <div className="bg-[#F7F9FC] p-3 rounded-lg border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#0B1F3A]">عدد المقاعد المطلوبة:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={seatsToBook <= 1}
                            onClick={() => setSeatsToBook(Math.max(1, seatsToBook - 1))}
                            className="w-7 h-7 bg-white border border-slate-300 rounded font-bold hover:bg-slate-100 disabled:opacity-40"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-bold font-mono">
                            {seatsToBook}
                          </span>
                          <button
                            type="button"
                            disabled={seatsToBook >= remainingSeats}
                            onClick={() => setSeatsToBook(Math.min(remainingSeats, seatsToBook + 1))}
                            className="w-7 h-7 bg-white border border-slate-300 rounded font-bold hover:bg-slate-100 disabled:opacity-40"
                            title={seatsToBook >= remainingSeats ? 'وصلت للحد الأقصى للمقاعد المتاحة' : 'إضافة مقعد'}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#6B7280] bg-white p-2 rounded border border-slate-200 space-y-0.5">
                        <div className="flex justify-between">
                          <span>المقاعد المتبقية للحجز الآن:</span>
                          <strong className="font-mono text-[#18B981]">{remainingSeats} من {trip.totalSeats}</strong>
                        </div>
                        {seatsToBook === remainingSeats && remainingSeats > 0 && (
                          <span className="text-[10px] text-[#F59E0B] font-bold block">
                            تنبيه: هذا الحجز سيشغل آخر المقاعد المتاحة في هذه الرحلة بالكامل.
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                        <span className="text-[#6B7280]">الإجمالي المستحق (نقداً):</span>
                        <span className="font-extrabold text-[#146EF5] font-mono text-sm">
                          {seatsToBook * trip.pricePerSeat} ج.م
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSoldOut || seatsToBook > remainingSeats}
                          onClick={() => handleConfirmBooking(trip)}
                          className="flex-1 py-2 bg-[#18B981] hover:bg-[#18B981]/90 disabled:bg-slate-300 text-white font-bold rounded text-xs transition-colors"
                        >
                          تأكيد الحجز الفوري
                        </button>
                        <button
                          type="button"
                          onClick={() => setBookingTripId(null)}
                          className="px-3 py-2 bg-slate-200 text-[#111827] font-semibold rounded text-xs hover:bg-slate-300"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSoldOut}
                      onClick={() => {
                        if (!isSoldOut) {
                          handleStartBooking(trip);
                        }
                      }}
                      className={`w-full py-2.5 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        isSoldOut
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                          : isPending
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                          : 'bg-[#146EF5] hover:bg-[#146EF5]/90 text-white shadow-xs'
                      }`}
                    >
                      {isSoldOut ? (
                        <span>ممتلئة بالكامل — Sold Out</span>
                      ) : isPending ? (
                        <span>حجز مقعد (قيد الانتظار — متبقي {remainingSeats} مقاعد)</span>
                      ) : (
                        <span>حجز مقعد الآن (متبقي {remainingSeats} مقاعد)</span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
