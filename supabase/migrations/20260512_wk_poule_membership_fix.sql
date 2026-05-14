-- WK Poule membership/prediction policies
-- Fixes users being authenticated but not visible as poule participants.

alter table public.poule_group_members enable row level security;
alter table public.poule_predictions enable row level security;

drop policy if exists "Users can see members of own groups" on public.poule_group_members;
drop policy if exists "Users can join groups as themselves" on public.poule_group_members;
drop policy if exists "Users can leave own groups" on public.poule_group_members;

create policy "Users can see members of own groups" on public.poule_group_members
for select using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.poule_group_members own_membership
    where own_membership.group_id = poule_group_members.group_id
      and own_membership.user_id = auth.uid()
  )
);

create policy "Users can join groups as themselves" on public.poule_group_members
for insert with check (user_id = auth.uid());

create policy "Users can leave own groups" on public.poule_group_members
for delete using (user_id = auth.uid());

drop policy if exists "Users can see and manage own predictions" on public.poule_predictions;
drop policy if exists "Users can see own predictions" on public.poule_predictions;
drop policy if exists "Users can create own predictions" on public.poule_predictions;
drop policy if exists "Users can update own predictions" on public.poule_predictions;
drop policy if exists "Users can delete own predictions" on public.poule_predictions;

create policy "Users can see own predictions" on public.poule_predictions
for select using (user_id = auth.uid());

create policy "Users can create own predictions" on public.poule_predictions
for insert with check (user_id = auth.uid());

create policy "Users can update own predictions" on public.poule_predictions
for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users can delete own predictions" on public.poule_predictions
for delete using (user_id = auth.uid());
