import React, { useState, useEffect, useRef } from 'react';
import { GoogleMapLiveRoute, RouteDetails, Coordinates } from './GoogleMapLiveRoute';
import {
  MapPin,
  Navigation,
  LocateFixed,
  ExternalLink,
  Route,
  CheckCircle2,
  AlertTriangle,
  MousePointerClick,
  ArrowLeftRight,
  ZoomIn,
  Globe,
} from 'lucide-react';

export interface LocationPoint {
  lat: number;
  lng: number;
  address: string;
  city: string;
}

// Prominent checkpoints in Ras Gharib and Red Sea route corridors
export const PRESET_LOCATIONS: { [key: string]: LocationPoint } = {
  // Ras Gharib Hubs
  RG_ROUDA: {
    lat: 28.3615,
    lng: 33.0762,
    city: 'رأس غارب',
    address: 'حي الروضة والمجمع الحكومي',
  },
  RG_128: {
    lat: 28.3542,
    lng: 33.0811,
    city: 'رأس غارب',
    address: 'مساكن الـ 128 - الطريق الرئيسي',
  },
  RG_HOSPITAL: {
    lat: 28.3688,
    lng: 33.0725,
    city: 'رأس غارب',
    address: 'مستشفى رأس غارب المركزي التخصصي',
  },
  RG_STATION: {
    lat: 28.3589,
    lng: 33.0789,
    city: 'رأس غارب',
    address: 'الموقف العام ومحطة الأتوبيس - طريق الغردقة السريع',
  },
  RG_PORT: {
    lat: 28.3491,
    lng: 33.0898,
    city: 'رأس غارب',
    address: 'ميناء رأس غارب البحري - كورنيش المدينة',
  },
  RG_SAHARA: {
    lat: 28.3645,
    lng: 33.0695,
    city: 'رأس غارب',
    address: 'منطقة الصحاري السكنية ونادي الشركة العامة',
  },
  RG_KORNISH: {
    lat: 28.3522,
    lng: 33.0865,
    city: 'رأس غارب',
    address: 'كورنيش رأس غارب السياحي ومنطقة الشاطئ',
  },

  // Intercity Destinations
  HURGHADA_DAHAR: {
    lat: 27.2579,
    lng: 33.8116,
    city: 'الغردقة',
    address: 'موقف الدهار العام وميدان المحطة',
  },
  HURGHADA_AIRPORT: {
    lat: 27.1801,
    lng: 33.7994,
    city: 'الغردقة',
    address: 'مطار الغردقة الدولي - صالة الوصول',
  },
  EL_GOUNA: {
    lat: 27.3949,
    lng: 33.6765,
    city: 'الجونة',
    address: 'بوابة الجونة الرئيسية وميدان التامار حنة',
  },
  RAS_SHUKEIR: {
    lat: 28.1611,
    lng: 33.2844,
    city: 'رأس شقير',
    address: 'مجمع شركات البترول وحقول شقير البحرية',
  },
  ZAFARANA: {
    lat: 29.1172,
    lng: 32.6514,
    city: 'الزعفرانة',
    address: 'كمين ومثلث الزعفرانة - محطة وقود وطنية',
  },
  SUEZ_PORT: {
    lat: 29.9668,
    lng: 32.5498,
    city: 'السويس',
    address: 'موقف بورتوفيق العام - السويس',
  },
  CAIRO_RAMSES: {
    lat: 30.0617,
    lng: 31.2464,
    city: 'القاهرة',
    address: 'موقف رمسيس وأحمد حلمي - وسط القاهرة',
  },
  QENA_STATION: {
    lat: 26.1642,
    lng: 32.7267,
    city: 'قنا',
    address: 'موقف قنا العمومي ومحطة القطار',
  },
};

// Haversine direct distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Resolve clicked coordinates on the map into a descriptive Arabic LocationPoint
export function resolveLocationFromCoords(
  lat: number,
  lng: number,
  fallbackCity = 'رأس غارب'
): LocationPoint {
  let closest: LocationPoint | null = null;
  let minDistance = Infinity;

  for (const loc of Object.values(PRESET_LOCATIONS)) {
    const dist = haversineKm(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = loc;
    }
  }

  if (closest && minDistance < 1.2) {
    return {
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      city: closest.city,
      address: `${closest.address} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    };
  }

  if (closest && minDistance < 18) {
    return {
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      city: closest.city,
      address: `بالقرب من ${closest.address} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    };
  }

  const resolvedCity = closest && minDistance < 65 ? closest.city : fallbackCity;
  return {
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
    city: resolvedCity,
    address: `موقع محدد بالدبوس في ${resolvedCity} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
  };
}

// Haversine direct distance calculation with typical road multiplier for Egyptian coastal highways
export function calculateDrivingEstimate(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceKm: number; durationMins: number } {
  const directDistance = haversineKm(lat1, lon1, lat2, lon2);

  // Road factor for Red Sea / Egyptian coastal highway
  const roadMultiplier = directDistance > 50 ? 1.22 : 1.35;
  const distanceKm = Math.max(0.8, Math.round(directDistance * roadMultiplier * 10) / 10);

  // Average speed: ~85 km/h for highways, ~35 km/h for local town
  const avgSpeed = directDistance > 30 ? 80 : 35;
  const durationMins = Math.max(3, Math.round((distanceKm / avgSpeed) * 60));

  return { distanceKm, durationMins };
}

interface RideLocationPickerMapProps {
  originPoint: LocationPoint;
  destinationPoint: LocationPoint;
  directionsResult?: google.maps.DirectionsResult | null;
  routePolylinePath?: Coordinates[];
  onChangeOrigin: (point: LocationPoint) => void;
  onChangeDestination: (point: LocationPoint) => void;
  onMapClick?: (coords: Coordinates) => void;
  onMapReady?: (map: google.maps.Map | null) => void;
  onRouteCalculated?: (distanceKm: number, durationMins: number, details?: RouteDetails) => void;
  selectionMode?: 'origin' | 'destination';
  onSelectionModeChange?: (mode: 'origin' | 'destination') => void;
}

export const RideLocationPickerMap: React.FC<RideLocationPickerMapProps> = ({
  originPoint,
  destinationPoint,
  directionsResult,
  routePolylinePath,
  onChangeOrigin,
  onChangeDestination,
  onMapClick,
  onMapReady,
  onRouteCalculated,
  selectionMode: controlledMode,
  onSelectionModeChange,
}) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const [internalMode, setInternalMode] = useState<'origin' | 'destination'>('origin');
  const selectionMode = controlledMode ?? internalMode;

  const setSelectionMode = (mode: 'origin' | 'destination') => {
    setInternalMode(mode);
    onSelectionModeChange?.(mode);
  };

  // Interactive fallback map zoom scope ('CITY' for Ras Gharib neighborhoods, 'REGIONAL' for Red Sea & Egypt)
  const [mapZoomScope, setMapZoomScope] = useState<'CITY' | 'REGIONAL'>('REGIONAL');
  const mapSurfaceRef = useRef<HTMLDivElement | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [calculatedRoute, setCalculatedRoute] = useState<{
    distanceKm: number;
    durationMins: number;
    distanceText?: string;
    durationText?: string;
    summary?: string;
    source?: string;
  } | null>(null);

  // Compute route estimate when coordinates change and API key is missing
  useEffect(() => {
    if (originPoint.lat && destinationPoint.lat && !apiKey) {
      const estimate = calculateDrivingEstimate(
        originPoint.lat,
        originPoint.lng,
        destinationPoint.lat,
        destinationPoint.lng
      );
      const distanceText = `${estimate.distanceKm} كم`;
      const durationText =
        estimate.durationMins >= 60
          ? `${Math.floor(estimate.durationMins / 60)} ساعة و ${estimate.durationMins % 60} دقيقة`
          : `${estimate.durationMins} دقيقة`;

      setCalculatedRoute({
        ...estimate,
        distanceText,
        durationText,
        summary: `${originPoint.city} ← ${destinationPoint.city}`,
      });
      if (onRouteCalculated) {
        onRouteCalculated(estimate.distanceKm, estimate.durationMins, {
          distanceText,
          durationText,
          summary: `${originPoint.city} ← ${destinationPoint.city}`,
          source: 'DIRECTIONS_SERVICE',
        });
      }
    }
  }, [originPoint.lat, originPoint.lng, originPoint.city, destinationPoint.lat, destinationPoint.lng, destinationPoint.city, apiKey, onRouteCalculated]);

  // Use browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('خاصية تحديد الموقع الجغرافي (GPS) غير مدعومة في متصفحك.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const resolved = resolveLocationFromCoords(latitude, longitude, 'موقعي الحالي');
        onChangeOrigin({
          ...resolved,
          address: `موقعي الحالي GPS - ${resolved.address}`,
        });
      },
      (err) => {
        setIsLocating(false);
        let msg = 'تعذر الحصول على موقعك الحالي.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'تم رفض الإذن بالوصول للموقع. يرجى السماح بتحديد الموقع أو النقر مباشرة على الخريطة لتحديد الدبوس.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'إشارة الموقع الجغرافي غير متوفرة حالياً.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'استغرق تحديد الموقع وقتاً طويلاً. يرجى المحاولة ثانية.';
        }
        setLocationError(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Swap origin and destination markers
  const handleSwapPoints = () => {
    const tempOrigin = { ...originPoint };
    const tempDest = { ...destinationPoint };
    onChangeOrigin(tempDest);
    onChangeDestination(tempOrigin);
  };

  // Bounding boxes for interactive canvas map projection
  const bounds =
    mapZoomScope === 'CITY'
      ? {
          minLat: 28.342,
          maxLat: 28.375,
          minLng: 33.062,
          maxLng: 33.096,
        }
      : {
          minLat: 25.9,
          maxLat: 30.3,
          minLng: 30.9,
          maxLng: 34.2,
        };

  // Convert lat/lng to percentage X/Y on the interactive map canvas
  const coordsToPercent = (lat: number, lng: number) => {
    const clampedLat = Math.max(bounds.minLat, Math.min(bounds.maxLat, lat));
    const clampedLng = Math.max(bounds.minLng, Math.min(bounds.maxLng, lng));
    const x = ((clampedLng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = ((bounds.maxLat - clampedLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return {
      x: Math.max(6, Math.min(94, x)),
      y: Math.max(10, Math.min(90, y)),
    };
  };

  // Handle direct click on the interactive map surface to drop Origin or Destination marker
  const handleCanvasMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapSurfaceRef.current) return;
    const rect = mapSurfaceRef.current.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const clickY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const lng = bounds.minLng + clickX * (bounds.maxLng - bounds.minLng);
    const lat = bounds.maxLat - clickY * (bounds.maxLat - bounds.minLat);

    if (onMapClick) {
      onMapClick({ lat, lng });
      return;
    }

    if (selectionMode === 'origin') {
      const resolved = resolveLocationFromCoords(lat, lng, originPoint.city || 'رأس غارب');
      onChangeOrigin(resolved);
    } else {
      const resolved = resolveLocationFromCoords(lat, lng, destinationPoint.city || 'الغردقة');
      onChangeDestination(resolved);
    }
  };

  // Google Maps Deep Link URL for turn-by-turn navigation
  const googleMapsDeepLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    `${originPoint.lat},${originPoint.lng}`
  )}&destination=${encodeURIComponent(
    `${destinationPoint.lat},${destinationPoint.lng}`
  )}&travelmode=driving`;

  const originPos = coordsToPercent(originPoint.lat, originPoint.lng);
  const destPos = coordsToPercent(destinationPoint.lat, destinationPoint.lng);

  // Build SVG Polyline points string from routePolylinePath (or intermediate waypoints between origin & destination)
  const svgPolylinePoints =
    routePolylinePath && routePolylinePath.length > 1
      ? routePolylinePath
          .map((pt) => {
            const p = coordsToPercent(pt.lat, pt.lng);
            return `${p.x},${p.y}`;
          })
          .join(' ')
      : `${originPos.x},${originPos.y} ${(originPos.x + destPos.x) / 2 + 1.5},${(originPos.y + destPos.y) / 2 - 1.5} ${destPos.x},${destPos.y}`;

  // Filter preset landmarks visible in current scope
  const visiblePresets = Object.entries(PRESET_LOCATIONS).filter(([, loc]) =>
    mapZoomScope === 'CITY' ? loc.city === 'رأس غارب' : true
  );

  return (
    <div className="space-y-4">
      {/* Top Interactive Pin Selection Controller Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
            <MousePointerClick className="w-4 h-4 text-[#146EF5]" />
            <span>الحقل النشط لتحديد الدبوس على الخريطة:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectionMode('origin')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectionMode === 'origin'
                ? 'bg-[#18B981] text-white shadow-sm ring-2 ring-[#18B981]/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white text-[#18B981] flex items-center justify-center text-[11px] font-black shadow-2xs">
              A
            </span>
            <span>تحديد دبوس الانطلاق (الركوب)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectionMode('destination')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              selectionMode === 'destination'
                ? 'bg-[#DC2626] text-white shadow-sm ring-2 ring-[#DC2626]/30'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-white text-[#DC2626] flex items-center justify-center text-[11px] font-black shadow-2xs">
              B
            </span>
            <span>تحديد دبوس الوصول (الوجهة)</span>
          </button>

          <button
            type="button"
            onClick={handleSwapPoints}
            title="تبديل نقطتي الانطلاق والوصول"
            className="px-2.5 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#146EF5]" />
            <span>عكس الاتجاه</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-[#146EF5]/10 text-[#146EF5] hover:bg-[#146EF5]/20 border border-[#146EF5]/30 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'جاري تحديد الموقع...' : 'موقعي الحالي (GPS)'}</span>
          </button>

          <a
            href={googleMapsDeepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg text-xs font-bold bg-[#0B1F3A] text-white hover:bg-[#0B1F3A]/90 transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>فتح في خرائط Google</span>
          </a>
        </div>
      </div>

      {locationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{locationError}</span>
        </div>
      )}

      {/* Main Map Presentation: Either Live Google Maps SDK or Interactive Coordinate Map Canvas */}
      {apiKey ? (
        <GoogleMapLiveRoute
          apiKey={apiKey}
          origin={{ lat: originPoint.lat, lng: originPoint.lng }}
          destination={{ lat: destinationPoint.lat, lng: destinationPoint.lng }}
          originLabel={originPoint.address}
          destinationLabel={destinationPoint.address}
          directionsResult={directionsResult}
          routePolylinePath={routePolylinePath}
          selectionMode={selectionMode}
          onSelectionModeChange={(mode) => setSelectionMode(mode)}
          onMapReady={onMapReady}
          onMapClick={onMapClick}
          onSelectOrigin={(coords) => {
            if (onMapClick && selectionMode === 'origin') {
              onMapClick(coords);
              return;
            }
            const resolved = resolveLocationFromCoords(
              coords.lat,
              coords.lng,
              originPoint.city || 'رأس غارب'
            );
            onChangeOrigin(resolved);
          }}
          onSelectDestination={(coords) => {
            if (onMapClick && selectionMode === 'destination') {
              onMapClick(coords);
              return;
            }
            const resolved = resolveLocationFromCoords(
              coords.lat,
              coords.lng,
              destinationPoint.city || 'الغردقة'
            );
            onChangeDestination(resolved);
          }}
          onRouteCalculated={(dist, dur, details) => {
            setCalculatedRoute({
              distanceKm: dist,
              durationMins: dur,
              distanceText: details?.distanceText || `${dist} كم`,
              durationText:
                details?.durationText ||
                (dur >= 60 ? `${Math.floor(dur / 60)} ساعة و ${dur % 60} دقيقة` : `${dur} دقيقة`),
              summary: details?.summary,
              source: details?.source,
            });
            if (onRouteCalculated) onRouteCalculated(dist, dur, details);
          }}
        />
      ) : (
        <div className="space-y-3">
          {/* Interactive Clickable Map Canvas with Distinct Origin (A) & Destination (B) Pins and Polyline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Map Canvas Header & Scope Switcher */}
            <div className="px-4 py-2.5 bg-[#0B1F3A] text-white flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-[#18B981]" />
                <span className="font-bold">
                  {selectionMode === 'origin'
                    ? 'انقر في أي مكان على الخريطة لوضع دبوس الانطلاق (الأخضر A)'
                    : 'انقر في أي مكان على الخريطة لوضع دبوس الوصول (الأحمر B)'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMapZoomScope('CITY')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                    mapZoomScope === 'CITY'
                      ? 'bg-[#146EF5] text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <ZoomIn className="w-3 h-3" />
                  <span>خريطة أحياء رأس غارب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapZoomScope('REGIONAL')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                    mapZoomScope === 'REGIONAL'
                      ? 'bg-[#146EF5] text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>خريطة البحر الأحمر والمحافظات</span>
                </button>
              </div>
            </div>

            {/* Clickable Geographic Map Surface */}
            <div
              ref={mapSurfaceRef}
              onClick={handleCanvasMapClick}
              role="application"
              aria-label="خريطة تفاعلية لاختيار نقطتي الانطلاق والوصول بالضغط المباشر وعرض المسار Polyline"
              className="relative w-full h-[360px] sm:h-[420px] bg-[#E8EEF5] cursor-crosshair select-none overflow-hidden"
            >
              {/* Stylized Geographic Water, Coastal Roads & Route Polyline SVG Layer */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <defs>
                  <pattern id="mapGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path
                      d="M 10 0 L 0 0 0 10"
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="0.25"
                      strokeDasharray="1,1"
                    />
                  </pattern>
                </defs>

                {/* Base Terrain Grid */}
                <rect width="100" height="100" fill="url(#mapGrid)" />

                {/* Red Sea / Gulf of Suez Water Geometry */}
                {mapZoomScope === 'REGIONAL' ? (
                  <path
                    d="M 48 0 L 100 0 L 100 100 L 78 100 C 72 78, 65 55, 52 25 Z"
                    fill="#BAE6FD"
                    opacity="0.65"
                  />
                ) : (
                  <path
                    d="M 68 0 L 100 0 L 100 100 L 74 100 C 71 65, 70 35, 68 0 Z"
                    fill="#BAE6FD"
                    opacity="0.65"
                  />
                )}

                {/* Coastal Highway Network Lines */}
                {mapZoomScope === 'REGIONAL' ? (
                  <path
                    d="M 22 10 Q 48 22 65 44 T 86 74"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="1.2"
                    strokeDasharray="2,1"
                  />
                ) : (
                  <>
                    <path d="M 10 20 L 85 80" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
                    <path d="M 20 85 L 78 15" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                    <path d="M 5 50 L 90 50" fill="none" stroke="#CBD5E1" strokeWidth="1.2" />
                  </>
                )}

                {/* Active Driving Route Polyline between Origin Pin (A) and Destination Pin (B) */}
                <polyline
                  points={svgPolylinePoints}
                  fill="none"
                  stroke="#0B1F3A"
                  strokeWidth="1.8"
                  strokeOpacity="0.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points={svgPolylinePoints}
                  fill="none"
                  stroke="#146EF5"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Clickable Landmark Nodes on the Map */}
              {visiblePresets.map(([key, loc]) => {
                const pos = coordsToPercent(loc.lat, loc.lng);
                const isOrigin =
                  Math.abs(originPoint.lat - loc.lat) < 0.001 &&
                  Math.abs(originPoint.lng - loc.lng) < 0.001;
                const isDest =
                  Math.abs(destinationPoint.lat - loc.lat) < 0.001 &&
                  Math.abs(destinationPoint.lng - loc.lng) < 0.001;

                if (isOrigin || isDest) return null;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      if (selectionMode === 'origin') {
                        onChangeOrigin(loc);
                      } else {
                        onChangeDestination(loc);
                      }
                    }}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    title={`اضغط لتحديد: ${loc.city} - ${loc.address}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group/node cursor-pointer"
                  >
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 hover:bg-[#0B1F3A] text-[#0B1F3A] hover:text-white border border-slate-300 shadow-xs transition-all text-[10px] font-bold whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#146EF5]" />
                      <span>{mapZoomScope === 'CITY' ? loc.address.split(' - ')[0] : loc.city}</span>
                    </div>
                  </button>
                );
              })}

              {/* Distinct Origin Marker (Pin A - Green) */}
              <div
                style={{ left: `${originPos.x}%`, top: `${originPos.y}%` }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setSelectionMode('origin');
                }}
                className="absolute -translate-x-1/2 -translate-y-full z-20 flex flex-col items-center cursor-pointer transition-all duration-150"
              >
                <div className="mb-1 px-2.5 py-1 rounded-lg bg-[#0B1F3A] text-white text-[11px] font-bold shadow-lg border-2 border-[#18B981] whitespace-nowrap flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#18B981] text-white flex items-center justify-center text-[10px] font-black">
                    A
                  </span>
                  <span>الانطلاق: {originPoint.city}</span>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#18B981] border-2 border-white shadow-md flex items-center justify-center text-white">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="w-2.5 h-2.5 bg-[#0B1F3A] rotate-45 -mt-1.5 border-r border-b border-white" />
                </div>
              </div>

              {/* Distinct Destination Marker (Pin B - Red) */}
              <div
                style={{ left: `${destPos.x}%`, top: `${destPos.y}%` }}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setSelectionMode('destination');
                }}
                className="absolute -translate-x-1/2 -translate-y-full z-20 flex flex-col items-center cursor-pointer transition-all duration-150"
              >
                <div className="mb-1 px-2.5 py-1 rounded-lg bg-[#0B1F3A] text-white text-[11px] font-bold shadow-lg border-2 border-[#DC2626] whitespace-nowrap flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[10px] font-black">
                    B
                  </span>
                  <span>الوصول: {destinationPoint.city}</span>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#DC2626] border-2 border-white shadow-md flex items-center justify-center text-white">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div className="w-2.5 h-2.5 bg-[#0B1F3A] rotate-45 -mt-1.5 border-r border-b border-white" />
                </div>
              </div>

              {/* Bottom Map Overlay: Selected Pins Summary */}
              <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="bg-[#0B1F3A]/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl border border-white/15 shadow-lg text-xs flex flex-wrap items-center gap-3 pointer-events-auto">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#18B981] text-white flex items-center justify-center text-[10px] font-black">
                      A
                    </span>
                    <span className="text-slate-300">من:</span>
                    <span className="font-bold text-white truncate max-w-[160px]">
                      {originPoint.address}
                    </span>
                  </div>
                  <span className="text-slate-500">←</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[10px] font-black">
                      B
                    </span>
                    <span className="text-slate-300">إلى:</span>
                    <span className="font-bold text-white truncate max-w-[160px]">
                      {destinationPoint.address}
                    </span>
                  </div>
                </div>

                {calculatedRoute && (
                  <div className="bg-white/95 backdrop-blur-md text-[#0B1F3A] px-3.5 py-2 rounded-xl border border-slate-200 shadow-lg text-xs flex items-center gap-3 pointer-events-auto">
                    <div>
                      <span className="text-[10px] text-slate-500 block">المسافة بالكيلومترات</span>
                      <span className="font-black text-[#18B981] font-mono tabular-nums">
                        {calculatedRoute.distanceKm} كم
                      </span>
                    </div>
                    <div className="w-px h-6 bg-slate-200" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">المدة المتوقعة</span>
                      <span className="font-black text-[#146EF5] font-mono tabular-nums">
                        {calculatedRoute.durationText}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Landmark Selection Strip (Works alongside map clicking) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
            <Route className="w-3.5 h-3.5 text-[#146EF5]" />
            <span>
              أو اختر نقطة سريعة لوضع{' '}
              {selectionMode === 'origin' ? 'دبوس الانطلاق (A)' : 'دبوس الوصول (B)'}:
            </span>
          </span>
          <span className="text-[11px] text-[#6B7280]">
            تحديث فوري للدبوس ومسار Polyline على الخريطة
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(PRESET_LOCATIONS).map(([key, loc]) => {
            const isOriginSelected =
              Math.abs(originPoint.lat - loc.lat) < 0.001 &&
              Math.abs(originPoint.lng - loc.lng) < 0.001;
            const isDestSelected =
              Math.abs(destinationPoint.lat - loc.lat) < 0.001 &&
              Math.abs(destinationPoint.lng - loc.lng) < 0.001;

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (selectionMode === 'origin') {
                    onChangeOrigin(loc);
                  } else {
                    onChangeDestination(loc);
                  }
                }}
                className={`p-2 rounded-lg border text-right text-xs transition-all cursor-pointer ${
                  isOriginSelected
                    ? 'bg-[#18B981]/10 border-[#18B981] font-bold text-[#0B1F3A]'
                    : isDestSelected
                    ? 'bg-[#DC2626]/10 border-[#DC2626] font-bold text-[#0B1F3A]'
                    : 'bg-[#F7F9FC] border-slate-200 hover:border-[#146EF5] text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-[11px] truncate">{loc.city}</span>
                  {isOriginSelected && (
                    <span className="px-1.5 py-0.5 rounded bg-[#18B981] text-white text-[9px] font-black">
                      A الانطلاق
                    </span>
                  )}
                  {isDestSelected && (
                    <span className="px-1.5 py-0.5 rounded bg-[#DC2626] text-white text-[9px] font-black">
                      B الوصول
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{loc.address}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Distance & Duration Preview Badge */}
      {calculatedRoute && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">المسافة بالكيلومترات</span>
            <span className="text-sm font-extrabold text-[#0B1F3A] font-mono tabular-nums mt-0.5 block">
              {calculatedRoute.distanceKm} كم
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">المدة المتوقعة للرحلة</span>
            <span className="text-sm font-extrabold text-[#146EF5] font-mono tabular-nums mt-0.5 block">
              {calculatedRoute.durationText ||
                (calculatedRoute.durationMins >= 60
                  ? `${Math.floor(calculatedRoute.durationMins / 60)} ساعة و ${
                      calculatedRoute.durationMins % 60
                    } د`
                  : `${calculatedRoute.durationMins} دقيقة`)}
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">حالة المسار (Polyline)</span>
            <span className="text-sm font-bold text-[#18B981] flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              مرسوم على الخريطة
            </span>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">التوجيه الملاحي</span>
              <span className="text-[11px] font-bold text-[#0B1F3A] mt-0.5 block">
                Google Maps GPS
              </span>
            </div>
            <a
              href={googleMapsDeepLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-[#146EF5] text-white rounded text-[11px] font-bold hover:bg-[#146EF5]/90 flex items-center gap-1"
            >
              فتح <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
