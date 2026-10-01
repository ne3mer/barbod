-- Migration: Notification Jobs System for Transactional Email & Reminders

-- Create notification_jobs table
CREATE TABLE IF NOT EXISTS public.notification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    barber_id UUID REFERENCES public.barbers(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    recipient_email TEXT NOT NULL,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('customer', 'barber', 'owner')),
    notification_type TEXT NOT NULL CHECK (
        notification_type IN (
            'appointment_booked',
            'appointment_confirmed',
            'appointment_cancelled',
            'appointment_rescheduled',
            'customer_reminder_24h',
            'customer_reminder_2h',
            'barber_new_appointment',
            'barber_cancellation',
            'barber_reschedule',
            'barber_daily_digest'
        )
    ),
    scheduled_for TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMPTZ,
    provider_message_id TEXT,
    locale TEXT NOT NULL DEFAULT 'hu' CHECK (locale IN ('en', 'hu')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying by worker and admin dashboard
CREATE INDEX IF NOT EXISTS idx_notification_jobs_status_scheduled ON public.notification_jobs(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_appointment_id ON public.notification_jobs(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_barber_id ON public.notification_jobs(barber_id);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_business_id ON public.notification_jobs(business_id);

-- Idempotency protection: UNIQUE constraint for appointment-specific notifications
CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_appointment_notification 
ON public.notification_jobs (appointment_id, recipient_email, notification_type);


-- Idempotency protection for daily digests (one per barber per day)
CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_barber_daily_digest
ON public.notification_jobs (barber_id, notification_type, (CAST(scheduled_for AT TIME ZONE 'UTC' AS DATE)))
WHERE notification_type = 'barber_daily_digest' AND barber_id IS NOT NULL;


-- RLS Policies
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;

-- Owner can view and manage all notification jobs for their business
CREATE POLICY "Owners can manage notification jobs for their business"
ON public.notification_jobs
FOR ALL
TO authenticated
USING (
    business_id IN (
        SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    business_id IN (
        SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
);

-- Barbers can view notification jobs assigned to them
CREATE POLICY "Barbers can view their assigned notification jobs"
ON public.notification_jobs
FOR SELECT
TO authenticated
USING (
    barber_id IN (
        SELECT id FROM public.barbers WHERE user_id = auth.uid()
    )
);

-- RPC for Atomic Job Claiming (Concurrency & Idempotency)
CREATE OR REPLACE FUNCTION public.claim_due_notification_jobs(
    p_limit INT DEFAULT 10
)
RETURNS SETOF public.notification_jobs
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_claimed_ids UUID[];
BEGIN
    -- Select pending or retryable failed jobs due for execution
    SELECT ARRAY_AGG(id) INTO v_claimed_ids
    FROM (
        SELECT id
        FROM public.notification_jobs
        WHERE (status = 'pending' OR (status = 'failed' AND attempts < 3))
          AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    ) sub;

    IF v_claimed_ids IS NULL OR array_length(v_claimed_ids, 1) IS NULL THEN
        RETURN;
    END IF;

    -- Atomically set status to processing and increment attempts
    RETURN QUERY
    UPDATE public.notification_jobs
    SET 
        status = 'processing',
        attempts = attempts + 1,
        updated_at = NOW()
    WHERE id = ANY(v_claimed_ids)
    RETURNING *;
END;
$$;
