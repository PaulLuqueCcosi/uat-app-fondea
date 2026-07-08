'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2, Layers, X } from 'lucide-react';

const PERU_CENTER: [number, number] = [-9.19, -75.01];
const DEFAULT_ZOOM = 5;

const TILE_STYLES: Record<string, { name: string; url: string; attribution: string }> = {
  street: {
    name: 'Calle',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  dark: {
    name: 'Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://carto.com/">CARTO</a>',
  },
  light: {
    name: 'Claro',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© <a href="https://carto.com/">CARTO</a>',
  },
  satellite: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© <a href="https://www.esri.com/">Esri</a>',
  },
};

const MARKER_ICON = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMapPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number } | null) => void;
  height?: number;
  readOnly?: boolean;
  mapCenter?: { lat: number; lng: number } | null;
  mapZoom?: number;
}

export function LocationMapPicker({ value, onChange, height = 250, readOnly = false, mapCenter, mapZoom }: LocationMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tileStyle, setTileStyle] = useState('street');
  const [showStylePicker, setShowStylePicker] = useState(false);

  function placeMarker(lat: number, lng: number) {
    const map = mapInstance.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { icon: MARKER_ICON, draggable: !readOnly }).addTo(map);
      if (!readOnly) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onChange({ lat: parseFloat(pos.lat.toFixed(6)), lng: parseFloat(pos.lng.toFixed(6)) });
        });
      }
      markerRef.current = marker;
    }
    if (!readOnly) map.panTo([lat, lng]);
  }

  function clearMarker() {
    const map = mapInstance.current;
    if (!map || !markerRef.current) return;
    map.removeLayer(markerRef.current);
    markerRef.current = null;
    onChange(null);
  }

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // fix Leaflet default icon in bundlers
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    const hasSavedValue = !!(value?.lat && value?.lng);
    const center = hasSavedValue
      ? [value!.lat, value!.lng]
      : mapCenter
        ? [mapCenter.lat, mapCenter.lng]
        : PERU_CENTER;
    const zoom = hasSavedValue ? 14 : mapCenter ? (mapZoom ?? DEFAULT_ZOOM) : DEFAULT_ZOOM;

    const map = L.map(mapRef.current, {
      center: center as L.LatLngExpression,
      zoom,
      zoomControl: !readOnly,
      dragging: !readOnly,
      scrollWheelZoom: !readOnly,
      doubleClickZoom: !readOnly,
      touchZoom: !readOnly,
      keyboard: !readOnly,
      boxZoom: !readOnly,
    });

    const t = TILE_STYLES.street;
    tileLayerRef.current = L.tileLayer(t.url, { attribution: t.attribution, maxZoom: 19 }).addTo(map);

    if (!readOnly) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        placeMarker(lat, lng);
        onChange({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
      });
    }

    if (value) placeMarker(value.lat, value.lng);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
      markerRef.current = null;
    };
  }, [readOnly]);

  useEffect(() => {
    if (!mapInstance.current || !value) return;
    const m = markerRef.current;
    if (m) {
      const p = m.getLatLng();
      if (p.lat !== value.lat || p.lng !== value.lng) placeMarker(value.lat, value.lng);
    } else {
      placeMarker(value.lat, value.lng);
    }
  }, [value?.lat, value?.lng]);

  useEffect(() => {
    if (!mapInstance.current || !mapCenter) return;
    const zoom = mapZoom ?? DEFAULT_ZOOM;
    mapInstance.current.setView([mapCenter.lat, mapCenter.lng], zoom, { animate: true, duration: 0.5 });
  }, [mapCenter?.lat, mapCenter?.lng, mapZoom]);

  useEffect(() => {
    if (!mapInstance.current) return;
    const t = setTimeout(() => mapInstance.current?.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [isFullscreen]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try { await containerRef.current.requestFullscreen(); setIsFullscreen(true); }
      catch { /* no fullscreen */ }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  function setTileStyle_(style: string) {
    if (!mapInstance.current) return;
    const cfg = TILE_STYLES[style];
    if (!cfg) return;
    if (tileLayerRef.current) mapInstance.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: 19 }).addTo(mapInstance.current);
    setTileStyle(style);
    setShowStylePicker(false);
  }

  return (
    <div ref={containerRef} className="relative" style={isFullscreen ? { height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999, background: '#000' } : {}}>
      <div
        ref={mapRef}
        style={{ height: isFullscreen ? '100%' : `${height}px`, width: '100%' }}
        className="rounded-lg border border-border overflow-hidden"
      />
      {/* Controles de edición — solo cuando no es readonly */}
      {!readOnly && (
        <div className="absolute top-2 right-2 flex gap-1.5 z-[1000]">
          {/* Botón limpiar marcador */}
          {value && (
            <button
              type="button"
              onClick={clearMarker}
              className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive shadow-sm cursor-pointer"
              title="Limpiar ubicación"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </button>
          )}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStylePicker(!showStylePicker)}
              className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground shadow-sm cursor-pointer"
              title="Cambiar estilo de mapa"
            >
              <Layers className="w-3.5 h-3.5" />
              {TILE_STYLES[tileStyle]?.name}
            </button>
            {showStylePicker && (
              <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-md shadow-lg overflow-hidden min-w-[120px]">
                {Object.entries(TILE_STYLES).map(([k, c]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTileStyle_(k)}
                    className={`block w-full text-left px-3 py-1.5 text-xs cursor-pointer hover:bg-accent/50 ${
                      tileStyle === k ? 'font-semibold text-primary bg-accent/20' : 'text-muted-foreground'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground shadow-sm cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
      {/* Botón fullscreen — siempre visible (incluso en readonly) */}
      {readOnly && (
        <div className="absolute top-2 right-2 flex gap-1.5 z-[1000]">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm border border-border rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground shadow-sm cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
