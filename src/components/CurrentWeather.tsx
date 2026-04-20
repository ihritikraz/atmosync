import { MapPin, Calendar, ArrowUpRight } from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import { getWeatherInfo } from '../services/weatherApi';
import type { CurrentWeather as CurrentWeatherType, GeoLocation } from '../types/weather';
import './CurrentWeather.css';

interface Props {
  weather: CurrentWeatherType;
  location: GeoLocation;
  onExpand?: (metric: 'temp') => void;
}

const CurrentWeather = ({ weather, location, onExpand }: Props) => {
  const { description, icon } = getWeatherInfo(weather.weatherCode, weather.isDay);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="current-weather glass-card">
      <div className="cw-top">
        <div>
          <span className="cw-label">Now</span>
          <span className="cw-time" style={{ marginLeft: '6px' }}>{timeStr}</span>
        </div>
        {onExpand && (
          <button className="expand-btn" onClick={() => onExpand('temp')} title="Compare Historical Temperature">
            <ArrowUpRight size={16} /> Compare
          </button>
        )}
      </div>
      
      <div className="weather-main">
        <div className="temperature-container">
          <span className="temperature">{Math.round(weather.temperature)}</span>
          <span className="cw-unit">&deg;C</span>
        </div>
        <WeatherIcon icon={icon} size={72} className="weather-icon" />
      </div>

      <div className="cw-details">
        <p className="desc-text">{description}</p>
        <span className="feels-like">Feels like {Math.round(weather.feelsLike)}&deg;</span>
      </div>

      <div className="divider"></div>

      <div className="weather-footer">
        <div className="footer-item">
          <Calendar size={15} />
          <span>{dateStr}</span>
        </div>
        <div className="footer-item">
          <MapPin size={15} />
          <span>{[location.name, location.admin1, location.country].filter(Boolean).join(', ')}</span>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeather;
