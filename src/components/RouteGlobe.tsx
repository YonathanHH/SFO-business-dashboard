import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule10, geoDistance } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { Minus, Plus, Pause, Play, LocateFixed, Loader2, AlertCircle } from 'lucide-react';
import { GeoRegionStat } from '../types';
import {
  COUNTRY_TO_REGION,
  REGION_GATEWAYS,
  RegionKey,
  SFO,
  greatCircleNm,
  normalizeRegion,
} from '../data/worldRegions';
import { formatNumber, formatPercent, formatWeight, getGeoColor } from '../utils/formatters';

export type GeoMetric = 'landings' | 'landedWeight' | 'avgWeightPerFlight';

interface CountryProps {
  name?: string;
}
type CountryFeature = Feature<Geometry, CountryProps>;

interface RouteGlobeProps {
  regions: GeoRegionStat[];
  metric: GeoMetric;
  weightUnit: 'lbs' | 'metric_tonnes';
  selectedRegion: RegionKey | null;
  onSelectRegion: (region: RegionKey | null) => void;
}

const WORLD_URL = '/data/world-110m.json';
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 3.5;
const SPIN_DEG_PER_MS = 0.008;
const FLY_DURATION_MS = 750;
const HOME_ROTATION: [number, number] = [150, -20];

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const wrapLon = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Interactive orthographic globe of SFO's route corridors by GEO region. */
export const RouteGlobe: React.FC<RouteGlobeProps> = ({
  regions,
  metric,
  weightUnit,
  selectedRegion,
  onSelectRegion,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; rotation: [number, number] } | null>(null);
  const flightRef = useRef<number | null>(null);

  const [countries, setCountries] = useState<CountryFeature[] | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 640, height: 460 });
  const [rotation, setRotation] = useState<[number, number]>(HOME_ROTATION);
  const [zoom, setZoom] = useState(1);
  const [spinning, setSpinning] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<RegionKey | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  /* ----------------------------------------------------------------- data -- */

  useEffect(() => {
    let cancelled = false;
    fetch(WORLD_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`world-110m.json returned ${res.status}`);
        return res.json();
      })
      .then((topology: Topology<{ countries: GeometryCollection<CountryProps> }>) => {
        if (cancelled) return;
        const collection = feature(
          topology,
          topology.objects.countries
        ) as unknown as FeatureCollection<Geometry, CountryProps>;
        setCountries(collection.features);
      })
      .catch((err: Error) => {
        if (!cancelled) setMapError(err.message || 'Unable to load world geometry');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Region stats keyed by canonical region (merging any alias duplicates). */
  const statsByRegion = useMemo(() => {
    const map = new Map<RegionKey, GeoRegionStat>();
    for (const stat of regions) {
      const key = normalizeRegion(stat.region);
      if (!key) continue;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, stat);
        continue;
      }
      const landings = existing.landings + stat.landings;
      const landedWeight = existing.landedWeight + stat.landedWeight;
      map.set(key, {
        ...existing,
        landings,
        landedWeight,
        shareLandings: existing.shareLandings + stat.shareLandings,
        avgWeightPerFlight: landings > 0 ? Math.round(landedWeight / landings) : 0,
      });
    }
    return map;
  }, [regions]);

  /** International corridors, scaled 0..1 on the active metric. */
  const corridors = useMemo(() => {
    const entries = Array.from(statsByRegion.entries())
      .filter(([key]) => key !== 'US')
      .map(([key, stat]) => ({ key, stat, gateway: REGION_GATEWAYS[key] }));
    const max = Math.max(1, ...entries.map((e) => e.stat[metric]));
    return entries
      .map((e) => ({ ...e, intensity: Math.sqrt(Math.max(0, e.stat[metric]) / max) }))
      .sort((a, b) => a.intensity - b.intensity); // faintest corridors paint first
  }, [statsByRegion, metric]);

  const intensityByRegion = useMemo(() => {
    const map = new Map<RegionKey, number>();
    corridors.forEach((c) => map.set(c.key, c.intensity));
    return map;
  }, [corridors]);

  /* --------------------------------------------------------------- layout -- */

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      setSize({ width: box.width, height: box.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const projection = useMemo(() => {
    const r = (Math.min(size.width, size.height) / 2 - 10) * zoom;
    return geoOrthographic()
      .translate([size.width / 2, size.height / 2])
      .scale(Math.max(20, r))
      .rotate([rotation[0], rotation[1], 0])
      .clipAngle(90);
  }, [size, zoom, rotation]);

  const pathGen = useMemo(() => geoPath(projection), [projection]);
  const radius = projection.scale();
  const center = useMemo<[number, number]>(() => [-rotation[0], -rotation[1]], [rotation]);

  const isFacingViewer = useCallback(
    (coords: [number, number]) => geoDistance(center, coords) < Math.PI / 2 - 0.03,
    [center]
  );

  /* ----------------------------------------------------------- animations -- */

  const stopFlight = useCallback(() => {
    if (flightRef.current !== null) {
      cancelAnimationFrame(flightRef.current);
      flightRef.current = null;
    }
    setIsFlying(false);
  }, []);

  const flyTo = useCallback(
    (coords: [number, number]) => {
      stopFlight();
      const from = rotation;
      const target: [number, number] = [-coords[0], clamp(-coords[1], -70, 70)];
      const deltaLon = wrapLon(target[0] - from[0]);
      const deltaLat = target[1] - from[1];
      if (Math.abs(deltaLon) < 0.5 && Math.abs(deltaLat) < 0.5) return;

      setIsFlying(true);
      const start = performance.now();
      const step = (now: number) => {
        const t = clamp((now - start) / FLY_DURATION_MS, 0, 1);
        const eased = easeInOutCubic(t);
        setRotation([wrapLon(from[0] + deltaLon * eased), from[1] + deltaLat * eased]);
        if (t < 1) {
          flightRef.current = requestAnimationFrame(step);
        } else {
          flightRef.current = null;
          setIsFlying(false);
        }
      };
      flightRef.current = requestAnimationFrame(step);
    },
    [rotation, stopFlight]
  );

  useEffect(() => () => stopFlight(), [stopFlight]);

  // Idle auto-rotation, suspended whenever the user is engaged with the globe. A locked
  // selection keeps its corridor framed instead of letting it drift back out of view.
  const paused =
    !spinning || isDragging || isFlying || hoveredRegion !== null || selectedRegion !== null;
  useEffect(() => {
    if (paused) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const elapsed = now - last;
      last = now;
      setRotation(([lon, lat]) => [wrapLon(lon + elapsed * SPIN_DEG_PER_MS), lat]);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  // Swing the globe round to whichever corridor is selected, framing origin + gateway.
  useEffect(() => {
    if (!selectedRegion) return;
    const gateway = REGION_GATEWAYS[selectedRegion];
    if (!gateway) return;
    const midpoint: [number, number] = [
      wrapLon(SFO.coords[0] + wrapLon(gateway.coords[0] - SFO.coords[0]) / 2),
      (SFO.coords[1] + gateway.coords[1]) / 2,
    ];
    flyTo(selectedRegion === 'US' ? SFO.coords : midpoint);
    // flyTo closes over the live rotation; re-running it per frame would fight the tween.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion]);

  /* ------------------------------------------------------------- gestures -- */

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    stopFlight();
    dragRef.current = { x: e.clientX, y: e.clientY, rotation };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    const drag = dragRef.current;
    if (!drag) return;
    const sensitivity = 90 / radius;
    setRotation([
      wrapLon(drag.rotation[0] + (e.clientX - drag.x) * sensitivity),
      clamp(drag.rotation[1] - (e.clientY - drag.y) * sensitivity, -85, 85),
    ]);
  };

  const endDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  // Ctrl/Cmd + wheel zooms; a bare wheel keeps scrolling the dashboard.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.12 : 1 / 1.12), MIN_ZOOM, MAX_ZOOM));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const resetView = () => {
    stopFlight();
    onSelectRegion(null);
    setRotation(HOME_ROTATION);
    setZoom(1);
  };

  const toggleRegion = (region: RegionKey) =>
    onSelectRegion(selectedRegion === region ? null : region);

  /* --------------------------------------------------------------- render -- */

  const activeRegion = hoveredRegion ?? selectedRegion;
  const tooltipStat = hoveredRegion ? statsByRegion.get(hoveredRegion) : undefined;
  const sfoPoint = isFacingViewer(SFO.coords) ? projection(SFO.coords) : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] rounded-xl overflow-hidden bg-gradient-to-b from-[#070C17] to-[#0B111E] border border-aviation-border"
    >
      {!countries && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-aviation-textMuted">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <span className="text-[11px] font-mono uppercase tracking-wider">Rendering globe...</span>
        </div>
      )}

      {mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <span className="text-xs font-mono text-red-300">Map unavailable: {mapError}</span>
          <span className="text-[11px] font-mono text-aviation-textMuted">
            Regional figures elsewhere on this tab are unaffected.
          </span>
        </div>
      )}

      {countries && (
        <svg
          width="100%"
          height="100%"
          role="img"
          aria-label="Interactive globe of flight corridors from San Francisco International Airport by geographic region"
          className={`touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={(e) => {
            endDrag(e);
            setPointer(null);
            setHoveredRegion(null);
          }}
        >
          <defs>
            <radialGradient id="globe-ocean" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#16304F" />
              <stop offset="55%" stopColor="#0E1E36" />
              <stop offset="100%" stopColor="#070D1A" />
            </radialGradient>
            <radialGradient id="globe-halo" cx="50%" cy="50%" r="50%">
              <stop offset="82%" stopColor="rgba(56,189,248,0)" />
              <stop offset="96%" stopColor="rgba(56,189,248,0.22)" />
              <stop offset="100%" stopColor="rgba(56,189,248,0)" />
            </radialGradient>
            <filter id="corridor-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ocean + atmosphere */}
          <circle cx={size.width / 2} cy={size.height / 2} r={radius} fill="url(#globe-ocean)" />
          <circle
            cx={size.width / 2}
            cy={size.height / 2}
            r={radius * 1.09}
            fill="url(#globe-halo)"
            pointerEvents="none"
          />

          {/* Graticule */}
          <path
            d={pathGen(geoGraticule10()) ?? undefined}
            fill="none"
            stroke="#1E2D4A"
            strokeWidth={0.5}
            opacity={0.6}
            pointerEvents="none"
          />

          {/* Landmasses, tinted by how much traffic their region carries */}
          <g>
            {countries.map((country, idx) => {
              const d = pathGen(country);
              if (!d) return null;

              const name = country.properties?.name ?? '';
              const region = COUNTRY_TO_REGION[name];
              const stat = region ? statsByRegion.get(region) : undefined;

              if (!region || !stat) {
                return (
                  <path
                    key={`country-${idx}`}
                    d={d}
                    fill="#18253C"
                    stroke="#243452"
                    strokeWidth={0.35}
                    pointerEvents="none"
                  />
                );
              }

              const isActive = region === activeRegion;
              const isMuted = selectedRegion !== null && region !== selectedRegion;
              const base =
                region === 'US' ? 0.85 : 0.28 + (intensityByRegion.get(region) ?? 0) * 0.55;

              return (
                <path
                  key={`country-${idx}`}
                  d={d}
                  fill={getGeoColor(region)}
                  fillOpacity={isActive ? 0.95 : isMuted ? base * 0.4 : base}
                  stroke={isActive ? '#E2E8F0' : '#0B111E'}
                  strokeWidth={isActive ? 0.9 : 0.4}
                  className="cursor-pointer"
                  onPointerEnter={() => setHoveredRegion(region)}
                  onClick={() => toggleRegion(region)}
                />
              );
            })}
          </g>

          {/* Great-circle corridors */}
          <g fill="none" pointerEvents="none">
            {corridors.map(({ key, gateway, intensity }) => {
              const d = pathGen({
                type: 'LineString',
                coordinates: [SFO.coords, gateway.coords],
              } as Geometry);
              if (!d) return null;

              const color = getGeoColor(key);
              const isActive = key === activeRegion;
              const isMuted = selectedRegion !== null && key !== selectedRegion;
              const width = 0.9 + intensity * 3.6;

              return (
                <g key={`corridor-${key}`} opacity={isMuted ? 0.18 : 1}>
                  <path d={d} stroke={color} strokeWidth={width * 2.8} opacity={0.12} />
                  <path
                    d={d}
                    stroke={color}
                    strokeWidth={isActive ? width + 1.2 : width}
                    strokeLinecap="round"
                    opacity={isActive ? 1 : 0.85}
                    filter={isActive ? 'url(#corridor-glow)' : undefined}
                  />
                  <path
                    d={d}
                    stroke="#F8FAFC"
                    strokeWidth={Math.max(1, width * 0.5)}
                    strokeLinecap="round"
                    strokeDasharray="2 26"
                    className="corridor-pulse"
                    opacity={0.85}
                  />
                </g>
              );
            })}
          </g>

          {/* Destination gateways */}
          <g>
            {corridors.map(({ key, gateway, stat, intensity }) => {
              if (!isFacingViewer(gateway.coords)) return null;
              const point = projection(gateway.coords);
              if (!point) return null;

              const color = getGeoColor(key);
              const isActive = key === activeRegion;
              const isMuted = selectedRegion !== null && key !== selectedRegion;
              const r = 3 + intensity * 6;

              return (
                <g
                  key={`gateway-${key}`}
                  className="cursor-pointer"
                  opacity={isMuted ? 0.35 : 1}
                  onPointerEnter={() => setHoveredRegion(key)}
                  onClick={() => toggleRegion(key)}
                >
                  <circle cx={point[0]} cy={point[1]} r={r + 10} fill="transparent" />
                  <circle cx={point[0]} cy={point[1]} r={r * 2.2} fill={color} opacity={0.16} />
                  <circle
                    cx={point[0]}
                    cy={point[1]}
                    r={r}
                    fill={color}
                    stroke={isActive ? '#FFFFFF' : '#0B111E'}
                    strokeWidth={isActive ? 2 : 1}
                  />
                  {(isActive || zoom > 1.4) && (
                    <text
                      x={point[0] + r + 6}
                      y={point[1] + 3.5}
                      className="font-mono pointer-events-none"
                      fontSize={10}
                      fill="#E2E8F0"
                      stroke="#0B111E"
                      strokeWidth={2.5}
                      paintOrder="stroke"
                    >
                      {gateway.iata} · {formatNumber(stat.landings)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* SFO origin */}
          {sfoPoint && (
            <g pointerEvents="none">
              <circle
                cx={sfoPoint[0]}
                cy={sfoPoint[1]}
                r={17}
                fill="none"
                stroke="#38BDF8"
                strokeWidth={1.5}
                className="origin-ping"
              />
              <circle cx={sfoPoint[0]} cy={sfoPoint[1]} r={5} fill="#38BDF8" />
              <circle cx={sfoPoint[0]} cy={sfoPoint[1]} r={2} fill="#0B111E" />
              <text
                x={sfoPoint[0] + 10}
                y={sfoPoint[1] - 9}
                className="font-mono font-bold"
                fontSize={11}
                fill="#7DD3FC"
                stroke="#0B111E"
                strokeWidth={3}
                paintOrder="stroke"
              >
                SFO
              </text>
            </g>
          )}
        </svg>
      )}

      {/* View controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        <GlobeButton
          label="Zoom in"
          onClick={() => setZoom((z) => clamp(z * 1.25, MIN_ZOOM, MAX_ZOOM))}
        >
          <Plus className="w-3.5 h-3.5" />
        </GlobeButton>
        <GlobeButton
          label="Zoom out"
          onClick={() => setZoom((z) => clamp(z / 1.25, MIN_ZOOM, MAX_ZOOM))}
        >
          <Minus className="w-3.5 h-3.5" />
        </GlobeButton>
        <GlobeButton
          label={spinning ? 'Pause rotation' : 'Resume rotation'}
          active={spinning}
          onClick={() => setSpinning((s) => !s)}
        >
          {spinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </GlobeButton>
        <GlobeButton label="Reset view" onClick={resetView}>
          <LocateFixed className="w-3.5 h-3.5" />
        </GlobeButton>
      </div>

      <div className="absolute bottom-3 left-3 text-[10px] font-mono text-slate-500 pointer-events-none">
        Drag to rotate &middot; Ctrl/&#8984; + scroll to zoom &middot; Click a region to lock it
      </div>

      {/* Hover readout */}
      {tooltipStat && pointer && hoveredRegion && (
        <div
          className="absolute z-20 pointer-events-none bg-[#0B111E]/95 backdrop-blur-md border border-aviation-borderLight rounded-xl p-3 shadow-2xl text-xs font-mono min-w-[215px]"
          style={{
            left: clamp(pointer.x + 16, 8, Math.max(8, size.width - 240)),
            top: clamp(pointer.y + 16, 8, Math.max(8, size.height - 180)),
          }}
        >
          <div className="flex items-center gap-2 border-b border-aviation-border pb-1.5 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: getGeoColor(hoveredRegion) }}
            />
            <span className="font-bold text-white">{hoveredRegion}</span>
          </div>
          <TooltipRow label="Landings" value={formatNumber(tooltipStat.landings)} />
          <TooltipRow label="Share" value={formatPercent(tooltipStat.shareLandings)} />
          <TooltipRow
            label="Landed weight"
            value={formatWeight(tooltipStat.landedWeight, weightUnit)}
          />
          <TooltipRow
            label="Avg MTOW"
            value={formatWeight(tooltipStat.avgWeightPerFlight, weightUnit)}
          />
          {hoveredRegion !== 'US' && (
            <TooltipRow
              label="Gateway"
              value={`${REGION_GATEWAYS[hoveredRegion].iata} · ${formatNumber(
                greatCircleNm(SFO.coords, REGION_GATEWAYS[hoveredRegion].coords)
              )} nm`}
            />
          )}
          {tooltipStat.topAirlines[0] && (
            <TooltipRow label="Top carrier" value={tooltipStat.topAirlines[0].airline} />
          )}
        </div>
      )}
    </div>
  );
};

const TooltipRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 py-0.5">
    <span className="text-slate-400">{label}</span>
    <span className="font-bold text-white truncate max-w-[130px]" title={value}>
      {value}
    </span>
  </div>
);

const GlobeButton: React.FC<{
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, active, onClick, children }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className={`w-8 h-8 grid place-items-center rounded-lg border transition-colors ${
      active
        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
        : 'bg-aviation-card/80 border-aviation-border text-slate-400 hover:text-white hover:border-aviation-borderLight'
    }`}
  >
    {children}
  </button>
);
