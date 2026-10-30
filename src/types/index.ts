export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export type DriverVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';

export type RideServiceType = 'CITY' | 'INTERCITY';

export type RideRequestStatus = 'OPEN' | 'OFFERED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type DriverOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type TripStatus = 'SCHEDULED' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type BookingStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type ParcelStatus = 'CREATED' | 'ASSIGNED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export type ComplaintStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED';

export interface MutualTripRating {
  // تقييم الراكب للسائق (Passenger rating Driver)
  driverStars?: number;
  driverComment?: string;
  driverTags?: string[];
  driverRatedAt?: string;

  // تقييم السائق للراكب (Driver rating Passenger)
  passengerStars?: number;
  passengerComment?: string;
  passengerTags?: string[];
  passengerRatedAt?: string;

  driverId?: string;
  driverName?: string;
  passengerId?: string;
  passengerName?: string;
}

export interface User {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  rating?: number;
  totalRatingsCount?: number;
  createdAt: string;
}

export interface DriverProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  nationalId: string;
  licenseNumber: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleSeats: number;
  verificationStatus: DriverVerificationStatus;
  verificationNote?: string;
  rating: number;
  totalTripsCount: number;
  createdAt: string;
}

export interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  serviceType: RideServiceType;
  originCity: string;
  originAddress: string;
  destinationCity: string;
  destinationAddress: string;
  scheduledTime: string;
  passengerCount: number;
  suggestedFare?: number;
  notes?: string;
  status: RideRequestStatus;
  acceptedOfferId?: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  routeDistanceKm?: number;
  routeDurationMins?: number;
  rating?: MutualTripRating;
  createdAt: string;
}

export interface DriverOffer {
  id: string;
  requestId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  vehicleModel: string;
  vehiclePlate: string;
  proposedFare: number;
  estimatedArrivalMins: number;
  notes?: string;
  status: DriverOfferStatus;
  createdAt: string;
}

export interface PublishedTrip {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  vehicleModel: string;
  vehiclePlate: string;
  originCity: string;
  originDetails: string;
  destinationCity: string;
  destinationDetails: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  pricePerSeat: number;
  status: TripStatus;
  notes?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  tripId: string;
  tripSummary: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  seatsBooked: number;
  totalFare: number;
  commissionRate: number; // النسبة المطبقة وقت الحجز (مثال 10%)
  commissionAmount: number; // حصة المنصة
  netDriverAmount: number; // حصة السائق الصافية
  status: BookingStatus;
  rating?: MutualTripRating;
  createdAt: string;
}

export interface Parcel {
  id: string;
  trackingNumber: string;
  senderId: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  originCity: string;
  destinationCity: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription: string;
  weightKg?: number;
  agreedPrice: number;
  commissionRate: number;
  commissionAmount: number;
  status: ParcelStatus;
  assignedDriverId?: string;
  assignedDriverName?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  relatedId?: string;
  category: string;
  message: string;
  status: ComplaintStatus;
  adminReply?: string;
  createdAt: string;
}

export interface CommissionRecord {
  id: string;
  referenceType: 'BOOKING' | 'RIDE_OFFER' | 'PARCEL';
  referenceId: string;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  driverAmount: number;
  settlementStatus: 'CASH_UNPAID' | 'CASH_SETTLED';
  createdAt: string;
}

export interface SystemSettings {
  commissionRatePercent: number;
  cityRideBaseFare: number;
  allowUnverifiedDrivers: boolean;
  smsGatewayConfigured: boolean;
}

export type InAppNotificationType =
  | 'REQUEST_CREATED'
  | 'DRIVER_OFFER_RECEIVED'
  | 'OFFER_ACCEPTED'
  | 'TRIP_STATUS_UPDATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'PARCEL_STATUS_UPDATED'
  | 'DRIVER_VERIFIED'
  | 'TRIP_RATED';

export interface InAppNotification {
  id: string;
  userId?: string;
  type: InAppNotificationType;
  title: string;
  message: string;
  relatedId?: string;
  targetTab?: 'home' | 'trips' | 'passenger' | 'driver' | 'admin' | 'parcels' | 'workspace';
  severity: 'info' | 'success' | 'warning' | 'urgent';
  isRead: boolean;
  createdAt: string;
}

