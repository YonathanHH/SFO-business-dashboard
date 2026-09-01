import React, { useRef } from 'react';
import { Plane, Radio, UploadCloud, RotateCcw, Database, Scale } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

interface HeaderProps {
  totalRecords: number;
  filteredCount: number;
  weightUnit: 'lbs' | 'metric_tonnes';
  onToggleUnit: () => void;
  onResetFilters: () => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  totalRecords,
  filteredCount,
  weightUnit,
  onToggleUnit,
  onResetFilters,
  onFileUpload,
  isLoading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0B111E]/90 backdrop-blur-md border-b border-aviation-border px-4 lg:px-8 py-3.5 shadow-lg">
      <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Live status */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-boeing-light/20 to-airbus-cyan/20 border border-sky-500/30 text-sky-400 shadow-inner">
            <Plane className="w-6 h-6 transform -rotate-45 text-sky-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B111E] animate-pulse"></div>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                AERO-INTEL
              </h1>
              <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-boeing-light/10 text-boeing-light border border-boeing-light/30">
                SFO AIR OPERATIONS
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-3 h-3 animate-spin" style={{ animationDuration: '3s' }} />
                2005 – 2018 ARCHIVE
              </span>
            </div>
            <p className="text-xs text-aviation-textMuted font-mono">
              San Francisco International Airport • Commercial Traffic & Fleet Analytics
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Records Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-aviation-card border border-aviation-border text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-aviation-textMuted">Records:</span>
            <span className="text-white font-semibold">{formatNumber(filteredCount)}</span>
            {filteredCount !== totalRecords && (
              <span className="text-xs text-amber-400 font-normal">/ {formatNumber(totalRecords)}</span>
            )}
          </div>

          {/* Unit Toggle Button */}
          <button
            onClick={onToggleUnit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aviation-card hover:bg-aviation-cardHover border border-aviation-border hover:border-aviation-borderLight text-xs font-mono text-slate-300 transition-all"
            title="Toggle weight display between Pounds (lbs) and Metric Tonnes (MT)"
          >
            <Scale className="w-3.5 h-3.5 text-cyan-400" />
            <span>Unit: <span className="font-semibold text-cyan-400">{weightUnit === 'lbs' ? 'lbs' : 'MT'}</span></span>
          </button>

          {/* Reset Filters */}
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aviation-card hover:bg-aviation-cardHover border border-aviation-border hover:border-amber-500/40 text-xs font-mono text-slate-300 hover:text-amber-400 transition-all"
            title="Reset all filters to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Custom CSV Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white text-xs font-medium shadow-md transition-all disabled:opacity-50"
            title="Upload custom SFO Air Traffic CSV dataset"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import CSV</span>
          </button>
        </div>
      </div>
    </header>
  );
};
