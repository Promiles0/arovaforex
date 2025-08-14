-- Add foreign key constraint between contact_messages and profiles
ALTER TABLE contact_messages 
ADD CONSTRAINT contact_messages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;