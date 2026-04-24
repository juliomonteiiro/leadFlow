/*
  # Auto-confirm new users

  1. Changes
    - Update `handle_new_user()` trigger to also auto-confirm the user's email
    - This prevents Supabase from sending confirmation emails, avoiding rate limits
    - Sets `email_confirmed_at` on the auth.users row right after creation

  2. Security
    - SECURITY DEFINER is required to modify auth.users table
    - This is safe because the function only runs on the AFTER INSERT trigger on auth.users
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Auto-confirm email so no confirmation email is sent
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;

  -- Create profile
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.email, ''));
  RETURN NEW;
END
$$ LANGUAGE plpgsql SECURITY DEFINER;
