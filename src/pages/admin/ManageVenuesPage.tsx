import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Edit2, MapPin, Plus, Save, Trash2, X } from 'lucide-react'
import {
  countSlotsByVenue,
  createVenue,
  deleteVenue,
  fetchSports,
  fetchVenues,
  toUserError,
  updateVenue,
} from '../../services/admin'
import type { Sport, Venue } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Modal } from '../../components/ui/Modal'

export default function ManageVenuesPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [venueName, setVenueName] = useState('')
  const [venueLocation, setVenueLocation] = useState('')
  const [venueSportId, setVenueSportId] = useState('')
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [deletingVenue, setDeletingVenue] = useState<Venue | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sportsData, venuesData] = await Promise.all([fetchSports(), fetchVenues()])
        setSports(sportsData)
        setVenues(venuesData)
        if (sportsData.length > 0 && !venueSportId) {
          setVenueSportId(sportsData[0].id)
        }
      } catch (loadError) {
        setError(toUserError(loadError, 'Failed to load data.'))
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [venueSportId])

  const resetForm = () => {
    setEditingVenueId(null)
    setVenueName('')
    setVenueLocation('')
  }

  const handleVenueSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setError(null)

    if (!venueName.trim() || !venueLocation.trim() || !venueSportId) {
      setError('Venue name, location, and sport are required.')
      return
    }

    setSubmitting(true)
    try {
      if (editingVenueId) {
        const updated = await updateVenue(editingVenueId, {
          sport_id: venueSportId,
          name: venueName,
          location: venueLocation,
        })
        setVenues((prev) => prev.map((item) => (item.id === editingVenueId ? updated : item)))
        toast.success('Venue updated successfully')
      } else {
        const created = await createVenue({
          sport_id: venueSportId,
          name: venueName,
          location: venueLocation,
        })
        setVenues((prev) => [created, ...prev])
        toast.success('Venue added successfully')
      }

      resetForm()
    } catch (venueError) {
      setError(toUserError(venueError, 'Unable to save venue.'))
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditVenue = (venue: Venue) => {
    setError(null)
    setEditingVenueId(venue.id)
    setVenueName(venue.name)
    setVenueLocation(venue.location)
    setVenueSportId(venue.sport_id)
  }

  const handleDeleteVenue = async () => {
    if (!deletingVenue) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const linkedSlots = await countSlotsByVenue(deletingVenue.id)
      if (linkedSlots > 0) {
        setError('Cannot delete this venue because slots are linked to it. Delete related slots first.')
        setDeleting(false)
        return
      }

      await deleteVenue(deletingVenue.id)
      setVenues((prev) => prev.filter((item) => item.id !== deletingVenue.id))
      setDeletingVenue(null)
      toast.success('Venue deleted successfully')
    } catch (venueError) {
      setError(toUserError(venueError, 'Unable to delete venue.'))
      toast.error('Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner centered label="Loading venues..." />
  }

  return (
    <section className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Manage Venues</h2>
        <p className="mt-1 text-sm text-slate-600">Map every sport to organized, discoverable campus locations.</p>
      </header>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Card>
        <CardHeader
          title={editingVenueId ? 'Edit Venue' : 'Add New Venue'}
          subtitle="Keep venue details clean for accurate slot bookings."
        />

        <form onSubmit={handleVenueSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Sport</label>
              <select
                value={venueSportId}
                onChange={(event) => setVenueSportId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500"
              >
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Venue Name</label>
              <input
                type="text"
                value={venueName}
                onChange={(event) => setVenueName(event.target.value)}
                placeholder="e.g., Main Field"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Location</label>
              <input
                type="text"
                value={venueLocation}
                onChange={(event) => setVenueLocation(event.target.value)}
                placeholder="e.g., Near Hostel A"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" loading={submitting}>
              {editingVenueId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingVenueId ? 'Update Venue' : 'Add Venue'}
            </Button>
            {editingVenueId ? (
              <Button type="button" variant="secondary" onClick={resetForm}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {venues.length === 0 ? (
        <EmptyState
          icon={<MapPin className="h-5 w-5" />}
          title="No venues available"
          description="Add your first venue to begin slot creation."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => (
            <Card key={venue.id} hoverable>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {venue.sports?.name ?? 'Unknown Sport'}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">{venue.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{venue.location}</p>
                </div>
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>

              <div className="mt-4 flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => startEditVenue(venue)}>
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={() => setDeletingVenue(venue)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(deletingVenue)}
        title="Delete venue"
        description={`Are you sure you want to delete "${deletingVenue?.name ?? ''}"?`}
        onClose={() => setDeletingVenue(null)}
        onConfirm={() => void handleDeleteVenue()}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </section>
  )
}
