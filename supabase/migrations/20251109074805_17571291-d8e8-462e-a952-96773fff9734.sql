-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true);

-- Create storage RLS policies for chat images
CREATE POLICY "Authenticated users can upload chat images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-images');

CREATE POLICY "Anyone can view chat images"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-images');

CREATE POLICY "Users can delete own chat images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Alter chat_messages table to add image and link support
ALTER TABLE chat_messages 
ADD COLUMN image_url TEXT,
ADD COLUMN link_url TEXT,
ADD COLUMN link_title TEXT,
ADD COLUMN link_description TEXT,
ADD COLUMN link_image TEXT;