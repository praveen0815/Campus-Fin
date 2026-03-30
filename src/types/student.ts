export interface StudentSport {
  id: string
  name: string
}

export interface StudentVenue {
  id: string
  sport_id: string
  name: string
  location: string
  sports?: Pick<StudentSport, 'id' | 'name'> | null
}

export type SlotAvailability = 'available' | 'booked' | 'disabled'

export interface StudentSlot {
  id: string
  venue_id: string
  date?: string | null
  slot_date?: string | null
  session?: string | null
  start_time: string
  end_time: string
  status: SlotAvailability
  venues?: Pick<StudentVenue, 'id' | 'name' | 'location'> & {
    sports?: Pick<StudentSport, 'id' | 'name'> | null
  }
}

export type StudentBookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface StudentBooking {
  id: string
  slot_id: string
  user_id?: string | null
  student_email?: string | null
  status: StudentBookingStatus
  created_at?: string
  slots?: StudentSlot
}

export interface StudentDashboardData {
  totalSports: number
  availableSlotsToday: number
  recentBookings: StudentBooking[]
}
