import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, RefreshCw } from 'lucide-react'
import { fetchBookings, toUserError, updateBookingStatus } from '../../services/admin'
import type { Booking, BookingStatus } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/StatusBadge'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null)

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const data = await fetchBookings()
        setBookings(data)
      } catch (loadError) {
        setError(toUserError(loadError, 'Failed to load bookings.'))
      } finally {
        setLoading(false)
      }
    }

    void loadBookings()
  }, [])

  const handleStatusChange = async (booking: Booking, newStatus: BookingStatus) => {
    if (booking.status === newStatus) {
      return
    }

    setError(null)
    setUpdatingId(booking.id)

    try {
      const updated = await updateBookingStatus(booking.id, newStatus)
      setBookings((prev) => prev.map((item) => (item.id === booking.id ? updated : item)))
      toast.success('Booking updated successfully')
    } catch (updateError) {
      setError(toUserError(updateError, 'Unable to update booking status.'))
      toast.error('Something went wrong')
    } finally {
      setUpdatingId(null)
      setCancelBooking(null)
    }
  }

  if (loading) {
    return <LoadingSpinner centered label="Loading bookings..." />
  }

  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length
  const pendingCount = bookings.filter((b) => b.status === 'pending').length
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length

  return (
    <section className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Bookings</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 sm:text-base">Monitor and control every student booking in one place.</p>
      </header>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-red-500">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Confirmed</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700">{confirmedCount}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{pendingCount}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cancelled</p>
          <p className="mt-2 text-3xl font-bold text-slate-700">{cancelledCount}</p>
        </Card>
      </div>

      {bookings.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-5 w-5" />}
          title="No bookings yet"
          description="Bookings will appear here once students reserve slots."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Student</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Sport</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Venue</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="transition-all hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-base font-medium text-slate-900">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {booking.student_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-base text-slate-700">{booking.slot?.venues?.sports?.name ?? 'Unknown'}</td>
                    <td className="px-4 py-3 text-base text-slate-700">{booking.slot?.venues?.name ?? 'Unknown'}</td>
                    <td className="px-4 py-3 text-base text-slate-700">
                      {booking.slot?.start_time} - {booking.slot?.end_time}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {booking.status !== 'confirmed' ? (
                          <Button
                            type="button"
                            variant="success"
                            size="sm"
                            loading={updatingId === booking.id}
                            onClick={() => void handleStatusChange(booking, 'confirmed')}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Confirm
                          </Button>
                        ) : null}
                        {booking.status !== 'cancelled' ? (
                          <Button type="button" variant="danger" size="sm" onClick={() => setCancelBooking(booking)}>
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={Boolean(cancelBooking)}
        title="Cancel booking"
        description="Do you want to mark this booking as cancelled?"
        onClose={() => setCancelBooking(null)}
        onConfirm={() => (cancelBooking ? void handleStatusChange(cancelBooking, 'cancelled') : undefined)}
        confirmLabel="Cancel Booking"
        confirmVariant="danger"
        loading={Boolean(cancelBooking && updatingId === cancelBooking.id)}
      />
    </section>
  )
}
