-- Fixes from the final branch review.

-- 1. numeric(5,2) overflowed above 999.99% occupancy, so an overfull update raised an error
--    instead of reaching the clamp below it. Plain numeric has no such limit.
create or replace function public.shelters_status_insert() returns trigger language plpgsql as $$
declare pct numeric;
begin
  pct := case when new.capacity > 0 then (new.current_occupancy::numeric / new.capacity) * 100 else 0 end;
  if new.status not in ('Closed', 'Under Maintenance') then
    new.status := case when pct >= 100 then 'Full' else 'Available' end;
  end if;
  if new.current_occupancy > new.capacity then new.current_occupancy := new.capacity; end if;
  if new.current_occupancy < 0 then new.current_occupancy := 0; end if;
  if new.capacity < 0 then new.capacity := 0; end if;
  return new;
end $$;

create or replace function public.shelters_status_update() returns trigger language plpgsql as $$
declare pct numeric;
begin
  pct := case when new.capacity > 0 then (new.current_occupancy::numeric / new.capacity) * 100 else 0 end;
  if new.status not in ('Closed', 'Under Maintenance') then
    new.status := case when pct >= 100 then 'Full' else 'Available' end;
  end if;
  if new.current_occupancy > new.capacity then
    new.current_occupancy := new.capacity;
    new.status := 'Full';
  end if;
  if new.current_occupancy < 0 then new.current_occupancy := 0; end if;
  if new.capacity < 0 then new.capacity := 0; end if;
  if old.status = 'Full' and new.capacity > old.capacity and new.current_occupancy < new.capacity then
    new.status := 'Available';
  end if;
  return new;
end $$;

-- 2. Rate limit check-and-reserve as one atomic step. The per-hash advisory lock makes concurrent
--    requests from the same IP queue up, so count-then-insert can't be raced. Returns true if a slot
--    was reserved.
create function public.reserve_report_slot(p_hash text, p_max int, p_window_minutes int)
returns boolean language plpgsql as $$
declare n int;
begin
  perform pg_advisory_xact_lock(hashtext(p_hash));
  delete from public.report_rate_limits where created_at < now() - interval '1 day';
  select count(*) into n from public.report_rate_limits
   where ip_hash = p_hash and created_at > now() - make_interval(mins => p_window_minutes);
  if n >= p_max then return false; end if;
  insert into public.report_rate_limits (ip_hash) values (p_hash);
  return true;
end $$;

-- Functions are executable by PUBLIC by default; only our server (postgres role) may call this one.
revoke execute on function public.reserve_report_slot(text, int, int) from public, anon, authenticated;
