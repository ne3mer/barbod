-- Row Level Security for multi-tenant isolation.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well (defense in depth).
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.businesses FORCE ROW LEVEL SECURITY;
ALTER TABLE public.services FORCE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours FORCE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_times FORCE ROW LEVEL SECURITY;
ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Inserts come from handle_new_user (SECURITY DEFINER); no direct client insert policy.

-- ---------------------------------------------------------------------------
-- businesses
-- Public can read businesses (needed for slug-based public site / booking).
-- Owners manage their own rows.
-- ---------------------------------------------------------------------------
CREATE POLICY businesses_public_select
  ON public.businesses
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY businesses_owner_insert
  ON public.businesses
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY businesses_owner_update
  ON public.businesses
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY businesses_owner_delete
  ON public.businesses
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
CREATE POLICY services_public_select_active
  ON public.services
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR public.is_business_owner(business_id)
  );

CREATE POLICY services_owner_insert
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY services_owner_update
  ON public.services
  FOR UPDATE
  TO authenticated
  USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY services_owner_delete
  ON public.services
  FOR DELETE
  TO authenticated
  USING (public.is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- working_hours
-- ---------------------------------------------------------------------------
CREATE POLICY working_hours_public_select_active
  ON public.working_hours
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR public.is_business_owner(business_id)
  );

CREATE POLICY working_hours_owner_insert
  ON public.working_hours
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY working_hours_owner_update
  ON public.working_hours
  FOR UPDATE
  TO authenticated
  USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY working_hours_owner_delete
  ON public.working_hours
  FOR DELETE
  TO authenticated
  USING (public.is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- blocked_times (owner only — not exposed to public clients)
-- Availability using blocked times should be computed server-side in later phases.
-- ---------------------------------------------------------------------------
CREATE POLICY blocked_times_owner_select
  ON public.blocked_times
  FOR SELECT
  TO authenticated
  USING (public.is_business_owner(business_id));

CREATE POLICY blocked_times_owner_insert
  ON public.blocked_times
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY blocked_times_owner_update
  ON public.blocked_times
  FOR UPDATE
  TO authenticated
  USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY blocked_times_owner_delete
  ON public.blocked_times
  FOR DELETE
  TO authenticated
  USING (public.is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- appointments
-- Public: insert pending bookings only.
-- Owners: full manage for their business.
-- No public SELECT (protects customer PII).
-- ---------------------------------------------------------------------------
CREATE POLICY appointments_public_insert
  ON public.appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.services AS s
      WHERE s.id = service_id
        AND s.business_id = business_id
        AND s.is_active = true
    )
  );

CREATE POLICY appointments_owner_select
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (public.is_business_owner(business_id));

CREATE POLICY appointments_owner_insert
  ON public.appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY appointments_owner_update
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY appointments_owner_delete
  ON public.appointments
  FOR DELETE
  TO authenticated
  USING (public.is_business_owner(business_id));

-- ---------------------------------------------------------------------------
-- portfolio_items
-- ---------------------------------------------------------------------------
CREATE POLICY portfolio_items_public_select_visible
  ON public.portfolio_items
  FOR SELECT
  TO anon, authenticated
  USING (
    is_visible = true
    OR public.is_business_owner(business_id)
  );

CREATE POLICY portfolio_items_owner_insert
  ON public.portfolio_items
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY portfolio_items_owner_update
  ON public.portfolio_items
  FOR UPDATE
  TO authenticated
  USING (public.is_business_owner(business_id))
  WITH CHECK (public.is_business_owner(business_id));

CREATE POLICY portfolio_items_owner_delete
  ON public.portfolio_items
  FOR DELETE
  TO authenticated
  USING (public.is_business_owner(business_id));
