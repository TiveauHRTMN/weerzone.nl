-- WK Poule invite/membership flow hardening
-- A prediction belongs to exactly one poule group, and only group members may predict.

alter table public.poule_predictions
  add column if not exists group_id uuid references public.poule_groups(id) on delete cascade;

update public.poule_predictions prediction
set group_id = membership.group_id
from (
  select distinct on (user_id) user_id, group_id
  from public.poule_group_members
  order by user_id, joined_at asc
) membership
where prediction.group_id is null
  and prediction.user_id = membership.user_id;

delete from public.poule_predictions
where group_id is null;

alter table public.poule_predictions
  alter column group_id set not null;

alter table public.poule_predictions
  drop constraint if exists poule_predictions_user_id_match_id_key;

alter table public.poule_predictions
  add constraint poule_predictions_group_user_match_key unique (group_id, user_id, match_id);

create index if not exists poule_predictions_group_user_idx
  on public.poule_predictions (group_id, user_id);

drop policy if exists "Users can see own predictions" on public.poule_predictions;
drop policy if exists "Users can create own predictions" on public.poule_predictions;
drop policy if exists "Users can update own predictions" on public.poule_predictions;
drop policy if exists "Users can delete own predictions" on public.poule_predictions;
drop policy if exists "Users can see and manage own predictions" on public.poule_predictions;
drop policy if exists "Users can see own group predictions" on public.poule_predictions;
drop policy if exists "Users can create own group predictions" on public.poule_predictions;
drop policy if exists "Users can update own group predictions" on public.poule_predictions;
drop policy if exists "Users can delete own group predictions" on public.poule_predictions;

create policy "Users can see own group predictions" on public.poule_predictions
for select using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.poule_group_members membership
    where membership.group_id = poule_predictions.group_id
      and membership.user_id = auth.uid()
  )
);

create policy "Users can create own group predictions" on public.poule_predictions
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.poule_group_members membership
    where membership.group_id = poule_predictions.group_id
      and membership.user_id = auth.uid()
  )
);

create policy "Users can update own group predictions" on public.poule_predictions
for update using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.poule_group_members membership
    where membership.group_id = poule_predictions.group_id
      and membership.user_id = auth.uid()
  )
) with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.poule_group_members membership
    where membership.group_id = poule_predictions.group_id
      and membership.user_id = auth.uid()
  )
);

create policy "Users can delete own group predictions" on public.poule_predictions
for delete using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.poule_group_members membership
    where membership.group_id = poule_predictions.group_id
      and membership.user_id = auth.uid()
  )
);
