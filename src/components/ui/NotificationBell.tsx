import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import {
  fetchNotifications,
  markNotificationRead,
  subscribeToNotificationInserts,
} from '../../services/notifications'
import type { AppNotification } from '../../types/notification'

interface NotificationBellProps {
  userId?: string
}

function formatRelativeTime(value: string) {
  const createdAt = new Date(value).getTime()
  const now = Date.now()
  const diffMs = Math.max(now - createdAt, 0)
  const minuteMs = 60 * 1000
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs

  if (diffMs < minuteMs) {
    return 'Just now'
  }

  if (diffMs < hourMs) {
    const mins = Math.floor(diffMs / minuteMs)
    return `${mins} min${mins === 1 ? '' : 's'} ago`
  }

  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }

  const days = Math.floor(diffMs / dayMs)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      return
    }

    let mounted = true

    const load = async () => {
      setLoading(true)
      try {
        const rows = await fetchNotifications(userId)
        if (mounted) {
          setNotifications(rows)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()

    const unsubscribe = subscribeToNotificationInserts(userId, (notification) => {
      setNotifications((prev) => [notification, ...prev])
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [userId])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) {
        return
      }

      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  )

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id ? { ...item, is_read: true } : item,
        ),
      )

      try {
        await markNotificationRead(notification.id)
      } catch {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, is_read: false } : item,
          ),
        )
      }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-96 rounded-lg border border-slate-200 bg-white p-4 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-base font-semibold text-slate-900">Notifications</p>
            <span className="text-xs font-medium text-slate-500">Unread: {unreadCount}</span>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void handleNotificationClick(notification)}
                    className={`w-full rounded-lg p-4 text-left transition ${
                      notification.is_read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50 hover:bg-blue-100/60'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">{notification.message}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{formatRelativeTime(notification.created_at)}</span>
                      <span>{notification.is_read ? 'Read' : 'Unread'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
