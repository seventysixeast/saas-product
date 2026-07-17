# Database Schema & RLS Security

The database layer for this SaaS product is powered by Supabase (PostgreSQL). We maintain a minimal, secure schema to represent user subscription statuses synced from Stripe.

---

## 1. Schema Diagram & Relationships

Our application interacts with two schemas:
- `auth`: Managed by Supabase Authentication.
- `public`: Used for application-specific data.

```
       +----------------------------+
       |       auth.users           |
       +----------------------------+
       | id (uuid, PK)              |
       | email (varchar)            |
       +----------------------------+
                     |
                     | 1 (cascade delete)
                     |
                     v 1 (unique constraint)
       +----------------------------+
       |    public.subscriptions    |
       +----------------------------+
       | id (uuid, PK)              |
       | user_id (uuid, FK, Unique) | <--- references auth.users(id)
       | stripe_customer_id (text)   |
       | stripe_subscription_id (text)|
       | stripe_price_id (text)     |
       | status (text)              |
       | created_at (timestamptz)   |
       | updated_at (timestamptz)   |
       +----------------------------+
```

---

## 2. Table Definition: `public.subscriptions`

Stores subscription state details synchronized from Stripe webhooks.

| Column | Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | `gen_random_uuid()` | Unique identifier for the database row. |
| `user_id` | `uuid` | Foreign Key, Unique, Not Null | - | References `auth.users(id)` with `on delete cascade`. Ensures one subscription row per user. |
| `stripe_customer_id` | `text` | - | - | Stripe customer reference (e.g. `cus_...`). |
| `stripe_subscription_id` | `text` | - | - | Stripe subscription reference (e.g. `sub_...`). |
| `stripe_price_id` | `text` | - | - | Stripe pricing identifier (e.g. `price_...`). |
| `status` | `text` | Not Null | `'inactive'` | Current state of the subscription (e.g. `active`, `trialing`, `past_due`, `canceled`). |
| `created_at` | `timestamptz` | Not Null | `now()` | Timestamp of record creation. |
| `updated_at` | `timestamptz` | Not Null | `now()` | Timestamp of the last local update. |

---

## 3. Database Indexes

To optimize lookups when queries filter by Stripe identifiers during webhook execution, the following indexes are defined:

```sql
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_id_idx on public.subscriptions (stripe_subscription_id);
```

These ensure $O(1)$ to $O(\log n)$ query time when Stripe events update subscription states.

---

## 4. Row Level Security (RLS) Policies

By default, RLS is enabled on the `public.subscriptions` table:
```sql
alter table public.subscriptions enable row level security;
```

### Policy: Read Access
Users are only allowed to see their own subscription details.
- **Name**: `Users can view own subscription`
- **Action**: `SELECT`
- **Definition**: `auth.uid() = user_id`

### Write Access (Inserts/Updates/Deletes)
- **Application Logic**: No public RLS write policies exist.
- **Service Role Bypass**: The Next.js API webhook uses the Supabase Service Role client (`createServiceClient()`). The Service Role key bypasses Row Level Security rules, allowing the backend to upsert user subscriptions upon stripe payment completion securely.

---

## 5. Database Triggers & Functions

A trigger is configured to keep `updated_at` timestamps accurate without manual API input:

### Function: `public.handle_updated_at()`
```sql
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

### Trigger: `subscriptions_updated_at`
```sql
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.handle_updated_at();
```
Whenever a row is updated in the subscriptions table, PostgreSQL automatically sets `updated_at` to the current database time.
