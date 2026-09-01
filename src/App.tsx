import React, { useState, useEffect, useMemo } from 'react';
import { FlightRecord, FilterState } from './types';
import {
  parseCSVData,
  filterRecords,
  calculateSummaryMetrics,
  calculateMonthlyAggregates,
  calculateManufacturerStats,
  calculateAirlineStats,
  calculateGeoRegionStats,
  calculateModelStats,
} from './utils/dataProcessor';

import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { FilterBar } from './components/FilterBar';
import { NavigationTabs, TabId } from './components/NavigationTabs';

import { OverviewView } from './components/views/OverviewView';
import { BoeingVsAirbusView } from './components/views/BoeingVsAirbusView';
import { AirlinesView } from './components/views/AirlinesView';
import { GeoDynamicsView } from './components/views/GeoDynamicsView';
import { FleetEvolutionView } from './components/views/FleetEvolutionView';
import { DataExplorerView } from './components/views/DataExplorerView';
import { InsightsView } from './components/views/InsightsView';

import { Loader2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [records, setRecords] = useState<FlightRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [weightUnit, setWeightUnit] = useState<'lbs' | 'metric_tonnes'>('lbs');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    yearRange: [2005, 2018],
    selectedManufacturers: [],
    selectedBodyTypes: [],
    selectedGeoSummaries: [],
    selectedGeoRegions: [],
    selectedAirlines: [],
    selectedAircraftTypes: [],
    searchQuery: '',
  });

  // Load CSV data on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await fetch('/raw_data.csv');
        if (!response.ok) {
          throw new Error(`Failed to load raw_data.csv: status ${response.status}`);
        }
        const text = await response.text();
        const parsed = parseCSVData(text);
        setRecords(parsed);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching CSV dataset:', err);
        setLoadError(err.message || 'Failed to load dataset');
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Handle custom CSV upload
  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseCSVData(content);
        if (parsed.length === 0) {
          throw new Error('No valid records found in uploaded CSV.');
        }
        setRecords(parsed);
        setIsLoading(false);
      } catch (err: any) {
        alert(`Error parsing uploaded CSV: ${err.message}`);
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Distinct filter options extracted from raw records
  const availableOptions = useMemo(() => {
    const manufacturers = new Set<string>();
    const bodyTypes = new Set<string>();
    const geoRegions = new Set<string>();
    const aircraftTypes = new Set<string>();
    let minYr = 2005;
    let maxYr = 2018;

    for (const r of records) {
      if (r.aircraftManufacturer) manufacturers.add(r.aircraftManufacturer);
      if (r.aircraftBodyType) bodyTypes.add(r.aircraftBodyType);
      if (r.geoRegion) geoRegions.add(r.geoRegion);
      if (r.landingAircraftType) aircraftTypes.add(r.landingAircraftType);
      if (r.year < minYr) minYr = r.year;
      if (r.year > maxYr) maxYr = r.year;
    }

    return {
      manufacturers: Array.from(manufacturers).filter(Boolean).sort(),
      bodyTypes: Array.from(bodyTypes).filter(Boolean).sort(),
      geoRegions: Array.from(geoRegions).filter(Boolean).sort(),
      aircraftTypes: Array.from(aircraftTypes).filter(Boolean).sort(),
      minYear: minYr,
      maxYear: maxYr,
    };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return filterRecords(records, filters);
  }, [records, filters]);

  // Derived Analytics from filtered records
  const metrics = useMemo(() => calculateSummaryMetrics(filteredRecords), [filteredRecords]);
  const monthlyData = useMemo(() => calculateMonthlyAggregates(filteredRecords), [filteredRecords]);
  const manufacturerStats = useMemo(() => calculateManufacturerStats(filteredRecords), [filteredRecords]);
  const airlineStats = useMemo(() => calculateAirlineStats(filteredRecords), [filteredRecords]);
  const geoRegionStats = useMemo(() => calculateGeoRegionStats(filteredRecords), [filteredRecords]);
  const modelStats = useMemo(() => calculateModelStats(filteredRecords), [filteredRecords]);

  const handleResetFilters = () => {
    setFilters({
      yearRange: [availableOptions.minYear, availableOptions.maxYear],
      selectedManufacturers: [],
      selectedBodyTypes: [],
      selectedGeoSummaries: [],
      selectedGeoRegions: [],
      selectedAirlines: [],
      selectedAircraftTypes: [],
      searchQuery: '',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B111E] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Global Header */}
      <Header
        totalRecords={records.length}
        filteredCount={filteredRecords.length}
        weightUnit={weightUnit}
        onToggleUnit={() => setWeightUnit(weightUnit === 'lbs' ? 'metric_tonnes' : 'lbs')}
        onResetFilters={handleResetFilters}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Loading Spinner / Error Banner */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <span className="text-xs font-mono text-aviation-textMuted tracking-wider uppercase">
                Parsing Flight Operations Dataset...
              </span>
            </div>
          </div>
        )}

        {loadError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 font-mono text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <div>
              <strong>Error Loading Data:</strong> {loadError}
            </div>
          </div>
        )}

        {!isLoading && !loadError && (
          <>
            {/* Filter Bar */}
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              availableManufacturers={availableOptions.manufacturers}
              availableBodyTypes={availableOptions.bodyTypes}
              availableGeoRegions={availableOptions.geoRegions}
              availableAircraftTypes={availableOptions.aircraftTypes}
              minYear={availableOptions.minYear}
              maxYear={availableOptions.maxYear}
            />

            {/* KPI HUD Summary Bar */}
            <KPICards metrics={metrics} weightUnit={weightUnit} />

            {/* Navigation Tabs */}
            <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Active View Component */}
            <div className="transition-all duration-300">
              {activeTab === 'overview' && (
                <OverviewView
                  monthlyData={monthlyData}
                  manufacturers={manufacturerStats}
                  airlines={airlineStats}
                  models={modelStats}
                  weightUnit={weightUnit}
                />
              )}

              {activeTab === 'duopoly' && (
                <BoeingVsAirbusView
                  monthlyData={monthlyData}
                  manufacturers={manufacturerStats}
                  airlines={airlineStats}
                  models={modelStats}
                  weightUnit={weightUnit}
                />
              )}

              {activeTab === 'airlines' && (
                <AirlinesView airlines={airlineStats} weightUnit={weightUnit} />
              )}

              {activeTab === 'routes' && (
                <GeoDynamicsView geoRegions={geoRegionStats} weightUnit={weightUnit} />
              )}

              {activeTab === 'fleet' && (
                <FleetEvolutionView
                  monthlyData={monthlyData}
                  models={modelStats}
                  weightUnit={weightUnit}
                />
              )}

              {activeTab === 'explorer' && (
                <DataExplorerView records={filteredRecords} weightUnit={weightUnit} />
              )}

              {activeTab === 'insights' && (
                <InsightsView monthlyData={monthlyData} />
              )}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-aviation-border/60 py-4 px-8 text-center text-xs font-mono text-slate-500">
        AERO-INTEL SFO • Flight Operations & Fleet Intelligence BI • San Francisco International Airport Data
      </footer>
    </div>
  );
};

export default App;
