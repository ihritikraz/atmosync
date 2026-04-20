export const currentWeatherData = {
  city: "San Francisco",
  country: "USA",
  temperature: 18,
  description: "Partly Cloudy",
  icon: "cloud-sun",
  date: "Monday, 19 Apr 2026",
  time: "10:30 AM",
};

export const highlightsData = {
  uvIndex: { value: 5, status: "Moderate" },
  wind: { speed: 12, direction: "NW", status: "Breezy" },
  sunriseSunset: { sunrise: "6:24 AM", sunset: "7:45 PM" },
  humidity: { value: 65, status: "Normal" },
  visibility: { value: 10, status: "Good" },
  airQuality: { value: 42, status: "Good" },
};

export const hourlyForecast = [
  { time: "11:00 AM", temp: 19, icon: "cloud-sun" },
  { time: "12:00 PM", temp: 21, icon: "sun" },
  { time: "1:00 PM", temp: 22, icon: "sun" },
  { time: "2:00 PM", temp: 23, icon: "sun" },
  { time: "3:00 PM", temp: 23, icon: "cloud" },
  { time: "4:00 PM", temp: 21, icon: "cloud-rain" },
  { time: "5:00 PM", temp: 19, icon: "cloud-rain" },
  { time: "6:00 PM", temp: 17, icon: "cloud" },
  { time: "7:00 PM", temp: 15, icon: "moon" },
];

export const dailyForecast = [
  { day: "Today", minTemp: 14, maxTemp: 23, icon: "cloud-sun" },
  { day: "Tue", minTemp: 13, maxTemp: 21, icon: "sun" },
  { day: "Wed", minTemp: 12, maxTemp: 19, icon: "cloud-rain" },
  { day: "Thu", minTemp: 11, maxTemp: 20, icon: "cloud" },
  { day: "Fri", minTemp: 15, maxTemp: 24, icon: "sun" },
  { day: "Sat", minTemp: 16, maxTemp: 26, icon: "sun" },
  { day: "Sun", minTemp: 14, maxTemp: 22, icon: "cloud-sun" },
];
