import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { MonthlyAggregate, ManufacturerComparison, AirlineStat, ModelStat } from '../../types';
import { CustomTooltip } from '../CustomTooltip';
import { formatNumber, formatWeight, formatPercent, getManufacturerColor } from '../../utils/formatters';
import { flattenSeries } from '../../utils/chartChildren';
import { TrendingUp, BarChart3, PieChart as PieIcon, Plane } from 'lucide-react';

interface OverviewViewProps {
  monthlyData: MonthlyAggregate[];
  manufacturers: ManufacturerComparison[];
  airlines: AirlineStat[];
  models: ModelStat[];
  weightUnit: 'lbs' | 'metric_tonnes';
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  monthlyData,
  manufacturers,
  airlines,
  models,
  weightUnit,
}) => {
  const [metricMode, setMetricMode] = useState<'landings' | 'weight' | 'avgWeight'>('landings');
  const [granularity, setGranularity] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [breakdownMode, setBreakdownMode] = useState<'oem' | 'route' | 'body' | 'total'>('oem');
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');

  // Multi-granularity aggregation (Monthly, Quarterly, Annual)
  const chartData = useMemo(() => {
    if (granularity === 'monthly') {
      return monthlyData.map((m) => ({
        ...m,
        avgWeight: m.landings > 0 ? Math.round(m.landedWeight / m.landings) : 0,
      }));
    }

    const map = new Map<string, any>();

    for (const m of monthlyData) {
      let key = '';
      let periodLabel = '';
      if (granularity === 'annual') {
        key = String(m.year);
        periodLabel = String(m.year);
      } else {
        // Quarterly
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
          avgWeight: 0,
          boeingLandings: 0,
          airbusLandings: 0,
          regionalLandings: 0,
          otherLandings: 0,
          boeingWeight: 0,
          airbusWeight: 0,
          regionalWeight: 0,
          otherWeight: 0,
          domesticLandings: 0,
          internationalLandings: 0,
          domesticWeight: 0,
          internationalWeight: 0,
          narrowBodyLandings: 0,
          wideBodyLandings: 0,
          regionalJetLandings: 0,
          turboPropLandings: 0,
          narrowBodyWeight: 0,
          wideBodyWeight: 0,
          regionalJetWeight: 0,
          turboPropWeight: 0,
        });
      }

      const item = map.get(key);
      item.landings += m.landings;
      item.landedWeight += m.landedWeight;
      item.boeingLandings += m.boeingLandings;
      item.airbusLandings += m.airbusLandings;
      item.regionalLandings += m.regionalLandings || 0;
      item.otherLandings += m.otherLandings || 0;
      item.boeingWeight += m.boeingWeight || 0;
      item.airbusWeight += m.airbusWeight || 0;
      item.regionalWeight += m.regionalWeight || 0;
      item.otherWeight += m.otherWeight || 0;
      item.domesticLandings += m.domesticLandings;
      item.internationalLandings += m.internationalLandings;
      item.domesticWeight += m.domesticWeight || 0;
      item.internationalWeight += m.internationalWeight || 0;
      item.narrowBodyLandings += m.narrowBodyLandings;
      item.wideBodyLandings += m.wideBodyLandings;
      item.regionalJetLandings += m.regionalJetLandings || 0;
      item.turboPropLandings += m.turboPropLandings || 0;
      item.narrowBodyWeight += m.narrowBodyWeight || 0;
      item.wideBodyWeight += m.wideBodyWeight || 0;
      item.regionalJetWeight += m.regionalJetWeight || 0;
      item.turboPropWeight += m.turboPropWeight || 0;
    }

    const list = Array.from(map.values()).sort((a, b) => a.periodNum - b.periodNum);
    for (const item of list) {
      item.avgWeight = item.landings > 0 ? Math.round(item.landedWeight / item.landings) : 0;
    }
    return list;
  }, [monthlyData, granularity]);

  const topAirlines = useMemo(() => airlines.slice(0, 10), [airlines]);
  const topModels = useMemo(() => models.slice(0, 8), [models]);

  // Unique chart key forces Recharts to cleanly re-create SVG scales and avoid animation locks
  const chartKey = `overview-${metricMode}-${granularity}-${breakdownMode}-${chartType}`;

  // Helper for rendering chart series based on breakdownMode & metricMode
  const renderSeries = () => {
    if (metricMode === 'avgWeight') {
      if (chartType === 'bar') {
        return (
          <Bar
            isAnimationActive={false}
            dataKey="avgWeight"
            name="Avg Landed Weight"
            fill="#818CF8"
            radius={[4, 4, 0, 0]}
          />
        );
      }
      if (chartType === 'line') {
        return (
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey="avgWeight"
            name="Avg Landed Weight"
            stroke="#818CF8"
            strokeWidth={3}
            dot={{ r: 3, fill: '#818CF8' }}
            activeDot={{ r: 6 }}
          />
        );
      }
      return (
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey="avgWeight"
          name="Avg Landed Weight"
          stroke="#818CF8"
          strokeWidth={2}
          fillOpacity={0.4}
          fill="#818CF8"
        />
      );
    }

    if (breakdownMode === 'total') {
      const dataKey = metricMode === 'landings' ? 'landings' : 'landedWeight';
      const labelName = metricMode === 'landings' ? 'Total Landings' : 'Total Landed Weight';
      if (chartType === 'bar') {
        return <Bar isAnimationActive={false} dataKey={dataKey} name={labelName} fill="#38BDF8" radius={[4, 4, 0, 0]} />;
      }
      if (chartType === 'line') {
        return (
          <Line
            isAnimationActive={false}
            type="monotone"
            dataKey={dataKey}
            name={labelName}
            stroke="#38BDF8"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        );
      }
      return (
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey={dataKey}
          name={labelName}
          stroke="#38BDF8"
          strokeWidth={2}
          fillOpacity={0.35}
          fill="#38BDF8"
        />
      );
    }

    if (breakdownMode === 'route') {
      const domKey = metricMode === 'landings' ? 'domesticLandings' : 'domesticWeight';
      const intlKey = metricMode === 'landings' ? 'internationalLandings' : 'internationalWeight';
      if (chartType === 'bar') {
        return (
          <>
            <Bar isAnimationActive={false} dataKey={domKey} name="Domestic" fill="#38BDF8" stackId="route" radius={[0, 0, 0, 0]} />
            <Bar isAnimationActive={false} dataKey={intlKey} name="International" fill="#EC4899" stackId="route" radius={[4, 4, 0, 0]} />
          </>
        );
      }
      if (chartType === 'line') {
        return (
          <>
            <Line isAnimationActive={false} type="monotone" dataKey={domKey} name="Domestic" stroke="#38BDF8" strokeWidth={2.5} dot={false} />
            <Line isAnimationActive={false} type="monotone" dataKey={intlKey} name="International" stroke="#EC4899" strokeWidth={2.5} dot={false} />
          </>
        );
      }
      return (
        <>
          <Area isAnimationActive={false} type="monotone" dataKey={domKey} name="Domestic" stackId="route" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.5} />
          <Area isAnimationActive={false} type="monotone" dataKey={intlKey} name="International" stackId="route" stroke="#EC4899" fill="#EC4899" fillOpacity={0.5} />
        </>
      );
    }

    if (breakdownMode === 'body') {
      const narrowKey = metricMode === 'landings' ? 'narrowBodyLandings' : 'narrowBodyWeight';
      const wideKey = metricMode === 'landings' ? 'wideBodyLandings' : 'wideBodyWeight';
      const rjKey = metricMode === 'landings' ? 'regionalJetLandings' : 'regionalJetWeight';
      const turboKey = metricMode === 'landings' ? 'turboPropLandings' : 'turboPropWeight';
      if (chartType === 'bar') {
        return (
          <>
            <Bar isAnimationActive={false} dataKey={narrowKey} name="Narrow Body" fill="#38BDF8" stackId="body" />
            <Bar isAnimationActive={false} dataKey={wideKey} name="Wide Body" fill="#818CF8" stackId="body" />
            <Bar isAnimationActive={false} dataKey={rjKey} name="Regional Jet" fill="#FBBF24" stackId="body" />
            <Bar isAnimationActive={false} dataKey={turboKey} name="Turbo Prop" fill="#34D399" stackId="body" radius={[4, 4, 0, 0]} />
          </>
        );
      }
      if (chartType === 'line') {
        return (
          <>
            <Line isAnimationActive={false} type="monotone" dataKey={narrowKey} name="Narrow Body" stroke="#38BDF8" strokeWidth={2} dot={false} />
            <Line isAnimationActive={false} type="monotone" dataKey={wideKey} name="Wide Body" stroke="#818CF8" strokeWidth={2} dot={false} />
            <Line isAnimationActive={false} type="monotone" dataKey={rjKey} name="Regional Jet" stroke="#FBBF24" strokeWidth={2} dot={false} />
            <Line isAnimationActive={false} type="monotone" dataKey={turboKey} name="Turbo Prop" stroke="#34D399" strokeWidth={2} dot={false} />
          </>
        );
      }
      return (
        <>
          <Area isAnimationActive={false} type="monotone" dataKey={narrowKey} name="Narrow Body" stackId="body" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.6} />
          <Area isAnimationActive={false} type="monotone" dataKey={wideKey} name="Wide Body" stackId="body" stroke="#818CF8" fill="#818CF8" fillOpacity={0.6} />
          <Area isAnimationActive={false} type="monotone" dataKey={rjKey} name="Regional Jet" stackId="body" stroke="#FBBF24" fill="#FBBF24" fillOpacity={0.6} />
          <Area isAnimationActive={false} type="monotone" dataKey={turboKey} name="Turbo Prop" stackId="body" stroke="#34D399" fill="#34D399" fillOpacity={0.6} />
        </>
      );
    }

    // Default OEM Breakdown (Total, Boeing, Airbus, Regional)
    const boeingKey = metricMode === 'landings' ? 'boeingLandings' : 'boeingWeight';
    const airbusKey = metricMode === 'landings' ? 'airbusLandings' : 'airbusWeight';
    const regionalKey = metricMode === 'landings' ? 'regionalLandings' : 'regionalWeight';
    const totalKey = metricMode === 'landings' ? 'landings' : 'landedWeight';

    if (chartType === 'bar') {
      return (
        <>
          <Bar isAnimationActive={false} dataKey={boeingKey} name="Boeing" fill="#2D8FE6" stackId="oem" />
          <Bar isAnimationActive={false} dataKey={airbusKey} name="Airbus" fill="#06B6D4" stackId="oem" />
          <Bar isAnimationActive={false} dataKey={regionalKey} name="Regional" fill="#F59E0B" stackId="oem" radius={[4, 4, 0, 0]} />
        </>
      );
    }

    if (chartType === 'line') {
      return (
        <>
          <Line isAnimationActive={false} type="monotone" dataKey={totalKey} name="Total Volume" stroke="#38BDF8" strokeWidth={2.5} dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey={boeingKey} name="Boeing" stroke="#2D8FE6" strokeWidth={2} dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey={airbusKey} name="Airbus" stroke="#06B6D4" strokeWidth={2} dot={false} />
          <Line isAnimationActive={false} type="monotone" dataKey={regionalKey} name="Regional" stroke="#F59E0B" strokeWidth={1.5} dot={false} strokeDasharray="3 3" />
        </>
      );
    }

    return (
      <>
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey={totalKey}
          name="Total Volume"
          stroke="#38BDF8"
          strokeWidth={2}
          fillOpacity={0.25}
          fill="#38BDF8"
        />
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey={boeingKey}
          name="Boeing"
          stroke="#2D8FE6"
          strokeWidth={1.5}
          fillOpacity={0.35}
          fill="#2D8FE6"
        />
        <Area
          isAnimationActive={false}
          type="monotone"
          dataKey={airbusKey}
          name="Airbus"
          stroke="#06B6D4"
          strokeWidth={1.5}
          fillOpacity={0.35}
          fill="#06B6D4"
        />
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Time-Series Chart Card */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-aviation-border">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Air Traffic Operations Timeline (2005 – 2018)
              </h2>
            </div>
            <p className="text-xs text-aviation-textMuted font-mono mt-0.5">
              Longitudinal flight operations, cumulative MTOW, and aircraft gauge trajectory
            </p>
          </div>

          {/* Multifaceted Controls Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Metric Mode Toggle */}
            <div className="flex items-center bg-aviation-dark p-1 rounded-lg border border-aviation-border text-xs font-mono">
              <button
                onClick={() => setMetricMode('landings')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  metricMode === 'landings'
                    ? 'bg-sky-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Flight Landings
              </button>
              <button
                onClick={() => setMetricMode('weight')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  metricMode === 'weight'
                    ? 'bg-cyan-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Landed Weight
              </button>
              <button
                onClick={() => setMetricMode('avgWeight')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  metricMode === 'avgWeight'
                    ? 'bg-indigo-600 text-white font-semibold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Avg Weight/Flight
              </button>
            </div>

            {/* Breakdown Filter */}
            {metricMode !== 'avgWeight' && (
              <div className="flex items-center bg-aviation-dark p-1 rounded-lg border border-aviation-border text-xs font-mono">
                <button
                  onClick={() => setBreakdownMode('oem')}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    breakdownMode === 'oem'
                      ? 'bg-slate-700 text-sky-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Breakdown by Boeing vs Airbus vs Regional"
                >
                  OEM
                </button>
                <button
                  onClick={() => setBreakdownMode('route')}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    breakdownMode === 'route'
                      ? 'bg-slate-700 text-sky-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Domestic vs International"
                >
                  Scope
                </button>
                <button
                  onClick={() => setBreakdownMode('body')}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    breakdownMode === 'body'
                      ? 'bg-slate-700 text-sky-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Narrow Body vs Wide Body vs Regional Jet"
                >
                  Body
                </button>
                <button
                  onClick={() => setBreakdownMode('total')}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${
                    breakdownMode === 'total'
                      ? 'bg-slate-700 text-sky-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Total aggregate only"
                >
                  Total Only
                </button>
              </div>
            )}

            {/* Granularity Toggle */}
            <div className="flex items-center bg-aviation-dark p-1 rounded-lg border border-aviation-border text-xs font-mono">
              <button
                onClick={() => setGranularity('monthly')}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  granularity === 'monthly'
                    ? 'bg-sky-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setGranularity('quarterly')}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  granularity === 'quarterly'
                    ? 'bg-sky-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Quarter
              </button>
              <button
                onClick={() => setGranularity('annual')}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  granularity === 'annual'
                    ? 'bg-sky-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Year
              </button>
            </div>

            {/* Chart Type Toggle */}
            <div className="flex items-center bg-aviation-dark p-1 rounded-lg border border-aviation-border text-xs font-mono">
              <button
                onClick={() => setChartType('area')}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  chartType === 'area' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  chartType === 'line' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Line
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  chartType === 'bar' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Bar
              </button>
            </div>
          </div>
        </div>

        {/* Chart area with definite height style */}
        <div className="w-full pt-4" style={{ height: 380, minHeight: 380 }}>
          <ResponsiveContainer width="100%" height={380} minWidth={0}>
            {chartType === 'bar' ? (
              <BarChart
                key={chartKey}
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis
                  dataKey="period"
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  minTickGap={25}
                />
                <YAxis
                  stroke="#64748B"
                  width={75}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickFormatter={(val) =>
                    metricMode === 'landings'
                      ? formatNumber(val)
                      : formatWeight(val, weightUnit)
                  }
                />
                <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontFamily: 'monospace' }} />
                {flattenSeries(renderSeries())}
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart
                key={chartKey}
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis
                  dataKey="period"
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  minTickGap={25}
                />
                <YAxis
                  stroke="#64748B"
                  width={75}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickFormatter={(val) =>
                    metricMode === 'landings'
                      ? formatNumber(val)
                      : formatWeight(val, weightUnit)
                  }
                />
                <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontFamily: 'monospace' }} />
                {flattenSeries(renderSeries())}
              </LineChart>
            ) : (
              <AreaChart
                key={chartKey}
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
                <XAxis
                  dataKey="period"
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  minTickGap={25}
                />
                <YAxis
                  stroke="#64748B"
                  width={75}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickFormatter={(val) =>
                    metricMode === 'landings'
                      ? formatNumber(val)
                      : formatWeight(val, weightUnit)
                  }
                />
                <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontFamily: 'monospace' }} />
                {flattenSeries(renderSeries())}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Middle Row: Top 10 Airlines & Aircraft Manufacturers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Airlines */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-aviation-border">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              <h3 className="text-base font-bold text-white">Top 10 Operating Airlines</h3>
            </div>
            <span className="text-xs font-mono text-aviation-textMuted">By Total Landings</span>
          </div>

          <div className="w-full" style={{ height: 300, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
              <BarChart
                isAnimationActive={false}
                data={topAirlines}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickFormatter={(val) => formatNumber(val)}
                />
                <YAxis
                  type="category"
                  dataKey="airline"
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#E2E8F0' }}
                  width={130}
                  tickFormatter={(val) => (val.length > 18 ? val.substring(0, 16) + '...' : val)}
                />
                <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} />
                <Bar isAnimationActive={false} dataKey="landings" name="Landings" fill="#38BDF8" radius={[0, 6, 6, 0]}>
                  {topAirlines.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.dominantManufacturer === 'Boeing'
                          ? '#2D8FE6'
                          : entry.dominantManufacturer === 'Airbus'
                          ? '#06B6D4'
                          : '#818CF8'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aircraft Manufacturer Distribution */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-aviation-border">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Aircraft Manufacturer Market Share</h3>
            </div>
            <span className="text-xs font-mono text-aviation-textMuted">OEM Landings Split</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div style={{ height: 260, minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260} minWidth={0}>
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={manufacturers.slice(0, 6)}
                    dataKey="landings"
                    nameKey="manufacturer"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {manufacturers.slice(0, 6).map((entry, index) => (
                      <Cell
                        key={`pie-cell-${index}`}
                        fill={getManufacturerColor(entry.manufacturer)}
                        stroke="#0B111E"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip weightUnit={weightUnit} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Manufacturer Metrics List */}
            <div className="space-y-2.5">
              {manufacturers.slice(0, 5).map((m) => (
                <div
                  key={m.manufacturer}
                  className="flex items-center justify-between p-2 rounded-lg bg-aviation-dark/60 border border-aviation-border/60 text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: getManufacturerColor(m.manufacturer) }}
                    />
                    <span className="font-semibold text-white">{m.manufacturer || 'Other'}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-200 font-bold">{formatPercent(m.shareLandings)}</div>
                    <div className="text-[10px] text-aviation-textMuted">{formatNumber(m.landings)} flights</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Top Aircraft Models Leaderboard */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-aviation-border">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Top Active Aircraft Models</h3>
          </div>
          <span className="text-xs font-mono text-aviation-textMuted">Most Frequent Airframes</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {topModels.map((m, idx) => (
            <div
              key={m.model}
              className="p-4 rounded-xl bg-aviation-dark/80 border border-aviation-border hover:border-sky-500/50 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  #{idx + 1} {m.model}
                </span>
                <span
                  className="text-[10px] font-mono font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${getManufacturerColor(m.manufacturer)}20`,
                    color: getManufacturerColor(m.manufacturer),
                    border: `1px solid ${getManufacturerColor(m.manufacturer)}40`,
                  }}
                >
                  {m.manufacturer}
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold font-mono text-white">
                  {formatNumber(m.landings)} <span className="text-xs font-normal text-slate-400">landings</span>
                </div>
                <div className="text-xs font-mono text-aviation-textMuted">
                  Avg MTOW: <span className="text-slate-200">{formatWeight(m.avgWeight, weightUnit)}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate mt-1">
                  Top carriers: {m.topAirlines.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
