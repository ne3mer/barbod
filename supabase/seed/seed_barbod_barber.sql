-- Manual seed helper for the first Barbod Barber business.
-- DO NOT run this as an automatic migration: it requires a real auth user UUID.
--
-- Usage (SQL Editor or psql), after the owner has signed up once:
--
--   1. Find the owner profile id:
--        SELECT id, full_name FROM public.profiles;
--   2. Replace :owner_id below with that UUID, then run the script.
--
-- Working hours default (Europe/Budapest wall-clock):
--   Monday–Saturday 15:00–20:30
--   Sunday closed (no rows)

DO $$
DECLARE
  v_owner_id uuid := '2bdf4ebb-54bf-42c5-a39e-5216a05b6759'; -- profiles.id / auth.users.id
  v_business_id uuid;
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION
      'Set v_owner_id to a real profiles.id before seeding. Do not invent auth users.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_owner_id) THEN
    RAISE EXCEPTION 'Owner profile % not found. Sign up first.', v_owner_id;
  END IF;

  INSERT INTO public.businesses (
    owner_id,
    name,
    slug,
    description_en,
    description_hu,
    phone,
    email,
    address
  )
  VALUES (
    v_owner_id,
    'Barbod Barber',
    'barbod-barber',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name
  RETURNING id INTO v_business_id;

  IF v_business_id IS NULL THEN
    SELECT id INTO v_business_id
    FROM public.businesses
    WHERE slug = 'barbod-barber';
  END IF;

  -- Replace default hours only when none exist yet for this business.
  IF NOT EXISTS (
    SELECT 1 FROM public.working_hours WHERE business_id = v_business_id
  ) THEN
    INSERT INTO public.working_hours (
      business_id,
      day_of_week,
      start_time,
      end_time,
      is_active
    )
    SELECT
      v_business_id,
      d.day_of_week,
      TIME '15:00',
      TIME '20:30',
      true
    FROM (
      VALUES
        (1), -- Monday
        (2), -- Tuesday
        (3), -- Wednesday
        (4), -- Thursday
        (5), -- Friday
        (6)  -- Saturday
    ) AS d(day_of_week);
  END IF;
END $$;
