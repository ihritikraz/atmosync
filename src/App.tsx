import { useState, useEffect } from 'react';
import './App.css';
import { useWeather } from './hooks/useWeather';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import Header from './components/Header';
import NetworkBanner from './components/NetworkBanner';
import CurrentWeather from './components/CurrentWeather';
import Highlights from './components/Highlights';
import HourlyForecast from './components/HourlyForecast';
import DailyForecast from './components/DailyForecast';
import TempChart from './components/TempChart';
import ClimateCompare from './components/ClimateCompare';
import Footer from './components/Footer';
import LoadingSkeleton from './components/LoadingSkeleton';
import { CloudOff, LayoutDashboard, GitCompareArrows } from 'lucide-react';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [view, setView] = useState<'dashboard' | 'compare'>('dashboard');
  const [compareMetric, setCompareMetric] = useState<'temp' | 'precip' | 'wind' | 'humidity'>('temp');
  const { data, loading, error, changeLocation, useCurrentLocation, refresh } = useWeather();
  const isOnline = useNetworkStatus();

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Dynamic Temperature Theme Logic
  useEffect(() => {
    if (!data) return;
    const temp = data.current.temperature;
    let tempTheme = 'cool';
    
    if (temp < 12) tempTheme = 'cold';
    else if (temp < 24) tempTheme = 'cool';
    else if (temp < 32) tempTheme = 'moderate';
    else tempTheme = 'hot';

    document.documentElement.setAttribute('data-temp', tempTheme);
  }, [data]);

  if (error && !data) {
    return (
      <div className="app-container">
        <NetworkBanner isOnline={isOnline} />
        <Header 
          theme={theme} 
          toggleTheme={toggleTheme} 
          onLocationChange={changeLocation} 
          onUseCurrentLocation={useCurrentLocation}
          onRefresh={refresh}
          loading={loading}
        />
        <div className="error-state">
          <CloudOff size={48} />
          <h2>Connectivity or Data Issue</h2>
          <p>{error}</p>
          <button onClick={refresh} className="retry-btn">Attempt Recalibration</button>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading && !data) {
    return <LoadingSkeleton />;
  }

  if (!data) return null;

  return (
      <div className="app-container">
        <NetworkBanner isOnline={isOnline} />
        <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        onLocationChange={changeLocation} 
        onUseCurrentLocation={useCurrentLocation}
        onRefresh={refresh}
        currentLocation={data.location.name}
        loading={loading}
      />

      {/* Main View Toggle */}
      <div className="view-toggle" data-view={view}>
        <div className="view-pill" />
        <button 
          className={`view-btn ${view === 'dashboard' ? 'active' : ''}`} 
          onClick={() => setView('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Live Dashboard</span>
        </button>
        <button 
          className={`view-btn ${view === 'compare' ? 'active' : ''}`} 
          onClick={() => setView('compare')}
        >
          <GitCompareArrows size={18} />
          <span>Climate Compare</span>
        </button>
      </div>
      <div className="view-viewport">
        {/* Main Content Dashboard */}
        <div className={`view-content ${view === 'dashboard' ? 'active' : ''}`}>
          <main className="main-content">
            <aside className="left-sidebar">
              <CurrentWeather weather={data.current} location={data.location} onExpand={(metric) => { setCompareMetric(metric as any); setView('compare'); }} />
              <DailyForecast daily={data.daily} />
            </aside>
            
            <div className="right-dashboard">
              <section className="dashboard-section">
                <h2>Today's Highlights</h2>
                <Highlights current={data.current} daily={data.daily} airQuality={data.airQuality} onExpand={(metric) => { setCompareMetric(metric as any); setView('compare'); }} />
              </section>
              
              <section className="dashboard-section">
                <h2>Hourly Forecast</h2>
                <HourlyForecast hourly={data.hourly} />
              </section>
              
              <section className="dashboard-section">
                <TempChart hourly={data.hourly} />
              </section>
            </div>
          </main>
        </div>

        {/* Climate Compare Engine rendered persistently in background to preload data instantly */}
        <div className={`view-content ${view === 'compare' ? 'active' : ''}`}>
          <ClimateCompare 
            lat={data.location.latitude} 
            lon={data.location.longitude} 
            cityName={data.location.name}
            metric={compareMetric}
            setMetric={setCompareMetric as any}
          />
        </div>
      </div>
        <Footer />
    </div>
  );
}

export default App;
