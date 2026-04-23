# ⛅ AtmoSync — Atmospheric Intelligence

A premium, real-time weather dashboard with multi-year climate comparison, built with React + TypeScript + Vite.

![AtmoSync](https://img.shields.io/badge/AtmoSync-Live-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Features

### 🌡️ Live Dashboard
- Real-time weather with auto-detected geolocation
- Dynamic temperature-based color themes (cold → cool → moderate → hot)
- 7-day forecast with temperature range bars
- 24-hour atmospheric trend charts (temperature, humidity, precipitation)
- Today's highlights: UV Index, Wind, Humidity, Pressure, Visibility, Cloud Cover, Air Quality
- Light/Dark mode toggle with glassmorphism design

### 📊 Climate Compare Engine
- **4-year comparison** (2023, 2024, 2025, 2026) across 6 metrics
- **Trend Chart** — Interactive SVG chart with year-over-year overlays
- **Date Compare** — Pick any day and compare it across all years with 24h hourly timeline
- **Monthly Stats** — Aggregated monthly averages, rainfall, humidity extremes
- **Data Table** — Full 12-month × 4-year tabular breakdown

### ⚡ Cloud Vault (CDN)
Historical data is pre-cached as compressed binary files in [atmosync-vault](https://github.com/ihritikraz/atmosync-vault), served via GitHub's raw CDN for instant loading with zero rate limits.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Vanilla CSS with CSS Variables + Glassmorphism |
| Font | Outfit (self-hosted) |
| Icons | Lucide React |
| APIs | Open-Meteo (Forecast, Archive, Climate), OpenStreetMap, BigDataCloud |
| Data Vault | GitHub Raw CDN + Binary encoding |

## 🚀 Getting Started

```bash
# Clone
git clone https://github.com/ihritikraz/atmosync.git
cd atmosync

# Install
npm install

# Dev server
npm run dev

# Build
npm run build
```

## 📁 Project Structure

```
src/
├── components/       # UI components (Header, CurrentWeather, Highlights, Charts, etc.)
├── hooks/            # useWeather, useHistorical, useNetworkStatus
├── services/         # weatherApi, historicalApi (vault + API fallback)
├── types/            # TypeScript interfaces (weather, historical)
├── utils/            # Binary decoder for vault files
└── App.tsx           # Main app with dashboard/compare view toggle

server/               # Vault seeder & binary packer utilities
atmosync-vault/       # Pre-cached binary weather data (separate repo)
```

## 🌐 Data Flow

```
User searches a city
      │
      ▼
┌─────────────────────┐
│  Try Cloud Vault     │  ← GitHub CDN (instant, no limits)
│  /v1/{lat}/{lon}/    │
│  {lat}_{lon}_{year}  │
└──────┬──────────────┘
       │
  Hit? → Decode binary → Done! (< 50ms)
  Miss? → Fallback ↓
       │
┌──────▼──────────────┐
│  Open-Meteo API      │  ← Live API (may rate-limit)
└─────────────────────┘
```

## 👤 Author

**Hritik Raj** 
[GitHub](https://github.com/ihritikraz)

---

*Built with ❤️ and atmospheric precision.*
