import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { MonthlyAggregate, ModelStat } from '../../types';
import { CustomTooltip } from '../CustomTooltip';
import { formatNumber, formatWeight } from '../../utils/formatters';
import { Plane, Gauge, Layers } from 'lucide-react';

interface FleetEvolutionViewProps {
  monthlyData: MonthlyAggregate[];
  models: ModelStat[];
  weightUnit: 'lbs' | 'metric_tonnes';
}

export const FleetEvolutionView: React.FC<FleetEvolutionViewProps> = ({
  monthlyData,
  models,
  weightUnit,
}) => {
  // Annual aggregated body type data
  const annualBodyData = useMemo(() => {
    const map = new Map<number, any>();
    for (const m of monthlyData) {
      if (!map.has(m.year)) {
        map.set(m.year, {
          year: m.year,
          narrowBody: 0,
          wideBody: 0,
          regionalJet: 0,
          turboProp: 0,
          totalLandings: 0,
          totalWeight: 0,
          avgWeight: 0,
        });
      }
      const item = map.get(m.year);
      item.narrowBody += m.narrowBodyLandings;
      item.wideBody += m.wideBodyLandings;
      item.regionalJet += m.regionalJetLandings;
      item.turboProp += m.turboPropLandings;
      item.totalLandings += m.landings;
      item.totalWeight += m.landedWeight;
    }
    const list = Array.from(map.values()).sort((a, b) => a.year - b.year);
    for (const it of list) {
      it.avgWeight = it.totalLandings > 0 ? Math.round(it.totalWeight / it.totalLandings) : 0;
    }
    return list;
  }, [monthlyData]);

  // Heavy widebody models
  const heavyModels = useMemo(() => {
    return models.filter((m) => m.bodyType.toLowerCase().includes('wide')).slice(0, 8);
  }, [models]);

  return (
    <div className="space-y-6">
      {/* 1. Body Type Mix Evolution (Stacked Area Chart) */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-aviation-border">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-bold text-white">Aircraft Body Type Shift (2005 – 2018)</h3>
            </div>
            <p className="text-xs text-aviation-textMuted font-mono mt-0.5">
              Transition from Turbo-Props & small Regional Jets to modern Narrow & Wide-body airframes
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/30">
            Fleet Modernization
          </span>
        </div>

        <div className="h-80 sm:h-96 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={annualBodyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorNarrow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorWide" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818CF8" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#818CF8" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorRegional" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorTurbo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis dataKey="year" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis
                stroke="#64748B"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickFormatter={(val) => formatNumber(val)}
              />
              <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontFamily: 'monospace' }} />
              <Area
                type="monotone"
                dataKey="narrowBody"
                name="Narrow Body"
                stackId="1"
                stroke="#38BDF8"
                fill="url(#colorNarrow)"
              />
              <Area
                type="monotone"
                dataKey="wideBody"
                name="Wide Body"
                stackId="1"
                stroke="#818CF8"
                fill="url(#colorWide)"
              />
              <Area
                type="monotone"
                dataKey="regionalJet"
                name="Regional Jet"
                stackId="1"
                stroke="#FBBF24"
                fill="url(#colorRegional)"
              />
              <Area
                type="monotone"
                dataKey="turboProp"
                name="Turbo Prop"
                stackId="1"
                stroke="#34D399"
                fill="url(#colorTurbo)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Up-Gauging Trend: Average Weight Per Landing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-aviation-border">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Up-Gauging Trend (Avg MTOW / Flight)</h3>
            </div>
            <span className="text-xs font-mono text-aviation-textMuted">Capacity Index</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={annualBodyData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis dataKey="year" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                <YAxis
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickFormatter={(val) => formatWeight(val, weightUnit)}
                />
                <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} />
                <Line
                  type="monotone"
                  dataKey="avgWeight"
                  name="Avg Landed Weight"
                  stroke="#818CF8"
                  strokeWidth={3}
                  dot={{ fill: '#818CF8', r: 4 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heavy Widebodies Showcase */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-aviation-border">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold text-white">Flagship Wide-Body Heavies</h3>
            </div>
            <span className="text-xs font-mono text-aviation-textMuted">Long-Haul Flagships</span>
          </div>

          <div className="space-y-2.5">
            {heavyModels.map((m) => (
              <div
                key={m.model}
                className="p-2.5 rounded-lg bg-aviation-dark/80 border border-aviation-border flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{m.model}</span>
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                      {m.manufacturer}
                    </span>
                  </div>
                  <div className="text-[11px] text-aviation-textMuted mt-0.5">
                    Carriers: {m.topAirlines.slice(0, 3).join(', ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sky-300 font-bold">{formatNumber(m.landings)} flights</div>
                  <div className="text-[11px] text-slate-400">{formatWeight(m.avgWeight, weightUnit)} avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
