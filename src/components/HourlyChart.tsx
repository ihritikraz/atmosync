import React, { useState, useMemo, useEffect } from 'react';
import { YEAR_CONFIG } from '../types/historical';
import { ThermometerSun, Droplets, Wind, CloudRain, Sun } from 'lucide-react';

const METRICS = [
  { id: 'temp', label: 'Temperature', icon: <ThermometerSun size={14} />, unit: '°C' },
  { id: 'feelsLike', label: 'Feels Like', icon: <ThermometerSun size={14} className="cold" />, unit: '°C' },
  { id: 'precip', label: 'Precipitation', icon: <CloudRain size={14} />, unit: ' mm' },
  { id: 'wind', label: 'Wind', icon: <Wind size={14} />, unit: ' km/h' },
  { id: 'humidity', label: 'Humidity', icon: <Droplets size={14} />, unit: '%' },
  { id: 'uv', label: 'UV Index', icon: <Sun size={14} />, unit: ' Idx' },
] as const;

export default function HourlyChart({ records, initialMetric = 'temp' }: { records: any[], initialMetric?: any }) {
  const [metricId, setMetricId] = useState<'temp' | 'feelsLike' | 'precip' | 'wind' | 'humidity' | 'uv'>(initialMetric);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Sync internal state with prop if it changes externally
  useEffect(() => {
    setMetricId(initialMetric);
  }, [initialMetric]);

  const w = 800;
  const h = 220;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 30;

  const getMetricKey = (id: string) => {
    switch (id) {
      case 'temp': return 'temperature_2m';
      case 'feelsLike': return 'apparent_temperature';
      case 'precip': return 'precipitation';
      case 'wind': return 'wind_speed_10m';
      case 'humidity': return 'relative_humidity_2m';
      case 'uv': return 'uv_index';
      default: return 'temperature_2m';
    }
  };

  const chartData = useMemo(() => {
    const key = getMetricKey(metricId);
    let min = Infinity;
    let max = -Infinity;

    // 1. Gather all hours from all years to strictly dynamically scale Y-Axis
    const series = records.map(r => {
      const arr: number[] = r.hourly?.[key] || Array(24).fill(null);
      const dataStrPrefix = r.hourly?.time ? r.hourly.time[0].split('T')[0] : '';
      
      const config = YEAR_CONFIG.find(c => c.year === r.year)!;
      const points = arr.map((v, i) => {
        if (v !== null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
        return { val: v, hour: i, datePrefix: dataStrPrefix };
      });
      return { year: r.year, color: config.color, points };
    });

    if (min === Infinity) { min = 0; max = 10; }
    if (min === max) { min -= 1; max += 1; }
    
    // Add 10% breathing room on Y-Axis
    const range = max - min;
    const yMax = max + range * 0.1;
    let yMin = min - range * 0.1;
    if (yMin < 0 && (metricId === 'precip' || metricId === 'wind' || metricId === 'humidity' || metricId === 'uv')) yMin = 0;

    const scaleX = (i: number) => padL + (i / 23) * (w - padL - padR);
    const scaleY = (v: number) => h - padB - ((v - yMin) / (yMax - yMin)) * (h - padB - padT);

    const mappedSeries = series.map(s => {
      let d = '';
      let isValid = false;
      const pts = s.points.map(p => {
        if (p.val === null) return null;
        isValid = true;
        const x = scaleX(p.hour);
        const y = scaleY(p.val);
        d += d === '' ? `M ${x},${y}` : ` L ${x},${y}`;
        return { x, y, val: p.val };
      });
      return { ...s, d, pts, isValid };
    });

    return { mappedSeries, yMin, yMax, scaleX, scaleY };
  }, [records, metricId]);

  const { mappedSeries, yMin, yMax, scaleX } = chartData;
  const mConfig = METRICS.find(m => m.id === metricId)!;
  const xLabels = [0, 4, 8, 12, 16, 20, 23];

  return (
    <div className="hourly-chart-container" style={{ margin: '1rem 0', background: 'var(--bg-card)', borderRadius: '1rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
      
      <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        <h4 style={{ margin: 0, paddingRight: '1rem', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>24h View</h4>
        {METRICS.map(m => (
          <button
            key={m.id}
            onClick={() => setMetricId(m.id as any)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '2rem',
              border: 'none',
              background: metricId === m.id ? 'var(--text-primary)' : 'transparent',
              color: metricId === m.id ? 'var(--bg-card)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      <div style={{ position: 'relative', width: '100%', padding: '1rem' }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {/* Y Axis bounds */}
          <line x1={padL} y1={padT} x2={w-padR} y2={padT} stroke="var(--border)" strokeDasharray="4 4" />
          <text x={padL-5} y={padT+4} fontSize="10" fill="var(--text-secondary)" textAnchor="end">{yMax.toFixed(1)}</text>
          
          <line x1={padL} y1={h-padB} x2={w-padR} y2={h-padB} stroke="var(--border)" />
          <text x={padL-5} y={h-padB+4} fontSize="10" fill="var(--text-secondary)" textAnchor="end">{yMin.toFixed(1)}</text>

          {/* X Axis Labels */}
          {xLabels.map(hr => (
            <text key={hr} x={scaleX(hr)} y={h-10} fontSize="10" fill="var(--text-secondary)" textAnchor="middle">
              {String(hr).padStart(2, '0')}:00
            </text>
          ))}

          {/* Lines */}
          {mappedSeries.map(s => {
            if (!s.isValid) return null;
            return (
              <path
                key={s.year}
                d={s.d}
                fill="none"
                stroke={s.color}
                strokeWidth={hoverIdx !== null ? 1.5 : 2.5}
                opacity={hoverIdx !== null ? 0.3 : 1}
                style={{ transition: 'opacity 0.2s' }}
              />
            );
          })}

          {/* Hover Crosshair */}
          {hoverIdx !== null && (
            <g>
              <line 
                x1={scaleX(hoverIdx)} y1={padT} 
                x2={scaleX(hoverIdx)} y2={h-padB} 
                stroke="var(--text-primary)" strokeWidth="1" strokeDasharray="3 3" opacity={0.3} 
              />
              {mappedSeries.map(s => {
                if (!s.isValid) return null;
                const p = s.pts[hoverIdx];
                if (!p) return null;
                return (
                  <circle key={s.year} cx={p.x} cy={p.y} r={4} fill={s.color} stroke="var(--bg-card)" strokeWidth={2} />
                );
              })}
            </g>
          )}

        </svg>

        {hoverIdx !== null && (
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-card)', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', minWidth: '150px', zIndex: 20 }}>
            <div style={{ fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
              {String(hoverIdx).padStart(2, '0')}:00
            </div>
            {mappedSeries.map(s => {
              if (!s.isValid) return null;
              const p = s.pts[hoverIdx];
              if (!p) return null;
              return (
                <div key={s.year} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '2px' }}>
                  <span style={{ color: s.color }}>{s.year}</span>
                  <span style={{ fontWeight: 600 }}>{p.val.toFixed(1)}{mConfig.unit}</span>
                </div>
              );
            })}
          </div>
        )}

        <div 
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            let x = e.clientX - rect.left;
            x = (x / rect.width) * w;
            const relX = (x - padL) / (w - padL - padR);
            let idx = Math.round(relX * 23);
            if (idx < 0) idx = 0; if (idx > 23) idx = 23;
            setHoverIdx(idx);
          }}
          onMouseLeave={() => setHoverIdx(null)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair', zIndex: 10 }}
        />
      </div>

    </div>
  );
}
