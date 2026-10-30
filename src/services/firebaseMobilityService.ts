import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  query,
  orderBy,
  getDocFromServer,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
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
  DriverVerificationStatus,
} from '../types';

export class FirebaseMobilityService {
  private isOnline = false;

  // Test Firestore Connection
  async testConnection(): Promise<boolean> {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      this.isOnline = true;
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn('Firestore is currently running offline or connecting...');
      }
      this.isOnline = false;
      return false;
    }
  }

  // --- Real-time Firestore Subscriptions ---

  subscribeToRideRequests(callback: (requests: RideRequest[]) => void) {
    const colRef = collection(db, 'rideRequests');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: RideRequest[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as RideRequest);
        });
        // Sort newest first
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'rideRequests');
      }
    );
  }

  subscribeToDriverOffers(callback: (offers: DriverOffer[]) => void) {
    const colRef = collection(db, 'driverOffers');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: DriverOffer[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as DriverOffer);
        });
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'driverOffers');
      }
    );
  }

  subscribeToPublishedTrips(callback: (trips: PublishedTrip[]) => void) {
    const colRef = collection(db, 'publishedTrips');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: PublishedTrip[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as PublishedTrip);
        });
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'publishedTrips');
      }
    );
  }

  subscribeToBookings(callback: (bookings: Booking[]) => void) {
    const colRef = collection(db, 'bookings');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: Booking[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Booking);
        });
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'bookings');
      }
    );
  }

  subscribeToDrivers(callback: (drivers: DriverProfile[]) => void) {
    const colRef = collection(db, 'drivers');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: DriverProfile[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as DriverProfile);
        });
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'drivers');
      }
    );
  }

  subscribeToParcels(callback: (parcels: Parcel[]) => void) {
    const colRef = collection(db, 'parcels');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: Parcel[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Parcel);
        });
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'parcels');
      }
    );
  }

  subscribeToComplaints(callback: (complaints: Complaint[]) => void) {
    const colRef = collection(db, 'complaints');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: Complaint[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Complaint);
        });
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'complaints');
      }
    );
  }

  // --- Atomic Ride Request & Offer Lifecycle ---

  async createRideRequest(request: RideRequest): Promise<void> {
    const path = `rideRequests/${request.id}`;
    try {
      await setDoc(doc(db, 'rideRequests', request.id), request);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async submitDriverOffer(offer: DriverOffer): Promise<void> {
    const path = `driverOffers/${offer.id}`;
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, 'rideRequests', offer.requestId);
        const reqSnap = await transaction.get(reqRef);

        if (!reqSnap.exists()) {
          throw new Error('طلب المشوار المطلوب غير موجود في قاعدة البيانات.');
        }

        const reqData = reqSnap.data() as RideRequest;
        if (reqData.status === 'ACCEPTED' || reqData.status === 'COMPLETED' || reqData.status === 'CANCELLED') {
          throw new Error('عذراً، هذا الطلب غير متاح لاستقبال عروض (تم قبوله أو اكتماله بالفعل).');
        }

        // Set the offer
        const offerRef = doc(db, 'driverOffers', offer.id);
        transaction.set(offerRef, offer);

        // Update request status to OFFERED if still OPEN
        if (reqData.status === 'OPEN') {
          transaction.update(reqRef, { status: 'OFFERED' });
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  /**
   * ATOMIC OFFER ACCEPTANCE
   * Guarantees that:
   * 1. The ride request is still OPEN or OFFERED (not already accepted by someone else).
   * 2. The chosen offer is marked ACCEPTED and request.acceptedOfferId is locked.
   * 3. Any competing offers for the same request are marked REJECTED in the same atomic transaction.
   */
  async acceptOfferAtomic(
    requestId: string,
    offerId: string,
    commissionRecord?: CommissionRecord
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, 'rideRequests', requestId);
        const offerRef = doc(db, 'driverOffers', offerId);

        const reqSnap = await transaction.get(reqRef);
        if (!reqSnap.exists()) {
          throw new Error('طلب المشوار غير موجود.');
        }

        const reqData = reqSnap.data() as RideRequest;
        if (reqData.status === 'ACCEPTED') {
          throw new Error('تم بالفعل قبول عرض وتثبيت هذه الرحلة سابقاً.');
        }

        const offerSnap = await transaction.get(offerRef);
        if (!offerSnap.exists()) {
          throw new Error('عرض السائق غير موجود.');
        }

        // Lock the request
        transaction.update(reqRef, {
          status: 'ACCEPTED',
          acceptedOfferId: offerId,
        });

        // Set accepted offer
        transaction.update(offerRef, {
          status: 'ACCEPTED',
        });

        // If commission is provided, write it
        if (commissionRecord) {
          const commRef = doc(db, 'commissions', commissionRecord.id);
          transaction.set(commRef, commissionRecord);
        }
      });

      // Update remaining offers to REJECTED
      const offersSnap = await getDocs(collection(db, 'driverOffers'));
      offersSnap.forEach(async (offerDoc) => {
        const data = offerDoc.data() as DriverOffer;
        if (data.requestId === requestId && data.id !== offerId && data.status === 'PENDING') {
          try {
            await updateDoc(doc(db, 'driverOffers', data.id), { status: 'REJECTED' });
          } catch {
            // Ignore sub-reject error
          }
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `rideRequests/${requestId}`);
    }
  }

  // --- Seat Booking Transaction ---

  async bookSeatsAtomic(
    tripId: string,
    seatsCount: number,
    booking: Booking,
    commissionRecord: CommissionRecord
  ): Promise<void> {
    try {
      await runTransaction(db, async (transaction) => {
        const tripRef = doc(db, 'publishedTrips', tripId);
        const tripSnap = await transaction.get(tripRef);

        if (!tripSnap.exists()) {
          throw new Error('الرحلة المطلوبة غير موجودة في قاعدة البيانات.');
        }

        const trip = tripSnap.data() as PublishedTrip;
        if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
          throw new Error('عذراً، هذه الرحلة ليست متاحة للحجز حالياً.');
        }

        const currentBooked = trip.bookedSeats || 0;
        const projectedBooked = currentBooked + seatsCount;

        if (projectedBooked > trip.totalSeats || seatsCount > trip.availableSeats) {
          throw new Error(
            `المقاعد المطلوبة (${seatsCount}) تتجاوز المقاعد المتاحة حالياً (${trip.availableSeats} مقعد).`
          );
        }

        const updatedBooked = Math.min(trip.totalSeats, projectedBooked);
        const updatedAvailable = Math.max(0, trip.totalSeats - updatedBooked);

        transaction.update(tripRef, {
          bookedSeats: updatedBooked,
          availableSeats: updatedAvailable,
        });

        const bookingRef = doc(db, 'bookings', booking.id);
        transaction.set(bookingRef, booking);

        const commRef = doc(db, 'commissions', commissionRecord.id);
        transaction.set(commRef, commissionRecord);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `publishedTrips/${tripId}`);
    }
  }

  // --- Trip & Driver Operations ---

  async publishTrip(trip: PublishedTrip): Promise<void> {
    try {
      await setDoc(doc(db, 'publishedTrips', trip.id), trip);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `publishedTrips/${trip.id}`);
    }
  }

  async updateTripStatus(tripId: string, status: PublishedTrip['status']): Promise<void> {
    try {
      await updateDoc(doc(db, 'publishedTrips', tripId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `publishedTrips/${tripId}`);
    }
  }

  async submitDriverProfile(driver: DriverProfile): Promise<void> {
    try {
      await setDoc(doc(db, 'drivers', driver.id), driver, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `drivers/${driver.id}`);
    }
  }

  async updateDriverVerification(
    driverId: string,
    status: DriverVerificationStatus,
    note?: string
  ): Promise<void> {
    try {
      const updateData: any = { verificationStatus: status };
      if (note) updateData.verificationNote = note;
      await updateDoc(doc(db, 'drivers', driverId), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `drivers/${driverId}`);
    }
  }

  // --- Parcel Operations ---

  async createParcel(parcel: Parcel, commissionRecord: CommissionRecord): Promise<void> {
    try {
      await setDoc(doc(db, 'parcels', parcel.id), parcel);
      await setDoc(doc(db, 'commissions', commissionRecord.id), commissionRecord);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `parcels/${parcel.id}`);
    }
  }

  async updateParcelStatus(
    parcelId: string,
    status: Parcel['status'],
    assignedDriverName?: string
  ): Promise<void> {
    try {
      const updateData: any = { status };
      if (assignedDriverName) updateData.assignedDriverName = assignedDriverName;
      await updateDoc(doc(db, 'parcels', parcelId), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `parcels/${parcelId}`);
    }
  }

  // --- User Profile & Complaints ---

  async syncUserProfile(user: User): Promise<void> {
    try {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    }
  }

  async submitComplaint(complaint: Complaint): Promise<void> {
    try {
      await setDoc(doc(db, 'complaints', complaint.id), complaint);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `complaints/${complaint.id}`);
    }
  }

  // --- Initial Seed to ensure immediate usability ---
  async seedInitialDataIfEmpty(
    initialTrips: PublishedTrip[],
    initialDrivers: DriverProfile[]
  ): Promise<void> {
    try {
      const tripsSnap = await getDocs(collection(db, 'publishedTrips'));
      if (tripsSnap.empty) {
        for (const trip of initialTrips) {
          await setDoc(doc(db, 'publishedTrips', trip.id), trip);
        }
      }

      const driversSnap = await getDocs(collection(db, 'drivers'));
      if (driversSnap.empty) {
        for (const driver of initialDrivers) {
          await setDoc(doc(db, 'drivers', driver.id), driver);
        }
      }
    } catch (error) {
      console.warn('Initial seeding skipped or already present in Firestore:', error);
    }
  }
}

export const firebaseMobility = new FirebaseMobilityService();
