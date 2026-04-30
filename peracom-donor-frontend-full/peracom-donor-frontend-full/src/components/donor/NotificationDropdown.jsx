function NotificationDropdown({ notifications = [], open, onToggle }) {
  return (
    <div className="dropdown-wrap">
      <button className="icon-btn" onClick={onToggle} type="button">
        🔔
      </button>
      {open && (
        <div className="dropdown-panel card">
          <h4>Notifications</h4>
          {notifications.length === 0 ? (
            <p className="muted">No notifications yet.</p>
          ) : (
            notifications.map((item) => (
              <div key={item.id} className="dropdown-item">
                <strong>{item.title}</strong>
                <p>{item.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
