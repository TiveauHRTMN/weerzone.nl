-- Agent-voorkeuren op het account: Piet/Reed/Koos als losse toggles. Piet staat
-- default aan (iedereen wil het dagbeeld), Reed/Koos zijn opt-in. Kolommen i.p.v.
-- user_metadata zodat de proactieve e-mail-cron erop kan filteren (.eq("piet_on", true)).
-- Toggles bepalen alleen de proactieve e-mail; on-site /vandaag toont altijd alles.
alter table public.user_profile
  add column if not exists piet_on boolean not null default true,
  add column if not exists reed_on boolean not null default false,
  add column if not exists koos_on boolean not null default false;
