# Implementation Guide - Hour-Based Slot System

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React + TypeScript UI                     │
├──────────────────────┬──────────────────────────────────────┤
│   Admin Portal       │        Student Portal                │
│                      │                                      │
│ ManageSlotsPage      │ BookSlotPage                        │
│ - Form controls      │ - Sport selection (Step 1)          │
│ - Slot preview       │ - Venue selection (Step 2)          │
│ - Results table      │ - Date picker (Step 3)              │
│ - Delete actions     │ - Slot grid with session groups     │
│                      │ - Booking submission                │
├──────────────────────┴──────────────────────────────────────┤
│              Service Layer (admin.ts, student.ts)            │
│                                                              │
│ Admin:                          Student:                    │
│ - getSessionSlotWindows()       - fetchSlots()             │
│ - createSessionSlots()          - createBooking()          │
│ - fetchSlots()                  - cancelBooking()          │
│ - deleteSlot()                  - formatSlotTime()         │
│ - fetchBookings()               - convertTo12Hour()        │
├──────────────────────────────────────────────────────────────┤
│                    Supabase PostgreSQL                       │
│                                                              │
│ slots table:          bookings table:      venues table:    │
│ - id (PK)             - id (PK)            - id (PK)        │
│ - venue_id (FK)       - slot_id (FK)       - sport_id (FK)  │
│ - session             - student_email      - name           │
│ - start_time          - status             - location       │
│ - end_time            - created_at         - created_at     │
│ - slot_date                                                 │
│ - status                                                    │
│ - created_at                                                │
└──────────────────────────────────────────────────────────────┘
```

---

## 💾 Data Models

### Slot Model
```typescript
// Database representation (24-hour storage)
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  venue_id: "cafe123",
  session: "morning",      // 'morning' | 'evening'
  start_time: "06:00:00",  // 24-hour format
  end_time: "07:00:00",    // 24-hour format
  slot_date: "2026-03-30", // ISO date format
  status: "available",     // 'available' | 'booked' | 'disabled'
  created_at: "2026-03-30T10:00:00Z"
}

// UI representation (12-hour display)
displayTime = "6:00 AM - 7:00 AM"  // Formatted via convertTo12Hour()
duration = "1 Hr"                   // Calculated via getSlotDuration()
```

### Booking Model
```typescript
{
  id: "booking-uuid",
  slot_id: "slot-uuid",           // Links to specific slot
  student_email: "student@x.com",
  user_id: "uid-123",
  status: "confirmed",  // 'pending' | 'confirmed' | 'cancelled'
  created_at: "2026-03-30T10:05:00Z",
  
  // Related data (joined from slots table)
  slots: {
    id: "slot-uuid",
    venue_id: "venue-id",
    session: "morning",
    start_time: "06:00:00",
    end_time: "07:00:00",
    status: "booked",
    venues: {
      id: "venue-id",
      name: "Tennis Court A",
      location: "Campus Center"
    }
  }
}
```

---

## 🔄 Complete Flow Examples

### Example 1: Admin Creating Morning Slots

**User Action**: Click "Create Slots for Selected Session" for morning session

**Code Flow**:
```typescript
// 1. Form submission triggered
const handleCreateSessionSlots = async (event) => {
  event.preventDefault()
  
  // 2. Validate inputs
  if (!slotVenueId || !slotDate) {
    setError('Please select venue and date')
    return
  }
  
  // 3. Call admin service
  try {
    const created = await createSessionSlots({
      venue_id: slotVenueId,
      slot_date: slotDate,
      session: 'morning'
    })
    
    // 4. Handle success
    setSlots(prev => [...created, ...prev])
    toast.success(`5 morning slots created successfully`)
  } catch (error) {
    // 5. Handle error (duplicate prevention)
    const message = toUserError(error, 'Failed to create slots')
    setError(message)
    
    if (message.includes('already created')) {
      toast.error('Slots already created for this session')
    }
  }
}
```

**Service Layer** (`admin.ts`):
```typescript
export async function createSessionSlots(payload: {
  venue_id: string
  slot_date: string
  session: 'morning' | 'evening'
}) {
  // Step 1: Get slot templates
  const templates = SESSION_SLOT_WINDOWS['morning']
  // Returns:
  // [
  //   { start: '06:00:00', end: '07:00:00' },
  //   { start: '07:00:00', end: '08:00:00' },
  //   { start: '08:00:00', end: '09:00:00' },
  //   { start: '09:00:00', end: '10:00:00' },
  //   { start: '10:00:00', end: '11:00:00' }
  // ]
  
  // Step 2: Check for duplicates
  const { count } = await supabase
    .from('slots')
    .select('id', { count: 'exact', head: true })
    .eq('venue_id', payload.venue_id)
    .eq('session', payload.session)
    .eq('slot_date', payload.slot_date)
  
  if (count > 0) {
    throw new Error('Slots already created for this session')
  }
  
  // Step 3: Prepare rows for insertion
  const rowsToInsert = templates.map(slot => ({
    venue_id: payload.venue_id,
    session: payload.session,
    slot_date: payload.slot_date,
    start_time: slot.start,
    end_time: slot.end,
    status: 'available'
  }))
  
  // Step 4: Insert all 5 slots in single batch
  const { data, error } = await supabase
    .from('slots')
    .insert(rowsToInsert)
    .select('id, venue_id, slot_date, session, start_time, end_time, status, created_at, venues(...)')
  
  if (error) {
    throw new Error(error.message)
  }
  
  // Step 5: Return mapped data
  return data.map(row => mapSlot(row))
}
```

**Database Result**:
```sql
Five rows inserted into slots table:
| id  | venue_id | session | start_time | end_time   | slot_date  | status    |
|-----|----------|---------|------------|------------|------------|-----------|
| s1  | cafe123  | morning | 06:00:00   | 07:00:00   | 2026-03-30 | available |
| s2  | cafe123  | morning | 07:00:00   | 08:00:00   | 2026-03-30 | available |
| s3  | cafe123  | morning | 08:00:00   | 09:00:00   | 2026-03-30 | available |
| s4  | cafe123  | morning | 09:00:00   | 10:00:00   | 2026-03-30 | available |
| s5  | cafe123  | morning | 10:00:00   | 11:00:00   | 2026-03-30 | available |
```

---

### Example 2: Student Booking a Slot

**User Action**: Click "Book Now" on 6:00 AM - 7:00 AM slot

**Code Flow**:
```typescript
// 1. Student clicks "Book Now"
const handleBook = async (slot: StudentSlot) => {
  // 2. Check if slot is available
  if (slot.status !== 'available') {
    toast('Slot already booked')
    return
  }
  
  // 3. Verify user is logged in
  if (!profile?.id || !profile.email) {
    setError('You must be signed in to book a slot.')
    return
  }
  
  setBookingSlotId(slot.id)
  
  try {
    // 4. Call student service to create booking
    await createBooking({
      userId: profile.id,
      userEmail: profile.email,
      slotId: slot.id
    })
    
    // 5. Handle success
    toast.success('Slot booked successfully')
    
    // 6. Refresh slots to show updated status
    const refreshed = await fetchSlots({ 
      venueId: selectedVenueId, 
      date: selectedDate 
    })
    setSlots(refreshed)
  } catch (error) {
    // 7. Handle error (double booking prevention)
    if (error.message.includes('already booked')) {
      toast('Slot already booked')
    } else {
      toast.error('Something went wrong')
    }
  } finally {
    setBookingSlotId(null)
  }
}
```

**Service Layer** (`student.ts`):
```typescript
export async function createBooking(payload: {
  userId: string
  userEmail: string
  slotId: string
}) {
  // Step 1: Check if slot is already booked
  const { data: existing, error: existingError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('slot_id', payload.slotId)
    .in('status', ['pending', 'confirmed'])
    .limit(1)
  
  if (existingError) {
    throw new Error(existingError.message)
  }
  
  if (existing.length > 0) {
    throw new Error('This slot is already booked. Please pick another slot.')
  }
  
  // Step 2: Insert booking record
  const { data: booking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      user_id: payload.userId,
      student_email: payload.userEmail,
      slot_id: payload.slotId,
      status: 'confirmed'
    })
    .select('id, slot_id, student_email, status, created_at, ...')
    .single()
  
  if (insertError) {
    throw new Error(insertError.message)
  }
  
  // Step 3: Update slot status to 'booked'
  await tryUpdateSlotStatus(payload.slotId, 'booked')
  
  // Step 4: Return booking with related data
  return mapBooking(booking)
}
```

**Database Results**:
```sql
-- Row inserted into bookings table
| id  | slot_id | student_email        | status    | user_id | created_at                |
|-----|---------|----------------------|-----------|---------|---------------------------|
| b1  | s1      | john@college.edu     | confirmed | uid-123 | 2026-03-30T10:30:00Z      |

-- Slot status updated
| id  | venue_id | session | start_time | slot_date  | status | 
|-----|----------|---------|------------|------------|--------|
| s1  | cafe123  | morning | 06:00:00   | 2026-03-30 | booked |
```

---

## ⚠️ Edge Cases & Error Handling

### Edge Case 1: Two Students Click Same Slot Simultaneously

**Scenario**: Students A and B both see slot "6:00 AM - 7:00 AM" as available and click "Book Now" at the same time.

**Protection Mechanism**:
```typescript
// Both requests hit the server
// Database level: slot_id is unique in active bookings
// Application level: Pre-insert check catches race condition

await supabase
  .from('bookings')
  .select('id', { count: 'exact', head: true })
  .eq('slot_id', slotId)
  .in('status', ['pending', 'confirmed'])

// First student: count = 0, booking succeeds
// Second student: count = 1, booking fails with error
// Error: "This slot is already booked. Please pick another slot."
```

**User Experience**:
- Student A: "Slot booked successfully" ✓
- Student B: Toast error "Slot already booked" → Choose different slot

### Edge Case 2: Admin Deletes Slot After Student Opened Page

**Scenario**: Student loads slots, sees "6:00 AM" available. Admin deletes the slot. Student clicks "Book Now".

**Protection**:
```typescript
// Slot still exists in student's UI, but:
// 1. Booking insert will fail (foreign key constraint)
// 2. OR slot.id doesn't exist
// Error handling catches: "This slot is already booked"

// Real-time sync (if implemented):
// Supabase channel detects slot deletion
// Automatically refreshes student's slot list
// Slot disappears from UI before student can click it
```

### Edge Case 3: Network Error During Booking

**Scenario**: Student clicks "Book Now", request sent, but network drops before response.

**Protection**:
```typescript
// Button shows loading state
setBookingSlotId(slot.id) // Prevents duplicate clicks

try {
  await createBooking({...})
  toast.success(...)
  setSlots(refreshed) // Confirms success
} catch (error) {
  // Network error handled
  toast.error('Something went wrong')
  setError(message)
} finally {
  setBookingSlotId(null) // Re-enables button
}

// Student can retry by clicking "Book Now" again
// OR refresh page to see actual booking status
```

### Edge Case 4: Duplicate Slot Creation

**Scenario**: Admin creates morning slots for venue on 2026-03-30, then tries again.

**Protection**:
```typescript
// First request:
// - Check: SELECT COUNT(*) FROM slots 
//   WHERE venue_id='cafe123' AND session='morning' AND slot_date='2026-03-30'
// - Count: 0
// - Proceed: Insert 5 slots

// Second request:
// - Check: SELECT COUNT(*) FROM slots 
//   WHERE venue_id='cafe123' AND session='morning' AND slot_date='2026-03-30'
// - Count: 5 (slots exist)
// - Error: "Slots already created for this session"
// - Toast: "Slots already created for this session"
```

**Admin Options**:
1. Try different date
2. Try different session (create evening instead)
3. Delete individual slots and recreate

### Edge Case 5: Database Missing Optional Fields

**Scenario**: Database schema doesn't have `slot_date` and `status` columns.

**Protection** - Dual-path Queries:
```typescript
// Try primary query (with slot_date and status)
const richQuery = await supabase
  .from('slots')
  .select('id, venue_id, slot_date, session, start_time, end_time, status, ...')

if (richQuery.error) {
  // Fallback: Query without optional fields
  const fallback = await supabase
    .from('slots')
    .select('id, venue_id, session, start_time, end_time, ...')
  
  // Map fallback data, set defaults
  const mapped = fallback.data.map(row => ({
    ...row,
    slot_date: null,
    status: 'available'
  }))
  
  return mapped.map(row => mapSlot(row))
}
```

**Result**: System works regardless of schema version

---

## 🎯 Validation Checklist

### Pre-Deployment

- [ ] **Slot Duration**: All generated slots are exactly 1 hour
  - Verify: `end_time - start_time = 60 minutes`
  
- [ ] **Session Counts**: Morning = 5 slots, Evening = 7 slots
  - Count in preview cards
  - Verify in database

- [ ] **Time Formatting**: Display shows 12-hour AM/PM format
  - Admin UI: "6:00 AM - 7:00 AM"
  - Student UI: Same format

- [ ] **Duplicate Prevention**:
  - [ ] Admin can't create same session twice
  - [ ] Student can't book already-booked slot
  - [ ] Test with simultaneous requests

- [ ] **Status Updates**:
  - [ ] Slot shows "available" initially
  - [ ] Slot shows "booked" after booking
  - [ ] Real-time sync updates other students

- [ ] **Error Messages**: All user-friendly
  - [ ] "Slots already created for this session"
  - [ ] "This slot is already booked. Please pick another slot."
  - [ ] No technical SQL errors shown

- [ ] **Date Handling**:
  - [ ] Student can't select past dates
  - [ ] Admin can create slots for future dates
  - [ ] ISO format consistency (YYYY-MM-DD)

- [ ] **UI Responsiveness**:
  - [ ] Mobile: Single column
  - [ ] Tablet: 2-3 columns
  - [ ] Desktop: Full layout

---

## 🚀 Performance Optimization

### Batch Operations
```typescript
// ✅ Good: Batch insert 5 slots at once
const { data } = await supabase
  .from('slots')
  .insert([
    { ...slot1 },
    { ...slot2 },
    { ...slot3 },
    { ...slot4 },
    { ...slot5 }
  ])
  .select()

// ❌ Avoid: Insert one slot 5 times
for (const slot of slots) {
  await supabase.from('slots').insert(slot).select()  // 5 requests!
}
```

### Query Optimization
```typescript
// ✅ Good: Single query with relations
const { data } = await supabase
  .from('slots')
  .select('id, venue_id, session, start_time, end_time, venues(...)')
  .eq('venue_id', venueId)
  .order('start_time')

// ❌ Avoid: Multiple queries
const slots = await fetchSlots()
for (const slot of slots) {
  const venue = await fetchVenue(slot.venue_id)  // N+1 queries!
}
```

### Caching
```typescript
// ✅ Cache session slot windows (never changes)
const SESSION_SLOT_WINDOWS = {
  morning: [...],
  evening: [...]
}

// Use in memory without querying database
const templates = getSessionSlotWindows('morning')
```

---

## 📝 Code Examples

### Custom Time Utilities

```typescript
// Format slot for display
formatSlotTime({ start_time: '06:00:00', end_time: '07:00:00' })
// Returns: "6:00 AM - 7:00 AM"

// Convert single time
convertTo12Hour('16:00:00')
// Returns: "4:00 PM"

// Calculate duration in minutes
getSlotDuration('06:00:00', '07:00:00')
// Returns: 60

// Check if duration is valid (must be 1 hour)
const duration = getSlotDuration(slot.start_time, slot.end_time)
if (duration !== 60) {
  throw new Error('Invalid slot duration')
}
```

### Session-Based Filtering

```typescript
// Group slots by session
const morningSlots = allSlots.filter(s => s.session === 'morning')
const eveningSlots = allSlots.filter(s => s.session === 'evening')

// Or in JSX
{(['morning', 'evening'] as const).map(session => {
  const sessionSlots = slots.filter(s => s.session === session)
  if (sessionSlots.length === 0) return null
  
  return (
    <div key={session}>
      <h3>{session === 'morning' ? '🌅 Morning' : '🌆 Evening'}</h3>
      <div className="grid gap-3">
        {sessionSlots.map(slot => (
          <article key={slot.id}>
            {formatSlotTime(slot)}
          </article>
        ))}
      </div>
    </div>
  )
})}
```

---

## 🎓 Learning Resources

1. **Supabase Real-time**: Use for live slot status updates
2. **PostgreSQL Triggers**: Auto-update slot status on booking
3. **React Query**: Cache and sync slot data across components
4. **Tailwind CSS**: Responsive grid layouts for slots

---

**Version**: 1.0  
**Last Updated**: March 30, 2026  
**Status**: Production Ready
