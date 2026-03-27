## 🚀 Quick Start Guide

### Step 1: Database Setup (2 minutes)

1. Go to your [Supabase Dashboard](https://supabase.com)
2. Open **SQL Editor**
3. Create a new query
4. Copy all content from `supabase/complete_setup.sql`
5. Paste into SQL Editor
6. Click **Run** (execute the query)
7. Verify tables are created in the **Table Editor**

✅ **Result**: 4 tables created with 15 sports and 15 venues

---

### Step 2: Login to Admin Panel (1 minute)

1. Open browser to `http://localhost:5174/`
2. Click on **Admin** tab
3. Enter credentials:
   - **Email**: `admin@slotsphere.local`
   - **Password**: `Admin@123`
4. Click **Login**
5. You'll be redirected to **Dashboard**

✅ **Result**: Logged into admin panel

---

### Step 3: Explore Each Section (5 minutes)

#### Dashboard
- View total counts
- Check system status
- See quick start tips

#### Manage Sports
- View all 15 preloaded sports
- Add new sports (optional)
- Delete sports

#### Manage Venues
- See 15 venues linked to sports
- Edit venue details
- Add new venues
- View sport-venue relationships

#### Slot Management
- Create time slots for venues
- Choose morning or evening session
- Set multiple slots per venue

#### Bookings
- View booking statistics
- See booking details (email, sport, venue, time)
- Confirm or cancel bookings

#### Analytics
- See booking rates
- Top sports by bookings
- Top venues by bookings
- Performance metrics

---

### Step 4: Test Create Workflow (10 minutes)

#### Example: Add New Sport & Venue

1. Go to **Manage Sports**
2. Type sport name: `Cricket`
3. Click **Add Sport**
4. Go to **Manage Venues**
5. Select `Cricket` from dropdown
6. Name: `Cricket Ground`
7. Location: `Sports Complex`
8. Click **Add Venue**
9. Go to **Slot Management**
10. Select `Cricket Ground`
11. Choose `Morning` session
12. Click **Create Slot**

✅ **Result**: Successfully created sport, venue, and slot

---

### Step 5: Explore Analytics (5 minutes)

1. Go to **Analytics**
2. View key metrics:
   - Total bookings
   - Booking rate
   - Available slots
   - Active sports

3. Scroll down to see:
   - Top sports by bookings
   - Top venues by bookings
   - Progress bars for each

---

## 📱 Page Layout

### Sidebar Navigation (Left)
```
┌─────────────────────┐
│  🏐 SlotSphere      │
│  Admin Portal       │
├─────────────────────┤
│ 📊 Dashboard        │
│ 🏐 Manage Sports    │
│ 📍 Manage Venues    │
│ ⏰ Slot Management  │
│ 📖 Bookings         │
│ 📈 Analytics        │
├─────────────────────┤
│ [User Avatar] Email │
│ [Logout Button]     │
└─────────────────────┘
```

### Top Bar
- Welcome message with user name
- Description of each section

### Main Content Area
- Forms for adding/editing
- Tables showing data
- Stats cards with metrics
- Status badges and icons

---

## 🎯 Common Tasks

### Add a New Sport
1. Go to **Manage Sports**
2. Type sport name in input box
3. Click **Add Sport**
4. ✅ Sport added

### Create a Venue
1. Go to **Manage Venues**
2. Select sport from dropdown
3. Enter venue name
4. Enter location
5. Click **Add Venue**
6. ✅ Venue created

### Create Time Slots
1. Go to **Slot Management**
2. Select venue
3. Select session (Morning/Evening)
4. Click **Create Slot**
5. Repeat for more slots
6. ✅ Slots created

### Manage Bookings
1. Go to **Bookings**
2. See all bookings list
3. Click **Confirm** to approve
4. Click **Cancel** to reject
5. ✅ Status updated

### View Statistics
1. Go to **Analytics**
2. See booking rate %
3. View top sports/venues
4. Check slot availability
5. ✅ Insights displayed

---

## 🔑 Key Information

### Demo Admin Login
- Email: `admin@slotsphere.local`
- Password: `Admin@123`

### Default Session Times
- **Morning**: 6:00 AM - 11:00 AM
- **Evening**: 4:00 PM - 11:00 PM

### Booking Status Options
- **Pending**: Awaiting admin confirmation
- **Confirmed**: Booking approved
- **Cancelled**: Booking rejected

### Preloaded Sports (15)
Carrom, Football, Ball Badminton, Handball, Hockey, Table Tennis, Badminton, Kho-Kho, Chess, Volleyball, Kabaddi, Basketball, Tennis, Silambam, Throwball

---

## ⚠️ Important Notes

### Cannot Delete Sports If:
- Venues are linked to that sport
- Must remove venues first

### Cannot Delete Venues If:
- Time slots are created for that venue
- Must delete slots first

### Booking Status Changes:
- Can change from Pending → Confirmed/Cancelled
- Can change between Confirmed/Cancelled

---

## 💡 Tips & Tricks

1. **Use Categories**: Organize sports by venue type
2. **Bulk Operations**: Create all slots for a venue in one go
3. **Check Analytics**: See what's popular before adding more
4. **Monitor Bookings**: Confirm bookings regularly to keep system up-to-date
5. **Sort by Date**: Newest bookings appear first

---

## 🆘 Troubleshooting

### Problem: Can't login
**Solution**: 
- Check email format: `admin@slotsphere.local`
- Check password: `Admin@123`
- Check caps lock

### Problem: Dashboard shows 0 sports
**Solution**:
- Run SQL setup from `supabase/complete_setup.sql`
- Check Supabase tables are created
- Refresh page

### Problem: Can't create venues
**Solution**:
- Make sure sports exist first
- Check that sport is selected in dropdown
- Verify Supabase connection

### Problem: Page doesn't load
**Solution**:
- Check dev server is running: `npm run dev`
- Open `http://localhost:5174/`
- Check browser console for errors

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `ADMIN_SETUP.md` | Complete admin panel documentation |
| `QUICKSTART.md` | This file - quick reference |
| `supabase/complete_setup.sql` | Database schema & data |
| `src/pages/admin/*Page.tsx` | Admin page components |
| `src/components/AdminLayout.tsx` | Sidebar layout |
| `src/services/admin.ts` | Supabase API calls |

---

## ✅ Checklist

Before going live:

- [ ] Run SQL setup
- [ ] Test admin login
- [ ] Create sample sports/venues
- [ ] Create sample time slots
- [ ] Test booking status updates
- [ ] Check all pages load correctly
- [ ] Verify responsive design on mobile
- [ ] Test error handling
- [ ] Review analytics data

---

## 🎉 Success!

You now have a fully functional admin panel for managing campus sports bookings. Use this quick start guide to get up and running, then refer to `ADMIN_SETUP.md` for more detailed information.

**Need help?** Check the troubleshooting section or review the code in `src/pages/admin/` for implementation details.

Happy booking! 🏐⚽🎾
