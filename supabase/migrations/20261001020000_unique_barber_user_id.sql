-- Migration: 20261001020000_unique_barber_user_id.sql
-- Guarantee 1:1 user_id relationship on barbers table

CREATE UNIQUE INDEX IF NOT EXISTS barbers_user_id_unique_idx ON public.barbers (user_id) WHERE user_id IS NOT NULL;
