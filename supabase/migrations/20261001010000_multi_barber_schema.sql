-- Migration: 20261001010000_multi_barber_schema.sql
-- Multi-barber & multi-staff platform evolution

-- 1. Create barbers table
CREATE TABLE IF NOT EXISTS public.barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  name text NOT NULL,
  profile_photo_url text,
  bio_en text,
  bio_hu text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS barbers_business_id_idx ON public.barbers (business_id);
CREATE INDEX IF NOT EXISTS barbers_user_id_idx ON public.barbers (user_id);
CREATE INDEX IF NOT EXISTS barbers_business_id_is_active_idx ON public.barbers (business_id, is_active);

CREATE TRIGGER barbers_set_updated_at
  BEFORE UPDATE ON public.barbers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. Create barber_services junction table
CREATE TABLE IF NOT EXISTS public.barber_services (
  barber_id uuid NOT NULL REFERENCES public.barbers (id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  PRIMARY KEY (barber_id, service_id)
);

CREATE INDEX IF NOT EXISTS barber_services_service_id_idx ON public.barber_services (service_id);

-- 3. Add barber_id (nullable initial) to working_hours, blocked_times, appointments, portfolio_items
ALTER TABLE public.working_hours ADD COLUMN IF NOT EXISTS barber_id uuid REFERENCES public.barbers (id) ON DELETE CASCADE;
ALTER TABLE public.blocked_times ADD COLUMN IF NOT EXISTS barber_id uuid REFERENCES public.barbers (id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS barber_id uuid REFERENCES public.barbers (id) ON DELETE RESTRICT;
ALTER TABLE public.portfolio_items ADD COLUMN IF NOT EXISTS barber_id uuid REFERENCES public.barbers (id) ON DELETE CASCADE;

-- 4. Safely create primary barber for each existing business
INSERT INTO public.barbers (id, business_id, user_id, name, bio_en, bio_hu, is_active, display_order)
SELECT
  gen_random_uuid(),
  b.id,
  b.owner_id,
  COALESCE(p.full_name, 'Barbod Barber'),
  b.description_en,
  b.description_hu,
  true,
  0
FROM public.businesses b
LEFT JOIN public.profiles p ON p.id = b.owner_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.barbers bar WHERE bar.business_id = b.id
);

-- 5. Backfill all existing records
-- Backfill working_hours
UPDATE public.working_hours wh
SET barber_id = bar.id
FROM public.barbers bar
WHERE wh.business_id = bar.business_id AND wh.barber_id IS NULL;

-- Backfill blocked_times
UPDATE public.blocked_times bt
SET barber_id = bar.id
FROM public.barbers bar
WHERE bt.business_id = bar.business_id AND bt.barber_id IS NULL;

-- Backfill appointments
UPDATE public.appointments a
SET barber_id = bar.id
FROM public.barbers bar
WHERE a.business_id = bar.business_id AND a.barber_id IS NULL;

-- Backfill portfolio_items
UPDATE public.portfolio_items pi
SET barber_id = bar.id
FROM public.barbers bar
WHERE pi.business_id = bar.business_id AND pi.barber_id IS NULL;

-- Backfill barber_services (assign existing services to the primary barber)
INSERT INTO public.barber_services (barber_id, service_id)
SELECT bar.id, s.id
FROM public.services s
JOIN public.barbers bar ON bar.business_id = s.business_id
ON CONFLICT DO NOTHING;

-- 6. Enforce NOT NULL constraints (after backfill)
ALTER TABLE public.working_hours ALTER COLUMN barber_id SET NOT NULL;
ALTER TABLE public.blocked_times ALTER COLUMN barber_id SET NOT NULL;
ALTER TABLE public.appointments ALTER COLUMN barber_id SET NOT NULL;
ALTER TABLE public.portfolio_items ALTER COLUMN barber_id SET NOT NULL;

-- 7. Add indexes for barber_id
CREATE INDEX IF NOT EXISTS working_hours_barber_id_idx ON public.working_hours (barber_id);
CREATE INDEX IF NOT EXISTS blocked_times_barber_id_idx ON public.blocked_times (barber_id);
CREATE INDEX IF NOT EXISTS appointments_barber_id_idx ON public.appointments (barber_id);
CREATE INDEX IF NOT EXISTS portfolio_items_barber_id_idx ON public.portfolio_items (barber_id);

-- 8. Replace business-level overlap constraint with barber-level overlap protection
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_no_overlap;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    barber_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (status IN ('pending', 'confirmed'));

-- 9. Helper functions for RLS
CREATE OR REPLACE FUNCTION public.get_authenticated_barber_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.barbers
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_barber_owner_or_self(p_barber_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.barbers AS bar
    JOIN public.businesses AS b ON b.id = bar.business_id
    WHERE bar.id = p_barber_id
      AND (b.owner_id = auth.uid() OR bar.user_id = auth.uid())
  );
$$;

-- 10. Update validate_appointment trigger function
CREATE OR REPLACE FUNCTION public.validate_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  svc public.services%ROWTYPE;
  bar public.barbers%ROWTYPE;
BEGIN
  -- Verify service exists
  SELECT * INTO svc FROM public.services WHERE id = NEW.service_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;

  IF svc.business_id IS DISTINCT FROM NEW.business_id THEN
    RAISE EXCEPTION 'service_id does not belong to business_id';
  END IF;

  -- Verify barber exists and belongs to business
  SELECT * INTO bar FROM public.barbers WHERE id = NEW.barber_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Barber not found';
  END IF;

  IF bar.business_id IS DISTINCT FROM NEW.business_id THEN
    RAISE EXCEPTION 'barber_id does not belong to business_id';
  END IF;

  -- Verify barber offers service
  IF NOT EXISTS (
    SELECT 1 FROM public.barber_services
    WHERE barber_id = NEW.barber_id AND service_id = NEW.service_id
  ) THEN
    RAISE EXCEPTION 'Selected barber does not offer this service';
  END IF;

  IF NEW.end_at IS DISTINCT FROM (NEW.start_at + make_interval(mins => svc.duration_minutes)) THEN
    RAISE EXCEPTION 'Appointment end_at must equal start_at + service duration_minutes';
  END IF;

  -- Public checks
  IF TG_OP = 'INSERT' AND NOT public.is_business_owner(NEW.business_id) THEN
    IF NOT svc.is_active THEN
      RAISE EXCEPTION 'Cannot book an inactive service';
    END IF;

    IF NOT bar.is_active THEN
      RAISE EXCEPTION 'Cannot book an inactive barber';
    END IF;

    IF NEW.status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'Public bookings must start with status pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 11. Enable and Force RLS on new tables
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.barber_services FORCE ROW LEVEL SECURITY;

-- 12. RLS Policies for barbers
CREATE POLICY barbers_public_select_active
  ON public.barbers FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_barber_owner_or_self(id));

CREATE POLICY barbers_owner_insert
  ON public.barbers FOR INSERT TO authenticated
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY barbers_owner_or_self_update
  ON public.barbers FOR UPDATE TO authenticated
  USING (public.is_barber_owner_or_self(id))
  WITH CHECK (public.is_barber_owner_or_self(id));

CREATE POLICY barbers_owner_delete
  ON public.barbers FOR DELETE TO authenticated
  USING (public.is_business_owner(business_id));

-- 13. RLS Policies for barber_services
CREATE POLICY barber_services_public_select
  ON public.barber_services FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY barber_services_owner_or_self_manage
  ON public.barber_services FOR ALL TO authenticated
  USING (public.is_barber_owner_or_self(barber_id))
  WITH CHECK (public.is_barber_owner_or_self(barber_id));

-- 14. Update RLS policies for working_hours, blocked_times, appointments, portfolio_items
DROP POLICY IF EXISTS working_hours_public_select_active ON public.working_hours;
DROP POLICY IF EXISTS working_hours_owner_insert ON public.working_hours;
DROP POLICY IF EXISTS working_hours_owner_update ON public.working_hours;
DROP POLICY IF EXISTS working_hours_owner_delete ON public.working_hours;

CREATE POLICY working_hours_public_select_active
  ON public.working_hours FOR SELECT TO anon, authenticated
  USING (is_active = true OR public.is_barber_owner_or_self(barber_id));

CREATE POLICY working_hours_owner_or_self_insert
  ON public.working_hours FOR INSERT TO authenticated
  WITH CHECK (public.is_barber_owner_or_self(barber_id));

CREATE POLICY working_hours_owner_or_self_update
  ON public.working_hours FOR UPDATE TO authenticated
  USING (public.is_barber_owner_or_self(barber_id))
  WITH CHECK (public.is_barber_owner_or_self(barber_id));

CREATE POLICY working_hours_owner_or_self_delete
  ON public.working_hours FOR DELETE TO authenticated
  USING (public.is_barber_owner_or_self(barber_id));

-- blocked_times:
DROP POLICY IF EXISTS blocked_times_owner_select ON public.blocked_times;
DROP POLICY IF EXISTS blocked_times_owner_insert ON public.blocked_times;
DROP POLICY IF EXISTS blocked_times_owner_update ON public.blocked_times;
DROP POLICY IF EXISTS blocked_times_owner_delete ON public.blocked_times;

CREATE POLICY blocked_times_owner_or_self_select
  ON public.blocked_times FOR SELECT TO authenticated
  USING (public.is_barber_owner_or_self(barber_id));

CREATE POLICY blocked_times_owner_or_self_insert
  ON public.blocked_times FOR INSERT TO authenticated
  WITH CHECK (public.is_barber_owner_or_self(barber_id));

CREATE POLICY blocked_times_owner_or_self_update
  ON public.blocked_times FOR UPDATE TO authenticated
  USING (public.is_barber_owner_or_self(barber_id))
  WITH CHECK (public.is_barber_owner_or_self(barber_id));

CREATE POLICY blocked_times_owner_or_self_delete
  ON public.blocked_times FOR DELETE TO authenticated
  USING (public.is_barber_owner_or_self(barber_id));

-- appointments:
DROP POLICY IF EXISTS appointments_public_insert ON public.appointments;
DROP POLICY IF EXISTS appointments_owner_select ON public.appointments;
DROP POLICY IF EXISTS appointments_owner_insert ON public.appointments;
DROP POLICY IF EXISTS appointments_owner_update ON public.appointments;
DROP POLICY IF EXISTS appointments_owner_delete ON public.appointments;

CREATE POLICY appointments_public_insert
  ON public.appointments FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.barbers b
      JOIN public.services s ON s.business_id = b.business_id
      JOIN public.barber_services bs ON bs.barber_id = b.id AND bs.service_id = s.id
      WHERE b.id = appointments.barber_id
        AND s.id = appointments.service_id
        AND b.business_id = appointments.business_id
        AND b.is_active = true
        AND s.is_active = true
    )
  );

CREATE POLICY appointments_owner_or_self_select
  ON public.appointments FOR SELECT TO authenticated
  USING (public.is_barber_owner_or_self(barber_id));

CREATE POLICY appointments_owner_or_self_insert
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (public.is_barber_owner_or_self(barber_id));

CREATE POLICY appointments_owner_or_self_update
  ON public.appointments FOR UPDATE TO authenticated
  USING (public.is_barber_owner_or_self(barber_id))
  WITH CHECK (public.is_barber_owner_or_self(barber_id));

CREATE POLICY appointments_owner_or_self_delete
  ON public.appointments FOR DELETE TO authenticated
  USING (public.is_barber_owner_or_self(barber_id));

-- portfolio_items:
DROP POLICY IF EXISTS portfolio_items_public_select_visible ON public.portfolio_items;
DROP POLICY IF EXISTS portfolio_items_owner_insert ON public.portfolio_items;
DROP POLICY IF EXISTS portfolio_items_owner_update ON public.portfolio_items;
DROP POLICY IF EXISTS portfolio_items_owner_delete ON public.portfolio_items;

CREATE POLICY portfolio_items_public_select_visible
  ON public.portfolio_items FOR SELECT TO anon, authenticated
  USING (is_visible = true OR public.is_barber_owner_or_self(barber_id));

CREATE POLICY portfolio_items_owner_or_self_insert
  ON public.portfolio_items FOR INSERT TO authenticated
  WITH CHECK (public.is_barber_owner_or_self(barber_id));

CREATE POLICY portfolio_items_owner_or_self_update
  ON public.portfolio_items FOR UPDATE TO authenticated
  USING (public.is_barber_owner_or_self(barber_id))
  WITH CHECK (public.is_barber_owner_or_self(barber_id));

CREATE POLICY portfolio_items_owner_or_self_delete
  ON public.portfolio_items FOR DELETE TO authenticated
  USING (public.is_barber_owner_or_self(barber_id));

-- 15. Update RPC function get_occupied_intervals to be barber-scoped
DROP FUNCTION IF EXISTS public.get_occupied_intervals(uuid, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION public.get_occupied_intervals(
  p_barber_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz
)
RETURNS TABLE (
  start_at timestamptz,
  end_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Verify target barber exists
  IF NOT EXISTS (SELECT 1 FROM public.barbers WHERE id = p_barber_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  -- 1. Active appointments for this barber (pending & confirmed block availability)
  SELECT a.start_at, a.end_at
  FROM public.appointments AS a
  WHERE a.barber_id = p_barber_id
    AND a.status IN ('pending', 'confirmed')
    AND a.start_at < p_end_at
    AND a.end_at > p_start_at

  UNION ALL

  -- 2. Internal blocked times for this barber
  SELECT b.start_at, b.end_at
  FROM public.blocked_times AS b
  WHERE b.barber_id = p_barber_id
    AND b.start_at < p_end_at
    AND b.end_at > p_start_at;
END;
$$;

COMMENT ON FUNCTION public.get_occupied_intervals(uuid, timestamptz, timestamptz) IS
  'Returns anonymized start_at and end_at timestamps for active appointments and blocked times for a given barber.';

REVOKE ALL ON FUNCTION public.get_occupied_intervals(uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_occupied_intervals(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_occupied_intervals(uuid, timestamptz, timestamptz) TO anon;
