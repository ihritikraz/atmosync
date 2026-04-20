import WeatherIcon from './WeatherIcon';
import { getWeatherInfo } from '../services/weatherApi';
import type { DailyData } from '../types/weather';
import './DailyForecast.css';

interface Props {
  daily: DailyData;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DailyForecast = ({ daily }: Props) => {
  const allMin = Math.min(...daily.temperatureMin);
  const allMax = Math.max(...daily.temperatureMax);
  const range = allMax - allMin || 1;

  return (
    <div className="daily-forecast glass-card">
      <h3 className="section-title">7-Day Forecast</h3>
      
      <div className="forecast-list">
        {daily.time.map((dateStr, i) => {
          const date = new Date(dateStr + 'T00:00:00');
          const isToday = i === 0;
          const dayLabel = isToday ? 'Today' : DAYS[date.getDay()];
          const { icon } = getWeatherInfo(daily.weatherCode[i], true);
          const barLeft = ((daily.temperatureMin[i] - allMin) / range) * 100;
          const barWidth = ((daily.temperatureMax[i] - daily.temperatureMin[i]) / range) * 100;

          return (
            <div key={dateStr} className={`forecast-item ${isToday ? 'today' : ''}`}>
              <span className="day-name">{dayLabel}</span>
              <div className="icon-wrapper">
                <WeatherIcon icon={icon} size={22} />
              </div>
              <span className="precip-chance">
                {daily.precipitationProbabilityMax[i] > 0 && (
                  <>{daily.precipitationProbabilityMax[i]}%</>
                )}
              </span>
              <div className="temp-range">
                <span className="min-temp">{Math.round(daily.temperatureMin[i])}&deg;</span>
                <div className="temp-bar">
                  <div 
                    className="temp-bar-fill" 
                    style={{ width: `${Math.max(barWidth, 8)}%`, marginLeft: `${barLeft}%` }}
                  ></div>
                </div>
                <span className="max-temp">{Math.round(daily.temperatureMax[i])}&deg;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyForecast;
