import React from 'react';
import { PlaneTakeoff, Weight, Gauge, Users, Compass, ShieldCheck } from 'lucide-react';
import { MetricSummary } from '../types';
import { formatNumber, formatWeight, formatPercent } from '../utils/formatters';

interface KPICardsProps {
  metrics: MetricSummary;
  weightUnit: 'lbs' | 'metric_tonnes';
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics, weightUnit }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* 1. Total Landings */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-sky-500">
        <div className="flex items-center justify-between text-aviation-textMuted mb-2">
          <span className="text-xs font-mono font-medium uppercase tracking-wider">Total Landings</span>
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
            <PlaneTakeoff className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {formatNumber(metrics.totalLandings)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-aviation-textMuted">
            <span>Operations Count</span>
            <span className="text-sky-400 font-mono">100% Volume</span>
          </div>
        </div>
      </div>

      {/* 2. Total Landed Weight */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-cyan-500">
        <div className="flex items-center justify-between text-aviation-textMuted mb-2">
          <span className="text-xs font-mono font-medium uppercase tracking-wider">Total Landed Weight</span>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Weight className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {formatWeight(metrics.totalLandedWeight, weightUnit)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-aviation-textMuted">
            <span>Cumulative MTOW</span>
            <span className="text-cyan-400 font-mono">{weightUnit === 'lbs' ? 'lbs' : 'Tonnes'}</span>
          </div>
        </div>
      </div>

      {/* 3. Average Aircraft Gauge / Weight */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-indigo-500">
        <div className="flex items-center justify-between text-aviation-textMuted mb-2">
          <span className="text-xs font-mono font-medium uppercase tracking-wider">Avg Weight / Flight</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {formatWeight(metrics.avgWeightPerLanding, weightUnit)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-aviation-textMuted">
            <span>Fleet Capacity Index</span>
            <span className="text-indigo-400 font-mono">Avg MTOW</span>
          </div>
        </div>
      </div>

      {/* 4. Active Airlines & Fleet Models */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-emerald-500">
        <div className="flex items-center justify-between text-aviation-textMuted mb-2">
          <span className="text-xs font-mono font-medium uppercase tracking-wider">Airlines / Models</span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight flex items-baseline gap-1.5">
            <span>{metrics.totalAirlines}</span>
            <span className="text-sm font-normal text-aviation-textMuted">airlines /</span>
            <span className="text-lg text-emerald-400 font-semibold">{metrics.totalModels}</span>
            <span className="text-xs font-normal text-aviation-textMuted">models</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-aviation-textMuted">
            <span>Fleet Diversity</span>
            <span className="text-emerald-400 font-mono">Active Diversity</span>
          </div>
        </div>
      </div>

      {/* 5. Boeing vs Airbus Landings Duel */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-blue-600">
        <div className="flex items-center justify-between text-aviation-textMuted mb-1">
          <span className="text-xs font-mono font-medium uppercase tracking-wider">Boeing vs Airbus</span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
            <span className="text-boeing-light">Boeing: {formatPercent(metrics.boeingShareLandings)}</span>
            <span className="text-airbus-cyan">Airbus: {formatPercent(metrics.airbusShareLandings)}</span>
          </div>
          {/* Dual bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 flex overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, metrics.boeingShareLandings * 100))}%` }}
              title={`Boeing: ${formatPercent(metrics.boeingShareLandings)}`}
            />
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, metrics.airbusShareLandings * 100))}%` }}
              title={`Airbus: ${formatPercent(metrics.airbusShareLandings)}`}
            />
          </div>
          <div className="mt-1 text-[11px] text-aviation-textMuted font-mono flex justify-between">
            <span>Market Duel</span>
            <span>By Landings</span>
          </div>
        </div>
      </div>

      {/* 6. Domestic vs International Split */}
      <div className="glass-panel glass-panel-hover rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-purple-500">
        <div className="flex items-center justify-between text-aviation-textMuted mb-1">
          <span className="text-xs font-mono font-medium uppercase tracking-wider">Route Scope</span>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <Compass className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
            <span className="text-purple-300">Dom: {formatPercent(metrics.domesticShare)}</span>
            <span className="text-pink-400">Intl: {formatPercent(metrics.internationalShare)}</span>
          </div>
          {/* Dual bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 flex overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, metrics.domesticShare * 100))}%` }}
              title={`Domestic: ${formatPercent(metrics.domesticShare)}`}
            />
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, metrics.internationalShare * 100))}%` }}
              title={`International: ${formatPercent(metrics.internationalShare)}`}
            />
          </div>
          <div className="mt-1 text-[11px] text-aviation-textMuted font-mono flex justify-between">
            <span>Flight Boundary</span>
            <span>Domestic Focus</span>
          </div>
        </div>
      </div>
    </div>
  );
};
