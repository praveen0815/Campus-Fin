import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { UserRole } from '../../types/auth'

function isEmailValid(email: string) {
  return /^\S+@\S+\.\S+$/.test(email)
}

type LoginTab = 'student' | 'admin'

const STUDENT_EMAIL_DOMAIN = '@bitsathy.ac.in'

function isStudentEmail(email: string) {
  return email.toLowerCase().endsWith(STUDENT_EMAIL_DOMAIN)
}

function getRoleLabel(role: UserRole) {
  return role === 'admin' ? 'Admin' : 'Student'
}

export default function Login() {
  const { signIn, session, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<LoginTab>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session || !profile) {
      return
    }

    const nextPath = profile.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'
    navigate(nextPath, { replace: true })
  }, [navigate, profile, session])

  const canSubmit = useMemo(() => {
    if (!isEmailValid(email) || password.trim().length === 0) {
      return false
    }

    if (activeTab === 'student' && !isStudentEmail(email)) {
      return false
    }

    return true
  }, [activeTab, email, password])

  const handleTabChange = (nextTab: LoginTab) => {
    setActiveTab(nextTab)
    setError(null)
    setMessage(null)
  }

  const tabRole: UserRole = activeTab === 'admin' ? 'admin' : 'student'

  const heading = activeTab === 'admin' ? 'Admin Login' : 'Student Login'

  const subheading =
    activeTab === 'admin'
      ? 'Use your admin account to manage campus slots.'
      : 'Use your institutional email to access student booking.'

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!isEmailValid(email)) {
      setError('Enter a valid email address.')
      return
    }

    if (!password.trim()) {
      setError('Password is required.')
      return
    }

    if (activeTab === 'student' && !isStudentEmail(email)) {
      setError('Only @bitsathy.ac.in email IDs are allowed for student login')
      return
    }

    setLoading(true)
    const result = await signIn(email.trim(), password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (!result.role) {
      setError('Role was not found for this account.')
      return
    }

    if (result.role !== tabRole) {
      setError(
        `You are registered as ${getRoleLabel(result.role)}. Please use the ${getRoleLabel(result.role)} tab to sign in.`,
      )
      return
    }

    setMessage('Login successful. Redirecting...')
    navigate(tabRole === 'admin' ? '/admin/dashboard' : '/student/dashboard', {
      replace: true,
    })
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(14,165,233,0.26),transparent_36%),radial-gradient(circle_at_85%_80%,rgba(6,182,212,0.22),transparent_42%)]" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-8 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-600 to-indigo-700 text-lg font-bold text-white shadow-lg shadow-cyan-600/30">
            S
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">SlotSphere</h1>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-700">
              Campus Sports Booking Portal
            </p>
          </div>
        </div>

        <div className="relative mt-7 rounded-2xl bg-slate-100 p-1">
          <span
            aria-hidden="true"
            className={`absolute top-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-sm transition-transform duration-300 ${
              activeTab === 'admin' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          <div className="relative grid grid-cols-2">
            <button
              type="button"
              onClick={() => handleTabChange('student')}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                activeTab === 'student' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                activeTab === 'admin' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        <h2 className="mt-6 text-2xl font-semibold text-slate-900">{heading}</h2>
        <p className="mt-1 text-sm text-slate-600">{subheading}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              placeholder={activeTab === 'student' ? 'name@bitsathy.ac.in' : 'admin@example.com'}
              autoComplete="email"
              required
            />
            {activeTab === 'student' ? (
              <p className="mt-1 text-xs text-slate-500">Student login accepts only @bitsathy.ac.in emails.</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || authLoading || !canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Signing in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          New to SlotSphere?{' '}
          <Link to="/signup" className="font-medium text-cyan-700 hover:text-cyan-800">
            Switch to Signup
          </Link>
        </p>
      </section>
    </main>
  )
}
