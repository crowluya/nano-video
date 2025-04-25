CREATE TABLE public.users (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL,
    email text UNIQUE NOT NULL,
    full_name text NULL,
    avatar_url text NULL,
    billing_address jsonb NULL,
    payment_provider text NULL,
    stripe_customer_id text UNIQUE NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    invite_code text UNIQUE NULL,
    inviter_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT check_not_self_inviter CHECK (id <> inviter_user_id)
);

COMMENT ON TABLE public.users IS 'Stores application-specific user profile data, extending the auth.users table.';
COMMENT ON COLUMN public.users.id IS 'Primary key, references auth.users.id.';
COMMENT ON COLUMN public.users.email IS 'User email, kept in sync with auth.users. Must be unique.';
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Unique identifier for the user in Stripe.';
COMMENT ON COLUMN public.users.invite_code IS 'User-defined unique code for inviting others. Case-sensitive. Nullable until set by user.';
COMMENT ON COLUMN public.users.inviter_user_id IS 'The ID of the user (from this table) who invited the current user. Null if not invited.';

CREATE INDEX users_inviter_user_id_idx ON public.users (inviter_user_id);
CREATE INDEX users_stripe_customer_id_idx ON public.users (stripe_customer_id);
CREATE INDEX users_email_idx ON public.users (email);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_users_update
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- =============================================
-- Create RLS Policies!
-- =============================================
-- Allow users to read their own profile
CREATE POLICY "Allow user read their own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Allow user to update their own profile
  -- Only allows updating specific fields: full_name, avatar_url, billing_address, invite_code
  -- Add more fields as needed.
  -- See example usage in /api/user/settings/route.ts -> supabase.rpc('update_my_profile', ...)
CREATE OR REPLACE FUNCTION update_my_profile(
    new_full_name TEXT,
    new_avatar_url TEXT,
    new_billing_address JSONB,
    new_invite_code TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET
    full_name = new_full_name,
    avatar_url = new_avatar_url,
    invite_code = new_invite_code
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION update_my_profile(TEXT, TEXT, JSONB, TEXT) TO authenticated;

-- =============================================
-- Create Trigger for Profile Creation!
-- =============================================
-- 1. Create the function that will be called by the trigger
--    This function inserts a new row into public.users when a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public -- Important for security and accessing public.users
as $$
begin
  -- Insert a new row into public.users
  -- Copies the id and email from the newly created auth.users record
  -- Sets the initial updated_at timestamp
  insert into public.users (id, email, updated_at)
  values (new.id, new.email, now());
  return new; -- The result is ignored on AFTER triggers, but it's good practice
end;
$$;

-- 2. Create the trigger that calls the function
--    This trigger fires automatically AFTER a new user is inserted into auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- =============================================