-- Backfill: de user_profile-mirror liep achter op auth.users. Op 2026-06-20
-- stonden er 12 accounts in auth.users maar slechts 3 in user_profile — o.a. de
-- founder (rwnhrtmn@gmail.com) en admin@weerzone.nl ontbraken. Daardoor faalde de
-- login-gate (checkUserExists las deze tabel) én zag de proactieve/agent-laag die
-- gebruikers niet. De code valt nu terug op auth.users, maar de mirror hoort
-- compleet te zijn.
--
-- Draai dit in de Supabase SQL editor (production). Idempotent.

-- 1. Spiegel elke auth-user die nog geen profielrij heeft.
insert into public.user_profile (id, email)
select id, lower(email)
from auth.users
on conflict (id) do nothing;

-- 2. Herbevestig de trigger zodat nieuwe signups voortaan altijd gespiegeld
--    worden (her-apply is veilig; create or replace + drop/create trigger).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  chosen text := new.raw_user_meta_data ->> 'chosen_tier';
  trial_end_at timestamptz := '2026-06-01 00:00:00+02';
  price_cents int;
begin
  insert into public.user_profile (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do nothing;

  if chosen in ('piet', 'reed', 'steve') then
    price_cents := case chosen
      when 'piet' then 299
      when 'reed' then 499
      when 'steve' then 1499
    end;

    insert into public.subscriptions
      (user_id, tier, status, is_founder, trial_end, founder_price_cents)
    values
      (new.id, chosen, 'trialing', true, trial_end_at, price_cents)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Verifieer: deze twee getallen horen gelijk te zijn.
-- select (select count(*) from auth.users) as auth_users,
--        (select count(*) from public.user_profile) as profiles;
