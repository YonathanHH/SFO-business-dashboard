import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { GeoRegionStat } from '../../types';
import { CustomTooltip } from '../CustomTooltip';
import { RouteGlobe, GeoMetric } from '../RouteGlobe';
import { REGION_GATEWAYS, RegionKey, SFO, greatCircleNm, normalizeRegion } from '../../data/worldRegions';
import { formatNumber, formatWeight, formatPercent, getGeoColor } from '../../utils/formatters';
import { Globe2, PlaneLanding, Compass, Radar, Plane, Building2 } from 'lucide-react';

interface GeoDynamicsViewProps {
  geoRegions: GeoRegionStat[];
  weightUnit: 'lbs' | 'metric_tonnes';
}

const METRICS: { id: GeoMetric; label: string; short: string }[] = [
  { id: 'landings', label: 'Landings', short: 'Ops' },
  { id: 'landedWeight', label: 'Landed Weight', short: 'Weight' },
  { id: 'avgWeightPerFlight', label: 'Avg MTOW', short: 'Gauge' },
];

export const GeoDynamicsView: React.FC<GeoDynamicsViewProps> = ({ geoRegions, weightUnit }) => {
  const [metric, setMetric] = useState<GeoMetric>('landings');
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);

  const internationalRegions = useMemo(
    () => geoRegions.filter((r) => r.region.toLowerCase() !== 'us'),
    [geoRegions]
  );

  const internationalTotal = useMemo(
    () => internationalRegions.reduce((sum, r) => sum + r.landings, 0),
    [internationalRegions]
  );

  const usRegion = useMemo(
    () => geoRegions.find((r) => r.region.toLowerCase() === 'us'),
    [geoRegions]
  );

  /** Region stats addressable by the canonical keys the globe uses. */
  const regionByKey = useMemo(() => {
    const map = new Map<RegionKey, GeoRegionStat>();
    for (const stat of geoRegions) {
      const key = normalizeRegion(stat.region);
      if (key && !map.has(key)) map.set(key, stat);
    }
    return map;
  }, [geoRegions]);

  /**
   * Ranked corridors for the ledger. US domestic traffic is pulled out as an unscaled
   * baseline row: at ~85% of volume it would flatten every international bar to a sliver,
   * so the bars below it are scaled against the largest *international* corridor instead.
   */
  const ledger = useMemo(() => {
    const rows = geoRegions
      .map((stat) => ({ stat, key: normalizeRegion(stat.region) }))
      .filter((row): row is { stat: GeoRegionStat; key: RegionKey } => row.key !== null);

    const domestic = rows.find((r) => r.key === 'US') ?? null;
    const international = rows
      .filter((r) => r.key !== 'US')
      .sort((a, b) => b.stat[metric] - a.stat[metric]);
    const max = Math.max(1, ...international.map((r) => r.stat[metric]));

    return {
      domestic,
      international: international.map((row) => ({ ...row, ratio: row.stat[metric] / max })),
      isEmpty: rows.length === 0,
    };
  }, [geoRegions, metric]);

  // Drop a selection that the active filters have removed from the dataset.
  useEffect(() => {
    if (selectedRegion && !regionByKey.has(selectedRegion)) setSelectedRegion(null);
  }, [regionByKey, selectedRegion]);

  const detail = selectedRegion ? regionByKey.get(selectedRegion) ?? null : null;
  const detailKey = detail ? selectedRegion : null;
  const metricLabel = METRICS.find((m) => m.id === metric)?.label ?? '';

  const formatMetric = (stat: GeoRegionStat) =>
    metric === 'landings' ? formatNumber(stat.landings) : formatWeight(stat[metric], weightUnit);

  return (
    <div className="space-y-6">
      {/* 1. Interactive corridor globe + ranked ledger */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-aviation-border">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-bold text-white">Global Corridor Map</h3>
              <p className="text-[11px] font-mono text-aviation-textMuted mt-0.5">
                SFO origin &middot; great-circle corridors weighted by {metricLabel.toLowerCase()}
              </p>
            </div>
          </div>

          {/* Metric selector drives the globe, the ledger, and the detail card */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-aviation-dark/80 border border-aviation-border"
            role="group"
            aria-label="Corridor weighting metric"
          >
            {METRICS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetric(m.id)}
                aria-pressed={metric === m.id}
                className={`px-3 py-1.5 rounded-md text-[11px] font-mono uppercase tracking-wider transition-colors ${
                  metric === m.id
                    ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.short}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <RouteGlobe
              regions={geoRegions}
              metric={metric}
              weightUnit={weightUnit}
              selectedRegion={selectedRegion}
              onSelectRegion={setSelectedRegion}
            />
          </div>

          {/* Corridor ledger */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-aviation-textMuted">
                Corridor Ledger
              </span>
              {selectedRegion && (
                <button
                  type="button"
                  onClick={() => setSelectedRegion(null)}
                  className="text-[11px] font-mono text-sky-400 hover:text-sky-300"
                >
                  Clear selection
                </button>
              )}
            </div>

            <div className="space-y-1.5 overflow-y-auto pr-1 lg:max-h-[500px]">
              {ledger.domestic && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedRegion(selectedRegion === 'US' ? null : ledger.domestic!.key)
                  }
                  aria-pressed={selectedRegion === 'US'}
                  className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                    selectedRegion === 'US'
                      ? 'bg-aviation-cardHover border-sky-500/50'
                      : 'bg-aviation-dark/70 border-aviation-border hover:border-aviation-borderLight'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: getGeoColor('US') }}
                      />
                      <span className="font-semibold text-white truncate">
                        {ledger.domestic.stat.region}
                      </span>
                    </div>
                    <span className="text-sky-300 font-bold shrink-0">
                      {formatMetric(ledger.domestic.stat)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-aviation-textMuted">
                    <span>{formatPercent(ledger.domestic.stat.shareLandings)} of volume</span>
                    <span>Domestic baseline &middot; unscaled</span>
                  </div>
                </button>
              )}

              {ledger.international.length > 0 && (
                <div className="flex items-center gap-2 pt-2 pb-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    International corridors
                  </span>
                  <span className="flex-1 h-px bg-aviation-border" />
                </div>
              )}

              {ledger.international.map(({ key, stat, ratio }) => {
                const color = getGeoColor(key);
                const isSelected = selectedRegion === key;
                const gateway = REGION_GATEWAYS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedRegion(isSelected ? null : key)}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                      isSelected
                        ? 'bg-aviation-cardHover border-sky-500/50'
                        : 'bg-aviation-dark/70 border-aviation-border hover:border-aviation-borderLight'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 font-mono text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-white truncate">{stat.region}</span>
                      </div>
                      <span className="text-sky-300 font-bold shrink-0">{formatMetric(stat)}</span>
                    </div>

                    <div className="mt-1.5 h-1.5 rounded-full bg-aviation-border/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-[width] duration-300"
                        style={{ width: `${Math.max(2, ratio * 100)}%`, backgroundColor: color }}
                      />
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-aviation-textMuted">
                      <span>{formatPercent(stat.shareLandings)} of volume</span>
                      <span>
                        {gateway.iata} &middot;{' '}
                        {formatNumber(greatCircleNm(SFO.coords, gateway.coords))} nm
                      </span>
                    </div>
                  </button>
                );
              })}

              {ledger.isEmpty && (
                <div className="p-4 rounded-lg bg-aviation-dark/70 border border-aviation-border text-xs font-mono text-aviation-textMuted text-center">
                  No regions match the current filters.
                </div>
              )}
            </div>

            <p className="mt-3 text-[10px] font-mono text-slate-500 leading-relaxed">
              Bars scale against the largest international corridor. The dataset records
              destinations by GEO region, not by airport &mdash; corridor endpoints show each
              region&apos;s principal SFO gateway and are illustrative.
            </p>
          </div>
        </div>
      </div>

      {/* 2. US domestic anchor + selected corridor drill-down */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* US Domestic Anchor Card */}
        <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-sky-500 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-aviation-border">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">US Domestic Operations</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-sky-500/20 text-sky-300">
                Core Hub
              </span>
            </div>
            {usRegion && (
              <div className="mt-4 space-y-4 font-mono text-xs">
                <div>
                  <span className="text-aviation-textMuted">Domestic Landings</span>
                  <div className="text-2xl font-bold text-white mt-0.5">
                    {formatNumber(usRegion.landings)}
                  </div>
                  <span className="text-sky-400">
                    {formatPercent(usRegion.shareLandings)} of total SFO volume
                  </span>
                </div>
                <div>
                  <span className="text-aviation-textMuted">Cumulative Landed Weight</span>
                  <div className="text-lg font-bold text-slate-200 mt-0.5">
                    {formatWeight(usRegion.landedWeight, weightUnit)}
                  </div>
                </div>
                <div>
                  <span className="text-aviation-textMuted">Average MTOW / Flight</span>
                  <div className="text-base font-bold text-indigo-400 mt-0.5">
                    {formatWeight(usRegion.avgWeightPerFlight, weightUnit)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">
                    Top Domestic Carriers:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {usRegion.topAirlines.slice(0, 3).map((a) => (
                      <span
                        key={a.airline}
                        className="px-2 py-0.5 rounded bg-aviation-dark border border-aviation-border text-[11px] text-slate-200"
                      >
                        {a.airline} ({formatNumber(a.landings)})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {!usRegion && (
              <p className="mt-4 text-xs font-mono text-aviation-textMuted">
                No domestic traffic in the current selection.
              </p>
            )}
          </div>
        </div>

        {/* Selected corridor detail */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          {detail && detailKey ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-aviation-border">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: getGeoColor(detailKey) }}
                  />
                  <h3 className="text-base font-bold text-white">{detail.region} Corridor</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-aviation-dark border border-aviation-border text-slate-300">
                    {detail.geoSummary}
                  </span>
                </div>
                {detailKey !== 'US' && (
                  <span className="text-[11px] font-mono text-aviation-textMuted">
                    SFO &rarr; {REGION_GATEWAYS[detailKey].label} (
                    {REGION_GATEWAYS[detailKey].iata}) &middot;{' '}
                    {formatNumber(greatCircleNm(SFO.coords, REGION_GATEWAYS[detailKey].coords))} nm
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <StatTile label="Landings" value={formatNumber(detail.landings)} accent="text-sky-300" />
                <StatTile
                  label="Volume Share"
                  value={formatPercent(detail.shareLandings)}
                  accent="text-cyan-300"
                />
                <StatTile
                  label="Landed Weight"
                  value={formatWeight(detail.landedWeight, weightUnit)}
                  accent="text-slate-200"
                />
                <StatTile
                  label="Avg MTOW"
                  value={formatWeight(detail.avgWeightPerFlight, weightUnit)}
                  accent="text-indigo-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DetailList
                  icon={<Building2 className="w-4 h-4 text-sky-400" />}
                  title="Top Carriers"
                  rows={detail.topAirlines.map((a) => ({
                    label: a.airline,
                    value: formatNumber(a.landings),
                  }))}
                />
                <DetailList
                  icon={<Plane className="w-4 h-4 text-indigo-400" />}
                  title="Top Aircraft Models"
                  rows={detail.topModels.map((m) => ({
                    label: m.model,
                    value: formatNumber(m.landings),
                  }))}
                />
              </div>
            </>
          ) : (
            <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center gap-3">
              <Globe2 className="w-8 h-8 text-slate-600" />
              <div>
                <p className="text-sm font-semibold text-slate-300">No corridor selected</p>
                <p className="text-xs font-mono text-aviation-textMuted mt-1 max-w-sm">
                  Click a region on the globe or in the corridor ledger to break down its carriers,
                  fleet mix and landed weight.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. International share + gauge by region */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-aviation-border">
            <div className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">International Geographic Distribution</h3>
            </div>
            <span className="text-xs font-mono text-aviation-textMuted">Cross-Border Corridors</span>
          </div>

          <div className="relative h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={internationalRegions}
                  dataKey="landings"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={96}
                  paddingAngle={3}
                  onClick={(entry: any) => {
                    const key = normalizeRegion(entry?.region ?? entry?.payload?.region ?? '');
                    if (key) setSelectedRegion((prev) => (prev === key ? null : key));
                  }}
                >
                  {internationalRegions.map((entry) => {
                    const key = normalizeRegion(entry.region);
                    const isSelected = key !== null && key === selectedRegion;
                    return (
                      <Cell
                        key={`intl-cell-${entry.region}`}
                        fill={getGeoColor(entry.region)}
                        stroke={isSelected ? '#F8FAFC' : '#0B111E'}
                        strokeWidth={isSelected ? 2.5 : 2}
                        fillOpacity={selectedRegion && !isSelected ? 0.35 : 1}
                        className="cursor-pointer outline-none"
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Part-to-whole anchor in the donut hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-mono uppercase tracking-wider text-aviation-textMuted">
                Intl Landings
              </span>
              <span className="text-xl font-bold font-mono text-white">
                {formatNumber(internationalTotal)}
              </span>
            </div>
          </div>

          {/* Legend doubles as a selector */}
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
            {internationalRegions.map((entry) => {
              const key = normalizeRegion(entry.region);
              const isSelected = key !== null && key === selectedRegion;
              return (
                <button
                  key={`legend-${entry.region}`}
                  type="button"
                  disabled={key === null}
                  onClick={() => key && setSelectedRegion(isSelected ? null : key)}
                  aria-pressed={isSelected}
                  className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded text-[11px] font-mono transition-colors ${
                    isSelected ? 'bg-aviation-cardHover text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{ backgroundColor: getGeoColor(entry.region) }}
                    />
                    <span className="truncate">{entry.region}</span>
                  </span>
                  <span className="shrink-0 text-slate-300">
                    {formatPercent(
                      internationalTotal > 0 ? entry.landings / internationalTotal : 0
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-aviation-border">
            <div className="flex items-center gap-2">
              <PlaneLanding className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Average Aircraft Gauge by Region</h3>
            </div>
            <span className="text-xs font-mono text-aviation-textMuted">MTOW / Flight</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geoRegions} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis
                  dataKey="region"
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickFormatter={(val) => formatWeight(val, weightUnit)}
                />
                <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} cursor={{ fill: 'rgba(56,189,248,0.06)' }} />
                <Bar
                  dataKey="avgWeightPerFlight"
                  name="Avg MTOW / Flight"
                  radius={[6, 6, 0, 0]}
                  onClick={(entry: any) => {
                    const key = normalizeRegion(entry?.region ?? entry?.payload?.region ?? '');
                    if (key) setSelectedRegion((prev) => (prev === key ? null : key));
                  }}
                >
                  {geoRegions.map((entry) => {
                    const key = normalizeRegion(entry.region);
                    const isSelected = key !== null && key === selectedRegion;
                    return (
                      <Cell
                        key={`gauge-${entry.region}`}
                        fill={getGeoColor(entry.region)}
                        fillOpacity={selectedRegion && !isSelected ? 0.3 : 1}
                        className="cursor-pointer outline-none"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatTile: React.FC<{ label: string; value: string; accent: string }> = ({
  label,
  value,
  accent,
}) => (
  <div className="p-3 rounded-lg bg-aviation-dark/70 border border-aviation-border">
    <div className="text-[10px] font-mono uppercase tracking-wider text-aviation-textMuted">
      {label}
    </div>
    <div className={`mt-1 text-base font-bold font-mono ${accent}`}>{value}</div>
  </div>
);

const DetailList: React.FC<{
  icon: React.ReactNode;
  title: string;
  rows: { label: string; value: string }[];
}> = ({ icon, title, rows }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-[11px] font-mono uppercase tracking-wider text-aviation-textMuted">
        {title}
      </span>
    </div>
    <div className="space-y-1.5">
      {rows.length === 0 && (
        <div className="text-xs font-mono text-slate-500">No data in current selection.</div>
      )}
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg bg-aviation-dark/70 border border-aviation-border text-xs font-mono"
        >
          <span className="text-slate-200 truncate" title={row.label}>
            {row.label}
          </span>
          <span className="text-sky-300 font-bold shrink-0">{row.value}</span>
        </div>
      ))}
    </div>
  </div>
);
