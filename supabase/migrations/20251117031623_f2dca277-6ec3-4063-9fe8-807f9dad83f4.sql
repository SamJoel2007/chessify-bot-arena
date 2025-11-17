-- Add DELETE policy for chat messages so users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Add CHECK constraint for message length to prevent database bloat
ALTER TABLE public.chat_messages 
ADD CONSTRAINT message_length_limit CHECK (char_length(message) <= 2000);