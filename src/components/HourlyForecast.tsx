import WeatherIcon from './WeatherIcon';
import { getWeatherInfo } from '../services/weatherApi';
import type { HourlyData } from '../types/weather';
import { Droplets } from 'lucide-react';
import './HourlyForecast.css';

interface Props {
  hourly: HourlyData;
}

const HourlyForecast = ({ hourly }: Props) => {
  // Find the current hour index and show next 24 hours
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const currentHourStr = `${year}-${month}-${day}T${hour}`;
  
  let startIndex = hourly.time.findIndex(t => t.startsWith(currentHourStr));
  if (startIndex === -1) startIndex = 0;
  const endIndex = Math.min(startIndex + 24, hourly.time.length);

  const items = [];
  for (let i = startIndex; i < endIndex; i++) {
    const time = new Date(hourly.time[i]);
    const isNow = i === startIndex;
    const label = isNow ? 'Now' : time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    const { icon } = getWeatherInfo(hourly.weatherCode[i], Boolean(hourly.isDay[i]));
    
    items.push(
      <div key={i} className={`hourly-item ${isNow ? 'active' : ''}`}>
        <span className="hour-time">{label}</span>
        <div className="hour-icon">
          <WeatherIcon icon={icon} size={24} />
        </div>
        <span className="hour-temp">{Math.round(hourly.temperature[i])}&deg;</span>
        {hourly.precipitationProbability[i] > 0 && (
          <div className="hour-precip">
            <Droplets size={12} />
            <span>{hourly.precipitationProbability[i]}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="hourly-forecast glass-card">
      <div className="scroll-container">
        {items}
      </div>
    </div>
  );
};

export default HourlyForecast;
