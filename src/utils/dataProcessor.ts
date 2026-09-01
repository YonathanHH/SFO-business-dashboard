import { FlightRecord, FilterState, MetricSummary, MonthlyAggregate, ManufacturerComparison, AirlineStat, GeoRegionStat, ModelStat } from '../types';

export function parseCSVData(csvText: string): FlightRecord[] {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  const records: FlightRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Fast robust CSV line splitter handling quotes
    const cols: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    cols.push(cur.trim());

    if (cols.length < 14) continue;

    const activityPeriod = parseInt(cols[0], 10);
    if (isNaN(activityPeriod)) continue;

    const periodStr = String(activityPeriod);
    const year = parseInt(periodStr.substring(0, 4), 10);
    const month = parseInt(periodStr.substring(4, 6), 10);
    const periodFormatted = `${year}-${String(month).padStart(2, '0')}`;

    const operatingAirline = cols[1] || 'Unknown';
    const operatingAirlineIata = cols[2] || '';
    const publishedAirline = cols[3] || operatingAirline;
    const publishedAirlineIata = cols[4] || operatingAirlineIata;
    const geoSummary = cols[5] || 'Domestic';
    const geoRegion = cols[6] || 'US';
    const landingAircraftType = cols[7] || 'Passenger';
    const aircraftBodyType = cols[8] || 'Narrow Body';
    const aircraftManufacturer = cols[9] || 'Other';
    const aircraftModel = cols[10] || '-';
    const aircraftVersion = cols[11] || '-';
    const landingCount = parseInt(cols[12], 10) || 0;
    const totalLandedWeight = parseFloat(cols[13]) || 0;

    records.push({
      activityPeriod,
      year,
      month,
      periodFormatted,
      operatingAirline,
      operatingAirlineIata,
      publishedAirline,
      publishedAirlineIata,
      geoSummary,
      geoRegion,
      landingAircraftType,
      aircraftBodyType,
      aircraftManufacturer,
      aircraftModel,
      aircraftVersion,
      landingCount,
      totalLandedWeight
    });
  }

  return records;
}

export function filterRecords(records: FlightRecord[], filters: FilterState): FlightRecord[] {
  return records.filter((r) => {
    // Year filter
    if (r.year < filters.yearRange[0] || r.year > filters.yearRange[1]) {
      return false;
    }

    // Manufacturers
    if (filters.selectedManufacturers.length > 0 && !filters.selectedManufacturers.includes(r.aircraftManufacturer)) {
      return false;
    }

    // Body Types
    if (filters.selectedBodyTypes.length > 0 && !filters.selectedBodyTypes.includes(r.aircraftBodyType)) {
      return false;
    }

    // GEO Summary
    if (filters.selectedGeoSummaries.length > 0 && !filters.selectedGeoSummaries.includes(r.geoSummary)) {
      return false;
    }

    // GEO Region
    if (filters.selectedGeoRegions.length > 0 && !filters.selectedGeoRegions.includes(r.geoRegion)) {
      return false;
    }

    // Airlines
    if (filters.selectedAirlines.length > 0 && !filters.selectedAirlines.includes(r.operatingAirline)) {
      return false;
    }

    // Aircraft Types
    if (filters.selectedAircraftTypes.length > 0 && !filters.selectedAircraftTypes.includes(r.landingAircraftType)) {
      return false;
    }

    // Search query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const match = 
        r.operatingAirline.toLowerCase().includes(q) ||
        r.operatingAirlineIata.toLowerCase().includes(q) ||
        r.aircraftManufacturer.toLowerCase().includes(q) ||
        r.aircraftModel.toLowerCase().includes(q) ||
        r.geoRegion.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

export function calculateSummaryMetrics(records: FlightRecord[]): MetricSummary {
  let totalLandings = 0;
  let totalLandedWeight = 0;
  let domesticLandings = 0;
  let boeingLandings = 0;
  let airbusLandings = 0;
  let boeingWeight = 0;
  let airbusWeight = 0;

  const airlinesSet = new Set<string>();
  const modelsSet = new Set<string>();

  for (const r of records) {
    totalLandings += r.landingCount;
    totalLandedWeight += r.totalLandedWeight;
    airlinesSet.add(r.operatingAirline);
    if (r.aircraftModel && r.aircraftModel !== '-') {
      modelsSet.add(r.aircraftModel);
    }

    if (r.geoSummary.toLowerCase() === 'domestic') {
      domesticLandings += r.landingCount;
    }

    const m = r.aircraftManufacturer.toLowerCase();
    if (m.includes('boeing')) {
      boeingLandings += r.landingCount;
      boeingWeight += r.totalLandedWeight;
    } else if (m.includes('airbus')) {
      airbusLandings += r.landingCount;
      airbusWeight += r.totalLandedWeight;
    }
  }

  const domesticShare = totalLandings > 0 ? domesticLandings / totalLandings : 0;
  const internationalShare = 1 - domesticShare;
  const boeingShareLandings = totalLandings > 0 ? boeingLandings / totalLandings : 0;
  const airbusShareLandings = totalLandings > 0 ? airbusLandings / totalLandings : 0;
  const boeingShareWeight = totalLandedWeight > 0 ? boeingWeight / totalLandedWeight : 0;
  const airbusShareWeight = totalLandedWeight > 0 ? airbusWeight / totalLandedWeight : 0;
  const avgWeightPerLanding = totalLandings > 0 ? totalLandedWeight / totalLandings : 0;

  return {
    totalLandings,
    totalLandedWeight,
    avgWeightPerLanding,
    totalAirlines: airlinesSet.size,
    totalModels: modelsSet.size,
    domesticShare,
    internationalShare,
    boeingShareLandings,
    airbusShareLandings,
    boeingShareWeight,
    airbusShareWeight,
  };
}

export function calculateMonthlyAggregates(records: FlightRecord[]): MonthlyAggregate[] {
  const map = new Map<number, MonthlyAggregate>();

  for (const r of records) {
    let agg = map.get(r.activityPeriod);
    if (!agg) {
      agg = {
        period: r.periodFormatted,
        periodNum: r.activityPeriod,
        year: r.year,
        month: r.month,
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
      };
      map.set(r.activityPeriod, agg);
    }

    agg.landings += r.landingCount;
    agg.landedWeight += r.totalLandedWeight;

    const m = r.aircraftManufacturer.toLowerCase();
    if (m.includes('boeing')) {
      agg.boeingLandings += r.landingCount;
      agg.boeingWeight += r.totalLandedWeight;
    } else if (m.includes('airbus')) {
      agg.airbusLandings += r.landingCount;
      agg.airbusWeight += r.totalLandedWeight;
    } else if (m.includes('bombardier') || m.includes('embraer')) {
      agg.regionalLandings += r.landingCount;
      agg.regionalWeight += r.totalLandedWeight;
    } else {
      agg.otherLandings += r.landingCount;
      agg.otherWeight += r.totalLandedWeight;
    }

    if (r.geoSummary.toLowerCase() === 'domestic') {
      agg.domesticLandings += r.landingCount;
      agg.domesticWeight += r.totalLandedWeight;
    } else {
      agg.internationalLandings += r.landingCount;
      agg.internationalWeight += r.totalLandedWeight;
    }

    const b = r.aircraftBodyType.toLowerCase();
    if (b.includes('narrow')) {
      agg.narrowBodyLandings += r.landingCount;
      agg.narrowBodyWeight += r.totalLandedWeight;
    } else if (b.includes('wide')) {
      agg.wideBodyLandings += r.landingCount;
      agg.wideBodyWeight += r.totalLandedWeight;
    } else if (b.includes('regional')) {
      agg.regionalJetLandings += r.landingCount;
      agg.regionalJetWeight += r.totalLandedWeight;
    } else if (b.includes('turbo')) {
      agg.turboPropLandings += r.landingCount;
      agg.turboPropWeight += r.totalLandedWeight;
    }
  }

  const result = Array.from(map.values()).sort((a, b) => a.periodNum - b.periodNum);
  for (const item of result) {
    item.avgWeight = item.landings > 0 ? Math.round(item.landedWeight / item.landings) : 0;
  }
  return result;
}

export function calculateManufacturerStats(records: FlightRecord[]): ManufacturerComparison[] {
  const map = new Map<string, {
    landings: number;
    landedWeight: number;
    airlines: Set<string>;
    models: Map<string, { landings: number; weight: number }>;
  }>();

  let grandTotalLandings = 0;
  let grandTotalWeight = 0;

  for (const r of records) {
    const m = r.aircraftManufacturer || 'Other';
    grandTotalLandings += r.landingCount;
    grandTotalWeight += r.totalLandedWeight;

    let entry = map.get(m);
    if (!entry) {
      entry = {
        landings: 0,
        landedWeight: 0,
        airlines: new Set<string>(),
        models: new Map<string, { landings: number; weight: number }>(),
      };
      map.set(m, entry);
    }

    entry.landings += r.landingCount;
    entry.landedWeight += r.totalLandedWeight;
    entry.airlines.add(r.operatingAirline);

    const modelKey = r.aircraftModel && r.aircraftModel !== '-' ? r.aircraftModel : 'Unknown';
    let modelEntry = entry.models.get(modelKey);
    if (!modelEntry) {
      modelEntry = { landings: 0, weight: 0 };
      entry.models.set(modelKey, modelEntry);
    }
    modelEntry.landings += r.landingCount;
    modelEntry.weight += r.totalLandedWeight;
  }

  const result: ManufacturerComparison[] = [];

  for (const [manufacturer, data] of map.entries()) {
    const modelsList = Array.from(data.models.entries())
      .map(([model, mData]) => ({ model, landings: mData.landings, weight: mData.weight }))
      .sort((a, b) => b.landings - a.landings);

    const topModel = modelsList.length > 0 ? modelsList[0].model : '-';

    result.push({
      manufacturer,
      landings: data.landings,
      landedWeight: data.landedWeight,
      shareLandings: grandTotalLandings > 0 ? data.landings / grandTotalLandings : 0,
      shareWeight: grandTotalWeight > 0 ? data.landedWeight / grandTotalWeight : 0,
      avgWeightPerLanding: data.landings > 0 ? Math.round(data.landedWeight / data.landings) : 0,
      topModel,
      airlinesUsing: data.airlines.size,
      topModels: modelsList.slice(0, 5),
    });
  }

  return result.sort((a, b) => b.landings - a.landings);
}

export function calculateAirlineStats(records: FlightRecord[]): AirlineStat[] {
  const map = new Map<string, {
    iata: string;
    landings: number;
    landedWeight: number;
    boeing: number;
    airbus: number;
    regional: number;
    models: Map<string, number>;
    regions: Map<string, number>;
    firstPeriod: number;
    lastPeriod: number;
  }>();

  let grandTotalLandings = 0;
  let grandTotalWeight = 0;

  for (const r of records) {
    const airline = r.operatingAirline;
    grandTotalLandings += r.landingCount;
    grandTotalWeight += r.totalLandedWeight;

    let entry = map.get(airline);
    if (!entry) {
      entry = {
        iata: r.operatingAirlineIata,
        landings: 0,
        landedWeight: 0,
        boeing: 0,
        airbus: 0,
        regional: 0,
        models: new Map(),
        regions: new Map(),
        firstPeriod: r.activityPeriod,
        lastPeriod: r.activityPeriod,
      };
      map.set(airline, entry);
    }

    entry.landings += r.landingCount;
    entry.landedWeight += r.totalLandedWeight;
    if (r.activityPeriod < entry.firstPeriod) entry.firstPeriod = r.activityPeriod;
    if (r.activityPeriod > entry.lastPeriod) entry.lastPeriod = r.activityPeriod;

    const m = r.aircraftManufacturer.toLowerCase();
    if (m.includes('boeing')) {
      entry.boeing += r.landingCount;
    } else if (m.includes('airbus')) {
      entry.airbus += r.landingCount;
    } else if (m.includes('bombardier') || m.includes('embraer')) {
      entry.regional += r.landingCount;
    }

    if (r.aircraftModel && r.aircraftModel !== '-') {
      entry.models.set(r.aircraftModel, (entry.models.get(r.aircraftModel) || 0) + r.landingCount);
    }
    if (r.geoRegion) {
      entry.regions.set(r.geoRegion, (entry.regions.get(r.geoRegion) || 0) + r.landingCount);
    }
  }

  const result: AirlineStat[] = [];

  for (const [airline, data] of map.entries()) {
    let dominant = 'Other';
    if (data.boeing >= data.airbus && data.boeing >= data.regional && data.boeing > 0) dominant = 'Boeing';
    else if (data.airbus >= data.boeing && data.airbus >= data.regional && data.airbus > 0) dominant = 'Airbus';
    else if (data.regional > 0) dominant = 'Regional';

    const topModels = Array.from(data.models.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const regions = Array.from(data.regions.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);

    result.push({
      airline,
      iata: data.iata,
      landings: data.landings,
      landedWeight: data.landedWeight,
      shareLandings: grandTotalLandings > 0 ? data.landings / grandTotalLandings : 0,
      shareWeight: grandTotalWeight > 0 ? data.landedWeight / grandTotalWeight : 0,
      dominantManufacturer: dominant,
      boeingRatio: data.landings > 0 ? data.boeing / data.landings : 0,
      airbusRatio: data.landings > 0 ? data.airbus / data.landings : 0,
      regionalRatio: data.landings > 0 ? data.regional / data.landings : 0,
      topModels,
      regions,
      firstPeriod: data.firstPeriod,
      lastPeriod: data.lastPeriod,
    });
  }

  return result.sort((a, b) => b.landings - a.landings);
}

export function calculateGeoRegionStats(records: FlightRecord[]): GeoRegionStat[] {
  const map = new Map<string, {
    geoSummary: string;
    landings: number;
    landedWeight: number;
    airlines: Map<string, number>;
    models: Map<string, number>;
  }>();

  let grandTotalLandings = 0;

  for (const r of records) {
    const region = r.geoRegion || 'Unknown';
    grandTotalLandings += r.landingCount;

    let entry = map.get(region);
    if (!entry) {
      entry = {
        geoSummary: r.geoSummary,
        landings: 0,
        landedWeight: 0,
        airlines: new Map(),
        models: new Map(),
      };
      map.set(region, entry);
    }

    entry.landings += r.landingCount;
    entry.landedWeight += r.totalLandedWeight;

    entry.airlines.set(r.operatingAirline, (entry.airlines.get(r.operatingAirline) || 0) + r.landingCount);
    if (r.aircraftModel && r.aircraftModel !== '-') {
      entry.models.set(r.aircraftModel, (entry.models.get(r.aircraftModel) || 0) + r.landingCount);
    }
  }

  const result: GeoRegionStat[] = [];

  for (const [region, data] of map.entries()) {
    const topAirlines = Array.from(data.airlines.entries())
      .map(([airline, landings]) => ({ airline, landings }))
      .sort((a, b) => b.landings - a.landings)
      .slice(0, 5);

    const topModels = Array.from(data.models.entries())
      .map(([model, landings]) => ({ model, landings }))
      .sort((a, b) => b.landings - a.landings)
      .slice(0, 5);

    result.push({
      region,
      geoSummary: data.geoSummary,
      landings: data.landings,
      landedWeight: data.landedWeight,
      shareLandings: grandTotalLandings > 0 ? data.landings / grandTotalLandings : 0,
      topAirlines,
      topModels,
      avgWeightPerFlight: data.landings > 0 ? Math.round(data.landedWeight / data.landings) : 0,
    });
  }

  return result.sort((a, b) => b.landings - a.landings);
}

export function calculateModelStats(records: FlightRecord[]): ModelStat[] {
  const map = new Map<string, {
    manufacturer: string;
    bodyType: string;
    landings: number;
    landedWeight: number;
    airlines: Map<string, number>;
  }>();

  for (const r of records) {
    if (!r.aircraftModel || r.aircraftModel === '-') continue;
    const key = r.aircraftModel;

    let entry = map.get(key);
    if (!entry) {
      entry = {
        manufacturer: r.aircraftManufacturer,
        bodyType: r.aircraftBodyType,
        landings: 0,
        landedWeight: 0,
        airlines: new Map(),
      };
      map.set(key, entry);
    }

    entry.landings += r.landingCount;
    entry.landedWeight += r.totalLandedWeight;
    entry.airlines.set(r.operatingAirline, (entry.airlines.get(r.operatingAirline) || 0) + r.landingCount);
  }

  const result: ModelStat[] = [];

  for (const [model, data] of map.entries()) {
    const topAirlines = Array.from(data.airlines.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([airline]) => airline);

    result.push({
      model,
      manufacturer: data.manufacturer,
      bodyType: data.bodyType,
      landings: data.landings,
      landedWeight: data.landedWeight,
      avgWeight: data.landings > 0 ? Math.round(data.landedWeight / data.landings) : 0,
      topAirlines,
    });
  }

  return result.sort((a, b) => b.landings - a.landings);
}
