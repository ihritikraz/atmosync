import type { GeoLocation, WeatherData, AirQualityData } from '../types/weather';

const BASE_URL = 'https://api.open-meteo.com/v1';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1';
const AQI_URL = 'https://air-quality-api.open-meteo.com/v1';

/**
 * Search cities by name using Open-Meteo geocoding
 */
export async function searchCities(query: string): Promise<GeoLocation[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `${GEO_URL}/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`
    );

    if (!res.ok) throw new Error('Geocoding request failed');

    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((r: any) => ({
      name: r.name,
      country: r.country || '',
      latitude: r.latitude,
      longitude: r.longitude,
      admin1: r.admin1 || '',
    }));
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch complete weather data for a location
 */
export async function fetchWeather(lat: number, lon: number): Promise<Omit<WeatherData, 'location'>> {
  const currentParams = [
    'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
    'surface_pressure', 'wind_speed_10m', 'wind_direction_10m',
    'wind_gusts_10m', 'cloud_cover', 'visibility',
    'uv_index', 'dew_point_2m', 'weather_code', 'is_day',
    'precipitation_probability',
  ].join(',');

  const hourlyParams = [
    'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
    'precipitation_probability', 'precipitation', 'weather_code',
    'wind_speed_10m', 'wind_direction_10m', 'visibility',
    'uv_index', 'is_day', 'surface_pressure', 'cloud_cover', 'dew_point_2m',
  ].join(',');

  const dailyParams = [
    'weather_code', 'temperature_2m_max', 'temperature_2m_min',
    'sunrise', 'sunset', 'uv_index_max',
    'precipitation_sum', 'precipitation_probability_max',
    'wind_speed_10m_max', 'wind_gusts_10m_max', 'wind_direction_10m_dominant',
  ].join(',');

  const url = `${BASE_URL}/forecast?latitude=${lat}&longitude=${lon}&current=${currentParams}&hourly=${hourlyParams}&daily=${dailyParams}&timezone=auto&forecast_days=7`;
  const cacheKey = `atmosync_weather_${lat.toFixed(4)}_${lon.toFixed(4)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      // If we hit a rate limit (429) or other error, try to load from cache
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        console.warn('API error, using cached weather data');
        return JSON.parse(cached);
      }
      throw new Error('Weather request failed');
    }
    const data = await res.json();

    // Transform and then cache the result
    const current = {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    pressure: data.current.surface_pressure,
    windSpeed: data.current.wind_speed_10m,
    windDirection: data.current.wind_direction_10m,
    windGusts: data.current.wind_gusts_10m,
    cloudCover: data.current.cloud_cover,
    visibility: Math.round(data.current.visibility / 1000), // meters to km
    uvIndex: data.current.uv_index,
    dewPoint: data.current.dew_point_2m,
    weatherCode: data.current.weather_code,
    isDay: Boolean(data.current.is_day),
    precipitationProbability: data.current.precipitation_probability ?? 0,
  };

  const hourly = {
    time: data.hourly.time,
    temperature: data.hourly.temperature_2m,
    feelsLike: data.hourly.apparent_temperature,
    humidity: data.hourly.relative_humidity_2m,
    precipitationProbability: data.hourly.precipitation_probability,
    precipitation: data.hourly.precipitation,
    weatherCode: data.hourly.weather_code,
    windSpeed: data.hourly.wind_speed_10m,
    windDirection: data.hourly.wind_direction_10m,
    visibility: data.hourly.visibility,
    uvIndex: data.hourly.uv_index,
    isDay: data.hourly.is_day,
    pressure: data.hourly.surface_pressure,
    cloudCover: data.hourly.cloud_cover,
    dewPoint: data.hourly.dew_point_2m,
  };

  const daily = {
    time: data.daily.time,
    weatherCode: data.daily.weather_code,
    temperatureMax: data.daily.temperature_2m_max,
    temperatureMin: data.daily.temperature_2m_min,
    sunrise: data.daily.sunrise,
    sunset: data.daily.sunset,
    uvIndexMax: data.daily.uv_index_max,
    precipitationSum: data.daily.precipitation_sum,
    precipitationProbabilityMax: data.daily.precipitation_probability_max,
    windSpeedMax: data.daily.wind_speed_10m_max,
    windGustsMax: data.daily.wind_gusts_10m_max,
    windDirectionDominant: data.daily.wind_direction_10m_dominant,
  };

  // Air quality
  let airQuality: AirQualityData | null = null;
  try {
    const aqRes = await fetch(
      `${AQI_URL}/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide`
    );
    if (aqRes.ok) {
      const aqData = await aqRes.json();
      airQuality = {
        aqi: aqData.current.european_aqi ?? null,
        pm2_5: aqData.current.pm2_5 ?? null,
        pm10: aqData.current.pm10 ?? null,
        no2: aqData.current.nitrogen_dioxide ?? null,
        so2: aqData.current.sulphur_dioxide ?? null,
        o3: aqData.current.ozone ?? null,
        co: aqData.current.carbon_monoxide ?? null,
      };
    }
  } catch {
    // Air quality is optional
  }

    const result = { current, hourly, daily, airQuality };
    localStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Convert WMO weather code to description & icon name
 */
export function getWeatherInfo(code: number, isDay: boolean): { description: string; icon: string } {
  const map: Record<number, { description: string; dayIcon: string; nightIcon: string }> = {
    0:  { description: 'Clear Sky', dayIcon: 'sun', nightIcon: 'moon' },
    1:  { description: 'Mainly Clear', dayIcon: 'sun', nightIcon: 'moon' },
    2:  { description: 'Partly Cloudy', dayIcon: 'cloud-sun', nightIcon: 'cloud-moon' },
    3:  { description: 'Overcast', dayIcon: 'cloud', nightIcon: 'cloud' },
    45: { description: 'Fog', dayIcon: 'cloud-fog', nightIcon: 'cloud-fog' },
    48: { description: 'Rime Fog', dayIcon: 'cloud-fog', nightIcon: 'cloud-fog' },
    51: { description: 'Light Drizzle', dayIcon: 'cloud-drizzle', nightIcon: 'cloud-drizzle' },
    53: { description: 'Moderate Drizzle', dayIcon: 'cloud-drizzle', nightIcon: 'cloud-drizzle' },
    55: { description: 'Dense Drizzle', dayIcon: 'cloud-drizzle', nightIcon: 'cloud-drizzle' },
    56: { description: 'Freezing Drizzle', dayIcon: 'cloud-hail', nightIcon: 'cloud-hail' },
    57: { description: 'Heavy Freezing Drizzle', dayIcon: 'cloud-hail', nightIcon: 'cloud-hail' },
    61: { description: 'Slight Rain', dayIcon: 'cloud-rain', nightIcon: 'cloud-rain' },
    63: { description: 'Moderate Rain', dayIcon: 'cloud-rain', nightIcon: 'cloud-rain' },
    65: { description: 'Heavy Rain', dayIcon: 'cloud-rain-wind', nightIcon: 'cloud-rain-wind' },
    66: { description: 'Freezing Rain', dayIcon: 'cloud-hail', nightIcon: 'cloud-hail' },
    67: { description: 'Heavy Freezing Rain', dayIcon: 'cloud-hail', nightIcon: 'cloud-hail' },
    71: { description: 'Slight Snow', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    73: { description: 'Moderate Snow', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    75: { description: 'Heavy Snow', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    77: { description: 'Snow Grains', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    80: { description: 'Slight Showers', dayIcon: 'cloud-sun-rain', nightIcon: 'cloud-rain' },
    81: { description: 'Moderate Showers', dayIcon: 'cloud-rain', nightIcon: 'cloud-rain' },
    82: { description: 'Violent Showers', dayIcon: 'cloud-rain-wind', nightIcon: 'cloud-rain-wind' },
    85: { description: 'Slight Snow Showers', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    86: { description: 'Heavy Snow Showers', dayIcon: 'snowflake', nightIcon: 'snowflake' },
    95: { description: 'Thunderstorm', dayIcon: 'cloud-lightning', nightIcon: 'cloud-lightning' },
    96: { description: 'Thunderstorm with Hail', dayIcon: 'cloud-lightning', nightIcon: 'cloud-lightning' },
    99: { description: 'Severe Thunderstorm', dayIcon: 'cloud-lightning', nightIcon: 'cloud-lightning' },
  };

  const info = map[code] || map[3];
  return {
    description: info.description,
    icon: isDay ? info.dayIcon : info.nightIcon,
  };
}

/**
 * Get wind direction label from degrees
 */
export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Get UV Index status text and color
 */
export function getUVStatus(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: 'Low', color: '#22c55e' };
  if (uv <= 5) return { label: 'Moderate', color: '#eab308' };
  if (uv <= 7) return { label: 'High', color: '#f97316' };
  if (uv <= 10) return { label: 'Very High', color: '#ef4444' };
  return { label: 'Extreme', color: '#7c3aed' };
}

/**
 * Get AQI status text and color
 */
export function getAQIStatus(aqi: number): { label: string; color: string } {
  if (aqi <= 20) return { label: 'Good', color: '#22c55e' };
  if (aqi <= 40) return { label: 'Fair', color: '#84cc16' };
  if (aqi <= 60) return { label: 'Moderate', color: '#eab308' };
  if (aqi <= 80) return { label: 'Poor', color: '#f97316' };
  if (aqi <= 100) return { label: 'Very Poor', color: '#ef4444' };
  return { label: 'Hazardous', color: '#7c3aed' };
}
