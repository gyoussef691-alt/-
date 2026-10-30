import React, { useState } from 'react';
import { Parcel, User } from '../types';
import { mobilityStore } from '../store/mobilityStore';
import { Package, Search, Send, CheckCircle, Clock, Truck, ShieldCheck } from 'lucide-react';

interface ParcelAreaProps {
  currentUser: User;
  parcels: Parcel[];
}

export const ParcelArea: React.FC<ParcelAreaProps> = ({ currentUser, parcels }) => {
  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [originCity, setOriginCity] = useState('رأس غارب');
  const [destinationCity, setDestinationCity] = useState('الغردقة');
  const [pickupAddress, setPickupAddress] = useState('شارع الميناء - رأس غارب');
  const [deliveryAddress, setDeliveryAddress] = useState('شارع النصر - الغردقة');
  const [packageDescription, setPackageDescription] = useState('');
  const [weightKg, setWeightKg] = useState<number | ''>(2);
  const [agreedPrice, setAgreedPrice] = useState<number | ''>(80);

  const [searchTracking, setSearchTracking] = useState('');
  const [trackedParcel, setTrackedParcel] = useState<Parcel | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateParcel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedPrice || Number(agreedPrice) <= 0) {
      setAlert({ type: 'error', text: 'يرجى إدخال سعر مناسب لتوصيل الطرد.' });
      return;
    }

    const res = mobilityStore.createParcel({
      receiverName,
      receiverPhone,
      originCity,
      destinationCity,
      pickupAddress,
      deliveryAddress,
      packageDescription,
      weightKg: weightKg ? Number(weightKg) : undefined,
      agreedPrice: Number(agreedPrice),
    });

    if (res.success && res.parcel) {
      setAlert({ type: 'success', text: res.message });
      setTrackedParcel(res.parcel);
      setPackageDescription('');
      setReceiverName('');
      setReceiverPhone('');
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const found = parcels.find(
      (p) => p.trackingNumber.trim().toUpperCase() === searchTracking.trim().toUpperCase()
    );
    if (found) {
      setTrackedParcel(found);
      setAlert(null);
    } else {
      setTrackedParcel(null);
      setAlert({ type: 'error', text: 'لم يتم العثور على طرد بهذا الرقم. تأكد من إدخال الرمز بصيغة RGB-XXXX-XXXX.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-[#0B1F3A]">
          خدمة شحن الطرود والأمانات بين المدن
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          إرسال سريع وموثوق للأمانات والمستندات والبضائع مع سائقي خطوط السفر المنتظمة برأس غارب في نفس اليوم.
        </p>
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
            <Package className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs leading-relaxed font-semibold">
            {alert.text}
          </div>
        </div>
      )}

      {/* Tracking Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-8">
        <h3 className="text-sm font-bold text-[#0B1F3A] mb-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-[#146EF5]" />
          تتبع حالة طرد أو أمانة بالرقم
        </h3>
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={searchTracking}
            onChange={(e) => setSearchTracking(e.target.value)}
            placeholder="أدخل رقم التتبع (مثال: RGB-2026-0081)"
            className="flex-1 px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs font-mono"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-bold rounded-lg text-xs transition-colors"
          >
            استعلام عن الطرد
          </button>
        </form>

        {trackedParcel && (
          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-[#0B1F3A]">
                رقم التتبع: <span className="font-mono text-[#146EF5]">{trackedParcel.trackingNumber}</span>
              </span>
              <span className="px-2 py-0.5 bg-[#146EF5]/15 text-[#146EF5] font-bold rounded text-[11px]">
                {trackedParcel.status === 'CREATED' ? 'مسجل بانتظار سائق' : 'في الطريق للتسليم'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-[#6B7280]">
              <div><strong>المسار:</strong> {trackedParcel.originCity} ← {trackedParcel.destinationCity}</div>
              <div><strong>المرسل:</strong> {trackedParcel.senderName} ({trackedParcel.senderPhone})</div>
              <div><strong>المستلم:</strong> {trackedParcel.receiverName} ({trackedParcel.receiverPhone})</div>
            </div>
            <p className="mt-2 text-slate-700">
              <strong>وصف المحتوى:</strong> {trackedParcel.packageDescription}
            </p>
          </div>
        )}
      </div>

      {/* 2-Column Split: Create Parcel Form + Registered Parcels List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-[#0B1F3A] mb-1">
            تسجيل طرد أو أمانة للشحن
          </h3>
          <p className="text-xs text-[#6B7280] mb-4">
            يتم تسليم الطرد لسائق متوجه إلى نفس المدينة مباشرة مع استلام إيصال تتبع.
          </p>

          <form onSubmit={handleCreateParcel} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">مدينة الاستلام (من)</label>
                <select
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#F7F9FC] border border-slate-300 rounded"
                >
                  <option value="رأس غارب">رأس غارب</option>
                  <option value="الغردقة">الغردقة</option>
                  <option value="قنا">قنا</option>
                  <option value="القاهرة">القاهرة</option>
                  <option value="السويس">السويس</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">مدينة التسليم (إلى)</label>
                <select
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#F7F9FC] border border-slate-300 rounded"
                >
                  <option value="الغردقة">الغردقة</option>
                  <option value="قنا">قنا</option>
                  <option value="القاهرة">القاهرة</option>
                  <option value="السويس">السويس</option>
                  <option value="رأس غارب">رأس غارب</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">عنوان استلام الطرد بالتفصيل</label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-[#F7F9FC] border border-slate-300 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">عنوان تسليم المستلم بالتفصيل</label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
                className="w-full px-2.5 py-1.5 bg-[#F7F9FC] border border-slate-300 rounded"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">اسم المستلم</label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="الاسم ثلاثي"
                  required
                  className="w-full px-2.5 py-1.5 bg-[#F7F9FC] border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">هاتف المستلم</label>
                <input
                  type="tel"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="010xxxxxxxx"
                  required
                  className="w-full px-2.5 py-1.5 bg-[#F7F9FC] border border-slate-300 rounded font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">الوزن التقديري (كجم)</label>
                <input
                  type="number"
                  step={0.5}
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-2.5 py-1.5 bg-[#F7F9FC] border border-slate-300 rounded font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">تكلفة الشحن المتفق عليها (ج.م)</label>
                <input
                  type="number"
                  value={agreedPrice}
                  onChange={(e) => setAgreedPrice(e.target.value ? Number(e.target.value) : '')}
                  required
                  className="w-full px-2.5 py-1.5 bg-[#F7F9FC] border border-slate-300 rounded font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">وصف محتوى الطرد</label>
              <textarea
                rows={2}
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                placeholder="أوراق رسمية، كرتونة قطع غيار، ملابس، إلخ"
                required
                className="w-full px-2.5 py-1.5 bg-[#F7F9FC] border border-slate-300 rounded"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
            >
              تسجيل الطرد واستخراج رقم التتبع
            </button>
          </form>
        </div>

        {/* Existing Parcels List */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-[#0B1F3A] mb-3">
            سجل طرودك المسجلة
          </h3>

          <div className="space-y-3">
            {parcels.length === 0 ? (
              <p className="text-xs text-[#6B7280]">لا توجد أي طرود مسجلة حالياً.</p>
            ) : (
              parcels.map((p) => (
                <div key={p.id} className="p-4 rounded-lg border border-slate-200 bg-[#F7F9FC] text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-bold font-mono text-[#146EF5]">
                      {p.trackingNumber}
                    </span>
                    <span className="font-mono font-bold text-[#0B1F3A]">
                      {p.agreedPrice} ج.م
                    </span>
                  </div>
                  <div className="mt-2 text-[#6B7280] space-y-1">
                    <div>المسار: <strong className="text-[#111827]">{p.originCity} ← {p.destinationCity}</strong></div>
                    <div>المستلم: {p.receiverName} ({p.receiverPhone})</div>
                    <div>المحتوى: {p.packageDescription}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
