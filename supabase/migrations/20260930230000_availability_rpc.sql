-- RPC function for public availability calculations.
-- Bypasses direct SELECT on private appointments and blocked_times tables
-- while returning ONLY anonymized start_at and end_at timestamps.

CREATE OR REPLACE FUNCTION public.get_occupied_intervals(
  p_business_id uuid,
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
  -- Verify target business exists
  IF NOT EXISTS (SELECT 1 FROM public.businesses WHERE id = p_business_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  -- 1. Active appointments (pending & confirmed block availability)
  SELECT a.start_at, a.end_at
  FROM public.appointments AS a
  WHERE a.business_id = p_business_id
    AND a.status IN ('pending', 'confirmed')
    AND a.start_at < p_end_at
    AND a.end_at > p_start_at

  UNION ALL

  -- 2. Internal blocked times
  SELECT b.start_at, b.end_at
  FROM public.blocked_times AS b
  WHERE b.business_id = p_business_id
    AND b.start_at < p_end_at
    AND b.end_at > p_start_at;
END;
$$;

COMMENT ON FUNCTION public.get_occupied_intervals(uuid, timestamptz, timestamptz) IS
  'Returns anonymized start_at and end_at timestamps for active appointments and blocked times without exposing customer PII or notes.';

REVOKE ALL ON FUNCTION public.get_occupied_intervals(uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_occupied_intervals(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_occupied_intervals(uuid, timestamptz, timestamptz) TO anon;
