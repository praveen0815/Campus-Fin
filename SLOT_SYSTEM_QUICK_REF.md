# Hour-Based Slot System - Quick Reference Guide

## 🚀 Quick Start

### For Admins - Creating Slots
```
1. Navigate to: Admin Dashboard → Manage Slots
2. Select: Venue → Date → Session (Morning/Evening)
3. Review: Dynamic preview shows all hourly slots
4. Confirm: Click "Create Slots for Selected Session"
5. Result: All 5 or 7 slots created instantly
```

### For Students - Booking Slots
```
1. Navigate to: Student Dashboard → Book Slot
2. Select: Sport → Venue → Date
3. View: Slots grouped by Morning (6-11 AM) and Evening (4-11 PM)
4. Choose: Click "Book Now" on any available slot
5. Confirm: Success toast and slot status changes to "Booked"
```

---

## 📋 Slot Sessions

### Morning
| Time Range | Duration | Status |
|-----------|----------|--------|
| 6:00 - 7:00 | 1 Hour | 
| 7:00 - 8:00 | 1 Hour |
| 8:00 - 9:00 | 1 Hour |
| 9:00 - 10:00 | 1 Hour |
| 10:00 - 11:00 | 1 Hour |
**Total**: 5 slots

### Evening
| Time Range | Duration | Status |
|-----------|----------|--------|
| 4:00 - 5:00 | 1 Hour |
| 5:00 - 6:00 | 1 Hour |
| 6:00 - 7:00 | 1 Hour |
| 7:00 - 8:00 | 1 Hour |
| 8:00 - 9:00 | 1 Hour |
| 9:00 - 10:00 | 1 Hour |
| 10:00 - 11:00 | 1 Hour |
**Total**: 7 slots

---

## 🔧 Key Functions Reference

### Admin Service (`src/services/admin.ts`)

```typescript
// Get slot templates for a session
getSessionSlotWindows('morning') // Returns 5 slots
getSessionSlotWindows('evening') // Returns 7 slots

// Create all slots for a session in one batch
await createSessionSlots({
  venue_id: 'venue-123',
  slot_date: '2026-03-30',
  session: 'morning'  // or 'evening'
})

// Time formatting
convertTo12Hour('06:00:00') // '6:00 AM'
formatSlotTimeRange('06:00:00', '07:00:00') // '6:00 AM - 7:00 AM'

// Calculate duration
getSlotDuration('06:00:00', '07:00:00') // 60 (minutes)
```

### Student Service (`src/services/student.ts`)

```typescript
// Get slots for a specific date/venue
await fetchSlots({
  venueId: 'venue-123',
  date: '2026-03-30'
})

// Book a slot
await createBooking({
  userId: 'user-123',
  userEmail: 'student@example.com',
  slotId: 'slot-456'
})

// Time formatting
formatSlotTime(slot) // '6:00 AM - 7:00 AM'
convertTo12Hour('06:00:00') // '6:00 AM'

// Calculate duration
getSlotDuration('06:00:00', '07:00:00') // 60 (minutes)
```

---

## 🎨 UI Components

### Admin Slot Management
**Component**: `src/pages/admin/ManageSlotsPage.tsx`

**Features**:
- ✅ Session dropdown (Morning/Evening)
- ✅ Date picker
- ✅ Venue selector
- ✅ Dynamic slot preview (5 or 7 cards)
- ✅ Duration badges "1 Hr"
- ✅ Results table with delete action
- ✅ Duplicate prevention

**Key Elements**:
```tsx
// Form inputs
<select value={slotSession}> // morning | evening
<input type="date" value={slotDate} />
<select value={slotVenueId}> // venue choices

// Slot preview
{sessionTemplateSlots.map(slot => (
  <article>
    {toTimeLabel(slot.start)} – {toTimeLabel(slot.end)}
    <span className="1 Hr Badge">1 Hr</span>
  </article>
))}

// Results table
Venue | Sport | Date | Session | Time | Duration | Status | Action
```

### Student Slot Booking
**Component**: `src/pages/student/BookSlotPage.tsx`

**Features**:
- ✅ Sport selector (Step 1)
- ✅ Venue selector (Step 2)
- ✅ Date picker (Step 3)
- ✅ Session-grouped slots (Step 4)
- ✅ Status badges (Available/Booked)
- ✅ Duration badges "1 Hr"
- ✅ One-click booking

**Key Elements**:
```tsx
// Session groups
🌅 Morning (6 AM - 11 AM)
  {slots.filter(s => s.session === 'morning').map(slot => (
    <article>
      {formatSlotTime(slot)} // "6:00 AM - 7:00 AM"
      <span className="1 Hr Badge">1 Hr</span>
      <StatusBadge status={slot.status} />
      <Button onClick={handleBook}>Book Now</Button>
    </article>
  ))}

🌆 Evening (4 PM - 11 PM)
  // Same layout for evening slots
```

---

## ⚠️ Slot Status Codes

| Status | Meaning | Color | Icon | Interaction |
|--------|---------|-------|------|-------------|
| `available` | Free to book | 🟢 Green | ✓ | Clickable |
| `booked` | Already reserved | 🔴 Red | ✗ | Disabled |
| `disabled` | Not available | ⚫ Gray | - | Disabled |

---

## 🔒 Safety Features

### ✔️ Duplicate Booking Prevention
```
BEFORE creating booking:
1. Query: SELECT COUNT(*) FROM bookings 
   WHERE slot_id = ? AND status IN ['pending', 'confirmed']
2. If count > 0: Throw error "This slot is already booked"
```

### ✔️ Duplicate Slot Creation Prevention
```
BEFORE creating slots for session:
1. Query: SELECT COUNT(*) FROM slots 
   WHERE venue_id = ? AND session = ? AND slot_date = ?
2. If count > 0: Throw error "Slots already created for this session"
```

### ✔️ Status Integrity
```
ON slot booking:
1. Insert booking record
2. Update slot status = 'booked'
3. Verify slot not double-booked via real-time sync
```

---

## 📊 Data Flow Diagram

### Admin Creating Slots
```
Form Submit
    ↓
Validate (venue, date, session)
    ↓
Check for duplicates
    ↓
Get slot templates (5 or 7)
    ↓
Batch insert to Supabase
    ↓
Success toast
    ↓
Refresh table
```

### Student Booking Slot
```
Click "Book Now"
    ↓
Show loading state
    ↓
Check if slot is available
    ↓
Insert booking record
    ↓
Update slot status to 'booked'
    ↓
Success message
    ↓
Auto-refresh slot list via real-time sync
```

---

## 🧪 Common Issues & Solutions

### Issue: Slots not appearing for student
**Solution**:
- Verify admin created slots for that date
- Check venue is linked to selected sport
- Ensure date format is correct (YYYY-MM-DD)
- Check browser console for Supabase errors

### Issue: "Slots already created for this session"
**Solution**:
- Slots already exist for that venue/date/session
- Admin can delete individual slots and re-create
- Or: Choose different date or session

### Issue: Student can still book booked slot
**Solution**:
- Real-time sync may be delayed
- Refresh page to see latest status
- Check browser network tab for SQL errors
- Verify `createBooking()` error handling

### Issue: Time format incorrect (showing 24-hour)
**Solution**:
- Ensure `formatSlotTime()` function is used
- Check `convertTo12Hour()` is properly converting
- Verify database stores times in 24-hour format (HH:MM:SS)

---

## 📱 Mobile Optimization

Both admin and student interfaces are fully responsive:
- **Mobile (sm)**: Single column, stacked forms
- **Tablet (md)**: 2-3 columns, better spacing
- **Desktop (lg/xl)**: Full 3+ column grids

```tsx
// Slot grid responsive
<div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {slots.map(slot => (<article>{...}</article>))}
</div>
```

---

## 🚀 Deployment Notes

### Database Requirements
- `slots` table with columns: `id`, `venue_id`, `session`, `start_time`, `end_time`, `slot_date`, `status`
- `bookings` table with columns: `id`, `slot_id`, `student_email`, `status`
- Foreign key: `bookings.slot_id` → `slots.id`

### Environment Variables
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your anonymous key

### Testing Before Production
- Create test slots in all sessions
- Test booking flow from student perspective
- Verify status updates in real-time
- Test concurrent bookings (2 students, 1 slot)
- Verify time zones are consistent

---

## 📖 Full Documentation
See [HOUR_BASED_SLOT_SYSTEM.md](./HOUR_BASED_SLOT_SYSTEM.md) for comprehensive documentation.

---

**Last Updated**: March 30, 2026  
**Version**: 1.0
