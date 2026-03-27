import { useEffect, useState } from 'react'
import { Mail, Shield, UserCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { fetchProfileDetails, toUserError } from '../../services/student'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export default function StudentProfilePage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) {
      return
    }

    const load = async () => {
      try {
        setError(null)
        const dbProfile = await fetchProfileDetails(profile.id)
        setCreatedAt(dbProfile?.created_at ?? null)
      } catch (loadError) {
        setError(toUserError(loadError, 'Unable to load profile details.'))
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [profile?.id])

  if (loading) {
    return <LoadingSpinner centered label="Loading profile..." />
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Your account details and access role.</p>
      </header>

      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Card>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 px-4 py-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <UserCircle2 className="h-4 w-4 text-blue-600" />
              Email
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{profile?.email}</p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Shield className="h-4 w-4 text-blue-600" />
              Role
            </p>
            <p className="mt-2 text-sm font-semibold capitalize text-slate-900">{profile?.role}</p>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-4 md:col-span-2">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Mail className="h-4 w-4 text-blue-600" />
              Member Since
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {createdAt ? new Date(createdAt).toLocaleString() : 'Not available'}
            </p>
          </div>
        </div>
      </Card>
    </section>
  )
}
