import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../services/supabase'
import type { UserRole } from '../../types/auth'

const LOGIN_TYPE_STORAGE_KEY = 'loginType'
const STUDENT_EMAIL_DOMAIN = '@bitsathy.ac.in'
const ADMIN_EMAIL = 'praveen72696@gmail.com'

function toLowerTrimmed(value: string) {
  return value.trim().toLowerCase()
}

function getUnauthorizedMessage(role: UserRole) {
  return role === 'student'
    ? 'Only @bitsathy.ac.in email IDs are allowed for student login'
    : 'You are not authorized as admin'
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [statusMessage, setStatusMessage] = useState('Completing Google sign in...')

  useEffect(() => {
    let isMounted = true

    const handleAuthCallback = async () => {
      const loginTypeRaw = localStorage.getItem(LOGIN_TYPE_STORAGE_KEY)
      localStorage.removeItem(LOGIN_TYPE_STORAGE_KEY)

      const loginType: UserRole | null =
        loginTypeRaw === 'student' || loginTypeRaw === 'admin' ? loginTypeRaw : null

      if (!loginType) {
        toast.error('Login type was not found. Please select Student/Admin and continue with Google again.')
        await supabase.auth.signOut()
        navigate('/', { replace: true })
        return
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error(userError?.message ?? 'Unable to fetch authenticated user from Google.')
        await supabase.auth.signOut()
        navigate('/', { replace: true })
        return
      }

      const email = toLowerTrimmed(user.email ?? '')

      if (!email) {
        toast.error('Email is missing in your Google account.')
        await supabase.auth.signOut()
        navigate('/', { replace: true })
        return
      }

      const isStudentAllowed = loginType === 'student' && email.endsWith(STUDENT_EMAIL_DOMAIN)
      const isAdminAllowed = loginType === 'admin' && email === ADMIN_EMAIL

      if (!isStudentAllowed && !isAdminAllowed) {
        toast.error(getUnauthorizedMessage(loginType))
        await supabase.auth.signOut()
        navigate('/', { replace: true })
        return
      }

      setStatusMessage('Validating account role...')

      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle()

      if (existingUserError) {
        toast.error(existingUserError.message)
        await supabase.auth.signOut()
        navigate('/', { replace: true })
        return
      }

      if (!existingUser) {
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email,
          role: loginType,
        })

        if (insertError) {
          toast.error(insertError.message)
          await supabase.auth.signOut()
          navigate('/', { replace: true })
          return
        }
      } else if (existingUser.role !== loginType) {
        toast.error('Role mismatch detected. Please use the correct login tab.')
        await supabase.auth.signOut()
        navigate('/', { replace: true })
        return
      }

      if (!isMounted) {
        return
      }

      toast.success('Google login successful')
      navigate(loginType === 'admin' ? '/admin/dashboard' : '/student/dashboard', { replace: true })
    }

    void handleAuthCallback()

    return () => {
      isMounted = false
    }
  }, [navigate])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex items-center gap-3">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
          <h1 className="text-2xl font-semibold text-slate-900">Signing you in...</h1>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base">{statusMessage}</p>
      </section>
    </main>
  )
}
