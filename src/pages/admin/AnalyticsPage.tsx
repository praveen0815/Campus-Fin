import { useEffect, useState } from 'react'
import { fetchSports, fetchVenues, fetchSlots, fetchBookings, toUserError } from '../../services/admin'
import type { Sport, Venue, Slot, Booking } from '../../types/admin'
import { TrendingUp, Users, Activity, Target } from 'lucide-react'

export default function AnalyticsPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sportsData, venuesData, slotsData, bookingsData] = await Promise.all([
          fetchSports(),
          fetchVenues(),
          fetchSlots(),
          fetchBookings(),
        ])
        setSports(sportsData)
        setVenues(venuesData)
        setSlots(slotsData)
        setBookings(bookingsData)
      } catch (loadError) {
        setError(toUserError(loadError, 'Failed to load analytics.'))
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-slate-600">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-red-500">
        {error}
      </div>
    )
  }

  // Calculate analytics
  const totalBookings = bookings.length
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length
  const bookingRate = totalBookings > 0 ? ((confirmedBookings / totalBookings) * 100).toFixed(1) : 0

  // Slots by status
  const availableSlots = slots.length - bookings.length
  const bookedSlots = bookings.filter((b) => b.status === 'confirmed').length
  const pendingSlots = bookings.filter((b) => b.status === 'pending').length

  // Sports popularity
  const sportsBookingCount = sports.map((sport) => {
    const count = bookings.filter((b) => b.slot?.venues?.sports?.id === sport.id).length
    return { ...sport, count }
  }).sort((a, b) => b.count - a.count)

  // Venue popularity
  const venueBookingCount = venues.map((venue) => {
    const count = bookings.filter((b) => b.slot?.venues?.id === venue.id).length
    return { ...venue, count }
  }).sort((a, b) => b.count - a.count)

  const analyticsCards = [
    {
      label: 'Booking Rate',
      value: `${bookingRate}%`,
      icon: <TrendingUp className="h-6 w-6" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Confirmed Bookings',
      value: confirmedBookings,
      icon: <Users className="h-6 w-6" />,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      label: 'Available Slots',
      value: availableSlots,
      icon: <Activity className="h-6 w-6" />,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
    {
      label: 'Active Sports',
      value: sports.length,
      icon: <Target className="h-6 w-6" />,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold text-slate-900 lg:text-4xl">Analytics</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">Insights and statistics about your sports booking system</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {analyticsCards.map((card, index) => (
          <div
            key={index}
            className={`rounded-2xl ${card.bgColor} border border-slate-200 p-6 shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium ${card.textColor}`}>{card.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
              </div>
              <div className={`${card.textColor}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slot Status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-xl font-semibold text-slate-900">Slot Status Overview</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-700">Booked Slots</p>
            <p className="mt-2 text-2xl font-bold text-emerald-900">{bookedSlots}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-700">Pending</p>
            <p className="mt-2 text-2xl font-bold text-amber-900">{pendingSlots}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Available</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{availableSlots}</p>
          </div>
        </div>
      </div>

      {/* Top Sports */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h3 className="text-xl font-semibold text-slate-900">Top Sports by Bookings</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {sportsBookingCount.length === 0 ? (
            <div className="px-6 py-8 text-center text-base text-slate-500">No booking data yet.</div>
          ) : (
            sportsBookingCount.map((sport) => (
              <div key={sport.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                <span className="text-base font-medium text-slate-900">{sport.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 min-w-96 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-cyan-500"
                      style={{
                        width: `${
                          sportsBookingCount.length > 0
                            ? (sport.count / Math.max(...sportsBookingCount.map((s) => s.count), 1)) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="w-12 text-right text-base font-semibold text-slate-900">{sport.count}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Venues */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h3 className="text-xl font-semibold text-slate-900">Top Venues by Bookings</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {venueBookingCount.length === 0 ? (
            <div className="px-6 py-8 text-center text-base text-slate-500">No venue data yet.</div>
          ) : (
            venueBookingCount.map((venue) => (
              <div key={venue.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                <div>
                  <p className="text-base font-medium text-slate-900">{venue.name}</p>
                  <p className="text-sm text-slate-500">{venue.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 min-w-96 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{
                        width: `${
                          venueBookingCount.length > 0
                            ? (venue.count / Math.max(...venueBookingCount.map((v) => v.count), 1)) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="w-12 text-right text-base font-semibold text-slate-900">{venue.count}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
