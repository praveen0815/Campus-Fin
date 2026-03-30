import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { CalendarDays, Clock, Trash2 } from 'lucide-react'
import {
  createIndividualSlot,
  deleteSlot,
  fetchBookings,
  fetchSlots,
  fetchVenues,
  getAllSlotWindows,
  toUserError,
} from '../../services/admin'
import type { Slot, Venue } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Modal } from '../../components/ui/Modal'
import { StatusBadge } from '../../components/ui/StatusBadge'

// Get all hourly slots for dropdown
function getAllHourlySlots() {
  return getAllSlotWindows()
}

function isoDateToday() {
  return new Date().toISOString().split('T')[0]
}

function toTimeLabel(value: string) {
  const [hourPart, minutePart] = value.split(':')
  const hour = Number(hourPart)
  const meridiem = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${minutePart} ${meridiem}`
}

export default function ManageSlotsPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [bookedSlotIds, setBookedSlotIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [slotVenueId, setSlotVenueId] = useState('')
  const [slotDate, setSlotDate] = useState(isoDateToday())
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0) // Index of hourly slot from getAllSlotWindows()
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

  const handleCreateSessionSlots: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setError(null)

    if (!slotVenueId) {
      setError('Please select a venue.')
      return
    }

    if (!slotDate) {
      setError('Please select a date.')
      return
    }

    setSubmitting(true)
    try {
      const allSlots = getAllHourlySlots()
      const selectedSlot = allSlots[selectedSlotIndex]

      if (!selectedSlot) {
        setError('Invalid slot selection.')
        return
      }

      const created = await createIndividualSlot({
        venue_id: slotVenueId,
        slot_date: slotDate,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
      })

      setSlots((prev) => [created, ...prev])
      toast.success('Slot created successfully')
    } catch (slotError) {
      const message = toUserError(slotError, 'Unable to create slot.')
      setError(message)
      if (message.toLowerCase().includes('already exists')) {
        toast.error('This slot already exists')
      } else {
        toast.error('Something went wrong')
      }
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
    () =>
      [...slots].sort((a, b) => {
        const dateA = a.slot_date ?? ''
        const dateB = b.slot_date ?? ''
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB)
        }
        return `${a.start_time}`.localeCompare(`${b.start_time}`)
      }),
    [slots],
  )

  const sessionTemplateSlots = useMemo(() => {
    const allSlots = getAllHourlySlots()
    return [allSlots[selectedSlotIndex]].filter(Boolean)
  }, [selectedSlotIndex])

  const sessionScopedSlots = useMemo(() => {
    return sortedSlots.filter((slot) => {
      if (!slotDate) {
        return true
      }

      return slot.slot_date === slotDate
    })
  }, [slotDate, sortedSlots])

  if (loading) {
    return <LoadingSpinner centered label="Loading slots..." />
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">Manage Slots</h2>
        <p className="mt-2 text-base leading-relaxed text-slate-500">Generate 1-hour slots by session using dynamic time windows.</p>
      </header>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-red-500">{error}</div> : null}

      <Card>
        <CardHeader title="Session Slot Generator" subtitle="Select venue, date, and session to create slots in bulk." />

        <form onSubmit={handleCreateSessionSlots} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 md:items-end">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Venue</label>
              <select
                value={slotVenueId}
                onChange={(event) => setSlotVenueId(event.target.value)}
                className="h-12 w-full rounded-lg border border-slate-300 px-4 text-base text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500"
              >
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Date</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={slotDate}
                  onChange={(event) => setSlotDate(event.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 pl-10 pr-4 text-base text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Hour Slot</label>
              <select
                value={selectedSlotIndex}
                onChange={(event) => setSelectedSlotIndex(Number(event.target.value))}
                className="h-12 w-full rounded-lg border border-slate-300 px-4 text-base text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500"
              >
                {getAllHourlySlots().map((slot, index) => (
                  <option key={`${slot.start}-${slot.end}`} value={index}>
                    {toTimeLabel(slot.start)} – {toTimeLabel(slot.end)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4">
              <h3 className="text-lg font-bold text-slate-900">
                ⏰ Selected Hour Slot Ready to Create
              </h3>
              <p className="mt-1 text-sm text-slate-600">1 hourly slot for {slotDate || 'selected date'}. Click the button to create it.</p>
            </div>

            <div className="grid gap-3">
              {sessionTemplateSlots.map((slot) => (
                <article
                  key={`${slot.start}-${slot.end}`}
                  className="flex items-center justify-between rounded-xl border-2 border-blue-200 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-blue-400"
                >
                  <div className="flex-1">
                    <p className="text-base font-bold text-slate-900">
                      {toTimeLabel(slot.start)} – {toTimeLabel(slot.end)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-blue-600 uppercase tracking-wide">
                      ⏱ Duration: 1 Hour
                    </p>
                  </div>
                  <StatusBadge status="available" />
                </article>
              ))}
            </div>
          </div>

          <Button type="submit" loading={submitting} size="lg">
            Create Selected Slot
          </Button>
        </form>
      </Card>

      {sessionScopedSlots.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-5 w-5" />}
          title="No slots available"
          description="Create slots by selecting an hour and clicking 'Create Selected Slot'."
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-base font-semibold text-slate-900">
              Created Slots ({slotDate})
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Venue</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Sport</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Session</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Time Range</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Duration</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sessionScopedSlots.map((slot) => {
                  const status = bookedSlotIds.has(slot.id) ? 'booked' : 'available'
                  return (
                    <tr key={slot.id} className="transition-all hover:bg-slate-50">
                      <td className="px-4 py-3 text-base font-semibold text-slate-900">{slot.venues?.name ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-base text-slate-700">{slot.venues?.sports?.name ?? 'Unknown'}</td>
                      <td className="px-4 py-3 text-base text-slate-700">{slot.slot_date ?? '--'}</td>
                      <td className="px-4 py-3 text-base capitalize font-medium text-blue-600">{slot.session}</td>
                      <td className="px-4 py-3 text-base font-medium text-slate-900">
                        {toTimeLabel(slot.start_time)} – {toTimeLabel(slot.end_time)}
                      </td>
                      <td className="px-4 py-3 text-base">
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                          1 Hour
                        </span>
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
