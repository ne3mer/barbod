-- Migration: 20261001020000_storage_barber_profiles.sql
-- Storage bucket and policies for barber profile photos.
-- Object path convention: {business_id}/{barber_id}/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barber-profiles',
  'barber-profiles',
  true,
  5242880, -- 5 MiB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Extract barber_id from object path: {business_id}/{barber_id}/{filename}
CREATE OR REPLACE FUNCTION public.barber_profile_object_barber_id(object_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parts text[];
  barber_id uuid;
BEGIN
  parts := string_to_array(object_name, '/');

  IF array_length(parts, 1) < 3 THEN
    RETURN NULL;
  END IF;

  BEGIN
    IF array_length(parts, 1) >= 4 AND parts[1] = 'barber-profiles' THEN
      barber_id := parts[3]::uuid;
    ELSE
      barber_id := parts[2]::uuid;
    END IF;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NULL;
  END;

  RETURN barber_id;
END;
$$;

COMMENT ON FUNCTION public.barber_profile_object_barber_id(text) IS
  'Parses barber UUID from profile photo storage path {business_id}/{barber_id}/{filename}.';

REVOKE ALL ON FUNCTION public.barber_profile_object_barber_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.barber_profile_object_barber_id(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.barber_profile_object_barber_id(text) TO anon;

-- Storage Policies for barber-profiles bucket

DROP POLICY IF EXISTS barber_profiles_storage_public_select ON storage.objects;
DROP POLICY IF EXISTS barber_profiles_storage_owner_or_self_insert ON storage.objects;
DROP POLICY IF EXISTS barber_profiles_storage_owner_or_self_update ON storage.objects;
DROP POLICY IF EXISTS barber_profiles_storage_owner_or_self_delete ON storage.objects;

-- 1. Public Read
CREATE POLICY barber_profiles_storage_public_select
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'barber-profiles');

-- 2. Owner & Staff Insert
CREATE POLICY barber_profiles_storage_owner_or_self_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'barber-profiles'
    AND public.is_barber_owner_or_self(
      public.barber_profile_object_barber_id(name)
    )
  );

-- 3. Owner & Staff Update
CREATE POLICY barber_profiles_storage_owner_or_self_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'barber-profiles'
    AND public.is_barber_owner_or_self(
      public.barber_profile_object_barber_id(name)
    )
  )
  WITH CHECK (
    bucket_id = 'barber-profiles'
    AND public.is_barber_owner_or_self(
      public.barber_profile_object_barber_id(name)
    )
  );

-- 4. Owner & Staff Delete
CREATE POLICY barber_profiles_storage_owner_or_self_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'barber-profiles'
    AND public.is_barber_owner_or_self(
      public.barber_profile_object_barber_id(name)
    )
  );
