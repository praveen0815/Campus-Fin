import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Ban, CalendarClock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { cancelBooking, fetchStudentBookings, formatSlotTime, toUserError } from '../../services/student'
import type { StudentBooking } from '../../types/student'
import { supabase } from '../../services/supabase'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/StatusBadge'

function formatBookingDate(value?: string | null) {
  if (!value) {
    return '--'
  }

  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getBookingDateValue(booking: StudentBooking) {
  return booking.slots?.date ?? booking.slots?.slot_date ?? null
}

export default function MyBookingsPage() {
  const { profile } = useAuth()
  const [bookings, setBookings] = useState<StudentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [bookingToCancel, setBookingToCancel] = useState<StudentBooking | null>(null)

  useEffect(() => {
    if (!profile?.id || !profile.email) {
      return
    }

    const load = async () => {
      try {
        setError(null)
        const next = await fetchStudentBookings({ userId: profile.id, userEmail: profile.email })
        setBookings(next)
      } catch (loadError) {
        setError(toUserError(loadError, 'Unable to load your bookings.'))
      } finally {
        setLoading(false)
      }
    }

    void load()

    const channel = supabase
      .channel(`student-bookings-${profile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, () => void load())
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [profile?.email, profile?.id])

  const handleCancel = async () => {
    if (!bookingToCancel || bookingToCancel.status === 'cancelled') {
      return
    }

    setCancellingId(bookingToCancel.id)
    setError(null)

    try {
      const updated = await cancelBooking({ bookingId: bookingToCancel.id, slotId: bookingToCancel.slot_id })
      setBookings((prev) => prev.map((item) => (item.id === bookingToCancel.id ? updated : item)))
      toast.success('Booking cancelled successfully')
      setBookingToCancel(null)
    } catch (cancelError) {
      setError(toUserError(cancelError, 'Unable to cancel booking.'))
      toast.error('Something went wrong')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) {
    return <LoadingSpinner centered label="Loading your bookings..." />
  }

  const sortedBookings = [...bookings].sort((a, b) => {
    const aDate = getBookingDateValue(a) ?? ''
    const bDate = getBookingDateValue(b) ?? ''

    if (aDate !== bDate) {
      return bDate.localeCompare(aDate)
    }

    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 lg:text-4xl">My Bookings</h1>
        <p className="mt-1 text-base leading-relaxed text-slate-500">Track all booked slots and cancel when plans change.</p>
      </header>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-red-500">{error}</div> : null}

      {bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-5 w-5" />}
          title="📭 No bookings yet"
          description="Book a slot to see your upcoming sessions here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {sortedBookings.map((booking) => (
            <Card key={booking.id} hoverable className="space-y-2 rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {(booking.slots?.venues?.sports?.name ?? '--') + ' - ' + (booking.slots?.venues?.name ?? '--')}
                  </p>
                </div>
                <StatusBadge status={booking.status} />
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-base text-slate-700">
                <p>
                  <span className="font-semibold">📅 Date:</span> {formatBookingDate(getBookingDateValue(booking))}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">⏰ Time:</span> {booking.slots ? formatSlotTime(booking.slots) : '--'}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">🏟 Venue:</span> {booking.slots?.venues?.name ?? '--'}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">🏅 Sport:</span> {booking.slots?.venues?.sports?.name ?? '--'}
                </p>
              </div>

              <div className="mt-4">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={booking.status === 'cancelled'}
                  onClick={() => setBookingToCancel(booking)}
                >
                  <Ban className="h-4 w-4" />
                  Cancel Booking
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(bookingToCancel)}
        title="Cancel this booking?"
        description="This action will release the slot for other students."
        onClose={() => setBookingToCancel(null)}
        onConfirm={() => void handleCancel()}
        confirmLabel="Cancel Booking"
        confirmVariant="danger"
        loading={Boolean(bookingToCancel && cancellingId === bookingToCancel.id)}
      />
    </section>
  )
}

