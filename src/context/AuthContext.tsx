import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import type { UserProfile, UserRole } from '../types/auth'

const DEMO_ADMIN_EMAIL = import.meta.env.VITE_DEMO_ADMIN_EMAIL ?? 'admin@slotsphere.local'
const DEMO_ADMIN_PASSWORD = import.meta.env.VITE_DEMO_ADMIN_PASSWORD ?? 'Admin@123'
const DEMO_STUDENT_EMAIL = import.meta.env.VITE_DEMO_STUDENT_EMAIL ?? 'student@bitsathy.ac.in'
const DEMO_STUDENT_PASSWORD = import.meta.env.VITE_DEMO_STUDENT_PASSWORD ?? 'Student@123'
const DEMO_ADMIN_ID =
  import.meta.env.VITE_NOTIFICATION_ADMIN_USER_ID ?? '00000000-0000-0000-0000-000000000001'
const DEMO_STUDENT_ID = '00000000-0000-0000-0000-000000000002'

function createDemoAdminProfile(email: string): UserProfile {
  return {
    id: DEMO_ADMIN_ID,
    email,
    role: 'admin',
    created_at: new Date().toISOString(),
  }
}

function createDemoStudentProfile(email: string): UserProfile {
  return {
    id: DEMO_STUDENT_ID,
    email,
    role: 'student',
    created_at: new Date().toISOString(),
  }
}

interface AuthContextValue {
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ role: UserRole | null; error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function resolveUserProfile(userId: string, email: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (!error && data) {
    return data as UserProfile
  }

  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .upsert({ id: userId, email, role: 'student' }, { onConflict: 'id' })
    .select('id, email, role, created_at')
    .single()

  if (insertError) {
    return null
  }

  return inserted as UserProfile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserProfile = useCallback(async (userId: string, email: string) => {
    const nextProfile = await resolveUserProfile(userId, email)
    setProfile(nextProfile)
    return nextProfile
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession()

        setSession(existingSession)

        if (existingSession?.user) {
          await loadUserProfile(existingSession.user.id, existingSession.user.email ?? '')
        }
      } catch {
        setSession(null)
        setProfile(null)
      }

      setLoading(false)
    }

    void bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)

      if (!nextSession?.user) {
        setProfile(null)
        return
      }

      void loadUserProfile(nextSession.user.id, nextSession.user.email ?? '')
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      return { error: error.message }
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email ?? email,
          role: 'student',
        })

      if (profileError) {
        return { error: profileError.message }
      }
    }

    return { error: null }
  }, [])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase()

      if (
        normalizedEmail === DEMO_ADMIN_EMAIL.trim().toLowerCase() &&
        password === DEMO_ADMIN_PASSWORD
      ) {
        setProfile(createDemoAdminProfile(email.trim()))
        setSession({} as Session)
        return { role: 'admin' as UserRole, error: null }
      }

      if (
        normalizedEmail === DEMO_STUDENT_EMAIL.trim().toLowerCase() &&
        password === DEMO_STUDENT_PASSWORD
      ) {
        setProfile(createDemoStudentProfile(email.trim()))
        setSession({} as Session)
        return { role: 'student' as UserRole, error: null }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        const message = error.message.toLowerCase()
        if (message.includes('api key') || message.includes('apikey') || message.includes('invalid jwt')) {
          return {
            role: null,
            error:
              'Supabase API key is invalid. Use demo logins for now: admin@slotsphere.local / Admin@123 or student@bitsathy.ac.in / Student@123',
          }
        }

        return { role: null, error: error.message }
      }

      const user = data.user
      if (!user) {
        return { role: null, error: 'Unable to resolve authenticated user.' }
      }

      const nextProfile = await loadUserProfile(user.id, user.email ?? email)
      if (!nextProfile) {
        return { role: null, error: 'Unable to load user profile.' }
      }

      return { role: nextProfile.role, error: null }
    },
    [loadUserProfile],
  )

  const signOut = useCallback(async () => {
    try {
      if (session) {
        await supabase.auth.signOut()
      }
    } catch {
      // Ignore sign-out API failures for demo sessions.
    }
    setProfile(null)
    setSession(null)
  }, [session])

  const value = useMemo<AuthContextValue>(
    () => ({ session, profile, loading, signUp, signIn, signOut }),
    [loading, profile, session, signIn, signOut, signUp],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
