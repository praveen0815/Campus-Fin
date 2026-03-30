import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CalendarDays, CheckCircle2, MapPin, Trophy } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  createBooking,
  fetchSlots,
  fetchSports,
  fetchVenuesBySport,
  formatSlotTime,
  toUserError,
} from '../../services/student'
import { safeCreateNotification } from '../../services/notifications'
import type { StudentSlot, StudentSport, StudentVenue } from '../../types/student'
import { supabase } from '../../services/supabase'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { StatusBadge } from '../../components/ui/StatusBadge'

function formatMinDate() {
  return new Date().toISOString().split('T')[0]
}

export default function BookSlotPage() {
  const { profile } = useAuth()
  const [sports, setSports] = useState<StudentSport[]>([])
  const [venues, setVenues] = useState<StudentVenue[]>([])
  const [slots, setSlots] = useState<StudentSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [slotLoading, setSlotLoading] = useState(false)
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [selectedSportId, setSelectedSportId] = useState('')
  const [selectedVenueId, setSelectedVenueId] = useState('')
  const [selectedDate, setSelectedDate] = useState(formatMinDate())

  useEffect(() => {
    const loadSports = async () => {
      try {
        const nextSports = await fetchSports()
        setSports(nextSports)
        if (nextSports.length > 0) {
          setSelectedSportId(nextSports[0].id)
        }
      } catch (loadError) {
        setError(toUserError(loadError, 'Unable to load sports.'))
      } finally {
        setLoading(false)
      }
    }

    void loadSports()
  }, [])

  useEffect(() => {
    if (!selectedSportId) {
      setVenues([])
      setSelectedVenueId('')
      return
    }

    const loadVenues = async () => {
      setError(null)
      try {
        const nextVenues = await fetchVenuesBySport(selectedSportId)
        setVenues(nextVenues)
        setSelectedVenueId(nextVenues[0]?.id ?? '')
      } catch (loadError) {
        setError(toUserError(loadError, 'Unable to load venues for selected sport.'))
      }
    }

    void loadVenues()
  }, [selectedSportId])

  useEffect(() => {
    if (!selectedVenueId || !selectedDate) {
      setSlots([])
      return
    }

    const loadSlots = async () => {
      setSlotLoading(true)
      setError(null)
      try {
        const nextSlots = await fetchSlots({ venueId: selectedVenueId, date: selectedDate })
        setSlots(nextSlots)
      } catch (loadError) {
        setError(toUserError(loadError, 'Unable to load slots.'))
      } finally {
        setSlotLoading(false)
      }
    }

    void loadSlots()

    const channel = supabase
      .channel(`student-book-${selectedVenueId}-${selectedDate}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, () => void loadSlots())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => void loadSlots())
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [selectedVenueId, selectedDate])

  const selectedSport = useMemo(
    () => sports.find((item) => item.id === selectedSportId) ?? null,
    [selectedSportId, sports],
  )

  const handleBook = async (slot: StudentSlot) => {
    if (!profile?.id || !profile.email) {
      setError('You must be signed in to book a slot.')
      toast.error('You must be signed in to continue')
      return
    }

    if (slot.status !== 'available') {
      toast('Slot already booked')
      return
    }

    setBookingSlotId(slot.id)
    setError(null)

    try {
      await createBooking({ userId: profile.id, userEmail: profile.email, slotId: slot.id })
      toast.success('Slot booked successfully')
      const refreshed = await fetchSlots({ venueId: selectedVenueId, date: selectedDate })
      setSlots(refreshed)
    } catch (bookError) {
      const message = toUserError(bookError, 'Unable to complete booking.')
      setError(message)
      await safeCreateNotification({
        user_id: profile.id,
        message: message.toLowerCase().includes('already booked')
          ? 'Booking failed. The slot is already booked'
          : 'Booking failed. Please try again',
        type: 'error',
      })

      if (message.toLowerCase().includes('already booked')) {
        toast('Slot already booked')
      } else {
        toast.error(message)
      }
    } finally {
      setBookingSlotId(null)
    }
  }

  if (loading) {
    return <LoadingSpinner centered label="Loading booking options..." />
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 lg:text-4xl">Book Slot</h1>
        <p className="mt-1 text-base leading-relaxed text-slate-500">Follow the 4-step flow to reserve your preferred slot.</p>
      </header>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-red-500">{error}</div> : null}

      <Card>
        <p className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Trophy className="h-4 w-4 text-blue-600" />
          Step 1: Choose Sport
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sports.map((sport) => (
            <button
              key={sport.id}
              type="button"
              onClick={() => setSelectedSportId(sport.id)}
              className={`rounded-xl border px-4 py-3 text-left transition-all hover:scale-105 hover:shadow-lg ${
                selectedSportId === sport.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200'
              }`}
            >
              <p className="text-base font-semibold sm:text-lg">{sport.name}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <p className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900">
          <MapPin className="h-4 w-4 text-blue-600" />
          Step 2: Choose Venue
        </p>
        {venues.length === 0 ? (
          <EmptyState
            icon={<MapPin className="h-5 w-5" />}
            title="No venues available"
            description="Please select a sport with active venues."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {venues.map((venue) => (
              <button
                key={venue.id}
                type="button"
                onClick={() => setSelectedVenueId(venue.id)}
                className={`rounded-xl border px-4 py-3 text-left transition-all hover:scale-105 hover:shadow-lg ${
                  selectedVenueId === venue.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-200'
                }`}
              >
                <p className="text-base font-semibold text-slate-900 sm:text-lg">{venue.name}</p>
                <p className="text-sm leading-relaxed text-slate-500 sm:text-base">{venue.location}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <p className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          Step 3: Select Date
        </p>
        <input
          type="date"
          value={selectedDate}
          min={formatMinDate()}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="w-full max-w-sm rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500"
        />
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xl font-semibold text-slate-900">Step 4: Select Slot and Book</p>
          <p className="text-base font-semibold uppercase tracking-wide text-slate-500">
            {selectedSport?.name ?? 'Sport'} • {selectedDate}
          </p>
        </div>

        {slotLoading ? (
          <LoadingSpinner centered label="Loading slots..." />
        ) : slots.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="No slots available"
            description="No slots available for the selected date and venue."
          />
        ) : (
          <div className="space-y-6">
            {/* Group slots by session */}
            {(['morning', 'evening'] as const).map((session) => {
              const sessionSlots = slots.filter((slot) => slot.session === session)
              if (sessionSlots.length === 0) return null

              const sessionLabel = session === 'morning' ? '🌅 Morning (6 AM - 11 AM)' : '🌆 Evening (4 PM - 11 PM)'

              return (
                <div key={session} className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900">{sessionLabel}</h3>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {sessionSlots.map((slot) => {
                      const unavailable = slot.status !== 'available'
                      return (
                        <article
                          key={slot.id}
                          className={`rounded-xl border-2 p-4 transition-all ${
                            unavailable
                              ? 'border-slate-200 bg-slate-50 opacity-60'
                              : 'cursor-pointer border-blue-300 bg-gradient-to-br from-blue-50 to-blue-50/50 hover:border-blue-500 hover:shadow-md'
                          }`}
                          onClick={() => {
                            if (!unavailable) void handleBook(slot)
                          }}
                        >
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <div>
                              <p className="text-base font-bold text-slate-900">{formatSlotTime(slot)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                1 Hr
                              </span>
                              <StatusBadge status={slot.status} />
                            </div>
                          </div>

                          <div className="mb-4 space-y-1">
                            <p className="text-sm font-medium text-slate-700">{slot.venues?.name}</p>
                            <p className="text-xs text-slate-500">{slot.venues?.location}</p>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            fullWidth
                            loading={bookingSlotId === slot.id}
                            disabled={unavailable || bookingSlotId === slot.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleBook(slot)
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {unavailable ? 'Not Available' : 'Book Now'}
                          </Button>
                        </article>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </section>
  )
}
