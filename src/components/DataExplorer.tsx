import { useState, useMemo, useEffect } from 'react';
import type { YearData } from '../types/historical';
import { MONTH_SHORT } from '../types/historical';
import { ThermometerSun, CloudRain, Wind, Droplets, Sun, User } from 'lucide-react';
import './ClimateCompare.css';

interface Props {
  yearlyData: YearData[];
  initialMetric?: string;
}

const METRICS = [
  { id: 'temp', label: 'Temperature', icon: <ThermometerSun size={14} />, unit: '°C', dash: 'none' },
  { id: 'precip', label: 'Precipitation', icon: <CloudRain size={14} />, unit: 'mm', dash: '4 4' },
  { id: 'humidity', label: 'Humidity', icon: <Droplets size={14} />, unit: '%', dash: '8 4' },
  { id: 'wind', label: 'Wind Speed', icon: <Wind size={14} />, unit: 'km/h', dash: '12 4 4 4' },
  { id: 'uv', label: 'UV Index', icon: <Sun size={14} />, unit: 'Idx', dash: '2 6' },
  { id: 'feelsLike', label: 'Feels Like', icon: <User size={14} />, unit: '°C', dash: '6 8' },
];

export default function DataExplorer({ yearlyData, initialMetric = 'temp' }: Props) {
  const [activeYears, setActiveYears] = useState<number[]>(yearlyData.map(y => y.year));
  const [activeMetrics, setActiveMetrics] = useState<string[]>([initialMetric]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Auto-select years as they pop in from the incremental loader
  useEffect(() => {
    if (yearlyData.length > 0) {
      setActiveYears(prev => {
        const newYears = yearlyData.map(y => y.year);
        // If we have no selection, select all available
        if (prev.length === 0) return newYears;
        // Otherwise, just append ones we don't have yet to avoid unselecting user choices
        const toAdd = newYears.filter(y => !prev.includes(y));
        if (toAdd.length === 0) return prev;
        return [...prev, ...toAdd];
      });
    }
  }, [yearlyData]);

  const toggleYear = (y: number) => {
    setActiveYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y]);
  };

  const toggleMetric = (m: string) => {
    setActiveMetrics([m]);
  };

  const activeData = useMemo(() => yearlyData.filter(y => activeYears.includes(y.year)), [yearlyData, activeYears]);

  const daysCount = 366; 
  const xPos = (idx: number) => padL + (idx / (daysCount - 1)) * cw;

  const metricBounds = useMemo(() => {
    const bounds: Record<string, { min: number, max: number }> = {};
    activeMetrics.forEach(metric => {
      let allVals: number[] = [];
      activeData.forEach(yd => {
        yd.dailyRecords.forEach(r => {
          if (!r) return;
          if (metric === 'temp') {
            if (r.tempMax !== null) allVals.push(r.tempMax);
            if (r.tempMin !== null) allVals.push(r.tempMin);
          }
          if (metric === 'precip' && r.precipitation !== null) allVals.push(r.precipitation);
          if (metric === 'humidity' && r.humidity !== null) allVals.push(r.humidity);
          if (metric === 'wind' && r.windSpeed !== null) allVals.push(r.windSpeed);
          if (metric === 'uv' && r.uv !== null) allVals.push(r.uv);
          if (metric === 'feelsLike' && r.feelsLike !== null) allVals.push(r.feelsLike);
        });
      });
      if (allVals.length === 0) {
        bounds[metric] = { min: 0, max: 10 };
        return;
      }
      const realMin = Math.min(...allVals);
      const realMax = Math.max(...allVals);
      bounds[metric] = {
        min: Math.floor(realMin - 2),
        max: Math.ceil(realMax + 2)
      };
      if (bounds[metric].max === bounds[metric].min) bounds[metric].max += 1;
    });
    return bounds;
  }, [activeMetrics, activeData]);

  const w = 1000, h = 260, padL = 40, padR = 20, padT = 20, padB = 40;
  const cw = w - padL - padR;
  const ch = h - padT - padB;

  const getMetricRecord = (r: any, metric: string): number | null => {
    if (!r) return null;
    if (metric === 'temp') return r.tempMax;
    if (metric === 'precip') return r.precipitation;
    if (metric === 'humidity') return r.humidity;
    if (metric === 'wind') return r.windSpeed;
    if (metric === 'uv') return r.uv;
    if (metric === 'feelsLike') return r.feelsLike;
    return null;
  };

  const getY = (val: number, metric: string) => {
    const bounds = metricBounds[metric] || { min: 0, max: 10 };
    const { min, max } = bounds;
    const range = max - min || 1;
    return padT + (1 - (val - min) / range) * ch;
  };

  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 2024 is a leap year template
  let cumulativeDays = 0;
  const monthLabels = MONTH_SHORT.map((m, i) => {
    const midPoint = cumulativeDays + (daysInMonth[i] / 2);
    cumulativeDays += daysInMonth[i];
    return {
      label: m,
      x: xPos(midPoint)
    };
  });

  return (
    <div className="overview-tab">
      
      {/* Matrix Controls Dashboard */}
      <div className="matrix-controls glass-card" style={{ padding: '1rem', marginBottom: '1.5rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="matrix-group">
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter Metrics</h4>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {METRICS.map(m => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '6px', background: activeMetrics.includes(m.id) ? 'var(--accent-color)' : 'var(--bg-card-solid)', color: activeMetrics.includes(m.id) ? 'white' : 'var(--text-primary)', transition: 'all 0.2s', border: `1px solid ${activeMetrics.includes(m.id) ? 'transparent' : 'var(--border-color)'}` }}>
                <input type="checkbox" checked={activeMetrics.includes(m.id)} onChange={() => toggleMetric(m.id)} style={{ display: 'none' }} />
                {m.icon} <span style={{ fontWeight: 500 }}>{m.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="matrix-group">
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter Years</h4>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {yearlyData.map(y => (
                <label key={y.year} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '6px', background: activeYears.includes(y.year) ? 'var(--accent-color)' : 'var(--bg-card-solid)', color: activeYears.includes(y.year) ? 'white' : 'var(--text-primary)', transition: 'all 0.2s', border: `1px solid ${activeYears.includes(y.year) ? 'transparent' : 'var(--border-color)'}` }}>
                  <input type="checkbox" checked={activeYears.includes(y.year)} onChange={() => toggleYear(y.year)} style={{ display: 'none' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: y.color }}></span>
                  <span style={{ fontWeight: 500 }}>{y.year}</span>
                </label>
              ))
            }
          </div>
        </div>
      </div>

      <div className="chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {activeYears.length === 0 || activeMetrics.length === 0 ? (
          <div className="glass-card" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Select at least one Metric and one Year to visualize.
          </div>
        ) : (
          activeMetrics.map(metricId => {
            const mConfig = METRICS.find(m => m.id === metricId)!;
            const bounds = metricBounds[metricId] || { min: 0, max: 10 };
            const { min, max } = bounds;
            const range = max - min || 1;

            return (
              <div key={metricId} className="glass-card" style={{ padding: '1rem', position: 'relative', overflowX: 'auto', borderRadius: '12px' }}>
                <h3 style={{ margin: `0 0 1rem ${padL}px`, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontSize: '1rem' }}>
                  {mConfig.icon} {mConfig.label} <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 400 }}>({mConfig.unit})</span>
                </h3>
                
                <div style={{ minWidth: '700px' }}>
                  <svg viewBox={`0 0 ${w} ${h}`} className="trend-svg" style={{ overflow: 'visible', width: '100%', height: 'auto' }}>
                    <defs>
                      <linearGradient id="hoverLineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="var(--border-color)" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                      {/* Generates a gorgeous fading gradient for each year to dynamically apply to the active year */}
                      {activeData.map(yd => (
                        <linearGradient key={`grad-${yd.year}`} id={`grad-${yd.year}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={yd.color} stopOpacity="0.25" />
                          <stop offset="100%" stopColor={yd.color} stopOpacity="0" />
                        </linearGradient>
                      ))}
                    </defs>

                    {/* Static Y-Axis Grid + Values exactly like TempChart */}
                    {[0, 0.25, 0.5, 0.75, 1].map(frac => {
                      const y = padT + frac * ch;
                      const val = Math.round(max - frac * range);
                      return (
                        <g key={frac}>
                          <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--border-color)" strokeWidth="1" />
                          <text x={padL - 8} y={y + 4} textAnchor="end" fill="var(--text-secondary)" fontSize="11">{val}</text>
                        </g>
                      );
                    })}

                    {/* Month X-Axis */}
                    {monthLabels.map((ml, i) => (
                      <text key={i} x={ml.x} y={h - 10} textAnchor="middle" fill="var(--text-secondary)" fontSize="11" fontWeight="500">{ml.label}</text>
                    ))}

                    {/* Hover Crosshair Guide */}
                    {hoverIdx !== null && (
                      <line x1={xPos(hoverIdx)} y1={padT} x2={xPos(hoverIdx)} y2={h - padB} stroke="url(#hoverLineGrad)" strokeWidth="2" />
                    )}

                    {/* TODAY Marker Line — only visible when current year (2026) is active */}
                    {(() => {
                      const now = new Date();
                      const currentYear = now.getFullYear();
                      if (!activeYears.includes(currentYear)) return null;
                      
                      const currentYearConfig = activeData.find(yd => yd.year === currentYear);
                      const yearColor = currentYearConfig?.color || '#3b82f6';
                      
                      const startOfYear = new Date(currentYear, 0, 1);
                      const todayDOY = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
                      const tx = xPos(todayDOY);
                      const dateLabel = `${MONTH_SHORT[now.getMonth()]} ${now.getDate()}`;
                      
                      return (
                        <g style={{ pointerEvents: 'none' }}>
                          <line x1={tx} y1={padT} x2={tx} y2={h - padB} stroke={yearColor} strokeWidth="2" strokeDasharray="4 4" opacity={0.6} />
                          <rect x={tx - 35} y={padT - 18} width="70" height="18" rx="4" fill={yearColor} />
                          <text x={tx} y={padT - 5} textAnchor="middle" fill="white" fontSize="9" fontWeight="800">NOW · {dateLabel}</text>
                        </g>
                      );
                    })()}

                    {/* Render All Active Years for this Exact Metric */}
                    {activeData.map((yd, sortIdx) => {
                      const recordsMap = new Map(yd.dailyRecords.map(r => [r.date.slice(5), r])); 
                      const d3Points: { x: number, y: number, yLow: number | null, date: string, absoluteIndex: number, rawY: number }[] = [];
                      
                      let dateCursor = new Date(2024, 0, 1); 
                      
                      for (let i = 0; i < daysCount; i++) {
                        const mm = String(dateCursor.getMonth() + 1).padStart(2, '0');
                        const dd = String(dateCursor.getDate()).padStart(2, '0');
                        const dayKey = `${mm}-${dd}`;
                        const record = recordsMap.get(dayKey);
                        
                        const vMax = getMetricRecord(record, metricId);
                        const vMin = (metricId === 'temp' && record) ? record.tempMin : null;
                        
                        if (vMax !== null) {
                          d3Points.push({ 
                            x: xPos(i), 
                            y: getY(vMax, metricId),
                            yLow: metricId === 'temp' ? getY(vMin ?? vMax, metricId) : null,
                            rawY: vMax, // save raw for tooltip optional use
                            date: dayKey,
                            absoluteIndex: i
                          });
                        }
                        dateCursor.setDate(dateCursor.getDate() + 1);
                      }

                      // Apply a 14-day rolling average to visually smooth continuous metrics (Temperature, Humidity)
                      // Do NOT smooth burst metrics (Precipitation, Wind, UV) otherwise their peaks will mathematically flatten against the axis.
                      const smoothedPoints = d3Points.map((p, i, arr) => {
                        const smoothable = ['temp', 'feelsLike', 'humidity'].includes(metricId);
                        if (!smoothable) return { ...p, yOut: p.y, yLowOut: p.yLow };
                        
                        const window = arr.slice(Math.max(0, i - 6), Math.min(arr.length, i + 8));
                        const avgY = window.reduce((sum, wp) => sum + wp.y, 0) / window.length;
                        const avgYLow = p.yLow !== null ? window.reduce((sum, wp) => sum + (wp.yLow ?? 0), 0) / window.length : null;
                        return { ...p, yOut: avgY, yLowOut: avgYLow };
                      });

                      // Optimized Segment Splitting: Bridge gaps up to 5 days
                      const segments: typeof smoothedPoints[] = [];
                      if (smoothedPoints.length > 0) {
                        let currSeg: typeof smoothedPoints = [smoothedPoints[0]];
                        for (let i = 1; i < smoothedPoints.length; i++) {
                          // Connect gaps of up to 5 days (e.g. Feb 29 leap year gaps or API dropouts)
                          if (smoothedPoints[i].absoluteIndex <= smoothedPoints[i - 1].absoluteIndex + 5) {
                            currSeg.push(smoothedPoints[i]);
                          } else {
                            segments.push(currSeg);
                            currSeg = [smoothedPoints[i]];
                          }
                        }
                        segments.push(currSeg);
                      }

                      // Ensure youngest/most important year overlays on top
                      // By default, map executes chronologically. 
                      // If it's the target year, it gets the gradient fill!
                      const isHeroYear = (sortIdx === activeData.length - 1); 

                      return (
                        <g key={`${yd.year}-${metricId}`}>
                          {segments.map((seg, sIdx) => {
                            const pathD = seg.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yOut}`).join(' ');

                            const smoothPathD = seg.length > 1 ? seg.map((p, i) => {
                              if (i === 0) return `M ${p.x} ${p.yOut}`;
                              const prev = seg[i - 1];
                              const cpX1 = prev.x + (p.x - prev.x) / 2;
                              return `C ${cpX1} ${prev.yOut}, ${cpX1} ${p.yOut}, ${p.x} ${p.yOut}`;
                            }).join(' ') : pathD;

                             // Clean standard Area fill directly down to the bottom axis
                            let areaFillPath = null;
                            if (isHeroYear && seg.length > 1) {
                              const areaSmooth = seg.map((p, i) => {
                                if (i === 0) return `M ${p.x} ${p.yOut}`;
                                const prev = seg[i - 1];
                                const cpX1 = prev.x + (p.x - prev.x) / 2;
                                return `C ${cpX1} ${prev.yOut}, ${cpX1} ${p.yOut}, ${p.x} ${p.yOut}`;
                              }).join(' ');
                              areaFillPath = `${areaSmooth} L ${seg[seg.length - 1].x} ${h - padB} L ${seg[0].x} ${h - padB} Z`;
                            }

                            return (
                              <g key={sIdx}>
                                {areaFillPath && <path d={areaFillPath} fill={`url(#grad-${yd.year})`} />}
                                <path
                                  d={smoothPathD}
                                  fill="none"
                                  stroke={yd.color}
                                  strokeWidth={isHeroYear ? "3" : "2"}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeDasharray={mConfig.dash !== 'none' ? mConfig.dash : undefined}
                                  opacity={isHeroYear ? 1 : 0.65}
                                />
                                {seg.map((p, i) => {
                                  // Use the pre-cached absolute index for zero-latency hover logic
                                  const isHovered = (hoverIdx === p.absoluteIndex);
                                  if (!isHovered) return null;
                                  return (
                                    <circle 
                                      key={i} 
                                      cx={p.x} cy={p.y} 
                                      r={5} 
                                      fill={yd.color} 
                                      stroke="var(--bg-card)" strokeWidth="2" 
                                      style={{ transition: 'all 0.1s', pointerEvents: 'none' }}
                                    />
                                  );
                                })}
                              </g>
                            );
                          })}
                        </g>
                      );
                    })}


                  </svg>
                </div>

                {/* Floating Multi-Year Tooltip tied exclusively to THIS chart's dataset */}
                {hoverIdx !== null && activeData.length > 0 && (
                  <div 
                    className="chart-tooltip"
                    style={{
                      position: 'absolute', left: `${Math.min(Math.max((xPos(hoverIdx) / w) * 100, 10), 90)}%`, top: `30px`,
                      transform: 'translateX(-50%)', pointerEvents: 'none', background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: '12px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.2)', minWidth: '180px', zIndex: 10
                    }}
                  >
                    <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Daily Record</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {(() => {
                           const d = new Date(2024, 0, 1);
                           d.setDate(d.getDate() + hoverIdx);
                           return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
                        })()}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {activeData.map(yd => {
                          let dateCursor = new Date(2024, 0, 1);
                          dateCursor.setDate(dateCursor.getDate() + hoverIdx);
                          
                          let avgVal = 0, minVal = 0, maxVal = 0;
                          let mm = String(dateCursor.getMonth() + 1).padStart(2, '0');
                          let dd = String(dateCursor.getDate()).padStart(2, '0');
                          const record = yd.dailyRecords.find(r => r.date.endsWith(`${mm}-${dd}`));
                          
                          if (record) {
                            const v = getMetricRecord(record, metricId);
                            if (v !== null) {
                              avgVal = v;
                              if (metricId === 'temp') {
                                maxVal = v; // because getMetricRecord returns tempMax for 'temp'
                                minVal = record.tempMin ?? v;
                              } else if (metricId === 'humidity') {
                                maxVal = record.humidityMax ?? v;
                                minVal = record.humidityMin ?? v;
                              } else {
                                maxVal = v;
                                minVal = v;
                              }
                            }
                          }

                          if (avgVal === 0 && minVal === 0) return null;

                          return (
                            <div key={yd.year} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.4rem 0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: yd.color, fontWeight: 700, fontSize: '0.85rem' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: yd.color }}></span>
                                  {yd.year}
                                </span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                  {metricId === 'temp' ? 'Max: ' : 'Avg: '}{metricId === 'temp' ? maxVal.toFixed(1) : avgVal.toFixed(1)}{mConfig.unit}
                                </span>
                              </div>
                              {metricId === 'temp' ? (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                                  <span>Low: {minVal.toFixed(1)}°</span>
                                  <span>High: {maxVal.toFixed(1)}°</span>
                                </div>
                              ) : metricId === 'humidity' ? (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                                  <span>Avg: {avgVal.toFixed(1)}%</span>
                                  <span>Min: {minVal.toFixed(1)}%</span>
                                  <span>Max: {maxVal.toFixed(1)}%</span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.8 }}>
                                  <span>Value: {avgVal.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                  {/* Hover Overlay */}
                  <div 
                    className="hover-overlay" 
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      // Pixel distance from left edge of container
                      const physicalX = e.clientX - rect.left; 
                      // Convert physical screen pixels into SVG coordinate system (w = 1000)
                      const svgX = (physicalX / rect.width) * w;
                      
                      // Measure relative percentage within the chart's inner padded area
                      const relX = (svgX - padL) / (w - padL - padR);
                      const idx = Math.round(relX * (daysCount - 1));
                      
                      // Only update hover if cursor is actually inside the drawn chart area
                      if (idx >= 0 && idx < daysCount) setHoverIdx(idx);
                    }}
                    onMouseLeave={() => setHoverIdx(null)}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair', zIndex: 10 }}
                  />

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
