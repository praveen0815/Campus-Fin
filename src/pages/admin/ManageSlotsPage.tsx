import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { createSlot, deleteSlot, fetchBookings, fetchSlots, fetchVenues, toUserError } from '../../services/admin'
import type { Slot, SlotSession, Venue } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/StatusBadge'

const SESSION_WINDOWS: Record<SlotSession, { label: string; start: string; end: string }> = {
  morning: { label: 'Morning (6 AM - 11 AM)', start: '06:00:00', end: '11:00:00' },
  evening: { label: 'Evening (4 PM - 11 PM)', start: '16:00:00', end: '23:00:00' },
}

export default function ManageSlotsPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [slotVenueId, setSlotVenueId] = useState('')
  const [slotSession, setSlotSession] = useState<SlotSession>('morning')
  const [submitting, setSubmitting] = useState(false)

  const [deletingSlot, setDeletingSlot] = useState<Slot | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [venuesData, slotsData, bookingsData] = await Promise.all([fetchVenues(), fetchSlots(), fetchBookings()])
        setVenues(venuesData)
        setSlots(slotsData)
        setBookedSlotIds(
          new Set(
            bookingsData
              .filter((booking) => booking.status !== 'cancelled')
              .map((booking) => booking.slot_id),
          ),
        )

        if (venuesData.length > 0 && !slotVenueId) {
          setSlotVenueId(venuesData[0].id)
        }
      } catch (loadError) {
        setError(toUserError(loadError, 'Failed to load data.'))
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [slotVenueId])

  const handleAddSlot: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setError(null)

    if (!slotVenueId) {
      setError('Please select a venue.')
      return
    }

    setSubmitting(true)
    try {
      const window = SESSION_WINDOWS[slotSession]
      const created = await createSlot({
        venue_id: slotVenueId,
        session: slotSession,
        start_time: window.start,
        end_time: window.end,
      })

      setSlots((prev) => [created, ...prev])
      toast.success('Slot created successfully')
    } catch (slotError) {
      setError(toUserError(slotError, 'Unable to create slot.'))
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSlot = async () => {
    if (!deletingSlot) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      await deleteSlot(deletingSlot.id)
      setSlots((prev) => prev.filter((slot) => slot.id !== deletingSlot.id))
      setBookedSlotIds((prev) => {
        const next = new Set(prev)
        next.delete(deletingSlot.id)
        return next
      })
      setDeletingSlot(null)
      toast.success('Slot deleted successfully')
    } catch (slotError) {
      setError(toUserError(slotError, 'Unable to delete slot.'))
      toast.error('Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  const sortedSlots = useMemo(
    () => [...slots].sort((a, b) => `${a.start_time}`.localeCompare(`${b.start_time}`)),
    [slots],
  )

  if (loading) {
    return <LoadingSpinner centered label="Loading slots..." />
  }

  return (
    <section className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Manage Slots</h2>
        <p className="mt-1 text-sm text-slate-600">Create session-based slots with clear availability status.</p>
      </header>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Card>
        <CardHeader title="Create New Slot" subtitle="Choose a venue and session window." />
        <form onSubmit={handleAddSlot} className="grid gap-4 md:grid-cols-3 md:items-end">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Venue</label>
            <select
              value={slotVenueId}
              onChange={(event) => setSlotVenueId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500"
            >
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} - {venue.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Session</label>
            <select
              value={slotSession}
              onChange={(event) => setSlotSession(event.target.value as SlotSession)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(SESSION_WINDOWS).map(([sessionKey, sessionValue]) => (
                <option key={sessionKey} value={sessionKey}>
                  {sessionValue.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="submit" loading={submitting}>
            <Plus className="h-4 w-4" />
            Create Slot
          </Button>
        </form>
      </Card>

      {sortedSlots.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-5 w-5" />}
          title="No slots available"
          description="Create your first slot to enable booking."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Venue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Sport</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Session</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedSlots.map((slot) => {
                  const status = bookedSlotIds.has(slot.id) ? 'booked' : 'available'
                  return (
                    <tr key={slot.id} className="transition-all hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-900">{slot.venues?.name ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{slot.venues?.sports?.name ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-sm capitalize text-slate-700">{slot.session}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {slot.start_time} - {slot.end_time}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={status} />
                      </td>
                      <td className="px-4 py-3">
                        <Button type="button" variant="danger" size="sm" onClick={() => setDeletingSlot(slot)}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={Boolean(deletingSlot)}
        title="Delete slot"
        description="This action cannot be undone."
        onClose={() => setDeletingSlot(null)}
        onConfirm={() => void handleDeleteSlot()}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </section>
  )
}
