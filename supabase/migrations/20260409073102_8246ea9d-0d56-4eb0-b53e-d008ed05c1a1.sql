-- Remove the public-role SELECT policy that contradicts private bucket setting
DROP POLICY IF EXISTS "Users can view forecast images" ON storage.objects;