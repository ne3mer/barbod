-- Migration: Optional Supabase pg_cron Reference for Notification Worker Engine
-- NOTE: Vercel Cron (vercel.json) is the SINGLE primary production scheduler for Barbod Barber.
-- Do NOT run active pg_cron schedules simultaneously with Vercel Cron in production.

-- Optional helper function if external database triggering is desired in non-Vercel environments:
CREATE OR REPLACE FUNCTION public.process_due_notifications_cron()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Optional pg_cron schedule template (uncomment ONLY if hosting outside Vercel):
    -- SELECT cron.schedule('notification-worker-every-2-min', '*/2 * * * *', 'SELECT public.claim_due_notification_jobs(20);');
    NULL;
END;
$$;
