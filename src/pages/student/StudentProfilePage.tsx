import { Mail, Shield, UserCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Card } from '../../components/ui/Card'

export default function StudentProfilePage() {
  const { profile } = useAuth()

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 lg:text-4xl">Profile</h1>
        <p className="mt-1 text-base leading-relaxed text-slate-500">Your account details and access role.</p>
      </header>

      {profile ? (
        <Card>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 px-4 py-4 transition-colors duration-300">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <UserCircle2 className="h-4 w-4 text-blue-600" />
                Email
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{profile?.email}</p>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-4 transition-colors duration-300">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Shield className="h-4 w-4 text-blue-600" />
                Role
              </p>
              <p className="mt-2 text-lg font-semibold capitalize text-slate-900">{profile?.role}</p>
            </div>

            <div className="rounded-xl bg-slate-50 px-4 py-4 md:col-span-2 transition-colors duration-300">
              <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                <Mail className="h-4 w-4 text-blue-600" />
                Member Since
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {profile?.created_at ? new Date(profile.created_at).toLocaleString() : 'Not available'}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-8">
            <p className="text-slate-600">Loading profile...</p>
          </div>
        </Card>
      )}
    </section>
  )
}

