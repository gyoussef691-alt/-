import React, { useState } from 'react';
import { User, DriverProfile, PublishedTrip, RideRequest, DriverOffer, CommissionRecord } from '../types';
import { mobilityStore } from '../store/mobilityStore';
import { ShieldAlert, ShieldCheck, Plus, Send, Clock, DollarSign, Car, AlertCircle, CheckCircle, Navigation, MapPin, Route, ExternalLink, Phone, MessageCircle } from 'lucide-react';
import { DriverRouteViewer } from './maps/DriverRouteViewer';

interface DriverAreaProps {
  currentUser: User;
  drivers: DriverProfile[];
  trips: PublishedTrip[];
  requests: RideRequest[];
  offers: DriverOffer[];
  commissions: CommissionRecord[];
}

export const DriverArea: React.FC<DriverAreaProps> = ({
  currentUser,
  drivers,
  trips,
  requests,
  offers,
  commissions,
}) => {
  const [activeDriverTab, setActiveDriverTab] = useState<'REQUESTS' | 'PUBLISH_TRIP' | 'MY_TRIPS' | 'EARNINGS'>('REQUESTS');

  // Find profile of current user or fallback to first driver
  const myProfile = drivers.find((d) => d.userId === currentUser.id) || drivers[0];

  // Trip Publishing State
  const [originCity, setOriginCity] = useState('رأس غارب');
  const [originDetails, setOriginDetails] = useState('الموقف العام - بجوار بنك مصر');
  const [destinationCity, setDestinationCity] = useState('الغردقة');
  const [destinationDetails, setDestinationDetails] = useState('موقف الدهار');
  const [departureTime, setDepartureTime] = useState('2026-10-22T08:00');
  const [totalSeats, setTotalSeats] = useState(myProfile?.vehicleSeats || 4);
  const [pricePerSeat, setPricePerSeat] = useState(85);
  const [tripNotes, setTripNotes] = useState('');

  // Offer Submission State
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [offerFare, setOfferFare] = useState<number>(200);
  const [estimatedArrival, setEstimatedArrival] = useState<number>(15);
  const [offerNotes, setOfferNotes] = useState('');

  // Document Submission State
  const [showDocForm, setShowDocForm] = useState(false);
  const [nationalIdInput, setNationalIdInput] = useState(myProfile?.nationalId !== 'قيد التقديم' ? myProfile?.nationalId || '' : '');
  const [licenseInput, setLicenseInput] = useState(myProfile?.licenseNumber !== 'قيد التقديم' ? myProfile?.licenseNumber || '' : '');
  const [vehicleModelInput, setVehicleModelInput] = useState(myProfile?.vehicleModel !== 'غير محدد بعد' ? myProfile?.vehicleModel || '' : '');
  const [vehiclePlateInput, setVehiclePlateInput] = useState(myProfile?.vehiclePlate !== 'غير مسجل' ? myProfile?.vehiclePlate || '' : '');
  const [vehicleSeatsInput, setVehicleSeatsInput] = useState(myProfile?.vehicleSeats || 4);

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isApproved = myProfile?.verificationStatus === 'APPROVED';

  // Filter incoming requests that are open, offered, or accepted
  const incomingRequests = requests.filter(
    (r) => r.status === 'OPEN' || r.status === 'OFFERED' || r.status === 'ACCEPTED'
  );
  // Trips published by this driver
  const myTrips = trips.filter((t) => t.driverId === myProfile?.id);
  // Earnings calculations
  const myEarnings = commissions.filter((c) => c.referenceType === 'BOOKING' || c.referenceType === 'RIDE_OFFER');
  const totalGross = myEarnings.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCommission = myEarnings.reduce((acc, curr) => acc + curr.commissionAmount, 0);
  const totalNet = myEarnings.reduce((acc, curr) => acc + curr.driverAmount, 0);

  const handleSubmitDocs = (e: React.FormEvent) => {
    e.preventDefault();
    const res = mobilityStore.submitDriverDocuments({
      nationalId: nationalIdInput,
      licenseNumber: licenseInput,
      vehicleModel: vehicleModelInput,
      vehiclePlate: vehiclePlateInput,
      vehicleSeats: Number(vehicleSeatsInput),
    });
    if (res.success) {
      setAlert({ type: 'success', text: res.message });
      setShowDocForm(false);
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handleUpdateTrip = (tripId: string, status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED') => {
    const res = mobilityStore.updateTripStatus(tripId, status);
    if (res.success) {
      setAlert({ type: 'success', text: res.message });
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handlePublishTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const res = mobilityStore.publishTrip({
      originCity,
      originDetails,
      destinationCity,
      destinationDetails,
      departureTime,
      totalSeats,
      pricePerSeat,
      notes: tripNotes,
    });

    if (res.success) {
      setAlert({ type: 'success', text: res.message });
      setActiveDriverTab('MY_TRIPS');
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handleSubmitOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequestId) return;

    const res = mobilityStore.submitOffer({
      requestId: activeRequestId,
      proposedFare: offerFare,
      estimatedArrivalMins: estimatedArrival,
      notes: offerNotes,
    });

    if (res.success) {
      setAlert({ type: 'success', text: res.message });
      setActiveRequestId(null);
      setOfferNotes('');
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Driver Header & Verification Status Badge */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-[#0B1F3A]">
                بوابة السائق — {myProfile?.fullName || currentUser.fullName}
              </h2>
              {isApproved ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#18B981]/15 text-[#18B981] font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  حساب معتمد رسمياً
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F59E0B]/15 text-[#F59E0B] font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  قيد مراجعة وتدقيق المستندات
                </span>
              )}
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              المركبة: <strong className="text-[#111827]">{myProfile?.vehicleModel}</strong> (لوحة: {myProfile?.vehiclePlate}) · التقييم: <span className="text-amber-500 font-bold font-mono">★ {myProfile?.rating}</span> · إجمالي الرحلات: {myProfile?.totalTripsCount}
            </p>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowDocForm(!showDocForm)}
                className="text-xs font-bold text-[#146EF5] hover:underline"
              >
                {showDocForm ? 'إخفاء نموذج المستندات ▲' : 'تقديم أو تحديث مستندات الترخيص والمركبة ▼'}
              </button>
            </div>
          </div>

          {/* Quick Sub-Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveDriverTab('REQUESTS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeDriverTab === 'REQUESTS'
                  ? 'bg-[#0B1F3A] text-white shadow-sm'
                  : 'bg-slate-100 text-[#111827] hover:bg-slate-200'
              }`}
            >
              طلبات الركاب الواردة ({incomingRequests.length})
            </button>
            <button
              onClick={() => setActiveDriverTab('PUBLISH_TRIP')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeDriverTab === 'PUBLISH_TRIP'
                  ? 'bg-[#146EF5] text-white shadow-sm'
                  : 'bg-slate-100 text-[#146EF5] hover:bg-slate-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              نشر رحلة مجدولة
            </button>
            <button
              onClick={() => setActiveDriverTab('MY_TRIPS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeDriverTab === 'MY_TRIPS'
                  ? 'bg-[#0B1F3A] text-white shadow-sm'
                  : 'bg-slate-100 text-[#111827] hover:bg-slate-200'
              }`}
            >
              رحلاتي المنشورة ({myTrips.length})
            </button>
            <button
              onClick={() => setActiveDriverTab('EARNINGS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeDriverTab === 'EARNINGS'
                  ? 'bg-[#0B1F3A] text-white shadow-sm'
                  : 'bg-slate-100 text-[#111827] hover:bg-slate-200'
              }`}
            >
              الأرباح والعمولات
            </button>
          </div>
        </div>

        {!isApproved && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">تنبيه أمني وإجرائي:</span>
              <span>{myProfile?.verificationNote || 'حسابك ما زال بانتظار فحص رخصة القيادة والبطاقة من الإدارة. لا يمكنك تقديم عروض أو نشر رحلات حتى الاعتماد.'}</span>
              <p className="text-[11px] text-amber-800 mt-1">
                (يمكن لمدير المنصة اعتمادك فوراً من تبويب <strong>لوحة الإدارة</strong> أعلاه).
              </p>
            </div>
          </div>
        )}

        {/* Document Submission Form */}
        {showDocForm && (
          <form onSubmit={handleSubmitDocs} className="mt-4 pt-4 border-t border-slate-200 bg-[#F7F9FC] p-4 rounded-xl space-y-3 text-xs">
            <h4 className="font-bold text-sm text-[#0B1F3A]">تقديم وتدقيق بيانات الترخيص والمركبة</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">الرقم القومي (14 رقماً)</label>
                <input
                  type="text"
                  maxLength={14}
                  value={nationalIdInput}
                  onChange={(e) => setNationalIdInput(e.target.value)}
                  placeholder="29405022700139"
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">رقم رخصة القيادة</label>
                <input
                  type="text"
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                  placeholder="GH-99120"
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">موديل ونوع المركبة</label>
                <input
                  type="text"
                  value={vehicleModelInput}
                  onChange={(e) => setVehicleModelInput(e.target.value)}
                  placeholder="نيسان صني 2021 أو تويوتا هايس"
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">رقم اللوحة المعدنية</label>
                <input
                  type="text"
                  value={vehiclePlateInput}
                  onChange={(e) => setVehiclePlateInput(e.target.value)}
                  placeholder="ب ح ر ٧١٢٣"
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">سعة المقاعد للركاب</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={vehicleSeatsInput}
                  onChange={(e) => setVehicleSeatsInput(Number(e.target.value))}
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-bold rounded text-xs transition-colors"
              >
                حفظ وإرسال للمراجعة والاعتماد
              </button>
              <button
                type="button"
                onClick={() => setShowDocForm(false)}
                className="px-3 py-2 bg-slate-200 text-slate-700 font-semibold rounded text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>

      {alert && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm ${
            alert.type === 'success'
              ? 'bg-[#18B981]/10 text-[#0B1F3A] border border-[#18B981]/30'
              : 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-[#18B981] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs leading-relaxed font-semibold">
            {alert.text}
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-600 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Incoming Passenger Requests */}
      {activeDriverTab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#0B1F3A]">
              طلبات المشاوير الخاصة النشطة في رأس غارب
            </h3>
            <span className="text-xs text-[#6B7280]">
              اضغط على أي طلب لتقديم عرض سعرك فوراً
            </span>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <p className="text-[#6B7280] text-sm">
                لا توجد طلبات رحلات جديدة حالياً.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incomingRequests.map((req) => {
                const existingOffer = offers.find(
                  (o) => o.requestId === req.id && o.driverId === myProfile?.id
                );

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-[#146EF5] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <span className="text-xs text-[#146EF5] font-bold block">
                            {req.serviceType === 'CITY' ? 'مشوار داخل رأس غارب' : 'سفر بين المحافظات'}
                          </span>
                          <span className="text-base font-extrabold text-[#0B1F3A]">
                            {req.originAddress} ← {req.destinationAddress}
                          </span>
                        </div>
                        {req.suggestedFare && (
                          <div className="text-left font-mono">
                            <span className="text-xs text-[#6B7280] block">مقترح الراكب</span>
                            <span className="text-base font-bold text-[#18B981]">
                              {req.suggestedFare} ج.م
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-[#6B7280] space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#146EF5]" />
                          <span>موعد التحرك: {new Date(req.scheduledTime).toLocaleString('ar-EG')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="w-3.5 h-3.5 text-[#18B981]" />
                          <span>الراكب: {req.passengerName} ({req.passengerCount} أفراد)</span>
                        </div>
                        {req.notes && (
                          <p className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded">
                            {req.notes}
                          </p>
                        )}
                      </div>

                      {/* Real Google Maps & Route Details for Driver */}
                      <div className="mt-3">
                        <DriverRouteViewer
                          originAddress={req.originAddress}
                          destinationAddress={req.destinationAddress}
                          originLat={req.originLat}
                          originLng={req.originLng}
                          destLat={req.destLat}
                          destLng={req.destLng}
                          routeDistanceKm={req.routeDistanceKm}
                          routeDurationMins={req.routeDurationMins}
                          showMap={false}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {existingOffer ? (
                        existingOffer.status === 'ACCEPTED' || req.status === 'ACCEPTED' ? (
                          <div className="bg-[#18B981]/10 border border-[#18B981]/30 p-3 rounded-xl space-y-2.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#18B981] flex items-center gap-1.5">
                                <CheckCircle className="w-4 h-4" />
                                تم قبول عرضك وتأكيد المشوار!
                              </span>
                              <span className="font-mono font-bold text-[#0B1F3A]">
                                {existingOffer.proposedFare} ج.م
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <a
                                href={`tel:${req.passengerPhone}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-bold rounded-lg transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 text-[#18B981]" />
                                <span>اتصال بالراكب ({req.passengerPhone})</span>
                              </a>
                              <a
                                href={`https://wa.me/20${req.passengerPhone.slice(1)}?text=${encodeURIComponent(`السلام عليكم أستاذ ${req.passengerName}، معك الكابتن ${myProfile?.fullName}. تم تأكيد مشوارك من ${req.originAddress} إلى ${req.destinationAddress} وفي طريقي إليك.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18B981] hover:bg-[#18B981]/90 text-white font-bold rounded-lg transition-colors"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>واتساب الراكب</span>
                              </a>
                            </div>
                          </div>
                        ) : existingOffer.status === 'REJECTED' ? (
                          <div className="bg-slate-100 text-slate-500 p-2.5 rounded text-xs flex items-center justify-between">
                            <span>عرضك السابق: <strong className="font-mono">{existingOffer.proposedFare} ج.م</strong></span>
                            <span>تم اختيار عرض آخر</span>
                          </div>
                        ) : (
                          <div className="bg-[#18B981]/10 text-[#0B1F3A] p-2.5 rounded text-xs flex items-center justify-between">
                            <span>عرضك المقدم: <strong className="font-mono">{existingOffer.proposedFare} ج.م</strong></span>
                            <span className="font-bold text-[#18B981]">بانتظار موافقة الراكب</span>
                          </div>
                        )
                      ) : activeRequestId === req.id ? (
                        <form onSubmit={handleSubmitOffer} className="space-y-3 bg-[#F7F9FC] p-3 rounded-lg border border-slate-200">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block font-semibold mb-1">عرض السعر (ج.م)</label>
                              <input
                                type="number"
                                value={offerFare}
                                onChange={(e) => setOfferFare(Number(e.target.value))}
                                required
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1">وقت الوصول (دقيقة)</label>
                              <input
                                type="number"
                                value={estimatedArrival}
                                onChange={(e) => setEstimatedArrival(Number(e.target.value))}
                                required
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={offerNotes}
                              onChange={(e) => setOfferNotes(e.target.value)}
                              placeholder="ملاحظة للراكب (مثل: سيارة مكيفة بالكامل)"
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="submit"
                              disabled={!isApproved}
                              className={`flex-1 py-1.5 text-xs font-bold rounded text-white ${
                                isApproved ? 'bg-[#18B981] hover:bg-[#18B981]/90' : 'bg-slate-300 cursor-not-allowed'
                              }`}
                            >
                              إرسال العرض للراكب
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveRequestId(null)}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded"
                            >
                              إلغاء
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveRequestId(req.id);
                            setOfferFare(req.suggestedFare || 150);
                          }}
                          disabled={!isApproved}
                          className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                            isApproved
                              ? 'bg-[#146EF5] hover:bg-[#146EF5]/90 text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>تقديم عرض سعر</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Publish Trip Form */}
      {activeDriverTab === 'PUBLISH_TRIP' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-[#0B1F3A] mb-1">
            نشر رحلة سفر منتظمة ومجدولة
          </h3>
          <p className="text-xs text-[#6B7280] mb-5">
            أعلن عن موعد رحلتك القادمة وسعر المقعد ليتمكن الركاب من حجز مقاعدهم مباشرة وبشكل فوري.
          </p>

          <form onSubmit={handlePublishTrip} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  مدينة الانطلاق (من)
                </label>
                <input
                  type="text"
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  نقطة التجمع / تفاصيل التحرك
                </label>
                <input
                  type="text"
                  value={originDetails}
                  onChange={(e) => setOriginDetails(e.target.value)}
                  placeholder="مثال: الموقف العام - بجوار بنك مصر"
                  required
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  الوجهة المقصودة (إلى)
                </label>
                <select
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs"
                >
                  <option value="الغردقة">الغردقة</option>
                  <option value="قنا">قنا</option>
                  <option value="القاهرة">القاهرة</option>
                  <option value="السويس">السويس</option>
                  <option value="الجونة">الجونة</option>
                  <option value="الزعفرانة">الزعفرانة</option>
                  <option value="رأس شقير">رأس شقير</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  نقطة الوصول في الوجهة
                </label>
                <input
                  type="text"
                  value={destinationDetails}
                  onChange={(e) => setDestinationDetails(e.target.value)}
                  placeholder="مثال: ميدان السقالة أو موقف الدهار"
                  required
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  موعد التحرك
                </label>
                <input
                  type="datetime-local"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  عدد المقاعد المتاحة
                </label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  سعر المقعد (ج.م)
                </label>
                <input
                  type="number"
                  min={10}
                  value={pricePerSeat}
                  onChange={(e) => setPricePerSeat(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                ملاحظات الرحلة للركاب
              </label>
              <textarea
                rows={2}
                value={tripNotes}
                onChange={(e) => setTripNotes(e.target.value)}
                placeholder="مثال: سيارة مكيفة، الالتزام بالموعد، استراحة بالزعفرانة"
                className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={!isApproved}
              className={`w-full py-2.5 font-bold rounded-lg text-sm text-white transition-colors shadow-sm ${
                isApproved
                  ? 'bg-[#146EF5] hover:bg-[#146EF5]/90'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isApproved ? 'نشر الرحلة وجعلها متاحة للحجز' : 'يتطلب اعتماد الحساب من الإدارة أولاً'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: My Published Trips */}
      {activeDriverTab === 'MY_TRIPS' && (
        <div className="space-y-4">
          {myTrips.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <p className="text-[#6B7280] text-sm">
                لم تقم بنشر أي رحلات مجدولة حتى الآن.
              </p>
            </div>
          ) : (
            myTrips.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#0B1F3A] text-base">
                      {t.originCity} ← {t.destinationCity}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-bold text-[#146EF5] font-mono">
                      {t.pricePerSeat} ج.م / مقعد
                    </span>
                  </div>

                  <div className="text-xs text-[#6B7280] mt-1 space-x-2 space-x-reverse">
                    <span>موعد التحرك: {new Date(t.departureTime).toLocaleString('ar-EG')}</span>
                    <span className="text-slate-300">·</span>
                    <span>
                      المقاعد المتبقية: <strong className="text-[#18B981] font-mono">{t.availableSeats}</strong> من أصل {t.totalSeats}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>نقطة التحرك: {t.originDetails}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 font-bold rounded ${
                      t.status === 'SCHEDULED'
                        ? 'bg-[#18B981]/15 text-[#18B981]'
                        : t.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : t.status === 'ACTIVE'
                        ? 'bg-[#146EF5]/15 text-[#146EF5]'
                        : t.status === 'COMPLETED'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {t.status === 'SCHEDULED'
                      ? 'مجدولة ومتاحة للحجز'
                      : t.status === 'PENDING'
                      ? 'قيد الانتظار'
                      : t.status === 'ACTIVE'
                      ? 'الرحلة جارية الآن'
                      : t.status === 'COMPLETED'
                      ? 'مكتملة'
                      : 'ملغاة'}
                  </span>

                  {(t.status === 'SCHEDULED' || t.status === 'PENDING') && (
                    <button
                      onClick={() => handleUpdateTrip(t.id, 'ACTIVE')}
                      className="px-2.5 py-1 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-bold rounded text-xs transition-colors"
                    >
                      بدء الرحلة
                    </button>
                  )}

                  {t.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleUpdateTrip(t.id, 'COMPLETED')}
                      className="px-2.5 py-1 bg-[#18B981] hover:bg-[#18B981]/90 text-white font-bold rounded text-xs transition-colors"
                    >
                      إكمال بنجاح
                    </button>
                  )}

                  {(t.status === 'SCHEDULED' || t.status === 'ACTIVE') && (
                    <button
                      onClick={() => {
                        if (window.confirm('هل تود إلغاء هذه الرحلة؟')) {
                          handleUpdateTrip(t.id, 'CANCELLED');
                        }
                      }}
                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded text-xs transition-colors"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Earnings & Commission Breakdown */}
      {activeDriverTab === 'EARNINGS' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-right">
              <span className="text-xs text-[#6B7280] block font-semibold">إجمالي الإيرادات النقدية</span>
              <span className="text-2xl font-extrabold text-[#0B1F3A] font-mono tabular-nums mt-1 block">
                {totalGross} ج.م
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">حصلت نقداً من الركاب مباشرة</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-right">
              <span className="text-xs text-[#6B7280] block font-semibold">عمولة المنصة المسجلة (10%)</span>
              <span className="text-2xl font-extrabold text-[#F59E0B] font-mono tabular-nums mt-1 block">
                {totalCommission} ج.م
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">مستحقة التوريد لإدارة المنصة</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-right">
              <span className="text-xs text-[#6B7280] block font-semibold">صافي أرباح السائق</span>
              <span className="text-2xl font-extrabold text-[#18B981] font-mono tabular-nums mt-1 block">
                {totalNet} ج.م
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">دخلك الصافي بعد خصم النسبة</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h4 className="text-sm font-bold text-[#0B1F3A] mb-3">
              سجل العمليات والعمولات المحاسبية المجمدة
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[#6B7280]">
                    <th className="py-2 px-3 font-semibold">نوع العملية</th>
                    <th className="py-2 px-3 font-semibold">إجمالي المبلغ</th>
                    <th className="py-2 px-3 font-semibold">النسبة المطبقة</th>
                    <th className="py-2 px-3 font-semibold">عمولة المنصة</th>
                    <th className="py-2 px-3 font-semibold">صافي السائق</th>
                    <th className="py-2 px-3 font-semibold">حالة التسوية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myEarnings.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium">
                        {record.referenceType === 'BOOKING' ? 'حجز مقاعد برحلة' : 'مشوار خاص'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#0B1F3A]">
                        {record.totalAmount} ج.م
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#6B7280]">
                        %{record.commissionRate}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#F59E0B]">
                        {record.commissionAmount} ج.م
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#18B981]">
                        {record.driverAmount} ج.م
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          record.settlementStatus === 'CASH_SETTLED'
                            ? 'bg-[#18B981]/15 text-[#18B981]'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {record.settlementStatus === 'CASH_SETTLED' ? 'تمت التسوية' : 'نقدي لم يسدد'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
