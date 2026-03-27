import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, Trophy } from 'lucide-react'
import { createSport, deleteSport, fetchSports, toUserError } from '../../services/admin'
import type { Sport } from '../../types/admin'
import { Button } from '../../components/ui/Button'
import { Card, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Modal } from '../../components/ui/Modal'

export default function ManageSportsPage() {
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sportName, setSportName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deletingSport, setDeletingSport] = useState<Sport | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const loadSports = async () => {
      try {
        const data = await fetchSports()
        setSports(data)
      } catch (loadError) {
        setError(toUserError(loadError, 'Failed to load sports.'))
      } finally {
        setLoading(false)
      }
    }

    void loadSports()
  }, [])

  const sortedSports = useMemo(() => [...sports].sort((a, b) => a.name.localeCompare(b.name)), [sports])

  const handleAddSport: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setError(null)

    const normalized = sportName.trim()
    if (!normalized) {
      setError('Sport name is required.')
      return
    }

    const exists = sports.some((sport) => sport.name.toLowerCase() === normalized.toLowerCase())
    if (exists) {
      toast.error('Something went wrong')
      setError('Sport already exists. Duplicates are not allowed.')
      return
    }

    setSubmitting(true)
    try {
      const nextSport = await createSport(normalized)
      setSports((prev) => [...prev, nextSport])
      setSportName('')
      toast.success('Sport added successfully')
    } catch (createError) {
      const nextError = toUserError(createError, 'Unable to add sport.')
      setError(nextError)
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSport = async () => {
    if (!deletingSport) {
      return
    }

    setDeleting(true)
    setError(null)
    try {
      await deleteSport(deletingSport.id)
      setSports((prev) => prev.filter((item) => item.id !== deletingSport.id))
      toast.success('Sport deleted successfully')
      setDeletingSport(null)
    } catch (deleteError) {
      const nextError = toUserError(deleteError, 'Unable to delete sport.')
      setError(nextError)
      toast.error('Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner centered label="Loading sports..." />
  }

  return (
    <section className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Manage Sports</h2>
        <p className="mt-1 text-sm text-slate-600">Create and manage all sports available on campus.</p>
      </header>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Card>
        <CardHeader title="Add New Sport" subtitle="Use clear names to keep student booking simple." />
        <form onSubmit={handleAddSport} className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="sport-name" className="mb-2 block text-sm font-semibold text-slate-700">
              Sport Name
            </label>
            <input
              id="sport-name"
              type="text"
              value={sportName}
              onChange={(event) => setSportName(event.target.value)}
              placeholder="e.g., Football"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="sm:pt-8">
            <Button type="submit" loading={submitting} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Sport
            </Button>
          </div>
        </form>
      </Card>

      {sortedSports.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-5 w-5" />}
          title="No sports available"
          description="Create your first sport to start configuring venues and slots."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedSports.map((sport) => (
            <Card key={sport.id} hoverable className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-slate-900">{sport.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Added {sport.created_at ? new Date(sport.created_at).toLocaleDateString() : 'recently'}
                </p>
              </div>
              <Button type="button" variant="danger" size="sm" onClick={() => setDeletingSport(sport)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(deletingSport)}
        title="Delete sport"
        description={`Are you sure you want to delete "${deletingSport?.name ?? ''}"?`}
        onClose={() => setDeletingSport(null)}
        onConfirm={() => void handleDeleteSport()}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </section>
  )
}
