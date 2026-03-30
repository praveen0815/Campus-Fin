-- Adds canonical slot date support and booking user linkage.
-- Safe to run multiple times.

ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS slot_date DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS user_id UUID;

UPDATE public.slots
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
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.sync_slots_date_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.date := COALESCE(NEW.date, NEW.slot_date);
  NEW.slot_date := COALESCE(NEW.slot_date, NEW.date);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_slots_date_columns ON public.slots;
CREATE TRIGGER trg_sync_slots_date_columns
BEFORE INSERT OR UPDATE ON public.slots
FOR EACH ROW
EXECUTE FUNCTION public.sync_slots_date_columns();

CREATE INDEX IF NOT EXISTS idx_slots_date ON public.slots(date);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
