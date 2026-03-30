import { supabase } from './supabase'
import type { Booking, BookingStatus, Slot, SlotSession, Sport, Venue } from '../types/admin'

const SESSION_SLOT_WINDOWS: Record<SlotSession, Array<{ start: string; end: string }>> = {
  morning: [
    { start: '06:00:00', end: '07:00:00' },
    { start: '07:00:00', end: '08:00:00' },
    { start: '08:00:00', end: '09:00:00' },
    { start: '09:00:00', end: '10:00:00' },
    { start: '10:00:00', end: '11:00:00' },
  ],
  evening: [
    { start: '16:00:00', end: '17:00:00' },
    { start: '17:00:00', end: '18:00:00' },
    { start: '18:00:00', end: '19:00:00' },
    { start: '19:00:00', end: '20:00:00' },
    { start: '20:00:00', end: '21:00:00' },
    { start: '21:00:00', end: '22:00:00' },
    { start: '22:00:00', end: '23:00:00' },
  ],
}

function formatError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message
  }

  return fallback
}

function pickFirst<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null
  }

  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

function mapVenue(row: {
  id: string
  sport_id: string
  name: string
  location: string
  created_at?: string
  sports?: { id: string; name: string } | { id: string; name: string }[] | null
}): Venue {
  const sport = pickFirst(row.sports)

  return {
    id: row.id,
    sport_id: row.sport_id,
    name: row.name,
    location: row.location,
    created_at: row.created_at,
    sports: sport ? { id: sport.id, name: sport.name } : null,
  }
}

function mapSlot(row: {
  id: string
  venue_id: string
  date?: string | null
  slot_date?: string | null
  session: SlotSession
  start_time: string
  end_time: string
  status?: 'available' | 'booked' | 'disabled' | null
  created_at?: string
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
}): Slot {
  const venue = pickFirst(row.venues)
  const sport = venue ? pickFirst(venue.sports) : null
  const normalizedDate = row.date ?? row.slot_date ?? null

  return {
    id: row.id,
    venue_id: row.venue_id,
    date: normalizedDate,
    slot_date: normalizedDate,
    session: row.session,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status ?? 'available',
    created_at: row.created_at,
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

export async function fetchSports() {
  const { data, error } = await supabase.from('sports').select('id, name, created_at').order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Sport[]
}

export async function createSport(name: string) {
  const trimmed = name.trim()
  const { data, error } = await supabase
    .from('sports')
    .insert({ name: trimmed })
    .select('id, name, created_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Sport
}

export async function updateSport(sportId: string, name: string) {
  const trimmed = name.trim()
  const { data, error } = await supabase
    .from('sports')
    .update({ name: trimmed })
    .eq('id', sportId)
    .select('id, name, created_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Sport
}

export async function deleteSport(sportId: string) {
  const { error } = await supabase.from('sports').delete().eq('id', sportId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchVenues() {
  const { data, error } = await supabase
    .from('venues')
    .select('id, sport_id, name, location, created_at, sports(id, name)')
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
        created_at?: string
        sports?: { id: string; name: string } | { id: string; name: string }[] | null
      },
    ),
  )
}

export async function createVenue(payload: { sport_id: string; name: string; location: string }) {
  const { data, error } = await supabase
    .from('venues')
    .insert({
      sport_id: payload.sport_id,
      name: payload.name.trim(),
      location: payload.location.trim(),
    })
    .select('id, sport_id, name, location, created_at, sports(id, name)')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapVenue(
    data as {
      id: string
      sport_id: string
      name: string
      location: string
      created_at?: string
      sports?: { id: string; name: string } | { id: string; name: string }[] | null
    },
  )
}

export async function updateVenue(
  venueId: string,
  payload: { sport_id: string; name: string; location: string },
) {
  const { data, error } = await supabase
    .from('venues')
    .update({
      sport_id: payload.sport_id,
      name: payload.name.trim(),
      location: payload.location.trim(),
    })
    .eq('id', venueId)
    .select('id, sport_id, name, location, created_at, sports(id, name)')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapVenue(
    data as {
      id: string
      sport_id: string
      name: string
      location: string
      created_at?: string
      sports?: { id: string; name: string } | { id: string; name: string }[] | null
    },
  )
}

export async function deleteVenue(venueId: string) {
  const { error } = await supabase.from('venues').delete().eq('id', venueId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchSlots() {
  const richQuery = await supabase
    .from('slots')
    .select('id, venue_id, slot_date, session, start_time, end_time, status, created_at, venues(id, name, location, sports(id, name))')
    .order('created_at', { ascending: false })

  let rows: Array<{
    id: string
    venue_id: string
    slot_date?: string | null
    session: SlotSession
    start_time: string
    end_time: string
    status?: 'available' | 'booked' | 'disabled' | null
    created_at?: string
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
      .select('id, venue_id, session, start_time, end_time, created_at, venues(id, name, location, sports(id, name))')
      .order('created_at', { ascending: false })

    if (fallback.error) {
      throw new Error(fallback.error.message)
    }

    rows = (fallback.data ?? []).map((row) => ({
      ...(row as {
        id: string
        venue_id: string
        session: SlotSession
        start_time: string
        end_time: string
        created_at?: string
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
    rows = (richQuery.data ?? []) as typeof rows
  }

  return rows.map((row) =>
    mapSlot(
      row as {
        id: string
        venue_id: string
        slot_date?: string | null
        session: SlotSession
        start_time: string
        end_time: string
        status?: 'available' | 'booked' | 'disabled' | null
        created_at?: string
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
      },
    ),
  )
}

export async function createSlot(payload: {
  venue_id: string
  session: SlotSession
  start_time: string
  end_time: string
}) {
  const { data, error } = await supabase
    .from('slots')
    .insert(payload)
    .select('id, venue_id, session, start_time, end_time, created_at, venues(id, name, location, sports(id, name))')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return mapSlot(
    data as {
      id: string
      venue_id: string
      slot_date?: string | null
      session: SlotSession
      start_time: string
      end_time: string
      status?: 'available' | 'booked' | 'disabled' | null
      created_at?: string
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
    },
  )
}

export function getSessionSlotWindows(session: SlotSession) {
  return SESSION_SLOT_WINDOWS[session]
}

// Get all hourly slots combined (morning + evening)
export function getAllSlotWindows() {
  return [
    ...SESSION_SLOT_WINDOWS.morning,
    ...SESSION_SLOT_WINDOWS.evening,
  ]
}

// Get session type from start time
export function getSessionFromStartTime(startTime: string): SlotSession {
  const hour = parseInt(startTime.split(':')[0], 10)
  return hour >= 16 ? 'evening' : 'morning'
}

// Create individual hourly slot
export async function createIndividualSlot(payload: {
  venue_id: string
  slot_date: string
  start_time: string
  end_time: string
}) {
  const session = getSessionFromStartTime(payload.start_time)

  // Check if this specific slot already exists
  const existingSlot = await supabase
    .from('slots')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', payload.venue_id)
    .eq('slot_date', payload.slot_date)
    .eq('start_time', payload.start_time)
    .eq('end_time', payload.end_time)

  let duplicateCount = existingSlot.count ?? 0

  if (existingSlot.error) {
    const fallbackCheck = await supabase
      .from('slots')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', payload.venue_id)
      .eq('start_time', payload.start_time)

    duplicateCount = fallbackCheck.count ?? 0
  }

  if (duplicateCount > 0) {
    throw new Error('This slot already exists for the selected venue')
  }

  const rowWithDate = {
    venue_id: payload.venue_id,
    date: payload.slot_date,
    slot_date: payload.slot_date,
    session: session,
    start_time: payload.start_time,
    end_time: payload.end_time,
    status: 'available' as const,
  }

  const primaryInsert = await supabase
    .from('slots')
    .insert([rowWithDate])
    .select('id, venue_id, slot_date, session, start_time, end_time, status, created_at, venues(id, name, location, sports(id, name))')
    .single()

  if (primaryInsert.error) {
    const fallbackInsert = await supabase
      .from('slots')
      .insert([{ venue_id: payload.venue_id, session: session, start_time: payload.start_time, end_time: payload.end_time }])
      .select('id, venue_id, session, start_time, end_time, created_at, venues(id, name, location, sports(id, name))')
      .single()

    if (fallbackInsert.error) {
      throw new Error(fallbackInsert.error.message)
    }

    return mapSlot(
      {
        ...(fallbackInsert.data as {
          id: string
          venue_id: string
          session: SlotSession
          start_time: string
          end_time: string
          created_at?: string
          venues?: { id: string; name: string; location: string; sports?: { id: string; name: string } | { id: string; name: string }[] | null } | { id: string; name: string; location: string; sports?: { id: string; name: string } | { id: string; name: string }[] | null }[] | null
        }),
        slot_date: null,
        status: 'available',
      },
    )
  }

  return mapSlot(primaryInsert.data as {
    id: string
    venue_id: string
    slot_date?: string | null
    session: SlotSession
    start_time: string
    end_time: string
    status?: 'available' | 'booked' | 'disabled' | null
    created_at?: string
    venues?: { id: string; name: string; location: string; sports?: { id: string; name: string } | { id: string; name: string }[] | null } | { id: string; name: string; location: string; sports?: { id: string; name: string } | { id: string; name: string }[] | null }[] | null
  })
}

export async function createSessionSlots(payload: {
  venue_id: string
  slot_date: string
  session: SlotSession
}) {
  const templates = getSessionSlotWindows(payload.session)

  const existingForDate = await supabase
    .from('slots')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', payload.venue_id)
    .eq('session', payload.session)
    .eq('slot_date', payload.slot_date)

  let duplicateCount = existingForDate.count ?? 0

  if (existingForDate.error) {
    const fallbackExisting = await supabase
      .from('slots')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', payload.venue_id)
      .eq('session', payload.session)

    if (fallbackExisting.error) {
      throw new Error(fallbackExisting.error.message)
    }

    duplicateCount = fallbackExisting.count ?? 0
  }

  if (duplicateCount > 0) {
    throw new Error('Slots already created for this session')
  }

  const rowsWithDateAndStatus = templates.map((slot) => ({
    venue_id: payload.venue_id,
    date: payload.slot_date,
    slot_date: payload.slot_date,
    session: payload.session,
    start_time: slot.start,
    end_time: slot.end,
    status: 'available' as const,
  }))

  const primaryInsert = await supabase
    .from('slots')
    .insert(rowsWithDateAndStatus)
    .select('id, venue_id, slot_date, session, start_time, end_time, status, created_at, venues(id, name, location, sports(id, name))')

  if (primaryInsert.error) {
    const fallbackRows = templates.map((slot) => ({
      venue_id: payload.venue_id,
      session: payload.session,
      start_time: slot.start,
      end_time: slot.end,
    }))

    const fallbackInsert = await supabase
      .from('slots')
      .insert(fallbackRows)
      .select('id, venue_id, session, start_time, end_time, created_at, venues(id, name, location, sports(id, name))')

    if (fallbackInsert.error) {
      throw new Error(fallbackInsert.error.message)
    }

    return (fallbackInsert.data ?? []).map((row) =>
      mapSlot(
        {
          ...(row as {
            id: string
            venue_id: string
            session: SlotSession
            start_time: string
            end_time: string
            created_at?: string
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
        },
      ),
    )
  }

  return (primaryInsert.data ?? []).map((row) =>
    mapSlot(
      row as {
        id: string
        venue_id: string
        slot_date?: string | null
        session: SlotSession
        start_time: string
        end_time: string
        status?: 'available' | 'booked' | 'disabled' | null
        created_at?: string
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
      },
    ),
  )
}

export async function deleteSlot(slotId: string) {
  const { error } = await supabase.from('slots').delete().eq('id', slotId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function countSlotsByVenue(venueId: string) {
  const { count, error } = await supabase
    .from('slots')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', venueId)

  if (error) {
    throw new Error(error.message)
  }

  return count ?? 0
}

export function toUserError(error: unknown, fallback = 'Something went wrong. Please try again.') {
  return formatError(error, fallback)
}

/**
 * Converts 24-hour time format (HH:MM:SS) to 12-hour AM/PM format
 * Example: '14:30:00' → '2:30 PM'
 */
export function convertTo12Hour(time24: string): string {
  const [h, m] = time24.split(':')
  const hour = Number(h)
  const meridiem = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${m} ${meridiem}`
}

/**
 * Formats a slot with start and end times as a readable time range
 * Example: '06:00:00' to '07:00:00' → '6:00 AM - 7:00 AM'
 */
export function formatSlotTimeRange(startTime: string, endTime: string): string {
  return `${convertTo12Hour(startTime)} - ${convertTo12Hour(endTime)}`
}

/**
 * Gets the duration in minutes between two times
 * Example: '06:00:00' to '07:00:00' → 60 minutes
 */
export function getSlotDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  return endMinutes - startMinutes
}

export async function fetchBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, slot_id, student_email, status, created_at, slots(id, venue_id, session, start_time, end_time, created_at, venues(id, name, location, sports(id, name)))')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slot_id: row.slot_id,
    student_email: row.student_email,
    status: row.status as BookingStatus,
    created_at: row.created_at,
    slot: row.slots ? mapSlot(
      row.slots as unknown as Parameters<typeof mapSlot>[0],
    ) : undefined,
  } as Booking))
}

export async function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select('id, slot_id, student_email, status, created_at, slots(id, venue_id, session, start_time, end_time, created_at, venues(id, name, location, sports(id, name)))')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    slot_id: data.slot_id,
    student_email: data.student_email,
    status: data.status as BookingStatus,
    created_at: data.created_at,
    slot: data.slots ? mapSlot(
      data.slots as unknown as Parameters<typeof mapSlot>[0],
    ) : undefined,
  } as Booking
}

export async function fetchStats() {
  const [sportsResult, venuesResult, slotsResult, bookingsResult] = await Promise.all([
    supabase.from('sports').select('id', { count: 'exact', head: true }),
    supabase.from('venues').select('id', { count: 'exact', head: true }),
    supabase.from('slots').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
  ])

  const stats = {
    totalSports: sportsResult.count ?? 0,
    totalVenues: venuesResult.count ?? 0,
    totalSlots: slotsResult.count ?? 0,
    totalBookings: bookingsResult.count ?? 0,
  }

  return stats
}
