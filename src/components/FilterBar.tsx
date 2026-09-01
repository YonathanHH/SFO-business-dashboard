import React, { useState } from 'react';
import { Search, Filter, Calendar, X, ChevronDown, Check } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableManufacturers: string[];
  availableBodyTypes: string[];
  availableGeoRegions: string[];
  availableAircraftTypes: string[];
  minYear: number;
  maxYear: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableManufacturers,
  availableBodyTypes,
  availableGeoRegions,
  availableAircraftTypes,
  minYear,
  maxYear,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleYearStart = (year: number) => {
    onFilterChange({
      ...filters,
      yearRange: [Math.min(year, filters.yearRange[1]), filters.yearRange[1]]
    });
  };

  const handleYearEnd = (year: number) => {
    onFilterChange({
      ...filters,
      yearRange: [filters.yearRange[0], Math.max(year, filters.yearRange[0])]
    });
  };

  const toggleManufacturer = (m: string) => {
    const next = filters.selectedManufacturers.includes(m)
      ? filters.selectedManufacturers.filter((item) => item !== m)
      : [...filters.selectedManufacturers, m];
    onFilterChange({ ...filters, selectedManufacturers: next });
  };

  const toggleBodyType = (b: string) => {
    const next = filters.selectedBodyTypes.includes(b)
      ? filters.selectedBodyTypes.filter((item) => item !== b)
      : [...filters.selectedBodyTypes, b];
    onFilterChange({ ...filters, selectedBodyTypes: next });
  };

  const toggleGeoSummary = (s: string) => {
    const next = filters.selectedGeoSummaries.includes(s)
      ? filters.selectedGeoSummaries.filter((item) => item !== s)
      : [...filters.selectedGeoSummaries, s];
    onFilterChange({ ...filters, selectedGeoSummaries: next });
  };

  const toggleGeoRegion = (r: string) => {
    const next = filters.selectedGeoRegions.includes(r)
      ? filters.selectedGeoRegions.filter((item) => item !== r)
      : [...filters.selectedGeoRegions, r];
    onFilterChange({ ...filters, selectedGeoRegions: next });
  };

  const toggleAircraftType = (t: string) => {
    const next = filters.selectedAircraftTypes.includes(t)
      ? filters.selectedAircraftTypes.filter((item) => item !== t)
      : [...filters.selectedAircraftTypes, t];
    onFilterChange({ ...filters, selectedAircraftTypes: next });
  };

  const clearAllFilters = () => {
    onFilterChange({
      yearRange: [minYear, maxYear],
      selectedManufacturers: [],
      selectedBodyTypes: [],
      selectedGeoSummaries: [],
      selectedGeoRegions: [],
      selectedAirlines: [],
      selectedAircraftTypes: [],
      searchQuery: '',
    });
  };

  const activeFiltersCount =
    (filters.yearRange[0] !== minYear || filters.yearRange[1] !== maxYear ? 1 : 0) +
    filters.selectedManufacturers.length +
    filters.selectedBodyTypes.length +
    filters.selectedGeoSummaries.length +
    filters.selectedGeoRegions.length +
    filters.selectedAirlines.length +
    filters.selectedAircraftTypes.length +
    (filters.searchQuery ? 1 : 0);

  const years = [];
  for (let y = minYear; y <= maxYear; y++) {
    years.push(y);
  }

  return (
    <div className="glass-panel rounded-xl p-4 transition-all">
      {/* Primary Row: Search, Quick Year Selector, Manufacturer Pills, Filter Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search airline, model (e.g. B738, A380, SkyWest, United)..."
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-aviation-dark/80 border border-aviation-border text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-mono transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Year Range selector */}
        <div className="flex items-center gap-2 bg-aviation-dark/80 px-3 py-1.5 rounded-lg border border-aviation-border text-xs font-mono">
          <Calendar className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400 text-[11px]">Timeline:</span>
          <select
            value={filters.yearRange[0]}
            onChange={(e) => handleYearStart(parseInt(e.target.value, 10))}
            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={`start-${y}`} value={y} className="bg-aviation-card text-white">
                {y}
              </option>
            ))}
          </select>
          <span className="text-slate-500">to</span>
          <select
            value={filters.yearRange[1]}
            onChange={(e) => handleYearEnd(parseInt(e.target.value, 10))}
            className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
          >
            {years.map((y) => (
              <option key={`end-${y}`} value={y} className="bg-aviation-card text-white">
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Manufacturer Toggle Chips */}
        <div className="hidden xl:flex items-center gap-1.5">
          {['Boeing', 'Airbus', 'Bombardier', 'Embraer'].map((m) => {
            const isSelected = filters.selectedManufacturers.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleManufacturer(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                  isSelected
                    ? m === 'Boeing'
                      ? 'bg-boeing text-white shadow-sm border border-boeing-light'
                      : m === 'Airbus'
                      ? 'bg-cyan-600 text-white shadow-sm border border-cyan-400'
                      : 'bg-indigo-600 text-white shadow-sm border border-indigo-400'
                    : 'bg-aviation-card text-slate-300 hover:bg-aviation-cardHover border border-aviation-border'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Advanced Filters Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-medium transition-all ${
              showAdvanced || activeFiltersCount > 0
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-aviation-card text-slate-300 hover:bg-aviation-cardHover border border-aviation-border'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-white text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="px-2.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-mono transition-all"
              title="Clear all active filters"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filter Drawer */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-aviation-border/60 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          {/* Manufacturers */}
          <div>
            <label className="block text-slate-400 font-mono font-semibold mb-2">AIRCRAFT OEM</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {availableManufacturers.map((m) => {
                const isSelected = filters.selectedManufacturers.includes(m);
                return (
                  <button
                    key={m}
                    onClick={() => toggleManufacturer(m)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white font-medium shadow'
                        : 'bg-aviation-dark text-slate-300 hover:bg-slate-800 border border-aviation-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{m || 'Other'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aircraft Body Type */}
          <div>
            <label className="block text-slate-400 font-mono font-semibold mb-2">BODY TYPE</label>
            <div className="flex flex-wrap gap-1.5">
              {availableBodyTypes.map((b) => {
                const isSelected = filters.selectedBodyTypes.includes(b);
                return (
                  <button
                    key={b}
                    onClick={() => toggleBodyType(b)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-cyan-600 text-white font-medium shadow'
                        : 'bg-aviation-dark text-slate-300 hover:bg-slate-800 border border-aviation-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{b}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flight Scope (Domestic vs International) */}
          <div>
            <label className="block text-slate-400 font-mono font-semibold mb-2">ROUTE SCOPE</label>
            <div className="flex flex-wrap gap-1.5">
              {['Domestic', 'International'].map((s) => {
                const isSelected = filters.selectedGeoSummaries.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleGeoSummary(s)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white font-medium shadow'
                        : 'bg-aviation-dark text-slate-300 hover:bg-slate-800 border border-aviation-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{s}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Operation Type (Passenger, Freighter) */}
          <div>
            <label className="block text-slate-400 font-mono font-semibold mb-2">OPERATION TYPE</label>
            <div className="flex flex-wrap gap-1.5">
              {availableAircraftTypes.map((t) => {
                const isSelected = filters.selectedAircraftTypes.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleAircraftType(t)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-amber-600 text-white font-medium shadow'
                        : 'bg-aviation-dark text-slate-300 hover:bg-slate-800 border border-aviation-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Geo Region */}
          <div>
            <label className="block text-slate-400 font-mono font-semibold mb-2">GEO REGION</label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {availableGeoRegions.map((r) => {
                const isSelected = filters.selectedGeoRegions.includes(r);
                return (
                  <button
                    key={r}
                    onClick={() => toggleGeoRegion(r)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-medium shadow'
                        : 'bg-aviation-dark text-slate-300 hover:bg-slate-800 border border-aviation-border'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{r}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
