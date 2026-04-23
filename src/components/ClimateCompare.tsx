import { useState, useEffect } from 'react';
import { useHistorical } from '../hooks/useHistorical';
import { YEAR_CONFIG, MONTH_SHORT } from '../types/historical';
import type { YearData } from '../types/historical';
import DataExplorer from './DataExplorer';
import HourlyChart from './HourlyChart';
import { Loader2, Calendar, BarChart3, TrendingUp, Table2, ThermometerSun, Droplets, Wind, CloudRain, ArrowUpRight } from 'lucide-react';
import './ClimateCompare.css';

interface Props {
  lat: number;
  lon: number;
  cityName: string;
  metric: 'temp' | 'precip' | 'wind' | 'humidity';
  setMetric: (m: 'temp' | 'precip' | 'wind' | 'humidity') => void;
}

const ClimateCompare = ({ lat, lon, cityName, metric }: Props) => {
  const { yearlyData, dateComparison, loadingDate, compareDate } = useHistorical(lat, lon);
  const [activeTab, setActiveTab] = useState<'overview' | 'date' | 'monthly' | 'table'>('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // The useHistorical hook now handles reactive auto-loading internally
  // to ensure coordinates are always in sync with the live location.



  const tabs = [
    { id: 'overview', label: 'Trend Chart', icon: <TrendingUp size={16} /> },
    { id: 'date', label: 'Date Compare', icon: <Calendar size={16} /> },
    { id: 'monthly', label: 'Monthly Stats', icon: <BarChart3 size={16} /> },
    { id: 'table', label: 'Data Table', icon: <Table2 size={16} /> },
  ] as const;

  return (
    <div className="climate-compare">
      <div className="cc-header">
        <div>
          <h2>Climate Comparison — {cityName}</h2>
          <div className="cc-subtitle-row">
            <p className="cc-subtitle">Historical daily records vs current trends</p>
            <div className="cc-coord-badge">
              <span className="label">GPS:</span> {lat.toFixed(4)}, {lon.toFixed(4)}
            </div>
          </div>
        </div>
        <div className="year-badges">
          {YEAR_CONFIG.map(y => {
            const isYearLoaded = yearlyData.some(d => d.year === y.year);
            return (
              <span key={y.year} className={`year-badge ${isYearLoaded ? 'loaded' : ''}`} style={{ borderColor: y.color, color: y.color, opacity: isYearLoaded ? 1 : 0.5 }}>
                {isYearLoaded && <span className="badge-dot" style={{ background: y.color }}></span>}
                {y.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="cc-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`cc-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="cc-content">
        {activeTab === 'overview' && (
          <DataExplorer yearlyData={yearlyData} initialMetric={metric} />
        )}
        {activeTab === 'date' && (
          <DateTab
            selectedMonth={selectedMonth}
            selectedDay={selectedDay}
            setSelectedMonth={setSelectedMonth}
            setSelectedDay={setSelectedDay}
            onCompare={() => compareDate(selectedMonth + 1, selectedDay)}
            comparison={dateComparison}
            loadingDate={loadingDate}
          />
        )}
        {activeTab === 'monthly' && (
          <MonthlyTab yearlyData={yearlyData} selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />
        )}
        {activeTab === 'table' && (
          <TableTab yearlyData={yearlyData} />
        )}
      </div>
    </div>
  );
};



/* ===================== DATE COMPARISON TAB ===================== */
function DateTab({ selectedMonth, selectedDay, setSelectedMonth, setSelectedDay, onCompare, comparison, loadingDate }: any) {
  const [showHourly, setShowHourly] = useState(false);
  const [hourlyMetric, setHourlyMetric] = useState<string>('temp');
  const daysInMonth = new Date(2026, selectedMonth + 1, 0).getDate();

  const handleExpand = (m: string) => {
    if (showHourly && hourlyMetric === m) {
      setShowHourly(false);
    } else {
      setHourlyMetric(m);
      setShowHourly(true);
    }
  };

  useEffect(() => {
    onCompare();
  }, [selectedMonth, selectedDay]);

  return (
    <div className="date-tab">
      <div className="date-picker-row">
        <div className="date-select-group">
          <label>Month</label>
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="cc-select">
            {MONTH_SHORT.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div className="date-select-group">
          <label>Day</label>
          <select value={selectedDay} onChange={e => setSelectedDay(Number(e.target.value))} className="cc-select">
            {Array.from({ length: daysInMonth }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
        <button className="compare-btn" onClick={onCompare} disabled={loadingDate}>
          {loadingDate ? <Loader2 size={16} className="spin" /> : <Calendar size={16} />}
          Compare {MONTH_SHORT[selectedMonth]} {selectedDay}
        </button>
      </div>

      {comparison && (
        <div className="date-results">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>{MONTH_SHORT[Number(comparison.date.split('-')[0]) - 1]} {comparison.date.split('-')[1]} — Across Years</h3>
            <button 
              className="compare-btn" 
              style={{ background: showHourly ? 'var(--text-primary)' : 'var(--bg-lighter)', color: showHourly ? 'var(--bg-card)' : 'var(--text-primary)' }}
              onClick={() => setShowHourly(!showHourly)}
            >
              <TrendingUp size={16} /> {showHourly ? 'Hide 24h Timeline' : 'View 24h Timeline'}
            </button>
          </div>
          
          {showHourly && (
             <HourlyChart records={comparison.records} initialMetric={hourlyMetric} />
          )}

          <div className="date-cards">
            {comparison.records.map((r: any) => {
              const cfg = YEAR_CONFIG.find(c => c.year === r.year)!;
              return (
                <div key={r.year} className="date-card glass-card" style={{ borderTop: `3px solid ${cfg.color}` }}>
                  <div className="dc-header">
                    <span className="dc-year" style={{ color: cfg.color }}>{cfg.label}</span>
                    <span className={`dc-type ${r.type}`}>{r.type === 'projected' ? '🔮 Projected' : r.type === 'current' ? '📡 Current' : '📚 Historical'}</span>
                  </div>
                  {r.data ? (
                    <div className="dc-metrics">
                      <div className="dc-metric" style={{ cursor: 'pointer' }} onClick={() => handleExpand('temp')}>
                        <ThermometerSun size={16} />
                        <div>
                          <span className="dc-val">{r.data.tempMax !== null ? `${r.data.tempMax.toFixed(1)}°` : '—'}</span>
                          <span className="dc-label">Max T</span>
                        </div>
                        <ArrowUpRight size={12} style={{ opacity: 0.4, marginLeft: 'auto' }} />
                      </div>
                      <div className="dc-metric" style={{ cursor: 'pointer' }} onClick={() => handleExpand('temp')}>
                        <ThermometerSun size={16} className="cold" />
                        <div>
                          <span className="dc-val">{r.data.tempMin !== null ? `${r.data.tempMin.toFixed(1)}°` : '—'}</span>
                          <span className="dc-label">Min T</span>
                        </div>
                      </div>
                      <div className="dc-metric" style={{ cursor: 'pointer' }} onClick={() => handleExpand('precip')}>
                        <CloudRain size={16} />
                        <div>
                          <span className="dc-val">{r.data.precipitation !== null ? `${r.data.precipitation.toFixed(1)} mm` : '—'}</span>
                          <span className="dc-label">Rain</span>
                        </div>
                        <ArrowUpRight size={12} style={{ opacity: 0.4, marginLeft: 'auto' }} />
                      </div>
                      <div className="dc-metric" style={{ cursor: 'pointer' }} onClick={() => handleExpand('wind')}>
                        <Wind size={16} />
                        <div>
                          <span className="dc-val">{r.data.windSpeed !== null ? `${r.data.windSpeed.toFixed(1)} km/h` : '—'}</span>
                          <span className="dc-label">Wind</span>
                        </div>
                        <ArrowUpRight size={12} style={{ opacity: 0.4, marginLeft: 'auto' }} />
                      </div>
                      {(() => {
                        let maxH = r.data.humidityMax;
                        let minH = r.data.humidityMin;
                        let maxTimeStr = '';
                        let minTimeStr = '';

                        if (r.hourly && r.hourly.relative_humidity_2m) {
                          const hArr: number[] = r.hourly.relative_humidity_2m;
                          const tArr: string[] = r.hourly.time;
                          const validH = hArr.map((v, i) => ({ v, i })).filter(o => o.v !== null);
                          if (validH.length > 0) {
                             const maxObj = validH.reduce((prev, curr) => (prev.v > curr.v) ? prev : curr);
                             const minObj = validH.reduce((prev, curr) => (prev.v < curr.v) ? prev : curr);
                             maxH = Math.round(maxObj.v);
                             minH = Math.round(minObj.v);
                             maxTimeStr = tArr[maxObj.i].split('T')[1];
                             minTimeStr = tArr[minObj.i].split('T')[1];
                          }
                        }

                        if (maxH === null && minH === null) {
                          return (
                            <div className="dc-metric">
                              <Droplets size={16} />
                              <div>
                                <span className="dc-val">{r.data.humidity !== null ? `${r.data.humidity}%` : '—'}</span>
                                <span className="dc-label">Humidity</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="dc-metric" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '0.5rem', background: 'var(--bg-lighter)', borderRadius: '8px', minWidth: '140px', gap: '0.3rem', position: 'relative', cursor: 'pointer' }} onClick={() => handleExpand('humidity')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Droplets size={16} />
                              <span className="dc-label" style={{ fontWeight: 600 }}>Humidity</span>
                              <ArrowUpRight size={12} style={{ opacity: 0.4, marginLeft: 'auto' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', fontSize: '0.85rem', gap: '2px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Max:</span>
                                <div>
                                  <span style={{ fontWeight: 600 }}>{maxH}%</span>
                                  {maxTimeStr && <span style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: '4px' }}>{maxTimeStr}</span>}
                                </div>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Min:</span>
                                <div>
                                  <span style={{ fontWeight: 600 }}>{minH}%</span>
                                  {minTimeStr && <span style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: '4px' }}>{minTimeStr}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="dc-no-data">No data available</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== MONTHLY STATS TAB ===================== */
function MonthlyTab({ yearlyData, selectedMonth, onSelectMonth }: { yearlyData: YearData[]; selectedMonth: number; onSelectMonth: (m: number) => void }) {
  return (
    <div className="monthly-tab">
      <div className="month-selector">
        {MONTH_SHORT.map((m, i) => (
          <button key={i} className={`month-btn ${selectedMonth === i ? 'active' : ''}`} onClick={() => onSelectMonth(i)}>
            {m}
          </button>
        ))}
      </div>

      <div className="monthly-cards">
        {yearlyData.map(yd => {
          const md = yd.monthly.find(m => m.month === selectedMonth);
          if (!md) return (
            <div key={yd.year} className="monthly-card glass-card" style={{ borderTop: `3px solid ${yd.color}` }}>
              <h4 style={{ color: yd.color }}>{yd.label}</h4>
              <p className="no-data-msg">No data for this month</p>
            </div>
          );

          return (
            <div key={yd.year} className="monthly-card glass-card" style={{ borderTop: `3px solid ${yd.color}` }}>
              <h4 style={{ color: yd.color }}>{yd.label}</h4>
              <div className="mc-grid">
                <div className="mc-item">
                  <span className="mc-label">Avg High</span>
                  <span className="mc-value">{md.avgTempMax !== null ? `${md.avgTempMax}°C` : '—'}</span>
                </div>
                <div className="mc-item">
                  <span className="mc-label">Avg Low</span>
                  <span className="mc-value">{md.avgTempMin !== null ? `${md.avgTempMin}°C` : '—'}</span>
                </div>
                <div className="mc-item">
                  <span className="mc-label">Total Rain</span>
                  <span className="mc-value">{md.totalPrecipitation} mm</span>
                </div>
                <div className="mc-item">
                  <span className="mc-label">Rainy Days</span>
                  <span className="mc-value">{md.rainyDays}</span>
                </div>
                <div className="mc-item">
                  <span className="mc-label">Dry Days</span>
                  <span className="mc-value">{md.dryDays}</span>
                </div>
                <div className="mc-item">
                  <span className="mc-label">Avg Wind</span>
                  <span className="mc-value">{md.avgWindSpeed !== null ? `${md.avgWindSpeed} km/h` : '—'}</span>
                </div>
                <div className="mc-item">
                  <span className="mc-label">Max Humidity</span>
                  <span className="mc-value">{md.maxHumidity !== null ? `${md.maxHumidity}%` : '—'}</span>
                </div>
                <div className="mc-item">
                  <span className="mc-label">Min Humidity</span>
                  <span className="mc-value">{md.minHumidity !== null ? `${md.minHumidity}%` : '—'}</span>
                </div>
                <div className="mc-item">
                  <span className="mc-label">Avg Humidity</span>
                  <span className="mc-value">{md.avgHumidity !== null ? `${md.avgHumidity}%` : '—'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== DATA TABLE TAB ===================== */
function TableTab({ yearlyData }: { yearlyData: YearData[] }) {
  const yearBgColors = [
    'rgba(148, 163, 184, 0.06)',   // 2023 grey
    'rgba(100, 116, 139, 0.08)',   // 2024 slate
    'rgba(245, 158, 11, 0.06)',    // 2025 amber
    'rgba(59, 130, 246, 0.08)',    // 2026 blue
  ];

  return (
    <div className="table-tab">
      <div className="table-scroll">
        <table className="data-table" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, zIndex: 3, background: 'var(--bg-card)', minWidth: '60px' }}>Month</th>
              {yearlyData.map((yd, yi) => (
                <th key={yd.year} colSpan={5} style={{ 
                  borderLeft: `3px solid ${yd.color}`, 
                  background: yearBgColors[yi] || 'transparent',
                  padding: '0.6rem 0.4rem',
                }}>
                  <span style={{ 
                    color: yd.color, 
                    fontWeight: 700, 
                    fontSize: '0.95rem',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.4rem' 
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: yd.color, display: 'inline-block' }}></span>
                    {yd.label}
                  </span>
                </th>
              ))}
            </tr>
            <tr className="sub-header">
              <th style={{ position: 'sticky', left: 0, zIndex: 3, background: 'var(--bg-card)' }}></th>
              {yearlyData.map((yd, yi) => (
                <React.Fragment key={yd.year}>
                  <th style={{ borderLeft: `3px solid ${yd.color}`, background: yearBgColors[yi], fontSize: '0.7rem', color: 'var(--text-secondary)' }}>High</th>
                  <th style={{ background: yearBgColors[yi], fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Low</th>
                  <th style={{ background: yearBgColors[yi], fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Rain</th>
                  <th style={{ background: yearBgColors[yi], fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Wind</th>
                  <th style={{ background: yearBgColors[yi], fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Humid</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTH_SHORT.map((month, mi) => (
              <tr key={mi} style={{ background: mi % 2 === 0 ? 'transparent' : 'var(--bg-lighter, rgba(0,0,0,0.02))' }}>
                <td className="month-cell" style={{ 
                  position: 'sticky', 
                  left: 0, 
                  zIndex: 2, 
                  background: mi % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-lighter, var(--bg-card))',
                  fontWeight: 600,
                  borderRight: '1px solid var(--border)'
                }}>{month}</td>
                {yearlyData.map((yd, yi) => {
                  const md = yd.monthly.find(m => m.month === mi);
                  const cellStyle = { 
                    background: yearBgColors[yi],
                    padding: '0.45rem 0.5rem',
                    fontSize: '0.85rem',
                    textAlign: 'center' as const,
                  };
                  const firstCellStyle = { 
                    ...cellStyle, 
                    borderLeft: `3px solid ${yd.color}` 
                  };

                  if (!md) return (
                    <React.Fragment key={yd.year}>
                      <td style={firstCellStyle}>—</td>
                      <td style={cellStyle}>—</td>
                      <td style={cellStyle}>—</td>
                      <td style={cellStyle}>—</td>
                      <td style={cellStyle}>—</td>
                    </React.Fragment>
                  );
                  return (
                    <React.Fragment key={yd.year}>
                      <td style={firstCellStyle}>{md.avgTempMax !== null ? `${md.avgTempMax}°` : '—'}</td>
                      <td style={cellStyle}>{md.avgTempMin !== null ? `${md.avgTempMin}°` : '—'}</td>
                      <td style={cellStyle}>{md.totalPrecipitation}mm</td>
                      <td style={cellStyle}>{md.avgWindSpeed !== null ? md.avgWindSpeed : '—'}</td>
                      <td style={cellStyle}>{md.avgHumidity !== null ? `${md.avgHumidity}%` : '—'}</td>
                    </React.Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Need React in scope for React.Fragment
import React from 'react';

export default ClimateCompare;
