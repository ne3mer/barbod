-- Core multi-tenant tables: profiles, businesses, and child entities.

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, 'Owner')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- businesses
-- ---------------------------------------------------------------------------
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL,
  description_en text,
  description_hu text,
  phone text,
  email text,
  address text,
  instagram_url text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT businesses_slug_format CHECK (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  CONSTRAINT businesses_slug_unique UNIQUE (slug)
);

CREATE INDEX businesses_owner_id_idx ON public.businesses (owner_id);

CREATE TRIGGER businesses_set_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Ownership helper (defined after businesses exists).
CREATE OR REPLACE FUNCTION public.is_business_owner(p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses AS b
    WHERE b.id = p_business_id
      AND b.owner_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.is_business_owner(uuid) IS
  'Returns true when auth.uid() owns the given business.';

REVOKE ALL ON FUNCTION public.is_business_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_business_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_owner(uuid) TO anon;

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  name_en text NOT NULL,
  name_hu text NOT NULL,
  description_en text,
  description_hu text,
  price numeric(12, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'HUF',
  duration_minutes integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT services_price_non_negative CHECK (price >= 0),
  CONSTRAINT services_duration_positive CHECK (duration_minutes > 0),
  CONSTRAINT services_currency_not_blank CHECK (char_length(trim(currency)) > 0)
);

CREATE INDEX services_business_id_idx ON public.services (business_id);
CREATE INDEX services_business_id_is_active_idx
  ON public.services (business_id, is_active);

CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- working_hours (multiple intervals per weekday supported)
-- day_of_week: 0=Sunday … 6=Saturday
-- Times are wall-clock local times for Europe/Budapest (not timestamptz).
-- ---------------------------------------------------------------------------
CREATE TABLE public.working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT working_hours_day_of_week_range CHECK (
    day_of_week >= 0 AND day_of_week <= 6
  ),
  CONSTRAINT working_hours_time_order CHECK (end_time > start_time)
);

CREATE INDEX working_hours_business_id_idx ON public.working_hours (business_id);
CREATE INDEX working_hours_business_id_day_idx
  ON public.working_hours (business_id, day_of_week);

CREATE TRIGGER working_hours_set_updated_at
  BEFORE UPDATE ON public.working_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- blocked_times
-- ---------------------------------------------------------------------------
CREATE TABLE public.blocked_times (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT blocked_times_range_valid CHECK (end_at > start_at)
);

CREATE INDEX blocked_times_business_id_idx ON public.blocked_times (business_id);
CREATE INDEX blocked_times_business_id_start_at_idx
  ON public.blocked_times (business_id, start_at);

CREATE TRIGGER blocked_times_set_updated_at
  BEFORE UPDATE ON public.blocked_times
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services (id) ON DELETE RESTRICT,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  notes text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT appointments_status_allowed CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'completed')
  ),
  CONSTRAINT appointments_range_valid CHECK (end_at > start_at),
  CONSTRAINT appointments_customer_name_not_blank CHECK (
    char_length(trim(customer_name)) > 0
  ),
  CONSTRAINT appointments_customer_phone_not_blank CHECK (
    char_length(trim(customer_phone)) > 0
  )
);

CREATE INDEX appointments_business_id_idx ON public.appointments (business_id);
CREATE INDEX appointments_business_id_start_at_idx
  ON public.appointments (business_id, start_at);
CREATE INDEX appointments_service_id_idx ON public.appointments (service_id);
CREATE INDEX appointments_business_id_status_idx
  ON public.appointments (business_id, status);

-- Prevent overlapping active bookings for the same business (DB-level).
-- Cancelled/completed do not block new bookings; pending/confirmed do.
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    business_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (status IN ('pending', 'confirmed'));

CREATE TRIGGER appointments_set_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Ensure service belongs to business; duration matches; public cannot book inactive services.
CREATE OR REPLACE FUNCTION public.validate_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  svc public.services%ROWTYPE;
BEGIN
  SELECT *
  INTO svc
  FROM public.services
  WHERE id = NEW.service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service not found';
  END IF;

  IF svc.business_id IS DISTINCT FROM NEW.business_id THEN
    RAISE EXCEPTION 'service_id does not belong to business_id';
  END IF;

  IF NEW.end_at IS DISTINCT FROM (NEW.start_at + make_interval(mins => svc.duration_minutes)) THEN
    RAISE EXCEPTION 'Appointment end_at must equal start_at + service duration_minutes';
  END IF;

  IF TG_OP = 'INSERT'
     AND NOT svc.is_active
     AND NOT public.is_business_owner(NEW.business_id) THEN
    RAISE EXCEPTION 'Cannot book an inactive service';
  END IF;

  IF TG_OP = 'INSERT'
     AND NEW.status IS DISTINCT FROM 'pending'
     AND NOT public.is_business_owner(NEW.business_id) THEN
    RAISE EXCEPTION 'Public bookings must start with status pending';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER appointments_validate
  BEFORE INSERT OR UPDATE OF business_id, service_id, start_at, end_at, status
  ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_appointment();

-- ---------------------------------------------------------------------------
-- portfolio_items
-- ---------------------------------------------------------------------------
CREATE TABLE public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  title_en text,
  title_hu text,
  image_path text NOT NULL,
  category text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT portfolio_items_image_path_not_blank CHECK (
    char_length(trim(image_path)) > 0
  ),
  CONSTRAINT portfolio_items_category_allowed CHECK (
    category IS NULL
    OR category IN ('Haircuts', 'Coloring', 'Styling', 'Other')
  )
);

CREATE INDEX portfolio_items_business_id_idx ON public.portfolio_items (business_id);
CREATE INDEX portfolio_items_business_id_sort_order_idx
  ON public.portfolio_items (business_id, sort_order);
CREATE INDEX portfolio_items_business_id_visible_idx
  ON public.portfolio_items (business_id, is_visible);

CREATE TRIGGER portfolio_items_set_updated_at
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
