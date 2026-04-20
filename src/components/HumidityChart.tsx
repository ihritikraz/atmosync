import { useState } from 'react';
import type { HourlyData } from '../types/weather';
import './HumidityChart.css';

interface Props {
  hourly: HourlyData;
}

const HumidityChart = ({ hourly }: Props) => {
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

  const humids = hourly.humidity.slice(startIndex, endIndex);
  const times = hourly.time.slice(startIndex, endIndex);

  const width = 800;
  const height = 150; // Slightly shorter as it's a dedicated chart
  const padX = 30;
  const padTop = 20;
  const padBottom = 30;
  const chartWidth = width - padX * 2;
  const chartHeight = height - padTop - padBottom;

  // Use a fixed 0-100% scale for humidity or a padded dynamic one
  const minH = Math.max(0, Math.floor(Math.min(...humids) - 5));
  const maxH = Math.min(100, Math.ceil(Math.max(...humids) + 5));
  const hRange = maxH - minH || 1;

  const points = humids.map((hVal, i) => {
    const x = padX + (i / (humids.length - 1)) * chartWidth;
    const y = padTop + (1 - (hVal - minH) / hRange) * chartHeight;
    return { x, y, humid: hVal, date: new Date(times[i]) };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z`;

  const timeLabels = times.map((t, i) => {
    if (i % 3 !== 0 && i !== times.length - 1) return null;
    const date = new Date(t);
    const label = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    const x = padX + (i / (humids.length - 1)) * chartWidth;
    return { x, label };
  }).filter(Boolean);

  return (
    <div className="humidity-chart glass-card">
      <div className="chart-header">
        <h3>24h Humidity Trend</h3>
        <div className="chart-status">
          <span className="current-humid">Current: {humids[0]}%</span>
        </div>
      </div>
      
      <div className="chart-wrapper" style={{ position: 'relative' }}>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="chart-svg">
          <defs>
            <linearGradient id="humidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(139, 92, 246, 0.25)" />
              <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map(frac => {
            const y = padTop + frac * chartHeight;
            const hVal = Math.round(maxH - frac * hRange);
            return (
              <g key={frac}>
                <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="var(--border-color)" strokeWidth="1" opacity={0.5} />
                <text x={padX - 6} y={y + 4} textAnchor="end" fill="var(--text-secondary)" fontSize="10">{hVal}%</text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#humidGrad)" />

          {/* Main Line */}
          <path d={linePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* NOW Vertical Line */}
          {nowIndex >= 0 && nowIndex < count && (
            <g>
              <line 
                x1={padX + (nowIndex / (count - 1)) * chartWidth} 
                y1={padTop} 
                x2={padX + (nowIndex / (count - 1)) * chartWidth} 
                y2={height - padBottom} 
                stroke="#8b5cf6" 
                strokeWidth="2" 
                strokeDasharray="4 4" 
                opacity={0.6} 
              />
              <rect 
                x={padX + (nowIndex / (count - 1)) * chartWidth - 20} 
                y={padTop - 15} 
                width="40" 
                height="15" 
                rx="4" 
                fill="#8b5cf6" 
              />
              <text 
                x={padX + (nowIndex / (count - 1)) * chartWidth} 
                y={padTop - 4} 
                textAnchor="middle" 
                fill="white" 
                fontSize="9" 
                fontWeight="800"
              >NOW</text>
            </g>
          )}

          {/* Points */}
          {points.map((p, i) => {
            const isHovered = hoveredPoint === i;
            if (i % 6 !== 0 && !isHovered) return null;
            return (
              <circle 
                key={`dot-${i}`}
                cx={p.x} 
                cy={p.y} 
                r={isHovered ? 5 : 3} 
                fill={isHovered ? '#8b5cf6' : 'var(--bg-card-solid)'} 
                stroke="#8b5cf6" 
                strokeWidth="2" 
                style={{ transition: 'all 0.2s' }}
              />
            );
          })}

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

          {/* Time labels */}
          {timeLabels.map((item, i) => item && (
            <text key={`time-${i}`} x={item.x} y={height - 8} textAnchor="middle" fill="var(--text-secondary)" fontSize="10">{item.label}</text>
          ))}
        </svg>

        {hoveredPoint !== null && (
          <div 
            className="h-chart-tooltip"
            style={{
              left: `${(points[hoveredPoint].x / width) * 100}%`,
              top: `${(points[hoveredPoint].y / height) * 100}%`,
              pointerEvents: 'none'
            }}
          >
            <div className="h-tooltip-time">{points[hoveredPoint].date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
            <div className="h-tooltip-val">{points[hoveredPoint].humid}% Humidity</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HumidityChart;
