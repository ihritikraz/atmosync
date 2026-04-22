const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { packDailyYear } = require('./packer');

/**
 * AtmoSync Cloud Seeder
 * Bulk downloads weather data in 1,000-location batches and saves to binary chunks.
 */

const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const OUTPUT_DIR = path.resolve(__dirname, '../public/vault/v1');

// Priority Regions
const REGIONS = [
  { name: 'India', lat: [8, 38], lon: [68, 98] },
  { name: 'Europe', lat: [35, 70], lon: [-10, 42] },
  { name: 'NorthAmerica', lat: [15, 60], lon: [-130, -60] }
];

/**
 * Generate a grid of coordinates at 0.1 degree resolution
 */
function* generateGrid(region) {
  for (let lat = region.lat[0]; lat <= region.lat[1]; lat += 0.1) {
    for (let lon = region.lon[0]; lon <= region.lon[1]; lon += 0.1) {
      yield { lat: parseFloat(lat.toFixed(1)), lon: parseFloat(lon.toFixed(1)) };
    }
  }
}

/**
 * Fetch and pack data for a batch of coordinates
 */
async function seedBatch(coords, year) {
  const lats = coords.map(c => c.lat).join(',');
  const lons = coords.map(c => c.lon).join(',');
  
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  const dailyParams = 'temperature_2m_max,temperature_2m_min,precipitation_sum,relative_humidity_2m_mean,relative_humidity_2m_max,relative_humidity_2m_min,wind_speed_10m_max,apparent_temperature_max,uv_index_max';
  
  console.log(`Fetching ${coords.length} coordinates for year ${year}...`);
  
  try {
    const res = await fetch(`${ARCHIVE_URL}?latitude=${lats}&longitude=${lons}&start_date=${startDate}&end_date=${endDate}&daily=${dailyParams}&timezone=auto`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    
    const data = await res.json();
    
    // If multiple locations, data is an array of objects
    const results = Array.isArray(data) ? data : [data];
    
    results.forEach((locationData, idx) => {
      const coord = coords[idx];
      const latInt = Math.floor(coord.lat);
      const lonInt = Math.floor(coord.lon);
      
      const dir = path.join(OUTPUT_DIR, `${latInt}`);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      const file = path.join(dir, `${lonInt}_${year}.bin`);
      
      // Transform to minimal DailyRecord format for packer
      const records = locationData.daily.time.map((t, i) => ({
        tempMax: locationData.daily.temperature_2m_max[i],
        tempMin: locationData.daily.temperature_2m_min[i],
        precipitation: locationData.daily.precipitation_sum[i],
        humidity: locationData.daily.relative_humidity_2m_mean[i],
        humidityMax: locationData.daily.relative_humidity_2m_max[i],
        humidityMin: locationData.daily.relative_humidity_2m_min[i],
        windSpeed: locationData.daily.wind_speed_10m_max[i],
        feelsLike: locationData.daily.apparent_temperature_max[i],
        uv: locationData.daily.uv_index_max[i],
      }));
      
      const buffer = packDailyYear(records);
      
      // Simplified: Just appending for now. 
      // REAL VERSION: We create a packed binary index.
      fs.appendFileSync(file, buffer);
    });
    
  } catch (err) {
    console.error('Batch failed:', err.message);
  }
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // Example: Run for first 100 points of India for one year
  const grid = generateGrid(REGIONS[0]);
  let batch = [];
  let count = 0;
  
  for (const coord of grid) {
    batch.push(coord);
    if (batch.length === 50) { // Keep batches reasonable for result size
      await seedBatch(batch, 2023);
      batch = [];
      count += 50;
      if (count >= 100) break; // LIMIT FOR TESTING
    }
  }
  
  console.log('Seeding process finished.');
}

run();
