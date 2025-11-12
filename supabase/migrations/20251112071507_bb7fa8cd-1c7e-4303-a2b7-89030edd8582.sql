-- Create storage bucket for contact attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contact-attachments',
  'contact-attachments',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Add attachment_urls column to contact_messages
ALTER TABLE public.contact_messages
ADD COLUMN attachment_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Storage policies for contact attachments
CREATE POLICY "Users can upload their own contact attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contact-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own contact attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contact-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all contact attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contact-attachments' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete contact attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contact-attachments' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);