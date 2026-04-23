import React from 'react';
import { WifiOff } from 'lucide-react';
import './NetworkBanner.css';

interface NetworkBannerProps {
  isOnline: boolean;
}

const NetworkBanner: React.FC<NetworkBannerProps> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="network-banner offline">
      <div className="banner-content">
        <WifiOff size={16} />
        <span>Disconnected from atmosphere. Showing cached intelligence.</span>
      </div>
    </div>
  );
};

export default NetworkBanner;
