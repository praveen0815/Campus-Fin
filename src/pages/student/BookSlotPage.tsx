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
      toast.error('Something went wrong')
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
      if (message.toLowerCase().includes('already booked')) {
        toast('Slot already booked')
      } else {
        toast.error('Something went wrong')
      }
    } finally {
      setBookingSlotId(null)
    }
  }

  if (loading) {
    return <LoadingSpinner centered label="Loading booking options..." />
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Book Slot</h1>
        <p className="mt-1 text-sm text-slate-600">Follow the 4-step flow to reserve your preferred slot.</p>
      </header>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Card>
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <Trophy className="h-4 w-4 text-blue-600" />
          Step 1: Choose Sport
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              <p className="font-semibold">{sport.name}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                <p className="font-semibold text-slate-900">{venue.name}</p>
                <p className="text-sm text-slate-600">{venue.location}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          Step 3: Select Date
        </p>
        <input
          type="date"
          value={selectedDate}
          min={formatMinDate()}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="w-full max-w-sm rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500"
        />
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-slate-900">Step 4: Select Slot and Book</p>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {selectedSport?.name ?? 'Sport'} • {selectedDate}
          </p>
        </div>

        {slotLoading ? (
          <LoadingSpinner centered label="Loading slots..." />
        ) : slots.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title="No slots available"
            description="No slots available"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {slots.map((slot) => {
              const unavailable = slot.status !== 'available'
              return (
                <article
                  key={slot.id}
                  className={`rounded-xl border p-4 transition-all ${
                    unavailable
                      ? 'border-slate-200 bg-slate-50 opacity-85'
                      : 'border-blue-200 bg-blue-50/40 hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">{formatSlotTime(slot)}</p>
                    <StatusBadge status={slot.status} />
                  </div>

                  <p className="mb-4 text-xs text-slate-600">
                    {slot.venues?.name} • {slot.venues?.location}
                  </p>

                  <Button
                    type="button"
                    fullWidth
                    loading={bookingSlotId === slot.id}
                    disabled={unavailable || bookingSlotId === slot.id}
                    onClick={() => void handleBook(slot)}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {unavailable ? 'Unavailable' : 'Book Slot'}
                  </Button>
                </article>
              )
            })}
          </div>
        )}
      </Card>
    </section>
  )
}
