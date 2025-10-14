import { useEffect, useRef } from 'react';

/**
 * AMap (高德地图) component for China
 * Replaces Google Maps for better performance in China
 * 
 * Setup:
 * 1. Get API key: https://lbs.amap.com/
 * 2. Add script to index.html: <script src="https://webapi.amap.com/maps?v=2.0&key=YOUR_KEY"></script>
 * 3. Update coordinates below to your location
 */

declare global {
  interface Window {
    AMap: any;
  }
}

interface MapCNProps {
  /** Map center coordinates [longitude, latitude] */
  center?: [number, number];
  /** Zoom level (3-18) */
  zoom?: number;
  /** Map height */
  height?: string;
  /** Show marker at center */
  showMarker?: boolean;
  /** Marker title */
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
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Check if AMap is loaded
    if (!window.AMap) {
      console.error('AMap not loaded. Add script to index.html');
      return;
    }

    // Initialize map
    mapInstanceRef.current = new window.AMap.Map(mapRef.current, {
      zoom,
      center,
      mapStyle: 'amap://styles/light', // Light theme
      viewMode: '2D',
      features: ['bg', 'road', 'building', 'point'],
    });

    // Add marker if enabled
    if (showMarker) {
      new window.AMap.Marker({
        position: center,
        title: markerTitle,
        map: mapInstanceRef.current,
        animation: 'AMAP_ANIMATION_DROP',
      });
    }

    // Add scale control
    mapInstanceRef.current.addControl(new window.AMap.Scale());

    // Add zoom control
    mapInstanceRef.current.addControl(
      new window.AMap.ToolBar({
        position: {
          top: '20px',
          right: '20px',
        },
      })
    );

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
      }
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
