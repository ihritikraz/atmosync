import { useState, useEffect, useCallback, useRef } from 'react';
import type { WeatherData, GeoLocation } from '../types/weather';
import { fetchWeather, searchCities } from '../services/weatherApi';

const DEFAULT_LOCATION: GeoLocation = {
  name: 'San Francisco',
  country: 'United States',
  latitude: 37.7749,
  longitude: -122.4194,
  admin1: 'California',
};

async function resolveLocation(lat: number, lon: number): Promise<GeoLocation> {
  const loc: GeoLocation = {
    name: 'My Location',
    country: '',
    latitude: lat,
    longitude: lon,
  };
  try {
    // 1. Precise street/suburb level lookup via Nominatim
    const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`);
    if (nomRes.ok) {
      const data = await nomRes.json();
      const addr = data.address;
      if (addr) {
        const preciseName = addr.suburb || addr.neighbourhood || addr.village || addr.city_district || addr.town || addr.city;
        if (preciseName) {
          loc.name = preciseName;
          loc.country = addr.country;
          loc.admin1 = addr.state;
          return loc;
        }
      }
    }
  } catch { /* Suppress and fallthrough */ }

  try {
    // 2. City-level fallback lookup via BigDataCloud
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (res.ok) {
      const data = await res.json();
      if (data.city || data.locality) {
        loc.name = data.city || data.locality || data.principalSubdivision;
        loc.country = data.countryName;
        loc.admin1 = data.principalSubdivision;
      }
    }
  } catch { /* keep defaults */ }
  return loc;
}

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoLocation>(DEFAULT_LOCATION);
  const geoAttempted = useRef(false);

  const loadWeather = useCallback(async (loc: GeoLocation) => {
    setLoading(true);
    setError(null);
    try {
      const weather = await fetchWeather(loc.latitude, loc.longitude);
      setData({ ...weather, location: loc });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-detect geolocation on first mount
  useEffect(() => {
    if (geoAttempted.current) return;
    geoAttempted.current = true;

    if (!navigator.geolocation) return; // will use DEFAULT_LOCATION

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = await resolveLocation(pos.coords.latitude, pos.coords.longitude);
        setLocation(loc);
      },
      () => {
        // Permission denied — DEFAULT_LOCATION already set, just trigger load
        loadWeather(DEFAULT_LOCATION);
      },
      { timeout: 5000 }
    );
  }, [loadWeather]);

  // Reload weather whenever location changes
  useEffect(() => {
    loadWeather(location);
  }, [location, loadWeather]);

  const changeLocation = useCallback((loc: GeoLocation) => {
    setLocation(loc);
  }, []);

  const useCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = await resolveLocation(pos.coords.latitude, pos.coords.longitude);
        setLocation(loc);
      },
      () => setError('Unable to access your location')
    );
  }, []);

  const refresh = useCallback(() => {
    loadWeather(location);
  }, [location, loadWeather]);

  return { data, loading, error, changeLocation, useCurrentLocation, refresh };
}

/**
 * Hook for debounced city search
 */
export function useCitySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const cities = await searchCities(query);
        setResults(cities);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return { query, setQuery, results, searching, clearSearch };
}
