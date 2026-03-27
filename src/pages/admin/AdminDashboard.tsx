import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  countSlotsByVenue,
  createSlot,
  createSport,
  createVenue,
  deleteSlot,
  deleteSport,
  deleteVenue,
  fetchSlots,
  fetchSports,
  fetchVenues,
  toUserError,
  updateVenue,
} from '../../services/admin'
import type { Slot, SlotSession, Sport, Venue } from '../../types/admin'

type AdminTab = 'sports' | 'venues' | 'slots'

const SESSION_WINDOWS: Record<SlotSession, { label: string; start: string; end: string }> = {
  morning: { label: 'Morning (6-11)', start: '06:00:00', end: '11:00:00' },
  evening: { label: 'Evening (4-11)', start: '16:00:00', end: '23:00:00' },
}

export default function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTab>('venues')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [sports, setSports] = useState<Sport[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [slots, setSlots] = useState<Slot[]>([])

  const [sportName, setSportName] = useState('')
  const [sportSubmitting, setSportSubmitting] = useState(false)

  const [venueName, setVenueName] = useState('')
  const [venueLocation, setVenueLocation] = useState('')
  const [venueSportId, setVenueSportId] = useState('')
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null)
  const [venueSubmitting, setVenueSubmitting] = useState(false)

  const [slotVenueId, setSlotVenueId] = useState('')
  const [slotSession, setSlotSession] = useState<SlotSession>('morning')
  const [slotSubmitting, setSlotSubmitting] = useState(false)

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [sportsData, venuesData, slotsData] = await Promise.all([
          fetchSports(),
          fetchVenues(),
          fetchSlots(),
        ])
        setSports(sportsData)
        setVenues(venuesData)
        setSlots(slotsData)
      } catch (loadError) {
        setError(toUserError(loadError, 'Unable to load admin data.'))
      } finally {
        setLoading(false)
      }
    }

    void loadAll()
  }, [])

  useEffect(() => {
    if (!venueSportId && sports.length > 0) {
      setVenueSportId(sports[0].id)
    }
  }, [sports, venueSportId])

  useEffect(() => {
    if (!slotVenueId && venues.length > 0) {
      setSlotVenueId(venues[0].id)
    }
  }, [slotVenueId, venues])

  const sortedSports = useMemo(() => [...sports].sort((a, b) => a.name.localeCompare(b.name)), [sports])

  const resetMessages = () => {
    setError(null)
    setSuccess(null)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  const handleAddSport: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    resetMessages()

    const normalized = sportName.trim()
    if (!normalized) {
      setError('Sport name is required.')
      return
    }

    const exists = sports.some((sport) => sport.name.toLowerCase() === normalized.toLowerCase())
    if (exists) {
      setError('Sport already exists. Duplicates are not allowed.')
      return
    }

    setSportSubmitting(true)
    try {
      const nextSport = await createSport(normalized)
      setSports((prev) => [...prev, nextSport])
      setSportName('')
      setSuccess('Sport added successfully.')
    } catch (createError) {
      setError(toUserError(createError, 'Unable to add sport.'))
    } finally {
      setSportSubmitting(false)
    }
  }

  const handleDeleteSport = async (sport: Sport) => {
    resetMessages()
    const hasVenues = venues.some((venue) => venue.sport_id === sport.id)
    if (hasVenues) {
      setError('Cannot delete this sport because venues are linked to it. Remove or reassign venues first.')
      return
    }

    try {
      await deleteSport(sport.id)
      setSports((prev) => prev.filter((item) => item.id !== sport.id))
      setSuccess('Sport deleted successfully.')
    } catch (deleteError) {
      setError(toUserError(deleteError, 'Unable to delete sport.'))
    }
  }

  const handleVenueSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    resetMessages()

    if (!venueName.trim() || !venueLocation.trim() || !venueSportId) {
      setError('Venue name, location, and sport are required.')
      return
    }

    setVenueSubmitting(true)
    try {
      if (editingVenueId) {
        const updated = await updateVenue(editingVenueId, {
          sport_id: venueSportId,
          name: venueName,
          location: venueLocation,
        })
        setVenues((prev) => prev.map((item) => (item.id === editingVenueId ? updated : item)))
        setSuccess('Venue updated successfully.')
      } else {
        const created = await createVenue({
          sport_id: venueSportId,
          name: venueName,
          location: venueLocation,
        })
        setVenues((prev) => [...prev, created])
        setSuccess('Venue added successfully.')
      }

      setVenueName('')
      setVenueLocation('')
      setEditingVenueId(null)
    } catch (venueError) {
      setError(toUserError(venueError, 'Unable to save venue.'))
    } finally {
      setVenueSubmitting(false)
    }
  }

  const startEditVenue = (venue: Venue) => {
    resetMessages()
    setEditingVenueId(venue.id)
    setVenueName(venue.name)
    setVenueLocation(venue.location)
    setVenueSportId(venue.sport_id)
    setActiveTab('venues')
  }

  const cancelEditVenue = () => {
    setEditingVenueId(null)
    setVenueName('')
    setVenueLocation('')
    setVenueSportId(sports[0]?.id ?? '')
  }

  const handleDeleteVenue = async (venue: Venue) => {
    resetMessages()
    try {
      const linkedSlots = await countSlotsByVenue(venue.id)
      if (linkedSlots > 0) {
        setError('Cannot delete this venue because slots are linked to it. Delete related slots first.')
        return
      }

      await deleteVenue(venue.id)
      setVenues((prev) => prev.filter((item) => item.id !== venue.id))
      setSuccess('Venue deleted successfully.')
    } catch (venueError) {
      setError(toUserError(venueError, 'Unable to delete venue.'))
    }
  }

  const handleAddSlot: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    resetMessages()

    if (!slotVenueId) {
      setError('Please select a venue.')
      return
    }

    setSlotSubmitting(true)
    try {
      const window = SESSION_WINDOWS[slotSession]
      const created = await createSlot({
        venue_id: slotVenueId,
        session: slotSession,
        start_time: window.start,
        end_time: window.end,
      })

      setSlots((prev) => [created, ...prev])
      setSuccess('Slot added successfully.')
    } catch (slotError) {
      setError(toUserError(slotError, 'Unable to create slot.'))
    } finally {
      setSlotSubmitting(false)
    }
  }

  const handleDeleteSlot = async (slotId: string) => {
    resetMessages()
    try {
      await deleteSlot(slotId)
      setSlots((prev) => prev.filter((slot) => slot.id !== slotId))
      setSuccess('Slot deleted successfully.')
    } catch (slotError) {
      setError(toUserError(slotError, 'Unable to delete slot.'))
    }
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-700">Loading admin panel...</div>
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-white/60 bg-white/90 p-5 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)] backdrop-blur sm:p-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium tracking-wide text-cyan-700">SlotSphere Admin</p>
            <h1 className="text-3xl font-semibold text-slate-900">Campus Sports Management</h1>
            <p className="mt-1 text-sm text-slate-600">
              Signed in as <span className="font-medium">{profile?.email}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="h-fit rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Sign out
          </button>
        </header>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setActiveTab('sports')}
            className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
              activeTab === 'sports' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Manage Sports
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('venues')}
            className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
              activeTab === 'venues' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Manage Venues
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('slots')}
            className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
              activeTab === 'slots' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Manage Slots
          </button>
        </div>

        {error ? <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}

        {activeTab === 'sports' ? (
          <section className="space-y-6">
            <form onSubmit={handleAddSport} className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="text"
                value={sportName}
                onChange={(event) => setSportName(event.target.value)}
                placeholder="Add a sport name"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              />
              <button
                type="submit"
                disabled={sportSubmitting}
                className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-400"
              >
                {sportSubmitting ? 'Saving...' : 'Add Sport'}
              </button>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Sport Name</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {sortedSports.map((sport) => (
                    <tr key={sport.id}>
                      <td className="px-4 py-3">{sport.name}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void handleDeleteSport(sport)}
                          className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === 'venues' ? (
          <section className="space-y-6">
            <form onSubmit={handleVenueSubmit} className="grid gap-3 sm:grid-cols-2">
              <select
                value={venueSportId}
                onChange={(event) => setVenueSportId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              >
                {sortedSports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={venueName}
                onChange={(event) => setVenueName(event.target.value)}
                placeholder="Venue name"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              />
              <input
                type="text"
                value={venueLocation}
                onChange={(event) => setVenueLocation(event.target.value)}
                placeholder="Location"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 sm:col-span-2"
              />

              <div className="flex gap-2 sm:col-span-2">
                <button
                  type="submit"
                  disabled={venueSubmitting}
                  className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-400"
                >
                  {venueSubmitting ? 'Saving...' : editingVenueId ? 'Update Venue' : 'Add Venue'}
                </button>
                {editingVenueId ? (
                  <button
                    type="button"
                    onClick={cancelEditVenue}
                    className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Sport</th>
                    <th className="px-4 py-3 font-medium">Venue</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {venues.map((venue) => (
                    <tr key={venue.id}>
                      <td className="px-4 py-3">{venue.sports?.name ?? 'Unknown'}</td>
                      <td className="px-4 py-3">{venue.name}</td>
                      <td className="px-4 py-3">{venue.location}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditVenue(venue)}
                            className="rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-200"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteVenue(venue)}
                            className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === 'slots' ? (
          <section className="space-y-6">
            <form onSubmit={handleAddSlot} className="grid gap-3 sm:grid-cols-3">
              <select
                value={slotVenueId}
                onChange={(event) => setSlotVenueId(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              >
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.location}
                  </option>
                ))}
              </select>

              <select
                value={slotSession}
                onChange={(event) => setSlotSession(event.target.value as SlotSession)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              >
                {Object.entries(SESSION_WINDOWS).map(([sessionKey, sessionValue]) => (
                  <option key={sessionKey} value={sessionKey}>
                    {sessionValue.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={slotSubmitting}
                className="rounded-xl bg-cyan-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-cyan-400"
              >
                {slotSubmitting ? 'Saving...' : 'Add Slot'}
              </button>
            </form>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Sport</th>
                    <th className="px-4 py-3 font-medium">Venue</th>
                    <th className="px-4 py-3 font-medium">Session</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                  {slots.map((slot) => (
                    <tr key={slot.id}>
                      <td className="px-4 py-3">{slot.venues?.sports?.name ?? 'Unknown'}</td>
                      <td className="px-4 py-3">
                        {slot.venues?.name ?? 'Unknown'} - {slot.venues?.location ?? 'Unknown'}
                      </td>
                      <td className="px-4 py-3 capitalize">{slot.session}</td>
                      <td className="px-4 py-3">
                        {slot.start_time} - {slot.end_time}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void handleDeleteSlot(slot.id)}
                          className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
