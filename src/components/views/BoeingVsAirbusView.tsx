import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { MonthlyAggregate, AirlineStat, ModelStat, ManufacturerComparison } from '../../types';
import { CustomTooltip } from '../CustomTooltip';
import { formatNumber, formatWeight, formatPercent } from '../../utils/formatters';
import { flattenSeries } from '../../utils/chartChildren';
import { Swords, Shield, Zap, Layers, CheckCircle2 } from 'lucide-react';

interface BoeingVsAirbusViewProps {
  monthlyData: MonthlyAggregate[];
  manufacturers: ManufacturerComparison[];
  airlines: AirlineStat[];
  models: ModelStat[];
  weightUnit: 'lbs' | 'metric_tonnes';
}

export const BoeingVsAirbusView: React.FC<BoeingVsAirbusViewProps> = ({
  monthlyData,
  manufacturers,
  airlines,
  models,
  weightUnit,
}) => {
  const [shareMetric, setShareMetric] = useState<'landings' | 'weight' | 'count_landings' | 'count_weight'>('landings');
  const [granularity, setGranularity] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

  // Boeing and Airbus summaries
  const boeingSummary = useMemo(() => {
    return manufacturers.find((m) => m.manufacturer.toLowerCase().includes('boeing')) || {
      manufacturer: 'Boeing',
      landings: 0,
      landedWeight: 0,
      shareLandings: 0,
      shareWeight: 0,
      avgWeightPerLanding: 0,
      topModel: 'B738',
      airlinesUsing: 0,
      topModels: [],
    };
  }, [manufacturers]);

  const airbusSummary = useMemo(() => {
    return manufacturers.find((m) => m.manufacturer.toLowerCase().includes('airbus')) || {
      manufacturer: 'Airbus',
      landings: 0,
      landedWeight: 0,
      shareLandings: 0,
      shareWeight: 0,
      avgWeightPerLanding: 0,
      topModel: 'A320',
      airlinesUsing: 0,
      topModels: [],
    };
  }, [manufacturers]);

  // Aggregated data according to selected granularity
  const aggregatedTimeline = useMemo(() => {
    if (granularity === 'monthly') {
      return monthlyData.map((m) => {
        const totalL = m.landings || 1;
        const totalW = m.landedWeight || 1;
        const bLandings = m.boeingLandings || 0;
        const aLandings = m.airbusLandings || 0;
        const rLandings = m.regionalLandings || 0;

        const bWeight = m.boeingWeight || 0;
        const aWeight = m.airbusWeight || 0;
        const rWeight = m.regionalWeight || 0;

        return {
          period: m.period,
          year: m.year,
          boeingLandings: bLandings,
          airbusLandings: aLandings,
          regionalLandings: rLandings,
          boeingWeight: bWeight,
          airbusWeight: aWeight,
          regionalWeight: rWeight,
          boeingShareLandings: parseFloat(((bLandings / totalL) * 100).toFixed(1)),
          airbusShareLandings: parseFloat(((aLandings / totalL) * 100).toFixed(1)),
          regionalShareLandings: parseFloat(((rLandings / totalL) * 100).toFixed(1)),
          boeingShareWeight: parseFloat(((bWeight / totalW) * 100).toFixed(1)),
          airbusShareWeight: parseFloat(((aWeight / totalW) * 100).toFixed(1)),
          regionalShareWeight: parseFloat(((rWeight / totalW) * 100).toFixed(1)),
        };
      });
    }

    const map = new Map<string, any>();

    for (const m of monthlyData) {
      let key = '';
      let periodLabel = '';
      if (granularity === 'annual') {
        key = String(m.year);
        periodLabel = String(m.year);
      } else {
        const q = Math.ceil(m.month / 3);
        key = `${m.year}-Q${q}`;
        periodLabel = `${m.year} Q${q}`;
      }

      if (!map.has(key)) {
        map.set(key, {
          period: periodLabel,
          periodNum: m.periodNum,
          year: m.year,
          landings: 0,
          landedWeight: 0,
          boeingLandings: 0,
          airbusLandings: 0,
          regionalLandings: 0,
          boeingWeight: 0,
          airbusWeight: 0,
          regionalWeight: 0,
        });
      }

      const item = map.get(key);
      item.landings += m.landings;
      item.landedWeight += m.landedWeight;
      item.boeingLandings += m.boeingLandings || 0;
      item.airbusLandings += m.airbusLandings || 0;
      item.regionalLandings += m.regionalLandings || 0;
      item.boeingWeight += m.boeingWeight || 0;
      item.airbusWeight += m.airbusWeight || 0;
      item.regionalWeight += m.regionalWeight || 0;
    }

    const list = Array.from(map.values()).sort((a, b) => a.periodNum - b.periodNum);

    return list.map((item) => {
      const totalL = item.landings || 1;
      const totalW = item.landedWeight || 1;
      return {
        ...item,
        boeingShareLandings: parseFloat(((item.boeingLandings / totalL) * 100).toFixed(1)),
        airbusShareLandings: parseFloat(((item.airbusLandings / totalL) * 100).toFixed(1)),
        regionalShareLandings: parseFloat(((item.regionalLandings / totalL) * 100).toFixed(1)),
        boeingShareWeight: parseFloat(((item.boeingWeight / totalW) * 100).toFixed(1)),
        airbusShareWeight: parseFloat(((item.airbusWeight / totalW) * 100).toFixed(1)),
        regionalShareWeight: parseFloat(((item.regionalWeight / totalW) * 100).toFixed(1)),
      };
    });
  }, [monthlyData, granularity]);

  // Model comparison breakdown (Boeing models vs Airbus models)
  const boeingModels = useMemo(() => {
    return models.filter((m) => m.manufacturer.toLowerCase().includes('boeing')).slice(0, 6);
  }, [models]);

  const airbusModels = useMemo(() => {
    return models.filter((m) => m.manufacturer.toLowerCase().includes('airbus')).slice(0, 6);
  }, [models]);

  // Airline fleet breakdown
  const pureBoeingAirlines = useMemo(
    () => airlines.filter((a) => a.boeingRatio > 0.9 && a.landings > 1000).slice(0, 5),
    [airlines]
  );
  const pureAirbusAirlines = useMemo(
    () => airlines.filter((a) => a.airbusRatio > 0.9 && a.landings > 1000).slice(0, 5),
    [airlines]
  );
  const mixedAirlines = useMemo(
    () =>
      airlines
        .filter((a) => a.boeingRatio > 0.15 && a.airbusRatio > 0.15 && a.landings > 5000)
        .slice(0, 5),
    [airlines]
  );

  const isShareMode = shareMetric === 'landings' || shareMetric === 'weight';
  const chartKey = `bvsa-${shareMetric}-${granularity}`;

  return (
    <div className="space-y-6">
      {/* 1. Duel Arena Scoreboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Boeing Corner */}
        <div className="glass-panel rounded-2xl p-6 border-t-4 border-t-boeing-light relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-boeing-light">
            <Shield className="w-32 h-32" />
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-aviation-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-boeing/30 border border-boeing-light/40 flex items-center justify-center text-boeing-light font-bold font-mono">
                B
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">THE BOEING COMPANY</h3>
                <span className="text-xs font-mono text-boeing-light">USA • Commercial Airplanes</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-boeing/20 text-boeing-light border border-boeing-light/40">
              {formatPercent(boeingSummary.shareLandings)} Landings Share
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
            <div className="p-3.5 rounded-xl bg-aviation-dark/80 border border-aviation-border">
              <div className="text-xs font-mono text-aviation-textMuted">Total Landings</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatNumber(boeingSummary.landings)}
              </div>
              <div className="text-[10px] font-mono text-boeing-light mt-0.5">
                {formatPercent(boeingSummary.shareLandings)} of airport
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-aviation-dark/80 border border-aviation-border">
              <div className="text-xs font-mono text-aviation-textMuted">Total MTOW</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatWeight(boeingSummary.landedWeight, weightUnit)}
              </div>
              <div className="text-[10px] font-mono text-boeing-light mt-0.5">
                {formatPercent(boeingSummary.shareWeight)} of weight
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-aviation-dark/80 border border-aviation-border col-span-2 sm:col-span-1">
              <div className="text-xs font-mono text-aviation-textMuted">Avg Weight / Flight</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatWeight(boeingSummary.avgWeightPerLanding, weightUnit)}
              </div>
              <div className="text-[10px] font-mono text-aviation-textMuted mt-0.5">Heavy Gauge</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-mono text-slate-400 font-semibold mb-2">TOP BOEING AIRFRAMES:</div>
            <div className="flex flex-wrap gap-2">
              {boeingSummary.topModels.map((m) => (
                <span
                  key={m.model}
                  className="px-2.5 py-1 rounded-lg bg-boeing/20 border border-boeing-light/30 text-xs font-mono text-slate-200"
                >
                  <span className="font-bold text-boeing-light">{m.model}</span> ({formatNumber(m.landings)})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Airbus Corner */}
        <div className="glass-panel rounded-2xl p-6 border-t-4 border-t-airbus-cyan relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-airbus-cyan">
            <Zap className="w-32 h-32" />
          </div>
          <div className="flex items-center justify-between pb-4 border-b border-aviation-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-airbus-cyan/20 border border-airbus-cyan/40 flex items-center justify-center text-airbus-cyan font-bold font-mono">
                A
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide">AIRBUS S.A.S.</h3>
                <span className="text-xs font-mono text-airbus-cyan">Europe • Commercial Aircraft</span>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-airbus-cyan/20 text-airbus-cyan border border-airbus-cyan/40">
              {formatPercent(airbusSummary.shareLandings)} Landings Share
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5">
            <div className="p-3.5 rounded-xl bg-aviation-dark/80 border border-aviation-border">
              <div className="text-xs font-mono text-aviation-textMuted">Total Landings</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatNumber(airbusSummary.landings)}
              </div>
              <div className="text-[10px] font-mono text-airbus-cyan mt-0.5">
                {formatPercent(airbusSummary.shareLandings)} of airport
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-aviation-dark/80 border border-aviation-border">
              <div className="text-xs font-mono text-aviation-textMuted">Total MTOW</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatWeight(airbusSummary.landedWeight, weightUnit)}
              </div>
              <div className="text-[10px] font-mono text-airbus-cyan mt-0.5">
                {formatPercent(airbusSummary.shareWeight)} of weight
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-aviation-dark/80 border border-aviation-border col-span-2 sm:col-span-1">
              <div className="text-xs font-mono text-aviation-textMuted">Avg Weight / Flight</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {formatWeight(airbusSummary.avgWeightPerLanding, weightUnit)}
              </div>
              <div className="text-[10px] font-mono text-aviation-textMuted mt-0.5">Fleet Gauge</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-mono text-slate-400 font-semibold mb-2">TOP AIRBUS AIRFRAMES:</div>
            <div className="flex flex-wrap gap-2">
              {airbusSummary.topModels.map((m) => (
                <span
                  key={m.model}
                  className="px-2.5 py-1 rounded-lg bg-airbus-cyan/15 border border-airbus-cyan/30 text-xs font-mono text-slate-200"
                >
                  <span className="font-bold text-airbus-cyan">{m.model}</span> ({formatNumber(m.landings)})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Market Share Evolution Chart */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-aviation-border">
          <div>
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Boeing vs Airbus Duopoly Trajectory (2005 – 2018)</h3>
            </div>
            <p className="text-xs text-aviation-textMuted font-mono mt-0.5">
              Comparative market share percentage and absolute volume timeline
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Metric Mode Toggle */}
            <div className="flex items-center bg-aviation-dark p-1 rounded-lg border border-aviation-border text-xs font-mono">
              <button
                onClick={() => setShareMetric('landings')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  shareMetric === 'landings'
                    ? 'bg-sky-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Share of Landings (%)
              </button>
              <button
                onClick={() => setShareMetric('weight')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  shareMetric === 'weight'
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Share of Weight (%)
              </button>
              <button
                onClick={() => setShareMetric('count_landings')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  shareMetric === 'count_landings'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Flight Landings Count
              </button>
              <button
                onClick={() => setShareMetric('count_weight')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  shareMetric === 'count_weight'
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Landed Weight (MTOW)
              </button>
            </div>

            {/* Granularity Toggle */}
            <div className="flex items-center bg-aviation-dark p-1 rounded-lg border border-aviation-border text-xs font-mono">
              <button
                onClick={() => setGranularity('monthly')}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  granularity === 'monthly' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setGranularity('quarterly')}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  granularity === 'quarterly' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Quarter
              </button>
              <button
                onClick={() => setGranularity('annual')}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  granularity === 'annual' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Year
              </button>
            </div>
          </div>
        </div>

        {/* Chart area with definite height */}
        <div className="w-full pt-4" style={{ height: 380, minHeight: 380 }}>
          <ResponsiveContainer width="100%" height={380} minWidth={0}>
            <AreaChart key={chartKey} data={aggregatedTimeline} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis dataKey="period" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} minTickGap={25} />
              <YAxis
                stroke="#64748B"
                width={70}
                domain={isShareMode ? [0, 100] : ['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickFormatter={(val) =>
                  isShareMode
                    ? `${val}%`
                    : shareMetric === 'count_landings'
                    ? formatNumber(val)
                    : formatWeight(val, weightUnit)
                }
              />
              <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontFamily: 'monospace' }} />
              {flattenSeries(
                shareMetric === 'landings' ? (
                <>
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="boeingShareLandings"
                    name="Boeing Landings Share (%)"
                    stroke="#2D8FE6"
                    strokeWidth={2.5}
                    fillOpacity={0.35}
                    fill="#2D8FE6"
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="airbusShareLandings"
                    name="Airbus Landings Share (%)"
                    stroke="#06B6D4"
                    strokeWidth={2.5}
                    fillOpacity={0.35}
                    fill="#06B6D4"
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="regionalShareLandings"
                    name="Regional Share (%)"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    fillOpacity={0.2}
                    fill="#F59E0B"
                  />
                </>
              ) : shareMetric === 'weight' ? (
                <>
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="boeingShareWeight"
                    name="Boeing Weight Share (%)"
                    stroke="#2D8FE6"
                    strokeWidth={2.5}
                    fillOpacity={0.35}
                    fill="#2D8FE6"
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="airbusShareWeight"
                    name="Airbus Weight Share (%)"
                    stroke="#06B6D4"
                    strokeWidth={2.5}
                    fillOpacity={0.35}
                    fill="#06B6D4"
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="regionalShareWeight"
                    name="Regional Weight Share (%)"
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    fillOpacity={0.2}
                    fill="#F59E0B"
                  />
                </>
              ) : shareMetric === 'count_landings' ? (
                <>
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="boeingLandings"
                    name="Boeing Landings"
                    stroke="#2D8FE6"
                    strokeWidth={2}
                    fillOpacity={0.35}
                    fill="#2D8FE6"
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="airbusLandings"
                    name="Airbus Landings"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    fillOpacity={0.35}
                    fill="#06B6D4"
                  />
                </>
              ) : (
                <>
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="boeingWeight"
                    name="Boeing MTOW"
                    stroke="#2D8FE6"
                    strokeWidth={2}
                    fillOpacity={0.35}
                    fill="#2D8FE6"
                  />
                  <Area
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="airbusWeight"
                    name="Airbus MTOW"
                    stroke="#06B6D4"
                    strokeWidth={2}
                    fillOpacity={0.35}
                    fill="#06B6D4"
                  />
                </>
                )
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Model Breakdown & Carrier Loyalty */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model vs Model Duel */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-aviation-border">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Flagship Airframe Comparison</h3>
            </div>
            <span className="text-xs font-mono text-aviation-textMuted">Volume by Model</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-mono font-semibold text-boeing-light mb-2">BOEING MODELS</div>
              <div className="space-y-2">
                {boeingModels.map((m) => (
                  <div key={m.model} className="p-2.5 rounded-lg bg-aviation-dark/70 border border-aviation-border text-xs font-mono flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{m.model}</span>
                      <span className="text-[10px] text-aviation-textMuted">({m.bodyType})</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-300">{formatNumber(m.landings)} flights</span>
                      <span className="text-boeing-light font-bold">{formatWeight(m.avgWeight, weightUnit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-mono font-semibold text-airbus-cyan mb-2">AIRBUS MODELS</div>
              <div className="space-y-2">
                {airbusModels.map((m) => (
                  <div key={m.model} className="p-2.5 rounded-lg bg-aviation-dark/70 border border-aviation-border text-xs font-mono flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{m.model}</span>
                      <span className="text-[10px] text-aviation-textMuted">({m.bodyType})</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-300">{formatNumber(m.landings)} flights</span>
                      <span className="text-airbus-cyan font-bold">{formatWeight(m.avgWeight, weightUnit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Carrier Fleet Alignment */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-aviation-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Airline Fleet Loyalty</h3>
            </div>
            <span className="text-xs font-mono text-aviation-textMuted">Fleet Specialization</span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Pure Boeing */}
            <div>
              <div className="text-boeing-light font-bold mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-boeing-light"></span>
                <span>BOEING EXCLUSIVE CARRIERS (&gt;90%)</span>
              </div>
              <div className="space-y-1.5">
                {pureBoeingAirlines.map((a) => (
                  <div key={a.airline} className="p-2 rounded-lg bg-aviation-dark/70 border border-aviation-border flex justify-between items-center">
                    <span className="text-white font-medium">{a.airline}</span>
                    <span className="text-boeing-light font-bold">{formatPercent(a.boeingRatio)} Boeing ({formatNumber(a.landings)})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pure Airbus */}
            <div>
              <div className="text-airbus-cyan font-bold mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-airbus-cyan"></span>
                <span>AIRBUS EXCLUSIVE CARRIERS (&gt;90%)</span>
              </div>
              <div className="space-y-1.5">
                {pureAirbusAirlines.map((a) => (
                  <div key={a.airline} className="p-2 rounded-lg bg-aviation-dark/70 border border-aviation-border flex justify-between items-center">
                    <span className="text-white font-medium">{a.airline}</span>
                    <span className="text-airbus-cyan font-bold">{formatPercent(a.airbusRatio)} Airbus ({formatNumber(a.landings)})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mixed Fleets */}
            <div>
              <div className="text-indigo-400 font-bold mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span>BALANCED / DUAL-FLEET OPERATORS</span>
              </div>
              <div className="space-y-1.5">
                {mixedAirlines.map((a) => (
                  <div key={a.airline} className="p-2 rounded-lg bg-aviation-dark/70 border border-aviation-border flex justify-between items-center">
                    <span className="text-white font-medium truncate max-w-[180px]">{a.airline}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-boeing-light">{formatPercent(a.boeingRatio)} B</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-airbus-cyan">{formatPercent(a.airbusRatio)} A</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
