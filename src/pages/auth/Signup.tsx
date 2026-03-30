import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function isEmailValid(email: string) {
  return /^\S+@\S+\.\S+$/.test(email)
}

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => isEmailValid(email) && password.length >= 6, [email, password])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!isEmailValid(email)) {
      setError('Enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    const result = await signUp(email.trim(), password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setMessage('Account created successfully. You can now log in.')
    setTimeout(() => {
      navigate('/', { replace: true })
    }, 800)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 p-4 transition-colors duration-300">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl backdrop-blur sm:p-10 transition-colors duration-300">
        <p className="text-base font-medium tracking-wide text-cyan-700">Supabase Auth</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Create Account</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
          Sign up to get started. New accounts are assigned the student role.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 placeholder-slate-500"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 placeholder-slate-500"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full rounded-xl bg-slate-900 px-6 py-3 text-base font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Creating account...' : 'Signup'}
          </button>
        </form>

        <p className="mt-6 text-sm leading-relaxed text-slate-500 sm:text-base">
          Already have an account?{' '}
          <Link to="/" className="font-medium text-cyan-700 hover:text-cyan-800">
            Login
          </Link>
        </p>
      </section>
    </main>
  )
}

