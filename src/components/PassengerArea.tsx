import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User,
  RideRequest,
  DriverOffer,
  Booking,
  MutualTripRating,
  InAppNotification,
} from '../types';
import { mobilityStore } from '../store/mobilityStore';
import {
  PlusCircle,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Phone,
  Navigation,
  Route,
  ExternalLink,
  Loader2,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  MousePointerClick,
  Share2,
  History,
  Copy,
  Check,
  XCircle,
  Calendar,
  Star,
  ShieldCheck,
  Award,
  MessageSquarePlus,
  BellRing,
  Zap,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import {
  getNotificationIcon,
  getNotificationTypeLabel,
} from './InAppNotificationCenter';
import {
  RideLocationPickerMap,
  LocationPoint,
  PRESET_LOCATIONS,
  calculateDrivingEstimate,
  resolveLocationFromCoords,
} from './maps/RideLocationPickerMap';
import GoogleMapLoader from './GoogleMapLoader';
import { GoogleMapLiveRoute, RouteDetails, Coordinates } from './maps/GoogleMapLiveRoute';

interface PassengerAreaProps {
  currentUser: User;
  requests: RideRequest[];
  offers: DriverOffer[];
  bookings: Booking[];
  notifications?: InAppNotification[];
}

export const PassengerArea: React.FC<PassengerAreaProps> = ({
  currentUser,
  requests,
  offers,
  bookings,
  notifications = [],
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'NEW_REQUEST' | 'MY_REQUESTS' | 'MY_BOOKINGS' | 'TRIP_HISTORY' | 'NOTIFICATIONS'
  >('NEW_REQUEST');
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD' | 'DRIVER_UPDATES'>('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<
    'ALL' | 'COMPLETED' | 'CANCELLED' | 'PENDING'
  >('ALL');
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  // Interactive Map & Marker Selection State ('origin' or 'destination' depending on which field is focused)
  const [originPoint, setOriginPoint] = useState<LocationPoint>(PRESET_LOCATIONS.RG_ROUDA);
  const [destinationPoint, setDestinationPoint] = useState<LocationPoint>(PRESET_LOCATIONS.HURGHADA_DAHAR);
  const [focusedField, setFocusedField] = useState<'origin' | 'destination'>('origin');
  const mapSelectionMode = focusedField;
  const setMapSelectionMode = setFocusedField;

  // Refs for input focus and Google Map markers
  const originInputRef = useRef<HTMLInputElement | null>(null);
  const destinationInputRef = useRef<HTMLInputElement | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const originMarkerRef = useRef<google.maps.Marker | null>(null);
  const destinationMarkerRef = useRef<google.maps.Marker | null>(null);

  // Place or update a Google Map marker for 'origin' or 'destination'
  const placeOrUpdateMapMarker = useCallback(
    (field: 'origin' | 'destination', coords: Coordinates, labelTitle?: string) => {
      if (!mapInstance || typeof window === 'undefined' || !window.google?.maps?.Marker) {
        return;
      }

      const isOrigin = field === 'origin';
      const targetRef = isOrigin ? originMarkerRef : destinationMarkerRef;
      const markerTitle =
        labelTitle || (isOrigin ? 'نقطة الانطلاق (A)' : 'نقطة الوصول (B)');

      if (targetRef.current) {
        targetRef.current.setPosition(coords);
        targetRef.current.setTitle(markerTitle);
        targetRef.current.setMap(mapInstance);
      } else {
        targetRef.current = new window.google.maps.Marker({
          position: coords,
          map: mapInstance,
          title: markerTitle,
          icon: window.google.maps.SymbolPath
            ? {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 7,
                fillColor: isOrigin ? '#18B981' : '#DC2626',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
              }
            : undefined,
        });
      }
    },
    [mapInstance]
  );

  // Sync markers whenever mapInstance, originPoint, or destinationPoint changes
  useEffect(() => {
    if (!mapInstance) return;
    placeOrUpdateMapMarker(
      'origin',
      { lat: originPoint.lat, lng: originPoint.lng },
      originPoint.address
    );
    placeOrUpdateMapMarker(
      'destination',
      { lat: destinationPoint.lat, lng: destinationPoint.lng },
      destinationPoint.address
    );
  }, [mapInstance, originPoint, destinationPoint, placeOrUpdateMapMarker]);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null);
        originMarkerRef.current = null;
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
        destinationMarkerRef.current = null;
      }
    };
  }, []);

  // Handle map click: capture coordinates, place marker, and update 'origin' or 'destination' based on focusedField
  const handleMapClick = useCallback(
    (coords: Coordinates) => {
      const lat = Number(coords.lat.toFixed(5));
      const lng = Number(coords.lng.toFixed(5));

      if (focusedField === 'origin') {
        const resolved = resolveLocationFromCoords(lat, lng, originPoint.city || 'رأس غارب');
        placeOrUpdateMapMarker('origin', { lat, lng }, resolved.address);
        setOriginPoint(resolved);

        if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng }, region: 'EG' }, (results, status) => {
            if (status === 'OK' && results?.[0]?.formatted_address) {
              setOriginPoint((prev) =>
                Math.abs(prev.lat - lat) < 0.0001 && Math.abs(prev.lng - lng) < 0.0001
                  ? { ...prev, address: results[0].formatted_address }
                  : prev
              );
            }
          });
        }
      } else {
        const resolved = resolveLocationFromCoords(lat, lng, destinationPoint.city || 'الغردقة');
        placeOrUpdateMapMarker('destination', { lat, lng }, resolved.address);
        setDestinationPoint(resolved);

        if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng }, region: 'EG' }, (results, status) => {
            if (status === 'OK' && results?.[0]?.formatted_address) {
              setDestinationPoint((prev) =>
                Math.abs(prev.lat - lat) < 0.0001 && Math.abs(prev.lng - lng) < 0.0001
                  ? { ...prev, address: results[0].formatted_address }
                  : prev
              );
            }
          });
        }
      }
    },
    [focusedField, originPoint.city, destinationPoint.city, placeOrUpdateMapMarker]
  );

  // Attach click event listener directly to the Google Map instance in PassengerArea
  useEffect(() => {
    if (!mapInstance) return;

    const clickListener = mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      const clickedCoords: Coordinates = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng(),
      };
      handleMapClick(clickedCoords);
    });

    return () => {
      if (typeof window !== 'undefined' && window.google?.maps?.event) {
        window.google.maps.event.removeListener(clickListener);
      } else if (clickListener && typeof (clickListener as any).remove === 'function') {
        (clickListener as any).remove();
      }
    };
  }, [mapInstance, handleMapClick]);

  // DirectionsResult & Polyline State
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [routePolylinePath, setRoutePolylinePath] = useState<Coordinates[]>([
    { lat: PRESET_LOCATIONS.RG_ROUDA.lat, lng: PRESET_LOCATIONS.RG_ROUDA.lng },
    { lat: PRESET_LOCATIONS.HURGHADA_DAHAR.lat, lng: PRESET_LOCATIONS.HURGHADA_DAHAR.lng },
  ]);

  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(150);
  const [routeDurationMins, setRouteDurationMins] = useState<number>(100);
  const [routeDistanceText, setRouteDistanceText] = useState<string>('150 كم');
  const [routeDurationText, setRouteDurationText] = useState<string>('ساعة و40 دقيقة');
  const [routeSummary, setRouteSummary] = useState<string>('طريق الغردقة - رأس غارب السريع');
  const [routeSource, setRouteSource] = useState<string>('DIRECTIONS_SERVICE');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);

  const handleRouteCalculated = useCallback(
    (
      dist: number,
      dur: number,
      details?: RouteDetails
    ) => {
      setRouteDistanceKm(dist);
      setRouteDurationMins(dur);
      setRouteDistanceText(details?.distanceText || `${dist} كم`);
      setRouteDurationText(
        details?.durationText ||
          (dur >= 60
            ? `${Math.floor(dur / 60)} ساعة و ${dur % 60} دقيقة`
            : `${dur} دقيقة`)
      );
      if (details?.summary) {
        setRouteSummary(details.summary);
      }
      if (details?.source) {
        setRouteSource(details.source);
      }
      if (details?.directionsResult) {
        setDirectionsResult(details.directionsResult);
      }
      if (details?.polylinePath && details.polylinePath.length > 0) {
        setRoutePolylinePath(details.polylinePath);
      }
    },
    []
  );

  // Immediately invoke google.maps.DirectionsService when originPoint and destinationPoint are set on the map
  useEffect(() => {
    if (!originPoint?.lat || !originPoint?.lng || !destinationPoint?.lat || !destinationPoint?.lng) {
      return;
    }

    // Immediate baseline update while DirectionsService resolves
    const estimate = calculateDrivingEstimate(
      originPoint.lat,
      originPoint.lng,
      destinationPoint.lat,
      destinationPoint.lng
    );
    const defaultPolyline: Coordinates[] = [
      { lat: originPoint.lat, lng: originPoint.lng },
      {
        lat: Number(((originPoint.lat + destinationPoint.lat) / 2).toFixed(5)),
        lng: Number(((originPoint.lng + destinationPoint.lng) / 2).toFixed(5)),
      },
      { lat: destinationPoint.lat, lng: destinationPoint.lng },
    ];

    setRouteDistanceKm(estimate.distanceKm);
    setRouteDurationMins(estimate.durationMins);
    setRouteDistanceText(`${estimate.distanceKm} كم`);
    setRouteDurationText(
      estimate.durationMins >= 60
        ? `${Math.floor(estimate.durationMins / 60)} ساعة و ${estimate.durationMins % 60} دقيقة`
        : `${estimate.durationMins} دقيقة`
    );
    setRouteSummary(`${originPoint.city} ← ${destinationPoint.city}`);
    setRoutePolylinePath(defaultPolyline);

    // Call google.maps.DirectionsService to fetch DirectionsResult and Polyline path
    if (typeof window !== 'undefined' && window.google?.maps?.DirectionsService) {
      let isMounted = true;
      setIsCalculatingRoute(true);
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: { lat: originPoint.lat, lng: originPoint.lng },
          destination: { lat: destinationPoint.lat, lng: destinationPoint.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
          region: 'EG',
        },
        (result, status) => {
          if (!isMounted) return;
          setIsCalculatingRoute(false);

          if (status === 'OK' && result && result.routes?.[0]) {
            const primaryRoute = result.routes[0];
            const leg = primaryRoute.legs?.[0];
            const overviewPath = primaryRoute.overview_path || [];

            // Extract Polyline path coordinates from DirectionsResult
            const extractedPolyline: Coordinates[] =
              overviewPath.length > 0
                ? overviewPath.map((pt) => ({ lat: pt.lat(), lng: pt.lng() }))
                : defaultPolyline;

            setDirectionsResult(result);
            setRoutePolylinePath(extractedPolyline);

            if (leg) {
              const distMeters = leg.distance?.value || 0;
              const durSeconds = leg.duration?.value || 0;
              const distKm = Math.max(0.5, Math.round((distMeters / 1000) * 10) / 10);
              const durMins = Math.max(1, Math.round(durSeconds / 60));

              handleRouteCalculated(distKm, durMins, {
                distanceText: leg.distance?.text || `${distKm} كم`,
                durationText:
                  leg.duration?.text ||
                  (durMins >= 60
                    ? `${Math.floor(durMins / 60)} ساعة و ${durMins % 60} دقيقة`
                    : `${durMins} دقيقة`),
                summary:
                  primaryRoute.summary || `${originPoint.city} ← ${destinationPoint.city}`,
                source: 'DIRECTIONS_SERVICE',
                directionsResult: result,
                polylinePath: extractedPolyline,
              });
            }
          }
        }
      );

      return () => {
        isMounted = false;
      };
    }
  }, [originPoint, destinationPoint, handleRouteCalculated]);

  // Form State
  const [serviceType, setServiceType] = useState<'INTERCITY' | 'CITY'>('INTERCITY');
  const [scheduledTime, setScheduledTime] = useState('2026-10-22T09:00');
  const [passengerCount, setPassengerCount] = useState(1);
  const [suggestedFare, setSuggestedFare] = useState<number | ''>(200);
  const [notes, setNotes] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedMapReqId, setExpandedMapReqId] = useState<string | null>(null);

  // Filter requests & bookings for current user
  const myRequests = requests.filter((r) => r.passengerId === currentUser.id);
  const myBookings = bookings.filter((b) => b.passengerId === currentUser.id);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const res = mobilityStore.createRideRequest({
      serviceType,
      originCity: originPoint.city,
      originAddress: originPoint.address,
      destinationCity: destinationPoint.city,
      destinationAddress: destinationPoint.address,
      scheduledTime,
      passengerCount,
      suggestedFare: suggestedFare ? Number(suggestedFare) : undefined,
      notes,
      originLat: originPoint.lat,
      originLng: originPoint.lng,
      destLat: destinationPoint.lat,
      destLng: destinationPoint.lng,
      routeDistanceKm,
      routeDurationMins,
    });

    if (res.success) {
      setAlert({ type: 'success', text: res.message });
      setActiveSubTab('MY_REQUESTS');
      setNotes('');
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handleAcceptOffer = (offerId: string) => {
    const res = mobilityStore.acceptOffer(offerId);
    if (res.success) {
      setAlert({ type: 'success', text: res.message });
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  // Post-Trip Mutual Rating & Review Modal State (Passenger <-> Driver)
  const DRIVER_FEEDBACK_TAGS = [
    'التزام بالموعد',
    'قيادة آمنة وهادئة',
    'سيارة نظيفة ومكيفة',
    'أمانة واحترام',
    'سعر عادل',
    'معرفة ممتازة بالطرق',
  ];

  const PASSENGER_FEEDBACK_TAGS = [
    'جاهز في الموعد',
    'تعامل راقٍ ومحترم',
    'التزام بالأجرة المتفق عليها',
    'الحفاظ على نظافة المركبة',
    'تواصل واضح وسريع',
  ];

  const STAR_LABELS: Record<number, string> = {
    1: 'ضعيف (١/٥)',
    2: 'مقبول (٢/٥)',
    3: 'جيد (٣/٥)',
    4: 'جيد جداً (٤/٥)',
    5: 'ممتاز وموثوق (٥/٥)',
  };

  const [ratingModalTarget, setRatingModalTarget] = useState<{
    itemType: 'REQUEST' | 'BOOKING';
    itemId: string;
    routeTitle: string;
    driverName: string;
    passengerName: string;
    existingRating?: MutualTripRating;
  } | null>(null);

  const [driverStars, setDriverStars] = useState<number>(5);
  const [hoverDriverStars, setHoverDriverStars] = useState<number>(0);
  const [driverComment, setDriverComment] = useState<string>('');
  const [driverTags, setDriverTags] = useState<string[]>(['التزام بالموعد', 'قيادة آمنة وهادئة']);

  const [passengerStars, setPassengerStars] = useState<number>(5);
  const [hoverPassengerStars, setHoverPassengerStars] = useState<number>(0);
  const [passengerComment, setPassengerComment] = useState<string>('');
  const [passengerTags, setPassengerTags] = useState<string[]>(['جاهز في الموعد', 'تعامل راقٍ ومحترم']);

  const openRatingModal = (target: {
    itemType: 'REQUEST' | 'BOOKING';
    itemId: string;
    routeTitle: string;
    driverName: string;
    passengerName: string;
    existingRating?: MutualTripRating;
  }) => {
    setRatingModalTarget(target);
    setDriverStars(target.existingRating?.driverStars || 5);
    setHoverDriverStars(0);
    setDriverComment(target.existingRating?.driverComment || '');
    setDriverTags(
      target.existingRating?.driverTags && target.existingRating.driverTags.length > 0
        ? target.existingRating.driverTags
        : ['التزام بالموعد', 'قيادة آمنة وهادئة']
    );

    setPassengerStars(target.existingRating?.passengerStars || 5);
    setHoverPassengerStars(0);
    setPassengerComment(
      target.existingRating?.passengerComment ||
        'راكب ملتزم بالموعد المحدد ومتعاون، تجربة سفر ممتازة.'
    );
    setPassengerTags(
      target.existingRating?.passengerTags && target.existingRating.passengerTags.length > 0
        ? target.existingRating.passengerTags
        : ['جاهز في الموعد', 'تعامل راقٍ ومحترم']
    );
  };

  const toggleDriverTag = (tag: string) => {
    setDriverTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const togglePassengerTag = (tag: string) => {
    setPassengerTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitMutualRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingModalTarget) return;

    const res = mobilityStore.submitTripRating({
      itemType: ratingModalTarget.itemType,
      itemId: ratingModalTarget.itemId,
      driverStars,
      driverComment:
        driverComment.trim() ||
        'رحلة موفقة وسائق محترم وملتزم بالموعد ومعايير السلامة.',
      driverTags,
      passengerStars,
      passengerComment:
        passengerComment.trim() ||
        'راكب ملتزم بالموعد المحدد وتعامل راقٍ ومحترم.',
      passengerTags,
      driverName: ratingModalTarget.driverName,
    });

    if (res.success) {
      setAlert({ type: 'success', text: res.message });
      setRatingModalTarget(null);
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handleCancelBooking = (bookingId: string) => {
    const res = mobilityStore.cancelBooking(bookingId);
    if (res.success) {
      setAlert({ type: 'success', text: res.message });
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handleCompleteBooking = (booking: Booking) => {
    const res = mobilityStore.completeBooking(booking.id);
    if (res.success) {
      setAlert({ type: 'success', text: res.message });
      openRatingModal({
        itemType: 'BOOKING',
        itemId: booking.id,
        routeTitle: booking.tripSummary,
        driverName: 'الكابتن محمد عبد الرحيم',
        passengerName: currentUser.fullName,
        existingRating: booking.rating,
      });
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handleCompleteRequest = (requestId: string) => {
    const targetReq = requests.find((r) => r.id === requestId);
    const res = mobilityStore.completeRideRequest(requestId);
    if (res.success) {
      setAlert({ type: 'success', text: res.message });
      if (targetReq) {
        const acceptedOffer = offers.find(
          (o) => o.requestId === targetReq.id && o.status === 'ACCEPTED'
        );
        openRatingModal({
          itemType: 'REQUEST',
          itemId: targetReq.id,
          routeTitle: `${targetReq.originCity} (${targetReq.originAddress}) ← ${targetReq.destinationCity} (${targetReq.destinationAddress})`,
          driverName: acceptedOffer?.driverName || 'الكابتن محمد عبد الرحيم',
          passengerName: currentUser.fullName,
          existingRating: targetReq.rating,
        });
      }
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  const handleCancelRequest = (requestId: string) => {
    const res = mobilityStore.cancelRideRequest(requestId);
    if (res.success) {
      setAlert({ type: 'success', text: res.message });
    } else {
      setAlert({ type: 'error', text: res.message });
    }
  };

  // Build formatted Arabic trip share message for WhatsApp & messaging apps
  const formatTripShareMessage = (params: {
    title?: string;
    origin: string;
    destination: string;
    dateText: string;
    passengers?: number;
    distanceText?: string;
    durationText?: string;
    fareText?: string;
    statusText?: string;
    originLat?: number;
    originLng?: number;
    destLat?: number;
    destLng?: number;
  }): string => {
    const lines = [
      `🚗 *${params.title || 'تفاصيل رحلة — منصة رأس غارب موبيليتي'}*`,
      `📍 *نقطة الانطلاق:* ${params.origin}`,
      `🏁 *الوجهة:* ${params.destination}`,
      `📅 *التاريخ والموعد:* ${params.dateText}`,
    ];
    if (params.passengers) {
      lines.push(`👥 *عدد الركاب:* ${params.passengers} ${params.passengers === 1 ? 'راكب' : 'ركاب'}`);
    }
    if (params.distanceText || params.durationText) {
      lines.push(
        `🛣️ *المسافة والمدة:* ${params.distanceText || '---'} (${params.durationText || '---'})`
      );
    }
    if (params.fareText) {
      lines.push(`💰 *التكلفة / السعر:* ${params.fareText}`);
    }
    if (params.statusText) {
      lines.push(`📌 *حالة الطلب:* ${params.statusText}`);
    }
    if (params.originLat && params.originLng && params.destLat && params.destLng) {
      lines.push(
        `🗺️ *مسار الرحلة على خرائط Google:*\nhttps://www.google.com/maps/dir/?api=1&origin=${params.originLat},${params.originLng}&destination=${params.destLat},${params.destLng}&travelmode=driving`
      );
    }
    return lines.join('\n');
  };

  // Share message via native Web Share API or copy to clipboard with feedback
  const handleNativeOrCopyShare = async (shareId: string, shareText: string) => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'مشاركة تفاصيل الرحلة — رأس غارب موبيليتي',
          text: shareText,
        });
        return;
      } catch {
        // Fallback to clipboard copy if user dismisses native share sheet
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedShareId(shareId);
        setAlert({
          type: 'success',
          text: 'تم نسخ تفاصيل الرحلة بالكامل! يمكنك الآن لصقها ومشاركتها في واتساب أو أي تطبيق مراسلة.',
        });
        setTimeout(() => {
          setCopiedShareId((curr) => (curr === shareId ? null : curr));
        }, 2500);
      } catch {
        // Ignore clipboard errors
      }
    }
  };

  // Current selected trip share message (for NEW_REQUEST form)
  const currentSelectedTripShareText = formatTripShareMessage({
    title: 'مشاركة مسار وتفاصيل الرحلة المحددة — رأس غارب موبيليتي',
    origin: `${originPoint.city} (${originPoint.address})`,
    destination: `${destinationPoint.city} (${destinationPoint.address})`,
    dateText: scheduledTime ? new Date(scheduledTime).toLocaleString('ar-EG') : 'حالي',
    passengers: passengerCount,
    distanceText: `${routeDistanceKm} كم`,
    durationText: routeDurationText,
    fareText: suggestedFare ? `${suggestedFare} ج.م` : undefined,
    originLat: originPoint.lat,
    originLng: originPoint.lng,
    destLat: destinationPoint.lat,
    destLng: destinationPoint.lng,
  });

  const currentTripWhatsAppUrl = `https://wa.me/?text=${encodeURIComponent(
    currentSelectedTripShareText
  )}`;

  // Unified Trip History List (combining user's requests and bookings with normalized statuses: COMPLETED, CANCELLED, PENDING)
  const unifiedTripHistory = [
    ...myRequests.map((req) => {
      const normalizedStatus: 'COMPLETED' | 'CANCELLED' | 'PENDING' =
        req.status === 'COMPLETED'
          ? 'COMPLETED'
          : req.status === 'CANCELLED'
          ? 'CANCELLED'
          : 'PENDING';

      const statusLabel =
        normalizedStatus === 'COMPLETED'
          ? 'مكتملة'
          : normalizedStatus === 'CANCELLED'
          ? 'ملغاة'
          : 'قيد الانتظار';

      const acceptedOffer = offers.find(
        (o) => o.requestId === req.id && o.status === 'ACCEPTED'
      );

      return {
        id: req.id,
        itemType: 'REQUEST' as const,
        origin: `${req.originCity} — ${req.originAddress}`,
        destination: `${req.destinationCity} — ${req.destinationAddress}`,
        destinationCity: req.destinationCity,
        serviceLabel: req.serviceType === 'CITY' ? 'مشوار محلي بالمدينة' : 'سفر بين المدن',
        dateIso: req.scheduledTime || req.createdAt,
        createdAtIso: req.createdAt,
        passengers: req.passengerCount,
        fare: acceptedOffer?.proposedFare ?? req.suggestedFare,
        distanceKm: req.routeDistanceKm,
        durationMins: req.routeDurationMins,
        normalizedStatus,
        statusLabel,
        rawStatus: req.status,
        driverName: acceptedOffer?.driverName || 'الكابتن محمد عبد الرحيم',
        driverPhone: acceptedOffer?.driverPhone || '01123456789',
        notes: req.notes,
        originLat: req.originLat,
        originLng: req.originLng,
        destLat: req.destLat,
        destLng: req.destLng,
        rating: req.rating,
      };
    }),
    ...myBookings.map((b) => {
      const normalizedStatus: 'COMPLETED' | 'CANCELLED' | 'PENDING' =
        b.status === 'COMPLETED'
          ? 'COMPLETED'
          : b.status === 'CANCELLED'
          ? 'CANCELLED'
          : 'PENDING';

      const statusLabel =
        normalizedStatus === 'COMPLETED'
          ? 'مكتملة'
          : normalizedStatus === 'CANCELLED'
          ? 'ملغاة'
          : 'قيد الانتظار';

      const parts = b.tripSummary.split('⇄');
      const originText = parts[0]?.trim() || 'رأس غارب';
      const destText = parts[1]?.trim() || b.tripSummary;

      return {
        id: b.id,
        itemType: 'BOOKING' as const,
        origin: originText,
        destination: destText,
        destinationCity: destText.split('(')[0]?.trim() || destText,
        serviceLabel: 'حجز مقعد في رحلة مجدولة',
        dateIso: b.createdAt,
        createdAtIso: b.createdAt,
        passengers: b.seatsBooked,
        fare: b.totalFare,
        distanceKm: undefined,
        durationMins: undefined,
        normalizedStatus,
        statusLabel,
        rawStatus: b.status,
        driverName: 'الكابتن محمد عبد الرحيم',
        driverPhone: '01123456789',
        notes: undefined,
        originLat: undefined,
        originLng: undefined,
        destLat: undefined,
        destLng: undefined,
        rating: b.rating,
      };
    }),
  ].sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());

  const filteredTripHistory = unifiedTripHistory.filter((item) =>
    historyStatusFilter === 'ALL' ? true : item.normalizedStatus === historyStatusFilter
  );

  const completedCount = unifiedTripHistory.filter(
    (i) => i.normalizedStatus === 'COMPLETED'
  ).length;
  const cancelledCount = unifiedTripHistory.filter(
    (i) => i.normalizedStatus === 'CANCELLED'
  ).length;
  const pendingCount = unifiedTripHistory.filter(
    (i) => i.normalizedStatus === 'PENDING'
  ).length;

  const ratedTrips = unifiedTripHistory.filter(
    (i) => i.normalizedStatus === 'COMPLETED' && (i.rating?.driverStars || i.rating?.passengerStars)
  );
  const unratedCompletedTrip = unifiedTripHistory.find(
    (i) => i.normalizedStatus === 'COMPLETED' && !i.rating?.driverStars
  );

  const avgDriverRatingGiven =
    ratedTrips.length > 0
      ? (
          ratedTrips.reduce((acc, item) => acc + (item.rating?.driverStars || 5), 0) /
          ratedTrips.length
        ).toFixed(1)
      : '5.0';

  const passengerTrustScore = (currentUser.rating || 4.9).toFixed(1);

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const latestUnreadNotif = unreadNotifications[0] || null;
  const filteredPassengerNotifications = notifications.filter((n) => {
    if (notifFilter === 'UNREAD') return !n.isRead;
    if (notifFilter === 'DRIVER_UPDATES') {
      return (
        n.type === 'DRIVER_OFFER_RECEIVED' ||
        n.type === 'OFFER_ACCEPTED' ||
        n.type === 'TRIP_STATUS_UPDATED'
      );
    }
    return true;
  });

  // Helper to render interactive or static stars
  const renderStarRow = (count: number, sizeClass = 'w-3.5 h-3.5') => (
    <div className="inline-flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= count
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-300 fill-slate-100'
          }`}
        />
      ))}
    </div>
  );

  // Extract active leg from DirectionsResult if present
  const activeDirectionsLeg = directionsResult?.routes?.[0]?.legs?.[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0B1F3A]">
            بوابة الركاب — إدارة الطلبات والحجوزات والإشعارات الفورية
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            أهلاً بك يا <strong>{currentUser.fullName}</strong>. حدد نقطة الانطلاق والوصول من الخريطة، استقبل تنبيهات فورية عند قبول السائقين لرحلتك، وتابع سجل رحلاتك وتقييماتك.
          </p>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => setActiveSubTab('NEW_REQUEST')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'NEW_REQUEST'
                ? 'bg-[#146EF5] text-white shadow-sm'
                : 'text-[#146EF5] hover:bg-[#146EF5]/10'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>طلب رحلة وتحديد الخريطة</span>
          </button>
          <button
            onClick={() => setActiveSubTab('MY_REQUESTS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'MY_REQUESTS'
                ? 'bg-[#0B1F3A] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            طلباتي وعروض الأسعار ({myRequests.length})
          </button>
          <button
            onClick={() => setActiveSubTab('MY_BOOKINGS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'MY_BOOKINGS'
                ? 'bg-[#0B1F3A] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            حجوزاتي المؤكدة ({myBookings.length})
          </button>
          <button
            onClick={() => setActiveSubTab('TRIP_HISTORY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'TRIP_HISTORY'
                ? 'bg-[#0B1F3A] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#18B981]" />
            <span>رحلاتي السابقة ({unifiedTripHistory.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('NOTIFICATIONS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeSubTab === 'NOTIFICATIONS'
                ? 'bg-[#0B1F3A] text-white shadow-sm'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-[#146EF5]" />
            <span>الإشعارات الفورية ({notifications.length})</span>
            {unreadNotifications.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-black font-mono tabular-nums bg-[#DC2626] text-white rounded">
                {unreadNotifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* شريط الإشعارات الفورية وتنبيهات قبول السائقين داخل التطبيق (In-App Live Alert Strip) */}
      <div className="mb-6 bg-white rounded-2xl border border-blue-200/90 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#146EF5] shrink-0">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-[#146EF5]">
                نظام الإشعارات الفورية (In-App Notifications)
              </span>
              {unreadNotifications.length > 0 && (
                <span className="text-xs font-bold text-[#DC2626]">
                  · لديك {unreadNotifications.length} تنبيهات جديدة غير مقروءة
                </span>
              )}
            </div>
            {latestUnreadNotif ? (
              <p className="text-xs sm:text-sm font-bold text-[#0B1F3A] mt-0.5 leading-relaxed">
                {latestUnreadNotif.title}:{' '}
                <span className="font-normal text-[#6B7280]">
                  {latestUnreadNotif.message}
                </span>
              </p>
            ) : (
              <p className="text-xs text-[#6B7280] mt-0.5">
                جميع إشعاراتك مقروءة — ستصلك تنبيهات لحظية هنا فور قبول أي سائق لرحلتك أو تحديث حالة طلبك.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {latestUnreadNotif && (
            <button
              type="button"
              onClick={() => {
                mobilityStore.markNotificationAsRead(latestUnreadNotif.id);
                setActiveSubTab('MY_REQUESTS');
              }}
              className="px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              معاينة الطلب وتأكيد القراءة
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              mobilityStore.simulateInstantDriverNotification();
            }}
            className="px-3 py-1.5 bg-[#18B981] hover:bg-[#18B981]/90 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="محاكاة وصول إشعار فوري بقبول سائق لرحلتك"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>محاكاة إشعار قبول سائق فوري</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('NOTIFICATIONS')}
            className="px-3 py-1.5 bg-[#F7F9FC] hover:bg-slate-100 text-[#0B1F3A] border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            سجل الإشعارات ({notifications.length})
          </button>
        </div>
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

      {/* مؤشر الثقة والمسؤولية المتبادلة للركاب والسائقين (Mutual Trust & Rating Accountability Strip) */}
      <div className="mb-6 bg-gradient-to-r from-[#0B1F3A] via-[#102A4C] to-[#0B1F3A] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  نظام التقييم المتبادل والثقة المجتمعية (للركاب والسائقين)
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#18B981]/20 text-[#18B981] border border-[#18B981]/30">
                  <Award className="w-3 h-3" />
                  <span>راكب موثوق ومعتمد</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                بعد انتهاء كل رحلة، يقيّم الراكب السائق والمركبة، ويقيّم السائق التزام الراكب بالنجوم والتعليقات لضمان أعلى معايير الأمان والاحترام المتبادل في رأس غارب.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0">
            {/* Passenger Trust Rating from Drivers */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3.5 py-2.5 border border-white/10">
              <span className="text-[11px] text-slate-300 block">تقييمك لدى السائقين</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-lg font-black text-amber-400 font-mono tabular-nums">
                  {passengerTrustScore}
                </span>
                {renderStarRow(Math.round(Number(passengerTrustScore)), 'w-3 h-3')}
              </div>
              <span className="text-[10px] text-emerald-300 block mt-0.5">
                من {currentUser.totalRatingsCount || 12} رحلة مقيّمة
              </span>
            </div>

            {/* Average Rating Given to Drivers */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl px-3.5 py-2.5 border border-white/10">
              <span className="text-[11px] text-slate-300 block">متوسط تقييمك للسائقين</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-lg font-black text-white font-mono tabular-nums">
                  {avgDriverRatingGiven}
                </span>
                {renderStarRow(Math.round(Number(avgDriverRatingGiven)), 'w-3 h-3')}
              </div>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                {ratedTrips.length} تقييمات مسجلة
              </span>
            </div>

            {/* Quick CTA to rate completed trip or view ratings */}
            <div className="col-span-2 sm:col-span-1 flex items-center">
              {unratedCompletedTrip ? (
                <button
                  type="button"
                  onClick={() =>
                    openRatingModal({
                      itemType: unratedCompletedTrip.itemType,
                      itemId: unratedCompletedTrip.id,
                      routeTitle: `${unratedCompletedTrip.origin} ← ${unratedCompletedTrip.destination}`,
                      driverName: unratedCompletedTrip.driverName || 'الكابتن محمد عبد الرحيم',
                      passengerName: currentUser.fullName,
                      existingRating: unratedCompletedTrip.rating,
                    })
                  }
                  className="w-full h-full px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#0B1F3A] font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-[#0B1F3A]" />
                  <span>قيّم رحلتك المكتملة الآن</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab('TRIP_HISTORY');
                    setHistoryStatusFilter('COMPLETED');
                  }}
                  className="w-full h-full px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer"
                >
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>سجل التقييمات ({ratedTrips.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab 1: Create New Request Form with Interactive Map Pin Selection & DirectionsService Polyline */}
      {activeSubTab === 'NEW_REQUEST' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-[#0B1F3A]">
                طلب رحلة خاصة — الاختيار التفاعلي من الخريطة وحساب المسار
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
                اضغط مباشرة على الخريطة لوضع دبوس الانطلاق (أخضر A) ودبوس الوصول (أحمر B)؛ يتم استدعاء خدمة التوجيه ورسم المسار (Polyline) وحساب المسافة بالكيلومترات والمدة المتوقعة تلقائياً.
              </p>
            </div>

            {/* زر مشاركة الرحلة المحددة عبر واتساب وتطبيقات المراسلة */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href={currentTripWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="مشاركة تفاصيل الرحلة المحددة عبر واتساب"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#18B981] hover:bg-[#18B981]/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>مشاركة الرحلة (واتساب)</span>
              </a>
              <button
                type="button"
                onClick={() =>
                  handleNativeOrCopyShare('selected-trip', currentSelectedTripShareText)
                }
                title="مشاركة أو نسخ تفاصيل الرحلة لتطبيقات المراسلة"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {copiedShareId === 'selected-trip' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#18B981]" />
                    <span>تم نسخ التفاصيل</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-[#146EF5]" />
                    <span>مشاركة الرحلة</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateRequest} className="space-y-5">
            {/* Interactive Marker Cards: Distinct Pin A (Origin) & Pin B (Destination) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Origin Marker Card (Pin A - Green) */}
              <div
                onClick={() => {
                  setFocusedField('origin');
                  originInputRef.current?.focus();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  focusedField === 'origin'
                    ? 'bg-emerald-50/60 border-[#18B981] ring-2 ring-[#18B981]/20'
                    : 'bg-[#F7F9FC] border-slate-200 hover:border-[#18B981]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#18B981] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                      A
                    </span>
                    <span className="text-xs font-extrabold text-[#0B1F3A]">
                      دبوس نقطة الانطلاق (الركوب)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusedField('origin');
                      originInputRef.current?.focus();
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      focusedField === 'origin'
                        ? 'bg-[#18B981] text-white'
                        : 'bg-white text-[#18B981] border border-[#18B981]/40 hover:bg-emerald-50'
                    }`}
                  >
                    <MousePointerClick className="w-3 h-3" />
                    <span>{focusedField === 'origin' ? 'نشط على الخريطة' : 'تحديد من الخريطة'}</span>
                  </button>
                </div>
                <div className="text-xs font-bold text-[#111827] truncate">
                  {originPoint.city} — {originPoint.address}
                </div>
                <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-1" dir="ltr">
                  Lat: {originPoint.lat.toFixed(4)}, Lng: {originPoint.lng.toFixed(4)}
                </div>
              </div>

              {/* Destination Marker Card (Pin B - Red) */}
              <div
                onClick={() => {
                  setFocusedField('destination');
                  destinationInputRef.current?.focus();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  focusedField === 'destination'
                    ? 'bg-rose-50/60 border-[#DC2626] ring-2 ring-[#DC2626]/20'
                    : 'bg-[#F7F9FC] border-slate-200 hover:border-[#DC2626]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-xs font-black shadow-2xs">
                      B
                    </span>
                    <span className="text-xs font-extrabold text-[#0B1F3A]">
                      دبوس نقطة الوصول (الوجهة)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusedField('destination');
                      destinationInputRef.current?.focus();
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      focusedField === 'destination'
                        ? 'bg-[#DC2626] text-white'
                        : 'bg-white text-[#DC2626] border border-[#DC2626]/40 hover:bg-rose-50'
                    }`}
                  >
                    <MousePointerClick className="w-3 h-3" />
                    <span>{focusedField === 'destination' ? 'نشط على الخريطة' : 'تحديد من الخريطة'}</span>
                  </button>
                </div>
                <div className="text-xs font-bold text-[#111827] truncate">
                  {destinationPoint.city} — {destinationPoint.address}
                </div>
                <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-1" dir="ltr">
                  Lat: {destinationPoint.lat.toFixed(4)}, Lng: {destinationPoint.lng.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Interactive Google Maps & Coordinate Pin Picker Container */}
            <div className="bg-[#F7F9FC] p-4 rounded-xl border border-slate-200">
              <GoogleMapLoader
                renderLoading={() => (
                  <div className="min-h-[280px] bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center space-y-3.5 shadow-xs">
                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#146EF5]">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                    <div className="max-w-xs">
                      <h4 className="font-bold text-xs sm:text-sm text-[#0B1F3A]">
                        جاري تحميل خرائط Google التفاعلية...
                      </h4>
                      <p className="text-[11px] text-[#6B7280] mt-1.5 leading-relaxed">
                        يتم تهيئة الخريطة التفاعلية وعرض دبابيس الانطلاق (A) والوصول (B) ومسار القيادة (Polyline).
                      </p>
                    </div>
                  </div>
                )}
                renderMissingKey={() => (
                  <RideLocationPickerMap
                    originPoint={originPoint}
                    destinationPoint={destinationPoint}
                    directionsResult={directionsResult}
                    routePolylinePath={routePolylinePath}
                    selectionMode={focusedField}
                    onSelectionModeChange={setFocusedField}
                    onMapReady={setMapInstance}
                    onMapClick={handleMapClick}
                    onChangeOrigin={(pt) => setOriginPoint(pt)}
                    onChangeDestination={(pt) => setDestinationPoint(pt)}
                    onRouteCalculated={handleRouteCalculated}
                  />
                )}
                renderError={(err, retry) => (
                  <div className="p-5 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-red-900">تعذر تحميل خرائط Google</h4>
                      <p className="text-xs text-red-700 mt-1 max-w-sm mx-auto font-mono text-left" dir="ltr">
                        {err}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={retry}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                )}
              >
                {() => (
                  <RideLocationPickerMap
                    originPoint={originPoint}
                    destinationPoint={destinationPoint}
                    directionsResult={directionsResult}
                    routePolylinePath={routePolylinePath}
                    selectionMode={focusedField}
                    onSelectionModeChange={setFocusedField}
                    onMapReady={setMapInstance}
                    onMapClick={handleMapClick}
                    onChangeOrigin={(pt) => setOriginPoint(pt)}
                    onChangeDestination={(pt) => setDestinationPoint(pt)}
                    onRouteCalculated={handleRouteCalculated}
                  />
                )}
              </GoogleMapLoader>
            </div>

            {/* Dedicated Google DirectionsResult Estimated Distance (km) & Travel Duration Card */}
            <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border border-blue-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-blue-200/70 mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#146EF5] text-white flex items-center justify-center shadow-xs">
                    <Route className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#0B1F3A]">
                      نتائج مسار الرحلة (Google DirectionsService & Polyline):
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      يُحسب تلقائياً من نتائج DirectionsResult فور تحديد نقطتي الانطلاق والوصول على الخريطة
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#146EF5]">
                    {isCalculatingRoute ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#146EF5] animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 text-[#146EF5]" />
                    )}
                    <span>
                      {isCalculatingRoute
                        ? 'جاري حساب المسار...'
                        : routeSource === 'DIRECTIONS_SERVICE'
                        ? `DirectionsResult (${routePolylinePath.length} نقطة Polyline)`
                        : 'مسار قيادة نشط'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Prominent Distance in Kilometers and Expected Duration Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Distance in Kilometers Card */}
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#18B981] shrink-0">
                    <Route className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      المسافة بالكيلومترات (Distance)
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black text-[#0B1F3A] font-mono tabular-nums">
                        {routeDistanceKm} كم
                      </span>
                      {routeDistanceText && routeDistanceText !== `${routeDistanceKm} كم` && (
                        <span className="text-xs text-slate-500 font-mono">
                          ({routeDistanceText})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expected Duration Card */}
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-2xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#146EF5] shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      المدة المتوقعة للرحلة (Expected Duration)
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black text-[#146EF5] font-mono tabular-nums">
                        {routeDurationText ||
                          (routeDurationMins >= 60
                            ? `${Math.floor(routeDurationMins / 60)} ساعة و ${
                                routeDurationMins % 60
                              } دقيقة`
                            : `${routeDurationMins} دقيقة`)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono tabular-nums">
                        ({routeDurationMins} دقيقة)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Waypoints & DirectionsResult Summary */}
              <div className="mt-3 pt-2.5 border-t border-blue-100/70 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-4 h-4 rounded-full bg-[#18B981] text-white flex items-center justify-center text-[9px] font-black shrink-0">
                    A
                  </span>
                  <span className="font-semibold text-slate-700">الانطلاق:</span>
                  <span className="text-[#0B1F3A] font-medium truncate max-w-[200px]">
                    {activeDirectionsLeg?.start_address || originPoint.address}
                  </span>
                  <span className="text-slate-300">←</span>
                  <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[9px] font-black shrink-0">
                    B
                  </span>
                  <span className="font-semibold text-slate-700">الوصول:</span>
                  <span className="text-[#0B1F3A] font-medium truncate max-w-[200px]">
                    {activeDirectionsLeg?.end_address || destinationPoint.address}
                  </span>
                </div>

                {routeSummary && (
                  <span className="text-[11px] font-medium text-slate-500">
                    عبر المسار: {routeSummary}
                  </span>
                )}
              </div>
            </div>

            {/* Text Inputs Paired with Direct Map Pin Triggers & Focus State Tracking */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="origin-input"
                    className="text-xs font-semibold text-[#111827] flex items-center gap-1.5"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#18B981] text-white flex items-center justify-center text-[10px] font-black">
                      A
                    </span>
                    <span>عنوان نقطة الانطلاق (ركز الحقل ثم اضغط على الخريطة)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusedField('origin');
                      originInputRef.current?.focus();
                    }}
                    className="text-[11px] font-bold text-[#18B981] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{focusedField === 'origin' ? 'الحقل نشط (A)' : 'تحديد الدبوس A'}</span>
                  </button>
                </div>
                <input
                  id="origin-input"
                  ref={originInputRef}
                  name="origin"
                  type="text"
                  value={originPoint.address}
                  onFocus={() => setFocusedField('origin')}
                  onChange={(e) =>
                    setOriginPoint((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="مثال: رأس غارب - مساكن الـ 128 أو اضغط على الخريطة"
                  required
                  className={`w-full px-3 py-2 bg-[#F7F9FC] border rounded-lg text-xs transition-all outline-none ${
                    focusedField === 'origin'
                      ? 'border-[#18B981] ring-2 ring-[#18B981]/25 bg-emerald-50/20'
                      : 'border-slate-300'
                  }`}
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono" dir="ltr">
                  <span>
                    Origin: {originPoint.lat.toFixed(4)}, {originPoint.lng.toFixed(4)}
                  </span>
                  {focusedField === 'origin' && (
                    <span className="text-[#18B981] font-bold" dir="rtl">
                      ● جاهز للالتقاط من الخريطة
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="destination-input"
                    className="text-xs font-semibold text-[#111827] flex items-center gap-1.5"
                  >
                    <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[10px] font-black">
                      B
                    </span>
                    <span>عنوان نقطة الوصول (ركز الحقل ثم اضغط على الخريطة)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusedField('destination');
                      destinationInputRef.current?.focus();
                    }}
                    className="text-[11px] font-bold text-[#DC2626] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>{focusedField === 'destination' ? 'الحقل نشط (B)' : 'تحديد الدبوس B'}</span>
                  </button>
                </div>
                <input
                  id="destination-input"
                  ref={destinationInputRef}
                  name="destination"
                  type="text"
                  value={destinationPoint.address}
                  onFocus={() => setFocusedField('destination')}
                  onChange={(e) =>
                    setDestinationPoint((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="مثال: الغردقة - موقف الدهار العام أو اضغط على الخريطة"
                  required
                  className={`w-full px-3 py-2 bg-[#F7F9FC] border rounded-lg text-xs transition-all outline-none ${
                    focusedField === 'destination'
                      ? 'border-[#DC2626] ring-2 ring-[#DC2626]/25 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono" dir="ltr">
                  <span>
                    Destination: {destinationPoint.lat.toFixed(4)}, {destinationPoint.lng.toFixed(4)}
                  </span>
                  {focusedField === 'destination' && (
                    <span className="text-[#DC2626] font-bold" dir="rtl">
                      ● جاهز للالتقاط من الخريطة
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  نوع الخدمة
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as 'CITY' | 'INTERCITY')}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs font-medium"
                >
                  <option value="INTERCITY">سفر بين المدن (محافظات)</option>
                  <option value="CITY">مشوار محلي داخل رأس غارب</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  عدد الركاب
                </label>
                <select
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs font-medium"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 14].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'راكب' : 'ركاب'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  الموعد المطلوب للانطلاق
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1">
                  السعر المقترح من قبلك (اختياري - بالجنيه)
                </label>
                <input
                  type="number"
                  value={suggestedFare}
                  onChange={(e) => setSuggestedFare(e.target.value ? Number(e.target.value) : '')}
                  placeholder="مثال: 200"
                  className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111827] mb-1">
                ملاحظات إضافية للسائقين (اختياري)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: يوجد حقائب سفر كبيرة / نفضل سيارة مكيفة"
                className="w-full px-3 py-2 bg-[#F7F9FC] border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>نشر طلب الرحلة واستقبال عروض الأسعار</span>
                <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-md font-mono tabular-nums">
                  {routeDistanceKm} كم · {routeDurationText}
                </span>
              </button>

              <a
                href={currentTripWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-4 bg-[#18B981] hover:bg-[#18B981]/90 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة الرحلة عبر واتساب</span>
              </a>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: My Requests & Driver Offers */}
      {activeSubTab === 'MY_REQUESTS' && (
        <div className="space-y-6">
          {myRequests.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <p className="text-[#6B7280] text-sm">
                لم تقم بإنشاء أي طلبات رحلات خاصة حتى الآن.
              </p>
              <button
                onClick={() => setActiveSubTab('NEW_REQUEST')}
                className="mt-3 px-4 py-2 bg-[#146EF5] text-white rounded-lg text-xs font-bold hover:bg-[#146EF5]/90 cursor-pointer"
              >
                أنشئ طلب رحلتك الأول الآن
              </button>
            </div>
          ) : (
            myRequests.map((req) => {
              const reqOffers = offers.filter((o) => o.requestId === req.id);

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
                >
                  {/* Request Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-[#0B1F3A]">
                          {req.originAddress} ← {req.destinationAddress}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-[#6B7280]">
                          {req.serviceType === 'CITY' ? 'مشوار بالمدينة' : 'بين المدن'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#6B7280] mt-1">
                        <Clock className="w-3.5 h-3.5 text-[#146EF5]" />
                        <span>موعد الانطلاق: {new Date(req.scheduledTime).toLocaleString('ar-EG')}</span>
                        <span className="text-slate-300">·</span>
                        <Users className="w-3.5 h-3.5 text-[#18B981]" />
                        <span>{req.passengerCount} ركاب</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          req.status === 'COMPLETED'
                            ? 'text-[#18B981]'
                            : req.status === 'CANCELLED'
                            ? 'text-[#DC2626]'
                            : req.status === 'ACCEPTED'
                            ? 'text-[#18B981]'
                            : req.status === 'OFFERED'
                            ? 'text-[#146EF5]'
                            : 'text-amber-700'
                        }`}
                      >
                        {req.status === 'COMPLETED'
                          ? 'مكتملة'
                          : req.status === 'CANCELLED'
                          ? 'ملغاة'
                          : req.status === 'ACCEPTED'
                          ? 'تم قبول عرض وتأكيد الرحلة'
                          : req.status === 'OFFERED'
                          ? `وصلك ${reqOffers.length} عروض أسعار`
                          : 'قيد الانتظار (بانتظار عروض السائقين)'}
                      </span>

                      {/* زر مشاركة الرحلة عبر واتساب وتطبيقات المراسلة */}
                      {(() => {
                        const reqShareText = formatTripShareMessage({
                          title: 'مشاركة تفاصيل رحلتي — رأس غارب موبيليتي',
                          origin: `${req.originCity} — ${req.originAddress}`,
                          destination: `${req.destinationCity} — ${req.destinationAddress}`,
                          dateText: new Date(req.scheduledTime).toLocaleString('ar-EG'),
                          passengers: req.passengerCount,
                          distanceText: req.routeDistanceKm ? `${req.routeDistanceKm} كم` : undefined,
                          durationText: req.routeDurationMins
                            ? `${req.routeDurationMins} دقيقة`
                            : undefined,
                          fareText: req.suggestedFare ? `${req.suggestedFare} ج.م` : undefined,
                          statusText:
                            req.status === 'COMPLETED'
                              ? 'مكتملة'
                              : req.status === 'CANCELLED'
                              ? 'ملغاة'
                              : 'قيد الانتظار',
                          originLat: req.originLat,
                          originLng: req.originLng,
                          destLat: req.destLat,
                          destLng: req.destLng,
                        });
                        return (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(reqShareText)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#18B981] hover:bg-[#18B981]/90 text-white rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>مشاركة الرحلة</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleNativeOrCopyShare(req.id, reqShareText)}
                              title="نسخ تفاصيل الرحلة للمشاركة"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              {copiedShareId === req.id ? (
                                <Check className="w-3.5 h-3.5 text-[#18B981]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Route & Geographic Context with Prominent Distance and Duration Labels */}
                  {(req.routeDistanceKm || req.originLat) && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Route className="w-3.5 h-3.5 text-[#146EF5]" />
                          <span>المسافة بالكيلومترات:</span>
                          <span className="font-black text-[#0B1F3A] font-mono tabular-nums">
                            {req.routeDistanceKm ? `${req.routeDistanceKm} كم` : '---'}
                          </span>
                        </div>
                        <span className="text-slate-300">·</span>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#18B981]" />
                          <span>المدة المتوقعة للرحلة:</span>
                          <span className="font-black text-[#146EF5] font-mono tabular-nums">
                            {req.routeDurationMins
                              ? req.routeDurationMins >= 60
                                ? `${Math.floor(req.routeDurationMins / 60)} ساعة و ${req.routeDurationMins % 60} دقيقة`
                                : `${req.routeDurationMins} دقيقة`
                              : '---'}
                          </span>
                        </div>
                      </div>

                      {req.originLat && req.destLat && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMapReqId((curr) => (curr === req.id ? null : req.id))
                            }
                            className="text-[11px] font-bold text-[#146EF5] hover:text-[#0B1F3A] flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors hover:border-[#146EF5]"
                          >
                            <MapIcon className="w-3.5 h-3.5 text-[#146EF5]" />
                            <span>
                              {expandedMapReqId === req.id
                                ? 'إخفاء الخريطة'
                                : 'عرض المسار (Polyline) على الخريطة'}
                            </span>
                            {expandedMapReqId === req.id ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>

                          <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${req.originLat},${req.originLng}&destination=${req.destLat},${req.destLng}&travelmode=driving`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-slate-600 hover:text-[#146EF5] flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
                          >
                            <Navigation className="w-3 h-3 text-slate-500" />
                            <span>فتح الملاحة</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interactive Map Expansion via GoogleMapLoader */}
                  {req.originLat && req.originLng && req.destLat && req.destLng && expandedMapReqId === req.id && (
                    <div className="mt-3 p-3 bg-[#F7F9FC] border border-slate-200 rounded-xl space-y-2">
                      <GoogleMapLoader
                        renderLoading={() => (
                          <div className="h-60 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center p-4 text-center space-y-2">
                            <Loader2 className="w-5 h-5 text-[#146EF5] animate-spin" />
                            <span className="text-xs text-slate-600 font-medium">
                              جاري تحميل مسار الخريطة التفاعلية...
                            </span>
                          </div>
                        )}
                      >
                        <GoogleMapLiveRoute
                          apiKey={(import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || ''}
                          origin={{ lat: req.originLat, lng: req.originLng }}
                          destination={{ lat: req.destLat, lng: req.destLng }}
                          originLabel={req.originAddress}
                          destinationLabel={req.destinationAddress}
                          interactive={true}
                        />
                      </GoogleMapLoader>
                    </div>
                  )}

                  {/* Offers Section */}
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-[#111827] mb-2">
                      عروض الأسعار المقدمة من السائقين ({reqOffers.length}):
                    </h4>

                    {reqOffers.length === 0 ? (
                      <p className="text-xs text-[#6B7280] bg-[#F7F9FC] p-3 rounded-lg">
                        جاري إشعار السائقين المؤهلين المعتمدين في رأس غارب بهذا الطلب... ستظهر العروض هنا فور إرسالها.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {reqOffers.map((offer) => {
                          const isAccepted = offer.status === 'ACCEPTED';
                          const isRejected = offer.status === 'REJECTED';

                          return (
                            <div
                              key={offer.id}
                              className={`p-3.5 rounded-lg border text-xs transition-colors ${
                                isAccepted
                                  ? 'bg-[#18B981]/5 border-[#18B981] shadow-sm'
                                  : isRejected
                                  ? 'bg-slate-50 border-slate-200 opacity-60'
                                  : 'bg-white border-slate-200 hover:border-[#146EF5]'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5 font-bold text-sm text-[#0B1F3A]">
                                    <span>{offer.driverName}</span>
                                    <span className="flex items-center text-amber-500 font-mono text-xs tabular-nums">
                                      ★ {offer.driverRating}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[#6B7280] mt-0.5">
                                    {offer.vehicleModel} · لوحة: {offer.vehiclePlate}
                                  </div>
                                </div>

                                <div className="text-left font-mono tabular-nums">
                                  <span className="text-base font-extrabold text-[#146EF5]">
                                    {offer.proposedFare} ج.م
                                  </span>
                                  <span className="text-[10px] text-[#6B7280] block">
                                    وصول خلال ~{offer.estimatedArrivalMins} دقيقة
                                  </span>
                                </div>
                              </div>

                              {offer.notes && (
                                <p className="mt-2 text-[11px] text-slate-600 bg-white/80 p-1.5 rounded border border-slate-100">
                                  {offer.notes}
                                </p>
                              )}

                              <div className="mt-3 pt-2 border-t border-slate-100">
                                {isAccepted ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-[#18B981] font-bold text-xs">
                                      <CheckCircle className="w-4 h-4 shrink-0" />
                                      <span>العرض المعتمد والمؤكد</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <a
                                        href={`tel:${offer.driverPhone}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white font-bold rounded text-xs transition-colors"
                                      >
                                        <Phone className="w-3.5 h-3.5 text-[#18B981]" />
                                        <span>اتصال: {offer.driverPhone}</span>
                                      </a>
                                      <a
                                        href={`https://wa.me/20${offer.driverPhone.slice(1)}?text=${encodeURIComponent(
                                          `السلام عليكم كابتن ${offer.driverName}، أنا حجزت رحلتك من ${req.originAddress} إلى ${req.destinationAddress} عبر منصة رأس غارب موبيليتي.`
                                        )}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18B981] hover:bg-[#18B981]/90 text-white font-bold rounded text-xs transition-colors"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>واتساب السائق</span>
                                      </a>
                                    </div>
                                  </div>
                                ) : isRejected ? (
                                  <span className="text-slate-400 text-[11px]">
                                    تم استبعاد العرض بعد قبول عرض آخر
                                  </span>
                                  ) : (
                                  <button
                                    onClick={() => handleAcceptOffer(offer.id)}
                                    className="w-full py-1.5 bg-[#18B981] hover:bg-[#18B981]/90 text-white font-bold rounded transition-colors text-xs cursor-pointer"
                                  >
                                    قبول وتثبيت الرحلة ({offer.proposedFare} ج.م)
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Post-Trip Mutual Rating & Accountability Section in MY_REQUESTS */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {req.status === 'COMPLETED' ? (
                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                            <h5 className="text-xs font-extrabold text-[#0B1F3A]">
                              تقييم الرحلة المتبادل بعد انتهاء الرحلة (الراكب ⇄ السائق)
                            </h5>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const acceptedOffer = offers.find(
                                (o) => o.requestId === req.id && o.status === 'ACCEPTED'
                              );
                              openRatingModal({
                                itemType: 'REQUEST',
                                itemId: req.id,
                                routeTitle: `${req.originAddress} ← ${req.destinationAddress}`,
                                driverName:
                                  acceptedOffer?.driverName ||
                                  req.rating?.driverName ||
                                  'الكابتن محمد عبد الرحيم',
                                passengerName: currentUser.fullName,
                                existingRating: req.rating,
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                          >
                            <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              {req.rating?.driverStars
                                ? 'تعديل التقييم والتعليقات'
                                : 'إضافة تقييم وتعليق على الرحلة'}
                            </span>
                          </button>
                        </div>

                        {req.rating?.driverStars || req.rating?.passengerStars ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Passenger's rating of Driver */}
                            <div className="bg-white p-3 rounded-lg border border-amber-200/70">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-[#0B1F3A]">
                                  تقييمك للسائق ({req.rating.driverName || 'الكابتن محمد عبد الرحيم'})
                                </span>
                                {renderStarRow(req.rating.driverStars || 5)}
                              </div>
                              {req.rating.driverComment && (
                                <p className="text-xs text-slate-700 leading-relaxed mt-1">
                                  "{req.rating.driverComment}"
                                </p>
                              )}
                              {req.rating.driverTags && req.rating.driverTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {req.rating.driverTags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold"
                                    >
                                      ✓ {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Driver's rating of Passenger */}
                            <div className="bg-white p-3 rounded-lg border border-emerald-200/70">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold text-[#0B1F3A]">
                                  تقييم السائق للراكب ({currentUser.fullName})
                                </span>
                                {renderStarRow(req.rating.passengerStars || 5)}
                              </div>
                              {req.rating.passengerComment && (
                                <p className="text-xs text-slate-700 leading-relaxed mt-1">
                                  "{req.rating.passengerComment}"
                                </p>
                              )}
                              {req.rating.passengerTags && req.rating.passengerTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {req.rating.passengerTags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold"
                                    >
                                      ✓ {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-600">
                            الرحلة مكتملة — شاركنا تقييمك بالنجوم والتعليق لتعزيز الثقة والمسؤولية بين الركاب والسائقين.
                          </p>
                        )}
                      </div>
                    ) : (
                      req.status !== 'CANCELLED' && (
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#F7F9FC] p-3 rounded-xl border border-slate-200/80">
                          <span className="text-xs text-[#6B7280]">
                            هل وصلت لوجهتك بسلام؟ قم بإتمام الرحلة لتفعيل نظام التقييم المتبادل، أو حاكِ قبول السائق لتلقي إشعار فوري.
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {(req.status === 'OPEN' || req.status === 'OFFERED') && (
                              <button
                                type="button"
                                onClick={() => mobilityStore.simulateInstantDriverNotification(req.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>محاكاة قبول السائق وإرسال إشعار فوري</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCompleteRequest(req.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18B981] hover:bg-[#18B981]/90 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>إتمام الرحلة وتقييم السائق ★</span>
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: My Bookings */}
      {activeSubTab === 'MY_BOOKINGS' && (
        <div className="space-y-4">
          {myBookings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <p className="text-[#6B7280] text-sm">
                لا توجد لديك حجوزات سابقة أو جارية.
              </p>
            </div>
          ) : (
            myBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#0B1F3A] text-base">
                        {b.tripSummary}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span
                        className={`text-xs font-bold ${
                          b.status === 'CONFIRMED'
                            ? 'text-[#18B981]'
                            : b.status === 'CANCELLED'
                            ? 'text-red-700'
                            : 'text-[#146EF5]'
                        }`}
                      >
                        {b.status === 'CONFIRMED' ? 'حجز مؤكد' : b.status === 'CANCELLED' ? 'ملغى' : 'رحلة مكتملة'}
                      </span>
                    </div>

                    <div className="text-xs text-[#6B7280] mt-1 space-x-2 space-x-reverse">
                      <span>عدد المقاعد: {b.seatsBooked}</span>
                      <span className="text-slate-300">·</span>
                      <span>
                        الإجمالي: <strong className="text-[#146EF5] font-mono tabular-nums">{b.totalFare} ج.م</strong>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span>تاريخ الحجز: {new Date(b.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {(() => {
                      const bookingShareText = formatTripShareMessage({
                        title: 'تفاصيل حجز رحلة — رأس غارب موبيليتي',
                        origin: b.tripSummary.split('⇄')[0]?.trim() || 'رأس غارب',
                        destination: b.tripSummary.split('⇄')[1]?.trim() || b.tripSummary,
                        dateText: new Date(b.createdAt).toLocaleDateString('ar-EG'),
                        passengers: b.seatsBooked,
                        fareText: `${b.totalFare} ج.م`,
                        statusText:
                          b.status === 'COMPLETED'
                            ? 'مكتملة'
                            : b.status === 'CANCELLED'
                            ? 'ملغاة'
                            : 'قيد الانتظار (حجز مؤكد)',
                      });
                      return (
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(bookingShareText)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>مشاركة الرحلة</span>
                        </a>
                      );
                    })()}

                    {b.status === 'CONFIRMED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCompleteBooking(b)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>إتمام وتقييم الرحلة</span>
                        </button>
                        <a
                          href="tel:01123456789"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#18B981]" />
                          <span>اتصال بالسائق</span>
                        </a>
                        <a
                          href={`https://wa.me/201123456789?text=${encodeURIComponent(
                            `السلام عليكم، قمت بتأكيد حجز ${b.seatsBooked} مقعد في رحلة (${b.tripSummary}) عبر منصة رأس غارب موبيليتي.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#18B981] hover:bg-[#18B981]/90 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب السائق</span>
                        </a>
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold rounded-lg transition-colors border border-red-200 cursor-pointer"
                        >
                          إلغاء الحجز
                        </button>
                      </>
                    )}

                    {b.status === 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() =>
                          openRatingModal({
                            itemType: 'BOOKING',
                            itemId: b.id,
                            routeTitle: b.tripSummary,
                            driverName: 'الكابتن محمد عبد الرحيم',
                            passengerName: currentUser.fullName,
                            existingRating: b.rating,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#0B1F3A] text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-[#0B1F3A]" />
                        <span>{b.rating?.driverStars ? 'تعديل تقييم الرحلة' : 'تقييم السائق والرحلة ★'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Rating display inside MY_BOOKINGS when COMPLETED */}
                {b.status === 'COMPLETED' && (b.rating?.driverStars || b.rating?.passengerStars) && (
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/70">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0B1F3A]">
                          تقييمك للسائق ({b.rating.driverName || 'الكابتن محمد عبد الرحيم'})
                        </span>
                        {renderStarRow(b.rating.driverStars || 5)}
                      </div>
                      {b.rating.driverComment && (
                        <p className="text-xs text-slate-700 mt-1">"{b.rating.driverComment}"</p>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/70">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0B1F3A]">
                          تقييم السائق للراكب ({currentUser.fullName})
                        </span>
                        {renderStarRow(b.rating.passengerStars || 5)}
                      </div>
                      {b.rating.passengerComment && (
                        <p className="text-xs text-slate-700 mt-1">"{b.rating.passengerComment}"</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 5: In-App Notifications Center inside PassengerArea */}
      {activeSubTab === 'NOTIFICATIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#146EF5] text-white flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0B1F3A]">
                  مركز الإشعارات الفورية وتنبيهات الرحلات (In-App Notifications)
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  تنبيهات لحظية تصل فور تحديث حالة طلباتك أو إرسال وقبول السائقين لعروض رحلاتك في رأس غارب والبحر الأحمر.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#F7F9FC] p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setNotifFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    notifFilter === 'ALL'
                      ? 'bg-[#0B1F3A] text-white'
                      : 'text-slate-600 hover:text-[#0B1F3A]'
                  }`}
                >
                  الكل ({notifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter('UNREAD')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    notifFilter === 'UNREAD'
                      ? 'bg-[#146EF5] text-white'
                      : 'text-slate-600 hover:text-[#146EF5]'
                  }`}
                >
                  غير مقروءة ({unreadNotifications.length})
                </button>
                <button
                  type="button"
                  onClick={() => setNotifFilter('DRIVER_UPDATES')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    notifFilter === 'DRIVER_UPDATES'
                      ? 'bg-[#18B981] text-white'
                      : 'text-slate-600 hover:text-[#18B981]'
                  }`}
                >
                  قبول السائقين وتحديثات الحالة
                </button>
              </div>

              {unreadNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => mobilityStore.markAllNotificationsAsRead()}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#146EF5] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>تحديد الكل كمقروء</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => mobilityStore.simulateInstantDriverNotification()}
                className="px-3.5 py-2 bg-[#18B981] hover:bg-[#18B981]/90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>تجربة إشعار قبول سائق الآن</span>
              </button>
            </div>
          </div>

          {filteredPassengerNotifications.length === 0 ? (
            <div className="py-10 text-center bg-[#F7F9FC] rounded-xl border border-slate-200/80">
              <p className="text-sm font-semibold text-[#6B7280]">
                لا توجد إشعارات مطابقة للفلتر المحدد حالياً.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredPassengerNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => mobilityStore.markNotificationAsRead(notif.id)}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer ${
                    !notif.isRead
                      ? 'bg-blue-50/40 border-blue-200 hover:border-[#146EF5]'
                      : 'bg-[#F7F9FC]/60 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-extrabold text-[#146EF5]">
                          {getNotificationTypeLabel(notif.type)}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 font-mono tabular-nums">
                          {new Date(notif.createdAt).toLocaleString('ar-EG')}
                        </span>
                        {!notif.isRead && (
                          <span className="text-[11px] font-extrabold text-[#DC2626]">
                            · جديد (غير مقروء)
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-[#0B1F3A] mt-0.5">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {notif.relatedId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          mobilityStore.markNotificationAsRead(notif.id);
                          setActiveSubTab('MY_REQUESTS');
                        }}
                        className="px-3 py-1.5 bg-[#0B1F3A] hover:bg-[#0B1F3A]/90 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        عرض الطلب
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        mobilityStore.deleteNotification(notif.id);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="حذف الإشعار"
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

      {/* قسم قائمة رحلاتي السابقة مع تفاصيل التاريخ والوجهة وحالة الطلب (مكتملة، ملغاة، قيد الانتظار) */}
      <div
        id="passenger-trip-history-section"
        className={`${
          activeSubTab === 'TRIP_HISTORY' ? 'mt-0' : 'mt-10 pt-8 border-t border-slate-200'
        }`}
      >
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
          {/* Header & Filter Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center shrink-0 shadow-xs">
                <History className="w-5 h-5 text-[#18B981]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0B1F3A]">
                  رحلاتي السابقة وسجل الطلبات
                </h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  قائمة شاملة برحلاتك السابقة والحالية مع تفاصيل التاريخ والوجهة وحالة الطلب (مكتملة، ملغاة، قيد الانتظار) وإمكانية مشاركة الرحلة عبر واتساب.
                </p>
              </div>
            </div>

            {/* Filter by Status: الكل | مكتملة | ملغاة | قيد الانتظار */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#F7F9FC] p-1.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  historyStatusFilter === 'ALL'
                    ? 'bg-[#0B1F3A] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#0B1F3A]'
                }`}
              >
                الكل ({unifiedTripHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  historyStatusFilter === 'COMPLETED'
                    ? 'bg-[#18B981] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#18B981]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>مكتملة ({completedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  historyStatusFilter === 'PENDING'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-amber-600'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>قيد الانتظار ({pendingCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryStatusFilter('CANCELLED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  historyStatusFilter === 'CANCELLED'
                    ? 'bg-[#DC2626] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#DC2626]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>ملغاة ({cancelledCount})</span>
              </button>
            </div>
          </div>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 block">رحلات مكتملة</span>
                <span className="text-lg font-black text-[#18B981] font-mono tabular-nums">
                  {completedCount}
                </span>
              </div>
              <CheckCircle className="w-5 h-5 text-[#18B981]" />
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-800 block">قيد الانتظار</span>
                <span className="text-lg font-black text-amber-600 font-mono tabular-nums">
                  {pendingCount}
                </span>
              </div>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-800 block">رحلات ملغاة</span>
                <span className="text-lg font-black text-[#DC2626] font-mono tabular-nums">
                  {cancelledCount}
                </span>
              </div>
              <XCircle className="w-5 h-5 text-[#DC2626]" />
            </div>
          </div>

          {/* Previous Trips Table / Cards List */}
          {filteredTripHistory.length === 0 ? (
            <div className="py-10 text-center bg-[#F7F9FC] rounded-xl border border-slate-200/80">
              <p className="text-sm font-semibold text-[#6B7280]">
                لا توجد رحلات مطابقة لفلتر الحالة المحدد حالياً.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTripHistory.map((item) => {
                const formattedDate = new Date(item.dateIso).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                const formattedTime = new Date(item.dateIso).toLocaleTimeString('ar-EG', {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const shareMessage = formatTripShareMessage({
                  title: 'تفاصيل رحلة من سجل رحلاتي — رأس غارب موبيليتي',
                  origin: item.origin,
                  destination: item.destination,
                  dateText: `${formattedDate} - ${formattedTime}`,
                  passengers: item.passengers,
                  distanceText: item.distanceKm ? `${item.distanceKm} كم` : undefined,
                  durationText: item.durationMins ? `${item.durationMins} دقيقة` : undefined,
                  fareText: item.fare ? `${item.fare} ج.م` : undefined,
                  statusText: item.statusLabel,
                  originLat: item.originLat,
                  originLng: item.originLng,
                  destLat: item.destLat,
                  destLng: item.destLng,
                });

                const whatsappShareLink = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

                return (
                  <div
                    key={`${item.itemType}-${item.id}`}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-[#F7F9FC]/60 hover:bg-white transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    {/* Left/Right Main Info: Destination, Route & Date */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Status Badge: مكتملة | ملغاة | قيد الانتظار */}
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-extrabold ${
                            item.normalizedStatus === 'COMPLETED'
                              ? 'bg-emerald-50 text-[#18B981] border border-emerald-200'
                              : item.normalizedStatus === 'CANCELLED'
                              ? 'bg-rose-50 text-[#DC2626] border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {item.normalizedStatus === 'COMPLETED' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-[#18B981]" />
                          ) : item.normalizedStatus === 'CANCELLED' ? (
                            <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>حالة الطلب: {item.statusLabel}</span>
                        </span>

                        <span className="text-[11px] font-bold text-[#146EF5] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                          {item.serviceLabel}
                        </span>

                        <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>التاريخ: {formattedDate}</span>
                          <span className="text-slate-300">·</span>
                          <span>{formattedTime}</span>
                        </span>
                      </div>

                      {/* Origin -> Destination */}
                      <div className="flex flex-wrap items-center gap-2 text-sm font-extrabold text-[#0B1F3A] pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#18B981] shrink-0" />
                          <span>{item.origin}</span>
                        </div>
                        <span className="text-slate-400 font-normal">←</span>
                        <div className="flex items-center gap-1.5">
                          <Navigation className="w-4 h-4 text-[#DC2626] shrink-0" />
                          <span>الوجهة: {item.destination}</span>
                        </div>
                      </div>

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7280]">
                        <span>
                          عدد الركاب: <strong className="text-[#0B1F3A]">{item.passengers}</strong>
                        </span>
                        {item.fare && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>
                              التكلفة:{' '}
                              <strong className="text-[#146EF5] font-mono tabular-nums">
                                {item.fare} ج.م
                              </strong>
                            </span>
                          </>
                        )}
                        {item.distanceKm && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono tabular-nums">
                              المسافة: {item.distanceKm} كم
                            </span>
                          </>
                        )}
                        {item.driverName && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span>السائق: {item.driverName}</span>
                          </>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-slate-500 italic">{item.notes}</p>
                      )}

                      {/* Mutual Ratings & Comments Display inside Trip History for Completed Trips */}
                      {item.normalizedStatus === 'COMPLETED' && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80">
                          {item.rating?.driverStars || item.rating?.passengerStars ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {/* تقييم الراكب للسائق */}
                              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold text-[#0B1F3A] text-[11px]">
                                    تقييم الراكب للسائق ({item.driverName || 'الكابتن محمد عبد الرحيم'}):
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {renderStarRow(item.rating.driverStars || 5)}
                                    <span className="font-mono font-bold text-amber-700 text-[11px]">
                                      ({item.rating.driverStars || 5}/5)
                                    </span>
                                  </div>
                                </div>
                                {item.rating.driverComment && (
                                  <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                                    💬 "{item.rating.driverComment}"
                                  </p>
                                )}
                                {item.rating.driverTags && item.rating.driverTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {item.rating.driverTags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-2 py-0.5 rounded bg-white text-amber-800 border border-amber-200 text-[10px] font-semibold"
                                      >
                                        ✓ {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* تقييم السائق للراكب */}
                              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold text-[#0B1F3A] text-[11px]">
                                    تقييم السائق للراكب ({currentUser.fullName}):
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {renderStarRow(item.rating.passengerStars || 5)}
                                    <span className="font-mono font-bold text-emerald-700 text-[11px]">
                                      ({item.rating.passengerStars || 5}/5)
                                    </span>
                                  </div>
                                </div>
                                {item.rating.passengerComment && (
                                  <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">
                                    💬 "{item.rating.passengerComment}"
                                  </p>
                                )}
                                {item.rating.passengerTags && item.rating.passengerTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {item.rating.passengerTags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200 text-[10px] font-semibold"
                                      >
                                        ✓ {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2 bg-amber-50/60 px-3 py-2 rounded-lg border border-amber-200/70 text-xs">
                              <span className="text-amber-900 font-semibold">
                                لم يتم تسجيل تقييم لهذه الرحلة المكتملة بعد — قيّم السائق والرحلة بالنجوم والتعليق لتعزيز الثقة.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Rating + Share Trip via WhatsApp + Status Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 self-start lg:self-center">
                      {item.normalizedStatus === 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() =>
                            openRatingModal({
                              itemType: item.itemType,
                              itemId: item.id,
                              routeTitle: `${item.origin} ← ${item.destination}`,
                              driverName: item.driverName || 'الكابتن محمد عبد الرحيم',
                              passengerName: currentUser.fullName,
                              existingRating: item.rating,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 text-[#0B1F3A] rounded-lg text-xs font-extrabold transition-colors shadow-2xs cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5 fill-[#0B1F3A]" />
                          <span>
                            {item.rating?.driverStars ? 'تعديل التقييم ★' : 'تقييم الرحلة ★'}
                          </span>
                        </button>
                      )}

                      <a
                        href={whatsappShareLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#18B981] hover:bg-[#18B981]/90 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>مشاركة الرحلة</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleNativeOrCopyShare(item.id, shareMessage)}
                        title="نسخ أو مشاركة تفاصيل الرحلة"
                        className="inline-flex items-center gap-1 px-2.5 py-2 bg-white hover:bg-slate-100 text-[#0B1F3A] border border-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        {copiedShareId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#18B981]" />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-[#146EF5]" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>

                      {item.itemType === 'REQUEST' && item.normalizedStatus === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCompleteRequest(item.id)}
                            className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#18B981] border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            إتمام وتقييم الرحلة ★
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(item.id)}
                            className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-[#DC2626] border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            إلغاء الطلب
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* نافذة نظام التقييم المتبادل (نجوم وتعليقات) للركاب والسائقين بعد انتهاء الرحلة */}
      {ratingModalTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setRatingModalTarget(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-5 sm:p-6 space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-600 shrink-0">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0B1F3A]">
                    نظام تقييم الرحلة المتبادل (نجوم وتعليقات)
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    مسار الرحلة: <strong className="text-[#0B1F3A]">{ratingModalTarget.routeTitle}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRatingModalTarget(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitMutualRating} className="space-y-5">
              {/* Section 1: Passenger rating Driver (تقييم الراكب للسائق والرحلة) */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                      ١. تقييم الراكب للسائق
                    </span>
                    <h4 className="text-sm font-extrabold text-[#0B1F3A] mt-1">
                      كيف كانت رحلتك مع السائق: {ratingModalTarget.driverName}؟
                    </h4>
                  </div>
                  <span className="text-xs font-extrabold text-amber-700 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                    {STAR_LABELS[hoverDriverStars || driverStars]}
                  </span>
                </div>

                {/* Interactive 5-Star Selector for Driver */}
                <div className="flex items-center justify-center sm:justify-start gap-2 py-1" dir="ltr">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const active = starValue <= (hoverDriverStars || driverStars);
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onMouseEnter={() => setHoverDriverStars(starValue)}
                        onMouseLeave={() => setHoverDriverStars(0)}
                        onClick={() => setDriverStars(starValue)}
                        aria-label={`تقييم السائق ${starValue} نجوم`}
                        className="p-1.5 rounded-xl hover:bg-amber-100/80 transition-transform hover:scale-110 cursor-pointer"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            active
                              ? 'text-amber-400 fill-amber-400 drop-shadow-2xs'
                              : 'text-slate-300 fill-white'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Quick Accountability & Trust Tags for Driver */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    نقاط التميز والمسؤولية للسائق (اختر ما ينطبق):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {DRIVER_FEEDBACK_TAGS.map((tag) => {
                      const selected = driverTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleDriverTag(tag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#0B1F3A] text-amber-300 border border-[#0B1F3A]'
                              : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-400'
                          }`}
                        >
                          {selected ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Driver Review Comment Input */}
                <div>
                  <label className="block text-xs font-bold text-[#0B1F3A] mb-1">
                    تعليقك حول أداء السائق والمركبة:
                  </label>
                  <textarea
                    rows={2}
                    value={driverComment}
                    onChange={(e) => setDriverComment(e.target.value)}
                    placeholder="اكتب تعليقك بكل شفافية (مثال: التزام ممتاز بالموعد، قيادة آمنة ومريحة طوال الطريق...)"
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Section 2: Driver rating Passenger (تقييم السائق للراكب لتشجيع الثقة والمسؤولية المتبادلة) */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                      ٢. تقييم السائق للراكب (المسؤولية المتبادلة)
                    </span>
                    <h4 className="text-sm font-extrabold text-[#0B1F3A] mt-1">
                      تقييم التزام الراكب: {ratingModalTarget.passengerName}
                    </h4>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                    {STAR_LABELS[hoverPassengerStars || passengerStars]}
                  </span>
                </div>

                {/* Interactive 5-Star Selector for Passenger */}
                <div className="flex items-center justify-center sm:justify-start gap-2 py-1" dir="ltr">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const active = starValue <= (hoverPassengerStars || passengerStars);
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onMouseEnter={() => setHoverPassengerStars(starValue)}
                        onMouseLeave={() => setHoverPassengerStars(0)}
                        onClick={() => setPassengerStars(starValue)}
                        aria-label={`تقييم الراكب ${starValue} نجوم`}
                        className="p-1.5 rounded-xl hover:bg-emerald-100/80 transition-transform hover:scale-110 cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 transition-colors ${
                            active
                              ? 'text-amber-400 fill-amber-400 drop-shadow-2xs'
                              : 'text-slate-300 fill-white'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Quick Accountability Tags for Passenger */}
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                    نقاط التزام الراكب (تظهر في سجل موثوقية الراكب):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PASSENGER_FEEDBACK_TAGS.map((tag) => {
                      const selected = passengerTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => togglePassengerTag(tag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#18B981] text-white border border-[#18B981]'
                              : 'bg-white text-slate-600 border border-slate-200 hover:border-[#18B981]'
                          }`}
                        >
                          {selected ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Passenger Review Comment Input */}
                <div>
                  <label className="block text-xs font-bold text-[#0B1F3A] mb-1">
                    تعليق السائق حول التزام الراكب:
                  </label>
                  <textarea
                    rows={2}
                    value={passengerComment}
                    onChange={(e) => setPassengerComment(e.target.value)}
                    placeholder="تعليق حول جاهزية الراكب في الموعد والاحترام المتبادل..."
                    className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#18B981]"
                  />
                </div>
              </div>

              {/* Submit & Cancel Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingModalTarget(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-extrabold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                  <span>حفظ واعتماد التقييم والتعليقات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
