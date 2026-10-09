-- Ported from MySQL triggers (spec §4.3). Applied after the data copy.

create function public.relief_supplies_status() returns trigger language plpgsql as $$
declare available numeric(10,2);
begin
  available := coalesce(new.total_quantity, 0) - coalesce(new.allocated_quantity, 0);
  if new.expiry_date is not null and new.expiry_date < current_date then new.status := 'Expired';
  elsif available <= 0 then new.status := 'Out of Stock';
  elsif available <= coalesce(new.minimum_threshold, 0) then new.status := 'Low Stock';
  else new.status := 'Available';
  end if;
  return new;
end $$;
create trigger update_supply_status_insert before insert on public.relief_supplies for each row execute function public.relief_supplies_status();
create trigger update_supply_status_update before update on public.relief_supplies for each row execute function public.relief_supplies_status();

create function public.shelters_status_insert() returns trigger language plpgsql as $$
declare pct numeric(5,2);
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
create trigger update_shelter_status_insert before insert on public.shelters for each row execute function public.shelters_status_insert();

create function public.shelters_status_update() returns trigger language plpgsql as $$
declare pct numeric(5,2);
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
create trigger update_shelter_status_update before update on public.shelters for each row execute function public.shelters_status_update();

create function public.volunteer_assignment_insert() returns trigger language plpgsql as $$
begin
  if new.status = 'Active' then
    update public.volunteers set availability_status = 'Deployed' where volunteer_id = new.volunteer_id;
  end if;
  return null;
end $$;
create trigger update_volunteer_on_assignment_insert after insert on public.volunteer_assignments for each row execute function public.volunteer_assignment_insert();

create function public.volunteer_assignment_update() returns trigger language plpgsql as $$
begin
  if old.status = 'Active' and new.status in ('Completed', 'Cancelled') then
    if not exists (select 1 from public.volunteer_assignments
                   where volunteer_id = new.volunteer_id and status = 'Active' and assignment_id <> new.assignment_id) then
      update public.volunteers set availability_status = 'Available' where volunteer_id = new.volunteer_id;
    end if;
  end if;
  if old.status <> 'Active' and new.status = 'Active' then
    update public.volunteers set availability_status = 'Deployed' where volunteer_id = new.volunteer_id;
  end if;
  return null;
end $$;
create trigger update_volunteer_on_assignment_update after update on public.volunteer_assignments for each row execute function public.volunteer_assignment_update();

create function public.volunteer_hours_on_completion() returns trigger language plpgsql as $$
begin
  if old.status <> 'Completed' and new.status = 'Completed' and new.hours_worked > 0 then
    update public.volunteers set total_hours_contributed = total_hours_contributed + new.hours_worked where volunteer_id = new.volunteer_id;
  end if;
  if old.status = 'Completed' and new.status = 'Completed' and old.hours_worked <> new.hours_worked then
    update public.volunteers set total_hours_contributed = total_hours_contributed - old.hours_worked + new.hours_worked where volunteer_id = new.volunteer_id;
  end if;
  return null;
end $$;
create trigger update_volunteer_hours_on_completion after update on public.volunteer_assignments for each row execute function public.volunteer_hours_on_completion();

create function public.volunteer_hours_on_delete() returns trigger language plpgsql as $$
begin
  if old.status = 'Completed' and old.hours_worked > 0 then
    update public.volunteers set total_hours_contributed = greatest(0, total_hours_contributed - old.hours_worked) where volunteer_id = old.volunteer_id;
  end if;
  if old.status = 'Active' and not exists (select 1 from public.volunteer_assignments where volunteer_id = old.volunteer_id and status = 'Active') then
    update public.volunteers set availability_status = 'Available' where volunteer_id = old.volunteer_id;
  end if;
  return null;
end $$;
create trigger update_volunteer_hours_on_delete after delete on public.volunteer_assignments for each row execute function public.volunteer_hours_on_delete();

create function public.agency_resources_on_activation() returns trigger language plpgsql as $$
begin
  if new.status = 'Deployed' and old.status <> 'Deployed' then
    update public.agencies set status = 'Active' where agency_id = new.agency_id;
  end if;
  if new.status in ('Completed', 'Cancelled') and old.status in ('Deployed', 'Confirmed')
     and not exists (select 1 from public.agency_activations where agency_id = new.agency_id
                     and activation_id <> new.activation_id and status in ('Requested', 'Confirmed', 'Deployed')) then
    update public.agencies set status = 'Active' where agency_id = new.agency_id;
  end if;
  return null;
end $$;
create trigger update_resources_on_activation after update on public.agency_activations for each row execute function public.agency_resources_on_activation();

create function public.track_resource_deployment() returns trigger language plpgsql as $$
declare total_available int; total_deployed int;
begin
  select count(*) filter (where availability_status = 'Available'), count(*) filter (where availability_status = 'Deployed')
    into total_available, total_deployed from public.agency_resources where agency_id = new.agency_id;
  if (total_available = 0 and total_deployed > 0) or total_available > 0 then
    update public.agencies set status = 'Active' where agency_id = new.agency_id;
  end if;
  return null;
end $$;
create trigger track_resource_deployment after update on public.agency_resources for each row execute function public.track_resource_deployment();

create function public.validate_activation_request() returns trigger language plpgsql as $$
declare agency_status text;
begin
  select status into agency_status from public.agencies where agency_id = new.agency_id;
  if agency_status <> 'Active' then
    raise exception 'Cannot activate agency: Agency is not in Active status' using errcode = 'P0001';
  end if;
  if new.requested_at is null then new.requested_at := now(); end if;
  return new;
end $$;
create trigger validate_activation_request before insert on public.agency_activations for each row execute function public.validate_activation_request();

create function public.set_activation_timestamp() returns trigger language plpgsql as $$
begin
  if new.status = 'Deployed' and old.status <> 'Deployed' and new.activated_at is null then
    new.activated_at := now();
  end if;
  return new;
end $$;
create trigger set_activation_timestamp before update on public.agency_activations for each row execute function public.set_activation_timestamp();
