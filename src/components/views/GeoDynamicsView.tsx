import React, { useMemo } from 'react';
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
import { formatNumber, formatWeight, formatPercent, getGeoColor } from '../../utils/formatters';
import { Globe2, PlaneLanding, Compass } from 'lucide-react';

interface GeoDynamicsViewProps {
  geoRegions: GeoRegionStat[];
  weightUnit: 'lbs' | 'metric_tonnes';
}

export const GeoDynamicsView: React.FC<GeoDynamicsViewProps> = ({ geoRegions, weightUnit }) => {
  const internationalRegions = useMemo(() => {
    return geoRegions.filter((r) => r.region.toLowerCase() !== 'us');
  }, [geoRegions]);

  const usRegion = useMemo(() => {
    return geoRegions.find((r) => r.region.toLowerCase() === 'us');
  }, [geoRegions]);

  return (
    <div className="space-y-6">
      {/* 1. Global Route Corridors Overview */}
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
                  <span className="text-sky-400">{formatPercent(usRegion.shareLandings)} of total SFO volume</span>
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
                  <span className="text-slate-400 font-semibold block mb-1">Top Domestic Carriers:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {usRegion.topAirlines.slice(0, 3).map((a) => (
                      <span key={a.airline} className="px-2 py-0.5 rounded bg-aviation-dark border border-aviation-border text-[11px] text-slate-200">
                        {a.airline} ({formatNumber(a.landings)})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* International Regions Breakdown (Donut) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-aviation-border">
            <div className="flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white">International Geographic Distribution</h3>
            </div>
            <span className="text-xs font-mono text-aviation-textMuted">Cross-Border Corridors</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={internationalRegions}
                    dataKey="landings"
                    nameKey="region"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {internationalRegions.map((entry, index) => (
                      <Cell
                        key={`intl-cell-${index}`}
                        fill={getGeoColor(entry.region)}
                        stroke="#0B111E"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {internationalRegions.map((r) => (
                <div
                  key={r.region}
                  className="flex items-center justify-between p-2 rounded-lg bg-aviation-dark/70 border border-aviation-border text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: getGeoColor(r.region) }} />
                    <span className="font-semibold text-white">{r.region}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sky-300 font-bold">{formatNumber(r.landings)}</div>
                    <div className="text-[10px] text-aviation-textMuted">{formatWeight(r.avgWeightPerFlight, weightUnit)} avg</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Heavy Long-Haul vs Gauge by Region */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-aviation-border">
          <div className="flex items-center gap-2">
            <PlaneLanding className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Average Aircraft Gauge by Region (MTOW / Flight)</h3>
          </div>
          <span className="text-xs font-mono text-aviation-textMuted">Widebody vs Regional Index</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={geoRegions}
              margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            >
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
              <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} />
              <Bar dataKey="avgWeightPerFlight" name="Avg MTOW / Flight" radius={[6, 6, 0, 0]}>
                {geoRegions.map((entry, index) => (
                  <Cell key={`gauge-${index}`} fill={getGeoColor(entry.region)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
