-- =====================================================
-- SlotSphere Admin Panel - Complete Database Setup
-- =====================================================

-- Create sports table
CREATE TABLE IF NOT EXISTS sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create slots table
CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  date DATE,
  slot_date DATE,
  session TEXT NOT NULL CHECK (session IN ('morning', 'evening')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE slots ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE slots ADD COLUMN IF NOT EXISTS slot_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE slots
SET
  date = COALESCE(date, slot_date),
  slot_date = COALESCE(slot_date, date)
WHERE date IS NULL OR slot_date IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_user_id_fkey'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION sync_slots_date_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.date := COALESCE(NEW.date, NEW.slot_date);
  NEW.slot_date := COALESCE(NEW.slot_date, NEW.date);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_slots_date_columns ON slots;
CREATE TRIGGER trg_sync_slots_date_columns
BEFORE INSERT OR UPDATE ON slots
FOR EACH ROW
EXECUTE FUNCTION sync_slots_date_columns();

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'error', 'info')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  is_read BOOLEAN NOT NULL DEFAULT FALSE
);

-- Insert 15 Sports
INSERT INTO sports (name) VALUES 
  ('Carrom'),
  ('Football'),
  ('Ball Badminton'),
  ('Handball'),
  ('Hockey'),
  ('Table Tennis'),
  ('Badminton'),
  ('Kho-Kho'),
  ('Chess'),
  ('Volleyball'),
  ('Kabaddi'),
  ('Basketball'),
  ('Tennis'),
  ('Silambam'),
  ('Throwball')
ON CONFLICT (name) DO NOTHING;

-- Insert Venues with Sport Mapping
-- Recreational Hall
INSERT INTO venues (sport_id, name, location) VALUES
  ((SELECT id FROM sports WHERE name = 'Carrom'), 'Recreational Hall', 'Recreational Hall (Boys)'),
  ((SELECT id FROM sports WHERE name = 'Chess'), 'Recreational Hall', 'Recreational Hall (Boys)')
ON CONFLICT DO NOTHING;

-- BIT Play Field
INSERT INTO venues (sport_id, name, location) VALUES
  ((SELECT id FROM sports WHERE name = 'Football'), 'BIT Play Field', 'BIT Play Field (Football Field)'),
  ((SELECT id FROM sports WHERE name = 'Ball Badminton'), 'BIT Play Field', 'BIT Play Field (Ball Badminton Court)'),
  ((SELECT id FROM sports WHERE name = 'Handball'), 'BIT Play Field', 'BIT Play Field (Handball Court)'),
  ((SELECT id FROM sports WHERE name = 'Hockey'), 'BIT Play Field', 'BIT Play Field (Hockey Court)'),
  ((SELECT id FROM sports WHERE name = 'Badminton'), 'BIT Play Field', 'BIT Play Field (Badminton Court)'),
  ((SELECT id FROM sports WHERE name = 'Kho-Kho'), 'BIT Play Field', 'BIT Play Field (Kho-Kho Court)')
ON CONFLICT DO NOTHING;

-- BIT Indoor
INSERT INTO venues (sport_id, name, location) VALUES
  ((SELECT id FROM sports WHERE name = 'Table Tennis'), 'BIT Indoor', 'BIT Indoor')
ON CONFLICT DO NOTHING;

-- Sports Complex
INSERT INTO venues (sport_id, name, location) VALUES
  ((SELECT id FROM sports WHERE name = 'Volleyball'), 'Sports Complex', 'Sports Complex (Volleyball Court)'),
  ((SELECT id FROM sports WHERE name = 'Throwball'), 'Sports Complex', 'Sports Complex (Volleyball Court)'),
  ((SELECT id FROM sports WHERE name = 'Kabaddi'), 'Sports Complex', 'Sports Complex (Kabaddi Court)'),
  ((SELECT id FROM sports WHERE name = 'Basketball'), 'Sports Complex', 'Sports Complex (Basketball Court)'),
  ((SELECT id FROM sports WHERE name = 'Tennis'), 'Sports Complex', 'Sports Complex (Tennis Court)'),
  ((SELECT id FROM sports WHERE name = 'Silambam'), 'Sports Complex', 'Sports Complex (Tennis Court)')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Creating Indexes for Better Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_venues_sport_id ON venues(sport_id);
CREATE INDEX IF NOT EXISTS idx_slots_venue_id ON slots(venue_id);
CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student_email ON bookings(student_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
