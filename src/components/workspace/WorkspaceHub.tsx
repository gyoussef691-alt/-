import React, { useState, useEffect } from 'react';
import {
  signInWithGoogleWorkspace,
  logoutGoogle,
  initAuth,
  getAccessToken,
} from '../../lib/firebase';
import {
  GoogleDriveService,
  GoogleCalendarService,
  GoogleSheetsService,
  GoogleFormsService,
} from '../../services/workspace/workspaceServices';
import { mobilityStore } from '../../store/mobilityStore';
import {
  HardDrive,
  Calendar as CalendarIcon,
  FileSpreadsheet,
  FileText,
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  DownloadCloud,
  FileUp,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

export const WorkspaceHub: React.FC = () => {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'DRIVE' | 'CALENDAR' | 'SHEETS' | 'FORMS'>('DRIVE');

  // Async States
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data states
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(null);
  const [createdFormUrl, setCreatedFormUrl] = useState<string | null>(null);

  const trips = mobilityStore.getState().trips;
  const bookings = mobilityStore.getState().bookings;
  const commissions = mobilityStore.getState().commissions;

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasToken(!!token);
      },
      () => {
        setGoogleUser(null);
        setHasToken(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setStatusMessage(null);
    try {
      const res = await signInWithGoogleWorkspace();
      if (res) {
        setGoogleUser(res.user);
        setHasToken(true);
        setStatusMessage({
          type: 'success',
          text: `تم تسجيل الدخول بنجاح بحساب: ${res.user.email} وتفعيل صلاحيات Google Workspace.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'فشل تسجيل الدخول بحساب Google Workspace.',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setHasToken(false);
    setDriveFiles([]);
    setCalendarEvents([]);
    setStatusMessage({ type: 'success', text: 'تم تسجيل الخروج من حساب Google بنجاح.' });
  };

  // 1. Drive Handlers
  const fetchDriveFiles = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const files = await GoogleDriveService.listFiles(10);
      setDriveFiles(files);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupToDrive = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        platform: 'رأس غارب موبيليتي — Ras Gharib Mobility',
        trips,
        bookings,
        commissions,
      };
      const fileName = `نسخة_احتياطية_رأس_غارب_${new Date().toISOString().slice(0, 10)}.json`;
      const res = await GoogleDriveService.saveBackupFile(fileName, backupData);
      setStatusMessage({
        type: 'success',
        text: `تم حفظ النسخة الاحتياطية بنجاح في Google Drive باسم "${fileName}".`,
      });
      fetchDriveFiles();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDriveFile = async (fileId: string, fileName: string) => {
    try {
      const deleted = await GoogleDriveService.deleteFileWithConfirmation(fileId, fileName);
      if (deleted) {
        setStatusMessage({ type: 'success', text: `تم حذف الملف "${fileName}" من Google Drive بنجاح.` });
        fetchDriveFiles();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  // 2. Calendar Handlers
  const fetchCalendarEvents = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const events = await GoogleCalendarService.listUpcomingEvents();
      setCalendarEvents(events);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncTripToCalendar = async (trip: any) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await GoogleCalendarService.addTripEvent({
        title: `رحلة رأس غارب موبيليتي: ${trip.originCity} ← ${trip.destinationCity}`,
        description: `السائق: ${trip.driverName} (${trip.driverPhone})\nالمركبة: ${trip.vehicleModel} (${trip.vehiclePlate})\nسعر المقعد: ${trip.pricePerSeat} ج.م\nملاحظات: ${trip.notes || 'لا يوجد'}`,
        location: `${trip.originCity} - ${trip.originDetails}`,
        startTime: trip.departureTime,
        durationHours: 3,
      });
      setStatusMessage({
        type: 'success',
        text: `تمت جدولة الرحلة (${trip.originCity} ← ${trip.destinationCity}) بنجاح إلى تقويم Google مع التذكيرات!`,
      });
      fetchCalendarEvents();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Sheets Handlers
  const handleExportToSheets = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const rows = [
        ['كود الرحلة', 'السائق', 'الهاتف', 'خط السير', 'موعد المغادرة', 'المقاعد الإجمالية', 'المقاعد المحجوزة', 'سعر المقعد', 'الحالة'],
        ...trips.map((t) => [
          t.id,
          t.driverName,
          t.driverPhone,
          `${t.originCity} إلى ${t.destinationCity}`,
          t.departureTime,
          String(t.totalSeats),
          String(t.bookedSeats),
          `${t.pricePerSeat} ج.م`,
          t.status,
        ]),
      ];

      const res = await GoogleSheetsService.createMobilitySpreadsheet(
        `رأس غارب موبيليتي — تقرير الرحلات (${new Date().toLocaleDateString('ar-EG')})`,
        rows
      );

      if (res?.spreadsheetUrl) {
        setCreatedSheetUrl(res.spreadsheetUrl);
        setStatusMessage({
          type: 'success',
          text: 'تم إنشاء جدول بيانات Google Sheets وتصدير كافة سجلات الرحلات بنجاح!',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Forms Handlers
  const handleCreateFeedbackForm = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await GoogleFormsService.createFeedbackForm(
        'استبيان جودة الرحلات وخدمات النقل — رأس غارب موبيليتي'
      );
      if (res?.formId) {
        const formUrl = `https://docs.google.com/forms/d/${res.formId}/edit`;
        setCreatedFormUrl(formUrl);
        setStatusMessage({
          type: 'success',
          text: 'تم إنشاء نموذج استبيان الركاب في Google Forms بنجاح!',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-[#146EF5]/10 text-[#146EF5] font-bold text-xs">
              تكامل سحابي رسمي
            </span>
            <h2 className="text-2xl font-extrabold text-[#0B1F3A]">
              Google Workspace — الربط مع خدمات جوجل
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            ربط منصة رأس غارب موبيليتي بـ Google Drive لحفظ النسخ الاحتياطية، و Google Calendar لجدولة الرحلات، و Google Sheets للتقارير، و Google Forms لاستبيانات الركاب.
          </p>
        </div>

        {/* Official Google Sign-in / Profile Control */}
        <div>
          {googleUser ? (
            <div className="flex items-center gap-3 bg-[#F7F9FC] p-3 rounded-xl border border-slate-200">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google User'}
                  className="w-10 h-10 rounded-full border border-slate-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#146EF5] text-white flex items-center justify-center font-bold">
                  {googleUser.displayName?.[0] || 'G'}
                </div>
              )}
              <div className="text-right">
                <span className="block text-xs font-bold text-[#0B1F3A]">
                  {googleUser.displayName || 'مستخدم Google'}
                </span>
                <span className="block text-[11px] text-slate-500 font-mono">
                  {googleUser.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors"
              >
                تسجيل الخروج
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoggingIn}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#111827] font-bold text-xs border border-slate-300 shadow-xs flex items-center gap-3 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'جاري الاتصال بجوجل...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed ${
            statusMessage.type === 'success'
              ? 'bg-[#18B981]/10 text-[#0B1F3A] border border-[#18B981]/30 font-semibold'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#18B981] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('DRIVE')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DRIVE'
              ? 'bg-white border-t-2 border-t-[#146EF5] border-x border-slate-200 text-[#0B1F3A]'
              : 'text-slate-600 hover:text-[#0B1F3A]'
          }`}
        >
          <HardDrive className="w-4 h-4 text-[#146EF5]" />
          <span>Google Drive (النسخ الاحتياطي)</span>
        </button>

        <button
          onClick={() => setActiveTab('CALENDAR')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'CALENDAR'
              ? 'bg-white border-t-2 border-t-[#146EF5] border-x border-slate-200 text-[#0B1F3A]'
              : 'text-slate-600 hover:text-[#0B1F3A]'
          }`}
        >
          <CalendarIcon className="w-4 h-4 text-[#18B981]" />
          <span>Google Calendar (جدولة الرحلات)</span>
        </button>

        <button
          onClick={() => setActiveTab('SHEETS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'SHEETS'
              ? 'bg-white border-t-2 border-t-[#146EF5] border-x border-slate-200 text-[#0B1F3A]'
              : 'text-slate-600 hover:text-[#0B1F3A]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-[#107C41]" />
          <span>Google Sheets (تصدير التقارير)</span>
        </button>

        <button
          onClick={() => setActiveTab('FORMS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'FORMS'
              ? 'bg-white border-t-2 border-t-[#146EF5] border-x border-slate-200 text-[#0B1F3A]'
              : 'text-slate-600 hover:text-[#0B1F3A]'
          }`}
        >
          <FileText className="w-4 h-4 text-[#7248B9]" />
          <span>Google Forms (استبيانات الركاب)</span>
        </button>
      </div>

      {/* Tab 1: Google Drive */}
      {activeTab === 'DRIVE' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#146EF5]" />
                <span>إدارة النسخ الاحتياطية والملفات في Google Drive</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تصدير بيانات الرحلات وسجلات الحجوزات كملف JSON مشفر في درايف المستخدم مع طلب تأكيد مسبق قبل أي حذف.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBackupToDrive}
                disabled={!googleUser || isLoading}
                className="px-4 py-2 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>تصدير نسخة احتياطية لدرايف</span>
              </button>

              <button
                onClick={fetchDriveFiles}
                disabled={!googleUser || isLoading}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
            </div>
          </div>

          {!googleUser ? (
            <div className="p-8 text-center bg-[#F7F9FC] rounded-xl border border-dashed border-slate-300">
              <p className="text-xs text-slate-600">
                يرجى تسجيل الدخول بحساب Google أولاً لتفعيل التخزين السحابي في Google Drive.
              </p>
            </div>
          ) : driveFiles.length === 0 ? (
            <div className="p-8 text-center bg-[#F7F9FC] rounded-xl border border-dashed border-slate-300">
              <p className="text-xs text-slate-600">
                اضغط على زر <strong>تحديث</strong> لعرض ملفات Google Drive أو <strong>تصدير نسخة احتياطية</strong> لإنشاء أول ملف.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {driveFiles.map((f) => (
                <div key={f.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-4 h-4 text-[#146EF5]" />
                    <div>
                      <span className="font-bold text-[#0B1F3A] block">{f.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        آخر تعديل: {new Date(f.modifiedTime).toLocaleString('ar-EG')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {f.webViewLink && (
                      <a
                        href={f.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-[11px] font-bold text-[#146EF5] hover:underline flex items-center gap-1"
                      >
                        معاينة <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteDriveFile(f.id, f.name)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف الملف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Google Calendar */}
      {activeTab === 'CALENDAR' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#18B981]" />
                <span>جدولة وتذكيرات الرحلات في Google Calendar</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                مزامنة الرحلات المؤكدة وإرسال تنبيهات تلقائية لمواعيد انطلاق السيارات من مواقف رأس غارب والغردقة.
              </p>
            </div>

            <button
              onClick={fetchCalendarEvents}
              disabled={!googleUser || isLoading}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1 disabled:opacity-50 self-start sm:self-auto cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>تحديث الأحداث</span>
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-xs text-[#0B1F3A]">رحلات المنصة المتاحة للمزامنة المباشرة:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {trips.slice(0, 4).map((t) => (
                <div key={t.id} className="p-3.5 rounded-xl bg-[#F7F9FC] border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#0B1F3A] block">
                      {t.originCity} ← {t.destinationCity}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[#146EF5]" />
                      {new Date(t.departureTime).toLocaleString('ar-EG')}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSyncTripToCalendar(t)}
                    disabled={!googleUser || isLoading}
                    className="px-3 py-1.5 bg-[#18B981] hover:bg-[#18B981]/90 text-white font-bold rounded-lg text-xs transition-all shadow-2xs disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة للتقويم</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {calendarEvents.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-200">
              <h4 className="font-bold text-xs text-[#0B1F3A]">أحداث التقويم القادمة المسجلة:</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {calendarEvents.map((ev) => (
                  <div key={ev.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-bold text-[#0B1F3A] block">{ev.summary}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString('ar-EG') : 'موعد مجدول'}
                      </span>
                    </div>
                    {ev.htmlLink && (
                      <a
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#146EF5] font-bold text-[11px] hover:underline flex items-center gap-1"
                      >
                        عرض في التقويم <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Google Sheets */}
      {activeTab === 'SHEETS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#107C41]" />
              <span>Google Sheets — تصدير التقارير المحاسبية والرحلات</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              إنشاء جدول بيانات رسمي في حسابك على Google Sheets يحتوي على جميع الرحلات وسجلات الحجز وعمولات السائقين المعتمدين.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#F7F9FC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-bold text-xs text-[#0B1F3A] block">
                تقرير رحلات رأس غارب الشامل (Excel/Sheets)
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                يحتوي على ({trips.length}) رحلة منشورة، و ({bookings.length}) حجز مقعد، مع بيان العمولات وحصص السائقين.
              </span>
            </div>

            <button
              onClick={handleExportToSheets}
              disabled={!googleUser || isLoading}
              className="px-4 py-2.5 bg-[#107C41] hover:bg-[#107C41]/90 text-white font-bold text-xs rounded-xl transition-all shadow-2xs disabled:opacity-50 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <FileUp className="w-4 h-4" />
              <span>إنشاء وتصدير إلى Google Sheets</span>
            </button>
          </div>

          {createdSheetUrl && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تم إنشاء جدول البيانات بنجاح في Google Sheets الخاص بك!</span>
              </div>
              <a
                href={createdSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white text-[#107C41] font-bold text-xs rounded-lg border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1"
              >
                فتح الجدول الآن <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Google Forms */}
      {activeTab === 'FORMS' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#0B1F3A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#7248B9]" />
              <span>Google Forms — استبيانات الركاب وتطوير الخدمة</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              إنشاء نماذج استبيان رسمية على Google Forms لقياس رضا الركاب في خطوط رأس غارب - الغردقة والقاهرة واستقبال المقترحات.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#F7F9FC] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-bold text-xs text-[#0B1F3A] block">
                استبيان جودة الرحلات وتقييم أمان السائقين
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                نموذج إلكتروني جاهز يحتوي على أسئلة تقييم الالتزام بالمواعيد وملاحظات المسافرين.
              </span>
            </div>

            <button
              onClick={handleCreateFeedbackForm}
              disabled={!googleUser || isLoading}
              className="px-4 py-2.5 bg-[#7248B9] hover:bg-[#7248B9]/90 text-white font-bold text-xs rounded-xl transition-all shadow-2xs disabled:opacity-50 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء نموذج في Google Forms</span>
            </button>
          </div>

          {createdFormUrl && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-purple-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>تم إنشاء النموذج بنجاح في Google Forms!</span>
              </div>
              <a
                href={createdFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white text-[#7248B9] font-bold text-xs rounded-lg border border-purple-300 hover:bg-purple-100 transition-colors flex items-center gap-1"
              >
                تعديل ومشاركة النموذج <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
