import { useState } from 'react';
import type { HourlyData } from '../types/weather';
import './TempChart.css';

interface Props {
  hourly: HourlyData;
}

const TempChart = ({ hourly }: Props) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  
  const todayStr = `${year}-${month}-${day}`;
  const currentHourStr = `${todayStr}T${hour}`;
  
  // Find the start of the current day (00:00)
  let startIndex = hourly.time.findIndex(t => t.startsWith(todayStr));
  if (startIndex === -1) startIndex = 0;
  
  // Find the exact current hour index for the vertical line
  const nowIndex = hourly.time.findIndex(t => t.startsWith(currentHourStr)) - startIndex;
  
  const count = 24;
  const endIndex = Math.min(startIndex + count, hourly.time.length);

  const temps = hourly.temperature.slice(startIndex, endIndex);
  const precip = hourly.precipitationProbability.slice(startIndex, endIndex);
  const humids = hourly.humidity.slice(startIndex, endIndex);
  const times = hourly.time.slice(startIndex, endIndex);

  const minTemp = Math.floor(Math.min(...temps) - 2);
  const maxTemp = Math.ceil(Math.max(...temps) + 2);
  const range = maxTemp - minTemp || 1;

  const width = 800;
  const height = 220; // Slightly taller to accommodate dual axes comfortably
  const padX = 40; // More padding for dual axes
  const padTop = 60;
  const padBottom = 35;
  const chartWidth = width - padX * 2;
  const chartHeight = height - padTop - padBottom;

  const points = temps.map((t, i) => {
    const x = padX + (i / (temps.length - 1)) * chartWidth;
    const y = padTop + (1 - (t - minTemp) / range) * chartHeight;
    // Humidity uses 0-100% scale
    const humidY = padTop + (1 - (humids[i] / 100)) * chartHeight;
    return { x, y, temp: t, precip: precip[i], humid: humids[i], humidY, date: new Date(times[i]) };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const humidPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.humidY}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z`;

  const timeLabels = times.map((t, i) => {
    if (i % 3 !== 0 && i !== times.length - 1) return null;
    const date = new Date(t);
    const label = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    const x = padX + (i / (temps.length - 1)) * chartWidth;
    return { x, label };
  }).filter(Boolean);

  return (
    <div className="temp-chart glass-card">
      <div className="chart-header">
        <h3>Atmospheric Trends (24h)</h3>
        <div className="chart-legend">
          <span className="legend-temp">● Temp</span>
          <span className="legend-precip" style={{ color: '#3b82f6' }}>● Precip</span>
          <span className="legend-item" style={{ color: '#8b5cf6', fontSize: '0.75rem', fontWeight: 500 }}>-- Humidity</span>
        </div>
      </div>
      
      <div className="chart-wrapper" style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="chart-svg">
          <defs>
            <linearGradient id="tempGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
          </defs>

          {/* Left Axis (Temp) */}
          {[0, 0.5, 1].map(frac => {
            const y = padTop + frac * chartHeight;
            const temp = Math.round(maxTemp - frac * range);
            return (
              <g key={`l-${frac}`}>
                <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="var(--border-color)" strokeWidth="1" opacity={0.3} />
                <text x={padX - 8} y={y + 4} textAnchor="end" fill="var(--text-secondary)" fontSize="9">{temp}°C</text>
              </g>
            );
          })}

          {/* Right Axis (%) */}
          {[0, 0.5, 1].map(frac => {
            const y = padTop + frac * chartHeight;
            const pct = Math.round(100 - frac * 100);
            return (
              <text key={`r-${frac}`} x={width - padX + 8} y={y + 4} textAnchor="start" fill="#8b5cf6" fontSize="9" opacity={0.8}>{pct}%</text>
            );
          })}

          {/* Precipitation bars (using 0-100 scale) */}
          {precip.map((p, i) => {
            if (p <= 0) return null;
            const x = padX + (i / (temps.length - 1)) * chartWidth;
            const barH = (p / 100) * chartHeight;
            return (
              <rect 
                key={`precip-${i}`}
                x={x - 3}
                y={height - padBottom - barH}
                width={6}
                height={barH}
                rx={2}
                fill="var(--accent-bg)"
              />
            );
          })}

          {/* Area fill (Temp) */}
          <path d={areaPath} fill="url(#tempGrad)" />

          {/* Humidity Line (Right Axis Scale) */}
          <path d={humidPath} fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 4" opacity={0.6} />

          {/* Temp Line */}
          <path d={linePath} fill="none" stroke="var(--accent-color)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* NOW Vertical Line */}
          {nowIndex >= 0 && nowIndex < count && (
            <g>
              <line 
                x1={padX + (nowIndex / (count - 1)) * chartWidth} 
                y1={padTop} 
                x2={padX + (nowIndex / (count - 1)) * chartWidth} 
                y2={height - padBottom} 
                stroke="var(--accent-color)" 
                strokeWidth="1.5" 
                strokeDasharray="4 4" 
                opacity={0.5} 
              />
              <text 
                x={padX + (nowIndex / (count - 1)) * chartWidth} 
                y={padTop - 8} 
                textAnchor="middle" 
                fill="var(--accent-color)" 
                fontSize="9" 
                fontWeight="800"
              >NOW</text>
            </g>
          )}

          {/* Time labels */}
          {timeLabels.map((item, i) => item && (
            <text key={`time-${i}`} x={item.x} y={height - 10} textAnchor="middle" fill="var(--text-secondary)" fontSize="9">{item.label}</text>
          ))}

          {/* Hover Targets */}
          {points.map((p, i) => (
            <rect
              key={`hover-${i}`}
              x={p.x - chartWidth / count / 2}
              y={0}
              width={chartWidth / count}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </svg>

        {/* REFINED COMPACT TOOLTIP */}
        {hoveredPoint !== null && (
          <div 
            className={`chart-tooltip ${points[hoveredPoint].y < 100 ? 'flip-down' : ''}`}
            style={{
              left: `${(points[hoveredPoint].x / width) * 100}%`,
              top: `${(points[hoveredPoint].y / height) * 100}%`,
            }}
          >
            <div className="tooltip-time">{points[hoveredPoint].date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
            <div className="tooltip-data">
              <span className="t-temp">{points[hoveredPoint].temp.toFixed(0)}°</span>
              <span className="t-humid" style={{ color: 'var(--text-primary)', background: 'var(--accent-bg)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{points[hoveredPoint].humid}%</span>
              {points[hoveredPoint].precip > 0 && <span className="t-precip" style={{ color: 'var(--text-primary)', background: 'var(--accent-bg)', opacity: 0.8 }}>{points[hoveredPoint].precip}%</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TempChart;
