/**
 * AtmoSync Binary Packer
 * Converts bulky JSON weather data into high-density binary buffers.
 */

// Daily Metrics: tempMax, tempMin, precipitation, humidity, humidityMax, humidityMin, windSpeed, feelsLike, uv
// We use Int16 (2 bytes) for each to store with 0.1 precision (e.g. 25.4 becomes 254)
const METRIC_COUNT = 9;
const BYTES_PER_METRIC = 2;
const DAYS_PER_YEAR = 366; // Max days in a leap year

/**
 * Packs a single coordinate's daily data for a year into a Buffer
 */
function packDailyYear(records) {
  const buf = Buffer.alloc(DAYS_PER_YEAR * METRIC_COUNT * BYTES_PER_METRIC);
  
  records.forEach((r, i) => {
    if (i >= DAYS_PER_YEAR) return;
    
    const offset = i * METRIC_COUNT * BYTES_PER_METRIC;
    
    // Scale by 10 and pack as Int16
    buf.writeInt16LE(Math.round((r.tempMax ?? 0) * 10), offset + 0);
    buf.writeInt16LE(Math.round((r.tempMin ?? 0) * 10), offset + 2);
    buf.writeInt16LE(Math.round((r.precipitation ?? 0) * 10), offset + 4);
    buf.writeInt16LE(Math.round((r.humidity ?? 0) * 10), offset + 6);
    buf.writeInt16LE(Math.round((r.humidityMax ?? 0) * 10), offset + 8);
    buf.writeInt16LE(Math.round((r.humidityMin ?? 0) * 10), offset + 10);
    buf.writeInt16LE(Math.round((r.windSpeed ?? 0) * 10), offset + 12);
    buf.writeInt16LE(Math.round((r.feelsLike ?? 0) * 10), offset + 14);
    buf.writeInt16LE(Math.round((r.uv ?? 0) * 10), offset + 16);
  });
  
  return buf;
}

module.exports = {
  packDailyYear
};
