import React, { useState, useMemo } from 'react';
import { FlightRecord } from '../../types';
import { formatNumber, formatWeight, formatPeriod } from '../../utils/formatters';
import { Table, Download, ArrowUpDown, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface DataExplorerViewProps {
  records: FlightRecord[];
  weightUnit: 'lbs' | 'metric_tonnes';
}

export const DataExplorerView: React.FC<DataExplorerViewProps> = ({ records, weightUnit }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<keyof FlightRecord>('activityPeriod');
  const [sortAsc, setSortAsc] = useState(false);
  const [pivotBy, setPivotBy] = useState<'none' | 'manufacturer' | 'airline' | 'region' | 'year'>('none');

  // Sorted Records
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const vA = a[sortField];
      const vB = b[sortField];
      if (typeof vA === 'string' && typeof vB === 'string') {
        return sortAsc ? vA.localeCompare(vB) : vB.localeCompare(vA);
      }
      if (typeof vA === 'number' && typeof vB === 'number') {
        return sortAsc ? vA - vB : vB - vA;
      }
      return 0;
    });
  }, [records, sortField, sortAsc]);

  // Paginated raw records
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  // Pivot aggregation if pivot is active
  const pivotData = useMemo(() => {
    if (pivotBy === 'none') return null;

    const map = new Map<string, {
      key: string;
      landings: number;
      landedWeight: number;
      recordsCount: number;
    }>();

    for (const r of records) {
      let key = '';
      if (pivotBy === 'manufacturer') key = r.aircraftManufacturer || 'Other';
      else if (pivotBy === 'airline') key = r.operatingAirline || 'Unknown';
      else if (pivotBy === 'region') key = r.geoRegion || 'Unknown';
      else if (pivotBy === 'year') key = String(r.year);

      let item = map.get(key);
      if (!item) {
        item = { key, landings: 0, landedWeight: 0, recordsCount: 0 };
        map.set(key, item);
      }
      item.landings += r.landingCount;
      item.landedWeight += r.totalLandedWeight;
      item.recordsCount += 1;
    }

    return Array.from(map.values()).sort((a, b) => b.landings - a.landings);
  }, [records, pivotBy]);

  const handleSort = (field: keyof FlightRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const header = [
      'Activity Period',
      'Operating Airline',
      'Operating Airline IATA',
      'Published Airline',
      'GEO Summary',
      'GEO Region',
      'Landing Aircraft Type',
      'Aircraft Body Type',
      'Aircraft Manufacturer',
      'Aircraft Model',
      'Landing Count',
      'Total Landed Weight (lbs)',
    ];

    const rows = records.map((r) => [
      r.activityPeriod,
      `"${r.operatingAirline.replace(/"/g, '""')}"`,
      r.operatingAirlineIata,
      `"${r.publishedAirline.replace(/"/g, '""')}"`,
      r.geoSummary,
      r.geoRegion,
      r.landingAircraftType,
      r.aircraftBodyType,
      `"${r.aircraftManufacturer}"`,
      r.aircraftModel,
      r.landingCount,
      r.totalLandedWeight,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sfo_air_traffic_filtered_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-aviation-border">
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-bold text-white">Flight Operations Data Explorer</h3>
          </div>
          <p className="text-xs text-aviation-textMuted font-mono mt-0.5">
            {formatNumber(records.length)} operational logs matching current active filters
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Pivot Selector */}
          <div className="flex items-center gap-1.5 bg-aviation-dark px-2.5 py-1.5 rounded-lg border border-aviation-border">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Pivot:</span>
            <select
              value={pivotBy}
              onChange={(e) => setPivotBy(e.target.value as any)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="none" className="bg-aviation-card text-white">Raw Rows</option>
              <option value="manufacturer" className="bg-aviation-card text-white">Group by OEM</option>
              <option value="airline" className="bg-aviation-card text-white">Group by Carrier</option>
              <option value="region" className="bg-aviation-card text-white">Group by Region</option>
              <option value="year" className="bg-aviation-card text-white">Group by Year</option>
            </select>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium shadow transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Pivot Table View */}
      {pivotData ? (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-aviation-card/95 backdrop-blur z-10 text-aviation-textMuted border-b border-aviation-border">
              <tr>
                <th className="py-2.5 px-3 uppercase tracking-wider">{pivotBy} Group</th>
                <th className="py-2.5 px-3 text-right">Log Entries</th>
                <th className="py-2.5 px-3 text-right">Total Landings</th>
                <th className="py-2.5 px-3 text-right">Total MTOW</th>
                <th className="py-2.5 px-3 text-right">Avg Weight / Flight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aviation-border/50 text-slate-200">
              {pivotData.map((item, idx) => (
                <tr key={item.key} className="hover:bg-aviation-dark/60">
                  <td className="py-2.5 px-3 font-semibold text-white flex items-center gap-2">
                    <span className="text-slate-500 text-[10px]">#{idx + 1}</span>
                    <span>{item.key}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">{formatNumber(item.recordsCount)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-sky-400">{formatNumber(item.landings)}</td>
                  <td className="py-2.5 px-3 text-right text-cyan-300">{formatWeight(item.landedWeight, weightUnit)}</td>
                  <td className="py-2.5 px-3 text-right text-indigo-300">
                    {formatWeight(item.landings > 0 ? item.landedWeight / item.landings : 0, weightUnit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Raw Records Table */
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-aviation-card/95 backdrop-blur z-10 text-aviation-textMuted border-b border-aviation-border">
              <tr>
                <th onClick={() => handleSort('activityPeriod')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Period</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('operatingAirline')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Carrier</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-2 text-center">IATA</th>
                <th onClick={() => handleSort('aircraftManufacturer')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>OEM</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('aircraftModel')} className="py-2.5 px-3 cursor-pointer hover:text-white">
                  <div className="flex items-center gap-1">
                    <span>Model</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Body Type</th>
                <th className="py-2.5 px-3">Region</th>
                <th onClick={() => handleSort('landingCount')} className="py-2.5 px-3 text-right cursor-pointer hover:text-white">
                  <div className="flex items-center justify-end gap-1">
                    <span>Landings</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th onClick={() => handleSort('totalLandedWeight')} className="py-2.5 px-3 text-right cursor-pointer hover:text-white">
                  <div className="flex items-center justify-end gap-1">
                    <span>MTOW ({weightUnit === 'lbs' ? 'lbs' : 'MT'})</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aviation-border/50 text-slate-200">
              {paginatedRecords.map((r, index) => (
                <tr key={`${r.activityPeriod}-${r.operatingAirline}-${index}`} className="hover:bg-aviation-dark/60">
                  <td className="py-2.5 px-3 text-sky-400 font-semibold">{formatPeriod(r.activityPeriod)}</td>
                  <td className="py-2.5 px-3 font-medium text-white truncate max-w-[180px]">{r.operatingAirline}</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-aviation-dark border border-aviation-border text-[10px] text-slate-300">
                      {r.operatingAirlineIata || '--'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{r.aircraftManufacturer}</td>
                  <td className="py-2.5 px-3 font-bold text-sky-300">{r.aircraftModel}</td>
                  <td className="py-2.5 px-3 text-slate-400">{r.aircraftBodyType}</td>
                  <td className="py-2.5 px-3 text-slate-400">{r.geoRegion}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">{formatNumber(r.landingCount)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{formatWeight(r.totalLandedWeight, weightUnit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {!pivotData && (
        <div className="pt-4 border-t border-aviation-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-aviation-textMuted">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-aviation-dark border border-aviation-border text-white px-2 py-1 rounded focus:outline-none"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Showing {(currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, sortedRecords.length)} of {formatNumber(sortedRecords.length)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-aviation-dark border border-aviation-border hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-aviation-dark border border-aviation-border hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
