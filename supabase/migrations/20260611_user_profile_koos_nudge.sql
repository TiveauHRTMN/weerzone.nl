alter table public.user_profile
  add column if not exists koos_last_nudge_at timestamptz;

update public.user_profile as profile
set
  primary_lat = location.lat,
  primary_lon = location.lon,
  updated_at = now()
from public.user_locations as location
where location.user_id = profile.id
  and location.is_primary = true
  and (profile.primary_lat is null or profile.primary_lon is null);
