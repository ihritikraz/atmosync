import './Footer.css';

const Footer = () => {
  const handleDiagnosticToggle = (e: React.MouseEvent) => {
    if (e.detail === 3) {
      const isForced = localStorage.getItem('atmosync_force_offline') === 'true';
      console.log('DIAGNOSTIC: Toggling force_offline to', !isForced);
      localStorage.setItem('atmosync_force_offline', isForced ? 'false' : 'true');
      window.location.reload();
    }
  };

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="footer-logo" onClick={handleDiagnosticToggle} style={{ cursor: 'pointer' }}>AtmoSync</span>
          <span className="footer-tagline">Atmospheric Intelligence</span>
        </div>
        
        <div className="footer-signatures">
          <p>© 2026 AtmoSync — Intelligence for the Atmosphere.</p>
        </div>
        
        <div className="footer-status">
          <div className="status-dot"></div>
          <span>Systems Operational</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
