import React from 'react';
import { MapPin, Navigation, ExternalLink, Route, Clock } from 'lucide-react';
import { GoogleMapLiveRoute } from './GoogleMapLiveRoute';

interface DriverRouteViewerProps {
  originAddress: string;
  destinationAddress: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  routeDistanceKm?: number;
  routeDurationMins?: number;
  showMap?: boolean;
}

export const DriverRouteViewer: React.FC<DriverRouteViewerProps> = ({
  originAddress,
  destinationAddress,
  originLat,
  originLng,
  destLat,
  destLng,
  routeDistanceKm,
  routeDurationMins,
  showMap = true,
}) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';

  // Fallback coords if not provided: Ras Gharib to Hurghada
  const startLat = originLat || 28.3589;
  const startLng = originLng || 33.0789;
  const endLat = destLat || 27.2579;
  const endLng = destLng || 33.8116;

  const navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    `${startLat},${startLng}`
  )}&destination=${encodeURIComponent(`${endLat},${endLng}`)}&travelmode=driving`;

  const [liveDistKm, setLiveDistKm] = React.useState<number | undefined>(routeDistanceKm);
  const [liveDurMins, setLiveDurMins] = React.useState<number | undefined>(routeDurationMins);

  React.useEffect(() => {
    if (routeDistanceKm) setLiveDistKm(routeDistanceKm);
    if (routeDurationMins) setLiveDurMins(routeDurationMins);
  }, [routeDistanceKm, routeDurationMins]);

  return (
    <div className="bg-[#F7F9FC] border border-slate-200 rounded-xl p-4 text-xs space-y-3">
      {/* Route Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-[#146EF5]" />
          <span className="font-bold text-[#0B1F3A]">بيانات المسار والملاحة المباشرة:</span>
        </div>

        <a
          href={navigationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#146EF5] hover:bg-[#146EF5]/90 text-white font-bold rounded-lg text-xs transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>فتح في خرائط Google للملاحة (Turn-by-Turn)</span>
          <ExternalLink className="w-3 h-3 opacity-80" />
        </a>
      </div>

      {/* Coordinate & Distance Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
          <div className="flex items-center gap-1 text-[11px] text-[#18B981] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#18B981]" />
            <span>نقطة التحرك (الركوب)</span>
          </div>
          <span className="font-semibold text-[#111827] block truncate mt-1">
            {originAddress}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {startLat.toFixed(4)}, {startLng.toFixed(4)}
          </span>
        </div>

        <div className="p-2.5 bg-white rounded-lg border border-slate-200">
          <div className="flex items-center gap-1 text-[11px] text-[#DC2626] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
            <span>نقطة الوصول (النزول)</span>
          </div>
          <span className="font-semibold text-[#111827] block truncate mt-1">
            {destinationAddress}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {endLat.toFixed(4)}, {endLng.toFixed(4)}
          </span>
        </div>

        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-around">
          <div>
            <span className="text-[10px] text-slate-500 block">المسافة الفعلية</span>
            <span className="text-sm font-bold text-[#0B1F3A] font-mono">
              {liveDistKm ? `${liveDistKm} كم` : '150 كم (تقريبي)'}
            </span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div>
            <span className="text-[10px] text-slate-500 block">زمن القيادة</span>
            <span className="text-sm font-bold text-[#146EF5] font-mono">
              {liveDurMins ? (
                liveDurMins >= 60 ? (
                  `${Math.floor(liveDurMins / 60)} س و ${liveDurMins % 60} د`
                ) : (
                  `~${liveDurMins} دقيقة`
                )
              ) : (
                '~1.5 ساعة'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Embedded Live Map if API key is configured and showMap is true */}
      {showMap && apiKey && (
        <div className="mt-2 rounded-lg overflow-hidden border border-slate-200">
          <GoogleMapLiveRoute
            apiKey={apiKey}
            origin={{ lat: startLat, lng: startLng }}
            destination={{ lat: endLat, lng: endLng }}
            onRouteCalculated={(dist, dur) => {
              setLiveDistKm(dist);
              setLiveDurMins(dur);
            }}
            interactive={true}
          />
        </div>
      )}
    </div>
  );
};
