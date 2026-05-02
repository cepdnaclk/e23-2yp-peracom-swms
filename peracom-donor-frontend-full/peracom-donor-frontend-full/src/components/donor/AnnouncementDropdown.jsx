function AnnouncementDropdown({ announcements = [], open, onToggle }) {
  return (
    <div className="dropdown-wrap">
      <button className="icon-btn" onClick={onToggle} type="button">
        📢
      </button>
      {open && (
        <div className="dropdown-panel card">
          <h4>Announcements</h4>
          {announcements.length === 0 ? (
            <p className="muted">No announcements yet.</p>
          ) : (
            announcements.map((item, index) => (
              <div key={item.id || index} className="dropdown-item">
                <strong>{item.title || 'Announcement'}</strong>
                <p>{item.message || item.description || ''}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AnnouncementDropdown;
