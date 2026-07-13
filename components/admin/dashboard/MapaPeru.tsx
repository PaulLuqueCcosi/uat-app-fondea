'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface CityDistribution {
  city: string;
  loanCount: number;
  percentage: number;
}

interface MapaPeruProps {
  cityDistribution: CityDistribution[];
}

const CITY_COORDS: Record<string, [number, number]> = {
  Lima: [-12.0464, -77.0428],
  Arequipa: [-16.409, -71.5375],
  Trujillo: [-8.1159, -79.03],
  Chiclayo: [-6.7714, -79.8409],
  Piura: [-5.1945, -80.6328],
  Cusco: [-13.532, -71.9675],
  Huancayo: [-12.0686, -75.2103],
  Iquitos: [-3.7437, -73.2516],
  Tacna: [-18.0146, -70.2512],
  Chimbote: [-9.0858, -78.5783],
};

export function MapaPeru({ cityDistribution }: MapaPeruProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current || leafletMapRef.current) return;

    try {
      const map = L.map(mapRef.current, {
        center: [-9.19, -75.0152],
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      leafletMapRef.current = map;

      const maxCount = Math.max(...cityDistribution.map((c) => c.loanCount), 1);

      cityDistribution.forEach((city) => {
        const coords = CITY_COORDS[city.city];
        if (!coords) return;

        const radius = 5000 + (city.loanCount / maxCount) * 50000;
        const opacity = 0.4 + (city.percentage / 100) * 0.4;

        const color =
          city.percentage > 30 ? '#ef4444' : city.percentage > 15 ? '#f97316' : '#3b82f6';

        L.circleMarker(coords, {
          radius: Math.max(6, (city.loanCount / maxCount) * 20),
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 1,
          fillOpacity: opacity,
        })
          .bindPopup(
            `<strong>${city.city}</strong><br/>Créditos: ${city.loanCount.toLocaleString()}<br/>Porcentaje: ${city.percentage.toFixed(1)}%`,
          )
          .addTo(map);
      });
    } catch {
      setMapError(true);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [cityDistribution]);

  if (mapError) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
            Distribución por Ciudad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Ciudad</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Créditos</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">%</th>
                </tr>
              </thead>
              <tbody>
                {cityDistribution.map((city) => (
                  <tr key={city.city} className="border-b last:border-0">
                    <td className="py-2">{city.city}</td>
                    <td className="text-right py-2">{city.loanCount.toLocaleString()}</td>
                    <td className="text-right py-2">{city.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">
          Distribución por Ciudad
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={mapRef} className="w-full h-80 rounded-md" />
      </CardContent>
    </Card>
  );
}
