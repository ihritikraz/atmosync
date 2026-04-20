export interface GeoLocation {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string; // state/province
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  cloudCover: number;
  visibility: number;
  uvIndex: number;
  dewPoint: number;
  weatherCode: number;
  isDay: boolean;
  precipitationProbability: number;
}

export interface HourlyData {
  time: string[];
  temperature: number[];
  feelsLike: number[];
  humidity: number[];
  precipitationProbability: number[];
  precipitation: number[];
  weatherCode: number[];
  windSpeed: number[];
  windDirection: number[];
  visibility: number[];
  uvIndex: number[];
  isDay: number[];
  pressure: number[];
  cloudCover: number[];
  dewPoint: number[];
}

export interface DailyData {
  time: string[];
  weatherCode: number[];
  temperatureMax: number[];
  temperatureMin: number[];
  sunrise: string[];
  sunset: string[];
  uvIndexMax: number[];
  precipitationSum: number[];
  precipitationProbabilityMax: number[];
  windSpeedMax: number[];
  windGustsMax: number[];
  windDirectionDominant: number[];
}

export interface AirQualityData {
  aqi: number;
  pm2_5: number;
  pm10: number;
  no2: number;
  so2: number;
  o3: number;
  co: number;
}

export interface WeatherData {
  location: GeoLocation;
  current: CurrentWeather;
  hourly: HourlyData;
  daily: DailyData;
  airQuality: AirQualityData | null;
}

export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindUnit = 'kmh' | 'mph' | 'ms';
