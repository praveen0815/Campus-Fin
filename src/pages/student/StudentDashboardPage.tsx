import { useEffect, useState } from 'react'
import { BookCopy, CalendarDays, Trophy, UserCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { fetchDashboardData, formatSlotTime, toUserError } from '../../services/student'
import type { StudentDashboardData } from '../../types/student'
import { supabase } from '../../services/supabase'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { StatusBadge } from '../../components/ui/StatusBadge'

function isoDateToday() {
  return new Date().toISOString().split('T')[0]
}

export default function StudentDashboardPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<StudentDashboardData | null>(null)

  useEffect(() => {
    if (!profile?.id || !profile.email) {
      return
    }

    const load = async () => {
      setError(null)
      try {
        const next = await fetchDashboardData({
          userId: profile.id,
          userEmail: profile.email,
          today: isoDateToday(),
        })
        setData(next)
      } catch (loadError) {
        setError(toUserError(loadError, 'Unable to load student dashboard.'))
      } finally {
        setLoading(false)
      }
    }

    void load()

    const channel = supabase
      .channel(`student-dashboard-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sports' }, () => void load())
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [profile?.email, profile?.id])

  if (loading) {
    return <LoadingSpinner centered label="Loading dashboard..." />
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, {profile?.email?.split('@')[0] ?? 'Student'}</h1>
        <p className="mt-1 text-base leading-relaxed text-slate-500">Book your favorite sports slots and track activity instantly.</p>
      </header>

      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">Student Portal</p>
        <h2 className="mt-2 text-2xl font-semibold">Manage bookings and stay on top of available slots.</h2>
        <p className="mt-2 text-base leading-relaxed text-blue-100">Use quick actions below to book, review, and manage your schedule.</p>
      </Card>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-red-500">{error}</div> : null}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <Card hoverable>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Available Sports</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{data?.totalSports ?? 0}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card hoverable>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Available Slots Today</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{data?.availableSlotsToday ?? 0}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
              <CalendarDays className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card hoverable>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">My Bookings</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{data?.recentBookings.length ?? 0}</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
              <BookCopy className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <UserCircle2 className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">Recent Bookings</h2>
        </div>

        {(data?.recentBookings.length ?? 0) === 0 ? (
          <div className="rounded-xl bg-slate-50 p-6 text-base text-slate-500">No bookings yet. Book a slot to see your activity here.</div>
        ) : (
          <div className="space-y-4">
            {data?.recentBookings.map((booking) => (
              <article key={booking.id} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 transition-colors duration-300">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {booking.slots?.venues?.sports?.name ?? 'Sport'} at {booking.slots?.venues?.name ?? 'Venue'}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-500">
                      {booking.slots?.slot_date ?? 'Date not set'} â€¢ {booking.slots ? formatSlotTime(booking.slots) : '--'}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </section>
  )
}

