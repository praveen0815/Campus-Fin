import { supabase } from './supabase'
import type {
  StudentBooking,
  StudentBookingStatus,
  StudentDashboardData,
  StudentSlot,
  StudentSport,
  StudentVenue,
} from '../types/student'

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null
  }

  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

function toTimeLabel(value: string) {
  const [h, m] = value.split(':')
  const hour = Number(h)
  const meridiem = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${m} ${meridiem}`
}

function mapVenue(row: {
  id: string
  sport_id: string
  name: string
  location: string
  sports?: { id: string; name: string } | { id: string; name: string }[] | null
}): StudentVenue {
  const sport = pickFirst(row.sports)

  return {
    id: row.id,
    sport_id: row.sport_id,
    name: row.name,
    location: row.location,
    sports: sport ? { id: sport.id, name: sport.name } : null,
  }
}

function mapSlot(row: {
  id: string
  venue_id: string
  slot_date?: string | null
  session?: string | null
  start_time: string
  end_time: string
  status?: string | null
  venues?:
    | {
        id: string
        name: string
        location: string
        sports?: { id: string; name: string } | { id: string; name: string }[] | null
      }
    | {
        id: string
        name: string
        location: string
        sports?: { id: string; name: string } | { id: string; name: string }[] | null
      }[]
    | null
}): StudentSlot {
  const venue = pickFirst(row.venues)
  const sport = venue ? pickFirst(venue.sports) : null

  return {
    id: row.id,
    venue_id: row.venue_id,
    slot_date: row.slot_date ?? null,
    session: row.session ?? null,
    start_time: row.start_time,
    end_time: row.end_time,
    status: (row.status as StudentSlot['status']) ?? 'available',
    venues: venue
      ? {
          id: venue.id,
          name: venue.name,
          location: venue.location,
          sports: sport ? { id: sport.id, name: sport.name } : null,
        }
      : undefined,
  }
}

function mapBooking(row: {
  id: string
  slot_id: string
  user_id?: string | null
  student_email?: string | null
  status: StudentBookingStatus
  created_at?: string
  slots?: {
    id: string
    venue_id: string
    slot_date?: string | null
    session?: string | null
    start_time: string
    end_time: string
    status?: string | null
    venues?: {
      id: string
      name: string
      location: string
      sports?: { id: string; name: string } | { id: string; name: string }[] | null
    } | {
      id: string
      name: string
      location: string
      sports?: { id: string; name: string } | { id: string; name: string }[] | null
    }[] | null
  } | {
    id: string
    venue_id: string
    slot_date?: string | null
    session?: string | null
    start_time: string
    end_time: string
    status?: string | null
    venues?: {
      id: string
      name: string
      location: string
      sports?: { id: string; name: string } | { id: string; name: string }[] | null
    } | {
      id: string
      name: string
      location: string
      sports?: { id: string; name: string } | { id: string; name: string }[] | null
    }[] | null
  }[] | null
}): StudentBooking {
  const slot = pickFirst(row.slots)

  return {
    id: row.id,
    slot_id: row.slot_id,
    user_id: row.user_id ?? null,
    student_email: row.student_email ?? null,
    status: row.status,
    created_at: row.created_at,
    slots: slot ? mapSlot(slot) : undefined,
  }
}

export async function fetchSports() {
  const { data, error } = await supabase.from('sports').select('id, name').order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as StudentSport[]
}

export async function fetchVenuesBySport(sportId: string) {
  const { data, error } = await supabase
    .from('venues')
    .select('id, sport_id, name, location, sports(id, name)')
    .eq('sport_id', sportId)
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) =>
    mapVenue(
      row as {
        id: string
        sport_id: string
        name: string
        location: string
        sports?: { id: string; name: string } | { id: string; name: string }[] | null
      },
    ),
  )
}

async function fetchBookedSlotIdsForDate(venueId: string, date: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('slot_id, status, slots!inner(id, venue_id, slot_date)')
    .eq('slots.venue_id', venueId)
    .eq('slots.slot_date', date)
    .in('status', ['pending', 'confirmed'])

  if (error) {
    // Compatibility fallback for schema without slot_date
    const fallback = await supabase
      .from('bookings')
      .select('slot_id, status, slots!inner(id, venue_id)')
      .eq('slots.venue_id', venueId)
      .in('status', ['pending', 'confirmed'])

    if (fallback.error) {
      throw new Error(fallback.error.message)
    }

    return new Set((fallback.data ?? []).map((row) => row.slot_id as string))
  }

  return new Set((data ?? []).map((row) => row.slot_id as string))
}

export async function fetchSlots(params: { venueId: string; date: string }) {
  const { venueId, date } = params

  const richQuery = await supabase
    .from('slots')
    .select('id, venue_id, slot_date, session, start_time, end_time, status, venues(id, name, location, sports(id, name))')
    .eq('venue_id', venueId)
    .eq('slot_date', date)
    .order('start_time')

  let slotRows: Array<{
    id: string
    venue_id: string
    slot_date?: string | null
    session?: string | null
    start_time: string
    end_time: string
    status?: string | null
    venues?:
      | {
          id: string
          name: string
          location: string
          sports?: { id: string; name: string } | { id: string; name: string }[] | null
        }
      | {
          id: string
          name: string
          location: string
          sports?: { id: string; name: string } | { id: string; name: string }[] | null
        }[]
      | null
  }> = []

  if (richQuery.error) {
    const fallback = await supabase
      .from('slots')
      .select('id, venue_id, session, start_time, end_time, venues(id, name, location, sports(id, name))')
      .eq('venue_id', venueId)
      .order('start_time')

    if (fallback.error) {
      throw new Error(fallback.error.message)
    }

    slotRows = (fallback.data ?? []).map((row) => ({
      ...(row as {
        id: string
        venue_id: string
        session?: string | null
        start_time: string
        end_time: string
        venues?:
          | {
              id: string
              name: string
              location: string
              sports?: { id: string; name: string } | { id: string; name: string }[] | null
            }
          | {
              id: string
              name: string
              location: string
              sports?: { id: string; name: string } | { id: string; name: string }[] | null
            }[]
          | null
      }),
      slot_date: null,
      status: 'available',
    }))
  } else {
    slotRows = (richQuery.data ?? []) as typeof slotRows
  }

  const bookedSlotIds = await fetchBookedSlotIdsForDate(venueId, date)

  const mapped = slotRows.map((row) => {
    const slot = mapSlot(row)
    if (bookedSlotIds.has(slot.id)) {
      return { ...slot, status: 'booked' as const }
    }
    return slot
  })

  return mapped
}

async function tryUpdateSlotStatus(slotId: string, nextStatus: StudentSlot['status']) {
  const { error } = await supabase.from('slots').update({ status: nextStatus }).eq('id', slotId)

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('column') && msg.includes('status')) {
      return
    }
    throw new Error(error.message)
  }
}

export async function createBooking(payload: {
  userId: string
  userEmail: string
  slotId: string
}) {
  const existing = await supabase
    .from('bookings')
    .select('id, status')
    .eq('slot_id', payload.slotId)
    .in('status', ['pending', 'confirmed'])
    .limit(1)

  if (existing.error) {
    throw new Error(existing.error.message)
  }

  if ((existing.data ?? []).length > 0) {
    throw new Error('This slot is already booked. Please pick another slot.')
  }

  const tryPrimary = await supabase
    .from('bookings')
    .insert({
      user_id: payload.userId,
      student_email: payload.userEmail,
      slot_id: payload.slotId,
      status: 'confirmed',
    })
    .select('id, slot_id, user_id, student_email, status, created_at, slots(id, venue_id, slot_date, session, start_time, end_time, status, venues(id, name, location, sports(id, name)))')
    .single()

  let inserted: unknown = tryPrimary.data

  if (tryPrimary.error) {
    const fallback = await supabase
      .from('bookings')
      .insert({
        slot_id: payload.slotId,
        student_email: payload.userEmail,
        status: 'confirmed',
      })
      .select('id, slot_id, student_email, status, created_at, slots(id, venue_id, session, start_time, end_time, venues(id, name, location, sports(id, name)))')
      .single()

    if (fallback.error) {
      throw new Error(fallback.error.message)
    }

    inserted = fallback.data
  }

  if (!inserted) {
    throw new Error('Booking insert did not return a record.')
  }

  await tryUpdateSlotStatus(payload.slotId, 'booked')

  return mapBooking(inserted as Parameters<typeof mapBooking>[0])
}

export async function fetchStudentBookings(payload: { userId: string; userEmail: string }) {
  const byUser = await supabase
    .from('bookings')
    .select('id, slot_id, user_id, student_email, status, created_at, slots(id, venue_id, slot_date, session, start_time, end_time, status, venues(id, name, location, sports(id, name)))')
    .eq('user_id', payload.userId)
    .order('created_at', { ascending: false })

  if (!byUser.error) {
    return (byUser.data ?? []).map((row) => mapBooking(row as Parameters<typeof mapBooking>[0]))
  }

  const byEmail = await supabase
    .from('bookings')
    .select('id, slot_id, student_email, status, created_at, slots(id, venue_id, session, start_time, end_time, venues(id, name, location, sports(id, name)))')
    .eq('student_email', payload.userEmail)
    .order('created_at', { ascending: false })

  if (byEmail.error) {
    throw new Error(byEmail.error.message)
  }

  return (byEmail.data ?? []).map((row) => mapBooking(row as Parameters<typeof mapBooking>[0]))
}

export async function cancelBooking(payload: {
  bookingId: string
  slotId: string
}) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', payload.bookingId)
    .select('id, slot_id, user_id, student_email, status, created_at, slots(id, venue_id, slot_date, session, start_time, end_time, status, venues(id, name, location, sports(id, name)))')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await tryUpdateSlotStatus(payload.slotId, 'available')

  return mapBooking(data as Parameters<typeof mapBooking>[0])
}

export async function fetchDashboardData(payload: {
  userId: string
  userEmail: string
  today: string
}): Promise<StudentDashboardData> {
  const [sports, slotsToday, recentBookings] = await Promise.all([
    fetchSports(),
    fetchSlotsCountForToday(payload.today),
    fetchStudentBookings({ userId: payload.userId, userEmail: payload.userEmail }),
  ])

  return {
    totalSports: sports.length,
    availableSlotsToday: slotsToday,
    recentBookings: recentBookings.slice(0, 5),
  }
}

async function fetchSlotsCountForToday(today: string) {
  const withDate = await supabase
    .from('slots')
    .select('id', { count: 'exact', head: true })
    .eq('slot_date', today)

  if (withDate.error) {
    const fallback = await supabase.from('slots').select('id', { count: 'exact', head: true })
    if (fallback.error) {
      throw new Error(fallback.error.message)
    }
    return fallback.count ?? 0
  }

  const total = withDate.count ?? 0

  const booked = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'confirmed'])

  if (booked.error) {
    throw new Error(booked.error.message)
  }

  return Math.max(total - (booked.count ?? 0), 0)
}

export async function fetchProfileDetails(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export function formatSlotTime(slot: Pick<StudentSlot, 'start_time' | 'end_time'>) {
  return `${toTimeLabel(slot.start_time)} - ${toTimeLabel(slot.end_time)}`
}

export function toUserError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}
