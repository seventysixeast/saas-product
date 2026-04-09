-- Create subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  status text not null default 'inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- UNIQUE constraint so we can upsert on conflict
  unique(user_id)
);

-- Enable Row Level Security
alter table public.subscriptions enable row level security;

-- Policy: users can only read their own subscription
create policy "Users can view own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

-- Service role bypasses RLS automatically — no insert policy needed for webhook writes

-- Create indexes for fast lookups
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions (stripe_subscription_id);

-- Auto-update updated_at on row change
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.handle_updated_at();
