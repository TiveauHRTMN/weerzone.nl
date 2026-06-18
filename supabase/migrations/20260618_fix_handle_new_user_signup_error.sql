-- Fix: "Database error creating new user" op /app/signup.
--
-- Root cause (gereproduceerd lokaal): in 20260420_fix_chosen_tier.sql wordt
-- de PL/pgSQL-variabele `chosen` (type text) direct geinsert in
-- subscriptions.tier, een kolom van het enum-type subscription_tier. Zonder
-- expliciete cast gooit Postgres:
--   ERROR: column "tier" is of type subscription_tier but expression is of
--   type text
-- Dat gebeurt bij ELKE signup waar een persona-tier gekozen is (bv. via
-- /app/signup?tier=piet vanaf de /piet-pagina). De trigger draait op
-- auth.users (after insert), dus een onafgevangen error daar laat Supabase
-- Auth de hele user-insert terugdraaien — en dat toont de generieke melding
-- "Database error creating new user" in de UI.
--
-- 20260423_welcome_series.sql verving handle_new_user() daarna nog een keer
-- en deed er twee dingen bovenop mis:
--   1. Het negeerde chosen_tier weer (regressie van 20260420_fix_chosen_tier.sql)
--      en gaf élke nieuwe gebruiker een 'piet' trial, ook zonder gekozen tier
--      — actions.ts registerUser() verwacht expliciet dat de trigger zonder
--      chosen_tier GEEN subscription aanmaakt (zie comment bij regel 513).
--   2. De user_preferences-insert en de Hermes/pg_net-webhook stonden niet
--      allemaal in een eigen exception-handler, dus een falende side-effect
--      (bv. pg_net/vault niet enabled) kan de signup opnieuw blokkeren.
--
-- Deze migratie cast chosen_tier expliciet naar het enum-type EN maakt elke
-- side-effect onafhankelijk: profiel/subscription/preferences/webhook falen
-- nooit meer de signup zelf.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  chosen text := new.raw_user_meta_data ->> 'chosen_tier';
  trial_end_at timestamptz := '2026-06-01 00:00:00+02';
  price_cents int;
  hermes_url text;
begin
  -- 1. user_profile — altijd aanmaken, mag de signup nooit blokkeren.
  begin
    insert into public.user_profile (id, email)
    values (new.id, new.email)
    on conflict (id) do nothing;
  exception when others then
    raise warning 'handle_new_user: user_profile insert failed for %: %', new.id, sqlerrm;
  end;

  -- 2. subscription — alleen als er een geldige persona gekozen is.
  begin
    if chosen in ('piet', 'reed', 'steve') then
      price_cents := case chosen
        when 'piet' then 299
        when 'reed' then 499
        when 'steve' then 1499
      end;

      insert into public.subscriptions
        (user_id, tier, status, is_founder, trial_end, founder_price_cents)
      values
        (new.id, chosen::public.subscription_tier, 'trialing', true, trial_end_at, price_cents)
      on conflict do nothing;
    end if;
  exception when others then
    raise warning 'handle_new_user: subscription insert failed for %: %', new.id, sqlerrm;
  end;

  -- 3. marketing consent default.
  begin
    insert into public.user_preferences (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  exception when others then
    raise warning 'handle_new_user: user_preferences insert failed for %: %', new.id, sqlerrm;
  end;

  -- 4. Optioneel: Hermes-webhook (pg_net/vault) — best-effort, nooit fataal.
  begin
    select decrypted_secret into hermes_url
      from vault.decrypted_secrets
      where name = 'hermes_welcome_webhook'
      limit 1;

    if hermes_url is not null then
      perform net.http_post(
        url     := hermes_url,
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body    := jsonb_build_object(
          'event',   'new_signup',
          'user_id', new.id,
          'email',   new.email,
          'created_at', new.created_at
        )
      );
    end if;
  exception when others then
    raise warning 'handle_new_user: hermes webhook failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

-- Trigger is al gebonden aan auth.users via eerdere migratie; geen re-bind nodig.
