import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarClock,
  BookCopy,
  UserCircle2,
  LogOut,
  Trophy,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface StudentLayoutProps {
  children: ReactNode
}

const menuItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Book Slot', path: '/student/book', icon: CalendarClock },
  { label: 'My Bookings', path: '/student/bookings', icon: BookCopy },
  { label: 'Profile', path: '/student/profile', icon: UserCircle2 },
]

export default function StudentLayout({ children }: StudentLayoutProps) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 border-r border-slate-200 bg-white lg:block">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-2.5 text-white shadow-sm">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">SlotSphere</p>
                <p className="text-sm font-medium text-slate-900">Student Portal</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1.5 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:scale-[1.01]'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto p-4">
            <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="truncate text-sm font-medium text-slate-900">{profile?.email}</p>
              <p className="text-xs text-slate-500">Student</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="px-4 py-4 sm:px-6 lg:px-8">
              <div className="mb-3 flex items-center justify-between lg:mb-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">Welcome back</p>
                  <p className="text-xs text-slate-600">Book and manage your campus sports slots</p>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto lg:hidden">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const active = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
