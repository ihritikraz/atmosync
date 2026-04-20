import { useState, useCallback, useEffect, useRef } from 'react';
import type { YearData, DateComparison, DailyRecord } from '../types/historical';
import { YEAR_CONFIG } from '../types/historical';
import { buildYearData, fetchDateComparison } from '../services/historicalApi';

export function useHistorical(lat: number, lon: number) {
  const [yearlyData, setYearlyData] = useState<YearData[]>([]);
  const [dateComparison, setDateComparison] = useState<DateComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDate, setLoadingDate] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isLoadingRef = useRef(false);

  /**
   * Load all years of data in parallel, but with a small stagger to avoid 429 errors
   */
  const loadAllYears = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    setLoaded(false);

    try {
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const promises = YEAR_CONFIG.map(async (cfg, idx) => {
        try {
          // Stagger the parallel requests slightly (150ms apart)
          // This avoids the 'burst' 429 limit while still being 'parallel'
          if (idx > 0) await wait(idx * 150);
          
          return await buildYearData(lat, lon, cfg.year, cfg.type, cfg.label, cfg.color);
        } catch (err) {
          console.error(`Year ${cfg.year} failed to load:`, err);
          return null; // Handle individual year failure
        }
      });

      const results = await Promise.all(promises);
      const validResults = results.filter((r): r is YearData => r !== null);
      
      if (validResults.length > 0) {
        setYearlyData(validResults);
        setLoaded(true);
      }
    } catch (err) {
      console.error('Fatal failure in historical loader:', err);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, [lat, lon]);

  /**
   * Compare a specific date across all years
   */
  const compareDate = useCallback(async (month: number, day: number) => {
    setLoadingDate(true);
    try {
      const years = YEAR_CONFIG.map(c => c.year);
      const [results, hourlyResults] = await Promise.all([
        fetchDateComparison(lat, lon, month, day, years),
        import('../services/historicalApi').then(m => m.fetchHourlyComparison(lat, lon, month, day, years))
      ]);

      // Fill in data from already loaded yearly cache
      const enriched = results.map(r => {
        let returnData = r.data;
        if (!returnData) {
          const yd = yearlyData.find(y => y.year === r.year);
          if (yd) {
            const dateStr = `${r.year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            returnData = yd.dailyRecords.find(d => d.date === dateStr) || null;
          }
        }
        
        const hr = hourlyResults.find(h => h.year === r.year);
        
        return {
          year: r.year,
          data: returnData,
          hourly: hr ? hr.hourly : null
        };
      });

      setDateComparison({
        date: `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        records: enriched.map(r => ({
          year: r.year,
          type: YEAR_CONFIG.find(c => c.year === r.year)!.type,
          data: r.data,
          hourly: r.hourly
        }))
      });
    } catch (err) {
      console.error('Failed to compare date:', err);
    } finally {
      setLoadingDate(false);
    }
  }, [lat, lon, yearlyData]);

  // Reactive Trigger: Auto-load when coordinates change
  useEffect(() => {
    loadAllYears();
  }, [lat, lon, loadAllYears]); // Coordinates are the primary key

  return {
    yearlyData,
    dateComparison,
    loading,
    loadingDate,
    loaded,
    loadAllYears,
    compareDate,
  };
}
