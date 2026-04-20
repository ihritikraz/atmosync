import { Wind, Droplets, Sun, Activity, Eye, ArrowUpRight, Gauge, Sunrise, Sunset, Thermometer } from 'lucide-react';
import { getUVStatus, getAQIStatus, getWindDirection } from '../services/weatherApi';
import type { CurrentWeather, DailyData, AirQualityData } from '../types/weather';
import './Highlights.css';

interface Props {
  current: CurrentWeather;
  daily: DailyData;
  airQuality: AirQualityData | null;
  onExpand?: (metric: 'temp' | 'precip' | 'wind' | 'humidity' | 'uv' | 'visibility') => void;
}

const Highlights = ({ current, daily, airQuality, onExpand }: Props) => {
  const uvStatus = getUVStatus(current.uvIndex);
  const aqiStatus = airQuality ? getAQIStatus(airQuality.aqi) : null;
  const windDir = getWindDirection(current.windDirection);
  const todaySunrise = daily.sunrise[0] ? new Date(daily.sunrise[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';
  const todaySunset = daily.sunset[0] ? new Date(daily.sunset[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--';

  return (
    <div className="highlights-grid">
      {/* UV Index */}
      <div className="highlight-card glass-card">
        <div className="card-header">
          <div>
            <Sun size={16} />
            <h3 className="card-title">UV Index</h3>
          </div>
          {onExpand && (
            <button className="expand-btn" onClick={() => onExpand('uv')} title="Compare Historic UV">
              <ArrowUpRight size={18} />
            </button>
          )}
        </div>
        <div className="card-content">
          <div className="uv-gauge">
            <svg viewBox="0 0 100 50" className="gauge-svg">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--border-color)" strokeWidth="10" strokeLinecap="round" />
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#uv-gradient)" strokeWidth="10" strokeDasharray="125.6" strokeDashoffset={`${125.6 - (Math.min(current.uvIndex, 11) / 11) * 125.6}`} strokeLinecap="round" />
              <defs>
                <linearGradient id="uv-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="40%" stopColor="#eab308" />
                  <stop offset="70%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
            <div className="gauge-value">{Math.round(current.uvIndex)}</div>
          </div>
          <span className="card-status" style={{ color: uvStatus.color }}>{uvStatus.label}</span>
        </div>
      </div>

      {/* Wind */}
      <div className="highlight-card glass-card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wind size={16} />
            <h3 className="card-title">Wind Status</h3>
          </div>
          {onExpand && (
            <button className="expand-btn" onClick={() => onExpand('wind')} title="Compare Historical Wind">
              <ArrowUpRight size={18} />
            </button>
          )}
        </div>
        <div className="card-content">
          <div className="value-group">
            <span className="highlight-value">{Math.round(current.windSpeed)}</span>
            <span className="highlight-unit">km/h</span>
          </div>
          <div className="wind-details">
            <svg width="44" height="44" viewBox="0 0 44 44" className="wind-compass-svg">
              <circle cx="22" cy="22" r="20" fill="none" stroke="var(--border-color)" strokeWidth="2" />
              {/* N/S/E/W tick marks */}
              <text x="22" y="8" textAnchor="middle" fontSize="6" fill="var(--text-secondary)" fontWeight="600">N</text>
              <text x="22" y="40" textAnchor="middle" fontSize="6" fill="var(--text-secondary)" fontWeight="600">S</text>
              <text x="6" y="24" textAnchor="middle" fontSize="6" fill="var(--text-secondary)" fontWeight="600">W</text>
              <text x="38" y="24" textAnchor="middle" fontSize="6" fill="var(--text-secondary)" fontWeight="600">E</text>
              {/* Needle group rotated by wind direction */}
              <g transform={`rotate(${current.windDirection}, 22, 22)`}>
                <line x1="22" y1="22" x2="22" y2="10" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="22" cy="10" r="2.5" fill="var(--accent-color)" />
                <line x1="22" y1="22" x2="22" y2="32" stroke="var(--text-secondary)" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
              </g>
              <circle cx="22" cy="22" r="2" fill="var(--text-secondary)" />
            </svg>
            <div className="wind-info">
              <span className="wind-dir">{windDir}</span>
              <span className="wind-gust">Gusts: {Math.round(current.windGusts)} km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sunrise / Sunset */}
      <div className="highlight-card glass-card">
        <div className="card-header">
          <div>
            <Sunrise size={16} />
            <h3 className="card-title">Sunrise & Sunset</h3>
          </div>
        </div>
        <div className="card-content list-content">
          <div className="sun-item">
            <div className="icon-bg sunrise-bg"><Sunrise size={18} /></div>
            <div className="sun-info">
              <span className="sun-label">Sunrise</span>
              <span className="sun-time">{todaySunrise}</span>
            </div>
          </div>
          <div className="sun-item">
            <div className="icon-bg sunset-bg"><Sunset size={18} /></div>
            <div className="sun-info">
              <span className="sun-label">Sunset</span>
              <span className="sun-time">{todaySunset}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Humidity */}
      <div className="highlight-card glass-card humidity-card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Droplets size={16} />
            <h3 className="card-title">Humidity</h3>
          </div>
          {onExpand && (
            <button className="expand-btn" onClick={() => onExpand('humidity')} title="Compare Historical Humidity">
              <ArrowUpRight size={18} />
            </button>
          )}
        </div>
        <div className="card-content">
          <div className="value-group">
            <span className="highlight-value">{current.humidity}</span>
            <span className="highlight-unit">%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar humidity-bar" style={{ width: `${current.humidity}%` }}></div>
          </div>
          <span className="card-status">{current.humidity < 30 ? 'Low' : current.humidity < 60 ? 'Normal' : 'High'} · Dew {Math.round(current.dewPoint)}&deg;</span>
        </div>
      </div>

      {/* Pressure */}
      <div className="highlight-card glass-card">
        <div className="card-header">
          <div>
            <Gauge size={16} />
            <h3 className="card-title">Pressure</h3>
          </div>
        </div>
        <div className="card-content">
          <div className="value-group">
            <span className="highlight-value">{Math.round(current.pressure)}</span>
            <span className="highlight-unit">hPa</span>
          </div>
          <span className="card-status">{current.pressure < 1000 ? 'Low' : current.pressure < 1020 ? 'Normal' : 'High'}</span>
        </div>
      </div>

      {/* Visibility */}
      <div className="highlight-card glass-card">
        <div className="card-header">
          <div>
            <Eye size={16} />
            <h3 className="card-title">Visibility</h3>
          </div>
          {onExpand && (
            <button className="expand-btn" onClick={() => onExpand('visibility')} title="Compare Historic Visibility">
              <ArrowUpRight size={18} />
            </button>
          )}
        </div>
        <div className="card-content">
          <div className="value-group">
            <span className="highlight-value">{current.visibility}</span>
            <span className="highlight-unit">km</span>
          </div>
          <span className="card-status">{current.visibility >= 10 ? 'Excellent' : current.visibility >= 5 ? 'Good' : 'Poor'}</span>
        </div>
      </div>

      {/* Cloud Cover */}
      <div className="highlight-card glass-card">
        <div className="card-header">
          <div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
            <h3 className="card-title">Cloud Cover</h3>
          </div>
        </div>
        <div className="card-content">
          <div className="value-group">
            <span className="highlight-value">{current.cloudCover}</span>
            <span className="highlight-unit">%</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar cloud-bar" style={{ width: `${current.cloudCover}%` }}></div>
          </div>
          <span className="card-status">{current.cloudCover < 25 ? 'Clear' : current.cloudCover < 50 ? 'Partly Cloudy' : current.cloudCover < 75 ? 'Mostly Cloudy' : 'Overcast'}</span>
        </div>
      </div>

      {/* Feels Like */}
      <div className="highlight-card glass-card">
        <div className="card-header">
          <div>
            <Thermometer size={16} />
            <h3 className="card-title">Feels Like</h3>
          </div>
        </div>
        <div className="card-content">
          <div className="value-group">
            <span className="highlight-value">{Math.round(current.feelsLike)}</span>
            <span className="highlight-unit">&deg;C</span>
          </div>
          <span className="card-status">
            {Math.abs(current.feelsLike - current.temperature) < 2 
              ? 'Similar to actual' 
              : current.feelsLike > current.temperature 
                ? 'Warmer than actual' 
                : 'Cooler than actual'}
          </span>
        </div>
      </div>

      {/* Air Quality */}
      {airQuality && aqiStatus && (
        <div className="highlight-card glass-card air-quality-card">
          <div className="card-header">
            <div>
              <Activity size={16} />
              <h3 className="card-title">Air Quality</h3>
            </div>
          </div>
          <div className="card-content">
            <div className="aqi-main">
              <div className="value-group">
                <span className="highlight-value">{airQuality.aqi}</span>
                <span className="highlight-unit">AQI</span>
              </div>
              <span className="aqi-badge" style={{ background: aqiStatus.color }}>{aqiStatus.label}</span>
            </div>
            <div className="aqi-breakdown">
              <div className="aqi-item"><span>PM2.5</span><span>{airQuality.pm2_5.toFixed(1)}</span></div>
              <div className="aqi-item"><span>PM10</span><span>{airQuality.pm10.toFixed(1)}</span></div>
              <div className="aqi-item"><span>O₃</span><span>{airQuality.o3.toFixed(1)}</span></div>
              <div className="aqi-item"><span>NO₂</span><span>{airQuality.no2.toFixed(1)}</span></div>
              <div className="aqi-item"><span>SO₂</span><span>{airQuality.so2.toFixed(1)}</span></div>
              <div className="aqi-item"><span>CO</span><span>{airQuality.co.toFixed(0)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Highlights;
