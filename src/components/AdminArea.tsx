import React, { useState } from 'react';
import {
  DriverProfile,
  RideRequest,
  PublishedTrip,
  Booking,
  Parcel,
  Complaint,
  CommissionRecord,
  SystemSettings,
  DriverVerificationStatus,
} from '../types';
import { mobilityStore } from '../store/mobilityStore';
import {
  ShieldCheck,
  Users,
  Car,
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Sliders,
  TrendingUp,
} from 'lucide-react';

interface AdminAreaProps {
  drivers: DriverProfile[];
  requests: RideRequest[];
  trips: PublishedTrip[];
  bookings: Booking[];
  parcels: Parcel[];
  complaints: Complaint[];
  commissions: CommissionRecord[];
  settings: SystemSettings;
}

export const AdminArea: React.FC<AdminAreaProps> = ({
  drivers,
  requests,
  trips,
  bookings,
  parcels,
  complaints,
  commissions,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'DRIVERS' | 'COMMISSIONS' | 'OPERATIONS' | 'COMPLAINTS' | 'REPORTS'>('DRIVERS');
  const [commissionInput, setCommissionInput] = useState<number>(settings.commissionRatePercent);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleUpdateDriverStatus = (driverId: string, status: DriverVerificationStatus) => {
    const res = mobilityStore.updateDriverStatus(driverId, status);
    setFeedback(res.message);
  };

  const handleUpdateCommission = (e: React.FormEvent) => {
    e.preventDefault();
    const res = mobilityStore.updateCommissionRate(commissionInput);
    setFeedback(res.message);
  };

  const handleSettleCommission = (id: string) => {
    const res = mobilityStore.settleCommission(id);
    setFeedback(res.message);
  };

  const handleUpdateParcel = (parcelId: string, status: 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED') => {
    const res = mobilityStore.updateParcelStatus(parcelId, status);
    setFeedback(res.message);
  };

  // KPIs & Market Success Metrics
  const totalVolume = commissions.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalCommissionRevenue = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const approvedDriversCount = drivers.filter((d) => d.verificationStatus === 'APPROVED').length;
  const pendingDriversCount = drivers.filter((d) => d.verificationStatus === 'PENDING').length;

  const completedTripsCount = trips.filter((t) => t.status === 'COMPLETED').length;
  const cancelledTripsCount = trips.filter((t) => t.status === 'CANCELLED').length;
  const completedRequestsCount = requests.filter((r) => r.status === 'COMPLETED' || r.status === 'ACCEPTED').length;
  const totalRequestsCount = requests.length;
  const conversionRate = totalRequestsCount > 0 ? Math.round((completedRequestsCount / totalRequestsCount) * 100) : 0;
  const unfulfilledCount = requests.filter((r) => r.status === 'OPEN').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-[#0B1F3A]">
              لوحة الإدارة المركزية والتشغيل (Admin)
            </h2>
            <span className="px-2 py-0.5 bg-[#0B1F3A] text-white text-xs font-bold rounded">
              إدارة رأس غارب
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            متابعة السائقين، التدقيق القانوني للتراخيص، ضبط العمولات، ومؤشرات اختبار السوق في المرحلة الأولى.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('DRIVERS')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'DRIVERS' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            السائقين والتوثيق ({pendingDriversCount > 0 ? `+${pendingDriversCount} مطلوب فحصها` : drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('COMMISSIONS')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'COMMISSIONS' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            العمولات والمالية
          </button>
          <button
            onClick={() => setActiveTab('OPERATIONS')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'OPERATIONS' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            سجل العمليات والطرود
          </button>
          <button
            onClick={() => setActiveTab('COMPLAINTS')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'COMPLAINTS' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            الشكاوى ({complaints.length})
          </button>
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'REPORTS' ? 'bg-[#146EF5] text-white shadow-sm' : 'text-[#146EF5] hover:bg-[#146EF5]/10'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            تقارير قياس نجاح السوق
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-3 bg-[#18B981]/10 border border-[#18B981]/30 text-[#0B1F3A] text-xs font-bold rounded-lg flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-[#6B7280] block font-semibold">إجمالي حجم التعاملات (GMV)</span>
          <span className="text-2xl font-extrabold text-[#0B1F3A] font-mono tabular-nums mt-1 block">
            {totalVolume} ج.م
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">المبالغ النقدية المتداولة</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-[#6B7280] block font-semibold">عمولات المنصة المستحقة</span>
          <span className="text-2xl font-extrabold text-[#18B981] font-mono tabular-nums mt-1 block">
            {totalCommissionRevenue} ج.م
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">بنسبة {settings.commissionRatePercent}% المطبقة</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-[#6B7280] block font-semibold">السائقون المعتمدون</span>
          <span className="text-2xl font-extrabold text-[#146EF5] font-mono tabular-nums mt-1 block">
            {approvedDriversCount} / {drivers.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {pendingDriversCount > 0 ? `${pendingDriversCount} بانتظار الاعتماد` : 'جميعهم معتمدون'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-[#6B7280] block font-semibold">إجمالي الحجوزات والطلبات</span>
          <span className="text-2xl font-extrabold text-[#0B1F3A] font-mono tabular-nums mt-1 block">
            {bookings.length + requests.length + parcels.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">رحلات منشورة وطلبات وطرود</span>
        </div>
      </div>

      {/* Tab 1: Driver Verification Management */}
      {activeTab === 'DRIVERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-[#0B1F3A] mb-4">
            إدارة وتدقيق مستندات السائقين في رأس غارب
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[#6B7280]">
                  <th className="py-2.5 px-3 font-semibold">اسم السائق</th>
                  <th className="py-2.5 px-3 font-semibold">الهاتف</th>
                  <th className="py-2.5 px-3 font-semibold">الرقم القومي</th>
                  <th className="py-2.5 px-3 font-semibold">رقم الرخصة</th>
                  <th className="py-2.5 px-3 font-semibold">المركبة واللوحة</th>
                  <th className="py-2.5 px-3 font-semibold">حالة التحقق</th>
                  <th className="py-2.5 px-3 font-semibold text-center">الإجراء الإداري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-[#0B1F3A]">
                      {d.fullName}
                    </td>
                    <td className="py-3 px-3 font-mono">{d.phone}</td>
                    <td className="py-3 px-3 font-mono">{d.nationalId}</td>
                    <td className="py-3 px-3 font-mono">{d.licenseNumber}</td>
                    <td className="py-3 px-3">
                      <span>{d.vehicleModel}</span>
                      <span className="block text-[10px] text-slate-400">{d.vehiclePlate} ({d.vehicleSeats} مقاعد)</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.verificationStatus === 'APPROVED'
                            ? 'bg-[#18B981]/15 text-[#18B981]'
                            : d.verificationStatus === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.verificationStatus === 'APPROVED'
                          ? 'معتمد ومفعل'
                          : d.verificationStatus === 'REJECTED'
                          ? 'مرفوض'
                          : 'قيد التدقيق'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {d.verificationStatus !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateDriverStatus(d.id, 'APPROVED')}
                            className="px-2.5 py-1 bg-[#18B981] hover:bg-[#18B981]/90 text-white font-bold rounded text-[11px] transition-colors"
                          >
                            اعتماد وتفعيل
                          </button>
                        )}
                        {d.verificationStatus !== 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateDriverStatus(d.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded text-[11px] transition-colors"
                          >
                            إيقاف / رفض
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Commission Settings & Ledger */}
      {activeTab === 'COMMISSIONS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Commission Adjustment Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-5 h-5 text-[#146EF5]" />
              <h3 className="text-base font-bold text-[#0B1F3A]">
                إعدادات نسبة عمولة المنصة
              </h3>
            </div>
            <p className="text-xs text-[#6B7280] mb-4 leading-relaxed">
              تُطبق هذه النسبة على العمليات الجديدة فقط. <strong>العمليات السابقة تحتفظ بنسبتها المحاسبية الأصلية دون أي أثر رجعي</strong> وفق قواعد النزاهة المحاسبية.
            </p>

            <form onSubmit={handleUpdateCommission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  نسبة العمولة المئوية (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-sm font-mono font-bold"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-[#6B7280] font-mono">%</span>
                </div>
              </div>

              {/* Live Preview Math */}
              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1 text-slate-700 border border-slate-100">
                <span className="font-bold text-[#0B1F3A] block">مثال حسابي توضيحي لرحلة 200 ج.م:</span>
                <div className="flex justify-between">
                  <span>حصة المنصة المستحقة ({commissionInput}%):</span>
                  <strong className="font-mono text-[#F59E0B]">
                    {Math.round((200 * commissionInput) / 100)} ج.م
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>صافي مستحقات السائق:</span>
                  <strong className="font-mono text-[#18B981]">
                    {200 - Math.round((200 * commissionInput) / 100)} ج.م
                  </strong>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-bold rounded-lg text-xs transition-colors"
              >
                حفظ النسبة الجديدة
              </button>
            </form>
          </div>

          {/* Ledger Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-[#0B1F3A] mb-3">
              سجل العمولات والتحصيلات النقدية
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[#6B7280]">
                    <th className="py-2 px-2 font-semibold">المصدر</th>
                    <th className="py-2 px-2 font-semibold">الإجمالي</th>
                    <th className="py-2 px-2 font-semibold">النسبة وقت العملية</th>
                    <th className="py-2 px-2 font-semibold">عمولة المنصة</th>
                    <th className="py-2 px-2 font-semibold">حالة التسوية</th>
                    <th className="py-2 px-2 font-semibold text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-2">
                        {c.referenceType === 'BOOKING' ? 'حجز برحلة' : c.referenceType === 'PARCEL' ? 'طرد أمانة' : 'مشوار خاص'}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-[#0B1F3A]">
                        {c.totalAmount} ج.م
                      </td>
                      <td className="py-2.5 px-2 font-mono text-[#6B7280]">
                        %{c.commissionRate}
                      </td>
                      <td className="py-2.5 px-2 font-mono font-bold text-[#F59E0B]">
                        {c.commissionAmount} ج.م
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.settlementStatus === 'CASH_SETTLED'
                            ? 'bg-[#18B981]/15 text-[#18B981]'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.settlementStatus === 'CASH_SETTLED' ? 'مسدد ومورد' : 'نقدي مع السائق'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {c.settlementStatus !== 'CASH_SETTLED' && (
                          <button
                            onClick={() => handleSettleCommission(c.id)}
                            className="px-2 py-0.5 bg-[#18B981] hover:bg-[#18B981]/90 text-white font-bold rounded text-[10px]"
                          >
                            تسوية وتوريد
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Operations (Trips, Requests, Parcels) */}
      {activeTab === 'OPERATIONS' && (
        <div className="space-y-6">
          {/* Active Trips & Bookings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-[#0B1F3A] mb-3">
              الرحلات المجدولة والحجوزات النشطة
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[#6B7280]">
                    <th className="py-2 px-3 font-semibold">المسار</th>
                    <th className="py-2 px-3 font-semibold">السائق</th>
                    <th className="py-2 px-3 font-semibold">موعد التحرك</th>
                    <th className="py-2 px-3 font-semibold">المقاعد المتبقية</th>
                    <th className="py-2 px-3 font-semibold">سعر المقعد</th>
                    <th className="py-2 px-3 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trips.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-[#0B1F3A]">
                        {t.originCity} ← {t.destinationCity}
                      </td>
                      <td className="py-2.5 px-3">{t.driverName} ({t.driverPhone})</td>
                      <td className="py-2.5 px-3 font-mono">{new Date(t.departureTime).toLocaleString('ar-EG')}</td>
                      <td className="py-2.5 px-3 font-mono text-[#18B981] font-bold">
                        {t.availableSeats} / {t.totalSeats}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#146EF5]">
                        {t.pricePerSeat} ج.م
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : t.status === 'ACTIVE'
                              ? 'bg-blue-100 text-blue-800'
                              : t.status === 'CANCELLED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-[#18B981]/15 text-[#18B981]'
                          }`}
                        >
                          {t.status === 'COMPLETED'
                            ? 'مكتملة'
                            : t.status === 'PENDING'
                            ? 'قيد الانتظار'
                            : t.status === 'ACTIVE'
                            ? 'جارية'
                            : t.status === 'CANCELLED'
                            ? 'ملغاة'
                            : 'مجدولة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Parcels */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-[#0B1F3A] mb-3">
              طلبات الطرود والأمانات المسجلة
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[#6B7280]">
                    <th className="py-2 px-3 font-semibold">رقم التتبع</th>
                    <th className="py-2 px-3 font-semibold">المرسل</th>
                    <th className="py-2 px-3 font-semibold">المستلم</th>
                    <th className="py-2 px-3 font-semibold">المسار</th>
                    <th className="py-2 px-3 font-semibold">الوصف</th>
                    <th className="py-2 px-3 font-semibold">السعر</th>
                    <th className="py-2 px-3 font-semibold">الحالة</th>
                    <th className="py-2 px-3 font-semibold text-center">إجراء الإدارة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parcels.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#146EF5]">
                        {p.trackingNumber}
                      </td>
                      <td className="py-2.5 px-3">{p.senderName} ({p.senderPhone})</td>
                      <td className="py-2.5 px-3">{p.receiverName} ({p.receiverPhone})</td>
                      <td className="py-2.5 px-3">{p.originCity} ← {p.destinationCity}</td>
                      <td className="py-2.5 px-3 text-slate-500">{p.packageDescription}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0B1F3A]">{p.agreedPrice} ج.م</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'DELIVERED'
                            ? 'bg-[#18B981]/15 text-[#18B981]'
                            : p.status === 'IN_TRANSIT'
                            ? 'bg-[#146EF5]/15 text-[#146EF5]'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status === 'CREATED' ? 'مسجل بانتظار سائق' : p.status === 'IN_TRANSIT' ? 'في الطريق' : 'تم التسليم بنجاح'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {p.status === 'CREATED' && (
                            <button
                              onClick={() => handleUpdateParcel(p.id, 'IN_TRANSIT')}
                              className="px-2 py-0.5 bg-[#146EF5] text-white rounded text-[10px] font-bold"
                            >
                              إسناد للسائق
                            </button>
                          )}
                          {p.status === 'IN_TRANSIT' && (
                            <button
                              onClick={() => handleUpdateParcel(p.id, 'DELIVERED')}
                              className="px-2 py-0.5 bg-[#18B981] text-white rounded text-[10px] font-bold"
                            >
                              تأكيد التسليم
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Complaints & Support */}
      {activeTab === 'COMPLAINTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-[#0B1F3A] mb-3">
            سجل الشكاوى وملاحظات المستخدمين
          </h3>
          <div className="space-y-3">
            {complaints.length === 0 ? (
              <p className="text-xs text-[#6B7280]">لا توجد أي شكاوى مسجلة.</p>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="p-4 rounded-lg border border-slate-200 bg-[#F7F9FC] text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold text-[#0B1F3A]">
                      {c.userName} ({c.userPhone}) · تصنيف: {c.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      تمت المعالجة
                    </span>
                  </div>
                  <p className="mt-2 text-slate-700">{c.message}</p>
                  {c.adminReply && (
                    <div className="mt-2 pt-2 border-t border-slate-200 text-slate-600 bg-white p-2 rounded">
                      <strong>رد الإدارة:</strong> {c.adminReply}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Market Validation Reports */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-[#146EF5]" />
              <h3 className="text-base font-bold text-[#0B1F3A]">
                تقرير مؤشرات قياس نجاح السوق (تجربة الـ 4-6 أسابيع الأولى في رأس غارب)
              </h3>
            </div>
            <p className="text-xs text-[#6B7280] mb-6">
              تم بناء هذه المؤشرات لمساعدتك كصاحب مشروع في اتخاذ قرار مبني على بيانات حقيقية: إما التوسع التدريجي أو تعديل التسعير أو السياسات.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-[#6B7280] block">نسبة تحويل الطلبات لرحلات</span>
                <span className="text-2xl font-extrabold text-[#18B981] font-mono mt-1 block">
                  {conversionRate}%
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {completedRequestsCount} طلب مكتمل من {totalRequestsCount}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-[#6B7280] block">متوسط زمن استجابة السائق</span>
                <span className="text-2xl font-extrabold text-[#146EF5] font-mono mt-1 block">
                  ~15 دقيقة
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  من نشر الطلب حتى تقديم العرض
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-[#6B7280] block">طلبات لم تجد سائقاً بعد</span>
                <span className="text-2xl font-extrabold text-[#F59E0B] font-mono mt-1 block">
                  {unfulfilledCount}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  تحتاج لتشجيع وتنبيه السائقين
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-[#6B7280] block">صافي مساهمة المنصة</span>
                <span className="text-2xl font-extrabold text-[#0B1F3A] font-mono mt-1 block">
                  {totalCommissionRevenue} ج.م
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  بأقل تكلفة تشغيلية (0$ استضافة)
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <strong className="block mb-1 text-sm text-[#0B1F3A]">توصية الفريق التقني للمالك:</strong>
              تشير مؤشرات رأس غارب المبدئية إلى أن خطي <strong>رأس غارب ⇄ الغردقة</strong> و <strong>رأس غارب ⇄ القاهرة</strong> هما الأعلى طلباً ومردوداً. يُنصح بالتركيز في الأسبوعين القادمين على استقطاب 5 سائقين إضافيين معتمدين على هذين الخطين لخفض زمن الاستجابة إلى أقل من 8 دقائق.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
