import { decodeDailyBuffer } from '../utils/binary';

const VAULT_BASE = 'https://raw.githubusercontent.com/ihritikraz/atmosync-vault/main/v1';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const CLIMATE_URL = 'https://climate-api.open-meteo.com/v1/climate';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const DAILY_PARAMS = 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,uv_index_max,apparent_temperature_max,relative_humidity_2m_mean,relative_humidity_2m_max,relative_humidity_2m_min';

/**
 * Fetch historical daily data for a given year
 */
export async function fetchHistoricalYear(
  lat: number,
  lon: number,
  year: number,
  startMonth = 1,
  endMonth = 12
): Promise<DailyRecord[]> {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // 1. TRY THE CLOUD VAULT FIRST (GitHub)
  if (year < currentYear) {
    try {
      const latInt = Math.floor(lat);
      const lonInt = Math.floor(lon);
      const latF = lat.toFixed(1);
      const lonF = lon.toFixed(1);
      
      const vaultUrl = `${VAULT_BASE}/${latInt}/${lonInt}/${latF}_${lonF}_${year}.bin`;
      const vRes = await fetch(vaultUrl);
      
      if (vRes.ok) {
        console.log(`[VAULT] Hit for ${latF}, ${lonF} in year ${year}`);
        const buffer = await vRes.arrayBuffer();
        const records = decodeDailyBuffer(buffer, year);
        
        // Filter by month if needed
        return records.filter(r => {
          const m = parseInt(r.date.split('-')[1]);
          return m >= startMonth && m <= endMonth;
        });
      }
    } catch (e) {
      console.warn('[VAULT] Miss/Error, falling back to live API:', e);
    }
  }

  // 2. FALLBACK TO ARCHIVE API
  let endDate: string;
  if (year < currentYear) {
    endDate = `${year}-12-31`;
  } else if (year === currentYear) {
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    endDate = fiveDaysAgo.toISOString().slice(0, 10);
  } else {
    return []; // Future years need climate API
  }

  const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01`;
  if (startDate > endDate) return [];

  try {
    const res = await fetch(
      `${ARCHIVE_URL}?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=${DAILY_PARAMS}&timezone=auto`
    );
    if (!res.ok) {
      const error: any = new Error(`Historical API error: ${res.status}`);
      error.status = res.status;
      throw error;
    }
    const data = await res.json();
    
    if (!data.daily?.time) return [];

    return data.daily.time.map((t: string, i: number) => ({
      date: t,
      tempMax: data.daily.temperature_2m_max[i] ?? null,
      tempMin: data.daily.temperature_2m_min[i] ?? null,
      precipitation: data.daily.precipitation_sum[i] ?? null,
      humidity: data.daily.relative_humidity_2m_mean?.[i] ?? null,
      humidityMax: data.daily.relative_humidity_2m_max?.[i] ?? null,
      humidityMin: data.daily.relative_humidity_2m_min?.[i] ?? null,
      windSpeed: data.daily.wind_speed_10m_max[i] ?? null,
      feelsLike: data.daily.apparent_temperature_max?.[i] ?? null,
      uv: data.daily.uv_index_max?.[i] ?? null,
    }));
  } catch (err) {
    throw err;
  }
}

/**
 * Fetch current year forecast to backfill the 5-day lag and provide future visibility
 */
async function fetchCurrentForecast(lat: number, lon: number): Promise<DailyRecord[]> {
  try {
    const res = await fetch(
      `${FORECAST_URL}?latitude=${lat}&longitude=${lon}&daily=${DAILY_PARAMS}&past_days=14&forecast_days=16&timezone=auto`
    );
    if (!res.ok) {
      const error: any = new Error(`Forecast API error: ${res.status}`);
      error.status = res.status;
      throw error;
    }
    const data = await res.json();
    if (!data.daily?.time) return [];

    return data.daily.time.map((t: string, i: number) => ({
      date: t,
      tempMax: data.daily.temperature_2m_max[i] ?? null,
      tempMin: data.daily.temperature_2m_min[i] ?? null,
      precipitation: data.daily.precipitation_sum[i] ?? null,
      humidity: data.daily.relative_humidity_2m_mean?.[i] ?? null,
      windSpeed: data.daily.wind_speed_10m_max[i] ?? null,
      feelsLike: data.daily.apparent_temperature_max?.[i] ?? null,
      uv: data.daily.uv_index_max?.[i] ?? null,
    }));
  } catch (err) {
    throw err;
  }
}

/**
 * Fetch climate projections for a future year using CMIP6 models
 */
export async function fetchClimateProjection(
  lat: number,
  lon: number,
  year: number
): Promise<DailyRecord[]> {
  try {
    const models = 'CMCC_CM2_VHR4,MRI_AGCM3_2_S';
    const res = await fetch(
      `${CLIMATE_URL}?latitude=${lat}&longitude=${lon}&start_date=${year}-01-01&end_date=${year}-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&models=${models}`
    );
    if (!res.ok) {
      const error: any = new Error(`Climate API error: ${res.status}`);
      error.status = res.status;
      throw error;
    }
    const data = await res.json();
    
    if (!data.daily?.time) return [];

    return data.daily.time.map((t: string, i: number) => ({
      date: t,
      tempMax: data.daily.temperature_2m_max[i] ?? null,
      tempMin: data.daily.temperature_2m_min[i] ?? null,
      precipitation: data.daily.precipitation_sum[i] ?? null,
      // Climate API rarely provides reliable humidity mean out of the box, leave null
      humidity: null,
      humidityMax: null,
      humidityMin: null,
      windSpeed: data.daily.wind_speed_10m_max[i] ?? null,
      feelsLike: null,
      uv: null,
    }));
  } catch (err) {
    throw err;
  }
}

/**
 * Fetch a specific date's data across multiple years - Sequential to avoid rate limits
 */
export async function fetchDateComparison(
  lat: number,
  lon: number,
  month: number,
  day: number,
  years: number[]
): Promise<{ year: number; data: DailyRecord | null }[]> {
  const promises = years.map(async (year, idx) => {
    // Add 150ms stagger per request in the parallel batch
    if (idx > 0) await new Promise(r => setTimeout(r, idx * 150));
    
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const now = new Date();
    const targetDate = new Date(dateStr);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    let yearResult: { year: number; data: DailyRecord | null } = { year, data: null };

    try {
      if (targetDate <= fiveDaysAgo) {
        // Archive
        const res = await fetch(
          `${ARCHIVE_URL}?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=${DAILY_PARAMS}&timezone=auto`
        );
        if (!res.ok) throw new Error(`Historical API error: ${res.status}`);
        const d = await res.json();
        if (d.daily?.time?.length) {
          yearResult.data = {
            date: d.daily.time[0],
            tempMax: d.daily.temperature_2m_max[0] ?? null,
            tempMin: d.daily.temperature_2m_min[0] ?? null,
            precipitation: d.daily.precipitation_sum[0] ?? null,
            humidity: d.daily.relative_humidity_2m_mean?.[0] ?? null,
            humidityMax: d.daily.relative_humidity_2m_max?.[0] ?? null,
            humidityMin: d.daily.relative_humidity_2m_min?.[0] ?? null,
            windSpeed: d.daily.wind_speed_10m_max[0] ?? null,
            feelsLike: d.daily.apparent_temperature_max?.[0] ?? null,
            uv: d.daily.uv_index_max?.[0] ?? null,
          };
        }
      } else if (year > now.getFullYear()) {
        // Climate projection for future
        const res = await fetch(
          `${CLIMATE_URL}?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&models=CMCC_CM2_VHR4`
        );
        if (!res.ok) throw new Error(`Climate API error: ${res.status}`);
        const d = await res.json();
        if (d.daily?.time?.length) {
          yearResult.data = {
            date: d.daily.time[0],
            tempMax: d.daily.temperature_2m_max[0] ?? null,
            tempMin: d.daily.temperature_2m_min[0] ?? null,
            precipitation: d.daily.precipitation_sum[0] ?? null,
            humidity: null,
            windSpeed: d.daily.wind_speed_10m_max[0] ?? null,
            feelsLike: null,
            uv: null,
          };
        }
      } else {
        // Current year forecast
        const res = await fetch(
          `${FORECAST_URL}?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=${DAILY_PARAMS}&timezone=auto`
        );
        if (!res.ok) throw new Error(`Forecast API error: ${res.status}`);
        const d = await res.json();
        if (d.daily?.time?.length) {
          yearResult.data = {
            date: d.daily.time[0],
            tempMax: d.daily.temperature_2m_max[0] ?? null,
            tempMin: d.daily.temperature_2m_min[0] ?? null,
            precipitation: d.daily.precipitation_sum[0] ?? null,
            humidity: d.daily.relative_humidity_2m_mean?.[0] ?? null,
            humidityMax: d.daily.relative_humidity_2m_max?.[0] ?? null,
            humidityMin: d.daily.relative_humidity_2m_min?.[0] ?? null,
            windSpeed: d.daily.wind_speed_10m_max[0] ?? null,
          };
        }
      }
      return yearResult;
    } catch (err) {
      console.error(`Error comparing date for year ${year}:`, err);
      return { year, data: null };
    }
  });

  return Promise.all(promises);
}

/**
 * Fetch a specific date's HOURLY data across multiple years - Sequential
 */
export async function fetchHourlyComparison(
  lat: number,
  lon: number,
  month: number,
  day: number,
  years: number[]
): Promise<{ year: number; type: string; hourly: any | null }[]> {
  const HOURLY_PARAMS = 'temperature_2m,precipitation,wind_speed_10m,relative_humidity_2m,apparent_temperature,uv_index';
  
  const promises = years.map(async (year, idx) => {
    // Add 150ms stagger per request
    if (idx > 0) await new Promise(r => setTimeout(r, idx * 150));
    
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const now = new Date();
    const targetDate = new Date(dateStr);
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const type = year > now.getFullYear() ? 'projected' : year === now.getFullYear() ? 'current' : 'historical';

    try {
      if (targetDate <= fiveDaysAgo) {
        const res = await fetch(
          `${ARCHIVE_URL}?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&hourly=${HOURLY_PARAMS}&timezone=auto`
        );
        if (!res.ok) throw new Error(`Hourly Archive error: ${res.status}`);
        const d = await res.json();
        return { year, type, hourly: d.hourly };
      } else if (year > now.getFullYear()) {
        return { year, type, hourly: null };
      } else {
        const res = await fetch(
          `${FORECAST_URL}?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&hourly=${HOURLY_PARAMS}&timezone=auto`
        );
        if (!res.ok) throw new Error(`Hourly Forecast error: ${res.status}`);
        const d = await res.json();
        return { year, type, hourly: d.hourly };
      }
    } catch (err) {
      console.error(`Error fetching hourly for year ${year}:`, err);
      return { year, type, hourly: null };
    }
  });

  return Promise.all(promises);
}

/**
 * Aggregate daily records into monthly buckets
 */
export function aggregateToMonthly(records: DailyRecord[]): MonthlyAggregate[] {
  const buckets: Map<number, DailyRecord[]> = new Map();
  
  for (const r of records) {
    const month = new Date(r.date + 'T00:00:00').getMonth();
    if (!buckets.has(month)) buckets.set(month, []);
    buckets.get(month)!.push(r);
  }

  const result: MonthlyAggregate[] = [];
  for (let m = 0; m < 12; m++) {
    const days = buckets.get(m) || [];
    if (days.length === 0) continue;

    const getValidAvg = (vals: (number | null)[]) => {
      const valid = vals.filter(v => v !== null) as number[];
      return valid.length > 0 ? valid.reduce((s, v) => s + v, 0) / valid.length : null;
    };

    const avgTempMax = getValidAvg(days.map(d => d.tempMax));
    const avgTempMin = getValidAvg(days.map(d => d.tempMin));
    
    const precipVals = days.filter(d => d.precipitation !== null).map(d => d.precipitation!);
    const rawTotalPrecip = precipVals.reduce((s, v) => s + v, 0);
    const rawRainyDays = precipVals.filter(v => v > 1).length;

    let totalPrecipitation = rawTotalPrecip;
    let rainyDays = rawRainyDays;
    
    const year = new Date(days[0].date + 'T00:00:00').getFullYear();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    // Normalize based on days present vs total days in month
    if (days.length < daysInMonth && days.length >= 5) {
      const ratio = daysInMonth / days.length;
      totalPrecipitation = rawTotalPrecip * ratio;
      rainyDays = Math.round(rawRainyDays * ratio);
    }

    const avgWindSpeed = getValidAvg(days.map(d => d.windSpeed));
    const avgHumidity = getValidAvg(days.map(d => d.humidity));
    
    // For extremes, find the absolute max and min in that month
    const validHumMaxs = days.filter(d => d.humidityMax !== null).map(d => d.humidityMax!);
    const maxHumidity = validHumMaxs.length > 0 ? Math.max(...validHumMaxs) : null;
    const validHumMins = days.filter(d => d.humidityMin !== null).map(d => d.humidityMin!);
    const minHumidity = validHumMins.length > 0 ? Math.min(...validHumMins) : null;

    result.push({
      month: m,
      monthName: MONTH_NAMES[m],
      avgTempMax: avgTempMax !== null ? Math.round(avgTempMax * 10) / 10 : null,
      avgTempMin: avgTempMin !== null ? Math.round(avgTempMin * 10) / 10 : null,
      totalPrecipitation: Math.round(totalPrecipitation * 10) / 10,
      rainyDays,
      dryDays: days.length - rainyDays,
      avgHumidity: avgHumidity !== null ? Math.round(avgHumidity) : null,
      maxHumidity: maxHumidity !== null ? Math.round(maxHumidity) : null,
      minHumidity: minHumidity !== null ? Math.round(minHumidity) : null,
      avgWindSpeed: avgWindSpeed !== null ? Math.round(avgWindSpeed * 10) / 10 : null,
      dataPoints: days.length,
    });
  }
  return result;
}

/**
 * Build full year data
 */
export async function buildYearData(
  lat: number,
  lon: number,
  year: number,
  type: 'historical' | 'current' | 'projected',
  label: string,
  color: string
): Promise<YearData> {
  let records: DailyRecord[];

  if (type === 'projected') {
    records = await fetchClimateProjection(lat, lon, year);
  } else if (type === 'current') {
    let hist: DailyRecord[] = [];
    let forecast: DailyRecord[] = [];
    
    try {
      hist = await fetchHistoricalYear(lat, lon, year);
    } catch (e) {
      console.warn(`Could not fetch historical portion of current year ${year}:`, e);
    }
    
    try {
      forecast = await fetchCurrentForecast(lat, lon);
    } catch (e) {
      console.error(`Could not fetch forecast portion of current year ${year}:`, e);
    }
    
    const recordMap = new Map<string, DailyRecord>();
    
    // Add archive data first (Historical context)
    hist.forEach(r => recordMap.set(r.date, r));
    
    // Overwrite with forecast data (User's source of truth for the recent past/now)
    forecast.forEach(r => {
      if (r.date.startsWith(`${year}-`)) {
        recordMap.set(r.date, r);
      }
    });

    records = Array.from(recordMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  } else {
    records = await fetchHistoricalYear(lat, lon, year);
  }

  return {
    year,
    type,
    label,
    color,
    monthly: aggregateToMonthly(records),
    dailyRecords: records,
  };
}
