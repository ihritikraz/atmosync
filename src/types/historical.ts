export interface DailyRecord {
  date: string;
  tempMax: number | null;
  tempMin: number | null;
  precipitation: number | null;
  humidity: number | null; // This is the mean
  humidityMax: number | null;
  humidityMin: number | null;
  windSpeed: number | null;
  feelsLike: number | null;
  uv: number | null;
}

export interface MonthlyAggregate {
  month: number;       // 0-11
  monthName: string;
  avgTempMax: number | null;
  avgTempMin: number | null;
  totalPrecipitation: number;
  rainyDays: number;   // days with > 1mm precip
  dryDays: number;
  avgHumidity: number | null;
  maxHumidity: number | null;
  minHumidity: number | null;
  avgWindSpeed: number | null;
  dataPoints: number;  // how many days of data
}

export interface YearData {
  year: number;
  type: 'historical' | 'current' | 'projected';
  label: string;
  color: string;
  monthly: MonthlyAggregate[];
  dailyRecords: DailyRecord[];
}

export interface DateComparison {
  date: string;          // "MM-DD" e.g., "04-18"
  records: {
    year: number;
    type: 'historical' | 'current' | 'projected';
    data: DailyRecord | null;
    hourly?: any | null;
  }[];
}

export const YEAR_CONFIG = [
  { year: 2023, type: 'historical' as const, label: '2023', color: '#94a3b8' },
  { year: 2024, type: 'historical' as const, label: '2024', color: '#64748b' },
  { year: 2025, type: 'historical' as const, label: '2025', color: '#f59e0b' },
  { year: 2026, type: 'current' as const, label: '2026 (Now)', color: '#3b82f6' },
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
