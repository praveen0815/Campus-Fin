export interface Sport {
  id: string
  name: string
  created_at?: string
}

export interface Venue {
  id: string
  sport_id: string
  name: string
  location: string
  created_at?: string
  sports?: Pick<Sport, 'id' | 'name'> | null
}

export type SlotSession = 'morning' | 'evening'

export interface Slot {
  id: string
  venue_id: string
  session: SlotSession
  start_time: string
  end_time: string
  created_at?: string
  venues?: Pick<Venue, 'id' | 'name' | 'location'> & {
    sports?: Pick<Sport, 'id' | 'name'> | null
  }
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'pending'

export interface Booking {
  id: string
  slot_id: string
  student_email: string
  status: BookingStatus
  created_at?: string
  slot?: Slot
}
