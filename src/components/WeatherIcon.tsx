import {
  Sun, Moon, Cloud, CloudSun, CloudRain, CloudDrizzle,
  CloudLightning, CloudFog, CloudHail,
  CloudRainWind, CloudSunRain, Snowflake, CloudMoon,
} from 'lucide-react';

interface WeatherIconProps {
  icon: string;
  size?: number;
  className?: string;
}

const WeatherIcon = ({ icon, size = 24, className = '' }: WeatherIconProps) => {
  const props = { size, className };

  switch (icon) {
    case 'sun': return <Sun {...props} />;
    case 'moon': return <Moon {...props} />;
    case 'cloud': return <Cloud {...props} />;
    case 'cloud-sun': return <CloudSun {...props} />;
    case 'cloud-moon': return <CloudMoon {...props} />;
    case 'cloud-rain': return <CloudRain {...props} />;
    case 'cloud-drizzle': return <CloudDrizzle {...props} />;
    case 'cloud-lightning': return <CloudLightning {...props} />;
    case 'cloud-fog': return <CloudFog {...props} />;
    case 'cloud-hail': return <CloudHail {...props} />;
    case 'cloud-rain-wind': return <CloudRainWind {...props} />;
    case 'cloud-sun-rain': return <CloudSunRain {...props} />;
    case 'snowflake': return <Snowflake {...props} />;
    default: return <Cloud {...props} />;
  }
};

export default WeatherIcon;
