import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/scholarships', label: 'Scholarships' },
  { to: '/approved-students', label: 'Approved Students' },
  { to: '/progress-updates', label: 'Progress Updates' },
  { to: '/report-issue', label: 'Issues' },
];

function Sidebar() {
  return (
    <aside className="sidebar card">
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
