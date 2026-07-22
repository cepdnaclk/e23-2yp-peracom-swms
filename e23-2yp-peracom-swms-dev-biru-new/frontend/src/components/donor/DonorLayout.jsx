import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, BookOpen, Users, Megaphone,
  User, Bell, LogOut, Menu, X, CreditCard, MessageSquare
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { UPLogo } from '../common/UPLogo'
import { Footer } from '../common/Footer'

const navLinks = [
  { to: '/donor/dashboard',     label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/donor/scholarships',  label: 'Scholarships', icon: BookOpen },
  { to: '/donor/students',      label: 'Students',    icon: Users },
  { to: '/donor/payments',      label: 'Payments',    icon: CreditCard },
  { to: '/donor/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/donor/issues',        label: 'Issues', icon: MessageSquare},
  { to: '/donor/profile',       label: 'Profile',     icon: User },
]

export default function DonorLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          <div className="flex items-center gap-3 flex-shrink-0">
            <UPLogo size="sm" />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-purple-700 leading-tight">University of Peradeniya</p>
              <p className="text-xs text-slate-400 leading-tight">Donor Portal</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 flex-1">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-50 text-purple-700' : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50'}`
                }>{label}</NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button className="p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors">
              <Bell size={18} />
            </button>
            <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'D'}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[120px] truncate">{user?.name}</span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg py-1 min-w-[140px] z-50">
                  <button onClick={() => { logout(); navigate('/login') }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
            <button className="lg:hidden p-2 rounded-lg text-slate-500" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-purple-50 text-purple-700' : 'text-slate-600'}`
                }><Icon size={16} />{label}</NavLink>
            ))}
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}