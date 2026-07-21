import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, GraduationCap, FileText, Users, Heart,
  AlertCircle, Megaphone, UserCheck, Bell, ChevronDown,
  LogOut, Menu, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { UPLogo } from '../common/UPLogo'
import { Footer } from '../common/Footer'

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/scholarships', label: 'Scholarships', icon: GraduationCap },
  { to: '/applications', label: 'Applications', icon: FileText },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/donors', label: 'Donors', icon: Heart },
  { to: '/issues', label: 'Issues', icon: AlertCircle },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <UPLogo size="sm" />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-purple-700 leading-tight">University of Peradeniya</p>
              <p className="text-xs text-slate-400 leading-tight">Faculty of Engineering · Department of Computer Engineering</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1 flex-1">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50'}`
                }
              >{label}</NavLink>
            ))}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2 ml-auto">
            <NavLink to="/announcements" className="p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors">
              <Megaphone size={18} />
            </NavLink>
            <NavLink to="/user-approval" className="p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors">
              <UserCheck size={18} />
            </NavLink>
            <button className="p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors">
              <Bell size={18} />
            </button>

            {/* User dropdown */}
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name || 'Admin'}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg py-1 min-w-[140px] z-50">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="lg:hidden p-2 rounded-lg text-slate-500" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-50 text-purple-700' : 'text-slate-600'}`
                }
              ><Icon size={16} />{label}</NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
