export type UserRole = 'admin' | 'student'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  created_at: string
}
