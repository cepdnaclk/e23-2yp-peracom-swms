// src/components/common/AdminLayout.jsx
// Wraps all admin pages with the shared Navbar and Footer

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, GraduationCap, FileText, Users,
  AlertCircle, Megaphone, Bell, ChevronDown, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { to: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/scholarships',  label: 'Scholarships',  icon: GraduationCap },
  { to: '/applications',  label: 'Applications',  icon: FileText },
  { to: '/donors',        label: 'Donors',        icon: Users },
  { to: '/issues',        label: 'Issues',        icon: AlertCircle },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center h-16 gap-6">

          {/* Logo + Name */}
          <div className="flex items-center gap-3 min-w-max">
            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
              UP
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-purple-700 leading-none">University of Peradeniya</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Student Welfare Management</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right side icons */}
          <div className="ml-auto flex items-center gap-2">
            <NavLink to="/announcements" title="Announcements"
              className="p-2 rounded-lg text-slate-500 hover:bg-purple-50 hover:text-purple-600 transition-colors">
              <Megaphone size={18} />
            </NavLink>
            <button className="p-2 rounded-lg text-slate-500 hover:bg-purple-50 hover:text-purple-600 transition-colors">
              <Bell size={18} />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">A</div>
              <span className="hidden sm:inline">Admin</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-3 flex flex-col gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={15} /> {label}
              </NavLink>
            ))}
            <NavLink to="/announcements" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              <Megaphone size={15} /> Announcements
            </NavLink>
          </div>
        )}
      </header>

      {/* ── Page Content ───────────────────────────────────── */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>Department of Computer Engineering · University of Peradeniya</span>
          <span>welfare@pdn.ac.lk · © {new Date().getFullYear()} All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}
