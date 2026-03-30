export type NotificationType = 'success' | 'error' | 'info'

export interface AppNotification {
  id: string
  user_id: string
  message: string
  type: NotificationType
  created_at: string
  is_read: boolean
}
