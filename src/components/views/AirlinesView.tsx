import React, { useState, useMemo } from 'react';
import { AirlineStat } from '../../types';
import { formatNumber, formatWeight, formatPercent, formatPeriod } from '../../utils/formatters';
import { Building2, Search, ArrowUpDown, ChevronRight, Plane, Globe } from 'lucide-react';

interface AirlinesViewProps {
  airlines: AirlineStat[];
  weightUnit: 'lbs' | 'metric_tonnes';
}

export const AirlinesView: React.FC<AirlinesViewProps> = ({ airlines, weightUnit }) => {
  const [search, setSearch] = useState('');
  const [selectedAirlineName, setSelectedAirlineName] = useState<string>(
    airlines.length > 0 ? airlines[0].airline : ''
  );
  const [sortField, setSortField] = useState<'landings' | 'landedWeight' | 'shareLandings'>('landings');
  const [sortAsc, setSortAsc] = useState(false);

  const filteredAirlines = useMemo(() => {
    let list = airlines;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) => a.airline.toLowerCase().includes(q) || a.iata.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const vA = a[sortField];
      const vB = b[sortField];
      return sortAsc ? vA - vB : vB - vA;
    });
  }, [airlines, search, sortField, sortAsc]);

  const selectedAirline = useMemo(() => {
    return airlines.find((a) => a.airline === selectedAirlineName) || airlines[0];
  }, [airlines, selectedAirlineName]);

  const handleSort = (field: 'landings' | 'landedWeight' | 'shareLandings') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Airlines Leaderboard Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-aviation-border">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-400" />
                <h3 className="text-lg font-bold text-white">Carrier Intelligence & Fleet Share</h3>
              </div>
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search carrier or IATA..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-aviation-dark border border-aviation-border text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-4 max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-aviation-card/95 backdrop-blur z-10 text-aviation-textMuted border-b border-aviation-border">
                  <tr>
                    <th className="py-2.5 px-3">Carrier / Airline</th>
                    <th className="py-2.5 px-2 text-center">IATA</th>
                    <th
                      onClick={() => handleSort('landings')}
                      className="py-2.5 px-3 text-right cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Landings</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('landedWeight')}
                      className="py-2.5 px-3 text-right cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Total MTOW</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-center">Fleet Split (B / A / R)</th>
                    <th className="py-2.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-aviation-border/50 text-slate-200">
                  {filteredAirlines.slice(0, 50).map((a, idx) => {
                    const isSelected = selectedAirline?.airline === a.airline;
                    return (
                      <tr
                        key={a.airline}
                        onClick={() => setSelectedAirlineName(a.airline)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-500/15 text-white font-semibold'
                            : 'hover:bg-aviation-dark/60'
                        }`}
                      >
                        <td className="py-2.5 px-3 flex items-center gap-2">
                          <span className="text-slate-500 text-[10px] w-5">#{idx + 1}</span>
                          <span className="font-medium text-white truncate max-w-[200px]">{a.airline}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-aviation-dark text-sky-400 font-bold border border-aviation-border text-[10px]">
                            {a.iata || '--'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-sky-300">
                          {formatNumber(a.landings)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {formatWeight(a.landedWeight, weightUnit)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-center gap-1.5 text-[10px]">
                            <span className="text-boeing-light" title="Boeing %">
                              {Math.round(a.boeingRatio * 100)}% B
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-airbus-cyan" title="Airbus %">
                              {Math.round(a.airbusRatio * 100)}% A
                            </span>
                            <span className="text-slate-600">|</span>
                            <span className="text-amber-400" title="Regional %">
                              {Math.round(a.regionalRatio * 100)}% R
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <ChevronRight className={`w-4 h-4 ml-auto ${isSelected ? 'text-sky-400' : 'text-slate-600'}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="text-[11px] font-mono text-aviation-textMuted mt-3 pt-3 border-t border-aviation-border flex justify-between">
            <span>Showing top {Math.min(50, filteredAirlines.length)} carriers</span>
            <span>Click any airline to inspect fleet profile</span>
          </div>
        </div>

        {/* Right Col: Airline Detail Inspector */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
          {selectedAirline ? (
            <div className="space-y-5">
              <div className="pb-4 border-b border-aviation-border">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    IATA: {selectedAirline.iata || 'N/A'}
                  </span>
                  <span className="text-xs font-mono text-aviation-textMuted">
                    {formatPeriod(selectedAirline.firstPeriod)} – {formatPeriod(selectedAirline.lastPeriod)}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-2 tracking-tight">
                  {selectedAirline.airline}
                </h3>
                <span className="text-xs font-mono text-cyan-400">
                  Dominant OEM: <strong className="text-white">{selectedAirline.dominantManufacturer}</strong>
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-aviation-dark border border-aviation-border">
                  <span className="text-aviation-textMuted">Total Landings</span>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {formatNumber(selectedAirline.landings)}
                  </div>
                  <span className="text-[10px] text-sky-400">
                    {formatPercent(selectedAirline.shareLandings)} SFO Share
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-aviation-dark border border-aviation-border">
                  <span className="text-aviation-textMuted">Landed Weight</span>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {formatWeight(selectedAirline.landedWeight, weightUnit)}
                  </div>
                  <span className="text-[10px] text-cyan-400">
                    {formatPercent(selectedAirline.shareWeight)} MTOW Share
                  </span>
                </div>
              </div>

              {/* Fleet Composition Visual */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-semibold mb-2">
                  <div className="flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-sky-400" />
                    <span>FLEET OEM COMPOSITION</span>
                  </div>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden">
                  <div
                    className="h-full bg-boeing transition-all"
                    style={{ width: `${selectedAirline.boeingRatio * 100}%` }}
                    title={`Boeing: ${formatPercent(selectedAirline.boeingRatio)}`}
                  />
                  <div
                    className="h-full bg-airbus-cyan transition-all"
                    style={{ width: `${selectedAirline.airbusRatio * 100}%` }}
                    title={`Airbus: ${formatPercent(selectedAirline.airbusRatio)}`}
                  />
                  <div
                    className="h-full bg-amber-500 transition-all"
                    style={{ width: `${selectedAirline.regionalRatio * 100}%` }}
                    title={`Regional: ${formatPercent(selectedAirline.regionalRatio)}`}
                  />
                </div>

                <div className="mt-2 grid grid-cols-3 text-center text-[10px] font-mono">
                  <div className="text-boeing-light">
                    Boeing: {formatPercent(selectedAirline.boeingRatio)}
                  </div>
                  <div className="text-airbus-cyan">
                    Airbus: {formatPercent(selectedAirline.airbusRatio)}
                  </div>
                  <div className="text-amber-400">
                    Regional: {formatPercent(selectedAirline.regionalRatio)}
                  </div>
                </div>
              </div>

              {/* Top Aircraft Models */}
              <div>
                <div className="text-xs font-mono font-semibold text-slate-300 mb-2">
                  TOP AIRFRAMES DEPLOYED
                </div>
                <div className="space-y-1.5">
                  {selectedAirline.topModels.map((m) => (
                    <div
                      key={m.model}
                      className="p-2 rounded-lg bg-aviation-dark/80 border border-aviation-border flex items-center justify-between text-xs font-mono"
                    >
                      <span className="font-bold text-white">{m.model}</span>
                      <span className="text-slate-300">{formatNumber(m.count)} flights</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Routes / Regions */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-300 mb-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>REGIONAL COVERAGE</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAirline.regions.map((r) => (
                    <span
                      key={r.region}
                      className="px-2 py-1 rounded bg-aviation-dark border border-aviation-border text-[11px] font-mono text-slate-200"
                    >
                      {r.region}: <strong className="text-sky-300">{formatNumber(r.count)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-aviation-textMuted font-mono text-xs">
              Select an airline from the table to view profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
