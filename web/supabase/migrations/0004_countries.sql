-- Countries: every citizen-facing row belongs to one country. Existing rows are Thai.
alter table public.shelters  add column if not exists country text not null default 'TH' check (country in ('TH','MM','SE'));
alter table public.disasters add column if not exists country text not null default 'TH' check (country in ('TH','MM','SE'));
alter table public.alerts    add column if not exists country text not null default 'TH' check (country in ('TH','MM','SE'));
create index if not exists shelters_country_idx  on public.shelters (country);
create index if not exists disasters_country_idx on public.disasters (country);
create index if not exists alerts_country_idx    on public.alerts (country);
