import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
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
  const [showPassword, setShowPassword] = useState(false)
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 px-4 py-12 transition-colors duration-300">
      <section className="w-full max-w-xl min-h-[680px] rounded-2xl border border-white/70 bg-white/90 p-10 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] sm:p-12">
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-600 to-indigo-700 text-xl font-bold text-white shadow-lg shadow-cyan-600/30">
            S
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">SlotSphere</h1>
          </div>
          <p className="text-lg uppercase tracking-wide text-slate-500">Campus Sports Booking Portal</p>
        </div>

        <div className="relative mt-6 h-12 w-full rounded-xl bg-slate-100 p-1 transition-colors duration-300">
          <span
            aria-hidden="true"
            className={`absolute top-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-sm transition-all duration-200 ${
              activeTab === 'admin' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />
          <div className="relative grid grid-cols-2">
            <button
              type="button"
              onClick={() => handleTabChange('student')}
              className={`h-10 rounded-lg px-4 text-base font-medium transition-all duration-200 ${
                activeTab === 'student' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`h-10 rounded-lg px-4 text-base font-medium transition-all duration-200 ${
                activeTab === 'admin' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        <div className="mt-8 space-y-1">
          <h2 className="text-2xl font-semibold text-slate-900">{heading}</h2>
          <p className="text-base text-slate-500">{subheading}</p>
        </div>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">
            <div>
            <label htmlFor="email" className="mb-2 block text-lg font-medium text-slate-700">
              Email
            </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-4 pl-11 pr-4 text-lg text-slate-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  placeholder={activeTab === 'student' ? 'name@bitsathy.ac.in' : 'admin@example.com'}
                  autoComplete="email"
                  required
                />
              </div>
            {activeTab === 'student' ? (
                <p className="mt-2 text-base leading-relaxed text-blue-500">Student login accepts only @bitsathy.ac.in emails.</p>
            ) : null}
          </div>

            <div>
            <label htmlFor="password" className="mb-2 block text-lg font-medium text-slate-700">
              Password
            </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-4 pl-11 pr-12 text-lg text-slate-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-red-500">
              {error}
            </p>
          ) : null}
          {message ? (
            <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || authLoading || !canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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

        <p className="mt-8 text-base text-slate-500">
          New to SlotSphere?{' '}
          <Link to="/signup" className="text-base font-medium text-blue-600 hover:underline">
            Switch to Signup
          </Link>
        </p>
      </section>
    </main>
  )
}

