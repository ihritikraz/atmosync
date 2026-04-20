/**
 * AtmoSync Binary Decoder
 * Unpacks the high-density binary weather data from the Cloud Vault.
 */

import { DailyRecord } from '../types/historical';

const METRIC_COUNT = 9;
const BYTES_PER_METRIC = 2;
const DAYS_PER_YEAR = 366;

export function decodeDailyBuffer(buffer: ArrayBuffer, year: number): DailyRecord[] {
  const view = new DataView(buffer);
  const records: DailyRecord[] = [];
  
  // Create date generator for the year
  const date = new Date(`${year}-01-01`);
  
  for (let i = 0; i < DAYS_PER_YEAR; i++) {
    const offset = i * METRIC_COUNT * BYTES_PER_METRIC;
    if (offset + (METRIC_COUNT * BYTES_PER_METRIC) > buffer.byteLength) break;
    
    const recordMonth = date.getMonth() + 1;
    const recordDay = date.getDate();
    const dateStr = `${year}-${String(recordMonth).padStart(2, '0')}-${String(recordDay).padStart(2, '0')}`;
    
    records.push({
      date: dateStr,
      tempMax: view.getInt16(offset + 0, true) / 10,
      tempMin: view.getInt16(offset + 2, true) / 10,
      precipitation: view.getInt16(offset + 4, true) / 10,
      humidity: view.getInt16(offset + 6, true) / 10,
      humidityMax: view.getInt16(offset + 8, true) / 10,
      humidityMin: view.getInt16(offset + 10, true) / 10,
      windSpeed: view.getInt16(offset + 12, true) / 10,
      feelsLike: view.getInt16(offset + 14, true) / 10,
      uv: view.getInt16(offset + 16, true) / 10,
    });
    
    date.setDate(date.getDate() + 1);
    if (date.getFullYear() > year) break; // End of year
  }
  
  return records;
}
