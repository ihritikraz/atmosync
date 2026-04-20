import './LoadingSkeleton.css';

const LoadingSkeleton = () => {
  return (
    <div className="app-container">
      <div className="skeleton-header skeleton-pulse"></div>
      <div className="skeleton-main">
        <div className="skeleton-left">
          <div className="skeleton-current skeleton-pulse"></div>
          <div className="skeleton-daily skeleton-pulse"></div>
        </div>
        <div className="skeleton-right">
          <div className="skeleton-highlights">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-card skeleton-pulse"></div>
            ))}
          </div>
          <div className="skeleton-hourly skeleton-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
