import { useEffect, useRef } from 'react';

// --- AMap Type Definitions ---
interface AMapControl { _opaque: never; }

interface AMapMap {
  destroy: () => void;
  addControl: (control: AMapControl) => void;
}

interface AMapMarkerOptions {
  position: [number, number];
  title: string;
  map: AMapMap;
  animation: string;
}

interface AMapToolbarOptions {
  position: {
    top: string;
    right: string;
  };
}

interface AMapStatic {
  Map: new (container: string | HTMLDivElement, opts?: Record<string, unknown>) => AMapMap;
  Marker: new (opts: AMapMarkerOptions) => unknown;
  Scale: new () => AMapControl;
  ToolBar: new (opts?: AMapToolbarOptions) => AMapControl;
}

declare global {
  interface Window {
    AMap?: AMapStatic;
  }
}
// --- End of AMap Type Definitions ---

interface MapCNProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  showMarker?: boolean;
  markerTitle?: string;
}

export default function MapCN({
  center = [121.4737, 31.2304], // Shanghai default
  zoom = 12,
  height = '360px',
  showMarker = true,
  markerTitle = 'ZhenGrowth',
}: MapCNProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AMapMap | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!window.AMap) {
      console.error('AMap not loaded. Make sure the script is in index.html');
      return;
    }

    const AMap = window.AMap;
    mapInstanceRef.current = new AMap.Map(mapRef.current, {
      zoom,
      center,
      mapStyle: 'amap://styles/light',
      viewMode: '2D',
      features: ['bg', 'road', 'building', 'point'],
    });

    const map = mapInstanceRef.current;

    if (showMarker) {
      new AMap.Marker({
        position: center,
        title: markerTitle,
        map,
        animation: 'AMAP_ANIMATION_DROP',
      });
    }

    map.addControl(new AMap.Scale());
    map.addControl(
      new AMap.ToolBar({
        position: {
          top: '20px',
          right: '20px',
        },
      })
    );

    return () => {
      map?.destroy();
    };
  }, [center, zoom, showMarker, markerTitle]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-xl shadow-md overflow-hidden"
      style={{ height }}
    />
  );
}
