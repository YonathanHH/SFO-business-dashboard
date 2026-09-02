/**
 * Geographic metadata used by the interactive route globe.
 *
 * The SFO dataset only records traffic at the *region* level (GEO Region), never at
 * airport level. So the map colours whole regions and draws one illustrative corridor
 * per region, anchored on that region's principal SFO gateway airport.
 */

export type RegionKey =
  | 'US'
  | 'Canada'
  | 'Mexico'
  | 'Central America'
  | 'Caribbean'
  | 'South America'
  | 'Europe'
  | 'Middle East'
  | 'Asia'
  | 'Australia / Oceania';

export interface Gateway {
  /** Representative gateway airport for the corridor endpoint. */
  label: string;
  iata: string;
  /** [longitude, latitude] */
  coords: [number, number];
}

/** Origin of every corridor in this dataset. */
export const SFO: Gateway = {
  label: 'San Francisco Intl',
  iata: 'SFO',
  coords: [-122.3749, 37.6189],
};

export const REGION_GATEWAYS: Record<RegionKey, Gateway> = {
  US: SFO,
  Canada: { label: 'Vancouver', iata: 'YVR', coords: [-123.1839, 49.1939] },
  Mexico: { label: 'Mexico City', iata: 'MEX', coords: [-99.0721, 19.4363] },
  'Central America': { label: 'San Salvador', iata: 'SAL', coords: [-89.0557, 13.4409] },
  Caribbean: { label: 'San Juan', iata: 'SJU', coords: [-66.0018, 18.4394] },
  'South America': { label: 'São Paulo', iata: 'GRU', coords: [-46.4731, -23.4356] },
  Europe: { label: 'London Heathrow', iata: 'LHR', coords: [-0.4543, 51.4700] },
  'Middle East': { label: 'Dubai', iata: 'DXB', coords: [55.3644, 25.2532] },
  Asia: { label: 'Tokyo Haneda', iata: 'HND', coords: [139.7811, 35.5533] },
  'Australia / Oceania': { label: 'Sydney', iata: 'SYD', coords: [151.1772, -33.9461] },
};

/** Rough great-circle distance from SFO, in nautical miles (for context in the UI). */
export function greatCircleNm(a: [number, number], b: [number, number]): number {
  const toRad = Math.PI / 180;
  const [lon1, lat1] = [a[0] * toRad, a[1] * toRad];
  const [lon2, lat2] = [b[0] * toRad, b[1] * toRad];
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const radians = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  return Math.round(radians * 3440.065);
}

/**
 * Country name (as published in world-atlas `countries-110m`) -> GEO Region.
 * Countries absent from this table are rendered as "not served from SFO".
 */
const REGION_COUNTRIES: Record<RegionKey, string[]> = {
  US: ['United States of America'],
  Canada: ['Canada'],
  Mexico: ['Mexico'],
  'Central America': [
    'Guatemala', 'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama',
  ],
  Caribbean: [
    'Cuba', 'Jamaica', 'Haiti', 'Dominican Rep.', 'Bahamas', 'Puerto Rico',
    'Trinidad and Tobago',
  ],
  'South America': [
    'Colombia', 'Venezuela', 'Guyana', 'Suriname', 'Ecuador', 'Peru', 'Brazil', 'Bolivia',
    'Paraguay', 'Chile', 'Argentina', 'Uruguay', 'Falkland Is.',
  ],
  Europe: [
    'Norway', 'Sweden', 'Finland', 'Denmark', 'Iceland', 'United Kingdom', 'Ireland',
    'France', 'Spain', 'Portugal', 'Germany', 'Netherlands', 'Belgium', 'Luxembourg',
    'Switzerland', 'Austria', 'Italy', 'Poland', 'Czechia', 'Slovakia', 'Hungary',
    'Slovenia', 'Croatia', 'Bosnia and Herz.', 'Serbia', 'Montenegro', 'Macedonia',
    'Albania', 'Kosovo', 'Greece', 'Bulgaria', 'Romania', 'Moldova', 'Ukraine', 'Belarus',
    'Lithuania', 'Latvia', 'Estonia', 'Russia', 'Turkey', 'Cyprus', 'N. Cyprus',
  ],
  'Middle East': [
    'Israel', 'Palestine', 'Lebanon', 'Jordan', 'Syria', 'Iraq', 'Iran', 'Saudi Arabia',
    'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Bahrain',
  ],
  Asia: [
    'China', 'Taiwan', 'Japan', 'South Korea', 'North Korea', 'Mongolia', 'India',
    'Pakistan', 'Bangladesh', 'Nepal', 'Bhutan', 'Sri Lanka', 'Myanmar', 'Thailand',
    'Laos', 'Cambodia', 'Vietnam', 'Malaysia', 'Singapore', 'Brunei', 'Indonesia',
    'Philippines', 'Timor-Leste', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan',
    'Tajikistan', 'Kyrgyzstan', 'Afghanistan', 'Armenia', 'Azerbaijan', 'Georgia',
  ],
  'Australia / Oceania': [
    'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'New Caledonia',
    'Solomon Is.', 'Vanuatu',
  ],
};

export const COUNTRY_TO_REGION: Record<string, RegionKey> = (() => {
  const map: Record<string, RegionKey> = {};
  (Object.keys(REGION_COUNTRIES) as RegionKey[]).forEach((region) => {
    REGION_COUNTRIES[region].forEach((country) => {
      map[country] = region;
    });
  });
  return map;
})();

/** Maps a raw dataset GEO Region string onto a known region key. */
export function normalizeRegion(region: string): RegionKey | null {
  const raw = (region || '').trim();
  if (raw in REGION_GATEWAYS) return raw as RegionKey;

  const r = raw.toLowerCase();
  if (r === 'us' || r === 'usa' || r === 'domestic') return 'US';
  if (r.includes('oceania') || r.includes('australia')) return 'Australia / Oceania';
  if (r.includes('middle east')) return 'Middle East';
  if (r.includes('central america')) return 'Central America';
  if (r.includes('south america')) return 'South America';
  if (r.includes('caribbean')) return 'Caribbean';
  if (r.includes('canada')) return 'Canada';
  if (r.includes('mexico')) return 'Mexico';
  if (r.includes('europe')) return 'Europe';
  if (r.includes('asia')) return 'Asia';
  return null;
}
