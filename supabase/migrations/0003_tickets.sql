-- Paid tickets through Stripe Checkout.
-- Members can read their own orders and tickets but never create or change them:
-- only the server functions (using the service role) write here, after checking
-- prices and limits and after Stripe confirms payment.

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  tier_id text not null,
  tier_name text not null,
  quantity int not null check (quantity between 1 and 4),
  unit_price_cents int not null check (unit_price_cents >= 0),
  fee_cents int not null check (fee_cents >= 0),
  total_cents int not null check (total_cents >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'refunded')),
  stripe_session_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index orders_user_event_idx on public.orders (user_id, event_id);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  owner uuid not null references public.profiles (id) on delete cascade,
  holder_name text not null,
  tier_name text not null,
  price_cents int not null,
  -- Seeds the rotating entry code. Readable only by the ticket's owner.
  code_secret text not null default gen_random_uuid()::text,
  status text not null default 'valid' check (status in ('valid', 'used', 'refunded')),
  created_at timestamptz not null default now()
);
create index tickets_owner_idx on public.tickets (owner, event_id);

alter table public.orders enable row level security;
alter table public.tickets enable row level security;

create policy "see your own orders" on public.orders for select to authenticated using (user_id = auth.uid());
create policy "see your own tickets" on public.tickets for select to authenticated using (owner = auth.uid());
-- No insert, update or delete policies: only the server functions can write.

-- How many tickets someone holds or is about to pay for, for the 4-per-person limit.
-- Pending orders count for 30 minutes so nobody can open several checkouts at once.
create function public.tickets_committed(for_user uuid, for_event uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(quantity), 0)::int from public.orders
  where user_id = for_user and event_id = for_event
    and (status = 'paid' or (status = 'pending' and created_at > now() - interval '30 minutes'));
$$;
revoke execute on function public.tickets_committed(uuid, uuid) from public, anon, authenticated;

-- The limit holds even if two checkouts start at the same moment:
-- orders for one person and event are checked one at a time.
create function public.enforce_ticket_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.user_id::text || new.event_id::text));
  if public.tickets_committed(new.user_id, new.event_id) + new.quantity > 4 then
    raise exception 'Ticket limit reached: 4 per person for this event';
  end if;
  return new;
end;
$$;

create trigger orders_ticket_limit before insert on public.orders
  for each row execute function public.enforce_ticket_limit();
