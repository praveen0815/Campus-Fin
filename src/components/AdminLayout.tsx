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
import { NotificationBell } from './ui/NotificationBell'

interface NavItem {
  label: string
  path: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="h-6 w-6" /> },
  { label: 'Manage Sports', path: '/admin/sports', icon: <Volleyball className="h-6 w-6" /> },
  { label: 'Manage Venues', path: '/admin/venues', icon: <MapPin className="h-6 w-6" /> },
  { label: 'Slot Management', path: '/admin/slots', icon: <Clock className="h-6 w-6" /> },
  { label: 'Bookings', path: '/admin/bookings', icon: <BookOpen className="h-6 w-6" /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <LineChart className="h-6 w-6" /> },
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
    <div className="flex min-h-screen bg-slate-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 border-r border-slate-200 bg-white shadow-sm transition-colors duration-300">
        {/* Logo */}
        <div className="border-b border-slate-200 p-6">
          <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 shadow-md">
              <Volleyball className="h-6 w-6 text-white" />
            </div>
            <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">SlotSphere</p>
              <p className="text-base font-medium text-slate-900">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-4 px-5 py-6">
          <h2 className="mb-6 px-1 text-xl font-semibold tracking-wide text-slate-900">Admin Panel</h2>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-4 rounded-xl px-5 py-4 text-lg font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-gray-100 hover:scale-[1.02]'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4 transition-colors duration-300">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-slate-50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white text-base font-semibold">
              {profile?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{profile?.email}</p>
              <p className="text-sm text-slate-500">Admin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-base font-medium text-rose-700 transition hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 flex-1">
        {/* Top Bar */}
        <header className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-40 transition-colors duration-300">
          <div className="flex items-center justify-between px-8 py-5">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Welcome back, {profile?.email?.split('@')[0]}!</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">Manage campus sports, venues, and bookings</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell userId={profile?.id} />
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-3 text-base font-medium text-rose-700 transition hover:bg-rose-100"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  )
}

