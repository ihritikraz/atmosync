import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Moon, Sun, Cloud, X, Loader2, RefreshCw, LocateFixed } from 'lucide-react';
import { useCitySearch } from '../hooks/useWeather';
import type { GeoLocation } from '../types/weather';
import './Header.css';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLocationChange: (loc: GeoLocation) => void;
  onUseCurrentLocation: () => void;
  onRefresh: () => void;
  currentLocation?: string;
  loading?: boolean;
  isOnline?: boolean;
}


const Header = ({ theme, toggleTheme, onLocationChange, onUseCurrentLocation, onRefresh, currentLocation, loading }: HeaderProps) => {
  const { query, setQuery, results, searching, clearSearch } = useCitySearch();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (loc: GeoLocation) => {
    onLocationChange(loc);
    clearSearch();
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="header glass-card">
      <div className="header-left">
        <div className="logo-container">
          <Cloud className="text-accent" size={28} fill="currentColor" />
          <h1 className="logo-text">AtmoSync</h1>
        </div>
      </div>
      
      <div className="header-center" ref={dropdownRef}>
        <div className="search-bar">
          <Search className="search-icon" size={18} />
          <input 
            type="text" 
            placeholder="Search for cities..." 
            className="search-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
          />
          {searching && <Loader2 size={16} className="search-spinner" />}
          {query && !searching && (
            <button className="search-clear" onClick={() => { clearSearch(); setShowDropdown(false); }}>
              <X size={14} />
            </button>
          )}
        </div>

        {showDropdown && results.length > 0 && (
          <div className="search-dropdown glass-card">
            {results.map((city, i) => (
              <button 
                key={`${city.latitude}-${city.longitude}-${i}`} 
                className="search-result"
                onClick={() => handleSelect(city)}
              >
                <MapPin size={16} />
                <div className="result-info">
                  <span className="result-name">{city.name}</span>
                  <span className="result-region">{[city.admin1, city.country].filter(Boolean).join(', ')}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="location-pill">
          <MapPin size={16} />
          <span>{currentLocation || 'Unknown'}</span>
        </div>
        <button 
          className="icon-btn" 
          onClick={onUseCurrentLocation} 
          title="Detect My Location"
        >
          <LocateFixed size={18} />
        </button>
        <button 
          className="icon-btn" 
          onClick={onRefresh} 
          title="Refresh Live Data" 
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
        </button>
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
