import './LoadingSkeleton.css';

const LoadingSkeleton = () => {
  return (
    <div className="app-container">
      {/* Header skeleton */}
      <div className="skeleton-header skeleton-pulse"></div>

      {/* View toggle skeleton */}
      <div className="skeleton-toggle-wrap">
        <div className="skeleton-toggle skeleton-pulse"></div>
      </div>

      {/* Main 2-column layout matching the real dashboard */}
      <div className="skeleton-main">
        <div className="skeleton-left">
          <div className="skeleton-current skeleton-pulse"></div>
          <div className="skeleton-daily skeleton-pulse"></div>
        </div>
        <div className="skeleton-right">
          <div className="skeleton-section-title skeleton-pulse"></div>
          <div className="skeleton-highlights">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card skeleton-pulse"></div>
            ))}
          </div>
          <div className="skeleton-section-title skeleton-pulse"></div>
          <div className="skeleton-hourly skeleton-pulse"></div>
          <div className="skeleton-section-title skeleton-pulse"></div>
          <div className="skeleton-chart skeleton-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
