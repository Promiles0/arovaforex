-- Make forecasts bucket private
UPDATE storage.buckets SET public = false WHERE id = 'forecasts';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can view forecast images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload forecast images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own forecast images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own forecast images" ON storage.objects;

-- Allow authenticated users to read all forecast images
CREATE POLICY "Authenticated users can view forecast images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'forecasts');

-- Allow authenticated users to upload forecast images
CREATE POLICY "Users can upload forecast images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'forecasts');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own forecast images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'forecasts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own forecast images
CREATE POLICY "Users can delete their own forecast images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'forecasts' AND auth.uid()::text = (storage.foldername(name))[1]);