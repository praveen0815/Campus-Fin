import { supabase } from './supabase'
import type { Booking, BookingStatus, Slot, SlotSession, Sport, Venue } from '../types/admin'

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
}): Slot {
  const venue = pickFirst(row.venues)
  const sport = venue ? pickFirst(venue.sports) : null

  return {
    id: row.id,
    venue_id: row.venue_id,
    session: row.session,
    start_time: row.start_time,
    end_time: row.end_time,
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
  const { data, error } = await supabase
    .from('slots')
    .select('id, venue_id, session, start_time, end_time, created_at, venues(id, name, location, sports(id, name))')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((row) =>
    mapSlot(
      row as {
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
    },
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
