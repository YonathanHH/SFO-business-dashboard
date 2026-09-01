// Utility formatting functions for Aviation Analytics

export function formatNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toLocaleString();
}

export function formatWeight(lbs: number, unit: 'lbs' | 'tons' | 'metric_tonnes' = 'lbs'): string {
  if (lbs === undefined || lbs === null || isNaN(lbs)) return '0';
  
  if (unit === 'metric_tonnes') {
    const tonnes = lbs * 0.00045359237;
    if (tonnes >= 1_000_000) {
      return `${(tonnes / 1_000_000).toFixed(2)}M MT`;
    }
    if (tonnes >= 1_000) {
      return `${(tonnes / 1_000).toFixed(1)}k MT`;
    }
    return `${Math.round(tonnes).toLocaleString()} MT`;
  }

  if (unit === 'tons') {
    const tons = lbs / 2000;
    if (tons >= 1_000_000) {
      return `${(tons / 1_000_000).toFixed(2)}M Tons`;
    }
    if (tons >= 1_000) {
      return `${(tons / 1_000).toFixed(1)}k Tons`;
    }
    return `${Math.round(tons).toLocaleString()} Tons`;
  }

  // Default lbs
  if (lbs >= 1_000_000_000) {
    return `${(lbs / 1_000_000_000).toFixed(2)}B lbs`;
  }
  if (lbs >= 1_000_000) {
    return `${(lbs / 1_000_000).toFixed(2)}M lbs`;
  }
  if (lbs >= 1_000) {
    return `${(lbs / 1_000).toFixed(1)}k lbs`;
  }
  return `${Math.round(lbs).toLocaleString()} lbs`;
}

export function formatPercent(value: number, decimals: number = 1): string {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  const num = Math.abs(value) > 1 ? value : value * 100;
  return `${num.toFixed(decimals)}%`;
}

export function formatPeriod(period: number | string): string {
  if (!period) return '';
  const str = String(period).replace('-', '');
  if (str.length !== 6) return String(period);
  const year = str.substring(0, 4);
  const monthNum = parseInt(str.substring(4, 6), 10);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[monthNum - 1] || str.substring(4, 6);
  return `${month} ${year}`;
}

export function getManufacturerColor(manufacturer: string): string {
  const m = (manufacturer || '').toLowerCase();
  if (m.includes('boeing')) return '#2D8FE6'; // Boeing electric blue
  if (m.includes('airbus')) return '#06B6D4'; // Airbus cyan/teal
  if (m.includes('bombardier')) return '#F59E0B'; // Amber
  if (m.includes('embraer')) return '#10B981'; // Emerald
  if (m.includes('mcdonnell') || m.includes('douglas')) return '#8B5CF6'; // Purple
  return '#94A3B8'; // Slate
}

export function getBodyTypeColor(bodyType: string): string {
  const b = (bodyType || '').toLowerCase();
  if (b.includes('narrow')) return '#38BDF8'; // Sky blue
  if (b.includes('wide')) return '#818CF8'; // Indigo
  if (b.includes('regional')) return '#FBBF24'; // Amber
  if (b.includes('turbo')) return '#34D399'; // Mint
  return '#94A3B8';
}

export function getGeoColor(region: string): string {
  const r = (region || '').toLowerCase();
  if (r.includes('us') || r.includes('domestic')) return '#38BDF8';
  if (r.includes('asia')) return '#EC4899'; // Pink
  if (r.includes('europe')) return '#A855F7'; // Purple
  if (r.includes('canada')) return '#10B981'; // Green
  if (r.includes('mexico')) return '#F97316'; // Orange
  if (r.includes('australia') || r.includes('oceania')) return '#06B6D4'; // Cyan
  if (r.includes('central')) return '#EAB308'; // Yellow
  if (r.includes('middle east')) return '#6366F1'; // Indigo
  if (r.includes('south america')) return '#14B8A6'; // Teal
  return '#94A3B8';
}
