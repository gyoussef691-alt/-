/// <reference types="@types/google.maps" />
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Navigation,
  ExternalLink,
  Loader2,
  Car,
  MousePointerClick,
} from 'lucide-react';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteCalculationData {
  distanceKm: number;
  durationMins: number;
  durationText?: string;
  distanceText?: string;
  summary?: string;
  source: 'DIRECTIONS_SERVICE' | 'ROUTES_API' | 'GEODESIC_FALLBACK';
  isCalculating: boolean;
}

export interface RouteDetails {
  distanceText?: string;
  durationText?: string;
  summary?: string;
  source?: 'DIRECTIONS_SERVICE' | 'ROUTES_API' | 'GEODESIC_FALLBACK';
  directionsResult?: google.maps.DirectionsResult;
  polylinePath?: Coordinates[];
}

export interface GoogleMapLiveRouteProps {
  apiKey: string;
  origin?: Coordinates | null;
  destination?: Coordinates | null;
  originLabel?: string;
  destinationLabel?: string;
  directionsResult?: google.maps.DirectionsResult | null;
  routePolylinePath?: Coordinates[];
  onSelectOrigin?: (coords: Coordinates, address?: string) => void;
  onSelectDestination?: (coords: Coordinates, address?: string) => void;
  onMapClick?: (coords: Coordinates, event?: google.maps.MapMouseEvent) => void;
  onMapReady?: (map: google.maps.Map | null) => void;
  onRouteCalculated?: (distanceKm: number, durationMins: number, details?: RouteDetails) => void;
  selectionMode?: 'origin' | 'destination' | 'none';
  onSelectionModeChange?: (mode: 'origin' | 'destination') => void;
  interactive?: boolean;
}

// Haversine fallback estimate for Ras Gharib & Egyptian coastal corridors
function fallbackDrivingEstimate(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceKm: number; durationMins: number } {
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
  const directDistance = R * c;

  const roadMultiplier = directDistance > 50 ? 1.22 : 1.35;
  const distanceKm = Math.round(directDistance * roadMultiplier * 10) / 10;
  const avgSpeed = directDistance > 30 ? 80 : 35;
  const durationMins = Math.round((distanceKm / avgSpeed) * 60);

  return { distanceKm, durationMins };
}

// Inner helper component to calculate and render routes using google.maps.DirectionsService and Polyline
const LiveRouteCalculator: React.FC<{
  origin: Coordinates | null;
  destination: Coordinates | null;
  externalDirectionsResult?: google.maps.DirectionsResult | null;
  externalPolylinePath?: Coordinates[];
  onRouteCalculated?: (distanceKm: number, durationMins: number, details?: RouteDetails) => void;
  onStatusChange: (data: RouteCalculationData) => void;
}> = ({
  origin,
  destination,
  externalDirectionsResult,
  externalPolylinePath,
  onRouteCalculated,
  onStatusChange,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const geometryLib = useMapsLibrary('geometry');

  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  // Clear any existing polylines or rendered directions
  const clearMapRoute = useCallback(() => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
  }, []);

  // Helper to draw a styled dual-stroke Polyline on the Google Map instance
  const renderRoutePolyline = useCallback(
    (pathCoords: Array<google.maps.LatLng | Coordinates>, routeBounds?: google.maps.LatLngBounds | null) => {
      if (!map || pathCoords.length === 0) return;

      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];

      const outerPolyline = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#0B1F3A',
        strokeOpacity: 0.35,
        strokeWeight: 8,
        map,
      });

      const innerPolyline = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: '#146EF5',
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map,
      });

      polylinesRef.current = [outerPolyline, innerPolyline];

      if (routeBounds) {
        map.fitBounds(routeBounds, { top: 60, bottom: 90, left: 50, right: 50 });
      } else {
        const bounds = new google.maps.LatLngBounds();
        pathCoords.forEach((pt) => {
          if (pt instanceof google.maps.LatLng) {
            bounds.extend(pt);
          } else {
            bounds.extend(new google.maps.LatLng(pt.lat, pt.lng));
          }
        });
        map.fitBounds(bounds, { top: 60, bottom: 90, left: 50, right: 50 });
      }
    },
    [map]
  );

  useEffect(() => {
    return () => {
      clearMapRoute();
    };
  }, [clearMapRoute]);

  // If PassengerArea already computed a DirectionsResult or Polyline path, render it immediately
  useEffect(() => {
    if (!map) return;
    if (externalDirectionsResult && externalDirectionsResult.routes?.[0]) {
      const route = externalDirectionsResult.routes[0];
      const leg = route.legs?.[0];
      const overviewPath = route.overview_path || [];

      if (overviewPath.length > 0) {
        renderRoutePolyline(overviewPath, route.bounds);
      } else if (externalPolylinePath && externalPolylinePath.length > 0) {
        renderRoutePolyline(externalPolylinePath, route.bounds);
      }

      if (leg) {
        const distanceKm = Math.max(0.5, Math.round(((leg.distance?.value || 0) / 1000) * 10) / 10);
        const durationMins = Math.max(1, Math.round((leg.duration?.value || 0) / 60));
        onStatusChange({
          distanceKm,
          durationMins,
          distanceText: leg.distance?.text || `${distanceKm} كم`,
          durationText: leg.duration?.text || `${durationMins} دقيقة`,
          summary: route.summary,
          source: 'DIRECTIONS_SERVICE',
          isCalculating: false,
        });
      }
    }
  }, [map, externalDirectionsResult, externalPolylinePath, renderRoutePolyline, onStatusChange]);

  useEffect(() => {
    if (!routesLib || !map) return;
    if (!origin || !destination) {
      clearMapRoute();
      return;
    }

    let isSubscribed = true;

    // Helper: Geodesic fallback calculation
    const applyGeodesicFallback = () => {
      if (!isSubscribed) return;
      const fallback = fallbackDrivingEstimate(
        origin.lat,
        origin.lng,
        destination.lat,
        destination.lng
      );

      const fallbackCoords: Coordinates[] = [
        { lat: origin.lat, lng: origin.lng },
        { lat: destination.lat, lng: destination.lng },
      ];
      renderRoutePolyline(fallbackCoords);

      const resultData: RouteCalculationData = {
        distanceKm: fallback.distanceKm,
        durationMins: fallback.durationMins,
        distanceText: `${fallback.distanceKm} كم`,
        durationText:
          fallback.durationMins >= 60
            ? `${Math.floor(fallback.durationMins / 60)} ساعة و ${fallback.durationMins % 60} دقيقة`
            : `${fallback.durationMins} دقيقة`,
        source: 'GEODESIC_FALLBACK',
        isCalculating: false,
      };

      onStatusChange(resultData);
      onRouteCalculated?.(fallback.distanceKm, fallback.durationMins, {
        distanceText: resultData.distanceText,
        durationText: resultData.durationText,
        source: 'GEODESIC_FALLBACK',
        polylinePath: fallbackCoords,
      });
    };

    // Helper: Modern Routes API fallback (computeRoutes)
    const tryRoutesApi = async () => {
      try {
        const routeClass = (routesLib as any).Route;
        if (routeClass && typeof routeClass.computeRoutes === 'function') {
          const request = {
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            travelMode: (routesLib as any).TravelMode?.DRIVING || 'DRIVING',
            fields: ['path', 'polyline', 'distanceMeters', 'duration', 'durationMillis', 'viewport', 'legs'],
          };

          const response = await routeClass.computeRoutes(request);
          if (!isSubscribed) return;

          if (response?.routes && response.routes.length > 0) {
            const primaryRoute = response.routes[0];

            let distanceMeters = primaryRoute.distanceMeters || 0;
            let durationSeconds = 0;

            if (typeof primaryRoute.duration === 'string') {
              durationSeconds = parseInt(primaryRoute.duration.replace('s', ''), 10) || 0;
            } else if (primaryRoute.durationMillis) {
              durationSeconds = Math.round(primaryRoute.durationMillis / 1000);
            } else if (primaryRoute.legs?.[0]?.duration?.seconds) {
              durationSeconds = primaryRoute.legs[0].duration.seconds;
            }

            if (!distanceMeters && primaryRoute.legs?.[0]?.distanceMeters) {
              distanceMeters = primaryRoute.legs[0].distanceMeters;
            }

            const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
            const durationMins = Math.max(1, Math.round(durationSeconds / 60));

            let routePath: google.maps.LatLng[] = [];
            if (primaryRoute.polyline?.encodedPolyline && routeClass.decode) {
              routePath = routeClass.decode(primaryRoute.polyline.encodedPolyline);
            } else if (primaryRoute.path) {
              routePath = primaryRoute.path;
            }

            if (routePath.length > 0) {
              const viewportBounds = primaryRoute.viewport
                ? new google.maps.LatLngBounds(
                    primaryRoute.viewport.southwest,
                    primaryRoute.viewport.northeast
                  )
                : null;
              renderRoutePolyline(routePath, viewportBounds);
            }

            const distanceText = `${distanceKm} كم`;
            const durationText =
              durationMins >= 60
                ? `${Math.floor(durationMins / 60)} ساعة و ${durationMins % 60} دقيقة`
                : `${durationMins} دقيقة`;

            const resultData: RouteCalculationData = {
              distanceKm,
              durationMins,
              distanceText,
              durationText,
              source: 'ROUTES_API',
              isCalculating: false,
            };

            onStatusChange(resultData);
            onRouteCalculated?.(distanceKm, durationMins, {
              distanceText,
              durationText,
              source: 'ROUTES_API',
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Routes API computeRoutes attempt deferred to fallback:', err);
      }

      applyGeodesicFallback();
    };

    const computeDrivingRoute = async () => {
      clearMapRoute();
      onStatusChange({
        distanceKm: 0,
        durationMins: 0,
        source: 'DIRECTIONS_SERVICE',
        isCalculating: true,
      });

      // 1. Call google.maps.DirectionsService and draw the Polyline from DirectionsResult
      try {
        const DirectionsServiceCtor =
          routesLib.DirectionsService || window.google?.maps?.DirectionsService;

        if (typeof DirectionsServiceCtor === 'function') {
          const directionsService = new DirectionsServiceCtor();

          directionsService.route(
            {
              origin: { lat: origin.lat, lng: origin.lng },
              destination: { lat: destination.lat, lng: destination.lng },
              travelMode: google.maps.TravelMode.DRIVING,
              region: 'EG',
            },
            (result, status) => {
              if (!isSubscribed) return;

              if (status === 'OK' && result && result.routes?.[0]) {
                const route = result.routes[0];
                const leg = route.legs?.[0];
                const overviewPath = route.overview_path || [];

                // Render the route Polyline directly on the map
                if (overviewPath.length > 0) {
                  renderRoutePolyline(overviewPath, route.bounds);
                }

                const extractedCoords: Coordinates[] = overviewPath.map((pt) => ({
                  lat: pt.lat(),
                  lng: pt.lng(),
                }));

                if (leg) {
                  const distanceMeters = leg.distance?.value || 0;
                  const durationSeconds = leg.duration?.value || 0;
                  const distanceKm = Math.max(0.5, Math.round((distanceMeters / 1000) * 10) / 10);
                  const durationMins = Math.max(1, Math.round(durationSeconds / 60));

                  const resultData: RouteCalculationData = {
                    distanceKm,
                    durationMins,
                    distanceText: leg.distance?.text || `${distanceKm} كم`,
                    durationText:
                      leg.duration?.text ||
                      (durationMins >= 60
                        ? `${Math.floor(durationMins / 60)} ساعة و ${durationMins % 60} دقيقة`
                        : `${durationMins} دقيقة`),
                    summary: route.summary,
                    source: 'DIRECTIONS_SERVICE',
                    isCalculating: false,
                  };

                  onStatusChange(resultData);
                  onRouteCalculated?.(distanceKm, durationMins, {
                    distanceText: resultData.distanceText,
                    durationText: resultData.durationText,
                    summary: route.summary,
                    source: 'DIRECTIONS_SERVICE',
                    directionsResult: result,
                    polylinePath: extractedCoords,
                  });
                  return;
                }
              }

              // If DirectionsService returned non-OK or failed, try modern Routes API
              tryRoutesApi();
            }
          );
          return;
        }
      } catch (directionsErr) {
        console.warn('Google DirectionsService initialization failed, falling back to Routes API:', directionsErr);
      }

      tryRoutesApi();
    };

    computeDrivingRoute();

    return () => {
      isSubscribed = false;
    };
  }, [
    routesLib,
    geometryLib,
    map,
    origin?.lat,
    origin?.lng,
    destination?.lat,
    destination?.lng,
    onRouteCalculated,
    onStatusChange,
    clearMapRoute,
    renderRoutePolyline,
  ]);

  return null;
};

// Map click controller for exposing map instance to PassengerArea or handling clicks directly
const MapClickHandler: React.FC<{
  selectionMode: 'origin' | 'destination' | 'none';
  onSelectOrigin?: (coords: Coordinates) => void;
  onSelectDestination?: (coords: Coordinates) => void;
  onMapClick?: (coords: Coordinates, event?: google.maps.MapMouseEvent) => void;
  onMapReady?: (map: google.maps.Map | null) => void;
}> = ({ selectionMode, onSelectOrigin, onSelectDestination, onMapClick, onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    onMapReady?.(map);
    return () => {
      onMapReady?.(null);
    };
  }, [map, onMapReady]);

  useEffect(() => {
    if (!map || selectionMode === 'none') return;

    map.setOptions({
      draggableCursor: 'crosshair',
    });

    // If parent component (PassengerArea) attaches its own map.addListener('click') via onMapReady, avoid duplicate firing
    if (onMapReady) {
      return () => {
        map.setOptions({
          draggableCursor: undefined,
        });
      };
    }

    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      if (onMapClick) {
        onMapClick(coords, e);
      } else if (selectionMode === 'origin' && onSelectOrigin) {
        onSelectOrigin(coords);
      } else if (selectionMode === 'destination' && onSelectDestination) {
        onSelectDestination(coords);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
      map.setOptions({
        draggableCursor: undefined,
      });
    };
  }, [map, selectionMode, onSelectOrigin, onSelectDestination, onMapClick, onMapReady]);

  return null;
};

export const GoogleMapLiveRoute: React.FC<GoogleMapLiveRouteProps> = ({
  apiKey,
  origin,
  destination,
  originLabel,
  destinationLabel,
  directionsResult,
  routePolylinePath,
  onSelectOrigin,
  onSelectDestination,
  onMapClick,
  onMapReady,
  onRouteCalculated,
  selectionMode = 'none',
  onSelectionModeChange,
  interactive = true,
}) => {
  // Center of Ras Gharib by default
  const defaultCenter = { lat: 28.3589, lng: 33.0789 };

  const [routeData, setRouteData] = useState<RouteCalculationData | null>(null);
  const [activeInfoPin, setActiveInfoPin] = useState<'origin' | 'destination' | null>(null);

  // Google Maps Deep Link URL for turn-by-turn navigation
  const navigationDeepLink =
    origin && destination
      ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
          `${origin.lat},${origin.lng}`
        )}&destination=${encodeURIComponent(`${destination.lat},${destination.lng}`)}&travelmode=driving`
      : '';

  return (
    <div className="relative w-full h-[400px] sm:h-[460px] rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
      {/* Interactive Top Floating Mode Selector inside Map */}
      {interactive && selectionMode !== 'none' && (
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="bg-[#0B1F3A]/95 backdrop-blur-md text-white px-3 py-2 rounded-xl border border-white/15 shadow-lg flex items-center gap-2 text-xs pointer-events-auto">
            <MousePointerClick className="w-4 h-4 text-[#18B981] shrink-0" />
            <span>
              {selectionMode === 'origin'
                ? 'الحقل النشط: الانطلاق (A) — اضغط على الخريطة لالتقاط الإحداثيات ووضع الدبوس'
                : 'الحقل النشط: الوصول (B) — اضغط على الخريطة لالتقاط الإحداثيات ووضع الدبوس'}
            </span>
          </div>

          {onSelectionModeChange && (
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-lg pointer-events-auto">
              <button
                type="button"
                onClick={() => onSelectionModeChange('origin')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectionMode === 'origin'
                    ? 'bg-[#18B981] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>دبوس الانطلاق (A)</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectionModeChange('destination')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectionMode === 'destination'
                    ? 'bg-[#DC2626] text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>دبوس الوصول (B)</span>
              </button>
            </div>
          )}
        </div>
      )}

      <APIProvider apiKey={apiKey} libraries={['maps', 'marker', 'routes', 'geometry']}>
        <Map
          defaultCenter={origin || defaultCenter}
          defaultZoom={origin ? 13 : 11}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling={interactive ? 'greedy' : 'none'}
          disableDefaultUI={!interactive}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Real Route Calculator and Polyline Renderer (DirectionsService / DirectionsResult) */}
          <LiveRouteCalculator
            origin={origin || null}
            destination={destination || null}
            externalDirectionsResult={directionsResult}
            externalPolylinePath={routePolylinePath}
            onRouteCalculated={onRouteCalculated}
            onStatusChange={(data) => setRouteData(data)}
          />

          {/* Interactive Click Handler */}
          {interactive && (
            <MapClickHandler
              selectionMode={selectionMode}
              onSelectOrigin={onSelectOrigin}
              onSelectDestination={onSelectDestination}
              onMapClick={onMapClick}
              onMapReady={onMapReady}
            />
          )}

          {/* Distinct Pickup Marker (Origin - Pin A) */}
          {origin && (
            <AdvancedMarker
              position={origin}
              title="نقطة الانطلاق (الركوب) - اسحب الدبوس أو اضغط على الخريطة لتعديل الموقع"
              draggable={interactive}
              onClick={() => setActiveInfoPin('origin')}
              onDragEnd={(e) => {
                if (e.latLng && onSelectOrigin) {
                  onSelectOrigin({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                }
              }}
            >
              <div className="flex flex-col items-center group/pin cursor-pointer">
                <div className="mb-1 px-2.5 py-1 rounded-lg bg-[#0B1F3A] text-white text-[11px] font-bold shadow-md border border-[#18B981] whitespace-nowrap flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#18B981] text-white flex items-center justify-center text-[10px] font-black">
                    A
                  </span>
                  <span>نقطة الانطلاق</span>
                  {originLabel && (
                    <span className="text-emerald-300 font-normal max-w-[130px] truncate">
                      ({originLabel})
                    </span>
                  )}
                </div>
                <Pin
                  background="#18B981"
                  glyphColor="#FFFFFF"
                  borderColor="#0B1F3A"
                  scale={1.3}
                />
              </div>
            </AdvancedMarker>
          )}

          {/* Distinct Drop-off Marker (Destination - Pin B) */}
          {destination && (
            <AdvancedMarker
              position={destination}
              title="نقطة الوصول (النزول) - اسحب الدبوس أو اضغط على الخريطة لتعديل الموقع"
              draggable={interactive}
              onClick={() => setActiveInfoPin('destination')}
              onDragEnd={(e) => {
                if (e.latLng && onSelectDestination) {
                  onSelectDestination({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                }
              }}
            >
              <div className="flex flex-col items-center group/pin cursor-pointer">
                <div className="mb-1 px-2.5 py-1 rounded-lg bg-[#0B1F3A] text-white text-[11px] font-bold shadow-md border border-[#DC2626] whitespace-nowrap flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[10px] font-black">
                    B
                  </span>
                  <span>نقطة الوصول</span>
                  {destinationLabel && (
                    <span className="text-rose-300 font-normal max-w-[130px] truncate">
                      ({destinationLabel})
                    </span>
                  )}
                </div>
                <Pin
                  background="#DC2626"
                  glyphColor="#FFFFFF"
                  borderColor="#0B1F3A"
                  scale={1.3}
                />
              </div>
            </AdvancedMarker>
          )}

          {/* Optional InfoWindow when clicking a marker */}
          {activeInfoPin === 'origin' && origin && (
            <InfoWindow
              position={origin}
              onCloseClick={() => setActiveInfoPin(null)}
            >
              <div dir="rtl" className="p-1 text-xs space-y-1">
                <div className="font-bold text-[#18B981]">دبوس نقطة الانطلاق (A)</div>
                <div className="text-slate-700 font-medium">{originLabel || 'موقع الركوب المحدد'}</div>
                <div className="text-[10px] text-slate-500 font-mono" dir="ltr">
                  {origin.lat.toFixed(5)}, {origin.lng.toFixed(5)}
                </div>
              </div>
            </InfoWindow>
          )}

          {activeInfoPin === 'destination' && destination && (
            <InfoWindow
              position={destination}
              onCloseClick={() => setActiveInfoPin(null)}
            >
              <div dir="rtl" className="p-1 text-xs space-y-1">
                <div className="font-bold text-[#DC2626]">دبوس نقطة الوصول (B)</div>
                <div className="text-slate-700 font-medium">{destinationLabel || 'موقع الوصول المحدد'}</div>
                <div className="text-[10px] text-slate-500 font-mono" dir="ltr">
                  {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Floating Route Calculation Badge over Map */}
      {origin && destination && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-10">
          <div className="bg-[#0B1F3A]/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-xl border border-white/20 shadow-lg text-xs transition-all">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Car className="w-4 h-4 text-[#146EF5]" />
                <span>مسار القيادة الفعلي (Polyline Route)</span>
              </div>

              {routeData?.isCalculating ? (
                <div className="flex items-center gap-1.5 text-blue-300 text-[11px] font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري حساب المسار...</span>
                </div>
              ) : (
                <span className="text-[10px] text-blue-200 font-medium">
                  {routeData?.source === 'DIRECTIONS_SERVICE'
                    ? 'DirectionsResult Polyline'
                    : routeData?.source === 'ROUTES_API'
                    ? 'Google Routes API'
                    : 'حساب مسار بري'}
                </span>
              )}
            </div>

            {routeData && !routeData.isCalculating && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 mb-2">
                <div>
                  <span className="text-[10px] text-slate-300 block">المسافة بالكيلومترات:</span>
                  <span className="text-base font-black text-[#18B981] font-mono tabular-nums">
                    {routeData.distanceKm} كم
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-300 block">المدة المتوقعة للرحلة:</span>
                  <span className="text-base font-black text-[#146EF5] font-mono tabular-nums">
                    {routeData.durationText ||
                      (routeData.durationMins >= 60
                        ? `${Math.floor(routeData.durationMins / 60)} س و ${
                            routeData.durationMins % 60
                          } د`
                        : `${routeData.durationMins} دقيقة`)}
                  </span>
                </div>
              </div>
            )}

            {navigationDeepLink && (
              <a
                href={navigationDeepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-1 py-1.5 px-3 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white rounded-lg font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>بدء التوجيه الملاحي في Google Maps</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
