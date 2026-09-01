export interface FlightRecord {
  activityPeriod: number; // e.g. 201809
  year: number;           // e.g. 2018
  month: number;          // e.g. 9
  periodFormatted: string; // e.g. "2018-09"
  operatingAirline: string;
  operatingAirlineIata: string;
  publishedAirline: string;
  publishedAirlineIata: string;
  geoSummary: 'Domestic' | 'International' | string;
  geoRegion: string;
  landingAircraftType: 'Passenger' | 'Freighter' | 'Combi' | string;
  aircraftBodyType: 'Narrow Body' | 'Wide Body' | 'Regional Jet' | 'Turbo Prop' | string;
  aircraftManufacturer: 'Boeing' | 'Airbus' | 'Bombardier' | 'Embraer' | 'McDonnell Douglas' | string;
  aircraftModel: string;
  aircraftVersion: string;
  landingCount: number;
  totalLandedWeight: number; // lbs
}

export interface FilterState {
  yearRange: [number, number];
  selectedManufacturers: string[];
  selectedBodyTypes: string[];
  selectedGeoSummaries: string[];
  selectedGeoRegions: string[];
  selectedAirlines: string[];
  selectedAircraftTypes: string[];
  searchQuery: string;
}

export interface MetricSummary {
  totalLandings: number;
  totalLandedWeight: number;
  avgWeightPerLanding: number;
  totalAirlines: number;
  totalModels: number;
  domesticShare: number;
  internationalShare: number;
  boeingShareLandings: number;
  airbusShareLandings: number;
  boeingShareWeight: number;
  airbusShareWeight: number;
}

export interface MonthlyAggregate {
  period: string; // YYYY-MM
  periodNum: number;
  year: number;
  month: number;
  landings: number;
  landedWeight: number;
  avgWeight: number;
  boeingLandings: number;
  airbusLandings: number;
  regionalLandings: number;
  otherLandings: number;
  boeingWeight: number;
  airbusWeight: number;
  regionalWeight: number;
  otherWeight: number;
  domesticLandings: number;
  internationalLandings: number;
  domesticWeight: number;
  internationalWeight: number;
  narrowBodyLandings: number;
  wideBodyLandings: number;
  regionalJetLandings: number;
  turboPropLandings: number;
  narrowBodyWeight: number;
  wideBodyWeight: number;
  regionalJetWeight: number;
  turboPropWeight: number;
}

export interface ManufacturerComparison {
  manufacturer: string;
  landings: number;
  landedWeight: number;
  shareLandings: number;
  shareWeight: number;
  avgWeightPerLanding: number;
  topModel: string;
  airlinesUsing: number;
  topModels: { model: string; landings: number; weight: number }[];
}

export interface AirlineStat {
  airline: string;
  iata: string;
  landings: number;
  landedWeight: number;
  shareLandings: number;
  shareWeight: number;
  dominantManufacturer: string;
  boeingRatio: number;
  airbusRatio: number;
  regionalRatio: number;
  topModels: { model: string; count: number }[];
  regions: { region: string; count: number }[];
  firstPeriod: number;
  lastPeriod: number;
}

export interface GeoRegionStat {
  region: string;
  geoSummary: string;
  landings: number;
  landedWeight: number;
  shareLandings: number;
  topAirlines: { airline: string; landings: number }[];
  topModels: { model: string; landings: number }[];
  avgWeightPerFlight: number;
}

export interface ModelStat {
  model: string;
  manufacturer: string;
  bodyType: string;
  landings: number;
  landedWeight: number;
  avgWeight: number;
  topAirlines: string[];
}
