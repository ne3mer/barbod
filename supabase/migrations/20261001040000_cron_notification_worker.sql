-- Migration: Supabase pg_cron Schedule for Notification Worker Engine

-- Enable pg_cron extension if supported by your Supabase PostgreSQL instance
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Create pg_cron schedule if pg_cron extension is available
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'notification-worker-every-2-min',
            '*/2 * * * *',
            'SELECT public.claim_due_notification_jobs(20);'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron not enabled on this instance. Use Vercel Cron (vercel.json) as primary scheduler.';
END;
$$;
