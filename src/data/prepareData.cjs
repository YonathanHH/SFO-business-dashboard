const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../');
const csvSourcePath = path.join(rootDir, 'raw_data.csv');
const publicDir = path.join(rootDir, 'public');
const publicDataDir = path.join(publicDir, 'data');
const csvDestPath = path.join(publicDir, 'raw_data.csv');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(publicDataDir)) {
  fs.mkdirSync(publicDataDir, { recursive: true });
}

// Copy raw_data.csv to public
fs.copyFileSync(csvSourcePath, csvDestPath);
console.log('Copied raw_data.csv to public/');

// Read and build pre-computed JSON summary
const content = fs.readFileSync(csvSourcePath, 'utf8');
const lines = content.split(/\r?\n/);

let header = null;
const records = [];
let totalLandings = 0;
let totalWeight = 0;
const monthlyAgg = {};
const airlinesMap = {};
const manufacturersMap = {};
const geoRegionsMap = {};
const bodyTypesMap = {};
const modelsMap = {};

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  if (!header) {
    header = parseCSVLine(line);
    continue;
  }
  const cols = parseCSVLine(line);
  if (cols.length < 14) continue;

  const period = parseInt(cols[0], 10);
  const opAirline = cols[1];
  const opAirlineIata = cols[2];
  const pubAirline = cols[3];
  const geoSummary = cols[5];
  const geoRegion = cols[6];
  const landingAircraftType = cols[7];
  const aircraftBodyType = cols[8];
  const manufacturer = cols[9];
  const model = cols[10];
  const version = cols[11];
  const landings = parseInt(cols[12], 10) || 0;
  const landedWeight = parseFloat(cols[13]) || 0;

  totalLandings += landings;
  totalWeight += landedWeight;

  // Monthly
  if (!monthlyAgg[period]) {
    const periodStr = String(period);
    const yr = parseInt(periodStr.substring(0, 4), 10);
    const mo = parseInt(periodStr.substring(4, 6), 10);
    monthlyAgg[period] = {
      period: `${yr}-${String(mo).padStart(2, '0')}`,
      periodNum: period,
      year: yr,
      month: mo,
      landings: 0,
      landedWeight: 0,
      boeingLandings: 0,
      airbusLandings: 0,
      regionalLandings: 0,
      otherLandings: 0,
      boeingWeight: 0,
      airbusWeight: 0,
      domesticLandings: 0,
      internationalLandings: 0,
      narrowBodyLandings: 0,
      wideBodyLandings: 0,
      regionalJetLandings: 0,
      turboPropLandings: 0
    };
  }

  const mAgg = monthlyAgg[period];
  mAgg.landings += landings;
  mAgg.landedWeight += landedWeight;

  const mLower = (manufacturer || '').toLowerCase();
  if (mLower.includes('boeing')) {
    mAgg.boeingLandings += landings;
    mAgg.boeingWeight += landedWeight;
  } else if (mLower.includes('airbus')) {
    mAgg.airbusLandings += landings;
    mAgg.airbusWeight += landedWeight;
  } else if (mLower.includes('bombardier') || mLower.includes('embraer')) {
    mAgg.regionalLandings += landings;
  } else {
    mAgg.otherLandings += landings;
  }

  if (geoSummary.toLowerCase() === 'domestic') {
    mAgg.domesticLandings += landings;
  } else {
    mAgg.internationalLandings += landings;
  }

  const bLower = (aircraftBodyType || '').toLowerCase();
  if (bLower.includes('narrow')) mAgg.narrowBodyLandings += landings;
  else if (bLower.includes('wide')) mAgg.wideBodyLandings += landings;
  else if (bLower.includes('regional')) mAgg.regionalJetLandings += landings;
  else if (bLower.includes('turbo')) mAgg.turboPropLandings += landings;

  // Manufacturers
  manufacturersMap[manufacturer] = (manufacturersMap[manufacturer] || 0) + landings;
  // Geo Regions
  geoRegionsMap[geoRegion] = (geoRegionsMap[geoRegion] || 0) + landings;
  // Airlines
  airlinesMap[opAirline] = (airlinesMap[opAirline] || 0) + landings;
  // Body Types
  bodyTypesMap[aircraftBodyType] = (bodyTypesMap[aircraftBodyType] || 0) + landings;
  // Models
  if (model && model !== '-') {
    modelsMap[model] = (modelsMap[model] || 0) + landings;
  }
}

const monthlyList = Object.values(monthlyAgg).sort((a, b) => a.periodNum - b.periodNum);
for (const item of monthlyList) {
  item.avgWeight = item.landings > 0 ? Math.round(item.landedWeight / item.landings) : 0;
}

const summaryOutput = {
  totalRecords: lines.length - 1,
  totalLandings,
  totalWeight,
  avgWeightPerLanding: Math.round(totalWeight / totalLandings),
  periodRange: { min: monthlyList[0].periodNum, max: monthlyList[monthlyList.length - 1].periodNum },
  monthlyData: monthlyList,
  topManufacturers: Object.entries(manufacturersMap).map(([m, count]) => ({ manufacturer: m, landings: count })).sort((a, b) => b.landings - a.landings),
  topAirlines: Object.entries(airlinesMap).map(([a, count]) => ({ airline: a, landings: count })).sort((a, b) => b.landings - a.landings).slice(0, 20),
  topRegions: Object.entries(geoRegionsMap).map(([r, count]) => ({ region: r, landings: count })).sort((a, b) => b.landings - a.landings),
  topBodyTypes: Object.entries(bodyTypesMap).map(([b, count]) => ({ bodyType: b, landings: count })).sort((a, b) => b.landings - a.landings),
  topModels: Object.entries(modelsMap).map(([model, count]) => ({ model, landings: count })).sort((a, b) => b.landings - a.landings).slice(0, 20)
};

fs.writeFileSync(path.join(publicDataDir, 'summary.json'), JSON.stringify(summaryOutput, null, 2));
console.log('Generated public/data/summary.json successfully!');
