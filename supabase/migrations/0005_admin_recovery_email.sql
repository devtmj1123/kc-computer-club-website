-- Admin Auth accounts use the internal @admin.kcc.internal domain, which cannot
-- receive mail. Store a real mailbox so administrators can recover passwords
-- without another admin resetting them manually.
alter table public.profiles
  add column if not exists recovery_email text;

create unique index if not exists profiles_recovery_email_lower_uniq
  on public.profiles (lower(recovery_email))
  where recovery_email is not null;

comment on column public.profiles.recovery_email is
  'Real mailbox used for administrator password recovery. Never the internal @admin.kcc.internal address.';
