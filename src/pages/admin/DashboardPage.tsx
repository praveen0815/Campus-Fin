import { useEffect, useState } from 'react'
import { BookOpen, Clock, MapPin, Volleyball } from 'lucide-react'
import { fetchStats, toUserError } from '../../services/admin'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

interface Stats {
  totalSports: number
  totalVenues: number
  totalSlots: number
  totalBookings: number
}

const CARD_STYLES = [
  { bg: 'bg-blue-50', icon: 'text-blue-600' },
  { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
  { bg: 'bg-slate-100', icon: 'text-slate-700' },
  { bg: 'bg-rose-50', icon: 'text-rose-600' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchStats()
        setStats(data)
      } catch (loadError) {
        setError(toUserError(loadError, 'Failed to load statistics.'))
      } finally {
        setLoading(false)
      }
    }

    void loadStats()
  }, [])

  if (loading) {
    return <LoadingSpinner centered label="Loading dashboard..." />
  }

  if (error) {
    return <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-red-500">{error}</div>
  }

  const statCards = [
    {
      label: 'Total Sports',
      value: stats?.totalSports ?? 0,
      icon: <Volleyball className="h-6 w-6" />,
    },
    {
      label: 'Total Venues',
      value: stats?.totalVenues ?? 0,
      icon: <MapPin className="h-6 w-6" />,
    },
    {
      label: 'Total Slots',
      value: stats?.totalSlots ?? 0,
      icon: <Clock className="h-6 w-6" />,
    },
    {
      label: 'Total Bookings',
      value: stats?.totalBookings ?? 0,
      icon: <BookOpen className="h-6 w-6" />,
    },
  ]

  return (
    <section className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Dashboard Overview</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">Campus Sports management metrics at a glance.</p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={card.label} hoverable className="p-0">
            <div className={`rounded-t-2xl px-6 py-4 ${CARD_STYLES[index].bg}`}>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            </div>
            <div className="flex items-center justify-between px-6 py-6">
              <p className="text-3xl font-bold text-slate-900">{card.value}</p>
              <div className={`rounded-xl p-3 ${CARD_STYLES[index].bg} ${CARD_STYLES[index].icon}`}>{card.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <h3 className="text-xl font-semibold text-slate-900">Quick Actions</h3>
          <ul className="mt-5 space-y-3 text-base leading-relaxed text-slate-700">
            <li className="rounded-xl bg-blue-50 px-4 py-3">1. Add sports offered across your campus.</li>
            <li className="rounded-xl bg-blue-50 px-4 py-3">2. Map venues to each sport and location.</li>
            <li className="rounded-xl bg-blue-50 px-4 py-3">3. Create slots and track bookings in real time.</li>
          </ul>
        </Card>

        <Card>
          <h3 className="text-xl font-semibold text-slate-900">System Health</h3>
          <div className="mt-5 space-y-3">
            {['Database', 'Authentication', 'API'].map((service) => (
              <div key={service} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-base text-slate-700">{service}</span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Healthy
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  )
}
