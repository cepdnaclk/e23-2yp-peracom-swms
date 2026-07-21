import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import AnnouncementDropdown from './AnnouncementDropdown';
import { useState } from 'react';

function Navbar({ notifications = [], announcements = [] }) {
  const navigate = useNavigate();
  const donor = JSON.parse(localStorage.getItem('donor') || '{}');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('donor');
    navigate('/login');
  };

  return (
    <header className="navbar card">
      <div className="navbar-left">
        <div className="logo-badge">P</div>
        <div>
          <h2>PeraCom Welfare System</h2>
          <p className="muted">Donor Portal</p>
        </div>
      </div>

      <div className="navbar-right">
        <AnnouncementDropdown
          announcements={announcements}
          open={showAnnouncements}
          onToggle={() => {
            setShowAnnouncements((prev) => !prev);
            setShowNotifications(false);
          }}
        />
        <NotificationDropdown
          notifications={notifications}
          open={showNotifications}
          onToggle={() => {
            setShowNotifications((prev) => !prev);
            setShowAnnouncements(false);
          }}
        />
        <div className="profile-pill">
          <span>{donor.organization_name || 'Donor'}</span>
          <button className="btn btn-danger btn-small" onClick={logout}>Logout</button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
