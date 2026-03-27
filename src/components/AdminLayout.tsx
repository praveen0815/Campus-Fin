import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  Volleyball,
  MapPin,
  Clock,
  BookOpen,
  LineChart,
  LogOut,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Manage Sports', path: '/admin/sports', icon: <Volleyball className="h-5 w-5" /> },
  { label: 'Manage Venues', path: '/admin/venues', icon: <MapPin className="h-5 w-5" /> },
  { label: 'Slot Management', path: '/admin/slots', icon: <Clock className="h-5 w-5" /> },
  { label: 'Bookings', path: '/admin/bookings', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <LineChart className="h-5 w-5" /> },
]

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-200 bg-white shadow-sm">
        {/* Logo */}
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-md">
              <Volleyball className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">SlotSphere</p>
              <p className="text-xs text-slate-600">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 px-4 py-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`w-full rounded-lg px-4 py-3 text-sm font-medium transition flex items-center gap-3 ${
                  isActive
                      ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-semibold">
              {profile?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-900 truncate">{profile?.email}</p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1">
        {/* Top Bar */}
        <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.email?.split('@')[0]}!</h1>
              <p className="mt-1 text-sm text-slate-600">Manage campus sports, venues, and bookings</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
