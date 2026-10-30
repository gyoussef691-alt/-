// Source: Google Maps Platform Code Assist
/// <reference types="@types/google.maps" />
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Loader, setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { AlertTriangle, KeyRound, RefreshCw, Loader2, ExternalLink, ShieldCheck } from 'lucide-react';

export type GoogleMapsLibrary =
  | 'maps'
  | 'marker'
  | 'places'
  | 'routes'
  | 'geocoding'
  | 'geometry'
  | 'elevation'
  | 'streetView'
  | 'journeySharing';

export interface GoogleMapLoaderContextValue {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  google: typeof window.google | null;
  reload: () => void;
  apiKey: string;
}

const GoogleMapLoaderContext = createContext<GoogleMapLoaderContextValue | null>(null);

export const useGoogleMapLoader = (): GoogleMapLoaderContextValue => {
  const context = useContext(GoogleMapLoaderContext);
  if (!context) {
    throw new Error('useGoogleMapLoader must be used within a <GoogleMapLoader>');
  }
  return context;
};

export interface GoogleMapLoaderProps {
  /**
   * Optional Google Maps API key override.
   * If not provided, falls back to `import.meta.env.VITE_GOOGLE_MAPS_API_KEY`.
   */
  apiKey?: string;
  /**
   * Libraries to load dynamically (e.g. ['maps', 'marker', 'places', 'routes']).
   * Defaults to ['maps', 'marker', 'places', 'routes'].
   */
  libraries?: GoogleMapsLibrary[];
  /**
   * Version of the Google Maps JS API. Defaults to 'weekly'.
   */
  version?: string;
  /**
   * Map language. Defaults to 'ar' (Arabic) for Ras Gharib Mobility.
   */
  language?: string;
  /**
   * Map region bias. Defaults to 'EG' (Egypt).
   */
  region?: string;
  /**
   * Optional Map IDs for Advanced Markers styling.
   */
  mapIds?: string[];
  /**
   * Content to render once the Google Maps API has successfully loaded.
   * Can be standard React nodes or a render function receiving the loader context.
   */
  children?:
    | React.ReactNode
    | ((context: GoogleMapLoaderContextValue) => React.ReactNode);
  /**
   * Custom fallback to display when API key is missing or invalid.
   */
  renderMissingKey?: () => React.ReactNode;
  /**
   * Custom loading indicator component.
   */
  renderLoading?: () => React.ReactNode;
  /**
   * Custom error component when loading fails.
   */
  renderError?: (error: string, retry: () => void) => React.ReactNode;
  /**
   * Optional callback triggered when Google Maps finishes loading.
   */
  onLoad?: (google: typeof window.google) => void;
  /**
   * Optional callback triggered when an error occurs.
   */
  onError?: (error: Error | string) => void;
}

// Module-level guard to ensure setOptions is executed once per session
let optionsConfigured = false;

export const GoogleMapLoader: React.FC<GoogleMapLoaderProps> = ({
  apiKey: propApiKey,
  libraries = ['maps', 'marker', 'places', 'routes'],
  version = 'weekly',
  language = 'ar',
  region = 'EG',
  mapIds = ['DEMO_MAP_ID'],
  children,
  renderMissingKey,
  renderLoading,
  renderError,
  onLoad,
  onError,
}) => {
  // Resolve effective API key from prop or Vite environment variables
  const envApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';
  const effectiveApiKey = (propApiKey || envApiKey).trim();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(() => {
    return Boolean(typeof window !== 'undefined' && window.google?.maps?.Map);
  });
  const [error, setError] = useState<string | null>(null);
  const [googleInstance, setGoogleInstance] = useState<typeof window.google | null>(() => {
    return typeof window !== 'undefined' && window.google ? window.google : null;
  });
  const [retryCount, setRetryCount] = useState<number>(0);

  const reload = useCallback(() => {
    setError(null);
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    // 1. Missing Key Validation
    if (!effectiveApiKey) {
      setIsLoading(false);
      setIsLoaded(false);
      setError('MISSING_API_KEY');
      return;
    }

    // 2. Check if already loaded in window
    if (window.google?.maps?.Map) {
      setIsLoaded(true);
      setIsLoading(false);
      setError(null);
      setGoogleInstance(window.google);
      onLoad?.(window.google);
      return;
    }

    let isSubscribed = true;
    setIsLoading(true);
    setError(null);

    // Set up auth failure listener
    const origAuthFailure = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
    (window as unknown as { gm_authFailure: () => void }).gm_authFailure = () => {
      const authErrMsg = 'فشل التحقق من مفتاح Google Maps API (gm_authFailure). يرجى التحقق من صحة المفتاح وقيود النطاق وربط الفوترة.';
      if (isSubscribed) {
        setError(authErrMsg);
        setIsLoading(false);
        onError?.(new Error(authErrMsg));
      }
      if (typeof origAuthFailure === 'function') {
        origAuthFailure();
      }
    };

    const loadGoogleMaps = async () => {
      try {
        if (!optionsConfigured && !window.google?.maps?.importLibrary) {
          setOptions({
            key: effectiveApiKey,
            v: version,
            libraries: libraries as string[],
            language,
            region,
            solutionChannel: 'gmp_mcp_codeassist_v1_aistudio',
            mapIds,
          });
          optionsConfigured = true;
        }

        // Dynamically import required libraries
        await Promise.all(
          libraries.map((lib) => importLibrary(lib as keyof google.maps.ImportLibraryMap))
        );

        if (!isSubscribed) return;

        if (window.google) {
          setGoogleInstance(window.google);
          setIsLoaded(true);
          setIsLoading(false);
          setError(null);
          onLoad?.(window.google);
        } else {
          throw new Error('لم يتم العثور على كائن window.google بعد انتهاء التحميل.');
        }
      } catch (err) {
        if (!isSubscribed) return;
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error('[@googlemaps/js-api-loader] Failed to load Google Maps API:', err);
        setError(errMsg);
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(errMsg));
      }
    };

    loadGoogleMaps();

    return () => {
      isSubscribed = false;
    };
  }, [effectiveApiKey, retryCount, language, region, version, libraries, mapIds, onLoad, onError]);

  const contextValue: GoogleMapLoaderContextValue = {
    isLoaded,
    isLoading,
    error,
    google: googleInstance,
    reload,
    apiKey: effectiveApiKey,
  };

  // 1. Missing API Key state
  if (!effectiveApiKey) {
    if (renderMissingKey) {
      return <>{renderMissingKey()}</>;
    }
    return (
      <div
        dir="rtl"
        className="bg-amber-50/90 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-amber-950 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700 shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-bold text-base text-[#0B1F3A]">
                مطلوب إعداد مفتاح واجهة خرائط Google (Google Maps API Key)
              </h3>
              <span className="text-xs bg-amber-200/90 text-amber-900 px-2.5 py-1 rounded-md font-mono font-bold">
                VITE_GOOGLE_MAPS_API_KEY
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              يقوم مكوّن <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">GoogleMapLoader</code> بتحميل مكتبات Google Maps JavaScript API ديناميكياً عبر حزمة <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">@googlemaps/js-api-loader</code>، ولكنه يتطلب تفعيل متغير البيئة.
            </p>

            <div className="bg-white/90 p-4 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-2 mt-3">
              <span className="font-bold text-[#0B1F3A] block">
                كيفية تفعيل الخريطة الرسمية:
              </span>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                <li>
                  أنشئ مشروعاً في{' '}
                  <a
                    href="https://console.cloud.google.com/google/maps-apis"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#146EF5] font-bold underline inline-flex items-center gap-1"
                  >
                    Google Cloud Console <ExternalLink className="w-3 h-3 inline" />
                  </a>
                </li>
                <li>
                  فعّل واجهات البرمجة الأساسية:{' '}
                  <strong>Maps JavaScript API</strong>، و<strong>Places API (New)</strong>، و<strong>Routes API</strong>.
                </li>
                <li>
                  أضف المتغير إلى ملف <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">.env</code>:
                  <div className="mt-1.5 p-2 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg select-all text-left" dir="ltr">
                    VITE_GOOGLE_MAPS_API_KEY=AIzaSy...
                  </div>
                </li>
              </ol>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-amber-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#18B981] shrink-0" />
              <span>
                يدعم التطبيق التوجيه المباشر، وتحديد المواقع في رأس غارب ومحافظة البحر الأحمر.
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (isLoading) {
    if (renderLoading) {
      return <>{renderLoading()}</>;
    }
    return (
      <div
        dir="rtl"
        className="min-h-[260px] bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3"
      >
        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#146EF5] animate-spin">
          <Loader2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-[#0B1F3A]">جاري تحميل خرائط Google...</h4>
          <p className="text-xs text-slate-500 mt-1">
            يتم الاتصال بـ Google Maps JavaScript API وتفعيل ميزات التوجيه والمواقع.
          </p>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error) {
    if (renderError) {
      return <>{renderError(error, reload)}</>;
    }
    return (
      <div
        dir="rtl"
        className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-950 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shrink-0 text-red-600 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-2">
            <h4 className="font-bold text-sm text-red-900">
              تعذر تحميل خدمة خرائط Google
            </h4>
            <p className="text-xs text-red-800 leading-relaxed font-mono bg-white/70 p-2.5 rounded-lg border border-red-200 text-left" dir="ltr">
              {error}
            </p>
            <p className="text-xs text-red-700">
              يرجى التأكد من اتصال الإنترنت وصلاحية مفتاح API ومطابقة قيود النطاق المسموح بها في Google Cloud Console.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={reload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Loaded State
  return (
    <GoogleMapLoaderContext.Provider value={contextValue}>
      {typeof children === 'function' ? children(contextValue) : children}
    </GoogleMapLoaderContext.Provider>
  );
};

export { Loader };
export default GoogleMapLoader;
