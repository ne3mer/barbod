-- Portfolio storage bucket and policies.
-- Object path convention: businesses/{business_id}/portfolio/{filename}

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio',
  'portfolio',
  true,
  10485760, -- 10 MiB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Extract business_id from object path: businesses/<uuid>/portfolio/<file>
CREATE OR REPLACE FUNCTION public.portfolio_object_business_id(object_name text)
RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  parts text[];
  business_id uuid;
BEGIN
  parts := string_to_array(object_name, '/');

  IF array_length(parts, 1) < 4 THEN
    RETURN NULL;
  END IF;

  IF parts[1] IS DISTINCT FROM 'businesses' THEN
    RETURN NULL;
  END IF;

  IF parts[3] IS DISTINCT FROM 'portfolio' THEN
    RETURN NULL;
  END IF;

  BEGIN
    business_id := parts[2]::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN NULL;
  END;

  RETURN business_id;
END;
$$;

COMMENT ON FUNCTION public.portfolio_object_business_id(text) IS
  'Parses business UUID from portfolio storage path businesses/{id}/portfolio/{file}.';

REVOKE ALL ON FUNCTION public.portfolio_object_business_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.portfolio_object_business_id(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.portfolio_object_business_id(text) TO anon;

-- Public read (bucket is also marked public for CDN/public URL access).
CREATE POLICY portfolio_storage_public_select
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'portfolio');

-- Owners may upload only under their business folder.
CREATE POLICY portfolio_storage_owner_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'portfolio'
    AND public.is_business_owner(
      public.portfolio_object_business_id(name)
    )
  );

CREATE POLICY portfolio_storage_owner_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND public.is_business_owner(
      public.portfolio_object_business_id(name)
    )
  )
  WITH CHECK (
    bucket_id = 'portfolio'
    AND public.is_business_owner(
      public.portfolio_object_business_id(name)
    )
  );

CREATE POLICY portfolio_storage_owner_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'portfolio'
    AND public.is_business_owner(
      public.portfolio_object_business_id(name)
    )
  );
