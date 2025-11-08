-- Create table to store OTP codes temporarily
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert verification codes (for signup)
CREATE POLICY "Anyone can create verification codes"
ON public.email_verifications
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read their own verification codes
CREATE POLICY "Anyone can read verification codes by email"
ON public.email_verifications
FOR SELECT
USING (true);

-- Allow anyone to update their own verification codes
CREATE POLICY "Anyone can update verification codes"
ON public.email_verifications
FOR UPDATE
USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON public.email_verifications(expires_at);

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.email_verifications
  WHERE expires_at < now();
END;
$$;