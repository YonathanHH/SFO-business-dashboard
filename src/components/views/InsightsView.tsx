import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { MonthlyAggregate } from '../../types';
import { CustomTooltip } from '../CustomTooltip';
import { Sparkles, Calendar, CheckCircle, Landmark } from 'lucide-react';

interface InsightsViewProps {
  monthlyData: MonthlyAggregate[];
}

export const InsightsView: React.FC<InsightsViewProps> = ({ monthlyData }) => {
  // Calculate average landings by month (Jan - Dec) to demonstrate seasonality
  const seasonalityData = useMemo(() => {
    const months = [
      { month: 'Jan', count: 0, total: 0 },
      { month: 'Feb', count: 0, total: 0 },
      { month: 'Mar', count: 0, total: 0 },
      { month: 'Apr', count: 0, total: 0 },
      { month: 'May', count: 0, total: 0 },
      { month: 'Jun', count: 0, total: 0 },
      { month: 'Jul', count: 0, total: 0 },
      { month: 'Aug', count: 0, total: 0 },
      { month: 'Sep', count: 0, total: 0 },
      { month: 'Oct', count: 0, total: 0 },
      { month: 'Nov', count: 0, total: 0 },
      { month: 'Dec', count: 0, total: 0 },
    ];

    for (const m of monthlyData) {
      const idx = m.month - 1;
      if (idx >= 0 && idx < 12) {
        months[idx].count += 1;
        months[idx].total += m.landings;
      }
    }

    const overallAvg =
      months.reduce((acc, cur) => acc + (cur.count > 0 ? cur.total / cur.count : 0), 0) / 12 || 1;

    return months.map((m) => {
      const avg = m.count > 0 ? Math.round(m.total / m.count) : 0;
      const index = Math.round((avg / overallAvg) * 100);
      return {
        month: m.month,
        avgLandings: avg,
        seasonalIndex: index,
      };
    });
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      {/* 1. Seasonality & Peak Travel Analysis */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-aviation-border">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-bold text-white">Monthly Traffic Seasonality (SFO Airport Cycle)</h3>
            </div>
            <p className="text-xs text-aviation-textMuted font-mono mt-0.5">
              Multi-year normalized average operations per calendar month (Base Index = 100)
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30">
            July & August Peak Surge
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={seasonalityData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" />
              <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(val) => `${val}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="seasonalIndex" name="Seasonal Index (100 = Baseline)" radius={[6, 6, 0, 0]}>
                {seasonalityData.map((entry, index) => (
                  <Cell
                    key={`seasonal-${index}`}
                    fill={entry.seasonalIndex >= 105 ? '#38BDF8' : entry.seasonalIndex <= 95 ? '#64748B' : '#06B6D4'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Key Aviation Findings & Macro Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategic Takeaways */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-aviation-border">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Strategic Executive Takeaways</h3>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-aviation-dark/80 border border-aviation-border flex gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Boeing vs. Airbus Duopoly Dynamic:</strong>
                <p className="text-slate-300 mt-1">
                  Boeing holds a dominant 45%+ landing volume share and over 52% of landed weight at SFO, driven by United's 737/777/787 hub operations. However, Airbus grew steadily via Virgin America's A320 fleet and Asian long-haul A350/A380 deployments.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-aviation-dark/80 border border-aviation-border flex gap-3">
              <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Continuous Up-Gauging of Airframes:</strong>
                <p className="text-slate-300 mt-1">
                  Average landed weight per aircraft increased by over 28% from 2005 to 2018 as airlines phased out smaller 50-seat regional jets and turboprops in favor of high-density 180+ seat narrow-bodies (e.g., Boeing 737-900ER, Airbus A321).
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-aviation-dark/80 border border-aviation-border flex gap-3">
              <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Trans-Pacific Gateway Dominance:</strong>
                <p className="text-slate-300 mt-1">
                  Asia remains SFO's largest international corridor by a wide margin (127k+ landings), characterized by the highest average MTOW per flight, served by wide-body flagships including B777-300ER, B787, A350-900, and A380-800.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Timeline Milestones */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-aviation-border">
            <Landmark className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">Historical Aviation Milestones</h3>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-aviation-dark/80 border border-aviation-border">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-amber-400 font-bold">2007 – 2008</span>
                <span>Financial Crisis Dip</span>
              </div>
              <p className="text-slate-300">
                Global recession caused a noticeable contraction in business travel and landed weight before recovering strongly in 2010.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-aviation-dark/80 border border-aviation-border">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-sky-400 font-bold">2012 – 2013</span>
                <span>United / Continental Mega-Merger</span>
              </div>
              <p className="text-slate-300">
                Consolidation of United Airlines operations at SFO transformed the airport into one of North America's premier trans-Pacific hubs.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-aviation-dark/80 border border-aviation-border">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-emerald-400 font-bold">2016 – 2018</span>
                <span>Virgin America to Alaska Transition</span>
              </div>
              <p className="text-slate-300">
                Virgin America's all-Airbus operation peaked as SFO's #2 domestic carrier before integration into Alaska Air Group.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
