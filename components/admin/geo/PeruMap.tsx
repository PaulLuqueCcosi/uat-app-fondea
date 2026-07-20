'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { scaleLinear } from 'd3-scale';
import { zoom as d3Zoom, zoomIdentity } from 'd3-zoom';
import { select } from 'd3-selection';
import 'd3-transition';
import type { Feature, Geometry } from 'geojson';
import { ZoomIn, ZoomOut, Maximize2, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Types ───────────────────────────────────────────────────────────────────

export type MapLevel = 'pais' | 'departamento' | 'provincia';

export interface GeoRegionData {
  code: string;       // "04" departamento, "0401" provincia
  loanCount: number;
  percentage: number;
}

interface PeruMapProps {
  data: GeoRegionData[];
  maxLoanCount: number;
  onRegionClick?: (code: string, name: string, level: MapLevel) => void;
  /** Se llama cuando el nivel cambia (para sincronizar tabla lateral) */
  onLevelChange?: (level: MapLevel, depCode: string | null, provCode: string | null) => void;
}

// Color para regiones sin datos
const EMPTY_FILL = '#f1f5f9'; // neutral-100 — gris muy claro
const EMPTY_STROKE = '#cbd5e1'; // neutral-300

// ── Component ───────────────────────────────────────────────────────────────

export function PeruMap({ data, maxLoanCount, onRegionClick, onLevelChange }: PeruMapProps) {
  const [level, setLevel] = useState<MapLevel>('pais');
  const [selectedDep, setSelectedDep] = useState<string | null>(null);    // NOMBDEP
  const [selectedDepCode, setSelectedDepCode] = useState<string | null>(null); // "04"
  const [selectedProvId, setSelectedProvId] = useState<string | null>(null);   // "0401"

  const [depFeatures, setDepFeatures] = useState<any[] | null>(null);
  const [provFeatures, setProvFeatures] = useState<any[] | null>(null);
  const [distFeatures, setDistFeatures] = useState<any[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<React.ReactNode>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<any>(null);

  // Build lookup map from data
  const dataMap = useMemo(() => {
    const map = new Map<string, GeoRegionData>();
    for (const d of data) {
      map.set(d.code, d);
    }
    return map;
  }, [data]);

  // Load departments on mount
  useEffect(() => {
    fetch('/peru-departments.geojson')
      .then((res) => res.json())
      .then((geo) => {
        setDepFeatures(geo.features);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadProvinces = useCallback(async () => {
    if (provFeatures) return provFeatures;
    setLoadingDetail(true);
    try {
      const res = await fetch('/peru-provinces.geojson');
      const geo = await res.json();
      setProvFeatures(geo.features);
      return geo.features;
    } finally {
      setLoadingDetail(false);
    }
  }, [provFeatures]);

  const loadDistricts = useCallback(async () => {
    if (distFeatures) return distFeatures;
    setLoadingDetail(true);
    try {
      const res = await fetch('/peru-districts.geojson');
      const geo = await res.json();
      setDistFeatures(geo.features);
      return geo.features;
    } finally {
      setLoadingDetail(false);
    }
  }, [distFeatures]);

  // Current features based on drill level
  const currentFeatures = useMemo(() => {
    if (level === 'pais') return depFeatures || [];
    if (level === 'departamento') {
      return (provFeatures || []).filter((f: any) => f.properties.FIRST_NOMB === selectedDep);
    }
    return (distFeatures || []).filter((f: any) => f.properties.IDPROV === selectedProvId);
  }, [level, depFeatures, provFeatures, distFeatures, selectedDep, selectedProvId]);

  // Get code for current feature
  const getCode = useCallback((props: any): string => {
    if (level === 'pais') return props.FIRST_IDDP || '';
    if (level === 'departamento') return props.FIRST_IDPR || '';
    return props.IDDIST || '';
  }, [level]);

  // Get display name
  const getName = useCallback((props: any): string => {
    if (level === 'pais') return props.NOMBDEP || '';
    if (level === 'departamento') return props.NOMBPROV || '';
    return props.NOMBDIST || '';
  }, [level]);

  const width = 600;
  const height = 700;

  // Projection
  const projection = useMemo(() => {
    if (level === 'pais' || currentFeatures.length === 0) {
      return geoMercator()
        .center([-75, -9.5])
        .scale(1800)
        .translate([width / 2, height / 2]);
    }
    const fc = { type: 'FeatureCollection' as const, features: currentFeatures };
    return geoMercator().fitExtent(
      [[40, 40], [width - 40, height - 40]],
      fc as any
    );
  }, [level, currentFeatures]);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  // Color scale using our primary palette (#00A1CD)
  const colorScale = useMemo(() => {
    const max = Math.max(maxLoanCount, 1);
    return scaleLinear<string>()
      .domain([1, max * 0.33, max * 0.66, max])
      .range([
        '#B2ECF8',  // primary-100 — claro
        '#7DD8F0',  // primary-200
        '#00AEDA',  // primary-400
        '#006E8F',  // primary-700 — oscuro
      ])
      .clamp(true);
  }, [maxLoanCount]);

  // Setup zoom
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    const svg = select(svgRef.current);
    const g = select(gRef.current);

    const zoomBehavior = d3Zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setTransform({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
      });

    zoomBehaviorRef.current = zoomBehavior;
    svg.call(zoomBehavior as any);
    return () => { svg.on('.zoom', null); };
  }, [depFeatures]);

  // Reset zoom on drill
  useEffect(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, zoomIdentity);
  }, [level, selectedDep, selectedProvId]);

  // Notify parent of level changes
  useEffect(() => {
    onLevelChange?.(level, selectedDepCode, selectedProvId);
  }, [level, selectedDepCode, selectedProvId, onLevelChange]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.5);
  };
  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.67);
  };
  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    select(svgRef.current).transition().duration(500).call(zoomBehaviorRef.current.transform, zoomIdentity);
  };

  const handleBack = () => {
    if (level === 'provincia') {
      setLevel('departamento');
      setSelectedProvId(null);
    } else if (level === 'departamento') {
      setLevel('pais');
      setSelectedDep(null);
      setSelectedDepCode(null);
    }
  };

  const handleClick = async (feature: any) => {
    const props = feature.properties;
    const code = getCode(props);
    const name = getName(props);
    onRegionClick?.(code, name, level);

    if (level === 'pais') {
      setSelectedDep(props.NOMBDEP);
      setSelectedDepCode(props.FIRST_IDDP);
      await loadProvinces();
      setLevel('departamento');
    } else if (level === 'departamento') {
      setSelectedProvId(props.FIRST_IDPR);
      await loadDistricts();
      setLevel('provincia');
    }
  };

  const handleMouseEnter = (feature: any, event: React.MouseEvent) => {
    const props = feature.properties;
    const name = getName(props);
    const code = getCode(props);
    const regionData = dataMap.get(code);
    setHoveredRegion(code);

    setTooltipContent(
      <div className="p-3 space-y-1">
        <p className="font-semibold text-sm text-foreground">{name}</p>
        {regionData && regionData.loanCount > 0 ? (
          <>
            <p className="text-xs text-primary font-medium">
              {regionData.loanCount} préstamo{regionData.loanCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              {regionData.percentage}% del total
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Sin préstamos</p>
        )}
      </div>
    );
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredRegion(null);
    setTooltipContent(null);
  };

  // Breadcrumb
  const breadcrumb = useMemo(() => {
    if (level === 'pais') return 'Perú';
    if (level === 'departamento') return `Perú › ${selectedDep}`;
    const provName = (provFeatures || []).find((f: any) => f.properties.FIRST_IDPR === selectedProvId)?.properties.NOMBPROV || selectedProvId;
    return `Perú › ${selectedDep} › ${provName}`;
  }, [level, selectedDep, selectedProvId, provFeatures]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full bg-background border rounded-lg cursor-grab active:cursor-grabbing"
      >
        <g ref={gRef}>
          {currentFeatures.map((feature: Feature<Geometry, any>, idx: number) => {
            const props = feature.properties;
            const code = getCode(props);
            const regionData = dataMap.get(code);
            const value = regionData?.loanCount ?? 0;
            const isHovered = hoveredRegion === code;
            const path = pathGenerator(feature);

            // Sin datos = gris claro. Con datos = escala primaria.
            const fill = value > 0 ? colorScale(value) : EMPTY_FILL;
            const stroke = isHovered ? '#00A1CD' : (value > 0 ? '#ffffff' : EMPTY_STROKE);

            return (
              <path
                key={`${code}-${idx}`}
                d={path || ''}
                fill={fill}
                stroke={stroke}
                strokeWidth={isHovered ? 2 / transform.k : 0.8 / transform.k}
                strokeLinejoin="round"
                style={{
                  cursor: level === 'provincia' ? 'default' : 'pointer',
                  transition: 'fill 0.2s ease, stroke 0.15s ease',
                }}
                onMouseEnter={(e) => handleMouseEnter(feature, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(feature)}
              />
            );
          })}
        </g>
      </svg>

      {/* Breadcrumb + Back */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
        {level !== 'pais' && (
          <Button variant="outline" size="icon" onClick={handleBack} className="h-8 w-8" title="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-md border text-xs font-medium">
          {breadcrumb}
        </div>
      </div>

      {/* Loading overlay */}
      {loadingDetail && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-2">Cargando detalle...</p>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
        <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-8 w-8" title="Acercar">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleZoomOut} className="h-8 w-8" title="Alejar">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleResetZoom} className="h-8 w-8" title="Restablecer">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="fixed z-50 pointer-events-none bg-popover border rounded-lg shadow-lg"
          style={{ left: tooltipPosition.x + 12, top: tooltipPosition.y - 10 }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
}
