-- Fix infinite recursion in profiles policy and ensure profiles are auto-created on signup

-- 1) Helper to read role from JWT to avoid recursive self-referencing in policies
create or replace function public.current_user_role()
returns user_role
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role')::user_role,
    'dealer'::user_role
  );
$$;

-- 2) Recreate the problematic policy using the helper instead of subquerying profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles
  for select
  using (public.current_user_role() = 'admin');

-- Keep existing policies that are safe (self-based checks)
--   "Users can update their own profile" (USING auth.uid() = id)
--   "Users can view their own profile" (USING auth.uid() = id)

-- 3) Ensure profiles are automatically created on user signup
--    The function public.handle_new_user() already exists; add the trigger if missing
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();