-- Explicit grants for Supabase API roles (reproducible across local/remote).

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON TABLE public.businesses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.businesses TO authenticated;

GRANT SELECT ON TABLE public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.services TO authenticated;

GRANT SELECT ON TABLE public.working_hours TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.working_hours TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.blocked_times TO authenticated;

GRANT INSERT ON TABLE public.appointments TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.appointments TO authenticated;

GRANT SELECT ON TABLE public.portfolio_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.portfolio_items TO authenticated;

GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- Sequences / defaults (uuid generated via gen_random_uuid; no serials required).
