import {
  User,
  DriverProfile,
  RideRequest,
  DriverOffer,
  PublishedTrip,
  Booking,
  Parcel,
  Complaint,
  CommissionRecord,
  SystemSettings,
  DriverVerificationStatus,
  InAppNotification,
  InAppNotificationType,
} from '../types';
import { firebaseMobility } from '../services/firebaseMobilityService';

const STORAGE_KEY = 'ras_gharib_mobility_db_v1';

// البذور التشغيلية الواقعية لمدينة رأس غارب ومحافظة البحر الأحمر
const INITIAL_USERS: User[] = [
  {
    id: 'user-passenger-1',
    phone: '01012345678',
    fullName: 'أحمد محمود الغريبي',
    email: 'ahmed.gharib@example.com',
    role: 'PASSENGER',
    status: 'ACTIVE',
    rating: 4.9,
    totalRatingsCount: 12,
    createdAt: '2026-10-15T09:00:00Z',
  },
  {
    id: 'user-driver-1',
    phone: '01123456789',
    fullName: 'الكابتن محمد عبد الرحيم',
    email: 'capt.mohamed@example.com',
    role: 'DRIVER',
    status: 'ACTIVE',
    createdAt: '2026-10-12T14:30:00Z',
  },
  {
    id: 'user-driver-pending',
    phone: '01234567890',
    fullName: 'محمود سيد الشاذلي (سائق قيد التدقيق)',
    email: 'mahmoud.driver@example.com',
    role: 'DRIVER',
    status: 'ACTIVE',
    createdAt: '2026-10-18T10:00:00Z',
  },
  {
    id: 'user-admin-1',
    phone: '01099998888',
    fullName: 'مدير المنصة — فرع رأس غارب',
    email: 'gyoussef691@gmail.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-10-01T08:00:00Z',
  },
];

const INITIAL_DRIVERS: DriverProfile[] = [
  {
    id: 'driver-prof-1',
    userId: 'user-driver-1',
    fullName: 'الكابتن محمد عبد الرحيم',
    phone: '01123456789',
    nationalId: '28911012700411',
    licenseNumber: 'GH-88241',
    vehicleModel: 'تويوتا هايس ميكروباص 2022',
    vehiclePlate: 'ط ر ج ٤٥٨٢',
    vehicleSeats: 14,
    verificationStatus: 'APPROVED',
    verificationNote: 'تمت مراجعة رخصة القيادة والبطاقة القومية بنجاح.',
    rating: 4.9,
    totalTripsCount: 48,
    createdAt: '2026-10-12T15:00:00Z',
  },
  {
    id: 'driver-prof-2',
    userId: 'user-driver-pending',
    fullName: 'محمود سيد الشاذلي',
    phone: '01234567890',
    nationalId: '29405022700139',
    licenseNumber: 'GH-99120',
    vehicleModel: 'نيسان صني 2021',
    vehiclePlate: 'ب ح ر ٧١٢٣',
    vehicleSeats: 4,
    verificationStatus: 'PENDING',
    verificationNote: 'بانتظار فحص صورة الرخصة وفحص المركبة.',
    rating: 5.0,
    totalTripsCount: 0,
    createdAt: '2026-10-18T10:30:00Z',
  },
];

const INITIAL_TRIPS: PublishedTrip[] = [
  {
    id: 'trip-1',
    driverId: 'driver-prof-1',
    driverName: 'الكابتن محمد عبد الرحيم',
    driverPhone: '01123456789',
    driverRating: 4.9,
    vehicleModel: 'تويوتا هايس 2022 (مكيف)',
    vehiclePlate: 'ط ر ج ٤٥٨٢',
    originCity: 'رأس غارب',
    originDetails: 'الموقف العام - بجوار بنك مصر',
    destinationCity: 'الغردقة',
    destinationDetails: 'موقف الدهار - ميدان السقالة',
    departureTime: '2026-10-22T08:00:00',
    totalSeats: 14,
    availableSeats: 6,
    bookedSeats: 8,
    pricePerSeat: 85,
    status: 'SCHEDULED',
    notes: 'تحرك منضبط في الموعد تماماً. يوجد مكان مخصص للحقائب.',
    createdAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'trip-2',
    driverId: 'driver-prof-1',
    driverName: 'الكابتن محمد عبد الرحيم',
    driverPhone: '01123456789',
    driverRating: 4.9,
    vehicleModel: 'تويوتا هايس 2022',
    vehiclePlate: 'ط ر ج ٤٥٨٢',
    originCity: 'رأس غارب',
    originDetails: 'شارع الميناء - مساكن الـ 128',
    destinationCity: 'القاهرة',
    destinationDetails: 'موقف المرج الجديدة / رمسيس',
    departureTime: '2026-10-22T14:30:00',
    totalSeats: 14,
    availableSeats: 4,
    bookedSeats: 10,
    pricePerSeat: 180,
    status: 'SCHEDULED',
    notes: 'السفر عبر طريق السخنة الجديد. استراحة واحدة بالزعفرانة.',
    createdAt: '2026-10-20T11:00:00Z',
  },
  {
    id: 'trip-3',
    driverId: 'driver-prof-1',
    driverName: 'الكابتن محمد عبد الرحيم',
    driverPhone: '01123456789',
    driverRating: 4.9,
    vehicleModel: 'تويوتا هايس 2022',
    vehiclePlate: 'ط ر ج ٤٥٨٢',
    originCity: 'رأس غارب',
    originDetails: 'منطقة الكهف - الطريق الدائري',
    destinationCity: 'قنا',
    destinationDetails: 'موقف الأقاليم - قنا',
    departureTime: '2026-10-23T07:00:00',
    totalSeats: 14,
    availableSeats: 9,
    bookedSeats: 5,
    pricePerSeat: 170,
    status: 'SCHEDULED',
    notes: 'خط سير منتظم عبر سفاجا/قنا.',
    createdAt: '2026-10-20T16:00:00Z',
  },
  {
    id: 'trip-4',
    driverId: 'driver-prof-1',
    driverName: 'الكابتن محمد عبد الرحيم',
    driverPhone: '01123456789',
    driverRating: 4.9,
    vehicleModel: 'تويوتا هايس 2022',
    vehiclePlate: 'ط ر ج ٤٥٨٢',
    originCity: 'رأس غارب',
    originDetails: 'شارع الميناء - مساكن الـ 128',
    destinationCity: 'الغردقة',
    destinationDetails: 'موقف الدهار - ميدان السقالة',
    departureTime: '2026-10-21T07:00:00',
    totalSeats: 14,
    availableSeats: 0,
    bookedSeats: 14,
    pricePerSeat: 85,
    status: 'COMPLETED',
    notes: 'تمت الرحلة بنجاح في موعدها ووصل جميع الركاب بسلام.',
    createdAt: '2026-10-19T08:00:00Z',
  },
  {
    id: 'trip-5',
    driverId: 'driver-prof-1',
    driverName: 'الكابتن محمد عبد الرحيم',
    driverPhone: '01123456789',
    driverRating: 4.9,
    vehicleModel: 'تويوتا هايس 2022',
    vehiclePlate: 'ط ر ج ٤٥٨٢',
    originCity: 'رأس غارب',
    originDetails: 'الموقف العام - بجوار بنك مصر',
    destinationCity: 'السويس',
    destinationDetails: 'موقف الأربعين',
    departureTime: '2026-10-23T11:00:00',
    totalSeats: 14,
    availableSeats: 8,
    bookedSeats: 6,
    pricePerSeat: 110,
    status: 'PENDING',
    notes: 'قيد الانتظار: سيتم تأكيد الانطلاق النهائي عند اكتمال الحد الأدنى للركاب.',
    createdAt: '2026-10-21T09:00:00Z',
  },
];

const INITIAL_REQUESTS: RideRequest[] = [
  {
    id: 'req-1',
    passengerId: 'user-passenger-1',
    passengerName: 'أحمد محمود الغريبي',
    passengerPhone: '01012345678',
    serviceType: 'INTERCITY',
    originCity: 'رأس غارب',
    originAddress: 'حي الروضة بجوار المدرسة الثانوية',
    destinationCity: 'الغردقة',
    destinationAddress: 'مستشفى الغردقة العام',
    scheduledTime: '2026-10-22T10:00:00',
    passengerCount: 2,
    suggestedFare: 220,
    notes: 'مشوار عاجل لموعد كشف طبي، يفضل سيارة ملاكي مريحة.',
    status: 'OFFERED',
    createdAt: '2026-10-21T18:00:00Z',
  },
  {
    id: 'req-2',
    passengerId: 'user-passenger-1',
    passengerName: 'أحمد محمود الغريبي',
    passengerPhone: '01012345678',
    serviceType: 'CITY',
    originCity: 'رأس غارب',
    originAddress: 'شارع الميناء',
    destinationCity: 'رأس غارب',
    destinationAddress: 'منطقة شاطئ الغريب',
    scheduledTime: '2026-10-22T16:00:00',
    passengerCount: 1,
    suggestedFare: 35,
    notes: 'توصيلة سريعة داخل المدينة.',
    status: 'OPEN',
    createdAt: '2026-10-21T19:30:00Z',
  },
  {
    id: 'req-3',
    passengerId: 'user-passenger-1',
    passengerName: 'أحمد محمود الغريبي',
    passengerPhone: '01012345678',
    serviceType: 'INTERCITY',
    originCity: 'رأس غارب',
    originAddress: 'مساكن الـ 128 - الطريق الرئيسي',
    destinationCity: 'القاهرة',
    destinationAddress: 'موقف رمسيس وأحمد حلمي - وسط القاهرة',
    scheduledTime: '2026-10-18T07:30:00',
    passengerCount: 3,
    suggestedFare: 540,
    notes: 'رحلة سفر عائلية مبكرة مع حقائب.',
    originLat: 28.3542,
    originLng: 33.0811,
    destLat: 30.0617,
    destLng: 31.2464,
    routeDistanceKm: 345,
    routeDurationMins: 240,
    status: 'COMPLETED',
    rating: {
      driverStars: 5,
      driverComment: 'الكابتن محمد قمة في الاحترام والالتزام بالموعد، قيادة هادئة وآمنة طوال طريق الزعفرانة والسيارة نظيفة جداً ومكيفة.',
      driverTags: ['التزام بالموعد', 'قيادة آمنة', 'سيارة نظيفة ومكيفة', 'أمانة واحترام'],
      driverRatedAt: '2026-10-18T12:15:00Z',
      passengerStars: 5,
      passengerComment: 'الأستاذ أحمد وعائلته من أرقى الركاب، جاهزون في الموعد المحدد تماماً وتعامل محترم جداً.',
      passengerTags: ['جاهز في الموعد', 'تعامل راقٍ ومحترم', 'التزام بالأجرة المتفق عليها'],
      passengerRatedAt: '2026-10-18T12:20:00Z',
      driverId: 'driver-prof-1',
      driverName: 'الكابتن محمد عبد الرحيم',
      passengerId: 'user-passenger-1',
      passengerName: 'أحمد محمود الغريبي',
    },
    createdAt: '2026-10-17T15:20:00Z',
  },
  {
    id: 'req-4',
    passengerId: 'user-passenger-1',
    passengerName: 'أحمد محمود الغريبي',
    passengerPhone: '01012345678',
    serviceType: 'CITY',
    originCity: 'رأس غارب',
    originAddress: 'منطقة الصحاري السكنية',
    destinationCity: 'رأس غارب',
    destinationAddress: 'مستشفى رأس غارب المركزي التخصصي',
    scheduledTime: '2026-10-19T19:00:00',
    passengerCount: 1,
    suggestedFare: 40,
    notes: 'تم تأجيل الموعد الطبي وإلغاء الطلب قبل التحرك.',
    originLat: 28.3645,
    originLng: 33.0695,
    destLat: 28.3688,
    destLng: 33.0725,
    routeDistanceKm: 3.2,
    routeDurationMins: 7,
    status: 'CANCELLED',
    createdAt: '2026-10-19T17:10:00Z',
  },
];

const INITIAL_OFFERS: DriverOffer[] = [
  {
    id: 'offer-1',
    requestId: 'req-1',
    driverId: 'driver-prof-1',
    driverName: 'الكابتن محمد عبد الرحيم',
    driverPhone: '01123456789',
    driverRating: 4.9,
    vehicleModel: 'تويوتا هايس 2022',
    vehiclePlate: 'ط ر ج ٤٥٨٢',
    proposedFare: 200,
    estimatedArrivalMins: 20,
    notes: 'جاهز بالموعد المطلوب والتوصيل أمام المستشفى مباشرة.',
    status: 'PENDING',
    createdAt: '2026-10-21T18:30:00Z',
  },
];

const INITIAL_PARCELS: Parcel[] = [
  {
    id: 'parcel-1',
    trackingNumber: 'RGB-2026-0081',
    senderId: 'user-passenger-1',
    senderName: 'أحمد محمود الغريبي',
    senderPhone: '01012345678',
    receiverName: 'طارق عبد الله',
    receiverPhone: '01098765432',
    originCity: 'رأس غارب',
    destinationCity: 'الغردقة',
    pickupAddress: 'شارع الحرية - محل الأمانة',
    deliveryAddress: 'شارع الشيراتون - الغردقة',
    packageDescription: 'أوراق ومستندات عمل داخل مظروف مغلق مختوم',
    weightKg: 1.5,
    agreedPrice: 80,
    commissionRate: 10,
    commissionAmount: 8,
    status: 'CREATED',
    createdAt: '2026-10-21T14:00:00Z',
  },
];

const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'comp-1',
    userId: 'user-passenger-1',
    userName: 'أحمد محمود الغريبي',
    userPhone: '01012345678',
    category: 'استفسار عن موعد',
    message: 'هل يمكن حجز مقاعد ثابتة أسبوعياً لرحلات رأس شقير لموظفي الشركات؟',
    status: 'RESOLVED',
    adminReply: 'أهلاً بك، نعمل حالياً على باقات الاشتراكات الأسبوعية لقطاع البترول وسيتم تفعيلها قريباً.',
    createdAt: '2026-10-19T11:00:00Z',
  },
];

const INITIAL_SETTINGS: SystemSettings = {
  commissionRatePercent: 10,
  cityRideBaseFare: 25,
  allowUnverifiedDrivers: false,
  smsGatewayConfigured: false,
};

const INITIAL_NOTIFICATIONS: InAppNotification[] = [
  {
    id: 'notif-init-1',
    userId: 'user-passenger-1',
    type: 'DRIVER_OFFER_RECEIVED',
    title: 'عرض سعر جديد وقبول من سائق لرحلتك',
    message:
      'قدم الكابتن محمد عبد الرحيم (★ 4.9) عرضاً بقيمة 200 ج.م لطلب رحلتك (رأس غارب ← مستشفى الغردقة العام) والوصول خلال 20 دقيقة.',
    relatedId: 'req-1',
    targetTab: 'passenger',
    severity: 'urgent',
    isRead: false,
    createdAt: '2026-10-21T18:31:00Z',
  },
  {
    id: 'notif-init-2',
    userId: 'user-passenger-1',
    type: 'BOOKING_CONFIRMED',
    title: 'تأكيد حجز مقاعد في رحلة مجدولة',
    message:
      'تم تأكيد حجز 2 مقعد في رحلة (رأس غارب ⇄ الغردقة - 8:00 ص) مع الكابتن محمد عبد الرحيم بنجاح.',
    relatedId: 'book-init-1',
    targetTab: 'passenger',
    severity: 'success',
    isRead: false,
    createdAt: '2026-10-21T12:01:00Z',
  },
  {
    id: 'notif-init-3',
    userId: 'user-passenger-1',
    type: 'TRIP_STATUS_UPDATED',
    title: 'تحديث حالة الطلب: رحلة مكتملة',
    message:
      'وصلت رحلتك (رأس غارب ← القاهرة - موقف رمسيس) بسلام وتم تحديث حالة الطلب إلى مكتملة وتوثيق التقييم المتبادل ★ 5/5.',
    relatedId: 'req-3',
    targetTab: 'passenger',
    severity: 'info',
    isRead: true,
    createdAt: '2026-10-18T12:20:00Z',
  },
];

export interface StateSchema {
  currentUser: User;
  users: User[];
  drivers: DriverProfile[];
  trips: PublishedTrip[];
  requests: RideRequest[];
  offers: DriverOffer[];
  bookings: Booking[];
  parcels: Parcel[];
  complaints: Complaint[];
  commissions: CommissionRecord[];
  settings: SystemSettings;
  notifications: InAppNotification[];
  activeToasts: InAppNotification[];
  isBackendConnected: boolean;
}

class MobilityStore {
  private state: StateSchema;
  private listeners: Set<() => void> = new Set();
  private isSyncing = false;

  constructor() {
    this.state = this.loadState();
    this.initFirebaseSync();
  }

  private loadState(): StateSchema {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.trips)) {
          for (const t of parsed.trips) {
            if (typeof t.bookedSeats !== 'number') {
              t.bookedSeats = Math.max(0, (t.totalSeats || 0) - (t.availableSeats || 0));
            }
          }
        }
        if (parsed && Array.isArray(parsed.requests)) {
          for (const seedReq of INITIAL_REQUESTS) {
            const existingReq = parsed.requests.find((r: RideRequest) => r.id === seedReq.id);
            if (!existingReq) {
              parsed.requests.push(seedReq);
            } else if (seedReq.rating && !existingReq.rating) {
              existingReq.rating = seedReq.rating;
            }
          }
        }
        if (parsed && parsed.currentUser && typeof parsed.currentUser.rating !== 'number') {
          parsed.currentUser.rating = 4.9;
          parsed.currentUser.totalRatingsCount = 12;
        }
        if (!Array.isArray(parsed.notifications) || parsed.notifications.length === 0) {
          parsed.notifications = INITIAL_NOTIFICATIONS;
        }
        return {
          ...parsed,
          activeToasts: [],
          isBackendConnected: false,
        };
      }
    } catch {
      // LocalStorage fallback
    }

    return {
      currentUser: INITIAL_USERS[0],
      users: INITIAL_USERS,
      drivers: INITIAL_DRIVERS,
      trips: INITIAL_TRIPS,
      requests: INITIAL_REQUESTS,
      offers: INITIAL_OFFERS,
      bookings: [
        {
          id: 'book-init-1',
          tripId: 'trip-1',
          tripSummary: 'رأس غارب ⇄ الغردقة (8:00 ص)',
          passengerId: 'user-passenger-1',
          passengerName: 'أحمد محمود الغريبي',
          passengerPhone: '01012345678',
          seatsBooked: 2,
          totalFare: 170,
          commissionRate: 10,
          commissionAmount: 17,
          netDriverAmount: 153,
          status: 'CONFIRMED',
          createdAt: '2026-10-21T12:00:00Z',
        },
        {
          id: 'book-init-2',
          tripId: 'trip-4',
          tripSummary: 'رأس غارب ⇄ الغردقة (7:00 ص)',
          passengerId: 'user-passenger-1',
          passengerName: 'أحمد محمود الغريبي',
          passengerPhone: '01012345678',
          seatsBooked: 1,
          totalFare: 85,
          commissionRate: 10,
          commissionAmount: 9,
          netDriverAmount: 76,
          status: 'COMPLETED',
          createdAt: '2026-10-19T14:00:00Z',
        },
      ],
      parcels: INITIAL_PARCELS,
      complaints: INITIAL_COMPLAINTS,
      commissions: [
        {
          id: 'comm-init-1',
          referenceType: 'BOOKING',
          referenceId: 'book-init-1',
          totalAmount: 170,
          commissionRate: 10,
          commissionAmount: 17,
          driverAmount: 153,
          settlementStatus: 'CASH_UNPAID',
          createdAt: '2026-10-21T12:00:00Z',
        },
      ],
      settings: INITIAL_SETTINGS,
      notifications: INITIAL_NOTIFICATIONS,
      activeToasts: [],
      isBackendConnected: false,
    };
  }

  // --- Push Instant In-App Notification & Toast ---
  public pushNotification(params: {
    userId?: string;
    type: InAppNotificationType;
    title: string;
    message: string;
    relatedId?: string;
    targetTab?: InAppNotification['targetTab'];
    severity?: InAppNotification['severity'];
    showToast?: boolean;
  }): InAppNotification {
    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: params.userId || this.state.currentUser.id,
      type: params.type,
      title: params.title,
      message: params.message,
      relatedId: params.relatedId,
      targetTab: params.targetTab || 'passenger',
      severity: params.severity || 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    if (!Array.isArray(this.state.notifications)) {
      this.state.notifications = [];
    }
    this.state.notifications = [newNotif, ...this.state.notifications].slice(0, 50);

    if (params.showToast !== false) {
      const currToasts = Array.isArray(this.state.activeToasts) ? this.state.activeToasts : [];
      this.state.activeToasts = [newNotif, ...currToasts].slice(0, 3);
    }

    this.persist();
    return newNotif;
  }

  public markNotificationAsRead(notificationId: string) {
    const target = this.state.notifications.find((n) => n.id === notificationId);
    if (target && !target.isRead) {
      target.isRead = true;
      this.persist();
    }
  }

  public markAllNotificationsAsRead() {
    let changed = false;
    this.state.notifications.forEach((n) => {
      if (!n.isRead) {
        n.isRead = true;
        changed = true;
      }
    });
    if (changed) {
      this.persist();
    }
  }

  public dismissToast(notificationId: string) {
    if (!Array.isArray(this.state.activeToasts)) return;
    this.state.activeToasts = this.state.activeToasts.filter((t) => t.id !== notificationId);
    this.notify();
  }

  public deleteNotification(notificationId: string) {
    this.state.notifications = this.state.notifications.filter((n) => n.id !== notificationId);
    if (Array.isArray(this.state.activeToasts)) {
      this.state.activeToasts = this.state.activeToasts.filter((t) => t.id !== notificationId);
    }
    this.persist();
  }

  public clearAllNotifications() {
    this.state.notifications = [];
    this.state.activeToasts = [];
    this.persist();
  }

  // --- Real-time synchronization with Firestore ---
  private async initFirebaseSync() {
    try {
      const connected = await firebaseMobility.testConnection();
      this.state.isBackendConnected = connected;
      this.notify();

      // Seed initial baseline records if Firestore is fresh
      await firebaseMobility.seedInitialDataIfEmpty(INITIAL_TRIPS, INITIAL_DRIVERS);

      // 1. Subscribe to Ride Requests (detect status changes from remote drivers)
      firebaseMobility.subscribeToRideRequests((requests) => {
        if (requests.length > 0) {
          for (const incoming of requests) {
            const prev = this.state.requests.find((r) => r.id === incoming.id);
            if (prev && prev.status !== incoming.status) {
              const statusAr =
                incoming.status === 'ACCEPTED'
                  ? 'تم قبول رحلتك وتأكيد السائق'
                  : incoming.status === 'OFFERED'
                  ? 'وصلك عرض سعر جديد من سائق'
                  : incoming.status === 'COMPLETED'
                  ? 'تم إتمام الرحلة بنجاح'
                  : incoming.status === 'CANCELLED'
                  ? 'تم إلغاء الطلب'
                  : incoming.status;
              this.pushNotification({
                userId: incoming.passengerId,
                type: incoming.status === 'ACCEPTED' ? 'OFFER_ACCEPTED' : 'TRIP_STATUS_UPDATED',
                title: `تحديث فوري لحالة طلبك: ${statusAr}`,
                message: `طلب الرحلة (${incoming.originCity} ← ${incoming.destinationCity}) تغيرت حالته إلى: ${statusAr}.`,
                relatedId: incoming.id,
                targetTab: 'passenger',
                severity: incoming.status === 'ACCEPTED' ? 'success' : 'info',
              });
            }
          }
          this.state.requests = requests;
          this.persist();
        }
      });

      // 2. Subscribe to Driver Offers (detect new driver offers in real time)
      firebaseMobility.subscribeToDriverOffers((offers) => {
        if (offers.length > 0) {
          for (const incomingOffer of offers) {
            const existed = this.state.offers.some((o) => o.id === incomingOffer.id);
            if (!existed) {
              const relatedReq = this.state.requests.find((r) => r.id === incomingOffer.requestId);
              this.pushNotification({
                userId: relatedReq?.passengerId || this.state.currentUser.id,
                type: 'DRIVER_OFFER_RECEIVED',
                title: `عرض سعر جديد من ${incomingOffer.driverName}`,
                message: `قدم السائق ${incomingOffer.driverName} (${incomingOffer.vehicleModel}) عرضاً بقيمة ${incomingOffer.proposedFare} ج.م والوصول خلال ${incomingOffer.estimatedArrivalMins} دقيقة.`,
                relatedId: incomingOffer.requestId,
                targetTab: 'passenger',
                severity: 'urgent',
              });
            }
          }
          this.state.offers = offers;
          this.persist();
        }
      });

      // 3. Subscribe to Published Trips
      firebaseMobility.subscribeToPublishedTrips((trips) => {
        if (trips.length > 0) {
          this.state.trips = trips;
          this.persist();
        }
      });

      // 4. Subscribe to Bookings
      firebaseMobility.subscribeToBookings((bookings) => {
        if (bookings.length > 0) {
          this.state.bookings = bookings;
          this.persist();
        }
      });

      // 5. Subscribe to Drivers
      firebaseMobility.subscribeToDrivers((drivers) => {
        if (drivers.length > 0) {
          this.state.drivers = drivers;
          this.persist();
        }
      });

      // 6. Subscribe to Parcels
      firebaseMobility.subscribeToParcels((parcels) => {
        if (parcels.length > 0) {
          this.state.parcels = parcels;
          this.persist();
        }
      });

      // 7. Subscribe to Complaints
      firebaseMobility.subscribeToComplaints((complaints) => {
        if (complaints.length > 0) {
          this.state.complaints = complaints;
          this.persist();
        }
      });
    } catch (err) {
      console.warn('Real-time sync initialized with local state:', err);
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Ignore quota exceptions
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): StateSchema {
    return this.state;
  }

  // --- User & Role Management ---
  public setCurrentUser(user: User) {
    this.state.currentUser = user;
    if (!this.state.users.some((u) => u.id === user.id)) {
      this.state.users.push(user);
    }
    this.persist();
    firebaseMobility.syncUserProfile(user).catch(() => {});
  }

  public switchRole(role: 'PASSENGER' | 'DRIVER' | 'ADMIN') {
    const target = this.state.users.find((u) => u.role === role);
    if (target) {
      this.state.currentUser = target;
      this.persist();
    }
  }

  public authenticateWithPhone(
    phone: string,
    fullName: string,
    role: 'PASSENGER' | 'DRIVER'
  ): { success: boolean; message: string; user?: User } {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const egyptRegex = /^01[0125][0-9]{8}$/;

    if (!egyptRegex.test(cleanPhone)) {
      return {
        success: false,
        message: 'رقم الهاتف غير صالح. يجب أن يكون رقم محمول مصري مكون من 11 رقماً يبدأ بـ 010 أو 011 أو 012 أو 015.',
      };
    }

    let existing = this.state.users.find((u) => u.phone === cleanPhone);

    if (existing) {
      this.state.currentUser = existing;
      this.persist();
      firebaseMobility.syncUserProfile(existing).catch(() => {});
      return {
        success: true,
        message: `مرحباً بعودتك يا ${existing.fullName}!`,
        user: existing,
      };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      phone: cleanPhone,
      fullName: fullName.trim() || (role === 'DRIVER' ? 'سائق جديد' : 'راكب جديد'),
      role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };

    this.state.users.push(newUser);

    if (role === 'DRIVER') {
      const newDriver: DriverProfile = {
        id: `driver-prof-${Date.now()}`,
        userId: newUser.id,
        fullName: newUser.fullName,
        phone: newUser.phone,
        nationalId: 'قيد التقديم',
        licenseNumber: 'قيد التقديم',
        vehicleModel: 'غير محدد بعد',
        vehiclePlate: 'غير مسجل',
        vehicleSeats: 4,
        verificationStatus: 'PENDING',
        verificationNote: 'يرجى تقديم صورة الرقم القومي ورخصة القيادة من لوحة السائق.',
        rating: 5.0,
        totalTripsCount: 0,
        createdAt: new Date().toISOString(),
      };
      this.state.drivers.push(newDriver);
      firebaseMobility.submitDriverProfile(newDriver).catch(() => {});
    }

    this.state.currentUser = newUser;
    this.persist();
    firebaseMobility.syncUserProfile(newUser).catch(() => {});

    return {
      success: true,
      message: 'تم إنشاء الحساب بنجاح وتوثيقه.',
      user: newUser,
    };
  }

  // --- Seat Booking on Published Trips ---
  public bookSeats(
    tripId: string,
    seatsCount: number
  ): { success: boolean; message: string; booking?: Booking } {
    const trip = this.state.trips.find((t) => t.id === tripId);
    if (!trip) {
      return { success: false, message: 'الرحلة المطلوبة غير موجودة.' };
    }

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      return { success: false, message: 'عذراً، هذه الرحلة ليست متاحة للحجز حالياً.' };
    }

    if (seatsCount <= 0 || !Number.isInteger(seatsCount)) {
      return { success: false, message: 'يجب اختيار مقعد واحد على الأقل وبعدد صحيح.' };
    }

    const existingConfirmedBookings = this.state.bookings.filter(
      (b) => b.tripId === trip.id && b.status === 'CONFIRMED'
    );
    const confirmedFromBookings = existingConfirmedBookings.reduce(
      (sum, b) => sum + b.seatsBooked,
      0
    );
    const currentBookedSeats = Math.max(
      trip.bookedSeats ?? 0,
      confirmedFromBookings,
      trip.totalSeats - trip.availableSeats
    );

    const projectedBookedSeats = currentBookedSeats + seatsCount;
    if (projectedBookedSeats > trip.totalSeats) {
      const remainingAllowed = Math.max(0, trip.totalSeats - currentBookedSeats);
      return {
        success: false,
        message: `عذراً، لا يمكن إتمام الحجز. سيتجاوز عدد المقاعد المحجوزة (${projectedBookedSeats}) إجمالي سعة الرحلة القصوى (${trip.totalSeats} مقعد). المقاعد المتاحة للحجز فعلياً: ${remainingAllowed} مقعد فقط.`,
      };
    }

    if (seatsCount > trip.availableSeats) {
      return {
        success: false,
        message: `المقاعد المطلوبة (${seatsCount}) تتجاوز المقاعد المتاحة حالياً (${trip.availableSeats} مقعد من أصل ${trip.totalSeats} مقعد).`,
      };
    }

    trip.bookedSeats = Math.min(trip.totalSeats, projectedBookedSeats);
    trip.availableSeats = Math.max(0, trip.totalSeats - trip.bookedSeats);

    const totalFare = seatsCount * trip.pricePerSeat;
    const commissionRate = this.state.settings.commissionRatePercent;
    const commissionAmount = Math.round((totalFare * commissionRate) / 100);
    const netDriverAmount = totalFare - commissionAmount;

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      tripId: trip.id,
      tripSummary: `${trip.originCity} ⇄ ${trip.destinationCity} (${trip.departureTime.split('T')[1]?.slice(0, 5) || ''})`,
      passengerId: this.state.currentUser.id,
      passengerName: this.state.currentUser.fullName,
      passengerPhone: this.state.currentUser.phone,
      seatsBooked: seatsCount,
      totalFare,
      commissionRate,
      commissionAmount,
      netDriverAmount,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    const commRecord: CommissionRecord = {
      id: `comm-${Date.now()}`,
      referenceType: 'BOOKING',
      referenceId: newBooking.id,
      totalAmount: totalFare,
      commissionRate,
      commissionAmount,
      driverAmount: netDriverAmount,
      settlementStatus: 'CASH_UNPAID',
      createdAt: new Date().toISOString(),
    };

    this.state.bookings.unshift(newBooking);
    this.state.commissions.unshift(commRecord);

    this.pushNotification({
      userId: this.state.currentUser.id,
      type: 'BOOKING_CONFIRMED',
      title: 'تم تأكيد حجز مقعدك بنجاح',
      message: `تم حجز ${seatsCount} مقعد في رحلة (${trip.originCity} ⇄ ${trip.destinationCity}) مع ${trip.driverName} بقيمة إجمالية ${totalFare} ج.م.`,
      relatedId: newBooking.id,
      targetTab: 'passenger',
      severity: 'success',
    });

    // Persist atomically to Firestore
    firebaseMobility.bookSeatsAtomic(trip.id, seatsCount, newBooking, commRecord).catch((err) => {
      console.error('Server sync error for booking:', err);
    });

    return {
      success: true,
      message: `تم تأكيد حجز ${seatsCount} مقعد بنجاح. القيمة الإجمالية: ${totalFare} ج.م (تدفع نقداً للسائق عند الركوب). المقاعد المتبقية: ${trip.availableSeats}.`,
      booking: newBooking,
    };
  }

  public bookTrip(tripId: string, requestedPassengers: number): Booking {
    const res = this.bookSeats(tripId, requestedPassengers);
    if (!res.success || !res.booking) {
      throw new Error(res.message);
    }
    return res.booking;
  }

  public cancelBooking(bookingId: string): { success: boolean; message: string } {
    const booking = this.state.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, message: 'الحجز غير موجود.' };
    if (booking.status === 'CANCELLED') return { success: false, message: 'هذا الحجز ملغى بالفعل.' };

    booking.status = 'CANCELLED';

    const trip = this.state.trips.find((t) => t.id === booking.tripId);
    if (trip) {
      const remainingConfirmed = this.state.bookings.filter(
        (b) => b.tripId === trip.id && b.status === 'CONFIRMED'
      );
      const remainingBooked = remainingConfirmed.reduce((sum, b) => sum + b.seatsBooked, 0);
      trip.bookedSeats = Math.min(trip.totalSeats, Math.max(0, remainingBooked));
      trip.availableSeats = Math.max(0, trip.totalSeats - trip.bookedSeats);
    }

    this.pushNotification({
      userId: booking.passengerId,
      type: 'BOOKING_CANCELLED',
      title: 'تم إلغاء حجز المقعد',
      message: `تم إلغاء حجزك في رحلة (${booking.tripSummary}) وإعادة المقاعد لقائمة الحجز المتاحة.`,
      relatedId: booking.id,
      targetTab: 'passenger',
      severity: 'warning',
    });

    return { success: true, message: 'تم إلغاء الحجز وإعادة المقاعد لقائمة الحجز المتاحة.' };
  }

  public getTripCapacity(tripId: string) {
    const trip = this.state.trips.find((t) => t.id === tripId);
    if (!trip) return { totalSeats: 0, bookedSeats: 0, availableSeats: 0, fillPercentage: 0, isFull: true };

    const confirmed = this.state.bookings.filter(
      (b) => b.tripId === trip.id && b.status === 'CONFIRMED'
    );
    const currentBooked = Math.max(
      trip.bookedSeats ?? 0,
      confirmed.reduce((sum, b) => sum + b.seatsBooked, 0),
      trip.totalSeats - trip.availableSeats
    );
    const bookedSeats = Math.min(trip.totalSeats, Math.max(0, currentBooked));
    const availableSeats = Math.max(0, trip.totalSeats - bookedSeats);
    const fillPercentage = trip.totalSeats > 0 ? Math.min(100, Math.round((bookedSeats / trip.totalSeats) * 100)) : 100;

    return {
      totalSeats: trip.totalSeats,
      bookedSeats,
      availableSeats,
      fillPercentage,
      isFull: bookedSeats >= trip.totalSeats || availableSeats <= 0,
    };
  }

  // --- Publish Scheduled Trip ---
  public publishTrip(tripData: {
    originCity: string;
    originDetails: string;
    destinationCity: string;
    destinationDetails: string;
    departureTime: string;
    totalSeats: number;
    pricePerSeat: number;
    notes?: string;
  }): { success: boolean; message: string; trip?: PublishedTrip } {
    const driver = this.state.drivers.find((d) => d.userId === this.state.currentUser.id) || this.state.drivers[0];

    if (!driver) {
      return { success: false, message: 'يجب أن تمتلك حساب سائق لتتمكن من نشر رحلة.' };
    }

    if (driver.verificationStatus !== 'APPROVED') {
      return {
        success: false,
        message: 'لا يمكنك نشر رحلات قبل مراجعة مستنداتك واعتماد حسابك من إدارة المنصة.',
      };
    }

    if (tripData.totalSeats <= 0 || tripData.pricePerSeat <= 0) {
      return { success: false, message: 'يرجى إدخال عدد مقاعد وسعر مقعد صحيحين.' };
    }

    const newTrip: PublishedTrip = {
      id: `trip-${Date.now()}`,
      driverId: driver.id,
      driverName: driver.fullName,
      driverPhone: driver.phone,
      driverRating: driver.rating,
      vehicleModel: driver.vehicleModel,
      vehiclePlate: driver.vehiclePlate,
      originCity: tripData.originCity,
      originDetails: tripData.originDetails,
      destinationCity: tripData.destinationCity,
      destinationDetails: tripData.destinationDetails,
      departureTime: tripData.departureTime,
      totalSeats: tripData.totalSeats,
      availableSeats: tripData.totalSeats,
      bookedSeats: 0,
      pricePerSeat: tripData.pricePerSeat,
      status: 'SCHEDULED',
      notes: tripData.notes,
      createdAt: new Date().toISOString(),
    };

    this.state.trips.unshift(newTrip);
    this.persist();

    // Persist to Firestore
    firebaseMobility.publishTrip(newTrip).catch((err) => {
      console.error('Server sync error for trip publishing:', err);
    });

    return {
      success: true,
      message: 'تم نشر الرحلة بنجاح في قاعدة بيانات المنصة وأصبحت متاحة للركاب.',
      trip: newTrip,
    };
  }

  // --- Create Ride Request (Passenger) ---
  public createRideRequest(data: {
    serviceType: 'CITY' | 'INTERCITY';
    originCity: string;
    originAddress: string;
    destinationCity: string;
    destinationAddress: string;
    scheduledTime: string;
    passengerCount: number;
    suggestedFare?: number;
    notes?: string;
    originLat?: number;
    originLng?: number;
    destLat?: number;
    destLng?: number;
    routeDistanceKm?: number;
    routeDurationMins?: number;
  }): { success: boolean; message: string; request?: RideRequest } {
    const newReq: RideRequest = {
      id: `req-${Date.now()}`,
      passengerId: this.state.currentUser.id,
      passengerName: this.state.currentUser.fullName,
      passengerPhone: this.state.currentUser.phone,
      serviceType: data.serviceType,
      originCity: data.originCity,
      originAddress: data.originAddress,
      destinationCity: data.destinationCity,
      destinationAddress: data.destinationAddress,
      scheduledTime: data.scheduledTime,
      passengerCount: data.passengerCount,
      suggestedFare: data.suggestedFare,
      notes: data.notes,
      originLat: data.originLat,
      originLng: data.originLng,
      destLat: data.destLat,
      destLng: data.destLng,
      routeDistanceKm: data.routeDistanceKm,
      routeDurationMins: data.routeDurationMins,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    this.state.requests.unshift(newReq);

    this.pushNotification({
      userId: newReq.passengerId,
      type: 'REQUEST_CREATED',
      title: 'تم نشر طلب رحلتك وإشعار السائقين',
      message: `تم تسجيل طلبك من (${newReq.originCity} - ${newReq.originAddress}) إلى (${newReq.destinationCity} - ${newReq.destinationAddress}). جاري استقبال عروض السائقين الآن.`,
      relatedId: newReq.id,
      targetTab: 'passenger',
      severity: 'info',
    });

    // Persist to Cloud Firestore so drivers on other devices immediately see it
    firebaseMobility.createRideRequest(newReq).catch((err) => {
      console.error('Server sync error for ride request:', err);
    });

    return {
      success: true,
      message: 'تم إرسال طلبك بنجاح وحفظه في السيرفر المشترك. سيتم إخطار السائقين فوراً لتقديم العروض.',
      request: newReq,
    };
  }

  // --- Submit Driver Offer (Driver) ---
  public submitOffer(data: {
    requestId: string;
    proposedFare: number;
    estimatedArrivalMins: number;
    notes?: string;
  }): { success: boolean; message: string; offer?: DriverOffer } {
    const driver = this.state.drivers.find((d) => d.userId === this.state.currentUser.id) || this.state.drivers[0];
    if (!driver) {
      return { success: false, message: 'الحساب الحالي ليس حساب سائق مسجل.' };
    }

    if (driver.verificationStatus !== 'APPROVED') {
      return {
        success: false,
        message: 'حسابك ما زال قيد المراجعة والتدقيق، لا يمكنك إرسال عروض حتى اعتماده.',
      };
    }

    const request = this.state.requests.find((r) => r.id === data.requestId);
    if (!request || (request.status !== 'OPEN' && request.status !== 'OFFERED')) {
      return { success: false, message: 'عذراً، هذا الطلب غير متاح لاستقبال عروض.' };
    }

    const newOffer: DriverOffer = {
      id: `offer-${Date.now()}`,
      requestId: request.id,
      driverId: driver.id,
      driverName: driver.fullName,
      driverPhone: driver.phone,
      driverRating: driver.rating,
      vehicleModel: driver.vehicleModel,
      vehiclePlate: driver.vehiclePlate,
      proposedFare: data.proposedFare,
      estimatedArrivalMins: data.estimatedArrivalMins,
      notes: data.notes,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.state.offers.unshift(newOffer);
    request.status = 'OFFERED';

    this.pushNotification({
      userId: request.passengerId,
      type: 'DRIVER_OFFER_RECEIVED',
      title: `عرض سعر جديد من ${driver.fullName}`,
      message: `قبل السائق ${driver.fullName} (★ ${driver.rating}) تنفيذ رحلتك من ${request.originAddress} إلى ${request.destinationAddress} بسعر ${data.proposedFare} ج.م ووصول خلال ${data.estimatedArrivalMins} دقيقة.`,
      relatedId: request.id,
      targetTab: 'passenger',
      severity: 'urgent',
    });

    // Send to Firestore
    firebaseMobility.submitDriverOffer(newOffer).catch((err) => {
      console.error('Server sync error for driver offer:', err);
    });

    return {
      success: true,
      message: `تم إرسال عرضك بقيمة ${data.proposedFare} ج.م إلى الراكب عبر الخادم.`,
      offer: newOffer,
    };
  }

  // --- Accept Offer (Passenger) with Concurrency and Atomic Protection ---
  public acceptOffer(offerId: string): { success: boolean; message: string } {
    const offer = this.state.offers.find((o) => o.id === offerId);
    if (!offer) {
      return { success: false, message: 'العرض غير موجود.' };
    }

    const request = this.state.requests.find((r) => r.id === offer.requestId);
    if (!request) {
      return { success: false, message: 'طلب المشوار غير موجود.' };
    }

    if (request.status === 'ACCEPTED') {
      return { success: false, message: 'تم بالفعل قبول عرض وتثبيت هذه الرحلة سابقاً.' };
    }

    // Optimistically update
    offer.status = 'ACCEPTED';
    request.status = 'ACCEPTED';
    request.acceptedOfferId = offer.id;

    // Reject competing offers
    this.state.offers.forEach((o) => {
      if (o.requestId === request.id && o.id !== offer.id) {
        o.status = 'REJECTED';
      }
    });

    // Record commission
    const commissionRate = this.state.settings.commissionRatePercent;
    const commissionAmount = Math.round((offer.proposedFare * commissionRate) / 100);
    const driverAmount = offer.proposedFare - commissionAmount;

    const commRecord: CommissionRecord = {
      id: `comm-req-${Date.now()}`,
      referenceType: 'RIDE_OFFER',
      referenceId: request.id,
      totalAmount: offer.proposedFare,
      commissionRate,
      commissionAmount,
      driverAmount,
      settlementStatus: 'CASH_UNPAID',
      createdAt: new Date().toISOString(),
    };
    this.state.commissions.unshift(commRecord);

    this.pushNotification({
      userId: request.passengerId,
      type: 'OFFER_ACCEPTED',
      title: 'تم قبول العرض وتثبيت السائق لرحلتك!',
      message: `تم تثبيت رحلتك (${request.originAddress} ← ${request.destinationAddress}) مع ${offer.driverName} (${offer.vehicleModel} - ${offer.vehiclePlate}) بقيمة ${offer.proposedFare} ج.م. السائق في طريقه إليك خلال ${offer.estimatedArrivalMins} دقيقة.`,
      relatedId: request.id,
      targetTab: 'passenger',
      severity: 'success',
    });

    // Call atomic transaction on Firestore
    firebaseMobility
      .acceptOfferAtomic(request.id, offer.id, commRecord)
      .then(() => {
        console.log('Offer acceptance committed atomically in Firestore.');
      })
      .catch((err) => {
        console.error('Atomic transaction conflict or error:', err);
      });

    return {
      success: true,
      message: `تم تأكيد العرض بنجاح! السائق: ${offer.driverName} (${offer.driverPhone}). القيمة: ${offer.proposedFare} ج.م.`,
    };
  }

  // --- Parcel Shipment ---
  public createParcel(data: {
    receiverName: string;
    receiverPhone: string;
    originCity: string;
    destinationCity: string;
    pickupAddress: string;
    deliveryAddress: string;
    packageDescription: string;
    weightKg?: number;
    agreedPrice: number;
  }): { success: boolean; message: string; parcel?: Parcel } {
    const trackingNumber = `RGB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const commissionRate = this.state.settings.commissionRatePercent;
    const commissionAmount = Math.round((data.agreedPrice * commissionRate) / 100);

    const newParcel: Parcel = {
      id: `parcel-${Date.now()}`,
      trackingNumber,
      senderId: this.state.currentUser.id,
      senderName: this.state.currentUser.fullName,
      senderPhone: this.state.currentUser.phone,
      receiverName: data.receiverName,
      receiverPhone: data.receiverPhone,
      originCity: data.originCity,
      destinationCity: data.destinationCity,
      pickupAddress: data.pickupAddress,
      deliveryAddress: data.deliveryAddress,
      packageDescription: data.packageDescription,
      weightKg: data.weightKg,
      agreedPrice: data.agreedPrice,
      commissionRate,
      commissionAmount,
      status: 'CREATED',
      createdAt: new Date().toISOString(),
    };

    const commRecord: CommissionRecord = {
      id: `comm-parcel-${Date.now()}`,
      referenceType: 'PARCEL',
      referenceId: newParcel.id,
      totalAmount: data.agreedPrice,
      commissionRate,
      commissionAmount,
      driverAmount: data.agreedPrice - commissionAmount,
      settlementStatus: 'CASH_UNPAID',
      createdAt: new Date().toISOString(),
    };

    this.state.parcels.unshift(newParcel);
    this.state.commissions.unshift(commRecord);
    this.persist();

    firebaseMobility.createParcel(newParcel, commRecord).catch((err) => {
      console.error('Server sync error for parcel:', err);
    });

    return {
      success: true,
      message: `تم تسجيل طلب الطرد برقم تتبع: ${trackingNumber}. سيتم إسناده لسائق متوجه لنفس المدينة.`,
      parcel: newParcel,
    };
  }

  // --- Support & Complaints ---
  public submitComplaint(category: string, message: string, relatedId?: string) {
    const comp: Complaint = {
      id: `comp-${Date.now()}`,
      userId: this.state.currentUser.id,
      userName: this.state.currentUser.fullName,
      userPhone: this.state.currentUser.phone,
      relatedId,
      category,
      message,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.state.complaints.unshift(comp);
    this.persist();

    firebaseMobility.submitComplaint(comp).catch((err) => {
      console.error('Server sync error for complaint:', err);
    });

    return { success: true, message: 'تم إرسال بلاغك وسيتم التواصل معك من قبل فريق الدعم.' };
  }

  // --- Admin Functions ---
  public updateDriverStatus(
    driverId: string,
    status: DriverVerificationStatus,
    note?: string
  ): { success: boolean; message: string } {
    const driver = this.state.drivers.find((d) => d.id === driverId);
    if (!driver) return { success: false, message: 'السائق غير موجود.' };

    driver.verificationStatus = status;
    if (note) driver.verificationNote = note;
    this.persist();

    firebaseMobility.updateDriverVerification(driverId, status, note).catch((err) => {
      console.error('Server sync error for driver verification:', err);
    });

    const statusArabic =
      status === 'APPROVED' ? 'معتمد' : status === 'REJECTED' ? 'مرفوض' : 'قيد المراجعة';
    return { success: true, message: `تم تحديث حالة السائق ${driver.fullName} إلى: ${statusArabic}.` };
  }

  public updateCommissionRate(newRate: number): { success: boolean; message: string } {
    if (newRate < 0 || newRate > 50) {
      return { success: false, message: 'يجب أن تكون نسبة العمولة بين 0% و 50%.' };
    }
    this.state.settings.commissionRatePercent = newRate;
    this.persist();
    return { success: true, message: `تم تحديث نسبة العمولة المستقبلية إلى ${newRate}%. العمليات السابقة تحتفظ بنسبتها المحاسبية الأصلية دون تغيير.` };
  }

  public settleCommission(commissionId: string): { success: boolean; message: string } {
    const record = this.state.commissions.find((c) => c.id === commissionId);
    if (!record) return { success: false, message: 'السجل غير موجود.' };
    record.settlementStatus = 'CASH_SETTLED';
    this.persist();
    return { success: true, message: 'تم تسوية وتوريد عمولة المنصة بنجاح.' };
  }

  public submitDriverDocuments(data: {
    nationalId: string;
    licenseNumber: string;
    vehicleModel: string;
    vehiclePlate: string;
    vehicleSeats: number;
  }): { success: boolean; message: string } {
    let driver = this.state.drivers.find((d) => d.userId === this.state.currentUser.id);

    if (!driver) {
      driver = {
        id: `driver-prof-${Date.now()}`,
        userId: this.state.currentUser.id,
        fullName: this.state.currentUser.fullName,
        phone: this.state.currentUser.phone,
        nationalId: data.nationalId,
        licenseNumber: data.licenseNumber,
        vehicleModel: data.vehicleModel,
        vehiclePlate: data.vehiclePlate,
        vehicleSeats: data.vehicleSeats,
        verificationStatus: 'PENDING',
        verificationNote: 'تم تقديم المستندات، بانتظار فحص مدير المنصة.',
        rating: 5.0,
        totalTripsCount: 0,
        createdAt: new Date().toISOString(),
      };
      this.state.drivers.push(driver);
    } else {
      driver.nationalId = data.nationalId;
      driver.licenseNumber = data.licenseNumber;
      driver.vehicleModel = data.vehicleModel;
      driver.vehiclePlate = data.vehiclePlate;
      driver.vehicleSeats = data.vehicleSeats;
      driver.verificationStatus = 'PENDING';
      driver.verificationNote = 'تم تحديث المستندات وبانتظار اعتماد الإدارة.';
    }

    this.persist();
    firebaseMobility.submitDriverProfile(driver).catch((err) => {
      console.error('Server sync error for driver profile:', err);
    });

    return {
      success: true,
      message: 'تم إرسال بياناتك ومستنداتك بنجاح. سيقوم مدير المنصة بمراجعتها واعتماد حسابك خلال ساعات العمل.',
    };
  }

  public updateTripStatus(
    tripId: string,
    newStatus: PublishedTrip['status']
  ): { success: boolean; message: string } {
    const trip = this.state.trips.find((t) => t.id === tripId);
    if (!trip) return { success: false, message: 'الرحلة غير موجودة.' };

    trip.status = newStatus;
    if (newStatus === 'COMPLETED') {
      const driver = this.state.drivers.find((d) => d.id === trip.driverId);
      if (driver) driver.totalTripsCount += 1;
    }

    this.persist();
    firebaseMobility.updateTripStatus(tripId, newStatus).catch((err) => {
      console.error('Server sync error for trip status:', err);
    });

    const statusText =
      newStatus === 'ACTIVE'
        ? 'بدأت الرحلة بنجاح وهي جارية الآن'
        : newStatus === 'COMPLETED'
        ? 'تم اكتمال الرحلة بنجاح وتسجيلها في السجلات'
        : newStatus === 'PENDING'
        ? 'تم ضبط حالة الرحلة إلى: قيد الانتظار'
        : newStatus === 'SCHEDULED'
        ? 'تم تأكيد موعد الرحلة ونشرها للحجز'
        : 'تم إلغاء الرحلة';

    this.pushNotification({
      type: 'TRIP_STATUS_UPDATED',
      title: `تحديث حالة الرحلة (${trip.originCity} ⇄ ${trip.destinationCity})`,
      message: `${statusText} — السائق: ${trip.driverName} (${trip.vehicleModel}).`,
      relatedId: trip.id,
      targetTab: 'trips',
      severity:
        newStatus === 'CANCELLED'
          ? 'warning'
          : newStatus === 'COMPLETED' || newStatus === 'ACTIVE'
          ? 'success'
          : 'info',
    });

    return { success: true, message: statusText };
  }

  public updateParcelStatus(
    parcelId: string,
    newStatus: 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED',
    driverName?: string
  ): { success: boolean; message: string } {
    const parcel = this.state.parcels.find((p) => p.id === parcelId);
    if (!parcel) return { success: false, message: 'الطرد غير موجود.' };

    parcel.status = newStatus;
    if (driverName) parcel.assignedDriverName = driverName;

    const statusAr =
      newStatus === 'ASSIGNED'
        ? 'تم إسناد الطرد للسائق'
        : newStatus === 'IN_TRANSIT'
        ? 'الطرد قيد النقل الآن'
        : newStatus === 'DELIVERED'
        ? 'تم تسليم الطرد للمستلم بنجاح'
        : 'تم إلغاء شحنة الطرد';

    this.pushNotification({
      userId: parcel.senderId,
      type: 'PARCEL_STATUS_UPDATED',
      title: `تحديث حالة الطرد (${parcel.trackingNumber})`,
      message: `${statusAr} (${parcel.originCity} ← ${parcel.destinationCity})${
        parcel.assignedDriverName ? ` مع السائق ${parcel.assignedDriverName}` : ''
      }.`,
      relatedId: parcel.id,
      targetTab: 'parcels',
      severity: newStatus === 'DELIVERED' ? 'success' : 'info',
    });

    firebaseMobility.updateParcelStatus(parcelId, newStatus, driverName).catch((err) => {
      console.error('Server sync error for parcel status:', err);
    });

    return { success: true, message: 'تم تحديث حالة الطرد بنجاح.' };
  }

  public completeRideRequest(requestId: string): { success: boolean; message: string } {
    const request = this.state.requests.find((r) => r.id === requestId);
    if (!request) return { success: false, message: 'الطلب غير موجود.' };

    request.status = 'COMPLETED';

    this.pushNotification({
      userId: request.passengerId,
      type: 'TRIP_STATUS_UPDATED',
      title: 'تم تحديث حالة طلبك إلى: رحلة مكتملة',
      message: `الحمد لله على سلامتك! اكتملت رحلتك (${request.originAddress} ← ${request.destinationAddress}). يمكنك الآن تقييم السائق بالنجوم والتعليق.`,
      relatedId: request.id,
      targetTab: 'passenger',
      severity: 'success',
    });

    return { success: true, message: 'تم تحديث حالة الرحلة إلى مكتملة بنجاح.' };
  }

  public cancelRideRequest(requestId: string): { success: boolean; message: string } {
    const request = this.state.requests.find((r) => r.id === requestId);
    if (!request) return { success: false, message: 'الطلب غير موجود.' };
    if (request.status === 'CANCELLED') return { success: false, message: 'هذا الطلب ملغى بالفعل.' };

    request.status = 'CANCELLED';

    this.pushNotification({
      userId: request.passengerId,
      type: 'TRIP_STATUS_UPDATED',
      title: 'تحديث حالة الطلب: تم إلغاء الرحلة',
      message: `تم إلغاء طلب الرحلة (${request.originAddress} ← ${request.destinationAddress}) وتحديث حالته في سجل رحلاتك.`,
      relatedId: request.id,
      targetTab: 'passenger',
      severity: 'warning',
    });

    return { success: true, message: 'تم إلغاء طلب الرحلة وتحديث حالته في سجل الرحلات.' };
  }

  public completeBooking(bookingId: string): { success: boolean; message: string } {
    const booking = this.state.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, message: 'الحجز غير موجود.' };

    booking.status = 'COMPLETED';

    this.pushNotification({
      userId: booking.passengerId,
      type: 'TRIP_STATUS_UPDATED',
      title: 'اكتملت رحلتك المجدولة بنجاح',
      message: `تم إتمام حجزك في رحلة (${booking.tripSummary}). شاركنا تقييمك للسائق والمركبة الآن.`,
      relatedId: booking.id,
      targetTab: 'passenger',
      severity: 'success',
    });

    return { success: true, message: 'تم تحديث حالة الحجز إلى مكتمل بنجاح. يمكنك الآن تقييم السائق والرحلة.' };
  }

  public submitTripRating(params: {
    itemType: 'REQUEST' | 'BOOKING';
    itemId: string;
    driverStars?: number;
    driverComment?: string;
    driverTags?: string[];
    passengerStars?: number;
    passengerComment?: string;
    passengerTags?: string[];
    driverName?: string;
  }): { success: boolean; message: string } {
    const nowIso = new Date().toISOString();

    if (params.driverStars !== undefined && (params.driverStars < 1 || params.driverStars > 5)) {
      return { success: false, message: 'يرجى اختيار تقييم للسائق بين نجمة واحدة و 5 نجوم.' };
    }
    if (params.passengerStars !== undefined && (params.passengerStars < 1 || params.passengerStars > 5)) {
      return { success: false, message: 'يرجى اختيار تقييم للراكب بين نجمة واحدة و 5 نجوم.' };
    }

    if (params.itemType === 'REQUEST') {
      const req = this.state.requests.find((r) => r.id === params.itemId);
      if (!req) return { success: false, message: 'طلب الرحلة غير موجود.' };

      if (req.status !== 'COMPLETED') {
        req.status = 'COMPLETED';
      }

      const existing = req.rating || {
        driverId: 'driver-prof-1',
        driverName: params.driverName || 'الكابتن محمد عبد الرحيم',
        passengerId: req.passengerId,
        passengerName: req.passengerName,
      };

      req.rating = {
        ...existing,
        ...(params.driverStars !== undefined
          ? {
              driverStars: params.driverStars,
              driverComment: params.driverComment?.trim() || existing.driverComment,
              driverTags: params.driverTags ?? existing.driverTags,
              driverRatedAt: nowIso,
            }
          : {}),
        ...(params.passengerStars !== undefined
          ? {
              passengerStars: params.passengerStars,
              passengerComment: params.passengerComment?.trim() || existing.passengerComment,
              passengerTags: params.passengerTags ?? existing.passengerTags,
              passengerRatedAt: nowIso,
            }
          : {}),
      };
    } else {
      const booking = this.state.bookings.find((b) => b.id === params.itemId);
      if (!booking) return { success: false, message: 'الحجز غير موجود.' };

      if (booking.status !== 'COMPLETED') {
        booking.status = 'COMPLETED';
      }

      const existing = booking.rating || {
        driverId: 'driver-prof-1',
        driverName: params.driverName || 'الكابتن محمد عبد الرحيم',
        passengerId: booking.passengerId,
        passengerName: booking.passengerName,
      };

      booking.rating = {
        ...existing,
        ...(params.driverStars !== undefined
          ? {
              driverStars: params.driverStars,
              driverComment: params.driverComment?.trim() || existing.driverComment,
              driverTags: params.driverTags ?? existing.driverTags,
              driverRatedAt: nowIso,
            }
          : {}),
        ...(params.passengerStars !== undefined
          ? {
              passengerStars: params.passengerStars,
              passengerComment: params.passengerComment?.trim() || existing.passengerComment,
              passengerTags: params.passengerTags ?? existing.passengerTags,
              passengerRatedAt: nowIso,
            }
          : {}),
      };
    }

    // Update driver profile rating average
    if (params.driverStars !== undefined) {
      const driver = this.state.drivers[0];
      if (driver) {
        const count = Math.max(1, driver.totalTripsCount);
        driver.rating = Number((((driver.rating * count) + params.driverStars) / (count + 1)).toFixed(1));
      }
    }

    // Update currentUser passenger rating average
    if (params.passengerStars !== undefined) {
      const currCount = this.state.currentUser.totalRatingsCount || 12;
      const currRating = this.state.currentUser.rating || 4.9;
      const updatedRating = Number((((currRating * currCount) + params.passengerStars) / (currCount + 1)).toFixed(1));
      this.state.currentUser.rating = updatedRating;
      this.state.currentUser.totalRatingsCount = currCount + 1;
    }

    this.pushNotification({
      userId: this.state.currentUser.id,
      type: 'TRIP_RATED',
      title: 'تم توثيق التقييم المتبادل للرحلة ★',
      message: `تم حفظ تقييمك (${params.driverStars || 5}/5 نجوم) وتعليقك في سجل الثقة والمسؤولية المتبادلة.`,
      relatedId: params.itemId,
      targetTab: 'passenger',
      severity: 'success',
    });

    return {
      success: true,
      message: 'تم حفظ التقييم والتعليق بنجاح في سجل الثقة والمسؤولية المتبادلة للمنصة.',
    };
  }

  // --- Simulate Instant Driver Offer / Acceptance Notification for Real-Time UX ---
  public simulateInstantDriverNotification(targetRequestId?: string): {
    success: boolean;
    message: string;
    notification?: InAppNotification;
  } {
    const openOrOfferedReq = targetRequestId
      ? this.state.requests.find((r) => r.id === targetRequestId)
      : this.state.requests.find(
          (r) =>
            r.passengerId === this.state.currentUser.id &&
            (r.status === 'OPEN' || r.status === 'OFFERED')
        ) || this.state.requests[0];

    const driver = this.state.drivers[0];

    if (openOrOfferedReq && driver) {
      const pendingOffer = this.state.offers.find(
        (o) => o.requestId === openOrOfferedReq.id && o.status === 'PENDING'
      );

      if (openOrOfferedReq.status === 'OPEN' || !pendingOffer) {
        const fare = openOrOfferedReq.suggestedFare || 40;
        const newOffer: DriverOffer = {
          id: `offer-${Date.now()}`,
          requestId: openOrOfferedReq.id,
          driverId: driver.id,
          driverName: driver.fullName,
          driverPhone: driver.phone,
          driverRating: driver.rating,
          vehicleModel: driver.vehicleModel,
          vehiclePlate: driver.vehiclePlate,
          proposedFare: fare,
          estimatedArrivalMins: 8,
          notes: 'الكابتن قريب من موقعك وجاهز للتحرك فوراً في الموعد المحدد.',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        this.state.offers.unshift(newOffer);
        openOrOfferedReq.status = 'OFFERED';

        const notif = this.pushNotification({
          userId: openOrOfferedReq.passengerId,
          type: 'DRIVER_OFFER_RECEIVED',
          title: `تنبيه فوري: السائق ${driver.fullName} قبل طلبك وأرسل عرضاً!`,
          message: `وافق ${driver.fullName} (★ ${driver.rating}) على توصيلك من (${openOrOfferedReq.originAddress}) إلى (${openOrOfferedReq.destinationAddress}) بتكلفة ${fare} ج.م والوصول خلال 8 دقائق.`,
          relatedId: openOrOfferedReq.id,
          targetTab: 'passenger',
          severity: 'urgent',
        });

        return {
          success: true,
          message: notif.message,
          notification: notif,
        };
      } else {
        // Accept the pending offer and notify immediately
        pendingOffer.status = 'ACCEPTED';
        openOrOfferedReq.status = 'ACCEPTED';
        openOrOfferedReq.acceptedOfferId = pendingOffer.id;

        const notif = this.pushNotification({
          userId: openOrOfferedReq.passengerId,
          type: 'OFFER_ACCEPTED',
          title: `تأكيد فوري: الكابتن ${pendingOffer.driverName} في طريقه إليك!`,
          message: `تمت الموافقة النهائية وتثبيت رحلتك (${openOrOfferedReq.originAddress} ← ${openOrOfferedReq.destinationAddress}) بسعر ${pendingOffer.proposedFare} ج.م. المركبة: ${pendingOffer.vehicleModel} (${pendingOffer.vehiclePlate}).`,
          relatedId: openOrOfferedReq.id,
          targetTab: 'passenger',
          severity: 'success',
        });

        return {
          success: true,
          message: notif.message,
          notification: notif,
        };
      }
    }

    const fallbackNotif = this.pushNotification({
      userId: this.state.currentUser.id,
      type: 'OFFER_ACCEPTED',
      title: 'تنبيه فوري: قبول السائق لرحلتك وتحديث الحالة',
      message:
        'وافق الكابتن محمد عبد الرحيم (تويوتا هايس - ط ر ج ٤٥٨٢) على طلب رحلتك وهو في طريقه لنقطة الانطلاق الآن.',
      targetTab: 'passenger',
      severity: 'success',
    });

    return {
      success: true,
      message: fallbackNotif.message,
      notification: fallbackNotif,
    };
  }

  public resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadState();
    this.notify();
  }
}

export const mobilityStore = new MobilityStore();
