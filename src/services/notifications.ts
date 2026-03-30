import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { AppNotification, NotificationType } from '../types/notification'

const ADMIN_NOTIFICATION_EMAIL =
  import.meta.env.VITE_NOTIFICATION_ADMIN_EMAIL ?? 'praveen72696@gmail.com'
const FALLBACK_ADMIN_NOTIFICATION_USER_ID =
  import.meta.env.VITE_NOTIFICATION_ADMIN_USER_ID ?? '00000000-0000-0000-0000-000000000001'

interface CreateNotificationPayload {
  user_id: string
  message: string
  type: NotificationType
}

async function fetchAdminUserIds() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role')
    .or(`role.eq.admin,email.eq.${ADMIN_NOTIFICATION_EMAIL}`)

  if (error) {
    throw new Error(error.message)
  }

  const ids = (data ?? []).map((row) => row.id as string).filter(Boolean)
  if (ids.length > 0) {
    return Array.from(new Set(ids))
  }

  // Fallback supports demo mode where public.users may not contain admin entries yet.
  return [FALLBACK_ADMIN_NOTIFICATION_USER_ID]
}

export async function fetchNotifications(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as AppNotification[]
}

export async function createNotification(payload: CreateNotificationPayload) {
  const { error } = await supabase.from('notifications').insert({
    user_id: payload.user_id,
    message: payload.message,
    type: payload.type,
    created_at: new Date().toISOString(),
    is_read: false,
  })
  if (error) {
    throw new Error(error.message)
  }
}

export async function createNotificationsForUsers(payload: {
  userIds: string[]
  message: string
  type: NotificationType
}) {
  const dedupedIds = Array.from(new Set(payload.userIds.filter(Boolean)))
  if (dedupedIds.length === 0) {
    return
  }

  const rows = dedupedIds.map((userId) => ({
    user_id: userId,
    message: payload.message,
    type: payload.type,
    created_at: new Date().toISOString(),
    is_read: false,
  }))

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) {
    throw new Error(error.message)
  }
}

export async function notifyAdmins(message: string, type: NotificationType = 'info') {
  const adminUserIds = await fetchAdminUserIds()
  await createNotificationsForUsers({ userIds: adminUserIds, message, type })
}

export async function safeCreateNotification(payload: CreateNotificationPayload) {
  try {
    await createNotification(payload)
  } catch (error) {
    console.error('Failed to insert notification for user', payload.user_id, error)
    // Notifications should not block primary booking flows.
  }
}

export async function safeNotifyAdmins(message: string, type: NotificationType = 'info') {
  try {
    await notifyAdmins(message, type)
  } catch (error) {
    console.error('Failed to notify admins', error)
    // Notifications should not block primary booking flows.
  }
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    throw new Error(error.message)
  }
}

export function subscribeToNotificationInserts(
  userId: string,
  onInsert: (notification: AppNotification) => void,
) {
  const channel = supabase
    .channel(`notifications-channel-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresInsertPayload<Record<string, unknown>>) => {
        console.debug('Realtime notification payload', payload)
        const row = payload.new
        if (
          typeof row.id === 'string' &&
          typeof row.user_id === 'string' &&
          typeof row.message === 'string' &&
          typeof row.type === 'string' &&
          typeof row.created_at === 'string' &&
          typeof row.is_read === 'boolean'
        ) {
          onInsert({
            id: row.id,
            user_id: row.user_id,
            message: row.message,
            type: row.type as AppNotification['type'],
            created_at: row.created_at,
            is_read: row.is_read,
          })
        }
      },
    )
    .subscribe((status) => {
      console.debug(`notifications channel status for ${userId}:`, status)
    })

  return () => {
    void supabase.removeChannel(channel)
  }
}
