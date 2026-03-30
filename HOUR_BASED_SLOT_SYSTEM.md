# Hour-Based Slot Selection System
## Campus Sports Booking Platform

---

## 📋 System Overview

This document describes the complete implementation of an **hour-based slot selection system** for both Admin and Student portals. Every slot represents exactly **1-hour intervals** within predefined sessions.

---

## 🎯 Slot Structure

### Database Schema
Each slot is stored as a separate row in the `slots` table:

```
id (UUID)
venue_id (UUID) - Links to venue
sport_id (Optional - Links to sport)
date (ISO Format: YYYY-MM-DD)
start_time (24-hour format: HH:MM:SS)
end_time (24-hour format: HH:MM:SS)
session (morning | evening)
status (available | booked | disabled)
created_at (Timestamp)
```

### Slot Duration
- **Duration**: Always exactly 1 hour
- **Format**: start_time → end_time
- Example: `06:00:00` → `07:00:00` (1 hour)

---

## ⏰ Session Definitions

### Morning Session
- **Time Range**: 6:00 AM - 11:00 AM
- **Total Slots**: 5
- **Slot Schedule**:
  - 6:00 AM - 7:00 AM
  - 7:00 AM - 8:00 AM
  - 8:00 AM - 9:00 AM
  - 9:00 AM - 10:00 AM
  - 10:00 AM - 11:00 AM

### Evening Session
- **Time Range**: 4:00 PM - 11:00 PM
- **Total Slots**: 7
- **Slot Schedule**:
  - 4:00 PM - 5:00 PM
  - 5:00 PM - 6:00 PM
  - 6:00 PM - 7:00 PM
  - 7:00 PM - 8:00 PM
  - 8:00 PM - 9:00 PM
  - 9:00 PM - 10:00 PM
  - 10:00 PM - 11:00 PM

---

## 🔧 Admin Portal - Slot Creation

### Feature: Session-Based Bulk Creation

**Location**: Admin Dashboard → Manage Slots

#### Step 1: Form Selection
Admin selects:
1. **Venue** - Choose the sports venue
2. **Date** - Select date in ISO format (YYYY-MM-DD)
3. **Session** - Choose Morning or Evening

#### Step 2: Dynamic Slot Preview
The system automatically displays:
- Total number of slots for selected session
- Grid of all hourly slots with:
  - **Time Range** (formatted as 6:00 AM - 7:00 AM)
  - **Duration** badge: "1 Hour"
  - **Status** badge: "Available"

#### Step 3: Bulk Creation
Click **"Create Slots for Selected Session"** button:
- Inserts all 5 (morning) or 7 (evening) slots in a single batch operation
- Each slot created as a separate database row
- All slots initialized with `status = "available"`
- Timestamp recorded for audit trail

### Duplicate Prevention
Before creating slots:
1. System checks if slots already exist for:
   - `venue_id` = Selected venue
   - `session` = morning or evening
   - `slot_date` = Selected date

2. If found:
   - Shows error toast: "Slots already created for this session"
   - Prevents duplicate creation
   - Admin can delete and recreate if needed

### Results Table
Shows all created slots with:
- **Venue** name
- **Sport** associated with venue
- **Date** (slot_date)
- **Session** (morning/evening)
- **Time Range** (formatted: 6:00 AM – 7:00 AM)
- **Duration** badge (1 Hour)
- **Status** (Available/Booked)
- **Delete** action to remove individual slots

---

## 📱 Student Portal - Slot Booking

### Feature: Hour-Based Slot Selection

**Location**: Student Dashboard → Book Slot

#### Step-by-Step Booking Flow

**Step 1: Choose Sport**
- Grid of available sports
- Select one sport to filter venues

**Step 2: Choose Venue**
- Shows venues only for selected sport
- Auto-populated based on sport selection

**Step 3: Select Date**
- Date picker with minimum date = today
- Can select any future date

**Step 4: Select Slot and Book**
Two session-based slot groups displayed:

##### Morning Session (6 AM - 11 AM)
- Grid of available morning slots
- Each slot card shows:
  - **Time Range**: "6:00 AM – 7:00 AM" (formatted 12-hour)
  - **Duration Badge**: "1 Hr" (blue badge)
  - **Venue Name** + Location
  - **Status Badge**: 
    - 🟢 Available (green) - Clickable, green border
    - 🔴 Booked (red) - Disabled, grayed out
    - ⚫ Disabled (gray) - Disabled, grayed out
  - **Book Now Button**: 
    - Enabled for available slots
    - Disabled for booked/unavailable slots

##### Evening Session (4 PM - 11 PM)
- Similar layout as morning
- Grid of available evening slots
- Same interactive controls

#### Booking Action Flow

1. **Student clicks "Book Now" on a slot**
   - Button shows loading state
   - Request sent to backend

2. **System checks if slot is still available**
   - Queries active bookings for this slot
   - If already booked: Shows error "This slot is already booked"
   - If available: Proceeds to step 3

3. **Booking created in Supabase**
   - Inserts new row in `bookings` table:
     - `slot_id` - Links to the selected slot
     - `student_email` - Student's email
     - `status` - "confirmed"
     - `created_at` - Current timestamp

4. **Slot status updated**
   - Updates slot `status` to "booked"
   - Prevents other students from booking

5. **Confirmation shown**
   - Success toast: "Slot booked successfully"
   - Slots grid refreshes to show updated statuses
   - Booked slot now appears with red "Booked" status

### Status Display

#### Slot Status Colors & Meanings

| Status | Color | Icon | Interaction | Meaning |
|--------|-------|------|-------------|---------|
| Available | 🟢 Green | ✓ | Clickable | Slot is free to book |
| Booked | 🔴 Red | ✗ | Disabled | Slot already reserved |
| Disabled | ⚫ Gray | - | Disabled | Slot unavailable (admin action) |

#### Visual Indicators
- **Available**: Green border, gradient blue background, hover effect
- **Booked**: Gray background, opacity reduced, red status badge
- **Disabled**: Gray appearance, disabled cursor

---

## 🔄 Real-Time Updates

### Live Sync Mechanism
- Uses Supabase real-time subscriptions
- Listens to changes in `slots` and `bookings` tables
- Auto-refreshes slot statuses when:
  - Another student books a slot
  - Admin creates new slots
  - Slot is cancelled/disabled

### Implementation Details
```typescript
channel = supabase
  .channel(`student-book-${venueId}-${date}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, () => loadSlots())
  .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadSlots())
  .subscribe()
```

---

## 🛡️ Safety & Validation

### Double Booking Prevention
1. **Pre-insert check**: Query bookings for slot
2. **Status check**: Verify `status IN ['pending', 'confirmed']`
3. **Error handling**: Throw error before booking creation
4. **User feedback**: Toast message to student

### Slot Duration Validation
- System enforces exactly 1-hour slots
- Database enforces `end_time - start_time = 1 hour`
- No custom durations allowed

### Date Validation
- Student cannot book past dates
- Minimum date = current date
- Admin can create slots for any future date

### Session Integrity
- Slots always belong to a session (morning/evening)
- Cannot mix sessions in same time range
- Session templates are immutable

---

## 🔧 Technical Implementation

### Frontend Components

#### `src/pages/admin/ManageSlotsPage.tsx`
- Session dropdown selector
- Date picker
- Venue selector
- Bulk creation handler
- Results table with delete action
- Duplicate prevention error handling

#### `src/pages/student/BookSlotPage.tsx`
- Sport selector (Step 1)
- Venue selector (Step 2)
- Date picker (Step 3)
- Session-grouped slot display (Step 4)
- Individual slot cards with status
- Booking submit handler

### Backend Services

#### `src/services/admin.ts`
**Constants:**
- `SESSION_SLOT_WINDOWS`: Hour templates for each session

**Functions:**
- `getSessionSlotWindows(session)`: Returns 5 or 7 hour templates
- `createSessionSlots({venue_id, slot_date, session})`: Bulk insert with duplicate check
- `fetchSlots()`: Get all slots with rich query
- `deleteSlot(slotId)`: Remove individual slot

**Features:**
- Dual-path Supabase queries (primary + fallback for schema compatibility)
- Duplicate slot prevention via count query
- Full error handling with user-friendly messages

#### `src/services/student.ts`
**Functions:**
- `fetchSlots({venueId, date})`: Get slots for specific date
- `fetchVenuesBySport(sportId)`: Filter venues by sport
- `createBooking({userId, userEmail, slotId})`: Book a slot
- `formatSlotTime(slot)`: Format time range as "6:00 AM - 7:00 AM"
- `convertTo12Hour(time24)`: Convert 24-hour to 12-hour format
- `getSlotDuration(startTime, endTime)`: Calculate duration in minutes

**Features:**
- Real-time booking status check
- Slot status auto-update on booking
- Double booking prevention with error messages
- Real-time subscriptions for status sync

### Data Types

#### `src/types/admin.ts`
```typescript
type SlotSession = 'morning' | 'evening'

interface Slot {
  id: string
  venue_id: string
  slot_date?: string | null
  session: SlotSession
  start_time: string
  end_time: string
  status?: 'available' | 'booked' | 'disabled'
  created_at?: string
  venues?: {
    id: string
    name: string
    location: string
    sports?: { id: string; name: string } | null
  }
}
```

#### `src/types/student.ts`
```typescript
type SlotAvailability = 'available' | 'booked' | 'disabled'

interface StudentSlot {
  id: string
  venue_id: string
  slot_date?: string | null
  session?: string | null
  start_time: string
  end_time: string
  status: SlotAvailability
  venues?: {
    id: string
    name: string
    location: string
    sports?: { id: string; name: string } | null
  }
}
```

---

## 📊 Database Relationships

```
venues
├── id (PK)
├── sport_id (FK → sports)
└── name, location

slots
├── id (PK)
├── venue_id (FK → venues)
├── session (morning | evening)
├── start_time, end_time
├── slot_date
└── status

bookings
├── id (PK)
├── slot_id (FK → slots)
├── student_email
├── status (pending | confirmed | cancelled)
└── created_at
```

---

## 🚀 Usage Examples

### Admin Creating Slots
1. Go to Admin Dashboard → Manage Slots
2. Select Tennis Court (venue)
3. Select 2026-03-30 (date)
4. Select "Morning"
5. Preview shows: "5 Morning Slots Ready to Create"
   - 6:00 AM - 7:00 AM
   - 7:00 AM - 8:00 AM
   - 8:00 AM - 9:00 AM
   - 9:00 AM - 10:00 AM
   - 10:00 AM - 11:00 AM
6. Click "Create Slots for Selected Session"
7. Toast: "5 morning slots created successfully"

### Student Booking a Slot
1. Go to Student Dashboard → Book Slot
2. Choose "Tennis" (sport)
3. Choose "Court A" (venue)
4. Select "2026-03-30" (date)
5. See Morning session with available slots
6. Click "Book Now" on "6:00 AM - 7:00 AM"
7. Loading state appears
8. If successful: Toast "Slot booked successfully"
9. Slot card shows "🔴 Booked" status

---

## ⚙️ Time Format Specifications

### Database Storage
- **Format**: 24-hour (HH:MM:SS)
- **Example**: `06:00:00`, `16:00:00`, `23:00:00`
- **Timezone**: Uses system timezone or UTC

### Display Format
- **Format**: 12-hour with AM/PM
- **Example**: `6:00 AM`, `4:00 PM`, `11:00 PM`
- **Function**: `convertTo12Hour()` in both `student.ts` and `admin.ts`

### Duration Format
- **Unit**: Hours
- **Display**: Badge showing "1 Hr"
- **Calculation**: `getSlotDuration()` function

---

## 🧪 Testing Checklist

### Admin Panel Tests
- [ ] Create morning slots successfully
- [ ] Create evening slots successfully
- [ ] Duplicate creation shows error
- [ ] Delete individual slots works
- [ ] Slot count matches (5 morning, 7 evening)
- [ ] Time formatting is correct (AM/PM)
- [ ] Booked slots show booked status in table

### Student Portal Tests
- [ ] Sport filter works
- [ ] Venue loads based on sport
- [ ] Can select any future date
- [ ] Morning slots display (count = 5)
- [ ] Evening slots display (count = 7)
- [ ] Available slots are clickable
- [ ] Book slot creates booking
- [ ] Booked slot shows status update
- [ ] Double booking prevention works
- [ ] Real-time updates when other student books

### Edge Cases
- [ ] Book last available slot
- [ ] Two students click same slot simultaneously
- [ ] Cancel booking → slot becomes available
- [ ] Delete all slots and recreate
- [ ] Different dates show correct slots
- [ ] Time display consistent across pages

---

## 📝 Notes

### Schema Compatibility
- System uses dual-path Supabase queries
- Works with or without `slot_date` and `status` columns
- Graceful fallback for older database schemas

### Performance Optimization
- Bulk insert (5-7 slots at once) vs individual inserts
- Real-time subscriptions only for current selection
- Efficient query with venue relations

### Future Enhancements
- Session templates customizable by venue
- Dynamic slot duration (15min, 30min, 1hr, 2hr)
- Recurring slot generation
- Price per slot based on session/time
- Waitlist for booked slots

---

## 📞 Support

For questions or issues:
1. Check this documentation first
2. Review code comments in services
3. Test using the checklist above
4. Debug using browser console logs

---

**Version**: 1.0  
**Last Updated**: March 30, 2026  
**Status**: ✅ Production Ready
